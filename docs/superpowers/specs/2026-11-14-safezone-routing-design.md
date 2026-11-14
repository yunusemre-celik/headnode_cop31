# Safezone & Risk-Aware Evacuation Routing Design

**Date:** 2026-11-14  
**Status:** Draft (Pending User Approval)

## 1. Intent & Why

In the COP31 Heatnode disaster demo, users can currently report hazards and view active 500 m risk rings on the live map (`S06SurroundingMap`), while authorities can monitor incoming emergency reports on `/demo-authority`. However, neither admins nor citizens have a way to designate safe assembly points ("safezones") or see how to evacuate to one without crossing active hazard zones.

Adding admin-managed safezones and risk-aware evacuation routing turns the map from a passive hazard viewer into an actionable evacuation demo.

## 2. Goals, Non-Goals, and Anti-Goals

### Goals
- Allow an admin on `/demo-authority` to view the Antalya neighborhood/intersection graph (`data/antalya_nodes.csv`) on a live Leaflet map alongside active hazard rings, and toggle any intersection node as an active safezone (or deactivate it).
- Persist active safezones in SQLite (`safezones` table) and broadcast changes immediately over the existing SSE streams (`/api/map/stream` and `/api/demo-authority/stream`).
- Compute a risk-aware evacuation route from the user's current location to the nearest reachable active safezone using `data/antalya_edges.csv`, avoiding active 500 m hazard event circles whenever a safe path exists.
- Render active safezones and the recommended evacuation route (polyline + intersection steps + distance + safety status) on `S06SurroundingMap`.

### Non-Goals
- Turn-by-turn street/sidewalk-level routing via external services (OSRM, OpenRouteService, Google Maps).
- Full authentication/RBAC system for `/demo-authority` (remains an unauthenticated demo authority panel, consistent with the existing app).
- Arbitrary off-graph polygon obstacle avoidance outside the Antalya node/edge network.

### Anti-Goals
- Sending users straight through an active 500 m hazard circle when a safe detour exists in the graph.
- Breaking existing `/api/map`, `/api/reports`, or `/api/demo-authority` response contracts or existing tests.

## 3. Constraints
- Must run completely offline/self-contained using existing `data/antalya_nodes.csv` (24 nodes) and `data/antalya_edges.csv` (92 directed edges), with no external routing API keys.
- Must work with both SQLite persistence (`backend/db.py`) and the existing SSE/polling stream architecture (`_notify_subscribers()`).
- Must respect existing frontend stack (`react-leaflet`, `lucide-react`, Tailwind CSS, Vitest) and backend stack (FastAPI, Pydantic, pytest).

## 4. Approaches Considered

### Approach A (Selected): Antalya Intersection Graph + Risk-Aware Dijkstra
- **Admin:** Interactive Leaflet map inside `DemoAuthorityPanel` displaying the 24 Antalya neighborhood/intersection nodes and active hazard circles. Clicking a node (or its list toggle) activates/deactivates it as a safezone.
- **Routing:** Risk-aware Dijkstra over `antalya_edges.csv` in a dedicated `backend/routing.py` module. Edges or nodes intersecting active 500 m event hazard circles are blocked; if all paths to all safezones are blocked, the router falls back to the lowest-risk path and flags `avoided_all_hazards: false`.
- **Trade-off:** Fast, deterministic, zero external dependencies, matches the "neighborhoods & main intersections" demo model; paths follow intersection corridors rather than minor residential streets.

### Approach B (Rejected): Arbitrary Coordinate Safezones + Virtual Grid A*
- **Admin:** Click anywhere on the map to drop custom safezone pins.
- **Routing:** Build a 100 m virtual grid around the user and run A* avoiding 500 m hazard circles.
- **Why rejected:** Ignores the existing `antalya_nodes.csv` / `antalya_edges.csv` dataset and produces unrealistic straight-line grid paths cutting across buildings.

## 5. Architecture & Detailed Design

### 5.1 Data Model & Persistence (`backend/db.py`, `backend/models.py`)
- New SQLite table `safezones`:
  - `node_id TEXT PRIMARY KEY`
  - `name TEXT NOT NULL`
  - `district TEXT NOT NULL`
  - `intersection_name TEXT NOT NULL`
  - `lat REAL NOT NULL`
  - `lng REAL NOT NULL`
  - `is_active INTEGER NOT NULL DEFAULT 1`
  - `updated_at TEXT NOT NULL`
