# HEATNODE AI — COP31 Pitch Slide Deck Outline (9 Slides)

- **Target Format:** `.pptx` (16:9 widescreen) + exported **`.pdf` backup**
- **Design Direction:** High-contrast dark crisis-console aesthetic (`#0F172A` slate background, `#F97316` heat amber, `#10B981` safezone emerald, `#EF4444` hazard red), large ≥24pt body text, minimal bullet density.
- **Judging Alignment:** Every criterion in the ATOX AI for Climate · COP31 rubric is explicitly mapped below:
  - Climate Relevance & Potential Impact (**30%**)
  - Innovation & Creativity (**20%**)
  - AI Integration (**20%**)
  - Prototype Execution (**20%**)
  - Presentation & Pitch (**10%**)

---

## Slide 1 — Title & Hook
- **Criterion:** Presentation & Pitch (10%) | **Time:** 00:00–00:10
- **Headline:** **HEATNODE AI: Antalya COP31 Urban Heat Crisis Twin**
- **Subhead:** Zero-Hardware, Privacy-Preserving Early Warning & Risk-Aware Safezone Routing
- **Visual Placeholder:** `[Screenshot: Dark-mode Antalya GIS Crisis Console showing 24-node graph & propagation vectors]`
- **Talking Points:**
  - Built for Antalya's 45°C+ urban heatwaves at COP31.
  - Zero physical sensors, zero PII, human-in-the-loop municipal control.

---

## Slide 2 — The Climate Problem & Dual Beneficiaries
- **Criterion:** Climate Relevance & Potential Impact (30%) | **Time:** 00:10–00:35
- **Headline:** **Extreme Urban Heat Hits Unequally — And Moves Downwind**
- **Visual Placeholder:** `[Diagram: Kepez (10 dense, low-canopy nodes) --SW wind advection--> Muratpaşa (8 commercial core nodes) vs. Konyaaltı (6 coastal nodes)]`
- **Dual Beneficiary Split (2-Column Card):**
  1. **Municipal Crisis Managers (Antalya Metropolitan Municipality / AKOM & AFAD):** Need 1–3 hour neighborhood-level foresight, explainable alerts, and dynamic mobile cooling hub placement without false-alarm panic.
  2. **Vulnerable Residents (Kepez & Muratpaşa):** Need 1-tap anonymous reporting (no login/GPS) and hazard-avoiding routes to active safezones.

---

## Slide 3 — Innovation: Zero-Hardware, Zero-PII & Human-in-the-Loop
- **Criterion:** Innovation & Creativity (20%) | **Time:** 00:35–00:50
- **Headline:** **No IoT Sensors. No GPS Tracking. No Unverified Panic.**
- **Visual Placeholder:** `[3-Icon Architecture Strip: Open-Meteo Free API + Node-Only SQLite Schema (node_id, category, created_at) + State Machine: MONITORING -> PENDING_APPROVAL -> ACTIVE]`
- **Talking Points:**
  - **Zero-Hardware:** Replaces costly urban sensor grids with free Open-Meteo weather + 24-node neighborhood graph (92 directed edges).
  - **KVKK / GDPR Zero-PII:** Never requests browser geolocation, accounts, or IP logs.
  - **Human-in-the-Loop (HITL) Gating:** Algorithms flag `PENDING_APPROVAL`; public alerts and safezone routing activate *only* after municipal operator sign-off.

---

## Slide 4 — AI Integration: 3-Stage Explainable ML Pipeline
- **Criterion:** AI Integration (20%) | **Time:** 00:50–01:05
- **Headline:** **From Crowd Noise to Physics-Grounded Forecasts & Routing**
- **Visual Placeholder:** `[Pipeline Flowchart: Stage 1 (DBSCAN + Isolation Forest) -> Stage 2 (XGBoost + SHAP) -> Stage 3 (Weighted K-Means) -> Hackathon Addition (Risk-Aware Dijkstra)]`
- **Talking Points:**
  - **Stage 1 — Anomaly Verification:** DBSCAN ($\ge 10$ reports / 20 min) + Isolation Forest filters isolated noise from real micro-climate bursts.
  - **Stage 2 — Propagation Forecasting:** XGBoost predicts +1h/+2h/+3h risk using 11 features (UTCI, thermal gradients, wind-vector alignment); SHAP explains drivers per node.
  - **Stage 3 — Resource & Route Optimization:** Weighted K-Means places $K=1\dots5$ cooling hubs; **risk-aware Dijkstra** routes citizens around 500 m hazard circles.

---

