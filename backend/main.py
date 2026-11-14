"""FastAPI application and HTTP endpoints for COP31 Heatnode."""

from __future__ import annotations

import asyncio
from collections import defaultdict
from contextlib import asynccontextmanager
import math
import os
import threading
from typing import Any, Callable, Dict, List, Optional, Set, Tuple
from uuid import UUID, uuid4

from fastapi import Body, FastAPI, Header, HTTPException, Query, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from backend.db import Database, utc_now
from backend.decision_model import (
    ContributionInput,
    DecisionModelInput,
    GridPointInput,
    evaluate_decision_model,
)
from backend.geo import generate_grid_points, haversine_meters
from backend.ml_inference import get_ml_metadata, is_ml_available, predict_hazard_ml
from backend.models import (
    DEFAULT_MODEL_VERSION,
    DemoAuthorityListResponse,
    DemoAuthorityRecord,
    DisasterType,
    EVENT_RADIUS_METERS,
    EventRecord,
    MapQueryResponse,
    ReportCreateRequest,
    ReportCreateResponse,
    ReportMode,
    ReportRecord,
    ReportStatus,
    SafezoneNode,
    SafezonesListResponse,
    SafezoneToggleRequest,
    ScoreResult,
    SessionResponse,
)
from backend.routing import (
    build_safezone_nodes,
    compute_safe_route,
    load_antalya_graph,
)

BROWSER_COOKIE_NAME = "heatnode_browser_id"
COOKIE_MAX_AGE_SECONDS = 365 * 24 * 3600
SSE_HEARTBEAT_SECONDS = 2.5

db = Database()

_subscribers_lock = threading.Lock()
_stream_subscribers: Set[Tuple[asyncio.AbstractEventLoop, asyncio.Queue[int]]] = set()


def _enqueue_update(queue: asyncio.Queue[int]) -> None:
    if not queue.full():
        queue.put_nowait(1)


def _notify_subscribers() -> None:
    with _subscribers_lock:
        subscribers = list(_stream_subscribers)
    for loop, queue in subscribers:
        if not loop.is_closed():
            try:
                loop.call_soon_threadsafe(_enqueue_update, queue)
            except RuntimeError:
                pass


@asynccontextmanager
async def lifespan(_: FastAPI):
    db.init_db()
    yield


