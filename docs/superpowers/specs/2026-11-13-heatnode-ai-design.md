# HEATNODE AI — System Design Document

**Date:** 2026-11-13  
**Project:** HEATNODE AI (AI for Climate Youth Hackathon & COP31 Antalya Showcase)  
**Target Timeline:** 48-hour working prototype  
**Language Policy:** All code, APIs, UI, datasets, and documentation in English.

---

## 1. Intent & Why

Extreme heatwaves and urban climate hazards (such as wildfire smoke plumes) do not affect a city uniformly. In Antalya (host city of COP31), official meteorological stations are sparse and miss street-level thermal pockets in dense concrete districts like Kepez and Muratpaşa. Meanwhile, citizens hesitate to use emergency apps that track GPS or personal identities, and municipalities lack a 1–3 hour predictive view of where hazards will shift next.

HEATNODE AI solves this with a zero-hardware, privacy-preserving early-warning and decision-support engine that fuses open meteorological data with anonymous neighborhood-level citizen reports, predicts 1–3 hour hazard propagation across city blocks, and allocates optimal mobile emergency response hubs while keeping human crisis managers in full control.

---

## 2. Goals, Non-Goals, and Anti-Goals

### Goals
- Deliver a fully working, end-to-end prototype within 48 hours at **zero infrastructure cost**.
- Implement the complete 3-stage ML pipeline:
  1. **Stage 1:** Spatial-temporal anomaly verification (**DBSCAN + Isolation Forest**)
  2. **Stage 2:** 1–3 hour neighborhood hazard propagation forecasting (**XGBoost Regressor + SHAP** explainability)
  3. **Stage 3:** Dynamic mobile response hub allocation (**Weighted K-Means**)
- Provide a live interactive web application with two modes:
  - **Citizen View:** 1-tap anonymous neighborhood reporting (no login, no GPS, no IP tracking) + nearest safe hub guidance.
  - **Crisis Console:** Live Antalya node map, propagation vectors, SHAP feature-importance breakdown, AFAD/MGM guidance, 1-click "Simulate Crowd Surge" demo mode, and human-in-the-loop alert approval.
- Train Stage 2 on real 5-year historical Antalya hourly weather data from Open-Meteo.

### Non-Goals
- Physical IoT sensor integration or raw satellite imagery (Landsat/Sentinel) preprocessing.
- User authentication, user accounts, push notifications, or mobile native apps (iOS/Android).
- Multi-city support beyond Antalya's three central districts (Muratpaşa, Kepez, Konyaaltı).

### Anti-Goals
- **No GPS or PII collection:** Never request browser geolocation, store IP addresses, or require accounts.
- **No black-box alerts:** Never trigger a public alert from a single unverified report or without SHAP drivers and human sign-off.
- **No paid APIs or GPU dependencies:** Must run smoothly on standard laptops and free cloud tiers.

---

## 3. Constraints

- **Cost:** Strictly \$0 (Open-Meteo free API, OpenStreetMap/CartoDB free map tiles, SQLite, Vercel/Render free tiers or local demo).
- **Privacy (KVKK / GDPR):** Crowd inputs are aggregated strictly at the neighborhood node level.
- **Reliability for Live Demo:** Must include an offline/fallback weather cache so a network hiccup during the 3-minute COP31 pitch never breaks the demo.
- **Language:** Everything in the repository (code, comments, UI, docs) must be in English.

---

## 4. Approaches Considered & Selected Architecture

### Approach A (Selected): FastAPI Backend + React/Vite/Leaflet Frontend
- **Backend:** Python FastAPI serving the ML pipeline, Open-Meteo ingestion, SQLite persistence, and REST endpoints.
- **Frontend:** React + Vite + Tailwind CSS + Leaflet (with free CartoDB/OSM tiles) providing a responsive, animated GIS dashboard and mobile-friendly Citizen View.
- **Trade-offs:** Requires two separate services (and CORS configuration), slightly more setup than a single-file Python app. However, it delivers smooth map animations (propagation vectors, dynamic hub markers), instant 1-tap mobile UX, and a polished COP31 showcase UI.

### Approach B (Rejected): Monolithic Streamlit App
- **Overview:** Single Python codebase using Streamlit + Folium/Pydeck.
- **Trade-offs:** Fastest initial scaffolding, single deployment. Rejected because Streamlit's full-script rerun model makes real-time map animations, propagation arrows, and responsive 1-tap mobile citizen reporting feel sluggish during a live 3-minute demo.

---

## 5. Technical Design & Data Flow

