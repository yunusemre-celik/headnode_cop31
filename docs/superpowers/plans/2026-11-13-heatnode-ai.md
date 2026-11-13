# HEATNODE AI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a zero-cost, end-to-end working prototype of HEATNODE AI (Antalya 24-node graph, Open-Meteo + UTCI ingestion, 3-stage ML pipeline with DBSCAN/IsolationForest, XGBoost+SHAP, Weighted K-Means, FastAPI backend, and React/Leaflet Citizen View + Crisis Console) within 48 hours.

**Architecture:** A Python FastAPI backend (`backend/`) serves the 3-stage ML pipeline (`ml/` + `backend/pipeline.py`), Open-Meteo weather ingestion with offline fallback (`backend/weather.py`), and SQLite state (`backend/db.py`). A React + Vite + Tailwind + Leaflet frontend (`frontend/`) consumes the REST API to render both the mobile-first 1-tap Citizen View and the interactive Antalya Crisis Console.

**Tech Stack:** Python 3.14, FastAPI, Uvicorn, Scikit-Learn, XGBoost, SHAP, Pandas, NumPy, SQLite, Pytest; Node 24, React 18, Vite, Tailwind CSS, Leaflet (`react-leaflet`), Recharts, Lucide-React, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-13-heatnode-ai-design.md`

## Global Constraints

- Cost: Strictly $0 (Open-Meteo free API, OpenStreetMap/CartoDB free tiles, SQLite, local/free-tier hosting).
- Privacy (KVKK / GDPR): Zero GPS coordinates, zero user accounts, zero phone numbers, zero IP logging; crowd inputs aggregated strictly at `node_id` level.
- No black-box alerts: Unverified individual reports never trigger public alerts; activation requires Stage 1 verification AND human sign-off (`ACTIVE` state) before Citizen View displays active alerts or dynamic hubs.
- Language: All code, comments, datasets, API payloads, UI copy, and documentation must be in English.
- Offline resilience: Weather ingestion and historical training must support cached/fallback data so a network outage never breaks the live demo.

## Review Focus

1. **Open-Meteo network failure/timeout during live demo:** `fetch_live_weather()` must catch HTTP/timeout errors and return `data/fallback_weather.json` with `source: "fallback"` instead of raising 500.
2. **Invalid `node_id` or `category` in `POST /report`:** Must reject unknown `node_id` or `category` with HTTP 422 and never write invalid rows to SQLite.
3. **Zero-report baseline state in ML pipeline:** `run_stage1_anomaly()` and `run_stage3_hubs()` must handle 0 reports without empty-array exceptions in DBSCAN, Isolation Forest, or K-Means.
4. **Out-of-bounds `hub_count` in `POST /approve-alert`:** `hub_count` outside `1..5` must be rejected with HTTP 422 (or clamped cleanly per schema).
5. **Public alert gating leak:** When `alert_state.status != "ACTIVE"`, `GET /state` must mark `public_alert_active: false` and `CitizenView` must not render emergency evacuation/hub routing banners.

---

### Task 1: Project Scaffolding, Git Init & Antalya Neighborhood Graph

**Files:**
- Create: `.gitignore`
- Create: `requirements.txt`
- Create: `data/antalya_nodes.csv`
- Create: `data/antalya_edges.csv`
- Create: `backend/__init__.py`
- Create: `backend/graph.py`
- Test: `tests/test_graph.py`

**Interfaces:**
- Consumes: `data/antalya_nodes.csv`, `data/antalya_edges.csv`
- Produces:
  - `NodeRecord` (TypedDict/dataclass: `node_id`, `name`, `district`, `lat`, `lon`, `safe_intersection_name`, `urban_density`, `vulnerability_weight`, `population_weight`, `elevation_m`)
  - `EdgeRecord` (TypedDict/dataclass: `source_id`, `target_id`, `distance_km`, `bearing_deg`)
  - `AntalyaGraph` class in `backend/graph.py` with `load_graph(nodes_path, edges_path) -> AntalyaGraph`, `nodes: dict[str, NodeRecord]`, `edges: list[EdgeRecord]`, `incoming_edges(node_id: str) -> list[EdgeRecord]`, `haversine_km(lat1, lon1, lat2, lon2) -> float`

- [ ] **Step 1: Initialize git repository and create `.gitignore` + `requirements.txt`**

Run: `git init` and write `.gitignore` (ignoring `__pycache__/`, `.venv/`, `*.pyc`, `heatnode.db`, `frontend/node_modules/`, `frontend/dist/`, `.superpowers/`) and `requirements.txt` (`fastapi`, `uvicorn[standard]`, `pydantic`, `httpx`, `pandas`, `numpy`, `scikit-learn`, `xgboost`, `shap`, `joblib`, `pytest`).

- [ ] **Step 2: Create curated 24-node Antalya dataset (`data/antalya_nodes.csv` and `data/antalya_edges.csv`)**

Create 24 geographically accurate neighborhoods: 8 in `Muratpaşa`, 10 in `Kepez`, 6 in `Konyaaltı`, each with real Antalya coordinates (lat ~36.85–36.96, lon ~30.60–30.78), `safe_intersection_name`, `urban_density` (0.2–0.95), `vulnerability_weight` (0.2–0.95), `population_weight` (sum = 1.0 or positive weights), `elevation_m`. Create bidirectional `antalya_edges.csv` connecting geographically adjacent nodes with accurate `distance_km` and `bearing_deg` (0–360°).

- [ ] **Step 3: Write the failing test (`tests/test_graph.py`)**

```python
from backend.graph import load_graph, haversine_km

