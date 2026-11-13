"""XGBoost Hazard Propagation & Isolation Forest Trainer for HEATNODE AI."""

from __future__ import annotations

import json
import math
from pathlib import Path
from typing import Dict, List, Optional

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.metrics import r2_score, root_mean_squared_error
from xgboost import XGBRegressor

from backend.graph import load_graph
from backend.weather import compute_utci

FEATURE_COLUMNS: List[str] = [
    "utci_c",
    "temp_grad_1h",
    "temp_grad_3h",
    "rel_humidity",
    "wind_speed_kmh",
    "upwind_advection_score",
    "max_upwind_alignment",
    "mean_neighbor_risk",
    "urban_density",
    "vulnerability_weight",
    "crowd_density",
]

ISOLATION_FOREST_FEATURES: List[str] = [
    "utci_c",
    "temp_grad_1h",
    "rel_humidity",
    "wind_speed_kmh",
    "crowd_density",
]

HORIZONS: Dict[str, int] = {"1h": 1, "2h": 2, "3h": 3}


def build_training_dataset(
    weather_csv: str | Path = "data/antalya_weather_5y.csv",
    nodes_csv: str | Path = "data/antalya_nodes.csv",
    edges_csv: str | Path = "data/antalya_edges.csv",
    max_rows: Optional[int] = None,
    seed: int = 42,
) -> tuple[np.ndarray, Dict[str, np.ndarray]]:
    """Build node-hour feature matrix X and +1h/+2h/+3h risk targets from weather & graph."""
    graph = load_graph(nodes_csv, edges_csv)
    df = pd.read_csv(weather_csv)
    if max_rows is not None and len(df) > max_rows:
        df = df.iloc[:max_rows].reset_index(drop=True)

    if len(df) < 10:
        raise ValueError(f"Weather CSV has too few rows ({len(df)}) for propagation training")

    temp_c = df["temperature_2m"].to_numpy(dtype=float)
    rel_humidity = df["relative_humidity_2m"].to_numpy(dtype=float)
    wind_speed_kmh = df["wind_speed_10m"].to_numpy(dtype=float)
    wind_dir_deg = df["wind_direction_10m"].to_numpy(dtype=float)
    solar_wm2 = df["shortwave_radiation"].to_numpy(dtype=float)

    temp_grad_1h = df["temperature_2m"].diff(1).fillna(0.0).to_numpy(dtype=float)
    temp_grad_3h = df["temperature_2m"].diff(3).fillna(0.0).to_numpy(dtype=float)

    n_hours = len(df)
    base_utci = np.array(
        [
            compute_utci(temp_c[i], rel_humidity[i], wind_speed_kmh[i] / 3.6, solar_wm2[i])
            for i in range(n_hours)
        ],
        dtype=float,
    )

    node_ids = list(graph.nodes.keys())
    n_nodes = len(node_ids)
    node_idx = {nid: idx for idx, nid in enumerate(node_ids)}

    urban_density = np.array([graph.nodes[nid]["urban_density"] for nid in node_ids], dtype=float)
    vulnerability = np.array([graph.nodes[nid]["vulnerability_weight"] for nid in node_ids], dtype=float)
    population = np.array([graph.nodes[nid]["population_weight"] for nid in node_ids], dtype=float)
    elevation_m = np.array([graph.nodes[nid]["elevation_m"] for nid in node_ids], dtype=float)

    # Micro-climate node UTCI with urban heat island and elevation lapse rate
    node_utci = (
        base_utci[:, None]
        + 2.5 * urban_density[None, :]
        - 0.0065 * elevation_m[None, :]
    )

    # Augmented crowd anomaly density [0, 1], correlated with thermal stress & population
    rng = np.random.default_rng(seed)
    heat_stress_prob = np.clip((node_utci - 26.0) / 20.0, 0.0, 1.0)
    crowd_base = 0.08 * population[None, :] + 0.35 * heat_stress_prob * population[None, :]
    burst_mask = rng.random((n_hours, n_nodes)) < 0.015
    burst_add = np.where(burst_mask, rng.uniform(0.3, 0.7, size=(n_hours, n_nodes)), 0.0)
    crowd_density = np.clip(crowd_base + burst_add + rng.normal(0.0, 0.03, size=(n_hours, n_nodes)), 0.0, 1.0)

    # Instantaneous node risk [5, 100] (baseline floor prevents negative leaf undershoot)
    base_risk = np.clip(
        5.0
        + (node_utci - 15.0) / 33.0 * 65.0
        + urban_density[None, :] * 12.0
        + vulnerability[None, :] * 8.0
        + crowd_density * 10.0,
        5.0,
        100.0,
    )

    # Meteorological wind_direction_10m is direction wind blows FROM; advection goes TOWARDS (+180 deg)
    wind_to_rad = np.radians((wind_dir_deg + 180.0) % 360.0)

    upwind_advection = np.zeros((n_hours, n_nodes), dtype=float)
    max_alignment = np.zeros((n_hours, n_nodes), dtype=float)
    mean_neighbor_risk = np.zeros((n_hours, n_nodes), dtype=float)

    for j, nid in enumerate(node_ids):
        inc_edges = graph.incoming_edges(nid)
        if not inc_edges:
            continue
        neighbor_risk_sum = np.zeros(n_hours, dtype=float)
        for edge in inc_edges:
            src_i = node_idx[edge["source_id"]]
            dist_km = max(edge["distance_km"], 0.5)
            bearing_rad = math.radians(edge["bearing_deg"])
            align = np.maximum(0.0, np.cos(wind_to_rad - bearing_rad))
            upwind_advection[:, j] += align * (base_risk[:, src_i] / dist_km)
            max_alignment[:, j] = np.maximum(max_alignment[:, j], align)
            neighbor_risk_sum += base_risk[:, src_i]
        mean_neighbor_risk[:, j] = neighbor_risk_sum / float(len(inc_edges))

    # Align features at t with targets at t+1, t+2, t+3
    n_valid = n_hours - 3
    sl = slice(0, n_valid)

    feature_grid = np.stack(
        [
            node_utci[sl],
            np.broadcast_to(temp_grad_1h[sl, None], (n_valid, n_nodes)),
            np.broadcast_to(temp_grad_3h[sl, None], (n_valid, n_nodes)),
            np.broadcast_to(rel_humidity[sl, None], (n_valid, n_nodes)),
            np.broadcast_to(wind_speed_kmh[sl, None], (n_valid, n_nodes)),
            upwind_advection[sl],
            max_alignment[sl],
            mean_neighbor_risk[sl],
            np.broadcast_to(urban_density[None, :], (n_valid, n_nodes)),
            np.broadcast_to(vulnerability[None, :], (n_valid, n_nodes)),
            crowd_density[sl],
        ],
        axis=-1,
    )
    x_all = feature_grid.reshape(n_valid * n_nodes, len(FEATURE_COLUMNS))

    targets: Dict[str, np.ndarray] = {}
    for label, offset in HORIZONS.items():
        future_risk = base_risk[offset : n_valid + offset]
        advection_term = np.minimum(100.0, upwind_advection[sl] * 2.0)
        y_grid = np.clip(
            0.75 * future_risk + 0.15 * base_risk[sl] + 0.10 * advection_term,
            0.0,
            100.0,
        )
        targets[label] = y_grid.reshape(n_valid * n_nodes)

    return x_all, targets


