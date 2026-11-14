"""Pydantic models and domain constants for COP31 Heatnode."""

from __future__ import annotations

from datetime import datetime
from enum import Enum
import math
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class DisasterType(str, Enum):
    """Exact 10 language-independent disaster codes."""

    TORNADO = "tornado"
    WILDFIRE = "wildfire"
    SANDSTORM = "sandstorm"
    FROST = "frost"
    AVALANCHE = "avalanche"
    FLOOD = "flood"
    INUNDATION = "inundation"
    LANDSLIDE = "landslide"
    HAIL = "hail"
    EXTREME_HEAT = "extreme_heat"


class ReportMode(str, Enum):
    """Report entry modes."""

    EMERGENCY = "emergency"
    NORMAL = "normal"


class LocationSource(str, Enum):
    """How the user's coordinates were obtained."""

    GPS = "gps"
    MANUAL = "manual"


class ReportStatus(str, Enum):
    """Server outcome for a submitted report."""

    ACCEPTED = "accepted"
    DUPLICATE = "duplicate"
    REJECTED = "rejected"


LOCATION_WEIGHTS: Dict[LocationSource, float] = {
    LocationSource.GPS: 2.0,
    LocationSource.MANUAL: 0.5,
}

REPORT_LIFETIME_SECONDS = 3600
REPEAT_RESET_SECONDS = 1800
DUPLICATE_WINDOW_SECONDS = 1800
EVENT_RADIUS_METERS = 500.0
REPEAT_DECAY_BASE = 0.9
DEFAULT_MODEL_VERSION = "rule-v1"
SPATIAL_RULE_VERSION = "fixed-origin-500m-v1"


def _validate_finite_float(value: float, field_name: str, min_val: float, max_val: float) -> float:
    if not isinstance(value, (int, float)) or math.isnan(value) or math.isinf(value):
        raise ValueError(f"{field_name} must be a finite number")
    if value < min_val or value > max_val:
        raise ValueError(f"{field_name} must be between {min_val} and {max_val}")
    return float(value)


class SessionResponse(BaseModel):
    """Response for POST /api/session."""

    browser_id: str


class ReportCreateRequest(BaseModel):
    """Incoming report submission payload."""

    latitude: float
    longitude: float
    disaster_type: DisasterType
    report_mode: ReportMode
    location_source: LocationSource
    client_request_id: UUID

    @field_validator("latitude")
    @classmethod
    def validate_latitude(cls, v: float) -> float:
        return _validate_finite_float(v, "latitude", -90.0, 90.0)

    @field_validator("longitude")
    @classmethod
    def validate_longitude(cls, v: float) -> float:
        return _validate_finite_float(v, "longitude", -180.0, 180.0)


class ReportRecord(BaseModel):
    """Stored accepted report record."""

    id: str
    browser_id: str
    disaster_type: DisasterType
    report_mode: ReportMode
    latitude: float
    longitude: float
    location_source: LocationSource
    accepted_at: datetime
    expires_at: datetime
    repeat_factor: float
    base_weight: float
    event_id: str
    model_version: str


class ReportCreateResponse(BaseModel):
    """Response for POST /api/reports."""

    status: ReportStatus
    report: Optional[ReportRecord] = None
    event_id: Optional[str] = None
    demo_record_created: bool = False
    reason: Optional[str] = None


class EventRecord(BaseModel):
    """Spatial-temporal event cluster with fixed origin."""

    id: str
    disaster_type: DisasterType
    origin_lat: float
    origin_lng: float
    spatial_rule_version: str
    active_report_ids: List[str] = Field(default_factory=list)
    active_report_count: int = 0
    created_at: datetime
    updated_at: datetime
    risk_1h: Optional[float] = None
    risk_2h: Optional[float] = None
    risk_3h: Optional[float] = None
    ml_active: bool = False


class ScoreResult(BaseModel):
    """Decision model score at a query position or event."""

    disaster_type: DisasterType
    total_weight: float
    confidence: Optional[float] = None
    criticality: Optional[float] = None
    uncertain: bool
    active_report_count: int
    model_version: str
    calculated_at: datetime


class HeatmapPoint(BaseModel):
    """Single spatial grid point for heatmap visualization."""

    lat: float
    lng: float
    total_weight: float
    confidence: Optional[float] = None
    criticality: Optional[float] = None
    uncertain: bool
    active_report_count: int


class MapQueryResponse(BaseModel):
    """Response for GET /api/map."""

    query_lat: float
    query_lng: float
    disaster_type: Optional[DisasterType] = None
    radius_m: float = EVENT_RADIUS_METERS
    model_version: str
    model_parameters: Dict[str, Any] = Field(default_factory=dict)
    query_score: Optional[ScoreResult] = None
    scores_by_disaster: Dict[str, ScoreResult] = Field(default_factory=dict)
    active_reports: List[ReportRecord] = Field(default_factory=list)
    events: List[EventRecord] = Field(default_factory=list)
    heatmap_points: List[HeatmapPoint] = Field(default_factory=list)
    calculated_at: datetime


class DemoAuthorityRecord(BaseModel):
    """Demo emergency record (never triggers real institution notifications)."""

    id: str
    report_id: str
    event_id: str
    disaster_type: DisasterType
    latitude: float
    longitude: float
    report_mode: ReportMode = ReportMode.EMERGENCY
    accepted_at: datetime
    is_demo: bool = True
    risk_1h: Optional[float] = None
    risk_2h: Optional[float] = None
    risk_3h: Optional[float] = None
    anomaly_flag: bool = False
    anomaly_score: Optional[float] = None
    priority_score: Optional[float] = None
    ml_active: bool = False


class DemoAuthorityListResponse(BaseModel):
    """Response for GET /api/demo-authority."""

    is_demo: bool = True
    notice: str = "DEMO ONLY: No real institution notifications are sent."
    records: List[DemoAuthorityRecord] = Field(default_factory=list)
