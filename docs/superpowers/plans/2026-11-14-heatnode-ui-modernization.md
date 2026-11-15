# HEATNODE AI UI Modernization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add only the essential contextual information and navigation buttons from the approved Figma design into `frontend/src/` (`S01–S06` + `DemoAuthorityPanel`) without modifying backend APIs or breaking existing tests.

**Architecture:** Incremental, backwards-compatible updates to `i18n.js`, `App.jsx`, `S01–S06`, and `DemoAuthorityPanel.jsx`, preserving 5-language support (`tr`, `en`, `ar`, `es`, `zh`), RTL (`ar`), and `>= 48px` mobile touch targets.

**Tech Stack:** React 18, Tailwind CSS v4, Lucide React, Leaflet/React-Leaflet, Vitest + React Testing Library.

**Spec:** `docs/superpowers/specs/2026-11-14-heatnode-figma-design.md`

---

### Task 1: Add Essential UI Copy to `i18n.js`
**Files:**
- Modify: `frontend/src/i18n.js`
- [ ] Add `app_title`, `s01_privacy_note`, `s03_location_gps`, `s03_location_manual`, `s03_change_location`, `mode_emergency`, `mode_normal`, `s05_next_step`, `s06_legend_risk`, `s06_legend_report`, `s06_legend_safezone`, `s06_nearest_safezone`, `authority_kpi_safezones`, `authority_kpi_reports`, `authority_kpi_top_risk` to `tr`, `en`, `ar`, `es`, `zh`.

### Task 2: Wire Navigation Props in `App.jsx` & Update `S01–S05`
**Files:**
- Modify: `frontend/src/App.jsx`, `frontend/src/components/S01LocationStart.jsx`, `frontend/src/components/S02ManualLocation.jsx`, `frontend/src/components/S03MainChoice.jsx`, `frontend/src/components/S04DisasterSelection.jsx`, `frontend/src/components/S05SubmitResult.jsx`
- [ ] `S01`: Add compact `HEATNODE AI · Antalya` header + 1-line `Zero-PII` privacy badge (no Back button on `S01`).
- [ ] `S02`: Add compact Back button (`onBack={() => setScreen("S01")}`) alongside tap hint.
- [ ] `S03`: Add top bar with active location source badge (`GPS` / `Manual`) and `Change location` button (`onChangeLocation={() => setScreen("S01")}`).
- [ ] `S04`: Add top bar with Back button (`onBack={() => setScreen("S03")}`) and active mode badge (`Acil` / `Normal`).
- [ ] `S05`: Add 1-line next-step guidance (`t.s05_next_step`) on success state.

### Task 3: Add Map Legend & Nearest Safezone Card to `S06SurroundingMap.jsx`
**Files:**
- Modify: `frontend/src/components/S06SurroundingMap.jsx`
- [ ] Add 3-item compact legend (`Risk`, `Report`, `Safezone`) and nearest safezone summary card derived from `safezones` / `safe_route`.

### Task 4: Add KPI Strip & Responsive Split Layout to `DemoAuthorityPanel.jsx`
**Files:**
- Modify: `frontend/src/components/DemoAuthorityPanel.jsx`
- [ ] Add 3-card KPI strip (`Active Safezones`, `Recent Reports`, `Highest Risk`) computed from `nodes` and `records`, plus 3-item map legend and clean 2-column desktop layout (`lg:grid-cols-12`).

### Task 5: Update & Run Tests
**Files:**
- Modify: `frontend/src/App.test.jsx`
- [ ] Add assertions for the new essential info & navigation controls, then run `cd frontend && npm test` and `cd frontend && npm run build`.