def test_load_graph_counts_and_districts():
    graph = load_graph("data/antalya_nodes.csv", "data/antalya_edges.csv")
    assert len(graph.nodes) == 24
    districts = [n["district"] for n in graph.nodes.values()]
    assert districts.count("Muratpaşa") == 8
    assert districts.count("Kepez") == 10
    assert districts.count("Konyaaltı") == 6
    assert len(graph.edges) >= 48
    for edge in graph.edges:
        assert edge["source_id"] in graph.nodes
        assert edge["target_id"] in graph.nodes
        assert 0.0 < edge["distance_km"] < 25.0
        assert 0.0 <= edge["bearing_deg"] < 360.0
```

- [ ] **Step 4: Run test to verify it fails**

Run: `pytest tests/test_graph.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'backend.graph'`

- [ ] **Step 5: Implement `backend/graph.py`**

Implement `haversine_km`, `AntalyaGraph`, and `load_graph` reading both CSVs with `csv.DictReader` and validating node/edge integrity.

- [ ] **Step 6: Run test to verify it passes**

Run: `pytest tests/test_graph.py -v`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add .gitignore requirements.txt data/antalya_nodes.csv data/antalya_edges.csv backend/__init__.py backend/graph.py tests/test_graph.py
git commit -m "feat: initialize project and 24-node Antalya neighborhood graph"
```

---

### Task 2: Open-Meteo Weather Ingestion, Offline Fallback & UTCI Thermal Stress

**Files:**
- Create: `data/fallback_weather.json`
- Create: `backend/weather.py`
- Test: `tests/test_weather.py`

**Interfaces:**
- Consumes: Open-Meteo Forecast API (`https://api.open-meteo.com/v1/forecast`), `data/fallback_weather.json`
- Produces:
  - `compute_utci(temp_c: float, rel_humidity: float, wind_speed_ms: float, solar_radiation_wm2: float) -> float`
  - `utci_category(utci_c: float) -> str` (`"No Thermal Stress"` | `"Moderate Heat Stress"` | `"Strong Heat Stress"` | `"Very Strong Heat Stress"` | `"Extreme Heat Stress"`)
  - `WeatherSnapshot` dict: `temperature_c`, `relative_humidity`, `wind_speed_kmh`, `wind_direction_deg`, `solar_radiation_wm2`, `utci_c`, `stress_category`, `source` (`"open-meteo"` | `"fallback"` | `"simulation"`), `timestamp`
  - `WeatherService` class with `get_current_weather(force_fallback: bool = False) -> WeatherSnapshot` (15-min TTL cache)

- [ ] **Step 1: Create `data/fallback_weather.json`**

Provide realistic Antalya summer baseline weather JSON (`temperature_c: 36.4`, `relative_humidity: 48`, `wind_speed_kmh: 12.5`, `wind_direction_deg: 215`, `solar_radiation_wm2: 780.0`).

- [ ] **Step 2: Write the failing test (`tests/test_weather.py`)**

