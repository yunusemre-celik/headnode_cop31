import json
from pathlib import Path

import httpx
import joblib
import numpy as np
import pandas as pd

from ml.fetch_history import HOURLY_VARIABLES, fetch_historical_weather
from ml.train_propagation import (
    FEATURE_COLUMNS,
    ISOLATION_FOREST_FEATURES,
    train_and_save_models,
)


def test_train_and_save_models_produces_valid_artifacts(tmp_path):
    model_path = tmp_path / "xgb_propagation.joblib"
    metrics_path = tmp_path / "training_metrics.json"
    metrics = train_and_save_models(
        weather_csv="data/antalya_weather_5y.csv",
        nodes_csv="data/antalya_nodes.csv",
        edges_csv="data/antalya_edges.csv",
        model_out=str(model_path),
        metrics_out=str(metrics_path),
        max_rows=2000,
    )
    assert model_path.exists()
    assert metrics_path.exists()
    bundle = joblib.load(model_path)
    assert set(bundle["models"].keys()) == {"1h", "2h", "3h"}
    assert bundle["feature_columns"] == FEATURE_COLUMNS
    assert "iso_forest" in bundle
    sample = np.zeros((1, len(FEATURE_COLUMNS)))
    pred = bundle["models"]["2h"].predict(sample)
    assert 0.0 <= float(pred[0]) <= 100.0
    assert metrics["2h"]["rmse"] < 15.0

    # IsolationForest accepts meteorological + crowd features
    iso_sample = np.zeros((1, len(ISOLATION_FOREST_FEATURES)))
    iso_pred = bundle["iso_forest"].predict(iso_sample)
    assert iso_pred[0] in (-1, 1)


def test_fetch_historical_weather_synthetic_fallback_on_network_error(tmp_path, monkeypatch):
    def _fail_get(*args, **kwargs):
        raise httpx.ConnectError("offline")

    monkeypatch.setattr(httpx.Client, "get", _fail_get)
    out_csv = tmp_path / "weather.csv"
    written_path, source, count = fetch_historical_weather(
        output_path=out_csv,
        start_date="2024-07-01",
        end_date="2024-07-05",
    )
    assert written_path == out_csv
    assert source == "synthetic-fallback"
    assert count == 5 * 24
    df = pd.read_csv(out_csv)
    assert list(df.columns) == ["time", *HOURLY_VARIABLES]
    assert not df.isna().any().any()
