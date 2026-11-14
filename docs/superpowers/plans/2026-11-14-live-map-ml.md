# Live Multi-Disaster Map & ML Integration Implementation Plan

## Tasks
1. **Backend ML Inference & Streaming Endpoints**
   - Create `backend/ml_inference.py` to load `ml/artifacts/xgb_propagation.joblib` (XGBoost + IsolationForest) with safe fallback.
   - Update `backend/models.py` with optional ML fields on `EventRecord` and `DemoAuthorityRecord`.
   - Update `backend/main.py` to enrich `/api/map` and `/api/demo-authority`, add `GET /api/map/stream` and `GET /api/demo-authority/stream` (SSE), and notify listeners immediately on `POST /api/reports`.
   - Add `requirements-ml.txt` and update `render.yaml`.
   - Add backend tests in `tests/test_api.py` covering ML enrichment, all-disaster map query, and SSE stream headers/payload.

2. **Frontend Language, Navigation & Live Unified Map**
   - Remove `BackButton` usage from `S01LocationStart.jsx`, `S02ManualLocation.jsx`, `S03MainChoice.jsx`, `S04DisasterSelection.jsx`, `S05SubmitResult.jsx`, `S06SurroundingMap.jsx`, and remove `showLangPicker` from `S01LocationStart.jsx`.
   - Update `App.jsx` to pass `onMainChoice` to `S06SurroundingMap.jsx`.
   - Update `frontend/src/api.js` to support `fetchMapData` without `disaster_type` and add `subscribeMapStream` / `subscribeDemoAuthorityStream` (SSE + automatic 2.5s polling fallback).
   - Update `S06SurroundingMap.jsx` to remove the filter bar, score bar, and refresh button; show all disasters on one map with dynamic ML-weighted ring opacity, a color legend below the map, live streaming indicator, and a "Return to main choice" button.
   - Update `DemoAuthorityPanel.jsx` to stream live updates and display ML `+1h/+2h/+3h` risk and IsolationForest anomaly badges.
   - Update `frontend/src/App.test.jsx` to test the new flow, legend, absence of back button/language picker, and live updates.

3. **Verification**
   - Run `py -m pytest -q` and `npm --prefix frontend test -- --run` and `npm --prefix frontend run build`.