```python
from backend.weather import compute_utci, utci_category, WeatherService

def test_utci_extreme_heat_and_category():
    utci = compute_utci(temp_c=45.0, rel_humidity=45.0, wind_speed_ms=2.0, solar_radiation_wm2=850.0)
    assert utci >= 46.0
    assert utci_category(utci) == "Extreme Heat Stress"

def test_weather_service_fallback_on_network_error(monkeypatch):
    def broken_get(*args, **kwargs):
        raise RuntimeError("network down")
    monkeypatch.setattr("httpx.get", broken_get)
    svc = WeatherService(fallback_path="data/fallback_weather.json")
    snap = svc.get_current_weather()
    assert snap["source"] == "fallback"
    assert "utci_c" in snap
    assert snap["stress_category"] in {
        "No Thermal Stress", "Moderate Heat Stress", "Strong Heat Stress",
        "Very Strong Heat Stress", "Extreme Heat Stress"
    }
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pytest tests/test_weather.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'backend.weather'`

- [ ] **Step 4: Implement `backend/weather.py`**

Implement `compute_utci` (using standard Steadman/UTCI-proxy mean radiant temperature adjustment from `solar_radiation_wm2`, vapor pressure from `rel_humidity`, and wind cooling from `wind_speed_ms`), `utci_category` using standard UTCI thresholds (`<26`, `26–32`, `32–38`, `38–46`, `>=46`), and `WeatherService` with `httpx.get(..., timeout=5.0)` + 15-minute TTL cache + automatic fallback to `data/fallback_weather.json`.

- [ ] **Step 5: Run test to verify it passes**

Run: `pytest tests/test_weather.py -v`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add data/fallback_weather.json backend/weather.py tests/test_weather.py
git commit -m "feat: add Open-Meteo weather service with offline fallback and UTCI calculation"
```

---

### Task 3: 5-Year Historical Weather Fetcher & XGBoost Propagation Trainer

**Files:**
- Create: `ml/__init__.py`
- Create: `ml/fetch_history.py`
- Create: `ml/train_propagation.py`
- Create: `data/antalya_weather_5y.csv` (generated by script)
- Create: `ml/artifacts/xgb_propagation.joblib` (generated by script)
- Create: `ml/artifacts/training_metrics.json` (generated by script)
- Test: `tests/test_ml_training.py`

**Interfaces:**
- Consumes: `backend.graph.load_graph`, `backend.weather.compute_utci`, Open-Meteo Archive API (`https://archive-api.open-meteo.com/v1/archive`)
- Produces:
  - `FEATURE_COLUMNS: list[str]` = `["utci_c", "temp_grad_1h", "temp_grad_3h", "rel_humidity", "wind_speed_kmh", "upwind_advection_score", "max_upwind_alignment", "mean_neighbor_risk", "urban_density", "vulnerability_weight", "crowd_density"]`
  - `ml/artifacts/xgb_propagation.joblib`: dict with `{"models": {"1h": XGBRegressor, "2h": XGBRegressor, "3h": XGBRegressor}, "feature_columns": FEATURE_COLUMNS, "iso_forest": IsolationForest}`
  - `ml/artifacts/training_metrics.json`: RMSE and R² for `1h`, `2h`, `3h` models.

- [ ] **Step 1: Write the failing test (`tests/test_ml_training.py`)**

```python
import json
from pathlib import Path
import joblib
import numpy as np
from ml.train_propagation import FEATURE_COLUMNS, train_and_save_models

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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/test_ml_training.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'ml.train_propagation'`

- [ ] **Step 3: Implement `ml/fetch_history.py` and run it to generate `data/antalya_weather_5y.csv`**

Fetch 5 years of hourly Antalya data (`2021-11-01` to `2026-11-01`) from Open-Meteo Archive API (`temperature_2m`, `relative_humidity_2m`, `wind_speed_10m`, `wind_direction_10m`, `shortwave_radiation`). Include a physics-consistent seasonal synthetic generator fallback if the archive API is unreachable so the script always produces `data/antalya_weather_5y.csv`.

- [ ] **Step 4: Implement `ml/train_propagation.py`**

Build fixed-width node-hour feature vectors (`FEATURE_COLUMNS`), including `upwind_advection_score`, `max_upwind_alignment`, `mean_neighbor_risk`, and augmented `crowd_density`; train `XGBRegressor` models for `+1h`, `+2h`, `+3h` risk targets (`0–100`) and `IsolationForest` on meteorological + crowd burst features; save `ml/artifacts/xgb_propagation.joblib` and `ml/artifacts/training_metrics.json`.

