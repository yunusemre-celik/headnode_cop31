import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Droplets,
  Flame,
  HeartHandshake,
  MapPin,
  ShieldCheck,
  ThermometerSun,
  Wind,
  ZapOff,
} from "lucide-react";
import { CircleMarker, MapContainer, TileLayer, Tooltip } from "react-leaflet";

const REPORT_CATEGORIES = [
  {
    id: "extreme_heat",
    label: "Extreme Heat Stress",
    description: "Heat exhaustion, dizziness, or unsafe outdoor heat",
    icon: ThermometerSun,
    accent: "border-orange-500/40 bg-orange-500/10 hover:bg-orange-500/20 text-orange-200",
  },
  {
    id: "power_water_outage",
    label: "Power / Water Outage",
    description: "AC failure, grid blackout, or water supply disruption",
    icon: ZapOff,
    accent: "border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-200",
  },
  {
    id: "smoke_odor",
    label: "Smoke / Odor",
    description: "Smoke plume, burning smell, or air quality hazard",
    icon: Wind,
    accent: "border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-200",
  },
  {
    id: "vulnerable_assistance",
    label: "Vulnerable Person Assistance",
    description: "Elderly, infant, or mobility-impaired person in heat",
    icon: HeartHandshake,
    accent: "border-sky-500/40 bg-sky-500/10 hover:bg-sky-500/20 text-sky-200",
  },
];

