"""FastAPI Application, Alert Lifecycle State Machine & Endpoints for HEATNODE AI."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from backend.db import Database
from backend.graph import load_graph
from backend.pipeline import HeatnodePipeline
from backend.weather import WeatherService, WeatherSnapshot, compute_utci, utci_category

VALID_CATEGORIES = {
    "extreme_heat",
    "power_water_outage",
    "smoke_odor",
    "vulnerable_assistance",
}

DEMO_SURGE_NODES = [
    ("kepez_dokuma", 14),
    ("kepez_fabrikalar", 10),
    ("kepez_yesilyurt", 10),
    ("kepez_teomanpasa", 8),
]


class ReportRequest(BaseModel):
    """Zero-PII citizen heat report payload."""

    node_id: str
    category: str


class ApproveAlertRequest(BaseModel):
    """Municipal operator Human-in-the-Loop (HITL) alert approval payload."""

    approved: bool
    hub_count: int = Field(default=3, ge=1, le=5)
    approved_by: Optional[str] = "Municipal Operator"


def _build_demo_surge_weather() -> WeatherSnapshot:
    """Build the 45°C SW-wind Antalya demo heatwave WeatherSnapshot."""
    temp_c = 45.0
    rel_humidity = 48.0
    wind_speed_kmh = 18.0
    wind_dir_deg = 225.0
    solar_wm2 = 950.0
    utci = compute_utci(temp_c, rel_humidity, wind_speed_kmh / 3.6, solar_wm2)
    return {
        "temperature_c": temp_c,
        "relative_humidity": rel_humidity,
        "wind_speed_kmh": wind_speed_kmh,
        "wind_direction_deg": wind_dir_deg,
        "solar_radiation_wm2": solar_wm2,
        "utci_c": utci,
        "stress_category": utci_category(utci),
        "source": "simulation",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


def create_app(
    db_path: str = "heatnode.db",
    force_fallback_weather: bool = False,
) -> FastAPI:
    """Create and configure the HEATNODE AI FastAPI application."""
    application = FastAPI(title="HEATNODE AI", version="0.1.0")
    application.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    db = Database(db_path=db_path)
    db.init_db()
    graph = load_graph()
    weather_service = WeatherService()
    pipeline = HeatnodePipeline(graph, "ml/artifacts/xgb_propagation.joblib")

    application.state.weather_override = None

    def _evaluate_state() -> Dict[str, Any]:
        weather = application.state.weather_override
        if weather is None:
            weather = weather_service.get_current_weather(
                force_fallback=force_fallback_weather
            )

        reports = db.get_recent_reports(minutes=20)
        alert_state = db.get_alert_state()
        eval_result = pipeline.evaluate(
            weather=weather,
            reports=reports,
            hub_count=alert_state["hub_count"],
        )

        if alert_state["status"] == "MONITORING" and eval_result["any_verified_anomaly"]:
            alert_state = db.set_alert_state(
                status="PENDING_APPROVAL",
                hub_count=alert_state["hub_count"],
                approved_by=None,
            )

        public_alert_active = alert_state["status"] == "ACTIVE"
        return {
            "weather": weather,
            "alert_state": alert_state,
            "public_alert_active": public_alert_active,
            "any_verified_anomaly": eval_result["any_verified_anomaly"],
            "node_states": eval_result["node_states"],
            "propagation_edges": eval_result["propagation_edges"],
            "hubs": eval_result["hubs"],
            "nearest_hub_by_node": eval_result["nearest_hub_by_node"],
        }

    @application.get("/health")
    def health() -> Dict[str, Any]:
        return {"status": "ok", "nodes_loaded": len(graph.nodes)}

    @application.get("/state")
    def get_state() -> Dict[str, Any]:
        return _evaluate_state()

    @application.post("/report")
    def submit_report(payload: ReportRequest) -> Dict[str, Any]:
        if payload.node_id not in graph.nodes:
            raise HTTPException(
                status_code=422,
                detail=f"Invalid node_id: {payload.node_id}",
            )
        if payload.category not in VALID_CATEGORIES:
            raise HTTPException(
                status_code=422,
                detail=f"Invalid category: {payload.category}",
            )

        db.insert_report(payload.node_id, payload.category)
        state = _evaluate_state()
        public_alert_active = state["public_alert_active"]
        nearest_hub = (
            state["nearest_hub_by_node"].get(payload.node_id)
            if public_alert_active
            else None
        )
        return {
            "accepted": True,
            "node_id": payload.node_id,
            "alert_status": state["alert_state"]["status"],
            "public_alert_active": public_alert_active,
            "nearest_hub": nearest_hub,
        }

    @application.post("/simulate-surge")
    def simulate_surge() -> Dict[str, Any]:
        categories = sorted(VALID_CATEGORIES)
        bulk_reports: List[Dict[str, str]] = []
        idx = 0
        for node_id, count in DEMO_SURGE_NODES:
            for _ in range(count):
                bulk_reports.append(
                    {
                        "node_id": node_id,
                        "category": categories[idx % len(categories)],
                    }
                )
                idx += 1

        db.insert_bulk_reports(bulk_reports)
        application.state.weather_override = _build_demo_surge_weather()
        return _evaluate_state()

    @application.post("/reset-demo")
    def reset_demo() -> Dict[str, Any]:
        db.clear_reports()
        application.state.weather_override = None
        db.set_alert_state("MONITORING", 3, approved_by=None)
        return _evaluate_state()

    @application.post("/approve-alert")
    def approve_alert(payload: ApproveAlertRequest) -> Dict[str, Any]:
        if payload.approved:
            db.set_alert_state(
                status="ACTIVE",
                hub_count=payload.hub_count,
                approved_by=payload.approved_by,
            )
        else:
            db.set_alert_state(
                status="MONITORING",
                hub_count=payload.hub_count,
                approved_by=None,
            )
        return _evaluate_state()

    return application


app = create_app()