- Seed/sync capability: `data/antalya_nodes.csv` is loaded once (cached in memory) as the canonical catalog of 24 intersection nodes.
- New Pydantic models:
  - `SafezoneNode`: `node_id`, `name`, `district`, `intersection_name`, `lat`, `lng`, `is_active`, `is_hazardous` (whether currently inside an active 500 m event circle).
  - `RouteStep`: `node_id`, `name`, `intersection_name`, `lat`, `lng`.
  - `SafeRoute`: `target_safezone: SafezoneNode`, `waypoints: List[List[float]]` (starts with `[user_lat, user_lng]`, followed by graph nodes to target), `steps: List[RouteStep]`, `total_distance_km: float`, `avoided_all_hazards: bool`, `status: Literal["safe", "fallback_risky", "no_safezone"]`.
- `MapQueryResponse` gains optional/defaulted fields (backwards-compatible):
  - `safezones: List[SafezoneNode] = []`
  - `safe_route: Optional[SafeRoute] = None`
- `DemoAuthorityListResponse` gains:
  - `nodes: List[SafezoneNode] = []` (all 24 Antalya nodes with `is_active` and `is_hazardous` flags).

### 5.2 Risk-Aware Routing (`backend/routing.py`)
1. **Hazard Geometry:** Each active `EventRecord` defines a hazard circle of radius `EVENT_RADIUS_METERS` (500 m) centered at `(origin_lat, origin_lng)`.
2. **Segment-Circle Intersection:** For every directed edge `(u, v)` in `antalya_edges.csv`, check if either endpoint or the closest point on segment `u -> v` to any active event center is `<= 500 m` (using local equirectangular projection in meters for accuracy).
3. **Graph Search (Dijkstra):**
   - Find the nearest safe (non-hazardous) graph node to `(user_lat, user_lng)` to serve as the entry node (if the user is already inside a hazard circle, pick the nearest non-hazardous node; if none, nearest node overall).
   - Run Dijkstra minimizing `distance_km` using only **safe edges** and **safe intermediate/target nodes** to reach any active safezone.
   - **Fallback:** If no completely hazard-free path exists to any active safezone, run Dijkstra with a heavy penalty per hazard intersection (`+50.0` km equivalent per hazardous node/edge) so the user still gets the least-risky route with `status = "fallback_risky"` and `avoided_all_hazards = False`.
   - **No Safezones:** If no active safezones exist, return `safe_route = None`.

### 5.3 API Endpoints (`backend/main.py`)
- `GET /api/safezones`: Returns all 24 Antalya nodes with their `is_active` and `is_hazardous` status.
- `POST /api/safezones/{node_id}/toggle` (or `PUT /api/safezones/{node_id}` with `{"is_active": bool}`): Activates or deactivates a node as a safezone, persists to SQLite, and calls `_notify_subscribers()` so both citizen maps and admin panels update live.
- `_build_map_response(...)`: Populates `safezones` (active safezones) and `safe_route` (computed from `(q_lat, q_lng)` against `all_events`).

### 5.4 Frontend UI
- **`DemoAuthorityPanel.jsx`:**
  - Add a Leaflet map section at the top/middle showing active hazard rings (red/orange), emergency reports, and all 24 Antalya intersection nodes.
  - Active safezones appear as green shield markers; inactive nodes appear as slate/blue clickable markers.
  - Clicking a node on the map or in the compact node list toggles its safezone status via `POST /api/safezones/{node_id}/toggle`.
- **`S06SurroundingMap.jsx`:**
  - Render active safezones as distinct green markers with popups (`name` + `intersection_name`).
  - If `mapData.safe_route` is present, render a green `Polyline` (amber/dashed if `status === "fallback_risky"`) from the user's location through the safe route waypoints to the target safezone.
  - Display a compact evacuation banner below/above the legend showing target safezone name, total distance (`km`), hazard-avoidance status, and the ordered intersection steps.
- **`i18n.js`:** Add Turkish/English/Arabic/Russian keys for safezone labels, route status, and admin toggle controls.

### 5.5 What's Left to the Builder
- Exact visual styling of the Leaflet markers/popups and the evacuation route banner.
- Unit and integration tests in `tests/` (backend routing hazard avoidance, fallback behavior, safezone toggle API + SSE) and `frontend/src/App.test.jsx` (mocked Leaflet rendering of safezones and route polyline).