- [ ] **Step 5: Run training script and `pytest tests/test_ml_training.py -v`**

Run: `python -m ml.fetch_history && python -m ml.train_propagation && pytest tests/test_ml_training.py -v`
Expected: PASS, artifacts created in `ml/artifacts/`.

- [ ] **Step 6: Commit**

```bash
git add ml/__init__.py ml/fetch_history.py ml/train_propagation.py ml/artifacts/training_metrics.json tests/test_ml_training.py
git commit -m "feat: add 5-year Open-Meteo history fetcher and XGBoost propagation trainer"
```
*(Note: If `data/antalya_weather_5y.csv` or `xgb_propagation.joblib` are large, keep `xgb_propagation.joblib` committed if <10MB so the app runs out-of-the-box, or document regeneration; check size first.)*

---

### Task 4: 3-Stage ML Inference Pipeline (`backend/pipeline.py`)

**Files:**
- Create: `backend/pipeline.py`
- Test: `tests/test_pipeline.py`

**Interfaces:**
- Consumes: `AntalyaGraph`, `WeatherSnapshot`, `ml/artifacts/xgb_propagation.joblib`
- Produces:
  - `HeatnodePipeline` class with `evaluate(weather: WeatherSnapshot, reports: list[dict], hub_count: int = 3) -> dict`
  - Returns dict with:
    - `node_states`: list of 24 dicts (`node_id`, `name`, `district`, `lat`, `lon`, `report_count`, `verified_anomaly`, `risk_now`, `risk_1h`, `risk_2h`, `risk_3h`, `threshold_prob_2h`, `shap_drivers`: `[{"driver": str, "impact": float}]`)
    - `propagation_edges`: list of active directed edges (`source_id`, `target_id`, `source_lat`, `source_lon`, `target_lat`, `target_lon`, `alignment`, `source_risk`)
    - `hubs`: list of `K` hub dicts (`hub_id`, `name`, `node_id`, `district`, `lat`, `lon`, `assigned_nodes`, `hub_type`)
    - `nearest_hub_by_node`: `dict[str, dict]` (`hub_id`, `name`, `distance_km`)
    - `any_verified_anomaly`: `bool`

- [ ] **Step 1: Write the failing test (`tests/test_pipeline.py`)**

```python
from datetime import datetime, timezone
from backend.graph import load_graph
from backend.weather import compute_utci
from backend.pipeline import HeatnodePipeline

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

def test_pipeline_surge_triggers_anomaly_shap_and_hubs():
    graph = load_graph("data/antalya_nodes.csv", "data/antalya_edges.csv")
    pipe = HeatnodePipeline(graph, "ml/artifacts/xgb_propagation.joblib")
    kepez_nodes = [nid for nid, n in graph.nodes.items() if n["district"] == "Kepez"][:2]
    now = datetime.now(timezone.utc).isoformat()
    reports = [{"node_id": kepez_nodes[0], "category": "extreme_heat", "created_at": now} for _ in range(30)]
    reports += [{"node_id": kepez_nodes[1], "category": "power_water_outage", "created_at": now} for _ in range(12)]
    out = pipe.evaluate(_hot_weather(), reports=reports, hub_count=3)
    assert out["any_verified_anomaly"] is True
    flagged = [n for n in out["node_states"] if n["verified_anomaly"]]
    assert len(flagged) >= 1
    assert len(flagged[0]["shap_drivers"]) >= 3
    assert len(out["hubs"]) == 3
    assert len(out["nearest_hub_by_node"]) == 24
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/test_pipeline.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'backend.pipeline'`

- [ ] **Step 3: Implement `backend/pipeline.py`**

