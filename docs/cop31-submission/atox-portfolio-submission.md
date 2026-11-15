# Heat Node — COP31 AI for Climate Hackathon Submission Package

> **Submission Deadline:** Monday, 16 November 2026, 12:00 UTC+3  
> **Repository:** https://github.com/yunusemre-celik/headnode_cop31 (MIT License)  
> **Live Prototype:** https://heatnode-cop31.vercel.app/  
> **Live Backend Health:** https://heatnode-backend-production.up.railway.app/api/health

---

## 1. Team & Contact Information
- **Team Name:** Heat Node
- **Project Title:** Heat Node
- **Team Members (4):** Yunus Emre Celik, Bilge Nur Sahin, Havva Cebel, Aylin Cetincay
- **Designated Team Contact:** Yunus Emre Celik (WhatsApp: `+90 561 618 60 18`)

---

## 2. Project Description, Climate Problem, Intended Users & Evidence (Ready to Paste)

### Short Project Description
**Heat Node** is a zero-hardware, privacy-first **Multi-Disaster Urban Crisis Twin** inspired by the deadly European summer heatwaves and built for COP31 host city **Antalya**. It fuses real-time crowdsourced citizen reports across **10 climate-driven hazards** (`extreme_heat`, `wildfire`, `flood`, `inundation`, `tornado`, `sandstorm`, `frost`, `avalanche`, `landslide`, `hail`) with meteorological profiles and a **3-stage AI & graph-routing pipeline** (`IsolationForest` anomaly filtering, `XGBoost` 1–3h hazard propagation forecasting, and risk-aware Dijkstra safezone evacuation routing) — requiring no accounts, no logins, and no hardware sensors.

### Specific Climate Problem
Climate change is driving simultaneous, compounding climate extremes — from deadly urban heatwaves across Europe and the Mediterranean to flash floods, wildfires, hailstorms, and high winds. During acute events, municipal emergency teams lack hyper-local, block-level situational awareness without expensive IoT sensor networks, while residents lack real-time, hazard-avoiding evacuation routes to verified safezones.

### Intended Users / Beneficiaries
1. **Vulnerable Urban Residents & Citizens:** Need a 1-tap, no-login interface to report any of 10 climate hazards (with optional GPS or manual map selection), view live surrounding 500 m hazard zones, and receive risk-aware evacuation routes to active safezones.
2. **Municipal Crisis Managers (e.g., Antalya Metropolitan Municipality / AKOM & AFAD):** Need verified anomaly filtering (to prevent panic from isolated/spoofed reports), 1–3 hour hazard propagation forecasts, and interactive safezone activation controls.

### Evidence Supporting the Need
- **European & Mediterranean Heatwave Crisis:** Recent European summers have recorded tens of thousands of heat-related deaths (WHO / Lancet Countdown / Nature Medicine studies on European summer heat mortality, particularly among dense urban populations without cooling access), highlighting the urgent need for rapid, zero-hardware early warning and cooling/evacuation guidance.
- **Compounding Multi-Hazard Reality in Mediterranean Cities (Antalya Pilot):** Mediterranean coastal cities face overlapping summer extreme heat and wildfires alongside autumn/winter flash floods, inundation, landslides, hail, and storms — making a unified 10-hazard crisis twin critical for year-round municipal resilience.

---

## 3. Pitch Slides & PDF Backup
- Slide deck scenario and 9-slide structure: [`docs/cop31-submission/slide-deck-outline.md`](slide-deck-outline.md)
- Export as `.pptx` (Gamma.app / PowerPoint / Beamer) and `.pdf` backup with embedded demo video + screenshots.

---

## 4. Prototype / Live Demo Link & Access Instructions
- **Live Frontend URL:** https://heatnode-cop31.vercel.app/
- **Backend API Health Check:** https://heatnode-backend-production.up.railway.app/api/health
- **Access Instructions (Verified Public, No Account Required):**
  1. Open https://heatnode-cop31.vercel.app/ in any browser (no login, sign-up, or private account needed).
  2. On the start screen (`S01`), either click **Allow Location** (optional browser GPS, `2.0x` report weight) or **Select Manually on Map** (`0.5x` weight — works anywhere, including outside Antalya).
  3. Choose **Emergency** or **Normal** mode, select any of the **10 disaster types** (e.g., `Extreme Heat`, `Wildfire`, `Flood`), and submit to view the live risk score, surrounding 500 m hazard map, and risk-aware safezone evacuation route.
  4. Use the **Demo Authority / Safezone Panel** and **AI Model & Limitations** modal directly in the interface to toggle safezones and inspect model transparency.
- **Privacy & Security Check:** No API keys, passwords, or `.env` files are exposed in the repository; no user accounts, names, emails, or IPs are collected (only an anonymous `heatnode_browser_id` UUID is used for anti-spam deduplication).

---

## 5. Code Repository & License Disclosure
- **GitHub Repository:** https://github.com/yunusemre-celik/headnode_cop31
- **License:** MIT License (see root `LICENSE` file).
- **Access Restrictions:** None — public repository, open-source components only (FastAPI, React, Vite, Leaflet, scikit-learn, XGBoost, Tailwind CSS, Open-Meteo, OpenStreetMap/CartoDB).

---

