# HEATNODE AI — ATOX Portfolio & COP31 Submission Package

Use the sections below to paste directly into the **ATOX Portfolio** submission form before **Monday, 16 November 2026, 12:00 UTC+3**.

---

## 1. Project Title & One-Line Pitch

- **Project Name:** HEATNODE AI — Antalya COP31 Urban Heat Crisis Twin
- **Tagline (≤140 chars):** Zero-hardware, privacy-preserving urban heat & multi-disaster twin with 1–3h AI forecasting and risk-aware safezone routing.

---

## 2. Project Description (Ready to Paste)

**The Problem:**
Antalya's urban districts face intensifying 45°C+ summer heatwaves that disproportionately impact dense, low-canopy neighborhoods in **Kepez** and propagate downwind into **Muratpaşa**. Municipal crisis teams lack real-time, block-level visibility without expensive IoT sensor networks, while residents lack safe, hazard-aware routing to cooling centers.

**Our Solution:**
**HEATNODE AI** is a zero-hardware, **KVKK/GDPR Zero-PII** Urban Heat Crisis Twin built for a **dual beneficiary model**:
1. **Antalya Metropolitan Municipality (AKOM) & AFAD Crisis Managers:** Receive verified anomaly alerts, 1–3 hour wind-advection hazard forecasts with SHAP explainability, dynamic mobile cooling hub allocations, and interactive safezone controls—all gated behind a **Human-in-the-Loop (HITL)** approval workflow (`MONITORING → PENDING_APPROVAL → ACTIVE`).
2. **Vulnerable Residents in Kepez, Muratpaşa & Konyaaltı:** Submit 1-tap anonymous neighborhood reports (no GPS, no accounts, no IP logging) and, once an alert is approved, receive nearest cooling hub guidance and **risk-aware evacuation routes** that avoid active 500-meter hazard zones.

**Measured Results vs. Expected Impact:**
- **Measured (Technical & ML Validation):** On 5 years of Antalya hourly Open-Meteo weather (`2021–2026`) across 24 neighborhood nodes and 92 directed edges, the XGBoost propagation model achieves **+1h R² = 0.9905 (RMSE 1.94)**, **+2h R² = 0.9702 (RMSE 3.41)**, and **+3h R² = 0.9387 (RMSE 4.84)** on physics-proxy risk labels. The platform passes automated backend (`pytest`) and frontend (`vitest` + `vite build`) verification and runs with automatic offline weather fallback (`data/fallback_weather.json`) and self-contained graph routing.
- **Expected Impact (Pilot Goal):** Faster deployment of mobile cooling buses/water units to high-vulnerability neighborhoods and reduced citizen heat-stress exposure during peak heatwaves.
- **Next Pilot & Data Need:** A municipal pilot with **Antalya Metropolitan Municipality (AKOM)** and the **Turkish State Meteorological Service (MGM)**, integrating anonymized **112 emergency dispatch and hospital heatstroke records** to replace physics-proxy labels with real clinical outcomes.

---

## 3. Prior Work vs. 14–15 Nov Hackathon Additions Disclosure (Ready to Paste)

In accordance with ATOX hackathon rules, we clearly distinguish prior work from features built during the **14–15 November 2026** hackathon sprint:

- **Prior Work (HEATNODE AI Core):**
  - 24-node, 92-edge Antalya neighborhood topology (`data/antalya_nodes.csv`, `data/antalya_edges.csv`).
  - 3-stage ML pipeline: Stage 1 (DBSCAN + Isolation Forest anomaly verification), Stage 2 (XGBoost 1–3h propagation + SHAP physical drivers), Stage 3 (Weighted K-Means cooling hub allocation).
  - Zero-PII SQLite persistence, HITL alert state machine (`MONITORING → PENDING_APPROVAL → ACTIVE`), and offline weather fallback.
- **Built During 14–15 Nov 2026 Hackathon:**
  - **Risk-Aware Safezone Routing (`backend/routing.py` & map UI):** Self-contained Dijkstra evacuation router across the 24-node / 92-edge graph that detours around active 500 m hazard circles, with admin safezone toggles (`/api/safezones`, `/api/safezones/{node_id}/toggle`), SSE live updates, and citizen evacuation polylines.
  - **Live Multi-Disaster Map:** Real-time surrounding hazard and emergency report visualization (`S06SurroundingMap`).
  - **AI Model & Limitations Transparency Modal:** Built-in Crisis Console modal documenting the 3 AI stages, data sources, physics-proxy limitations, and municipal pilot requirements.
  - **English-First COP31 Jury Flow:** Default English (`en`) UI experience with working TR/EN/multi-language switcher.

---

## 4. AI Approach, Data Sources & Limitations Summary (Ready to Paste)

- **3-Stage AI + Graph Routing Architecture:**
  1. **Anomaly Verification:** `DBSCAN` ($\ge 10$ reports in a 20-minute window) + `IsolationForest` (5 meteorological/crowd features) prevents isolated noise from triggering false alarms.
  2. **1–3h Propagation Forecasting:** `XGBRegressor` (11 tabular features including UTCI, 1h/3h temperature gradients, wind-vector advection alignment, urban density, vulnerability, and crowd density) + `SHAP` TreeExplainer attributions.
  3. **Cooling Hub & Evacuation Optimization:** Weighted `K-Means` ($K=1\dots5$) places mobile cooling hubs; **risk-aware Dijkstra** computes hazard-avoiding safezone routes.
- **Data Sources:**
  - **Open-Meteo API** (live hourly weather + 5-year Antalya historical dataset `2021–2026`).
  - **OpenStreetMap / CartoDB** map tiles & **24-node Antalya neighborhood graph**.
  - **Anonymous citizen reports** (`node_id` + `category` + `created_at` only).
- **Explicit Limitations:**
  - **Physics-Proxy Labels:** Training targets are derived from UTCI, urban density, vulnerability, and wind advection equations—not municipal 112/hospital heatstroke records.
  - **Neighborhood-Centroid Resolution:** By design, Zero-PII reporting resolves to neighborhood centroids rather than street-level GPS coordinates.

---

## 5. Pre-Submission Verification Checklist (Deadline: Mon 16 Nov 2026, 12:00 UTC+3)

### Artifacts & Links
- [ ] **Working Public Prototype URL** (Vercel frontend + Render backend) tested from an incognito browser; `/health` returns `{"status": "ok"}`.
- [ ] **Default Language Check:** Public URL opens in **English (`en`)** by default for the international jury.
- [ ] **Slide Deck (`.pptx` + `.pdf` backup):** Exported from `docs/cop31-submission/slide-deck-outline.md` with fresh screenshots of Safezone Routing and the AI Limitations modal.
- [ ] **Short Playable Recorded Demo (`.mp4`):** 60–90 second screen recording covering Surge → Crisis Console (`PENDING_APPROVAL`, +1h/+3h, SHAP) → Safezone Toggle & Approve → Citizen Evacuation Route.
- [ ] **ATOX Portfolio Entry:** Project description, prior-work disclosure, and AI limitations pasted and saved.

### Technical & Compliance Checks
- [ ] **Backend Tests:** `python -m pytest` passes 100% after final edits.
- [ ] **Frontend Tests & Build:** `cd frontend && npx vitest run && npm run build` passes 100% after final edits.
- [ ] **Zero-PII Check:** Confirm no GPS prompts, login walls, or IP/device logging in the deployed build.
- [ ] **Offline Backup Ready:** Local `uvicorn` + `npm run dev` tested with network disabled to verify `data/fallback_weather.json` and self-contained safezone routing.
