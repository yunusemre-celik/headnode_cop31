# HEATNODE AI Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an unslop, bilingual (TR/EN) COP31 landing page at `/` on the existing Vercel deployment, moving the Citizen PWA to `/app` while keeping `/demo-authority` intact.

**Architecture:** Client-side pathname routing in `App.jsx` (`/` → `LandingPage`, `/app` → Citizen Flow `S01–S06`, `/demo-authority` → `DemoAuthorityPanel`). The landing page is composed of focused components under `frontend/src/components/landing/` sharing the `#141415` obsidian palette, `1px` hairline borders, `IBM Plex Sans / Mono`, and `.unslop-transition` tokens from `frontend/src/index.css`.

**Tech Stack:** React 18, Tailwind CSS v4, Lucide React, HTML5 Canvas, IntersectionObserver, Vitest + React Testing Library.

**Spec:** `docs/superpowers/specs/2026-11-16-landing-page-design.md`

## Global Constraints
- Visual tokens: `#0f0f10` (`--bg-deepest`), `#141415` (`--bg-page`), `#19191b` (`--bg-card`), `#232325` (`--bg-raised`), `rgba(237, 237, 237, 0.08)` hairline borders, `#dc2626` thermal signal, `#4cc38a` verified/safe, `#d97706` pending/warning.
- Zero AI slop: no purple/cyan SaaS gradients, no generic emoji bullets, no vague marketing puffery, no heavy 3D dependencies.
- Respect `prefers-reduced-motion` in canvas and scroll-reveal animations.
- Preserve all existing Citizen Flow (`S01–S06`) and Crisis Console (`/demo-authority`) functionality.

## Review Focus
- `window.location.pathname` unknown paths must fall back cleanly to `"/"` (LandingPage), while `"/app"` and `"/demo-authority"` route deterministically.
- `prefers-reduced-motion: reduce` must disable continuous canvas particle loops and render a crisp static network frame without throwing in jsdom.
- Language toggle (`TR`/`EN`) must update all landing copy and persist `"heatnode_lang"` in `localStorage`.
- Existing `App.test.jsx` Citizen Flow tests must pass with `initialRoute="/app"` without breaking any assertions.
- Production `vite build` must succeed with zero warnings/errors.

---

### Task 1: Bilingual Copy & Hero World-to-Antalya Network Canvas
**Files:**
- Create: `frontend/src/components/landing/landingCopy.js`
- Create: `frontend/src/components/landing/HeroNetworkCanvas.jsx`

**Interfaces:**
- `landingCopy.js` exports `LANDING_COPY` keyed by `"tr"` and `"en"`.
- `HeroNetworkCanvas.jsx` exports default `HeroNetworkCanvas({ copy, onOpenApp, onOpenAuthority })`.

- [ ] **Step 1:** Create `landingCopy.js` with authentic, technical TR/EN copy covering Hero, Cooperation Thesis, 3-Stage ML Pipeline, HITL Lifecycle, 24-Node Antalya Graph, Zero-PII SQLite schema, and 7-Step COP31 Demo Walkthrough.
- [ ] **Step 2:** Create `HeroNetworkCanvas.jsx` with a responsive HTML5 `<canvas>` world-map dot matrix + cooperative signal arcs converging on Antalya (`36.89°N, 30.71°E`), graceful jsdom/reduced-motion fallback, live telemetry strip (`24 NODES · 92 EDGES · ZERO-PII`), and primary CTAs.

### Task 2: Scroll-Animated ML Pipeline, Cooperation Thesis & Antalya Graph / Zero-PII Sections
**Files:**
- Create: `frontend/src/components/landing/ScrollStoryPipeline.jsx`
- Create: `frontend/src/components/landing/AntalyaGraphPrivacy.jsx`

**Interfaces:**
- `ScrollStoryPipeline.jsx` exports default `ScrollStoryPipeline({ copy })`.
- `AntalyaGraphPrivacy.jsx` exports default `AntalyaGraphPrivacy({ copy, onOpenApp, onOpenAuthority })`.

- [ ] **Step 1:** Create `ScrollStoryPipeline.jsx` with `IntersectionObserver` scroll-reveal blocks for Cooperation vs. Isolation, the 3-Stage ML Pipeline (DBSCAN + Isolation Forest, XGBoost + SHAP, Weighted K-Means), and the HITL state machine (`MONITORING → PENDING_APPROVAL → ACTIVE`).
- [ ] **Step 2:** Create `AntalyaGraphPrivacy.jsx` with the 24-node / 92-edge Antalya district breakdown (`Kepez 10`, `Muratpaşa 8`, `Konyaaltı 6`), Zero-PII SQLite schema block, and interactive 7-step COP31 Live Demo Walkthrough.

### Task 3: LandingPage Shell, App Routing & Test Suite
**Files:**
- Create: `frontend/src/components/landing/LandingPage.jsx`
- Modify: `frontend/src/App.jsx`
- Modify: `frontend/src/App.test.jsx`

**Interfaces:**
- `LandingPage.jsx` exports default `LandingPage({ lang, onChangeLang, onOpenApp, onOpenAuthority })`.
- `App.jsx` routes `"/"` → `LandingPage`, `"/app"` → Citizen Flow (`S01–S06`), `"/demo-authority"` → `DemoAuthorityPanel`.

- [ ] **Step 1:** Create `LandingPage.jsx` with sticky hairline navbar (`TR`/`EN` toggle, section links, `/app` & `/demo-authority` buttons), composing `HeroNetworkCanvas`, `ScrollStoryPipeline`, and `AntalyaGraphPrivacy`.
- [ ] **Step 2:** Update `App.jsx` routing (`/` vs `/app` vs `/demo-authority`) and `popstate` handler.
- [ ] **Step 3:** Update `App.test.jsx` Citizen Flow tests with `initialRoute="/app"` and add Landing Page routing, language toggle, and CTA navigation tests.
- [ ] **Step 4:** Run `npm test` and `npm run build` in `frontend/`.
