"""Geodesic distance and spatial grid utilities for COP31 Heatnode."""

from __future__ import annotations

import math
from typing import List, Tuple

EARTH_RADIUS_METERS = 6_371_000.0


def haversine_meters(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Compute great-circle distance in meters between two WGS84 coordinates."""
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    d_phi = math.radians(lat2 - lat1)
    d_lambda = math.radians(lng2 - lng1)

    a = (
        math.sin(d_phi / 2.0) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(max(0.0, 1.0 - a)))
    return EARTH_RADIUS_METERS * c


def generate_grid_points(
    center_lat: float,
    center_lng: float,
    radius_m: float = 1000.0,
    step_m: float = 200.0,
) -> List[Tuple[float, float]]:
    """Generate a deterministic local coordinate grid around (center_lat, center_lng)."""
    if step_m <= 0 or radius_m < 0:
        return [(center_lat, center_lng)]

    meters_per_deg_lat = 111_320.0
    cos_lat = max(0.01, abs(math.cos(math.radians(center_lat))))
    meters_per_deg_lng = 111_320.0 * cos_lat

    steps = int(math.floor(radius_m / step_m))
    points: List[Tuple[float, float]] = []
    for dy in range(-steps, steps + 1):
        for dx in range(-steps, steps + 1):
            offset_n = dy * step_m
            offset_e = dx * step_m
            if math.hypot(offset_n, offset_e) <= radius_m + 1e-6:
                lat = center_lat + (offset_n / meters_per_deg_lat)
                lng = center_lng + (offset_e / meters_per_deg_lng)
                if -90.0 <= lat <= 90.0 and -180.0 <= lng <= 180.0:
                    points.append((round(lat, 6), round(lng, 6)))
    return points