## Slide 5 — Prior Work vs. 14–15 Nov Hackathon Additions (Transparency Disclosure)
- **Criterion:** Hackathon Rule Compliance & Prototype Execution (20%) | **Time:** 01:05–01:15 (brief callout before live demo)
- **Headline:** **Clear Attribution: Core Twin vs. Hackathon Sprint**
- **Comparison Table:**
  | Component | Built Prior to 14–15 Nov | Built During 14–15 Nov Hackathon |
  | :--- | :--- | :--- |
  | **Core Graph & ML** | 24-node / 92-edge Antalya graph, DBSCAN+IF, XGBoost+SHAP, K-Means | — |
  | **Privacy & Ops** | Zero-PII SQLite DB, HITL alert state machine, offline weather fallback | — |
  | **Evacuation & Maps** | Static nearest-hub assignment | **Risk-aware Dijkstra safezone routing** (500 m hazard avoidance) + **live multi-disaster map** |
  | **Jury & Governance** | Basic Turkish/English UI | **AI Model & Limitations transparency modal** + **English-first COP31 jury flow** |

---

## Slide 6 — Live / Recorded Prototype Demonstration
- **Criterion:** Prototype Execution (20%) | **Time:** 01:15–02:15
- **Headline:** **Live Twin Walkthrough: Surge → Forecast → Approve → Evacuate**
- **Visual Placeholder:** `[Full-bleed Live Browser Window OR Embedded 60s Recorded Demo MP4]`
- **4-Step Demo Checkpoints:**
  1. **Simulate Surge:** 42 anonymous Kepez reports injected under 45°C SW wind.
  2. **Inspect AI:** `PENDING_APPROVAL` state, +1h/+2h/+3h propagation vectors into Muratpaşa, SHAP driver breakdown.
  3. **Operator Action:** Toggle active safezones, set $K=3$ cooling hubs, click **Approve & Activate**.
  4. **Citizen Outcome:** Active alert banner + nearest hub card + green safezone evacuation polyline avoiding 500 m hazard circles.

---

## Slide 7 — Measured Results vs. Expected Impact
- **Criterion:** Climate Relevance & Potential Impact (30%) & AI Integration (20%) | **Time:** 02:15–02:40
- **Headline:** **What We Measured Today vs. What We Aim to Achieve**
- **Comparison Table:**
  | Category | Status | Concrete Evidence / Target |
  | :--- | :--- | :--- |
  | **XGBoost Validation** | **Measured** (Physics-Proxy Labels) | +1h: **R² 0.9905, RMSE 1.94** · +2h: **R² 0.9702, RMSE 3.41** · +3h: **R² 0.9387, RMSE 4.84** |
  | **Software Reliability** | **Measured** | Automated backend `pytest` & frontend `vitest` + `vite build` passing; zero-PII schema verified |
  | **Offline Resilience** | **Measured** | Automatic Open-Meteo fallback (`data/fallback_weather.json`) + self-contained graph routing |
  | **Heat-Stress Reduction** | **Expected Impact** (Unmeasured) | Faster mobile cooling hub dispatch in Kepez & Muratpaşa; reduced citizen exposure along evacuation routes |

---

## Slide 8 — AI Limitations, Data Sources & Next Pilot Roadmap
- **Criterion:** AI Integration (20%) & Climate Impact (30%) | **Time:** 02:40–02:55
- **Headline:** **Honest Limitations & Path to Real Municipal Deployment**
- **Visual Placeholder:** `[Screenshot: "AI Model & Limitations" modal in Crisis Console]`
- **Talking Points:**
  - **Data Sources:** Open-Meteo 5-year hourly weather (`2021–2026`), OpenStreetMap/CartoDB tiles, anonymous neighborhood-only reports.
  - **Key Limitations:**
    1. Trained on **physics-proxy risk labels**, not clinical heatstroke records.
    2. **Neighborhood-centroid resolution** (Zero-PII trade-off vs. street-level GPS).
  - **Next Pilot & Partners:** **Antalya Metropolitan Municipality (AKOM)** and **Turkish State Meteorological Service (MGM)** — integrating anonymized **112 emergency & hospital heatstroke records** to calibrate real-world health impact.

---

## Slide 9 — Closing & Links
- **Criterion:** Presentation & Pitch (10%) | **Time:** 02:55–03:00
- **Headline:** **HEATNODE AI — Ready for Antalya. Ready for COP31.**
- **Visual Placeholder:** `[QR Code to Live Prototype] | [GitHub Repo Link] | [Team / Contact]`
- **Footer:** MIT License · Zero-Cost Render + Vercel Deployment · Offline Demo Ready
