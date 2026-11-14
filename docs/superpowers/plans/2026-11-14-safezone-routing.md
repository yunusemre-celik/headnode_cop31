# Safezone & Risk-Aware Evacuation Routing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable admins to toggle Antalya neighborhood/intersection safezones from `/demo-authority` and display risk-avoiding evacuation routes on `S06SurroundingMap`.

**Architecture:** Load the 24 Antalya intersection nodes (`data/antalya_nodes.csv`) and 92 directed edges (`data/antalya_edges.csv`) into a risk-aware Dijkstra router (`backend/routing.py`). Persist active safezone `node_id`s in SQLite (`safezones` table in `backend/db.py`), expose `/api/safezones` and `/api/safezones/{node_id}/toggle`, enrich `/api/map` and `/api/demo-authority` responses, broadcast updates via SSE, and render interactive safezone management in `DemoAuthorityPanel.jsx` plus evacuation polylines & step summaries in `S06SurroundingMap.jsx`.

**Tech Stack:** Python, FastAPI, Pydantic, SQLite, React, `react-leaflet`, Tailwind CSS, `pytest`, `vitest`.

**Spec:** `docs/superpowers/specs/2026-11-14-safezone-routing-design.md`

## Global Constraints
- Must run completely offline/self-contained using `data/antalya_nodes.csv` and `data/antalya_edges.csv` with no external routing API keys.
- Preserve backwards compatibility on existing `/api/map`, `/api/reports`, and `/api/demo-authority` contracts.
- Never send users through an active 500 m (`EVENT_RADIUS_METERS`) hazard circle when a hazard-free graph path exists.

## Review Focus
- **User already inside a hazard circle:** Entry node selection must pick the nearest non-hazardous node (or nearest node if all are hazardous) without crashing.
- **No safezones active:** `safe_route` must be `None` and the map UI must render cleanly without errors.
- **All paths blocked by hazards:** Router must fall back to the lowest-risk path with `status="fallback_risky"` and `avoided_all_hazards=False`.
- **Unknown `node_id` on toggle:** `POST /api/safezones/{node_id}/toggle` must return HTTP 404.
- **SSE & polling live updates:** Toggling a safezone must call `_notify_subscribers()` so both admin and citizen streams update immediately.

---

### Task 1: Pydantic Models & SQLite `safezones` Persistence

**Files:**
- Modify: `backend/models.py`
- Modify: `backend/db.py`
- Test: `tests/test_safezones.py`

- [ ] **Step 1: Write failing tests for safezone persistence in `tests/test_safezones.py`**
  - Verify `db.init_db()` creates `safezones` table, `db.set_safezone_active("muratpasa_meltem", True)` persists, `db.get_active_safezone_ids()` returns `{"muratpasa_meltem"}`, and toggling to `False` removes it.
- [ ] **Step 2: Run test to verify it fails**
  - `python -m pytest tests/test_safezones.py -v`
- [ ] **Step 3: Add `SafezoneNode`, `RouteStep`, `SafeRoute` models and update `MapQueryResponse` & `DemoAuthorityListResponse` in `backend/models.py`**
- [ ] **Step 4: Add `safezones` table and `set_safezone_active` / `get_active_safezone_ids` methods in `backend/db.py`**
- [ ] **Step 5: Run tests to verify they pass**
  - `python -m pytest tests/test_safezones.py -v`

---

### Task 2: Risk-Aware Antalya Graph Router (`backend/routing.py`)

**Files:**
- Create: `backend/routing.py`
- Test: `tests/test_safezones.py`

- [ ] **Step 1: Write failing tests for `backend/routing.py`**
  - Test loading 24 nodes and 92 edges from `data/antalya_nodes.csv` & `data/antalya_edges.csv`.
  - Test shortest safe path when no hazards exist.
  - Test hazard avoidance: place an active `EventRecord` (500 m radius) blocking the direct shortest edge/node and verify the router chooses a detour avoiding the 500 m circle (`avoided_all_hazards == True`, `status == "safe"`).
  - Test fallback when all paths to active safezones cross a hazard (`avoided_all_hazards == False`, `status == "fallback_risky"`).
  - Test `no_safezone` / `None` when `active_safezone_ids` is empty.
- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Implement `backend/routing.py`**
  - `load_antalya_graph()` (cached `lru_cache`)
  - `_segment_intersects_circle_m(...)` using local equirectangular projection in meters
  - `compute_safe_route(user_lat, user_lng, active_safezone_ids, events, radius_m=EVENT_RADIUS_METERS) -> Optional[SafeRoute]`
  - `build_safezone_nodes(active_safezone_ids, events, radius_m=EVENT_RADIUS_METERS) -> List[SafezoneNode]`
- [ ] **Step 4: Run tests to verify they pass**

---

### Task 3: FastAPI Endpoints & SSE Enrichment (`backend/main.py`)

**Files:**
- Modify: `backend/main.py`
- Test: `tests/test_safezones.py`

- [ ] **Step 1: Write failing API tests**
  - `GET /api/safezones` returns 24 nodes with `is_active: false`.
  - `POST /api/safezones/muratpasa_kaleici/toggle` toggles `is_active` to `true` (and back to `false` on second call, or accepts optional `{"is_active": bool}`).
  - Unknown `node_id` returns `404`.
  - `GET /api/map?lat=36.886&lng=30.665` includes `safezones` and `safe_route` avoiding active report events.
  - `GET /api/demo-authority` includes `nodes` (24 Antalya nodes).
- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Implement `/api/safezones`, `/api/safezones/{node_id}/toggle`, and enrich `_build_map_response` & `_build_demo_authority_response` in `backend/main.py`**
- [ ] **Step 4: Run all backend tests (`python -m pytest -q`) to verify all pass**

---

### Task 4: Frontend API, i18n, Admin Map (`DemoAuthorityPanel.jsx`), and Citizen Route Map (`S06SurroundingMap.jsx`)

**Files:**
- Modify: `frontend/src/api.js`
- Modify: `frontend/src/i18n.js`
- Modify: `frontend/src/components/DemoAuthorityPanel.jsx`
- Modify: `frontend/src/components/S06SurroundingMap.jsx`
- Modify: `frontend/src/App.test.jsx`

- [ ] **Step 1: Add `toggleSafezone(nodeId, isActive)` in `frontend/src/api.js` and translations in `frontend/src/i18n.js` (tr, en, ar, es, zh)**
- [ ] **Step 2: Add interactive Leaflet safezone map + quick toggle list to `DemoAuthorityPanel.jsx`**
  - Shows active hazard circles (red/orange), emergency reports, and all 24 Antalya intersection nodes (green = active safezone, slate = inactive, red ring = currently hazardous).
  - Clicking a node on the map popup or in the compact node list toggles it via `toggleSafezone`.
- [ ] **Step 3: Render active safezones, evacuation `Polyline`, and route summary banner in `S06SurroundingMap.jsx`**
  - Green markers for active safezones.
  - Solid emerald `Polyline` for `status === "safe"`, amber dashed `Polyline` for `status === "fallback_risky"`.
  - Compact evacuation card showing target safezone, distance (`km`), hazard-avoidance badge, and ordered intersection steps.
- [ ] **Step 4: Update `App.test.jsx` mock for `Polyline` and add tests for safezone & evacuation route rendering and admin toggle**
- [ ] **Step 5: Run `npm --prefix frontend test -- --run` and `npm --prefix frontend run build` and `python -m pytest -q`**
