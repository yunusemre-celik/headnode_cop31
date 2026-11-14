"""Tests for admin-managed safezones and risk-aware evacuation routing."""

from __future__ import annotations

from datetime import datetime, timezone

from fastapi.testclient import TestClient

from backend.db import Database


def test_safezone_db_persistence(test_db: Database) -> None:
    assert test_db.get_active_safezone_ids() == set()

    test_db.set_safezone_active("muratpasa_meltem", True)
    test_db.set_safezone_active("muratpasa_kaleici", True)
    assert test_db.get_active_safezone_ids() == {"muratpasa_meltem", "muratpasa_kaleici"}

    test_db.set_safezone_active("muratpasa_meltem", False)
    assert test_db.get_active_safezone_ids() == {"muratpasa_kaleici"}


def test_routing_graph_loads_and_avoids_hazards() -> None:
    from backend.models import DisasterType, EventRecord
    from backend.routing import compute_safe_route, load_antalya_graph

    nodes, adj = load_antalya_graph()
    assert len(nodes) == 24
    edge_count = sum(len(neighbors) for neighbors in adj.values())
    assert edge_count == 92

    kuskavagi = nodes["konyaalti_kuskavagi"]
    altinkum = nodes["konyaalti_altinkum"]

    # No active safezones -> None
    assert (
        compute_safe_route(
            user_lat=kuskavagi.lat,
            user_lng=kuskavagi.lng,
            active_safezone_ids=set(),
            events=[],
        )
        is None
    )

    # Direct path without hazards: kuskavagi -> altinkum
    direct = compute_safe_route(
        user_lat=kuskavagi.lat,
        user_lng=kuskavagi.lng,
        active_safezone_ids={"konyaalti_altinkum"},
        events=[],
    )
    assert direct is not None
    assert direct.status == "safe"
    assert direct.avoided_all_hazards is True
    assert [s.node_id for s in direct.steps] == [
        "konyaalti_kuskavagi",
        "konyaalti_altinkum",
    ]

    # Place hazard on konyaalti_arapsuyu when routing from liman to meltem -> must avoid arapsuyu
    now = datetime(2026, 11, 14, 12, 0, 0, tzinfo=timezone.utc)
    liman = nodes["konyaalti_liman"]
    arapsuyu = nodes["konyaalti_arapsuyu"]
    blocking_event = EventRecord(
        id="ev-block",
        disaster_type=DisasterType.WILDFIRE,
        origin_lat=arapsuyu.lat,
        origin_lng=arapsuyu.lng,
        spatial_rule_version="v1",
        active_report_ids=["r1"],
        active_report_count=1,
        created_at=now,
        updated_at=now,
    )
    detour = compute_safe_route(
        user_lat=liman.lat,
        user_lng=liman.lng,
        active_safezone_ids={"muratpasa_meltem"},
        events=[blocking_event],
    )
    assert detour is not None
    assert detour.status == "safe"
    assert detour.avoided_all_hazards is True
    step_ids = [s.node_id for s in detour.steps]
    assert "konyaalti_arapsuyu" not in step_ids
    assert step_ids[-1] == "muratpasa_meltem"

    # Hazard directly on the only safezone -> fallback_risky
    target_hazard = EventRecord(
        id="ev-target",
        disaster_type=DisasterType.FLOOD,
        origin_lat=altinkum.lat,
        origin_lng=altinkum.lng,
        spatial_rule_version="v1",
        active_report_ids=["r2"],
        active_report_count=1,
        created_at=now,
        updated_at=now,
    )
    fallback = compute_safe_route(
        user_lat=kuskavagi.lat,
        user_lng=kuskavagi.lng,
        active_safezone_ids={"konyaalti_altinkum"},
        events=[target_hazard],
    )
    assert fallback is not None
    assert fallback.status == "fallback_risky"
    assert fallback.avoided_all_hazards is False