app = FastAPI(
    title="COP31 Heatnode API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=os.getenv("CORS_ORIGIN_REGEX", r"https?://.*"),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _parse_uuid_or_none(raw: Optional[str]) -> Optional[str]:
    if not raw:
        return None
    try:
        return str(UUID(raw.strip()))
    except (ValueError, AttributeError):
        return None


def _resolve_browser_id(
    request: Request,
    x_browser_id: Optional[str],
) -> Tuple[str, bool]:
    """Resolve browser_id from X-Browser-Id header, HttpOnly cookie, or issue a new UUID."""
    if x_browser_id is not None and x_browser_id.strip() != "":
        parsed = _parse_uuid_or_none(x_browser_id)
        if parsed is None:
            raise HTTPException(status_code=400, detail="Invalid X-Browser-Id UUID")
        return parsed, False

    cookie_val = request.cookies.get(BROWSER_COOKIE_NAME)
    parsed_cookie = _parse_uuid_or_none(cookie_val)
    if parsed_cookie is not None:
        return parsed_cookie, False

    return str(uuid4()), True


def _set_browser_cookie(response: Response, browser_id: str) -> None:
    response.set_cookie(
        key=BROWSER_COOKIE_NAME,
        value=browser_id,
        max_age=COOKIE_MAX_AGE_SECONDS,
        httponly=True,
        samesite="lax",
        path="/",
    )


def _validate_query_coord(value: float, name: str, min_val: float, max_val: float) -> float:
    if math.isnan(value) or math.isinf(value) or value < min_val or value > max_val:
        raise HTTPException(
            status_code=422,
            detail=f"{name} must be a finite number between {min_val} and {max_val}",
        )
    return float(value)


@app.get("/api/health")
@app.get("/health")
def health_check() -> Dict[str, Any]:
    """Liveness check endpoint."""
    return {
        "status": "ok",
        "service": "cop31-heatnode",
        "model_version": DEFAULT_MODEL_VERSION,
        "ml_active": is_ml_available(),
        "ml_metadata": get_ml_metadata(),
    }


@app.get("/api/model-info")
def model_info() -> Dict[str, Any]:
    """Return measured ML validation metrics, data sources, and model limitations."""
    return {
        "model_version": DEFAULT_MODEL_VERSION,
        **get_ml_metadata(),
    }


@app.post("/api/session", response_model=SessionResponse)
def create_or_get_session(
    request: Request,
    response: Response,
    x_browser_id: Optional[str] = Header(default=None, alias="X-Browser-Id"),
) -> SessionResponse:
    """Issue or return the server-managed random UUID browser_id."""
    browser_id, is_new = _resolve_browser_id(request, x_browser_id)
    if is_new or request.cookies.get(BROWSER_COOKIE_NAME) != browser_id:
        _set_browser_cookie(response, browser_id)
    return SessionResponse(browser_id=browser_id)


@app.post("/api/reports", response_model=ReportCreateResponse)
def submit_report(
    payload: ReportCreateRequest,
    request: Request,
    response: Response,
    x_browser_id: Optional[str] = Header(default=None, alias="X-Browser-Id"),
) -> ReportCreateResponse:
    """Validate and submit a disaster report with idempotency, clustering, and duplicate detection."""
    db.init_db()
    browser_id, is_new = _resolve_browser_id(request, x_browser_id)
    if is_new:
        _set_browser_cookie(response, browser_id)

    result = db.submit_report(browser_id=browser_id, payload=payload)
    if result.status == ReportStatus.ACCEPTED:
        _notify_subscribers()
    return result


def _build_map_response(
    lat: float,
    lng: float,
    disaster_type: Optional[DisasterType],
    area_radius_m: float,
) -> MapQueryResponse:
    """Build MapQueryResponse with ML hazard propagation enrichment on nearby events."""
    db.init_db()
    q_lat = _validate_query_coord(lat, "lat", -90.0, 90.0)
    q_lng = _validate_query_coord(lng, "lng", -180.0, 180.0)
    now = utc_now()

    all_reports, all_events = db.get_active_reports_and_events(
        disaster_type=disaster_type,
        now=now,
    )
    event_by_id: Dict[str, EventRecord] = {ev.id: ev for ev in all_events}

    reports_by_event: Dict[str, List[ReportRecord]] = defaultdict(list)
    for r in all_reports:
        reports_by_event[r.event_id].append(r)

    # Filter reports/events within area_radius_m for display, keeping full event origins for scoring
    nearby_events_raw = [
        ev
        for ev in all_events
        if haversine_meters(q_lat, q_lng, ev.origin_lat, ev.origin_lng) <= area_radius_m
    ]
    nearby_events: List[EventRecord] = []
    for ev in nearby_events_raw:
        ev_reports = reports_by_event.get(ev.id, [])
        ev_count = len(ev_reports) if ev_reports else ev.active_report_count
        ev_weight = (
            sum(r.base_weight for r in ev_reports)
            if ev_reports
            else float(ev.active_report_count)
        )
        ev_emergency = any(r.report_mode == ReportMode.EMERGENCY for r in ev_reports)
        ml_pred = predict_hazard_ml(
            disaster_type=ev.disaster_type.value,
            active_report_count=ev_count,
            total_weight=ev_weight,
            lat=ev.origin_lat,
            lng=ev.origin_lng,
            is_emergency=ev_emergency,
        )
        nearby_events.append(
            ev.model_copy(
                update={
                    "risk_1h": ml_pred["risk_1h"],
                    "risk_2h": ml_pred["risk_2h"],
                    "risk_3h": ml_pred["risk_3h"],
                    "ml_active": ml_pred["ml_active"],
                }
            )
        )

    nearby_event_ids = {ev.id for ev in nearby_events}
    nearby_reports: List[ReportRecord] = [
        r
        for r in all_reports
        if r.event_id in nearby_event_ids
        or haversine_meters(q_lat, q_lng, r.latitude, r.longitude) <= area_radius_m
    ]

    contributions = [
        ContributionInput(
            report_id=r.id,
            event_id=r.event_id,
            disaster_type=r.disaster_type,
            origin_lat=event_by_id[r.event_id].origin_lat,
            origin_lng=event_by_id[r.event_id].origin_lng,
            base_weight=r.base_weight,
        )
        for r in all_reports
        if r.event_id in event_by_id
    ]

    raw_grid = generate_grid_points(
        q_lat,
        q_lng,
        radius_m=min(area_radius_m, 1000.0),
        step_m=200.0,
    )
    grid_inputs = [GridPointInput(lat=pt[0], lng=pt[1]) for pt in raw_grid]

    scores_by_disaster: Dict[str, ScoreResult] = {}
    query_score: Optional[ScoreResult] = None
    heatmap_points = []
    model_version = DEFAULT_MODEL_VERSION
    model_parameters: Dict[str, object] = {}

    if disaster_type is not None:
        model_out = evaluate_decision_model(
            DecisionModelInput(
                query_lat=q_lat,
                query_lng=q_lng,
                disaster_type=disaster_type,
                radius_m=EVENT_RADIUS_METERS,
                contributions=contributions,
                grid_points=grid_inputs,
                calculated_at=now,
            )
        )
        query_score = model_out.query_score
        scores_by_disaster[disaster_type.value] = model_out.query_score
        heatmap_points = model_out.heatmap_points
        model_version = model_out.model_version
        model_parameters = model_out.parameters
    else:
        for d_type in DisasterType:
            model_out = evaluate_decision_model(
                DecisionModelInput(
                    query_lat=q_lat,
                    query_lng=q_lng,
                    disaster_type=d_type,
                    radius_m=EVENT_RADIUS_METERS,
                    contributions=contributions,
                    grid_points=[],
                    calculated_at=now,
                )
            )
            scores_by_disaster[d_type.value] = model_out.query_score
            model_version = model_out.model_version
            model_parameters = model_out.parameters

    active_safezone_ids = db.get_active_safezone_ids()
    all_safezone_nodes = build_safezone_nodes(active_safezone_ids, all_events)
    active_safezones = [n for n in all_safezone_nodes if n.is_active]
    safe_route = compute_safe_route(
        user_lat=q_lat,
        user_lng=q_lng,
        active_safezone_ids=active_safezone_ids,
        events=all_events,
    )

    return MapQueryResponse(
        query_lat=q_lat,
        query_lng=q_lng,
        disaster_type=disaster_type,
        radius_m=EVENT_RADIUS_METERS,
        model_version=model_version,
        model_parameters=model_parameters,
        query_score=query_score,
        scores_by_disaster=scores_by_disaster,
        active_reports=nearby_reports,
        events=nearby_events,
        heatmap_points=heatmap_points,
        safezones=active_safezones,
        safe_route=safe_route,
        calculated_at=now,
    )


def _build_demo_authority_response(limit: int) -> DemoAuthorityListResponse:
    """Build DemoAuthorityListResponse enriched with ML risk/anomaly/priority and sorted by priority."""
    db.init_db()
    now = utc_now()
    records = db.list_demo_authority_records(limit=limit)
    all_reports, all_events = db.get_active_reports_and_events(now=now)
    active_safezone_ids = db.get_active_safezone_ids()
    safezone_nodes = build_safezone_nodes(active_safezone_ids, all_events)
    reports_by_event: Dict[str, List[ReportRecord]] = defaultdict(list)
    for r in all_reports:
        reports_by_event[r.event_id].append(r)

    enriched: List[DemoAuthorityRecord] = []
    for rec in records:
        ev_reports = reports_by_event.get(rec.event_id, [])
        ev_count = len(ev_reports) if ev_reports else 1
        ev_weight = sum(r.base_weight for r in ev_reports) if ev_reports else 2.0
        ml_pred = predict_hazard_ml(
            disaster_type=rec.disaster_type.value,
            active_report_count=ev_count,
            total_weight=ev_weight,
            lat=rec.latitude,
            lng=rec.longitude,
            is_emergency=(rec.report_mode == ReportMode.EMERGENCY),
        )
        enriched.append(
            rec.model_copy(
                update={
                    "risk_1h": ml_pred["risk_1h"],
                    "risk_2h": ml_pred["risk_2h"],
                    "risk_3h": ml_pred["risk_3h"],
                    "anomaly_flag": ml_pred["anomaly_flag"],
                    "anomaly_score": ml_pred["anomaly_score"],
                    "priority_score": ml_pred["priority_score"],
                    "ml_active": ml_pred["ml_active"],
                }
            )
        )

    enriched.sort(
        key=lambda r: (r.priority_score if r.priority_score is not None else 0.0, r.accepted_at),
        reverse=True,
    )
    return DemoAuthorityListResponse(
        is_demo=True,
        records=enriched,
        nodes=safezone_nodes,
    )


async def _sse_event_stream(
    request: Request,
    build_json_payload: Callable[[], str],
    max_events: Optional[int] = None,
):
    """Yield SSE data frames immediately on connect, on new report notifications, and every 2.5s."""
    loop = asyncio.get_running_loop()
    queue: asyncio.Queue[int] = asyncio.Queue(maxsize=1)
    subscriber = (loop, queue)
    with _subscribers_lock:
        _stream_subscribers.add(subscriber)

    try:
        yield f"data: {build_json_payload()}\n\n"
        sent = 1
        while max_events is None or sent < max_events:
            if await request.is_disconnected():
                break
            try:
                await asyncio.wait_for(queue.get(), timeout=SSE_HEARTBEAT_SECONDS)
            except asyncio.TimeoutError:
                pass
            if await request.is_disconnected():
                break
            yield f"data: {build_json_payload()}\n\n"
            sent += 1
    except asyncio.CancelledError:
        pass
    finally:
        with _subscribers_lock:
            _stream_subscribers.discard(subscriber)


@app.get("/api/map", response_model=MapQueryResponse)
def get_map_data(
    lat: float = Query(...),
    lng: float = Query(...),
    disaster_type: Optional[DisasterType] = Query(default=None),
    area_radius_m: float = Query(default=1500.0, gt=0.0, le=10000.0),
) -> MapQueryResponse:
    """Return active reports, events, and decision-model scores around (lat, lng)."""
    return _build_map_response(
        lat=lat,
        lng=lng,
        disaster_type=disaster_type,
        area_radius_m=area_radius_m,
    )


@app.get("/api/map/stream")
async def stream_map_data(
    request: Request,
    lat: float = Query(...),
    lng: float = Query(...),
    disaster_type: Optional[DisasterType] = Query(default=None),
    area_radius_m: float = Query(default=1500.0, gt=0.0, le=10000.0),
    max_events: Optional[int] = Query(default=None, ge=1),
) -> StreamingResponse:
    """Server-Sent Events stream of MapQueryResponse around (lat, lng)."""
    _validate_query_coord(lat, "lat", -90.0, 90.0)
    _validate_query_coord(lng, "lng", -180.0, 180.0)

    def _build() -> str:
        return _build_map_response(
            lat=lat,
            lng=lng,
            disaster_type=disaster_type,
            area_radius_m=area_radius_m,
        ).model_dump_json()

    return StreamingResponse(
        _sse_event_stream(request, _build, max_events=max_events),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@app.get("/api/safezones", response_model=SafezonesListResponse)
def list_safezones() -> SafezonesListResponse:
    """List all Antalya intersection nodes with their safezone and hazard status."""
    db.init_db()
    now = utc_now()
    _, all_events = db.get_active_reports_and_events(now=now)
    active_ids = db.get_active_safezone_ids()
    return SafezonesListResponse(nodes=build_safezone_nodes(active_ids, all_events))


@app.post("/api/safezones/{node_id}/toggle", response_model=SafezoneNode)
def toggle_safezone(
    node_id: str,
    payload: Optional[SafezoneToggleRequest] = Body(default=None),
) -> SafezoneNode:
    """Activate or deactivate an Antalya intersection node as an evacuation safezone."""
    db.init_db()
    graph_nodes, _ = load_antalya_graph()
    if node_id not in graph_nodes:
        raise HTTPException(status_code=404, detail=f"Unknown safezone node: {node_id}")

    active_ids = db.get_active_safezone_ids()
    next_active = (
        payload.is_active
        if payload is not None and payload.is_active is not None
        else (node_id not in active_ids)
    )
    db.set_safezone_active(node_id, next_active)
    _notify_subscribers()

    now = utc_now()
    _, all_events = db.get_active_reports_and_events(now=now)
    updated_ids = db.get_active_safezone_ids()
    for node in build_safezone_nodes(updated_ids, all_events):
        if node.node_id == node_id:
            return node
    raise HTTPException(status_code=404, detail=f"Unknown safezone node: {node_id}")


@app.get("/api/demo-authority", response_model=DemoAuthorityListResponse)
def get_demo_authority_records(
    limit: int = Query(default=100, ge=1, le=500),
) -> DemoAuthorityListResponse:
    """List demo emergency records (never sends real institution notifications)."""
    return _build_demo_authority_response(limit=limit)


@app.get("/api/demo-authority/stream")
async def stream_demo_authority_records(
    request: Request,
    limit: int = Query(default=100, ge=1, le=500),
    max_events: Optional[int] = Query(default=None, ge=1),
) -> StreamingResponse:
    """Server-Sent Events stream of DemoAuthorityListResponse."""

    def _build() -> str:
        return _build_demo_authority_response(limit=limit).model_dump_json()

    return StreamingResponse(
        _sse_event_stream(request, _build, max_events=max_events),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