export default function CitizenView({ state, onSubmitReport, busy }) {
  const nodes = state?.node_states || [];
  const hubs = state?.hubs || [];
  const publicAlertActive = Boolean(state?.public_alert_active);

  const [selectedNodeId, setSelectedNodeId] = useState(
    nodes[0]?.node_id || ""
  );
  const [confirmation, setConfirmation] = useState(null);
  const [submittingCategory, setSubmittingCategory] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!selectedNodeId && nodes.length > 0) {
      setSelectedNodeId(nodes[0].node_id);
    }
  }, [nodes, selectedNodeId]);

  const selectedNode =
    nodes.find((n) => n.node_id === selectedNodeId) || nodes[0] || null;
  const nearestHubSummary = selectedNode
    ? state?.nearest_hub_by_node?.[selectedNode.node_id]
    : null;
  const nearestHubFull = nearestHubSummary
    ? hubs.find((h) => h.hub_id === nearestHubSummary.hub_id) || null
    : null;

  async function handleTapReport(category) {
    if (!selectedNode) return;
    setSubmittingCategory(category.id);
    setError(null);
    try {
      await onSubmitReport(selectedNode.node_id, category.id);
      setConfirmation({
        neighborhood: `${selectedNode.name} (${selectedNode.district})`,
        categoryLabel: category.label,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      });
    } catch (err) {
      setError(err.message || "Failed to submit report.");
    } finally {
      setSubmittingCategory(null);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 space-y-5">
      {/* Privacy Guarantee Badge */}
      <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-500/30 bg-emerald-950/40 px-4 py-3 text-emerald-200">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-400" />
          <span className="text-xs sm:text-sm font-medium tracking-wide">
            Zero GPS · Zero Login · KVKK/GDPR Compliant
          </span>
        </div>
        <span className="hidden sm:inline-block rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300">
          Anonymous
        </span>
      </div>

      {/* Gated Public Alert Status */}
      {publicAlertActive ? (
        <div className="space-y-4">
          <div className="rounded-2xl border-2 border-red-500 bg-gradient-to-br from-red-950/90 to-orange-950/80 p-5 shadow-lg shadow-red-950/40">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-7 w-7 shrink-0 text-red-400 mt-0.5" />
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-red-500 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-white">
                    ACTIVE HEAT EMERGENCY ALERT
                  </span>
                  <span className="text-xs text-red-200/80">
                    Authorized by {state?.alert_state?.approved_by || "Municipal Operator"}
                  </span>
                </div>
                <p className="text-sm text-red-100">
                  Extreme urban heat stress confirmed in Antalya. Avoid direct sun
                  exposure, hydrate immediately, and proceed to your nearest Safe
                  Cooling Hub if indoor cooling is unavailable.
                </p>
              </div>
            </div>
          </div>

          {nearestHubSummary && (
            <div className="rounded-2xl border border-cyan-500/40 bg-slate-900/90 p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-400">
                    <Droplets className="h-4 w-4" />
                    Nearest Safe Cooling Hub
                  </div>
                  <h3 className="text-lg font-bold text-white">
                    {nearestHubSummary.name}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {nearestHubFull?.hub_type || "Cooling & Hydration Hub"} ·{" "}
                    {nearestHubFull?.district || selectedNode?.district}
                  </p>
                </div>
                <div className="rounded-xl bg-cyan-500/15 border border-cyan-400/30 px-3 py-2 text-right">
                  <div className="text-lg font-bold text-cyan-300">
                    {nearestHubSummary.distance_km.toFixed(2)} km
                  </div>
                  <div className="text-[11px] text-cyan-200/70">from {selectedNode?.name}</div>
                </div>
              </div>

              {selectedNode && (
                <div className="h-48 w-full overflow-hidden rounded-xl border border-slate-700">
                  <MapContainer
                    center={[
                      nearestHubFull?.lat || selectedNode.lat,
                      nearestHubFull?.lon || selectedNode.lon,
                    ]}
                    zoom={13}
                    className="h-full w-full"
                    scrollWheelZoom={false}
                  >
                    <TileLayer
                      attribution="&copy; OpenStreetMap contributors &copy; CARTO"
                      url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                    />
                    <CircleMarker
                      center={[selectedNode.lat, selectedNode.lon]}
                      radius={8}
                      pathOptions={{
                        color: "#f97316",
                        fillColor: "#f97316",
                        fillOpacity: 0.7,
                      }}
                    >
                      <Tooltip permanent direction="top">
                        You: {selectedNode.name}
                      </Tooltip>
                    </CircleMarker>
                    {nearestHubFull && (
                      <CircleMarker
                        center={[nearestHubFull.lat, nearestHubFull.lon]}
                        radius={10}
                        pathOptions={{
                          color: "#06b6d4",
                          fillColor: "#06b6d4",
                          fillOpacity: 0.85,
                        }}
                      >
                        <Tooltip permanent direction="bottom">
                          Safe Hub: {nearestHubFull.name}
                        </Tooltip>
                      </CircleMarker>
                    )}
                  </MapContainer>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-700/80 bg-slate-900/70 p-4 flex items-center gap-3">
          <div className="h-3 w-3 rounded-full bg-emerald-400 shrink-0 animate-pulse" />
          <div>
            <p className="text-sm font-semibold text-slate-100">
              Monitoring — No Active Emergency Alert
            </p>
            <p className="text-xs text-slate-400">
              Public evacuation hubs activate only after municipal verification and
              operator approval.
            </p>
          </div>
        </div>
      )}

      {/* 1-Tap Anonymous Reporting Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-5 shadow-xl">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-400" />
            1-Tap Anonymous Heat Report
          </h2>
          <p className="text-xs text-slate-400">
            Select your neighborhood and tap an incident type. No personal data or
            GPS coordinates are collected.
          </p>
        </div>

        {/* Neighborhood Selector */}
        <div className="space-y-1.5">
          <label
            htmlFor="neighborhood-select"
            className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-300"
          >
            <MapPin className="h-3.5 w-3.5 text-orange-400" />
            Neighborhood
          </label>
          <select
            id="neighborhood-select"
            value={selectedNodeId}
            onChange={(e) => setSelectedNodeId(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-3 text-sm font-medium text-slate-100 focus:border-orange-500 focus:outline-none"
          >
            {nodes.map((node) => (
              <option key={node.node_id} value={node.node_id}>
                {node.name} — {node.district}
              </option>
            ))}
          </select>
        </div>

        {/* 4 Category Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {REPORT_CATEGORIES.map((category) => {
            const Icon = category.icon;
            const isSubmitting = submittingCategory === category.id;
            return (
              <button
                key={category.id}
                type="button"
                disabled={busy || !selectedNode || isSubmitting}
                onClick={() => handleTapReport(category)}
                className={`flex items-start gap-3 rounded-xl border p-4 text-left transition active:scale-[0.98] disabled:opacity-50 ${category.accent}`}
              >
                <Icon className="h-6 w-6 shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-bold leading-snug">
                    {isSubmitting ? "Sending..." : category.label}
                  </div>
                  <div className="text-xs opacity-80 mt-0.5 leading-relaxed">
                    {category.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/40 bg-red-950/50 px-4 py-3 text-xs text-red-200">
            {error}
          </div>
        )}

        {confirmation && (
          <div className="flex items-start gap-2.5 rounded-xl border border-emerald-500/40 bg-emerald-950/50 px-4 py-3 text-xs text-emerald-200">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
            <div>
              <span className="font-semibold">Report logged anonymously</span> for{" "}
              <span className="font-semibold text-white">
                {confirmation.neighborhood}
              </span>{" "}
              ({confirmation.categoryLabel}) at {confirmation.timestamp}.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