## 6. AI Tools, Models, APIs & Data Sources
- **AI / ML Models (`backend/ml_inference.py`, `backend/decision_model.py`, `ml/`):**
  1. **Anomaly & Duplicate Filtering:** `IsolationForest` (5 meteorological/crowd features) combined with spatiotemporal clustering and distance/repeat-decay weighting (`500 m` event radius, `30 min` duplicate window) to prevent isolated noise or spam from triggering false alarms.
  2. **1–3h Hazard Propagation Forecasting:** `XGBRegressor` (`ml/artifacts/xgb_propagation.joblib`) trained on 5 years of hourly Antalya weather data (`2021–2026`, 11 features including UTCI thermal stress, 1h/3h temperature gradients, wind-vector advection alignment, urban density, vulnerability, and crowd density). Measured physics-proxy validation (`ml/artifacts/training_metrics.json`): **+1h R² = 0.9905 (RMSE 1.94)**, **+2h R² = 0.9702 (RMSE 3.41)**, **+3h R² = 0.9387 (RMSE 4.84)**.
  3. **Risk-Aware Evacuation Routing (`backend/routing.py`):** Self-contained Dijkstra shortest-path router across the 24-node / 92-edge Antalya graph that avoids active 500 m hazard zones when routing citizens to active safezones.
- **APIs & Data Sources:**
  - **Open-Meteo API** (5-year historical Antalya weather dataset `data/antalya_weather_5y.csv` + `data/fallback_weather.json` offline resilience).
  - **24-Node / 92-Edge Antalya Neighborhood Graph** (`data/antalya_nodes.csv`, `data/antalya_edges.csv`).
  - **OpenStreetMap / CartoDB** map tiles via Leaflet.
  - **Real-Time Streaming:** FastAPI Server-Sent Events (SSE) + SQLite persistence.

---

## 7. Recorded Demo Video (Placeholder & Recording Script)
- **Status:** `[PLACEHOLDER — Record 60–90s .mp4 screen capture before final form submission]`
- **Recording Scenario (60–90 seconds):**
  1. **0:00–0:15 (Start & Privacy):** Open `https://heatnode-cop31.vercel.app/`, show English-first UI and no-login start (`S01`), pick manual location on map (`S02`).
  2. **0:15–0:35 (10-Hazard Reporting):** Select **Emergency** (`S03`) → choose **Extreme Heat** (briefly show all 10 climate hazards in `S04`) → submit report (`S05`).
  3. **0:35–0:55 (Live Map, AI & Safezone Routing):** Open **Surrounding Map** (`S06`) showing 500 m hazard radius, +1h/+2h/+3h ML propagation risk, and green risk-aware Dijkstra evacuation polyline to the nearest active safezone.
  4. **0:55–1:15 (Authority Controls & AI Transparency):** Toggle a safezone in the **Demo Authority** panel to show live SSE route recalculation, and open the **AI Model & Limitations** modal to show full model/data transparency.

---

## 8. Work Completed During Hackathon (13–15 Nov 2026), Limitations & Next Validation Step

### Step-by-Step Work Completed During the Hackathon (100% Built During Event)
1. **Step 1 — Climate Graph & Historical Weather Pipeline (13 Nov):** Built the 24-node / 92-edge Antalya neighborhood topology (`data/antalya_nodes.csv`, `data/antalya_edges.csv`), Open-Meteo 5-year weather fetcher (`2021–2026`), UTCI thermal stress calculator, and offline fallback cache.
2. **Step 2 — 3-Stage ML Training & Inference (13–14 Nov):** Trained `XGBRegressor` (+1h/+2h/+3h propagation) and `IsolationForest` anomaly detector; integrated lazy ML inference (`backend/ml_inference.py`) and multi-factor risk scoring (`backend/decision_model.py`).
3. **Step 3 — 10-Hazard Backend, Safezone Routing & SSE (13–14 Nov):** Implemented FastAPI REST endpoints, SQLite zero-PII persistence, 10-disaster enum support, risk-aware Dijkstra safezone routing (`backend/routing.py`), and live Server-Sent Events (SSE).
4. **Step 4 — Citizen & Crisis UI + Transparency (14–15 Nov):** Built the React 18 + Leaflet mobile-first reporting flow (`S01`–`S06`), Demo Authority safezone controls, AI Model & Limitations modal, and Graphite Dark UI modernization.
5. **Step 5 — Cloud Deployment & Automated Verification (15 Nov):** Deployed frontend to Vercel and backend to Railway with 5-minute GitHub Actions uptime monitoring; verified **25/25 backend `pytest`** and **11/11 frontend `vitest`** tests.

### Known Limitations
- **Physics-Proxy Training Labels:** XGBoost propagation targets are derived from meteorological/physical proxy equations (UTCI, thermal gradients, wind advection, urban density) rather than historical municipal 112 ambulance or hospital heatstroke records.
- **Characteristic Disaster Profiles:** In live inference, hazard-specific meteorological features use characteristic profiles per disaster type when live neighborhood-level micro-sensors are absent.
- **Pilot Geography:** Currently modeled on Antalya's 24-node urban graph (`Kepez`, `Muratpaşa`, `Konyaaltı`).

### Proposed Next Validation Step
- Run a **municipal shadow-mode pilot** with **Antalya Metropolitan Municipality (AKOM)** and the **Turkish State Meteorological Service (MGM)** during peak heat/storm periods, calibrating model outputs against anonymized **112 emergency dispatch and hospital heatstroke/disaster logs** and conducting usability testing with municipal operators.
