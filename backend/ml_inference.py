"""Lazy ML inference for hazard propagation (+1h/+2h/+3h) and anomaly detection."""

from __future__ import annotations

import math
from pathlib import Path
import threading
from typing import Any, Dict, Optional

_ARTIFACT_PATH = Path(__file__).resolve().parent.parent / "ml" / "artifacts" / "xgb_propagation.joblib"

_LOAD_LOCK = threading.Lock()
_LOAD_ATTEMPTED = False
_BUNDLE: Optional[Dict[str, Any]] = None

# Characteristic meteorological profiles per disaster type for feature construction
_DISASTER_PROFILES: Dict[str, Dict[str, float]] = {
    "extreme_heat": {"utci": 41.0, "grad1": 1.6, "grad3": 4.2, "rh": 28.0, "wind": 12.0},
    "wildfire": {"utci": 37.0, "grad1": 1.4, "grad3": 3.5, "rh": 22.0, "wind": 28.0},
    "tornado": {"utci": 24.0, "grad1": -1.8, "grad3": -3.5, "rh": 74.0, "wind": 65.0},
    "sandstorm": {"utci": 34.0, "grad1": 1.0, "grad3": 2.4, "rh": 18.0, "wind": 48.0},
    "frost": {"utci": 1.5, "grad1": -2.0, "grad3": -4.8, "rh": 65.0, "wind": 10.0},
    "avalanche": {"utci": 3.0, "grad1": 1.2, "grad3": 2.8, "rh": 78.0, "wind": 26.0},
    "flood": {"utci": 21.0, "grad1": -0.8, "grad3": -2.0, "rh": 88.0, "wind": 24.0},
    "inundation": {"utci": 22.0, "grad1": -0.6, "grad3": -1.5, "rh": 90.0, "wind": 20.0},
    "landslide": {"utci": 19.0, "grad1": -0.5, "grad3": -1.2, "rh": 86.0, "wind": 18.0},
    "hail": {"utci": 18.0, "grad1": -2.5, "grad3": -5.0, "rh": 82.0, "wind": 38.0},
}
_DEFAULT_PROFILE = {"utci": 27.0, "grad1": 0.4, "grad3": 1.0, "rh": 55.0, "wind": 18.0}


def _load_bundle() -> Optional[Dict[str, Any]]:
    """Lazily load the trained XGBoost + IsolationForest bundle if dependencies exist."""
    global _LOAD_ATTEMPTED, _BUNDLE
    if _LOAD_ATTEMPTED:
        return _BUNDLE

    with _LOAD_LOCK:
        if _LOAD_ATTEMPTED:
            return _BUNDLE
        _LOAD_ATTEMPTED = True
        try:
            if not _ARTIFACT_PATH.is_file():
                _BUNDLE = None
                return None
            import joblib  # noqa: F401
            import numpy as np  # noqa: F401
            import sklearn  # noqa: F401
            import xgboost  # noqa: F401

            loaded = joblib.load(_ARTIFACT_PATH)
            if isinstance(loaded, dict) and "models" in loaded and "iso_forest" in loaded:
                _BUNDLE = loaded
            else:
                _BUNDLE = None
        except Exception:
            _BUNDLE = None
        return _BUNDLE


def is_ml_available() -> bool:
    """Return True if the ML artifact and runtime dependencies loaded successfully."""
    return _load_bundle() is not None


