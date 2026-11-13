"""API & SQLite Persistence Tests for HEATNODE AI."""

import sqlite3

from fastapi.testclient import TestClient

from backend.main import create_app


def test_health_and_baseline_state(tmp_path):
    app = create_app(db_path=str(tmp_path / "test.db"), force_fallback_weather=True)
    client = TestClient(app)

    health = client.get("/health")
    assert health.status_code == 200
    assert health.json()["status"] == "ok"

    state_res = client.get("/state")
    assert state_res.status_code == 200
    state = state_res.json()
    assert state["alert_state"]["status"] == "MONITORING"
    assert state["public_alert_active"] is False
    assert len(state["node_states"]) == 24
    assert "weather" in state
    assert "propagation_edges" in state
    assert "hubs" in state
    assert "nearest_hub_by_node" in state


def test_invalid_report_returns_422(tmp_path):
    app = create_app(db_path=str(tmp_path / "test.db"), force_fallback_weather=True)
    client = TestClient(app)

    res = client.post("/report", json={"node_id": "INVALID_NODE", "category": "extreme_heat"})
    assert res.status_code == 422

    bad_cat = client.post("/report", json={"node_id": "kepez_dokuma", "category": "invalid_category"})
    assert bad_cat.status_code == 422


def test_valid_report_and_zero_pii_schema(tmp_path):
    db_file = tmp_path / "test.db"
    app = create_app(db_path=str(db_file), force_fallback_weather=True)
    client = TestClient(app)

    res = client.post("/report", json={"node_id": "kepez_dokuma", "category": "extreme_heat"})
    assert res.status_code == 200
    body = res.json()
    assert body["accepted"] is True
    assert body["node_id"] == "kepez_dokuma"
    assert body["alert_status"] == "MONITORING"
    assert body["public_alert_active"] is False
    assert body["nearest_hub"] is None

    # Verify strict zero-PII schema in SQLite
    with sqlite3.connect(db_file) as conn:
        cols = [row[1] for row in conn.execute("PRAGMA table_info(reports)").fetchall()]
    assert cols == ["id", "node_id", "category", "created_at"]


def test_simulate_surge_pending_and_approve_flow(tmp_path):
    app = create_app(db_path=str(tmp_path / "test.db"), force_fallback_weather=True)
    client = TestClient(app)

    sim = client.post("/simulate-surge")
    assert sim.status_code == 200

    state = client.get("/state").json()
    assert state["alert_state"]["status"] == "PENDING_APPROVAL"
    assert state["public_alert_active"] is False
    assert state["any_verified_anomaly"] is True
    assert state["weather"]["temperature_c"] == 45.0
    assert state["weather"]["wind_direction_deg"] == 225.0

    out_of_bounds = client.post("/approve-alert", json={"approved": True, "hub_count": 99})
    assert out_of_bounds.status_code == 422

    zero_hubs = client.post("/approve-alert", json={"approved": True, "hub_count": 0})
    assert zero_hubs.status_code == 422

    ok = client.post("/approve-alert", json={"approved": True, "hub_count": 3})
    assert ok.status_code == 200

    active_state = client.get("/state").json()
    assert active_state["alert_state"]["status"] == "ACTIVE"
    assert active_state["public_alert_active"] is True
    assert len(active_state["hubs"]) == 3

    # Once ACTIVE, citizen report exposes nearest_hub
    rep = client.post("/report", json={"node_id": "kepez_dokuma", "category": "vulnerable_assistance"})
    assert rep.status_code == 200
    rep_body = rep.json()
    assert rep_body["public_alert_active"] is True
    assert rep_body["nearest_hub"] is not None
    assert "hub_id" in rep_body["nearest_hub"]

    reset_res = client.post("/reset-demo")
    assert reset_res.status_code == 200
    reset_state = client.get("/state").json()
    assert reset_state["alert_state"]["status"] == "MONITORING"
    assert reset_state["public_alert_active"] is False
