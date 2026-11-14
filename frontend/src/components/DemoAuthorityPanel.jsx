import { useEffect, useState } from "react";
import { AlertTriangle, ShieldAlert } from "lucide-react";
import { subscribeDemoAuthorityStream } from "../api.js";

function formatRiskPct(val) {
  if (typeof val !== "number" || !Number.isFinite(val)) return null;
  return `${Math.round(val)}%`;
}

export default function DemoAuthorityPanel({ t, onNavigateHome }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setError("");
    const unsubscribe = subscribeDemoAuthorityStream({
      onData: (res) => {
        setError("");
        setData(res);
      },
      onError: () => {
        setError("Failed to load demo authority records.");
      },
    });
    return () => unsubscribe();
  }, []);

  const records = data?.records || [];

  return (
    <div className="min-h-dvh p-4 sm:p-6 max-w-4xl mx-auto flex flex-col gap-4">
      <div
        role="banner"
        className="bg-amber-950/70 border-2 border-amber-500 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3"
      >
        <div className="flex items-center gap-3">
          <ShieldAlert
            className="w-7 h-7 text-amber-400 shrink-0"
            aria-hidden="true"
          />
          <div>
            <div className="text-amber-300 font-extrabold text-sm tracking-wider uppercase">
              DEMO — NO REAL INSTITUTION NOTIFICATIONS
            </div>
            <h1 className="text-white font-bold text-xl">
              Heatnode Demo Authority Panel
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div
            role="status"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-700 text-xs sm:text-sm font-semibold text-emerald-300"
          >
            <span
              className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"
              aria-hidden="true"
            />
            <span>{t?.s06_live || "Live stream"}</span>
          </div>

          <button
            type="button"
            onClick={onNavigateHome}
            className="px-4 py-2 rounded-xl bg-slate-700 text-white text-sm font-semibold cursor-pointer"
          >
            PWA
          </button>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="bg-red-950/60 border border-red-700 text-red-200 rounded-xl p-3 text-sm"
        >
          {error}
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        {records.length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-sm">
            No demo emergency records yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {records.map((rec) => {
              const r1 = formatRiskPct(rec.risk_1h);
              const r2 = formatRiskPct(rec.risk_2h);
              const r3 = formatRiskPct(rec.risk_3h);
              const hasRisk = r1 !== null || r2 !== null || r3 !== null;

              return (
                <div
                  key={rec.id}
                  className="p-4 flex flex-wrap items-center justify-between gap-3"
                >
                  <div className="flex flex-col gap-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-red-700 text-white text-xs font-bold uppercase">
                        {rec.report_mode || "emergency"}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-amber-700 text-white text-xs font-bold uppercase">
                        DEMO
                      </span>
                      <span className="text-white font-bold">
                        {t?.disasters?.[rec.disaster_type] || rec.disaster_type}
                      </span>
                      {rec.anomaly_flag && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-900/90 border border-rose-500 text-rose-200 text-xs font-bold uppercase">
                          <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>{t?.authority_anomaly || "Anomaly"}</span>
                        </span>
                      )}
                    </div>

                    {hasRisk && (
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="text-slate-400 font-semibold">
                          {t?.authority_risk_1h || "Risk"}:
                        </span>
                        {r1 !== null && (
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-300 font-mono font-semibold">
                            +1h {r1}
                          </span>
                        )}
                        {r2 !== null && (
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-orange-300 font-mono font-semibold">
                            +2h {r2}
                          </span>
                        )}
                        {r3 !== null && (
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-red-300 font-mono font-semibold">
                            +3h {r3}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="text-xs text-slate-400">
                      Lat: {rec.latitude.toFixed(5)}, Lng:{" "}
                      {rec.longitude.toFixed(5)}
                    </div>
                  </div>

                  <div className="text-right text-xs text-slate-400">
                    <div>{new Date(rec.accepted_at).toLocaleString()}</div>
                    <div className="font-mono text-slate-500">
                      Report: {rec.report_id.slice(0, 8)} | Event:{" "}
                      {rec.event_id.slice(0, 8)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
