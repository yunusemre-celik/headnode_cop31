"""Tests for the 3-stage ML inference pipeline (backend/pipeline.py)."""

from datetime import datetime, timezone

from backend.graph import load_graph
from backend.pipeline import HeatnodePipeline
from backend.weather import compute_utci


def _hot_weather():
    utci = compute_utci(45.0, 45.0, 15.0 / 3.6, 850.0)
    return {
        "temperature_c": 45.0,
        "relative_humidity": 45.0,
        "wind_speed_kmh": 15.0,
        "wind_direction_deg": 225.0,  # SW wind blowing NE (Kepez -> Muratpasa)
        "solar_radiation_wm2": 850.0,
        "utci_c": utci,
        "stress_category": "Extreme Heat Stress",
        "source": "simulation",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


def test_pipeline_zero_reports_baseline():
    graph = load_graph("data/antalya_nodes.csv", "data/antalya_edges.csv")
    pipe = HeatnodePipeline(graph, "ml/artifacts/xgb_propagation.joblib")
    out = pipe.evaluate(_hot_weather(), reports=[], hub_count=3)
    assert len(out["node_states"]) == 24
    assert len(out["hubs"]) == 3
    assert out["any_verified_anomaly"] is False
    assert len(out["nearest_hub_by_node"]) == 24
    for ns in out["node_states"]:
        assert 0.0 <= ns["risk_now"] <= 100.0
        assert 0.0 <= ns["risk_1h"] <= 100.0
        assert 0.0 <= ns["risk_2h"] <= 100.0
        assert 0.0 <= ns["risk_3h"] <= 100.0
        assert 0.0 <= ns["threshold_prob_2h"] <= 1.0
        assert len(ns["shap_drivers"]) == 4


def test_pipeline_surge_triggers_anomaly_shap_and_hubs():
    graph = load_graph("data/antalya_nodes.csv", "data/antalya_edges.csv")
    pipe = HeatnodePipeline(graph, "ml/artifacts/xgb_propagation.joblib")
    kepez_nodes = [nid for nid, n in graph.nodes.items() if n["district"] == "Kepez"][:2]
    now = datetime.now(timezone.utc).isoformat()
    reports = [
        {"node_id": kepez_nodes[0], "category": "extreme_heat", "created_at": now}
        for _ in range(30)
    ]
    reports += [
        {"node_id": kepez_nodes[1], "category": "power_water_outage", "created_at": now}
        for _ in range(12)
    ]
    out = pipe.evaluate(_hot_weather(), reports=reports, hub_count=3)
    assert out["any_verified_anomaly"] is True
    flagged = [n for n in out["node_states"] if n["verified_anomaly"]]
    assert len(flagged) >= 1
    assert len(flagged[0]["shap_drivers"]) >= 3
    for driver in flagged[0]["shap_drivers"]:
        assert "driver" in driver and "impact" in driver
        assert isinstance(driver["impact"], float)
    assert len(out["hubs"]) == 3
    for hub in out["hubs"]:
        assert hub["hub_id"]
        assert hub["name"]
        assert hub["node_id"] in graph.nodes
        assert isinstance(hub["assigned_nodes"], list)
    assert len(out["nearest_hub_by_node"]) == 24
    for nid, info in out["nearest_hub_by_node"].items():
        assert nid in graph.nodes
        assert "hub_id" in info and "name" in info and "distance_km" in info
        assert info["distance_km"] >= 0.0
    assert isinstance(out["propagation_edges"], list)
    for edge in out["propagation_edges"]:
        assert edge["source_risk"] >= 65.0
        assert edge["alignment"] >= 0.5