def test_safezone_api_endpoints_and_map_routing(client: TestClient) -> None:
    res = client.get("/api/safezones")
    assert res.status_code == 200
    nodes = res.json()["nodes"]
    assert len(nodes) == 24
    assert all(n["is_active"] is False for n in nodes)

    # Unknown node returns 404
    not_found = client.post("/api/safezones/nonexistent_node/toggle")
    assert not_found.status_code == 404

    # Toggle muratpasa_meltem ON
    toggle_on = client.post("/api/safezones/muratpasa_meltem/toggle")
    assert toggle_on.status_code == 200
    assert toggle_on.json()["is_active"] is True

    # Submit a hazard report at konyaalti_arapsuyu (36.879, 30.648)
    rep = client.post(
        "/api/reports",
        json={
            "disaster_type": "wildfire",
            "report_mode": "emergency",
            "latitude": 36.879,
            "longitude": 30.648,
            "location_source": "manual",
            "client_request_id": "11111111-1111-4111-8111-111111111199",
        },
    )
    assert rep.status_code == 200

    # Query /api/map from konyaalti_liman (36.852, 30.608)
    map_res = client.get("/api/map", params={"lat": 36.852, "lng": 30.608})
    assert map_res.status_code == 200
    body = map_res.json()
    assert len(body["safezones"]) == 1
    assert body["safezones"][0]["node_id"] == "muratpasa_meltem"
    assert body["safe_route"] is not None
    assert body["safe_route"]["status"] == "safe"
    assert body["safe_route"]["avoided_all_hazards"] is True
    step_ids = [s["node_id"] for s in body["safe_route"]["steps"]]
    assert "konyaalti_arapsuyu" not in step_ids
    assert step_ids[-1] == "muratpasa_meltem"

    # Demo authority response includes all 24 nodes with hazard & active flags
    auth_res = client.get("/api/demo-authority")
    assert auth_res.status_code == 200
    auth_nodes = {n["node_id"]: n for n in auth_res.json()["nodes"]}
    assert len(auth_nodes) == 24
    assert auth_nodes["muratpasa_meltem"]["is_active"] is True
    assert auth_nodes["konyaalti_arapsuyu"]["is_hazardous"] is True

    # Toggle muratpasa_meltem OFF explicitly
    toggle_off = client.post(
        "/api/safezones/muratpasa_meltem/toggle",
        json={"is_active": False},
    )
    assert toggle_off.status_code == 200
    assert toggle_off.json()["is_active"] is False


def test_routing_when_user_inside_hazard_circle() -> None:
    from backend.models import DisasterType, EventRecord
    from backend.routing import compute_safe_route, load_antalya_graph

    nodes, _ = load_antalya_graph()
    kuskavagi = nodes["konyaalti_kuskavagi"]
    now = datetime(2026, 11, 14, 12, 0, 0, tzinfo=timezone.utc)
    origin_hazard = EventRecord(
        id="ev-origin",
        disaster_type=DisasterType.EXTREME_HEAT,
        origin_lat=kuskavagi.lat,
        origin_lng=kuskavagi.lng,
        spatial_rule_version="v1",
        active_report_ids=["r-origin"],
        active_report_count=1,
        created_at=now,
        updated_at=now,
    )
    route = compute_safe_route(
        user_lat=kuskavagi.lat,
        user_lng=kuskavagi.lng,
        active_safezone_ids={"konyaalti_altinkum"},
        events=[origin_hazard],
    )
    assert route is not None
    assert route.status == "fallback_risky"
    assert route.avoided_all_hazards is False
    assert route.target_safezone.node_id == "konyaalti_altinkum"


def test_model_info_and_health_metadata(client: TestClient) -> None:
    health = client.get("/api/health")
    assert health.status_code == 200
    health_body = health.json()
    assert "ml_metadata" in health_body
    meta = health_body["ml_metadata"]
    assert meta["feature_count"] == 11
    assert meta["dataset"]["total_samples"] == 1052280

    info = client.get("/api/model-info")
    assert info.status_code == 200
    info_body = info.json()
    assert info_body["model_version"] == "rule-v1"
    assert info_body["validation_metrics"]["1h"]["r2"] == 0.9905
    assert info_body["validation_metrics"]["1h"]["rmse"] == 1.9351
    assert len(info_body["data_sources"]) >= 3
    assert len(info_body["limitations"]) >= 3