def _clip(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


def _build_feature_vectors(
    disaster_type: str,
    active_report_count: int,
    total_weight: float,
    lat: float,
    lng: float,
    is_emergency: bool,
) -> tuple[list[float], list[float]]:
    """Construct the 11-feature propagation vector and 5-feature IsolationForest vector."""
    dtype_key = str(getattr(disaster_type, "value", disaster_type)).lower()
    prof = _DISASTER_PROFILES.get(dtype_key, _DEFAULT_PROFILE)

    count = max(0, int(active_report_count))
    weight = max(0.0, float(total_weight))

    # Deterministic spatial proxies bounded in [0.25, 0.95]
    spatial_phase = abs(math.sin(lat * 12.9898 + lng * 78.233))
    urban_density = _clip(0.35 + 0.55 * spatial_phase, 0.2, 0.95)
    vulnerability_weight = _clip(0.30 + 0.50 * (1.0 - 0.5 * spatial_phase), 0.2, 0.95)

    crowd_density = _clip(
        0.08 + 0.12 * count + 0.06 * weight + (0.22 if is_emergency else 0.0),
        0.0,
        1.0,
    )
    mean_neighbor_risk = _clip(
        18.0 + 6.5 * weight + 4.0 * count + (14.0 if is_emergency else 0.0),
        5.0,
        98.0,
    )
    max_upwind_alignment = _clip(0.35 + 0.55 * abs(math.cos(lat + lng)), 0.0, 1.0)
    upwind_advection_score = max_upwind_alignment * (mean_neighbor_risk / 1.5)

    utci_c = prof["utci"] + (2.0 if is_emergency else 0.0) + min(4.0, 0.4 * weight)
    temp_grad_1h = prof["grad1"]
    temp_grad_3h = prof["grad3"]
    rel_humidity = prof["rh"]
    wind_speed_kmh = prof["wind"]

    # Matches FEATURE_COLUMNS in ml/train_propagation.py
    x_prop = [
        utci_c,
        temp_grad_1h,
        temp_grad_3h,
        rel_humidity,
        wind_speed_kmh,
        upwind_advection_score,
        max_upwind_alignment,
        mean_neighbor_risk,
        urban_density,
        vulnerability_weight,
        crowd_density,
    ]
    # Matches ISOLATION_FOREST_FEATURES in ml/train_propagation.py
    x_iso = [
        utci_c,
        temp_grad_1h,
        rel_humidity,
        wind_speed_kmh,
        crowd_density,
    ]
    return x_prop, x_iso


def predict_hazard_ml(
    disaster_type: str,
    active_report_count: int,
    total_weight: float,
    lat: float,
    lng: float,
    is_emergency: bool = False,
) -> Dict[str, Any]:
    """Predict +1h/+2h/+3h hazard risks, anomaly flag/score, and priority score."""
    bundle = _load_bundle()
    count = max(0, int(active_report_count))
    weight = max(0.0, float(total_weight))

    if bundle is not None:
        try:
            import numpy as np

            x_prop_list, x_iso_list = _build_feature_vectors(
                disaster_type=disaster_type,
                active_report_count=count,
                total_weight=weight,
                lat=lat,
                lng=lng,
                is_emergency=is_emergency,
            )
            x_prop = np.asarray([x_prop_list], dtype=float)
            x_iso = np.asarray([x_iso_list], dtype=float)

            models = bundle["models"]
            risk_1h = round(_clip(float(models["1h"].predict(x_prop)[0]), 0.0, 100.0), 2)
            risk_2h = round(_clip(float(models["2h"].predict(x_prop)[0]), 0.0, 100.0), 2)
            risk_3h = round(_clip(float(models["3h"].predict(x_prop)[0]), 0.0, 100.0), 2)

            iso_forest = bundle["iso_forest"]
            iso_pred = int(iso_forest.predict(x_iso)[0])
            anomaly_score = round(float(iso_forest.decision_function(x_iso)[0]), 4)
            anomaly_flag = iso_pred == -1

            priority_score = round(
                _clip(
                    0.50 * risk_1h
                    + 0.25 * risk_2h
                    + min(15.0, weight * 2.5)
                    + (15.0 if is_emergency else 0.0)
                    + (10.0 if anomaly_flag else 0.0),
                    0.0,
                    100.0,
                ),
                2,
            )

            return {
                "ml_active": True,
                "risk_1h": risk_1h,
                "risk_2h": risk_2h,
                "risk_3h": risk_3h,
                "anomaly_flag": anomaly_flag,
                "anomaly_score": anomaly_score,
                "priority_score": priority_score,
            }
        except Exception:
            pass

    # Deterministic fallback when ML artifact or packages are unavailable
    base = _clip(
        20.0 + weight * 8.0 + count * 3.0 + (15.0 if is_emergency else 0.0),
        0.0,
        95.0,
    )
    risk_1h = round(_clip(base, 0.0, 100.0), 2)
    risk_2h = round(_clip(base * 0.95 + 2.0, 0.0, 100.0), 2)
    risk_3h = round(_clip(base * 0.90 + 3.0, 0.0, 100.0), 2)
    anomaly_flag = bool(is_emergency or weight >= 8.0 or count >= 5)
    anomaly_score = round(-0.15 if anomaly_flag else 0.15, 4)
    priority_score = round(
        _clip(
            risk_1h * 0.70 + (20.0 if is_emergency else 0.0) + (10.0 if anomaly_flag else 0.0),
            0.0,
            100.0,
        ),
        2,
    )
    return {
        "ml_active": False,
        "risk_1h": risk_1h,
        "risk_2h": risk_2h,
        "risk_3h": risk_3h,
        "anomaly_flag": anomaly_flag,
        "anomaly_score": anomaly_score,
        "priority_score": priority_score,
    }