### 5.1 Antalya Neighborhood Graph (`data/`)
Since no pre-built dataset is provided, we will construct a curated, geographically accurate dataset for **24 neighborhood nodes** across **Muratpaşa (8), Kepez (10), and Konyaaltı (6)**:
- `data/antalya_nodes.csv`: `node_id`, `name`, `district`, `lat`, `lon`, `safe_intersection_name`, `urban_density` (0.0–1.0), `vulnerability_weight` (0.0–1.0), `population_weight` (normalized), `elevation_m`.
- `data/antalya_edges.csv`: `source_id`, `target_id`, `distance_km`, `bearing_deg` (direction from source to target, used for wind-vector alignment).

*(Design Call: Hubs represent mobile cooling buses, water stations, and medical units dispatched into high-risk areas, snapped to each neighborhood's designated `safe_intersection_name` / centroid rather than requiring a separate civic facilities dataset.)*

### 5.2 Open-Meteo Ingestion & UTCI Thermal Stress (`backend/weather.py`)
- Pulls hourly `temperature_2m`, `relative_humidity_2m`, `wind_speed_10m`, `wind_direction_10m`, and `shortwave_radiation` from Open-Meteo (`lat=36.8969, lon=30.7133`).
- Historical script (`ml/fetch_history.py`) fetches 5 years of hourly Antalya data (2021–2026) and caches it to `data/antalya_weather_5y.csv`.
- Live service fetches current/forecast weather with a 15-minute in-memory TTL cache and falls back to `data/fallback_weather.json` if offline.
- Computes an **Effective Thermal Stress Index (UTCI proxy)** combining air temperature, humidity, wind cooling, and solar radiation load, mapped to official thermal stress categories (Moderate, Strong, Very Strong, Extreme Heat Stress).

### 5.3 Three-Stage ML Pipeline (`ml/` & `backend/pipeline.py`)

#### Stage 1: Anomaly Verification & Spatial-Temporal Clustering (DBSCAN + Isolation Forest)
- **Addressing the GPS-less reporting constraint:** Because citizens select a `node_id` rather than sharing GPS, raw reports share node centroids.
  - For **clustering**, each report is represented in a spatial-temporal-meteorological feature space: `[node_lat + small_jitter, node_lon + small_jitter, minutes_ago_scaled]`, evaluated alongside node-level report burst rate.
  - **Isolation Forest** scores current meteorological conditions + report burst rate against historical baseline distributions to detect anomalous micro-climate spikes (e.g., sudden wind drop + high humidity + report surge).
  - A node is flagged as a **Verified Micro-Climate Anomaly** only when DBSCAN identifies a dense cluster (`min_samples >= 10` within a 20-minute window) AND Isolation Forest confirms meteorological/burst anomaly alignment.

#### Stage 2: Hazard Propagation Prediction (XGBoost Regressor + SHAP)
- **Fixed-Width Graph Feature Aggregation (Design Call):** Because neighborhoods have varying neighbor counts (1–5+ edges), incoming neighbor effects for node $v$ are aggregated into fixed-width tabular features:
  - `upwind_advection_score`: $\sum_{u \in N(v)} \max(0, \cos(\theta_{\text{wind}} - \theta_{u \to v})) \cdot \frac{\text{risk}_u}{\max(\text{dist}_{u,v}, 0.5)}$
  - `max_upwind_alignment`: $\max_{u \in N(v)} \cos(\theta_{\text{wind}} - \theta_{u \to v})$
  - `mean_neighbor_risk`: mean current risk of adjacent nodes.
- **Active Propagation Edge Contract (Design Call):** For `GET /state` and Crisis Console map arrows, a directed edge $(u \to v)$ is marked as an active propagation vector when `risk_u >= 65` (or `u` has a verified anomaly) AND $\cos(\theta_{\text{wind}} - \theta_{u \to v}) \ge 0.5$.
- **Training Data Generation (`ml/train_propagation.py`):** Uses the 5-year Open-Meteo Antalya hourly dataset combined with the 24-node graph. For each historical hour and node, we compute:
  - Current node UTCI, 1h/3h temperature gradient, relative humidity, wind speed, `upwind_advection_score`, `max_upwind_alignment`, `urban_density`, `vulnerability_weight`, and simulated/augmented crowd anomaly density.
  - Target labels: 1h, 2h, and 3h future node risk score (`0–100`, derived from future UTCI exceedance + upwind neighbor thermal advection + urban heat retention).
- **Inference & Explainability:** Outputs per-node risk predictions for `+1h`, `+2h`, `+3h`, threshold-crossing probability (`%`), and top **SHAP** (`TreeExplainer`) feature attributions grouped into human-readable physical drivers (e.g., `Wind Vector Alignment`, `Urban Heat Retention`, `Crowd Report Density`, `Solar & Thermal Gradient`).

#### Stage 3: Dynamic Hub Allocation (Weighted K-Means)
- Filters active/predicted high-risk nodes (or uses full risk surface weighted by `predicted_risk * vulnerability_weight * population_weight`).
- Runs Weighted K-Means (`n_clusters = K`, default `K=3`, configurable `1–5`) to compute optimal Safe Node coordinates for mobile cooling buses, water distribution points, and medical teams.
- Maps each cluster centroid to the nearest node's `safe_intersection_name` and assigns every neighborhood to its **nearest safe hub** with estimated distance (km).

### 5.4 Persistence & Alert Lifecycle State Machine (`backend/db.py`)
- Lightweight **SQLite** database (`heatnode.db`) storing:
  - `reports` (`id`, `node_id`, `category`, `created_at`) — strictly no IP, no user ID, no GPS.
  - `alert_state` (`id`, `status` [`MONITORING` | `PENDING_APPROVAL` | `ACTIVE`], `hub_count`, `approved_by`, `updated_at`).
- **Alert State Machine & Public Gating (Design Call):**
  - `MONITORING` → `PENDING_APPROVAL`: Automatically transitions whenever Stage 1 flags at least one Verified Micro-Climate Anomaly.
  - `PENDING_APPROVAL` → `ACTIVE`: Transitions only when a crisis manager explicitly signs off via `POST /approve-alert`.
  - **Public Visibility Gating:** Before `ACTIVE` status, Citizen View displays `"Monitoring — No Active Emergency Alert"` and shows baseline municipal cooling info without publishing unapproved emergency hubs. Once `ACTIVE`, Citizen View displays the active alert banner and routes citizens to the nearest approved dynamic Safe Hub. Crisis Console always previews recommended hubs and SHAP drivers so managers can review before approving.

### 5.5 FastAPI Contract (`backend/main.py`)
- `GET /health` → `{ "status": "ok" }`
- `GET /state` → Full snapshot: weather/UTCI, 24 nodes with current report counts, anomaly flags, `+1h/+2h/+3h` risk predictions, SHAP top drivers, propagation edges (active risk vectors), allocated hubs, and alert approval status.
- `POST /report` → Body: `{ "node_id": str, "category": "extreme_heat" | "power_water_outage" | "smoke_odor" | "vulnerable_assistance" }`. Returns `{ "accepted": true, "node_id": str, "nearest_hub": {...} }`.
- `POST /simulate-surge` → Injects the Antalya Demo Scenario: 42 anonymous reports in Kepez over a simulated 20-minute window + 45°C heatwave & NE wind conditions driving propagation toward Muratpaşa.
- `POST /reset-demo` → Clears simulated reports and resets alert state to `MONITORING`.
- `POST /approve-alert` → Body: `{ "approved": bool, "hub_count": int }`. Updates crisis manager sign-off and hub count.

### 5.6 Frontend Architecture (`frontend/`)
- **Tech:** React 18 + Vite + Tailwind CSS + `react-leaflet` / `leaflet` + `lucide-react` + `recharts` (for SHAP driver bars).
- **Top Navigation Bar:** Brand ("HEATNODE AI — Antalya COP31"), Live Weather/UTCI Pill, View Switcher (**Citizen View** | **Crisis Console**), Demo Controls (**Simulate Crowd Surge** | **Reset**).
- **Citizen View:**
  - Clean, mobile-first layout.
  - Step 1: Select Neighborhood (dropdown or tap on map).
  - Step 2: 4 large 1-tap category buttons (`Extreme Heat Stress`, `Power / Water Outage`, `Smoke / Odor`, `Vulnerable Person Assistance`).
  - Step 3: Instant confirmation + **Nearest Safe Hub** card (distance, hub type, AFAD/MGM safety tip) + mini-map.
  - Explicit privacy badge: *"Zero GPS · Zero Login · KVKK/GDPR Compliant"*.
- **Crisis Console:**
  - Interactive Antalya Leaflet map: color-coded neighborhood nodes (green → amber → red → pulsing critical), propagation directional arrows between high-risk connected nodes, and Safe Hub markers.
  - Time horizon selector (`Now`, `+1h`, `+2h`, `+3h`).
  - Right-hand inspector panel: Selected/Top-risk node details, **SHAP Physical Drivers** chart, DBSCAN Verification badge, Hub Allocation controls (`K = 1..5`), **Approve & Activate Public Alert** button, and AFAD/MGM emergency protocol snippet.

---

## 6. What Is Left to the Builder

- Exact selection of the 24 real Antalya neighborhood names and coordinates within Muratpaşa, Kepez, and Konyaaltı.
- Exact tuning of DBSCAN `eps`/`min_samples`, Isolation Forest `contamination`, and XGBoost hyperparameters to achieve clean, realistic demo behavior and fast inference (<150ms per `/state` call).
- Visual styling details (color palette, typography, responsive breakpoints) within the clean dark/light GIS dashboard aesthetic.
