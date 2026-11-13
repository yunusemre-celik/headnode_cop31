import { useCallback, useEffect, useState } from "react";
import {
  Flame,
  LayoutDashboard,
  RotateCcw,
  Smartphone,
  Thermometer,
  Zap,
} from "lucide-react";
import {
  approveAlert,
  fetchState,
  resetDemo,
  simulateSurge,
  submitReport,
} from "./api.js";
import CitizenView from "./components/CitizenView.jsx";
import CrisisConsole from "./components/CrisisConsole.jsx";

export default function App() {
  const [view, setView] = useState("citizen");
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const loadState = useCallback(async () => {
    try {
      const data = await fetchState();
      setState(data);
      setError(null);
    } catch (err) {
      setError(err.message || "Unable to connect to HEATNODE AI backend.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadState();
  }, [loadState]);

  async function handleSubmitReport(nodeId, category) {
    setBusy(true);
    try {
      await submitReport(nodeId, category);
      await loadState();
    } finally {
      setBusy(false);
    }
  }

  async function handleSimulateSurge() {
    setBusy(true);
    setError(null);
    try {
      const nextState = await simulateSurge();
      setState(nextState);
    } catch (err) {
      setError(err.message || "Simulation failed.");
    } finally {
      setBusy(false);
    }
  }

  async function handleResetDemo() {
    setBusy(true);
    setError(null);
    try {
      const nextState = await resetDemo();
      setState(nextState);
    } catch (err) {
      setError(err.message || "Reset failed.");
    } finally {
      setBusy(false);
    }
  }

  async function handleApproveAlert(approved, hubCount) {
    setBusy(true);
    setError(null);
    try {
      const nextState = await approveAlert(approved, hubCount);
      setState(nextState);
    } catch (err) {
      setError(err.message || "Alert update failed.");
    } finally {
      setBusy(false);
    }
  }

  const weather = state?.weather;
  const alertStatus = state?.alert_state?.status || "MONITORING";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navigation & Demo Control Bar */}
      <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto max-w-[1600px] px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-600 shadow-lg shadow-orange-950/50">
              <Flame className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-extrabold tracking-tight text-white">
                HEATNODE AI — Antalya COP31
              </h1>
              <p className="text-[11px] text-slate-400">
                Urban Heat Crisis Digital Twin
              </p>
            </div>
          </div>

          {/* Live Weather & UTCI Pill */}
          {weather && (
            <div className="flex items-center gap-2 rounded-full border border-slate-700/80 bg-slate-900 px-3.5 py-1.5 text-xs">
              <Thermometer className="h-4 w-4 text-orange-400" />
              <span className="font-bold text-white">
                {weather.temperature_c?.toFixed(1)}°C
              </span>
              <span className="text-slate-500">|</span>
              <span className="text-orange-300 font-semibold">
                UTCI {weather.utci_c?.toFixed(1)}°C
              </span>
              <span className="hidden md:inline text-slate-400">
                ({weather.stress_category})
              </span>
            </div>
          )}

          {/* View Switcher */}
          <div className="flex items-center rounded-xl border border-slate-800 bg-slate-900 p-1">
            <button
              type="button"
              onClick={() => setView("citizen")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                view === "citizen"
                  ? "bg-orange-500 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Smartphone className="h-3.5 w-3.5" />
              Citizen View
            </button>
            <button
              type="button"
              onClick={() => setView("console")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                view === "console"
                  ? "bg-orange-500 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              Crisis Console
              {alertStatus === "PENDING_APPROVAL" && (
                <span className="ml-1 h-2 w-2 rounded-full bg-amber-400 animate-ping" />
              )}
            </button>
          </div>

          {/* Demo Controls */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={handleSimulateSurge}
              className="flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/15 hover:bg-amber-500/25 disabled:opacity-50 px-3 py-2 text-xs font-bold text-amber-200 transition"
            >
              <Zap className="h-3.5 w-3.5 text-amber-400" />
              Simulate Crowd Surge
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={handleResetDemo}
              className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 px-3 py-2 text-xs font-semibold text-slate-300 transition"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {error && (
          <div className="mx-auto max-w-3xl px-4 pt-4">
            <div className="rounded-xl border border-red-500/40 bg-red-950/60 px-4 py-3 text-xs text-red-200">
              {error}
            </div>
          </div>
        )}

        {loading && !state ? (
          <div className="flex h-64 items-center justify-center text-sm text-slate-400">
            Loading HEATNODE AI telemetry...
          </div>
        ) : view === "citizen" ? (
          <CitizenView
            state={state}
            onSubmitReport={handleSubmitReport}
            busy={busy}
          />
        ) : (
          <CrisisConsole
            state={state}
            onApproveAlert={handleApproveAlert}
            busy={busy}
          />
        )}
      </main>
    </div>
  );
}
