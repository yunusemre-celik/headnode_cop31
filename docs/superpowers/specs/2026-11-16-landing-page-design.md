# HEATNODE AI — COP31 Landing Page Design Spec

**Date:** 2026-11-16  
**Status:** Draft (Awaiting User Approval)  
**Target:** Same Vercel deployment (`/` Landing Page, `/app` Citizen Flow, `/demo-authority` Crisis Console)

---

## 1. Intent & Why
HEATNODE AI is being presented to **COP31 Hackathon jury members** and **first-time visitors** who have never seen the system before.  
The landing page must accomplish two things within 60 seconds of scrolling:
1. **Convince the reader that human cooperation is a non-negotiable requirement** for surviving urban climate crises—sensors and top-down alerts alone fail without anonymous citizen micro-signals and municipal human-in-the-loop (HITL) coordination.
2. **Prove that HEATNODE AI turns that cooperation into rapid, explainable action**—filtering noise in seconds, forecasting 1–3 hour heat propagation across city blocks, and dynamically snapping mobile cooling hubs to safe intersections with zero hardware and zero PII.

---

## 2. Goals, Non-Goals & Anti-Goals

### Goals
- Serve the landing page at `/` on the existing Vercel deployment ([vercel.json](file:///c:/Users/yunus/Desktop/CODING%20PROJECTS/apps/Yunus%20Emre%20Projeler/headnode_cop31/vercel.json) already rewrites `/(.*)` to `/index.html`).
- Move the Citizen Reporting PWA (`S01–S06`) to `/app` and keep `/demo-authority` as the Crisis Manager Console.
- Include **all core project details**:
  - **Hero:** Interactive/animated **World-to-Antalya Cooperating Network Map** (HTML5 Canvas/SVG) visualizing real-time signal packets flowing between citizens, weather nodes, and municipal hubs.
  - **Cooperation Thesis:** Why climate resilience requires Citizen + AI + Municipality working together.
  - **Scroll-Animated 3-Stage ML Pipeline:**
    - Stage 1: DBSCAN + Isolation Forest (spatio-temporal anomaly verification, $\ge 10$ reports in 20 min).
    - Stage 2: XGBoost Regressor + SHAP TreeExplainer (+1h/+2h/+3h wind-advection propagation on 5-year Open-Meteo history).
    - Stage 3: Weighted K-Means ($K=1\dots5$) dynamic cooling hub allocation snapped to safe civic intersections.
  - **HITL State Machine:** `MONITORING → PENDING_APPROVAL → ACTIVE` (preventing false-alarm panic).
  - **24-Node / 92-Edge Antalya Graph:** Kepez (10), Muratpaşa (8), Konyaaltı (6) with real characteristics.
  - **Zero-PII / KVKK & GDPR Proof:** No GPS permission, no accounts, no IP fingerprinting—showing the exact `reports` SQLite schema.
  - **COP31 3-Minute Live Demo Walkthrough & Dual CTAs:** Direct buttons to launch `/app` (Citizen View) and `/demo-authority` (Crisis Console).
- Support **TR / EN** language switching synced with `heatnode_lang` in `localStorage`.

### Non-Goals
- Creating a separate Vercel project or separate static site.
- Modifying backend FastAPI endpoints or ML models.
- Adding heavy 3D libraries (e.g., Three.js) that inflate bundle size.

### Anti-Goals (`unslop` Discipline)
- **No AI Slop:** Zero generic purple/cyan/neon SaaS gradients, zero floating glassmorphism blobs, zero emoji bullet lists, zero vague marketing puffery ("revolutionary", "next-gen"), zero fake testimonials.
- **Strict Visual System:** Match [index.css](file:///c:/Users/yunus/Desktop/CODING%20PROJECTS/apps/Yunus%20Emre%20Projeler/headnode_cop31/frontend/src/index.css) — `#0f0f10` / `#141415` / `#19191b` obsidian surfaces, `1px` hairline borders (`rgba(237, 237, 237, 0.08)`), `IBM Plex Sans` + `IBM Plex Mono` (`tabular-nums`), and surgical semantic accents (`#dc2626` thermal signal, `#4cc38a` verified/safe, `#d97706` pending/warning).
- Respect `prefers-reduced-motion` on all scroll and canvas animations.

---

## 3. Approaches Considered

| Approach | Summary | Trade-off | Decision |
| :--- | :--- | :--- | :--- |
| **1. `/` Landing + `/app` Citizen + `/demo-authority` Console** | Single Vercel app; `/` becomes the jury-first entry point. | Requires updating existing `/` Citizen Flow tests to pass `initialRoute="/app"`. | **Selected** |
| **2. Keep `/` Citizen, add `/cop31` Landing** | Zero disruption to existing `/` links. | First-time visitors hitting the root URL land on location permission instead of the story. | Rejected |
| **3. Separate Vercel Project** | Isolated bundle. | Two deployments, cannot share `index.css` / `i18n` / live state cleanly. | Rejected |

---

## 4. Technical Architecture & File Plan

1. **[App.jsx](file:///c:/Users/yunus/Desktop/CODING%20PROJECTS/apps/Yunus%20Emre%20Projeler/headnode_cop31/frontend/src/App.jsx)**
   - Update `getRouteFromPath()` to recognize `"/"`, `"/app"`, and `"/demo-authority"` (defaulting unknown paths to `"/"`).
   - Pass `onOpenApp={() => navigateToRoute("/app")}` and `onOpenAuthority={() => navigateToRoute("/demo-authority")}` to `LandingPage`.
2. **`frontend/src/components/landing/landingCopy.js`**
   - Structured `TR` and `EN` copy covering Hero, Cooperation Thesis, 3-Stage ML Pipeline, HITL Lifecycle, Antalya 24-Node Graph, Zero-PII Schema, and 7-Step COP31 Demo Walkthrough.
3. **`frontend/src/components/landing/HeroNetworkCanvas.jsx`**
   - Lightweight HTML5 `<canvas>` + crisp overlay rendering a stylized world-map dot matrix with active cooperative network arcs converging on Antalya (`36.89°N, 30.71°E`), animated signal pulses, and live telemetry readout (`24 NODES · 92 EDGES · ZERO-PII`).
4. **`frontend/src/components/landing/ScrollStoryPipeline.jsx`**
   - `IntersectionObserver`-driven scroll progression highlighting:
     - Human Cooperation vs. Isolated Crisis Response comparison.
     - Stage 1 (DBSCAN + Isolation Forest), Stage 2 (XGBoost + SHAP), Stage 3 (Weighted K-Means).
     - HITL State Machine (`MONITORING → PENDING_APPROVAL → ACTIVE`).
5. **`frontend/src/components/landing/AntalyaGraphPrivacy.jsx`**
   - 24-Node district breakdown table (Kepez / Muratpaşa / Konyaaltı), Zero-PII SQLite schema block, and interactive 7-step COP31 Demo Walkthrough strip.
6. **`frontend/src/components/landing/LandingPage.jsx`**
   - Sticky hairline navbar (brand, section anchors, `TR/EN` toggle, `/app` & `/demo-authority` buttons), composes all sections, and provides a clean footer CTA.
7. **[App.test.jsx](file:///c:/Users/yunus/Desktop/CODING%20PROJECTS/apps/Yunus%20Emre%20Projeler/headnode_cop31/frontend/src/App.test.jsx)**
   - Update existing Citizen Flow tests to use `initialRoute="/app"` so they test the citizen app deterministically.
   - Add tests verifying `/` renders `LandingPage`, language toggle works, and clicking CTAs navigates to `/app` and `/demo-authority`.

---

## 5. Verification Plan
- Run `npm test` (`vitest run`) in `frontend/` — all existing and new tests must pass.
- Run `npm run build` (`vite build`) in `frontend/` — zero build errors.
- Visually inspect rendered landing page in browser if needed and verify mobile + desktop responsiveness.