Implement:
- Stage 1: Spatial-temporal DBSCAN (`eps=0.015`, `min_samples=10`) with intra-neighborhood deterministic-free jitter (`~0.002` deg) + Isolation Forest anomaly score check.
- Stage 2: Build `FEATURE_COLUMNS` for all 24 nodes, run XGBoost `1h`/`2h`/`3h` predictions, compute `shap.TreeExplainer` values grouped into 4 readable physical drivers (`Wind Vector Alignment`, `Urban Heat Retention`, `Crowd Report Density`, `Solar & Thermal Gradient`), and extract `propagation_edges` where `risk_u >= 65` and `cos(wind_dir - bearing) >= 0.5`.
- Stage 3: Weighted K-Means (`KMeans(n_clusters=k, n_init=10, random_state=42)`) using `sample_weight = predicted_risk_2h * vulnerability_weight * population_weight`, snapping each centroid to nearest node's `safe_intersection_name`, and computing `nearest_hub_by_node`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest tests/test_pipeline.py -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/pipeline.py tests/test_pipeline.py
git commit -m "feat: implement 3-stage ML inference pipeline (DBSCAN, XGBoost+SHAP, Weighted K-Means)"
```

---

### Task 5: SQLite Persistence, Alert Lifecycle & FastAPI Endpoints

**Files:**
- Create: `backend/db.py`
- Create: `backend/main.py`
- Test: `tests/test_api.py`

**Interfaces:**
- Consumes: `AntalyaGraph`, `WeatherService`, `HeatnodePipeline`
- Produces:
  - `Database` in `backend/db.py` (`init_db()`, `insert_report(node_id, category)`, `insert_bulk_reports(reports)`, `get_recent_reports(minutes=20)`, `clear_reports()`, `get_alert_state()`, `set_alert_state(status, hub_count, approved_by=None)`)
  - FastAPI app in `backend/main.py` exposing `GET /health`, `GET /state`, `POST /report`, `POST /simulate-surge`, `POST /reset-demo`, `POST /approve-alert`

- [ ] **Step 1: Write the failing test (`tests/test_api.py`)**

```python
from fastapi.testclient import TestClient
from backend.main import create_app

def test_health_and_baseline_state(tmp_path):
    app = create_app(db_path=str(tmp_path / "test.db"), force_fallback_weather=True)
    client = TestClient(app)
    assert client.get("/health").status_code == 200
    state = client.get("/state").json()
    assert state["alert_state"]["status"] == "MONITORING"
    assert state["public_alert_active"] is False
    assert len(state["node_states"]) == 24

def test_invalid_report_returns_422(tmp_path):
    app = create_app(db_path=str(tmp_path / "test.db"), force_fallback_weather=True)
    client = TestClient(app)
    res = client.post("/report", json={"node_id": "INVALID_NODE", "category": "extreme_heat"})
    assert res.status_code == 422

def test_simulate_surge_pending_and_approve_flow(tmp_path):
    app = create_app(db_path=str(tmp_path / "test.db"), force_fallback_weather=True)
    client = TestClient(app)
    sim = client.post("/simulate-surge")
    assert sim.status_code == 200
    state = client.get("/state").json()
    assert state["alert_state"]["status"] == "PENDING_APPROVAL"
    assert state["public_alert_active"] is False
    assert state["any_verified_anomaly"] is True

    out_of_bounds = client.post("/approve-alert", json={"approved": True, "hub_count": 99})
    assert out_of_bounds.status_code == 422

    ok = client.post("/approve-alert", json={"approved": True, "hub_count": 3})
    assert ok.status_code == 200
    active_state = client.get("/state").json()
    assert active_state["alert_state"]["status"] == "ACTIVE"
    assert active_state["public_alert_active"] is True
    assert len(active_state["hubs"]) == 3

    client.post("/reset-demo")
    reset_state = client.get("/state").json()
    assert reset_state["alert_state"]["status"] == "MONITORING"
    assert reset_state["public_alert_active"] is False
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/test_api.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'backend.main'`

- [ ] **Step 3: Implement `backend/db.py` and `backend/main.py`**

Implement SQLite persistence with strict zero-PII schema (`id`, `node_id`, `category`, `created_at` — no IP, no user ID, no GPS). Implement `create_app(...)` factory and default `app = create_app()` instance. In `POST /simulate-surge`, inject 42 reports into Kepez nodes and temporarily override weather to the 45°C NE-directed Antalya demo heatwave until `POST /reset-demo`. Automatically transition `MONITORING -> PENDING_APPROVAL` whenever `any_verified_anomaly` is true.

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest tests/test_api.py -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/db.py backend/main.py tests/test_api.py
git commit -m "feat: add SQLite persistence, alert lifecycle state machine, and FastAPI endpoints"
```

---

