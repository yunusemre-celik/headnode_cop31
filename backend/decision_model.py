"""Decision Model API Adapter and built-in rule-based model v1 (rule-v1)."""

from __future__ import annotations

from datetime import datetime, timezone
import logging
import os
from typing import Any, Dict, List, Optional, Tuple

import httpx
from pydantic import BaseModel, Field

from backend.geo import haversine_meters
from backend.models import (
    DEFAULT_MODEL_VERSION,
    DisasterType,
    EVENT_RADIUS_METERS,
    HeatmapPoint,
    ScoreResult,
)

logger = logging.getLogger(__name__)

CONFIDENCE_K = 4.0
CRITICALITY_K = 10.0


class ContributionInput(BaseModel):
    """Single active, accepted report contribution anchored to its event origin."""

    report_id: str
    event_id: str
    disaster_type: DisasterType
    origin_lat: float
    origin_lng: float
    base_weight: float


class GridPointInput(BaseModel):
    """Coordinate to evaluate for heatmap rendering."""

    lat: float
    lng: float


class DecisionModelInput(BaseModel):
    """Input contract for both built-in rule-v1 and external DECISION_MODEL_API_URL."""

    query_lat: float
    query_lng: float
    disaster_type: DisasterType
    radius_m: float = EVENT_RADIUS_METERS
    contributions: List[ContributionInput] = Field(default_factory=list)
    grid_points: List[GridPointInput] = Field(default_factory=list)
    calculated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class DecisionModelOutput(BaseModel):
    """Output contract for both built-in rule-v1 and external DECISION_MODEL_API_URL."""

    model_version: str = DEFAULT_MODEL_VERSION
    parameters: Dict[str, Any] = Field(default_factory=dict)
    query_score: ScoreResult
    heatmap_points: List[HeatmapPoint] = Field(default_factory=list)


def distance_factor(distance_m: float, radius_m: float = EVENT_RADIUS_METERS) -> float:
    """Linear distance decay: 1 at 0m, 0.5 at 250m, 0 at >=500m."""
    if radius_m <= 0:
        return 0.0
    if distance_m <= 0:
        return 1.0
    return max(0.0, 1.0 - (distance_m / radius_m))


def compute_scores_from_total_weight(
    total_weight: float,
) -> Tuple[Optional[float], Optional[float], bool]:
    """Convert total local weight S into (confidence, criticality, uncertain)."""
    if total_weight <= 0.0:
        return None, None, True
    confidence = 100.0 * total_weight / (total_weight + CONFIDENCE_K)
    criticality = 100.0 * total_weight / (total_weight + CRITICALITY_K)
    return confidence, criticality, False


def _score_at_point(
    lat: float,
    lng: float,
    contributions: List[ContributionInput],
    disaster_type: DisasterType,
    radius_m: float,
) -> Tuple[float, int]:
    """Sum local_weight once per active accepted report of matching disaster_type."""
    total_weight = 0.0
    active_count = 0
    seen_reports: set[str] = set()

    for c in contributions:
        if c.disaster_type != disaster_type or c.report_id in seen_reports:
            continue
        seen_reports.add(c.report_id)
        d_m = haversine_meters(c.origin_lat, c.origin_lng, lat, lng)
        df = distance_factor(d_m, radius_m=radius_m)
        if df > 0.0:
            total_weight += c.base_weight * df
            active_count += 1

    return total_weight, active_count


def evaluate_rule_v1(request: DecisionModelInput) -> DecisionModelOutput:
    """Explainable, deterministic rule-based decision model v1."""
    q_total, q_count = _score_at_point(
        request.query_lat,
        request.query_lng,
        request.contributions,
        request.disaster_type,
        request.radius_m,
    )
    q_conf, q_crit, q_uncertain = compute_scores_from_total_weight(q_total)

    query_score = ScoreResult(
        disaster_type=request.disaster_type,
        total_weight=q_total,
        confidence=q_conf,
        criticality=q_crit,
        uncertain=q_uncertain,
        active_report_count=q_count,
        model_version=DEFAULT_MODEL_VERSION,
        calculated_at=request.calculated_at,
    )

    heatmap_points: List[HeatmapPoint] = []
    for pt in request.grid_points:
        p_total, p_count = _score_at_point(
            pt.lat,
            pt.lng,
            request.contributions,
            request.disaster_type,
            request.radius_m,
        )
        p_conf, p_crit, p_uncertain = compute_scores_from_total_weight(p_total)
        heatmap_points.append(
            HeatmapPoint(
                lat=pt.lat,
                lng=pt.lng,
                total_weight=p_total,
                confidence=p_conf,
                criticality=p_crit,
                uncertain=p_uncertain,
                active_report_count=p_count,
            )
        )

    return DecisionModelOutput(
        model_version=DEFAULT_MODEL_VERSION,
        parameters={
            "radius_m": request.radius_m,
            "confidence_k": CONFIDENCE_K,
            "criticality_k": CRITICALITY_K,
        },
        query_score=query_score,
        heatmap_points=heatmap_points,
    )


def evaluate_decision_model(request: DecisionModelInput) -> DecisionModelOutput:
    """Call external DECISION_MODEL_API_URL if configured, else fall back to rule-v1."""
    external_url = os.getenv("DECISION_MODEL_API_URL", "").strip()
    if external_url:
        try:
            with httpx.Client(timeout=3.0) as client:
                resp = client.post(
                    external_url,
                    json=request.model_dump(mode="json"),
                )
                resp.raise_for_status()
                return DecisionModelOutput.model_validate(resp.json())
        except Exception as exc:
            logger.warning(
                "External decision model at %s failed (%s); falling back to %s.",
                external_url,
                exc,
                DEFAULT_MODEL_VERSION,
            )

    return evaluate_rule_v1(request)
