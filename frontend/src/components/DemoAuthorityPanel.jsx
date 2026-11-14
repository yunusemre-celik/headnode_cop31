import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Circle,
  CircleMarker,
  Popup,
} from "react-leaflet";
import { AlertTriangle, Info, ShieldAlert, ShieldCheck } from "lucide-react";
import { subscribeDemoAuthorityStream, toggleSafezone } from "../api.js";
import AiTransparencyModal from "./AiTransparencyModal.jsx";

const ANTALYA_CENTER = [36.89, 30.69];

function formatRiskPct(val) {
  if (typeof val !== "number" || !Number.isFinite(val)) return null;
  return `${Math.round(val)}%`;
}

export default function DemoAuthorityPanel({
  t,
  lang = "en",
  onChangeLang,
  onNavigateHome,
}) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [togglingId, setTogglingId] = useState(null);
  const [aiModalOpen, setAiModalOpen] = useState(false);

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

  async function handleToggleSafezone(node) {
    if (togglingId) return;
    setTogglingId(node.node_id);
    try {
      const updated = await toggleSafezone(node.node_id, !node.is_active);
      setData((prev) => {
        if (!prev?.nodes) return prev;
        return {
          ...prev,
          nodes: prev.nodes.map((n) =>
            n.node_id === updated.node_id ? updated : n
          ),
        };
      });
    } catch {
      setError("Failed to update safezone.");
    } finally {
      setTogglingId(null);
    }
  }

  const records = data?.records || [];
  const nodes = data?.nodes || [];
  const activeSafezoneCount = nodes.filter((n) => n.is_active).length;

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

        <div className="flex flex-wrap items-center gap-2">
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
            onClick={() => setAiModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-100 text-xs sm:text-sm font-semibold cursor-pointer"
          >
            <Info className="w-4 h-4 text-sky-400 shrink-0" aria-hidden="true" />
            <span>{t?.ai_modal_button || "AI Model & Limitations"}</span>
          </button>

          {onChangeLang && (
            <div
              role="group"
              aria-label="Language"
              className="inline-flex rounded-xl bg-slate-900 border border-slate-700 p-0.5 text-xs font-semibold"
            >
              <button
                type="button"
                onClick={() => onChangeLang("en")}
                aria-pressed={lang === "en"}
                className={`px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors ${
                  lang === "en"
                    ? "bg-emerald-600 text-white"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => onChangeLang("tr")}
                aria-pressed={lang === "tr"}
                className={`px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors ${
                  lang === "tr"
                    ? "bg-emerald-600 text-white"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                TR
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={onNavigateHome}
            className="px-4 py-2 rounded-xl bg-slate-700 text-white text-sm font-semibold cursor-pointer"
          >
            PWA
          </button>
        </div>
      </div>

      <AiTransparencyModal
        open={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        t={t}
      />

      {error && (
        <div
          role="alert"
          className="bg-red-950/60 border border-red-700 text-red-200 rounded-xl p-3 text-sm"
        >
          {error}
        </div>
      )}

      {/* Safezone Management Map & Node Toggles */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck
              className="w-5 h-5 text-emerald-400 shrink-0"
              aria-hidden="true"
            />
            <h2 className="text-white font-bold text-base">
              {t?.safezone_admin_title || "Safezone Management"}
            </h2>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-700 text-emerald-300 text-xs font-semibold">
            {activeSafezoneCount} {t?.safezone_active || "Active Safezone"}
          </span>
        </div>

        <p className="text-xs text-slate-400">
          {t?.safezone_admin_hint ||
            "Click intersections on the map or in the list below to toggle safezones."}
        </p>

        <div className="h-[320px] rounded-xl overflow-hidden border border-slate-700">
          <MapContainer
            center={ANTALYA_CENTER}
            zoom={12}
            className="w-full h-full"
          >
            <TileLayer
              attribution="&copy; OpenStreetMap"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {records.map((rec) => (
              <Circle
                key={`hz-${rec.id}`}
                center={[rec.latitude, rec.longitude]}
                radius={500}
                pathOptions={{
                  color: "#EF4444",
                  weight: 1,
                  fillColor: "#EF4444",
                  fillOpacity: 0.25,
                }}
              />
            ))}

            {nodes.map((node) => {
              const fillColor = node.is_active
                ? "#10B981"
                : node.is_hazardous
                ? "#EF4444"
                : "#64748B";
              const strokeColor = node.is_hazardous ? "#FCA5A5" : "#FFFFFF";
              return (
                <CircleMarker
                  key={node.node_id}
                  center={[node.lat, node.lng]}
                  radius={node.is_active ? 9 : 7}
                  pathOptions={{
                    color: strokeColor,
                    weight: 2,
                    fillColor,
                    fillOpacity: 0.95,
                  }}
                >
                  <Popup>
                    <div className="text-slate-900 text-xs flex flex-col gap-1.5 min-w-[180px]">
                      <div className="font-bold text-sm">
                        {node.name} ({node.district})
                      </div>
                      <div className="text-slate-600">
                        {node.intersection_name}
                      </div>
                      {node.is_hazardous && (
                        <div className="text-red-600 font-semibold">
                          {t?.safezone_hazardous || "In Hazard Zone"}
                        </div>
                      )}
                      <button
                        type="button"
                        disabled={togglingId === node.node_id}
                        onClick={() => handleToggleSafezone(node)}
                        className={`mt-1 px-2.5 py-1.5 rounded-lg text-white font-semibold cursor-pointer ${
                          node.is_active
                            ? "bg-red-600 hover:bg-red-700"
                            : "bg-emerald-600 hover:bg-emerald-700"
                        }`}
                      >
                        {node.is_active
                          ? t?.safezone_inactive || "Deactivate"
                          : t?.safezone_active || "Set Safezone"}
                      </button>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>
        </div>

        {nodes.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-1">
            {nodes.map((node) => (
              <button
                key={node.node_id}
                type="button"
                disabled={togglingId === node.node_id}
                onClick={() => handleToggleSafezone(node)}
                className={`text-left px-3 py-2 rounded-xl border text-xs transition-colors cursor-pointer flex items-center justify-between gap-2 ${
                  node.is_active
                    ? "bg-emerald-950/60 border-emerald-500 text-emerald-100"
                    : "bg-slate-800/70 border-slate-700 text-slate-200 hover:border-slate-500"
                }`}
              >
                <div className="min-w-0">
                  <div className="font-bold truncate">
                    {node.name} · {node.district}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    {node.intersection_name}
                  </div>
                </div>
                <span
                  className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    node.is_active
                      ? "bg-emerald-500 text-slate-950"
                      : node.is_hazardous
                      ? "bg-red-900 text-red-200"
                      : "bg-slate-700 text-slate-300"
                  }`}
                >
                  {node.is_active
                    ? "SAFE"
                    : node.is_hazardous
                    ? "RISK"
                    : "OFF"}
                </span>
              </button>
            ))}
          </div>
        )}
      </section>

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
