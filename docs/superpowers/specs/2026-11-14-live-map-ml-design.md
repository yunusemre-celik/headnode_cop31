# Live Multi-Disaster Map & ML Decision Integration Design

## Summary
Upgrade COP31 Heatnode from a manually refreshed, single-disaster filtered map to a **continuous live-streaming, all-disaster map** powered in the background by the project's trained **XGBoost (+1h/+2h/+3h propagation) + IsolationForest (anomaly detection)** model (`ml/artifacts/xgb_propagation.joblib`), without any LLM dependency.

## Key Changes
1. **Language & Navigation Simplification**
   - Browser language is auto-detected via `detectInitialLanguage()`; unsupported languages default to `"en"`.
   - Remove the language picker screen from `S01LocationStart.jsx`.
   - Remove `BackButton` from all screens (`S01`–`S06`).
   - Add a **"Return to main choice"** (`onMainChoice`) button at the bottom of `S06SurroundingMap.jsx`.

2. **Unified Live Map (`S06SurroundingMap.jsx`)**
   - Remove the 10-disaster filter tab bar, Confidence / Criticality / Active Reports numeric bar, and the manual Refresh button.
   - Fetch `/api/map` without `disaster_type` so all active disaster reports and events appear on one map using each disaster's color from `DISASTER_META`.
   - Render a color legend below the map listing all 10 disaster types with their color swatch, icon, and localized name.
   - Connect via SSE (`/api/map/stream`) with automatic 2.5s polling fallback and reconnect for continuous live updates (resilient on both Render/uvicorn and Vercel).

3. **ML Decision Model Integration (`backend/ml_inference.py`, `backend/main.py`, `DemoAuthorityPanel.jsx`)**
   - Load `ml/artifacts/xgb_propagation.joblib` lazily on the backend (with graceful fallback to `rule-v1` if ML dependencies/artifact are absent).
   - Enrich active events on `/api/map` with `risk_1h`, `risk_2h`, `risk_3h` so the map dynamically scales ring intensity/opacity based on predicted hazard risk.
   - Enrich `/api/demo-authority` and `/api/demo-authority/stream` with IsolationForest `anomaly_flag`/`anomaly_score`, XGBoost `+1h/+2h/+3h` risk, and `priority_score` sorting.

4. **Deployment & Keep-Alive**
   - `requirements-ml.txt` holds `xgboost`, `scikit-learn`, `joblib`, `numpy` for `render.yaml` (`pip install -r requirements.txt -r requirements-ml.txt`), keeping `requirements.txt` lightweight for Vercel.
   - External ping on `GET /health` every 10 minutes prevents Render Free inactivity sleep during presentations.