def train_and_save_models(
    weather_csv: str | Path = "data/antalya_weather_5y.csv",
    nodes_csv: str | Path = "data/antalya_nodes.csv",
    edges_csv: str | Path = "data/antalya_edges.csv",
    model_out: str | Path = "ml/artifacts/xgb_propagation.joblib",
    metrics_out: str | Path = "ml/artifacts/training_metrics.json",
    max_rows: Optional[int] = None,
) -> Dict[str, Dict[str, float]]:
    """Train +1h/+2h/+3h XGBoost propagation models and IsolationForest, and save artifacts."""
    x_all, targets = build_training_dataset(
        weather_csv=weather_csv,
        nodes_csv=nodes_csv,
        edges_csv=edges_csv,
        max_rows=max_rows,
    )

    # Chronological 80/20 split
    split_idx = int(0.8 * len(x_all))
    x_train, x_val = x_all[:split_idx], x_all[split_idx:]

    models: Dict[str, XGBRegressor] = {}
    metrics: Dict[str, Dict[str, float]] = {}

    for label in ("1h", "2h", "3h"):
        y_all = targets[label]
        y_train, y_val = y_all[:split_idx], y_all[split_idx:]

        model = XGBRegressor(
            n_estimators=100,
            max_depth=4,
            learning_rate=0.08,
            subsample=0.9,
            colsample_bytree=1.0,
            reg_lambda=2.0,
            tree_method="hist",
            random_state=42,
            n_jobs=-1,
        )
        model.fit(x_train, y_train)
        preds = np.clip(model.predict(x_val), 0.0, 100.0)

        rmse = float(root_mean_squared_error(y_val, preds))
        r2 = float(r2_score(y_val, preds))
        models[label] = model
        metrics[label] = {
            "rmse": round(rmse, 4),
            "r2": round(r2, 4),
        }

    iso_indices = [FEATURE_COLUMNS.index(col) for col in ISOLATION_FOREST_FEATURES]
    iso_forest = IsolationForest(
        n_estimators=100,
        contamination=0.02,
        random_state=42,
        n_jobs=-1,
    )
    iso_forest.fit(x_train[:, iso_indices])

    model_path = Path(model_out)
    model_path.parent.mkdir(parents=True, exist_ok=True)
    bundle = {
        "models": models,
        "feature_columns": FEATURE_COLUMNS,
        "iso_forest": iso_forest,
    }
    joblib.dump(bundle, model_path, compress=3)

    metrics_path = Path(metrics_out)
    metrics_path.parent.mkdir(parents=True, exist_ok=True)
    with open(metrics_path, "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)

    return metrics


if __name__ == "__main__":
    results = train_and_save_models()
    print(f"Training complete. Metrics: {json.dumps(results, indent=2)}")
