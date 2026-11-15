# Heat Node — COP31 Pitch Slide Deck Outline (8 Slides)

- **Target Format:** `.pptx` (16:9 widescreen — Gamma.app / PowerPoint / Beamer) + **`.pdf` backup**
- **Language:** English | **Target Pitch Duration:** 3:00 (including prototype demo)
- **Design Direction:** Graphite Dark crisis-console aesthetic (`#0f0f10` background, `#4cc38a` safezone emerald, `#ef4444` hazard red, `#f97316` heat amber), large ≥24pt text, minimal bullet density.

---

## Slide 1 — Title & Hook (0:00–0:15)
- **Headline:** **Heat Node: Zero-Hardware Multi-Disaster Urban Crisis Twin**
- **Subhead:** From Europe's Deadly Heatwaves to Antalya's 10-Hazard Resilience at COP31
- **Footer:** Team Heat Node | COP31 AI for Climate Youth Hackathon
- **Visual:** `[Screenshot: Live Graphite Dark Map showing active hazard zone & green safezone evacuation route]`

## Slide 2 — The Climate Problem & Evidence (0:15–0:35)
- **Weight:** Climate Relevance & Potential Impact (**30%**)
- **Headline:** **Deadly Heatwaves & Compounding Urban Disasters**
- **Key Points:**
  - **Evidence:** Recent European summers caused tens of thousands of heat-related deaths (WHO / Lancet Countdown), exposing how urban heat islands disproportionately harm dense, low-canopy neighborhoods.
  - **Compounding Extremes:** Mediterranean cities like Antalya face 45°C+ extreme heat and wildfires alongside flash floods, inundation, storms, hail, and landslides.
  - **The Gap:** Physical IoT sensor networks are too expensive; residents lack safe, hazard-aware evacuation guidance.

## Slide 3 — Target Users & Dual-Beneficiary Solution (0:35–0:55)
- **Weight:** Climate Relevance (**30%**) + Innovation (**20%**)
- **Headline:** **Two Users. Zero Hardware. Zero Accounts.**
- **2-Column Card:**
  1. **Citizens & Vulnerable Residents:** 1-tap anonymous reporting across **10 climate hazards**, optional GPS or manual map pin, and live safezone evacuation routes.
  2. **Municipal Crisis Managers (AKOM / AFAD):** Anomaly-filtered situational awareness, 1–3h AI propagation risk, and live safezone activation controls.

## Slide 4 — AI Architecture, Models & Data Sources (0:55–1:20)
- **Weight:** AI Integration (**20%**)
- **Headline:** **3-Stage AI + Risk-Aware Graph Routing**
- **Pipeline Visual:**
  1. **Anomaly Filtering (`IsolationForest` + Spatiotemporal Clustering):** Filters isolated noise/spam within a 500 m radius and 30-min duplicate window.
  2. **1–3h Propagation (`XGBoost`):** Trained on 5 years of Open-Meteo Antalya hourly weather (`2021–2026`); achieves **+1h R² = 0.9905**, **+3h R² = 0.9387** on physics-proxy labels.
  3. **Safezone Evacuation (`Risk-Aware Dijkstra`):** Routes citizens across the 24-node / 92-edge graph *around* active 500 m hazard circles.
- **Data Sources:** Open-Meteo API (+ offline fallback), 24-node Antalya graph, OpenStreetMap/CartoDB, anonymous `heatnode_browser_id` reports.

## Slide 5 — Live / Recorded Prototype Demo (1:20–2:15)
- **Weight:** Prototype Execution (**20%**)
- **Headline:** **Live Walkthrough: Report → AI Risk → Safezone Evacuation**
- **Visual:** `[Embedded 60–90s Demo Video MP4 + Live URL: https://heatnode-cop31.vercel.app/]`
- **4 Demo Steps:**
  1. Open app (no login) → select manual location (`S01`–`S02`).
  2. Pick Emergency + select from 10 climate hazards (`S03`–`S04`).
  3. View live 500 m hazard map, ML propagation score & green Dijkstra evacuation route (`S05`–`S06`).
  4. Toggle a safezone in Demo Authority → watch SSE update the route live; open AI Transparency modal.

## Slide 6 — Built During the Hackathon (13–15 Nov 2026) (2:15–2:30)
- **Headline:** **100% Built During the COP31 Hackathon Sprint**
- **4-Step Timeline:**
  - **Step 1 (13 Nov):** 24-node / 92-edge Antalya graph + 5-year Open-Meteo & UTCI pipeline.
  - **Step 2 (13–14 Nov):** `IsolationForest` + `XGBoost` ML pipeline + FastAPI/SQLite/SSE backend.
  - **Step 3 (14 Nov):** 10-disaster flow, risk-aware Dijkstra safezone router & AI Transparency modal.
  - **Step 4 (15 Nov):** Graphite Dark UI modernization, Vercel + Railway deployment, 36/36 automated tests passing.

## Slide 7 — Evidence, Limitations & Responsible AI (2:30–2:45)
- **Weight:** AI Integration (**20%**) + Climate Impact (**30%**)
- **Measured Validation:** 25/25 backend `pytest` + 11/11 frontend `vitest` passing; live 200 OK on Vercel & Railway; offline weather fallback verified.
- **Explicit Limitations:**
  - Training uses **physics-proxy labels**, not clinical 112/hospital records.
  - Live inference uses characteristic disaster weather profiles without physical street sensors.
  - Modeled on Antalya's 24-node urban topology.

## Slide 8 — Next Validation Step & Close (2:45–3:00)
- **Headline:** **Next Step: Shadow-Mode Municipal Pilot in Antalya**
- **Roadmap:**
  1. Partner with **Antalya Metropolitan Municipality (AKOM)** & **MGM** for shadow-mode validation.
  2. Calibrate XGBoost against anonymized **112 emergency & hospital heatstroke/disaster records**.
  3. Expand neighborhood graph beyond Antalya to European & Mediterranean cities.
- **Callout:** `https://heatnode-cop31.vercel.app/` | `github.com/yunusemre-celik/headnode_cop31` (MIT License)
