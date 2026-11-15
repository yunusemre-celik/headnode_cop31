# Jury Uptime Shield (Approach A) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ensure `heatnode-cop31` (Vercel frontend + Railway FastAPI/ML backend) stays continuously reachable, self-healing, and monitored during the 2–3 day jury evaluation window.

**Architecture:** Harden the live Railway `heatnode-backend` service configuration (`sleepApplication: false`, `restartPolicyType: "ALWAYS"`, `/api/health` healthcheck), verify live Vercel-to-Railway connectivity, and add a 5-minute GitHub Actions uptime monitor that alerts on failure and keeps the backend warm.

**Tech Stack:** Railway (`heatnode-backend`), Vercel (`heatnode-cop31`), FastAPI + ML (`backend/main.py`), GitHub Actions (`.github/workflows/uptime-check.yml`).

---

## Global Constraints

- Do not break the live `https://heatnode-cop31.vercel.app` -> `https://heatnode-backend-production.up.railway.app` integration.
- Keep `ml_active: true` verified on `/api/health`.
- No destructive database resets during live checks unless isolated to tests.

## Review Focus

- Railway container crash or OOM during jury traffic -> `restartPolicyType: "ALWAYS"` must auto-recover.
- Railway app sleeping enabled accidentally -> `sleepApplication: false` keeps container awake.
- Silent outage between Monday and Wednesday -> 5-minute GitHub Actions workflow detects and alerts.
- CORS regression between Vercel origin and Railway backend -> verified in uptime check.
- Unpushed workflow file -> `.github/workflows/uptime-check.yml` must be committed and pushed to `main` to run on schedule.

---

### Task 1: Harden Railway `heatnode-backend` Service Config

**Target:** Railway project `303d1214-1f6d-42d0-8806-7ece2ae10685`, service `835be322-550f-40c7-bc85-f0614ca9f045` (`production` environment `ac72a9a4-894d-44b0-85ed-0b1004a63e14`).

- [ ] **Step 1: Update Railway service configuration**
  Call `railway_mcp:update-service` with:
  - `projectId`: `"303d1214-1f6d-42d0-8806-7ece2ae10685"`
  - `serviceId`: `"835be322-550f-40c7-bc85-f0614ca9f045"`
  - `environmentId`: `"ac72a9a4-894d-44b0-85ed-0b1004a63e14"`
  - `sleepApplication`: `false`
  - `restartPolicyType`: `"ALWAYS"`
  - `healthcheckPath`: `"/api/health"`
  - `healthcheckTimeout`: `60`
- [ ] **Step 2: Apply config via redeploy (if needed) and verify**
  Call `railway_mcp:redeploy` so the updated `restartPolicyType` and `healthcheckPath` take effect on the live container, then check `railway_mcp:environment-status` until `heatnode-backend` is `Online`.
- [ ] **Step 3: Verify live Railway endpoints**
  Run `curl.exe` against:
  - `https://heatnode-backend-production.up.railway.app/api/health` (expect `200` and `"ml_active":true`)
  - `https://heatnode-backend-production.up.railway.app/api/map?lat=36.8969&lng=30.7133` (expect `200`)

---

### Task 2: Add 5-Minute GitHub Actions Uptime & Health Monitor

**Files:**
- Create: `.github/workflows/uptime-check.yml`

- [ ] **Step 1: Create `.github/workflows/uptime-check.yml`**
  Configure `schedule: - cron: '*/5 * * * *'` and `workflow_dispatch:` to check:
  1. `https://heatnode-cop31.vercel.app/` returns HTTP 200.
  2. `https://heatnode-backend-production.up.railway.app/api/health` returns HTTP 200 and JSON contains `"ml_active": true` (using `python3` stdlib check).
  3. `https://heatnode-backend-production.up.railway.app/api/map?lat=36.8969&lng=30.7133` returns HTTP 200.
  4. `OPTIONS https://heatnode-backend-production.up.railway.app/api/health` with `Origin: https://heatnode-cop31.vercel.app` returns `access-control-allow-origin: https://heatnode-cop31.vercel.app`.
- [ ] **Step 2: Validate YAML syntax**
  Run `python -c "import yaml; yaml.safe_load(open('.github/workflows/uptime-check.yml'))"` (or `python -m pytest` if PyYAML isn't installed).

---

### Task 3: End-to-End Verification & Handover Checklist

- [ ] **Step 1: Run local test suites**
  Run `python -m pytest` (expect 25 passed) and `npm --prefix frontend test` (expect 11 passed).
- [ ] **Step 2: Verify live Vercel + Railway end-to-end**
  Confirm Vercel `/` (`200`), Railway `/api/health` (`200`, `ml_active: true`), `/api/safezones` (`200`), `/api/map` (`200`), and CORS headers.
- [ ] **Step 3: Handover notes**
  Remind user to:
  1. Push `.github/workflows/uptime-check.yml` to GitHub `main` (so the 5-minute schedule activates).
  2. Check Railway Dashboard -> Billing/Usage to confirm sufficient credits for the 2–3 day jury window.
