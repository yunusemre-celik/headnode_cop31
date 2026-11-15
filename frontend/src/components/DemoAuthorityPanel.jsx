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
  const topRiskPct = records.reduce((max, rec) => {
    if (typeof rec.risk_1h === "number" && Number.isFinite(rec.risk_1h)) {
      const val = Math.round(rec.risk_1h);
      return val > max ? val : max;
    }
    return max;
  }, 0);

  return (
    <div className="min-h-dvh p-4 sm:p-6 max-w-6xl mx-auto flex flex-col gap-4">
      {/* Top Header */}
      <div
        role="banner"
        className="bg-[#19191b] border border-[#ededed]/[0.08] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3"
      >
        <div className="flex items-center gap-3">
          <ShieldAlert
            className="w-5 h-5 text-[#d97706] shrink-0"
            strokeWidth={1.5}
            aria-hidden="true"
          />
          <div>
            <div className="text-xs font-medium text-[#d97706]">
              DEMO — NO REAL INSTITUTION NOTIFICATIONS
            </div>
            <h1 className="text-lg font-semibold text-[#ededed]">
              Heatnode Demo Authority Panel
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div
            role="status"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#141415] border border-[#ededed]/[0.08] text-xs font-medium text-[#ededed]"
          >
            <span
              className="w-1.5 h-1.5 rounded-full bg-[#4cc38a]"
              aria-hidden="true"
            />
            <span>{t?.s06_live || "Live stream"}</span>
          </div>

          <button
            type="button"
            onClick={() => setAiModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#232325] hover:bg-[#2c2c2f] border border-[#ededed]/[0.08] text-[#ededed] text-xs sm:text-sm font-medium unslop-transition cursor-pointer"
          >
            <Info
              className="w-4 h-4 text-[#a1a1a6] shrink-0"
              strokeWidth={1.5}
              aria-hidden="true"
            />
            <span>{t?.ai_modal_button || "AI Model & Limitations"}</span>
          </button>

          {onChangeLang && (
            <div
              role="group"
              aria-label="Language"
              className="inline-flex rounded-lg bg-[#141415] border border-[#ededed]/[0.08] p-1 text-xs font-medium"
            >
              <button
                type="button"
                onClick={() => onChangeLang("en")}
                aria-pressed={lang === "en"}
                className={`px-2.5 py-1 rounded-md cursor-pointer unslop-transition ${
                  lang === "en"
                    ? "bg-[#232325] text-[#ededed]"
                    : "text-[#85858b] hover:text-[#ededed]"
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => onChangeLang("tr")}
                aria-pressed={lang === "tr"}
                className={`px-2.5 py-1 rounded-md cursor-pointer unslop-transition ${
                  lang === "tr"
                    ? "bg-[#232325] text-[#ededed]"
                    : "text-[#85858b] hover:text-[#ededed]"
                }`}
              >
                TR
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={onNavigateHome}
            className="px-3 py-1.5 rounded-lg bg-[#ededed] hover:bg-white text-[#141415] text-xs sm:text-sm font-semibold unslop-transition cursor-pointer"
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
          className="text-[#fca5a5] bg-[#dc2626]/10 border border-[#dc2626]/30 rounded-xl p-3 text-sm text-center"
        >
          {error}
        </div>
      )}

      {/* Compact 3-Card KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-[#19191b] border border-[#ededed]/[0.08] rounded-xl px-4 py-3 flex flex-col gap-1">
          <span className="text-xs text-[#85858b] font-medium">
            {t?.authority_kpi_safezones || "Active Safezones"}
          </span>
          <span className="text-2xl font-medium text-[#4cc38a] font-mono-tabular">
            {activeSafezoneCount} / {nodes.length || 0}
          </span>
        </div>

        <div className="bg-[#19191b] border border-[#ededed]/[0.08] rounded-xl px-4 py-3 flex flex-col gap-1">
          <span className="text-xs text-[#85858b] font-medium">
            {t?.authority_kpi_reports || "Recent Reports"}
          </span>
          <span className="text-2xl font-medium text-[#ededed] font-mono-tabular">
            {records.length}
          </span>
        </div>

        <div className="bg-[#19191b] border border-[#ededed]/[0.08] rounded-xl px-4 py-3 flex flex-col gap-1">
          <span className="text-xs text-[#85858b] font-medium">
            {t?.authority_kpi_top_risk || "Highest Risk"}
          </span>
          <span className="text-2xl font-medium text-[#dc2626] font-mono-tabular">
            {topRiskPct > 0 ? `${topRiskPct}%` : "—"}
          </span>
        </div>
      </div>

      {/* Responsive Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left: Safezone Management */}
        <section className="lg:col-span-7 bg-[#19191b] border border-[#ededed]/[0.08] rounded-2xl p-4 flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ShieldCheck
                className="w-5 h-5 text-[#4cc38a] shrink-0"
                strokeWidth={1.5}
                aria-hidden="true"
              />
              <h2 className="text-[#ededed] font-semibold text-base">
                {t?.safezone_admin_title || "Safezone Management"}
              </h2>
            </div>
            <span className="px-2.5 py-1 rounded-md bg-[#232325] border border-[#ededed]/[0.08] text-[#4cc38a] text-xs font-medium font-mono-tabular">
              {activeSafezoneCount} {t?.safezone_active || "Active Safezone"}
            </span>
          </div>

          <p className="text-xs text-[#85858b]">
            {t?.safezone_admin_hint ||
              "Click intersections on the map or in the list below to toggle safezones."}
          </p>

          <div className="h-[360px] rounded-xl overflow-hidden border border-[#ededed]/[0.08]">
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
                    color: "#dc2626",
                    weight: 1,
                    fillColor: "#dc2626",
                    fillOpacity: 0.25,
                  }}
                />
              ))}

              {nodes.map((node) => {
                const fillColor = node.is_active
                  ? "#4cc38a"
                  : node.is_hazardous
                  ? "#dc2626"
                  : "#85858b";
                const strokeColor = node.is_hazardous ? "#fca5a5" : "#ffffff";
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
                        <div className="font-semibold text-sm">
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
                          className={`mt-1 px-2.5 py-1.5 rounded-lg text-white font-medium cursor-pointer unslop-transition ${
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
              {nodes.map((node) => {
                const statusLabel = node.is_active
                  ? "SAFE"
                  : node.is_hazardous
                  ? "RISK"
                  : "OFF";
                const statusBadgeClass = node.is_active
                  ? "bg-[#4cc38a]/20 text-[#4cc38a]"
                  : node.is_hazardous
                  ? "bg-[#dc2626]/20 text-[#dc2626]"
                  : "bg-[#19191b] text-[#85858b] border border-[#ededed]/[0.08]";

                return (
                  <button
                    key={node.node_id}
                    type="button"
                    disabled={togglingId === node.node_id}
                    onClick={() => handleToggleSafezone(node)}
                    className={`text-start px-3 py-2 rounded-xl border text-xs unslop-transition cursor-pointer flex items-center justify-between gap-2 ${
                      node.is_active
                        ? "bg-[#4cc38a]/10 border-[#4cc38a]/40 text-[#ededed]"
                        : "bg-[#232325] border-[#ededed]/[0.08] text-[#ededed] hover:border-[#ededed]/[0.14]"
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="font-medium truncate">
                        {node.name} · {node.district}
                      </div>
                      <div className="text-[11px] text-[#85858b] truncate">
                        {node.intersection_name}
                      </div>
                    </div>
                    <span
                      className={`shrink-0 font-mono-tabular text-[11px] font-medium px-2 py-0.5 rounded-md ${statusBadgeClass}`}
                    >
                      {statusLabel}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Right: Incident Records list */}
        <section className="lg:col-span-5 bg-[#19191b] border border-[#ededed]/[0.08] rounded-2xl overflow-hidden divide-y divide-[#ededed]/[0.08]">
          <div className="p-4 flex items-center justify-between gap-2">
            <h2 className="text-[#ededed] font-semibold text-base">
              {t?.authority_incidents_title || "Incident Records"}
            </h2>
            <span className="px-2.5 py-1 rounded-md bg-[#232325] border border-[#ededed]/[0.08] text-[#85858b] text-xs font-medium font-mono-tabular">
              {records.length}
            </span>
          </div>

          {records.length === 0 ? (
            <div className="p-6 text-center text-[#85858b] text-sm">
              No demo emergency records yet.
            </div>
          ) : (
            <div className="divide-y divide-[#ededed]/[0.08] max-h-[600px] overflow-y-auto">
              {records.map((rec) => {
                const r1 = formatRiskPct(rec.risk_1h);
                const r2 = formatRiskPct(rec.risk_2h);
                const r3 = formatRiskPct(rec.risk_3h);
                const hasRisk = r1 !== null || r2 !== null || r3 !== null;

                return (
                  <div
                    key={rec.id}
                    className="p-4 flex flex-col gap-2.5 text-start"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-md bg-[#232325] border border-[#ededed]/[0.08] text-[#dc2626] text-xs font-medium">
                          {rec.report_mode || "emergency"}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-[#232325] border border-[#ededed]/[0.08] text-[#d97706] text-xs font-medium">
                          DEMO
                        </span>
                        <span className="text-sm font-medium text-[#ededed]">
                          {t?.disasters?.[rec.disaster_type] || rec.disaster_type}
                        </span>
                        {rec.anomaly_flag && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#232325] border border-[#dc2626]/40 text-[#dc2626] text-xs font-medium">
                            <AlertTriangle
                              className="w-3.5 h-3.5 shrink-0"
                              strokeWidth={1.5}
                              aria-hidden="true"
                            />
                            <span>{t?.authority_anomaly || "Anomaly"}</span>
                          </span>
                        )}
                      </div>

                      <div className="text-end text-xs text-[#85858b]">
                        {new Date(rec.accepted_at).toLocaleString()}
                      </div>
                    </div>

                    {hasRisk && (
                      <div className="flex flex-wrap items-center gap-1.5 text-xs">
                        <span className="text-[#85858b] font-medium">
                          {t?.authority_risk_1h || "Risk"}:
                        </span>
                        {r1 !== null && (
                          <span className="px-2 py-0.5 rounded-md bg-[#232325] border border-[#ededed]/[0.08] text-[#d97706] font-mono-tabular font-medium">
                            +1h {r1}
                          </span>
                        )}
                        {r2 !== null && (
                          <span className="px-2 py-0.5 rounded-md bg-[#232325] border border-[#ededed]/[0.08] text-[#f97316] font-mono-tabular font-medium">
                            +2h {r2}
                          </span>
                        )}
                        {r3 !== null && (
                          <span className="px-2 py-0.5 rounded-md bg-[#232325] border border-[#ededed]/[0.08] text-[#dc2626] font-mono-tabular font-medium">
                            +3h {r3}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#85858b]">
                      <div className="font-mono-tabular">
                        Lat: {rec.latitude.toFixed(5)}, Lng: {rec.longitude.toFixed(5)}
                      </div>
                      <div className="font-mono-tabular text-end text-[#85858b]">
                        Report: {rec.report_id.slice(0, 8)} | Event: {rec.event_id.slice(0, 8)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
