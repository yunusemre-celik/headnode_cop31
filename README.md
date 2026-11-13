# HEATNODE AI — Antalya COP31 Urban Heat Crisis Twin

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Python 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/)
[![React 18](https://img.shields.io/badge/react-18.3.1-61dafb.svg)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.1.0-009688.svg)](https://fastapi.tiangolo.com/)
[![Zero-PII Privacy](https://img.shields.io/badge/Privacy-KVKK%20%2F%20GDPR%20Zero--PII-success.svg)](#privacy--zero-pii-guarantees-kvkk--gdpr)
[![Deploy on Render](https://img.shields.io/badge/Deploy%20Backend-Render%20Free-46E3B7.svg)](render.yaml)
[![Deploy on Vercel](https://img.shields.io/badge/Deploy%20Frontend-Vercel%20Free-black.svg)](frontend/vercel.json)

> **Antalya COP31 Showcase & AI for Climate Youth Hackathon**  
> A zero-hardware, privacy-preserving early-warning and decision-support twin that fuses open meteorological data with anonymous neighborhood-level citizen reports, predicts 1–3 hour urban heat hazard propagation across city blocks, and dynamically allocates mobile emergency cooling hubs while keeping municipal crisis managers in full control.

---

## Table of Contents

1. [Key Features](#key-features)
2. [Architecture & 3-Stage ML Pipeline](#architecture--3-stage-ml-pipeline)
3. [Antalya Neighborhood Graph](#antalya-neighborhood-graph)
4. [Privacy & Zero-PII Guarantees (KVKK / GDPR)](#privacy--zero-pii-guarantees-kvkk--gdpr)
5. [Local Quickstart](#local-quickstart)
6. [3-Minute COP31 Live Demo Walkthrough](#3-minute-cop31-live-demo-walkthrough)
7. [REST API Reference](#rest-api-reference)
8. [Zero-Cost Cloud Deployment (Render & Vercel)](#zero-cost-cloud-deployment-render--vercel)
9. [Verification & Test Suite](#verification--test-suite)
10. [Repository Structure](#repository-structure)

---

## Key Features

- **Zero-Hardware & Zero-Cost:** Requires no physical IoT sensor networks or paid APIs; uses free Open-Meteo weather data, OpenStreetMap/CartoDB tiles, SQLite, and free cloud hosting tiers.
- **Strict Privacy (Zero-PII):** No GPS tracking, no citizen login/registration, and no IP logging. Citizens report solely by selecting their neighborhood.
- **3-Stage Explainable ML Pipeline:**
  1. **Stage 1 (Anomaly Detection):** DBSCAN spatial-temporal clustering + Isolation Forest meteorological anomaly verification.
  2. **Stage 2 (Predictive Forecasting):** XGBoost Regressor trained on 5 years of Antalya hourly weather, forecasting +1h, +2h, and +3h hazard propagation with SHAP physics-grounded feature attributions.
  3. **Stage 3 (Resource Allocation):** Weighted K-Means dynamic cooling hub optimizer snapping to designated safe civic intersections.
- **Human-in-the-Loop (HITL) Alert Lifecycle:** Automated anomaly detection moves the system to `PENDING_APPROVAL`; public emergency alerts and safe hub guidance are only published once a municipal operator reviews and approves the alert.
- **Dual Interface:**
  - **Citizen View:** Mobile-first, 1-tap reporting with gated emergency guidance and safe hub routing.
  - **Crisis Console:** Interactive GIS dark-mode map, directional propagation vectors, SHAP driver bar charts, K-Means hub count controls, and official AFAD/MGM emergency protocols.
- **Zero-Downtime Demo Resilience:** Built-in offline weather cache guarantees a flawless pitch even during unstable conference Wi-Fi.

---

## Architecture & 3-Stage ML Pipeline

```
  +-------------------------------------------------------------+
  |                   METEOROLOGICAL INGESTION                  |
  |  Open-Meteo Live API / Offline Fallback (data/fallback.json)|
  |  Temperature, Humidity, Wind Speed/Direction, Solar Rad     |
  |  Effective Thermal Stress Calculator (UTCI Proxy)           |
  +------------------------------+------------------------------+
                                 |
                                 v
+-----------------------+   +----+--------------------------+
|  ANONYMOUS CITIZEN    |   | 24-NODE ANTALYA GRAPH         |
|  CROWD REPORTS        |   | Muratpaşa, Kepez, Konyaaltı   |
|  (Zero-PII, Node-only)|   | 92 Directed Edges (Dist/Bear) |
+-----------+-----------+   +----+--------------------------+
            |                    |
            +------------+-------+
                         |
                         v
  +-------------------------------------------------------------+
  | STAGE 1: SPATIO-TEMPORAL CLUSTERING & ANOMALY VERIFICATION   |
  | - DBSCAN: Identifies dense spatio-temporal report clusters  |
  | - Isolation Forest: Compares burst vs weather baseline      |
  | Result: Verified Micro-Climate Anomaly Flag                 |
  +------------------------------+------------------------------+
                                 |
                                 v
  +-------------------------------------------------------------+
  | STAGE 2: 1-3 HOUR HAZARD PROPAGATION FORECASTING (XGBoost)  |
  | - Wind-vector advection alignment with directed graph edges  |
  | - Urban density, demographic vulnerability, thermal inertia |
  | - Output: +1h, +2h, +3h risk scores (0-100) per node        |
  | - Explainability: SHAP TreeExplainer physical drivers        |
  +------------------------------+------------------------------+
                                 |
                                 v
  +-------------------------------------------------------------+
  | STAGE 3: DYNAMIC SAFE HUB ALLOCATION (Weighted K-Means)     |
  | - Weights: Predicted Risk * Vulnerability * Population      |
  | - Snapped to neighborhood safe civic intersections          |
  | - Nearest hub assignment with distance for all 24 nodes     |
  +------------------------------+------------------------------+
                                 |
                                 v
  +-------------------------------------------------------------+
  | HITL CRISIS MANAGER CONSOLE & GATED CITIZEN VIEW            |
  | - State Machine: MONITORING -> PENDING_APPROVAL -> ACTIVE   |
  | - Public emergency alert published ONLY on operator approval|
  +-------------------------------------------------------------+
```

### 1. Stage 1: Anomaly Verification (DBSCAN + Isolation Forest)
- **Addressing Centroid Clustering:** Because reports share neighborhood centroids (zero GPS), reports are evaluated in a scaled spatial-temporal-meteorological space `[lat + jitter, lon + jitter, time_scaled]`.
- **Dual Verification Filter:** A micro-climate anomaly is verified if and only if **both** conditions are satisfied:
  1. **DBSCAN** identifies a high-density cluster ($\ge 10$ reports within a 20-minute rolling window).
  2. **Isolation Forest** detects anomalous deviation from normal weather-to-report baseline ratios.
- Single isolated reports or noise cannot trigger false alarms.

### 2. Stage 2: Hazard Propagation Forecasting (XGBoost + SHAP)
- **Graph Feature Aggregation:** For each node $v$, incoming neighbor edges are aggregated into physics-grounded tabular features:
  - $\text{Upwind Advection Score} = \sum_{u \in N(v)} \max(0, \cos(\theta_{\text{wind}} - \theta_{u \to v})) \cdot \frac{\text{risk}_u}{\max(\text{dist}_{u,v}, 0.5)}$
  - $\text{Max Upwind Alignment} = \max_{u \in N(v)} \cos(\theta_{\text{wind}} - \theta_{u \to v})$
  - $\text{Mean Neighbor Risk} = \frac{1}{|N(v)|} \sum_{u \in N(v)} \text{risk}_u$
- **Trained on 5-Year Open-Meteo History:** `ml/train_propagation.py` trains on hourly Antalya weather data (2021–2026).
- **Active Propagation Vectors:** A directed edge $(u \to v)$ is flagged as an active propagation vector when $\text{risk}_u \ge 65$ (or $u$ is an anomaly) and $\cos(\theta_{\text{wind}} - \theta_{u \to v}) \ge 0.5$.
- **SHAP Physics Drivers:** Groups feature importance into clear, human-readable explanations:
  - `Wind Vector Alignment`
  - `Urban Heat Retention`
  - `Crowd Report Density`
  - `Solar & Thermal Gradient`

### 3. Stage 3: Dynamic Hub Allocation (Weighted K-Means)
- Allocates $K$ mobile cooling buses, water distribution trucks, and paramedic units (configurable $K=1 \dots 5$, default $K=3$).
- Weighted by `predicted_risk * vulnerability_weight * population_weight`.
- Snaps each cluster centroid to the nearest neighborhood's designated `safe_intersection_name` and assigns every neighborhood node to its nearest safe hub.

---

## Antalya Neighborhood Graph

The system models **24 high-priority neighborhoods** across Antalya's three central urban districts, connected by **92 directed topological edges**:

| District | Neighborhood Count | Example Nodes | Key Characteristics |
| :--- | :---: | :--- | :--- |
| **Kepez** | 10 | Dokuma, Fabrikalar, Yeşilyurt, Teomanpaşa, Zafer, Kültür | High urban density, low green canopy, high heat retention, vulnerable demographics |
| **Muratpaşa** | 8 | Muratpaşa Merkez, Meydankavağı, Şirinyalı, Fener, Gençlik | Commercial core, high traffic congestion, downwind of northern thermal corridors |
| **Konyaaltı** | 6 | Arapsuyu, Gürsu, Altınkum, Liman, Toros, Uncalı | Coastal sea-breeze microclimate, evacuation transit corridors |

---

## Privacy & Zero-PII Guarantees (KVKK / GDPR)

HEATNODE AI adheres to strict privacy-by-design principles:

1. **Zero GPS Tracking:** The application never requests browser geolocation permissions. Reports contain only the citizen-selected `node_id`.
2. **Zero Login or Accounts:** No registration, email, phone number, or social login is ever required.
3. **Zero IP or Device Fingerprinting:** The backend database schema (`heatnode.db`) records only:
   ```sql
   CREATE TABLE reports (
       id INTEGER PRIMARY KEY AUTOINCREMENT,
       node_id TEXT NOT NULL,
       category TEXT NOT NULL,
       created_at TEXT NOT NULL
   );
   ```
4. **Public Gating:** Public citizen alerts are never broadcast autonomously from raw crowd submissions; every alert requires algorithmic multi-point verification and human crisis operator authorization.

---

## Local Quickstart

### Prerequisites
- **Python 3.10+**
- **Node.js 18+** & **npm**

### 1. Clone & Setup Backend
```bash
# Clone the repository
git clone https://github.com/your-username/headnode_cop31.git
cd headnode_cop31

# Install Python dependencies
pip install -r requirements.txt

# Start the FastAPI backend
uvicorn backend.main:app --reload --port 8000
```
*The backend starts at `http://localhost:8000`. Database tables and ML models are loaded automatically.*

### 2. Setup & Start Frontend
In a new terminal window:
```bash
cd frontend

# Install Node dependencies
npm install

# Start Vite development server
npm run dev
```
*Open `http://localhost:5173` in your browser.*

---

## 3-Minute COP31 Live Demo Walkthrough

Follow this scripted 7-step sequence for an impactful live conference pitch:

```
[Step 1: Baseline]      ->  [Step 2: Surge]         ->  [Step 3: Anomaly Detected]
24 nodes green (normal)     Click "Simulate Surge"      DBSCAN + IF cluster confirmed
Alert: MONITORING           42 Kepez heat reports       Alert: PENDING_APPROVAL
                                                                 |
                                                                 v
[Step 6: Citizen View]  <-  [Step 5: Operator Sign-off] <- [Step 4: Propagation & SHAP]
Active alert banner live     Select K=3 Safe Hubs       XGBoost shows +1h/+2h/+3h vectors
Routes to nearest hub        Click "Approve & Activate" Inspect SHAP physics drivers
```

1. **Step 1: Baseline Monitoring**
   - View top nav: Antalya live weather and UTCI thermal category pill.
   - Show that all 24 nodes are in baseline/monitoring state.
   - Switch to **Citizen View**: Displays `"Monitoring — No Active Emergency Alert"`, with baseline municipal cooling info.
2. **Step 2: Trigger Simulated Heat Emergency Surge**
   - Click **"Simulate Crowd Surge"** in the top navigation bar.
   - Injects the Antalya COP31 crisis scenario: 42 anonymous reports across Kepez (`kepez_dokuma`, `kepez_fabrikalar`, `kepez_yesilyurt`, `kepez_teomanpasa`) during 45°C heatwave conditions with SW wind.
3. **Step 3: Algorithmic Verification & Human-in-the-Loop Gating**
   - Switch to **Crisis Console**.
   - Notice the system status shifts automatically to **`PENDING_APPROVAL`**.
   - Kepez nodes turn red; Stage 1 displays the verified micro-climate cluster badge.
   - Notice that Citizen View remains protected from unverified panic until municipal sign-off.
4. **Step 4: Inspect 1–3h Hazard Propagation & SHAP Explainability**
   - Toggle the time horizon tabs (**Now**, **+1h**, **+2h**, **+3h**).
   - Watch the animated dashed propagation vectors carry thermal hazard downwind from Kepez into adjacent Muratpaşa nodes.
   - Click on `kepez_dokuma`: Inspect the **SHAP Physical Drivers** chart breaking down *Wind Vector Alignment*, *Urban Heat Retention*, and *Crowd Burst Density*.
5. **Step 5: Dynamic Hub Allocation & Municipal Operator Approval**
   - In the right-hand crisis panel, adjust Safe Hub Count ($K=1 \dots 5$, default $K=3$).
   - Observe the optimal safe hub locations computed by Weighted K-Means.
   - Click **"Approve & Activate Public Alert"**.
   - System state transitions to **`ACTIVE`**.
6. **Step 6: Citizen View Emergency Routing**
   - Switch back to **Citizen View**.
   - The red **`ACTIVE HEAT EMERGENCY ALERT`** banner is now prominently visible.
   - Select any neighborhood (e.g. *Kepez Dokuma*) and submit a report.
   - The UI immediately renders the **Nearest Safe Cooling Hub** card with distance, designated intersection, and official AFAD/MGM safety advice.
7. **Step 7: Reset Demo**
   - Click **"Reset"** in the top navigation bar to clear reports and return the twin to baseline monitoring.

---

## REST API Reference

The backend provides the following REST endpoints:

### `GET /health`
Returns service health and graph node count.
```json
{
  "status": "ok",
  "nodes_loaded": 24
}
```

### `GET /state`
Returns the complete system snapshot:
```json
{
  "weather": {
    "temperature_c": 45.0,
    "relative_humidity": 48.0,
    "wind_speed_kmh": 18.0,
    "wind_direction_deg": 225.0,
    "solar_radiation_wm2": 950.0,
    "utci_c": 47.2,
    "stress_category": "Extreme Heat Stress",
    "source": "simulation",
    "timestamp": "2026-11-13T14:30:00Z"
  },
  "alert_state": {
    "id": 1,
    "status": "PENDING_APPROVAL",
    "hub_count": 3,
    "approved_by": null,
    "updated_at": "2026-11-13T14:30:00Z"
  },
  "public_alert_active": false,
  "any_verified_anomaly": true,
  "node_states": { "...": { "risk_now": 78, "pred_risk_1h": 84, "shap_drivers": [...] } },
  "propagation_edges": [ { "source": "kepez_dokuma", "target": "muratpasa_merkez", "wind_alignment": 0.82 } ],
  "hubs": [ { "hub_id": "hub_1", "node_id": "kepez_dokuma", "intersection": "..." } ],
  "nearest_hub_by_node": { "kepez_dokuma": { "hub_id": "hub_1", "distance_km": 0.0 } }
}
```

### `POST /report`
Submit an anonymous neighborhood report (zero PII).
- **Request Body:**
  ```json
  {
    "node_id": "kepez_dokuma",
    "category": "extreme_heat"
  }
  ```
  *Categories: `extreme_heat`, `power_water_outage`, `smoke_odor`, `vulnerable_assistance`*
- **Response:**
  ```json
  {
    "accepted": true,
    "node_id": "kepez_dokuma",
    "alert_status": "ACTIVE",
    "public_alert_active": true,
    "nearest_hub": { "hub_id": "hub_1", "node_id": "kepez_dokuma", "distance_km": 0.0 }
  }
  ```

### `POST /simulate-surge`
Injects 42 reports across Kepez under simulated 45°C heatwave conditions.

### `POST /reset-demo`
Clears all reports, resets weather override, and restores alert status to `MONITORING`.

### `POST /approve-alert`
Municipal operator approval or stand-down action.
- **Request Body:**
  ```json
  {
    "approved": true,
    "hub_count": 3,
    "approved_by": "Antalya Disaster Coordination Center (AKOM)"
  }
  ```

---

## Zero-Cost Cloud Deployment (Render & Vercel)

HEATNODE AI is designed for 100% free-tier cloud deployment:

### Backend Deployment (Render Free Tier)
The repository includes a ready-to-deploy Render Blueprint (`render.yaml`):

1. Push your repository to GitHub.
2. Sign in to [Render](https://render.com/) and go to **Blueprints**.
3. Connect your repository; Render will automatically detect `render.yaml`:
   - **Service Type:** Web Service (Python)
   - **Plan:** Free
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
   - **Health Check Path:** `/health`
4. Deploy the service and copy your public URL (e.g., `https://heatnode-ai-backend.onrender.com`).

### Frontend Deployment (Vercel Free Tier)
The frontend includes SPA rewrite configuration (`frontend/vercel.json`):

1. Sign in to [Vercel](https://vercel.com/) and click **Add New Project**.
2. Import your GitHub repository.
3. Configure project settings:
   - **Root Directory:** `frontend`
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Under **Environment Variables**, add:
   - `VITE_API_URL` = `https://heatnode-ai-backend.onrender.com` (your Render backend URL)
5. Click **Deploy**. Vercel provides a live HTTPS URL with automatic SPA fallback.

### Presentation Offline Fallback
If presenting in a venue with firewalled or offline internet:
- Open-Meteo requests automatically fall back to `data/fallback_weather.json` on network failure.
- The entire system can run fully offline locally via `uvicorn backend.main:app` and `npm run dev`.

---

## Verification & Test Suite

The codebase maintains 100% test pass rates across both Python and frontend test runners.

### Backend Pytest Suite (20 Tests)
```bash
python -m pytest -v
```
Covers:
- `tests/test_api.py`: Baseline state, 422 validations, zero-PII schema verification, surge-and-approve flow.
- `tests/test_graph.py`: 24-node graph topology, district counts, Haversine calculations, bidirectional edges.
- `tests/test_ml_training.py`: Artifact validity, offline synthetic data fallback on network error.
- `tests/test_pipeline.py`: Stage 1 DBSCAN+IF anomaly verification, Stage 2 XGBoost+SHAP predictions, Stage 3 K-Means hub allocation.
- `tests/test_weather.py`: UTCI calculations, Open-Meteo live parsing, TTL caching, and offline fallback JSON validity.

### Frontend Vitest Suite & Production Build (4 Tests)
```bash
cd frontend
npx vitest run
npm run build
```
Covers:
- `frontend/src/App.test.jsx`: Top navigation, monitoring status gating, active alert banner + nearest hub display, and Crisis Console switching.
- Clean Vite production bundle compilation to `frontend/dist/`.

---

## Repository Structure

```
headnode_cop31/
├── backend/
│   ├── __init__.py
│   ├── db.py                 # SQLite database & alert state machine
│   ├── graph.py              # Antalya 24-node neighborhood graph loader
│   ├── main.py               # FastAPI application & REST endpoints
│   ├── pipeline.py           # 3-stage ML pipeline (DBSCAN, XGBoost+SHAP, K-Means)
│   └── weather.py            # Open-Meteo ingestion, TTL cache & UTCI calculator
├── data/
│   ├── antalya_nodes.csv     # 24 neighborhoods (Muratpaşa, Kepez, Konyaaltı)
│   ├── antalya_edges.csv     # 92 directed edges with distance & bearing
│   ├── antalya_weather_5y.csv# 5-year historical Antalya hourly weather
│   └── fallback_weather.json # Offline fallback weather cache
├── ml/
│   ├── __init__.py
│   ├── artifacts/            # Trained XGBoost model & training metrics
│   ├── fetch_history.py      # Open-Meteo 5-year historical weather fetcher
│   └── train_propagation.py  # Model trainer with SHAP explainability
├── frontend/
│   ├── index.html            # HTML entry point
│   ├── package.json          # React 18, Vite, Leaflet, Recharts, Tailwind
│   ├── vite.config.js        # Vite & Vitest configuration
│   ├── vercel.json           # Vercel Free Tier SPA routing config
│   └── src/
│       ├── api.js            # Backend REST API client
│       ├── App.jsx           # Main container & navigation
│       ├── App.test.jsx      # Vitest test suite
│       ├── index.css         # Tailwind & Leaflet styles
│       ├── main.jsx          # React DOM entry
│       └── components/
│           ├── CitizenView.jsx   # 1-tap anonymous reporting & nearest hub card
│           └── CrisisConsole.jsx # GIS map, propagation arrows, SHAP bars, HITL
├── tests/                    # Backend pytest suite (20 tests)
├── render.yaml               # Render Free Tier FastAPI blueprint
├── requirements.txt          # Python dependencies
└── README.md                 # English documentation & COP31 walkthrough
```

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