### Task 6: Frontend GIS App — Citizen View & Crisis Console (`frontend/`)

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/index.html`
- Create: `frontend/vite.config.js`
- Create: `frontend/tailwind.config.js`
- Create: `frontend/postcss.config.js`
- Create: `frontend/src/main.jsx`
- Create: `frontend/src/index.css`
- Create: `frontend/src/api.js`
- Create: `frontend/src/components/CitizenView.jsx`
- Create: `frontend/src/components/CrisisConsole.jsx`
- Create: `frontend/src/App.jsx`
- Test: `frontend/src/App.test.jsx`

**Interfaces:**
- Consumes: Backend REST API (`GET /state`, `POST /report`, `POST /simulate-surge`, `POST /reset-demo`, `POST /approve-alert`) via `VITE_API_URL` (default `http://localhost:8000`)
- Produces: Single-page React app with `Citizen View` and `Crisis Console` modes, interactive Leaflet map (CartoDB/OSM tiles), SHAP driver bar chart, AFAD/MGM guidance panel, and demo controls.

- [ ] **Step 1: Scaffold Vite + React + Tailwind + Leaflet + Recharts + Vitest in `frontend/`**

Run `npm create vite@latest` or create `frontend/package.json` and run `npm install` (`react`, `react-dom`, `leaflet`, `react-leaflet`, `recharts`, `lucide-react`, `tailwindcss`, `@tailwindcss/vite` or PostCSS Tailwind, `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`).

- [ ] **Step 2: Write `frontend/src/api.js`**

Implement typed/clean fetch wrappers for `fetchState()`, `submitReport(nodeId, category)`, `simulateSurge()`, `resetDemo()`, `approveAlert(approved, hubCount)`.

- [ ] **Step 3: Write the failing test (`frontend/src/App.test.jsx`)**

Test that:
1. `App` renders top navigation with `Citizen View`, `Crisis Console`, and `Simulate Crowd Surge` button.
2. When `public_alert_active` is `false`, `CitizenView` shows `"Monitoring — No Active Emergency Alert"` and does NOT show an active emergency hub evacuation banner.
3. When `public_alert_active` is `true`, `CitizenView` displays the active alert banner and nearest Safe Hub details.

- [ ] **Step 4: Run Vitest to verify it fails**

Run: `cd frontend && npx vitest run`
Expected: FAIL

- [ ] **Step 5: Implement `CitizenView.jsx`, `CrisisConsole.jsx`, and `App.jsx`**

- `CitizenView.jsx`: Mobile-first 1-tap anonymous reporting (select neighborhood dropdown, 4 category buttons, privacy badge `"Zero GPS · Zero Login · KVKK/GDPR Compliant"`, instant report confirmation, gated public alert & nearest Safe Hub card + mini-map).
- `CrisisConsole.jsx`: Full Antalya Leaflet map with color-coded node circles, directional propagation arrows (`Polyline` + arrowhead markers) for `propagation_edges`, Safe Hub markers, time horizon selector (`Now`, `+1h`, `+2h`, `+3h`), right-hand inspector with SHAP horizontal bar chart (`Recharts`), DBSCAN verification badge, `K=1..5` hub count selector, `Approve & Activate Public Alert` button, and AFAD/MGM emergency guidance.

- [ ] **Step 6: Run Vitest and production build**

Run: `cd frontend && npx vitest run && npm run build`
Expected: PASS and clean `dist/` build.

- [ ] **Step 7: Commit**

```bash
git add frontend/
git commit -m "feat: build React/Leaflet Citizen View and Crisis Console frontend"
```

---

### Task 7: End-to-End Integration, Documentation & Free-Tier Deployment Config

**Files:**
- Create: `README.md`
- Create: `render.yaml`
- Create: `frontend/vercel.json`

- [ ] **Step 1: Write `README.md`, `render.yaml`, and `frontend/vercel.json`**

Document local quickstart (`uvicorn backend.main:app --reload` + `npm run dev`), 3-minute COP31 demo walkthrough, 3-stage ML architecture, privacy guarantees, and zero-cost deployment steps (Render Free Tier for FastAPI + Vercel Free Tier for React).

- [ ] **Step 2: Run full backend test suite + frontend tests + frontend build**

Run: `pytest -v && cd frontend && npx vitest run && npm run build`
Expected: All tests pass, build succeeds.

- [ ] **Step 3: Commit**

```bash
git add README.md render.yaml frontend/vercel.json
git commit -m "docs: add README and zero-cost Render/Vercel deployment configs"
```
