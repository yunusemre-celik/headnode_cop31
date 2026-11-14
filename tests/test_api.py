"""API contract and decision model adapter tests for COP31 Heatnode."""

from __future__ import annotations

import json
from uuid import UUID, uuid4

from fastapi.testclient import TestClient
import pytest

from backend.decision_model import (
    DecisionModelInput,
    evaluate_decision_model,
)
from backend.models import DisasterType, MapQueryResponse

LAT = 36.8969
LNG = 30.7133


def test_health_endpoint(client: TestClient) -> None:
    resp = client.get("/api/health")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "ok"
    assert body["service"] == "cop31-heatnode"
    assert body["model_version"] == "rule-v1"


def test_session_issues_httponly_cookie_and_honors_header(client: TestClient) -> None:
    s1 = client.post("/api/session")
    assert s1.status_code == 200
    bid1 = s1.json()["browser_id"]
    UUID(bid1)  # valid UUID
    set_cookie = s1.headers.get("set-cookie", "")
    assert "heatnode_browser_id=" in set_cookie
    assert "httponly" in set_cookie.lower()

    # Subsequent call with cookie reuses the same browser_id
    s2 = client.post("/api/session")
    assert s2.status_code == 200
    assert s2.json()["browser_id"] == bid1

    # Explicit X-Browser-Id overrides
    custom_id = str(uuid4())
    s3 = client.post("/api/session", headers={"X-Browser-Id": custom_id})
    assert s3.status_code == 200
    assert s3.json()["browser_id"] == custom_id


def test_all_10_disaster_types_accepted(client: TestClient) -> None:
    expected = {
        "tornado",
        "wildfire",
        "sandstorm",
        "frost",
        "avalanche",
        "flood",
        "inundation",
        "landslide",
        "hail",
        "extreme_heat",
    }
    assert {d.value for d in DisasterType} == expected

    for code in expected:
        resp = client.post(
            "/api/reports",
            headers={"X-Browser-Id": str(uuid4())},
            json={
                "latitude": LAT,
                "longitude": LNG,
                "disaster_type": code,
                "report_mode": "normal",
                "location_source": "gps",
                "client_request_id": str(uuid4()),
            },
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "accepted"


def test_emergency_mode_adds_no_math_multiplier(client: TestClient) -> None:
    resp = client.post(
        "/api/reports",
        headers={"X-Browser-Id": str(uuid4())},
        json={
            "latitude": LAT,
            "longitude": LNG,
            "disaster_type": "flood",
            "report_mode": "emergency",
            "location_source": "gps",
            "client_request_id": str(uuid4()),
        },
    )
    assert resp.status_code == 200
    assert resp.json()["report"]["base_weight"] == pytest.approx(2.0)

    score = client.get(
        "/api/map",
        params={"lat": LAT, "lng": LNG, "disaster_type": "flood"},
    ).json()["query_score"]
    assert score["total_weight"] == pytest.approx(2.0)


def test_external_decision_model_url_falls_back_to_rule_v1(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("DECISION_MODEL_API_URL", "http://127.0.0.1:59999/nonexistent")
    out = evaluate_decision_model(
        DecisionModelInput(
            query_lat=LAT,
            query_lng=LNG,
            disaster_type=DisasterType.FLOOD,
        )
    )
    assert out.model_version == "rule-v1"
    assert out.query_score.uncertain is True


def test_map_without_disaster_type_enriches_events_with_ml_risk(client: TestClient) -> None:
    for dtype in ("flood", "wildfire"):
        resp = client.post(
            "/api/reports",
            headers={"X-Browser-Id": str(uuid4())},
            json={
                "latitude": LAT,
                "longitude": LNG,
                "disaster_type": dtype,
                "report_mode": "normal",
                "location_source": "gps",
                "client_request_id": str(uuid4()),
            },
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "accepted"

    map_resp = client.get("/api/map", params={"lat": LAT, "lng": LNG})
    assert map_resp.status_code == 200
    body = map_resp.json()
    assert len(body["events"]) == 2
    assert len(body["active_reports"]) == 2
    for ev in body["events"]:
        assert 0.0 <= ev["risk_1h"] <= 100.0
        assert 0.0 <= ev["risk_2h"] <= 100.0
        assert 0.0 <= ev["risk_3h"] <= 100.0
        assert isinstance(ev["ml_active"], bool)


def test_demo_authority_enriched_with_ml_fields(client: TestClient) -> None:
    resp = client.post(
        "/api/reports",
        headers={"X-Browser-Id": str(uuid4())},
        json={
            "latitude": LAT,
            "longitude": LNG,
            "disaster_type": "extreme_heat",
            "report_mode": "emergency",
            "location_source": "gps",
            "client_request_id": str(uuid4()),
        },
    )
    assert resp.status_code == 200
    assert resp.json()["demo_record_created"] is True

    demo_resp = client.get("/api/demo-authority")
    assert demo_resp.status_code == 200
    records = demo_resp.json()["records"]
    assert len(records) == 1
    rec = records[0]
    assert 0.0 <= rec["priority_score"] <= 100.0
    assert isinstance(rec["anomaly_flag"], bool)
    assert 0.0 <= rec["risk_1h"] <= 100.0
    assert 0.0 <= rec["risk_2h"] <= 100.0
    assert 0.0 <= rec["risk_3h"] <= 100.0


def test_map_stream_returns_sse_with_valid_map_query_response(client: TestClient) -> None:
    with client.stream("GET", "/api/map/stream", params={"lat": LAT, "lng": LNG, "max_events": 1}) as resp:
        assert resp.status_code == 200
        assert resp.headers["content-type"].startswith("text/event-stream")
        data_line = None
        for line in resp.iter_lines():
            if line.startswith("data: "):
                data_line = line[len("data: "):]
                break
        assert data_line is not None
        parsed = MapQueryResponse.model_validate(json.loads(data_line))
        assert parsed.query_lat == pytest.approx(LAT)
        assert parsed.query_lng == pytest.approx(LNG)
