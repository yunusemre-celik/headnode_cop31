import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertOctagon,
  CheckCircle2,
  Compass,
  Layers,
  Radio,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import {
  CircleMarker,
  MapContainer,
  Polyline,
  TileLayer,
  Tooltip,
} from "react-leaflet";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";

const HORIZONS = [
  { key: "risk_now", label: "Now" },
  { key: "risk_1h", label: "+1h" },
  { key: "risk_2h", label: "+2h" },
  { key: "risk_3h", label: "+3h" },
];

function getRiskColor(risk) {
  if (risk >= 0.8) return "#ef4444"; // red-500
  if (risk >= 0.65) return "#f97316"; // orange-500
  if (risk >= 0.35) return "#f59e0b"; // amber-500
  return "#10b981"; // emerald-500
}

function getGuidanceItems(weather, alertStatus) {
  const utci = weather?.utci_c ?? 30;
  const items = [];
  if (alertStatus === "PENDING_APPROVAL") {
    items.push(
      "AFAD Protocol: DBSCAN verified a multi-node heat anomaly. Review SHAP drivers and authorize public cooling hubs."
    );
  } else if (alertStatus === "ACTIVE") {
    items.push(
      "AFAD Active Response: Public SMS/cell-broadcast evacuation guidance is live. Dispatch mobile hydration units to assigned Safe Hubs."
    );
  } else {
    items.push(
      "AFAD Standby: Continue neighborhood telemetry monitoring. No public evacuation broadcast required."
    );
  }

  if (utci >= 38) {
    items.push(
      "MGM Extreme Heat Advisory: Restrict outdoor municipal labor between 11:00–16:00 and pre-stage EMS cooling teams."
    );
  } else {
    items.push(
      "MGM Thermal Watch: Track wind-aligned heat advection across Kepez and Muratpasa corridors."
    );
  }

  return items;
}

export default function CrisisConsole({ state, onApproveAlert, busy }) {
  const nodes = state?.node_states || [];
  const edges = state?.propagation_edges || [];
  const hubs = state?.hubs || [];
  const alertState = state?.alert_state || { status: "MONITORING", hub_count: 3 };
  const weather = state?.weather || {};

  const [horizon, setHorizon] = useState("risk_2h");
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [hubCount, setHubCount] = useState(alertState.hub_count || 3);

  useEffect(() => {
    if (alertState.hub_count) {
      setHubCount(alertState.hub_count);
    }
  }, [alertState.hub_count]);

  const selectedNode = useMemo(() => {
    if (selectedNodeId) {
      const match = nodes.find((n) => n.node_id === selectedNodeId);
      if (match) return match;
    }
    return (
      nodes.find((n) => n.verified_anomaly) ||
      [...nodes].sort((a, b) => (b[horizon] || 0) - (a[horizon] || 0))[0] ||
      null
    );
  }, [nodes, selectedNodeId, horizon]);

  const guidanceItems = getGuidanceItems(weather, alertState.status);
  const shapData = (selectedNode?.shap_drivers || []).map((d) => ({
    driver: d.driver,
    impact: Number(d.impact.toFixed(3)),
  }));

  return (
    <div className="mx-auto max-w-[1600px] p-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* Left/Center: Map & Horizon Controls */}
      <div className="lg:col-span-8 flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/90 px-4 py-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-300">
            <Layers className="h-4 w-4 text-orange-400" />
            Propagation Horizon
          </div>
          <div className="flex items-center gap-1.5 rounded-xl bg-slate-950 p-1 border border-slate-800">
            {HORIZONS.map((h) => (
              <button
                key={h.key}
                type="button"
                onClick={() => setHorizon(h.key)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                  horizon === h.key
                    ? "bg-orange-500 text-white shadow"
                    : "text-slate-400 hover:text-slate-100"
                }`}
              >
                {h.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Low
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Elevated
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-orange-500" /> High
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500" /> Critical
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-cyan-400" /> Safe Hub
            </span>
          </div>
        </div>

        <div className="h-[540px] lg:h-[680px] w-full overflow-hidden rounded-2xl border border-slate-800 shadow-2xl">
          <MapContainer
            center={[36.8969, 30.7133]}
            zoom={12}
            className="h-full w-full"
          >
            <TileLayer
              attribution="&copy; OpenStreetMap contributors &copy; CARTO"
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />

            {/* Wind-Aligned Propagation Edges */}
            {edges.map((edge) => (
              <Polyline
                key={`${edge.source_id}-${edge.target_id}`}
                positions={[
                  [edge.source_lat, edge.source_lon],
                  [edge.target_lat, edge.target_lon],
                ]}
                pathOptions={{
                  color: "#fb923c",
                  weight: Math.max(2, Math.round(edge.alignment * 5)),
                  opacity: 0.75,
                  dashArray: "6 6",
                }}
              >
                <Tooltip sticky>
                  Propagation: {edge.source_id} → {edge.target_id} (wind alignment{" "}
                  {(edge.alignment * 100).toFixed(0)}%)
                </Tooltip>
              </Polyline>
            ))}

            {/* Neighborhood Risk Nodes */}
            {nodes.map((node) => {
              const risk = node[horizon] ?? node.risk_now ?? 0;
              const color = getRiskColor(risk);
              const isSelected = selectedNode?.node_id === node.node_id;
              return (
                <CircleMarker
                  key={node.node_id}
                  center={[node.lat, node.lon]}
                  radius={isSelected ? 13 : 8 + Math.min(node.report_count, 10) * 0.5}
                  pathOptions={{
                    color: isSelected ? "#ffffff" : color,
                    weight: isSelected ? 3 : 2,
                    fillColor: color,
                    fillOpacity: 0.75,
                  }}
                  eventHandlers={{
                    click: () => setSelectedNodeId(node.node_id),
                  }}
                >
                  <Tooltip direction="top">
                    <div className="text-xs font-semibold">
                      {node.name} ({node.district}) — Risk {(risk * 100).toFixed(0)}%
                      {node.verified_anomaly ? " [DBSCAN ANOMALY]" : ""}
                    </div>
                  </Tooltip>
                </CircleMarker>
              );
            })}

            {/* P-Median Safe Cooling Hubs */}
            {hubs.map((hub) => (
              <CircleMarker
                key={hub.hub_id}
                center={[hub.lat, hub.lon]}
                radius={10}
                pathOptions={{
                  color: "#ecfeff",
                  weight: 2,
                  fillColor: "#06b6d4",
                  fillOpacity: 0.95,
                }}
              >
                <Tooltip direction="bottom">
                  <div className="text-xs font-semibold">
                    Safe Hub: {hub.name} ({hub.assigned_nodes?.length || 0} nodes)
                  </div>
                </Tooltip>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>
      </div>

      {/* Right Inspector & HITL Controls */}
      <div className="lg:col-span-4 flex flex-col gap-4">
        {/* HITL Alert Approval Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Radio className="h-4 w-4 text-orange-400" />
              Municipal HITL Alert Control
            </h3>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase ${
                alertState.status === "ACTIVE"
                  ? "bg-red-500/20 text-red-300 border border-red-500/40"
                  : alertState.status === "PENDING_APPROVAL"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                  : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
              }`}
            >
              {alertState.status.replace("_", " ")}
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="font-medium">P-Median Safe Hub Count (K)</span>
              <span className="font-bold text-cyan-300">K = {hubCount}</span>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {[1, 2, 3, 4, 5].map((k) => (
                <button
                  key={k}
                  type="button"
                  disabled={busy}
                  onClick={() => setHubCount(k)}
                  className={`rounded-lg border py-1.5 text-xs font-bold transition ${
                    hubCount === k
                      ? "border-cyan-400 bg-cyan-500/20 text-cyan-200"
                      : "border-slate-700 bg-slate-950 text-slate-400 hover:text-white"
                  }`}
                >
                  K={k}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => onApproveAlert(true, hubCount)}
              className="w-full rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition flex items-center justify-center gap-2 shadow-lg shadow-red-950/40"
            >
              <ShieldAlert className="h-4 w-4" />
              Approve & Activate Public Alert
            </button>
            {alertState.status === "ACTIVE" && (
              <button
                type="button"
                disabled={busy}
                onClick={() => onApproveAlert(false, hubCount)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 hover:bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 transition"
              >
                Stand Down to Monitoring
              </button>
            )}
          </div>
        </div>

        {/* Selected Node SHAP & DBSCAN Inspector */}
        {selectedNode && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-xs text-slate-400">{selectedNode.district}</div>
                <h3 className="text-base font-bold text-white">
                  {selectedNode.name}
                </h3>
              </div>
              {selectedNode.verified_anomaly ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-red-500/40 bg-red-500/15 px-2.5 py-1 text-[11px] font-bold text-red-300">
                  <AlertOctagon className="h-3.5 w-3.5" />
                  DBSCAN Verified Anomaly
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-300">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Normal Baseline
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-slate-950 p-2.5 border border-slate-800">
                <div className="text-[11px] text-slate-400">20m Reports</div>
                <div className="text-base font-bold text-white">
                  {selectedNode.report_count}
                </div>
              </div>
              <div className="rounded-xl bg-slate-950 p-2.5 border border-slate-800">
                <div className="text-[11px] text-slate-400">Horizon Risk</div>
                <div className="text-base font-bold text-orange-300">
                  {((selectedNode[horizon] || 0) * 100).toFixed(0)}%
                </div>
              </div>
              <div className="rounded-xl bg-slate-950 p-2.5 border border-slate-800">
                <div className="text-[11px] text-slate-400">2h Surge Prob</div>
                <div className="text-base font-bold text-amber-300">
                  {((selectedNode.threshold_prob_2h || 0) * 100).toFixed(0)}%
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-300">
                <Sparkles className="h-3.5 w-3.5 text-orange-400" />
                SHAP Risk Drivers
              </div>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={shapData}
                    layout="vertical"
                    margin={{ top: 4, right: 16, left: 4, bottom: 4 }}
                  >
                    <XAxis type="number" hide />
                    <YAxis
                      type="category"
                      dataKey="driver"
                      width={130}
                      tick={{ fill: "#cbd5e1", fontSize: 11 }}
                    />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        borderColor: "#334155",
                        fontSize: "12px",
                        color: "#f8fafc",
                      }}
                    />
                    <Bar dataKey="impact" radius={[0, 4, 4, 0]}>
                      {shapData.map((entry, idx) => (
                        <Cell
                          key={`cell-${idx}`}
                          fill={entry.impact >= 0 ? "#f97316" : "#38bdf8"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* AFAD / MGM Emergency Guidance Panel */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Activity className="h-4 w-4 text-cyan-400" />
              AFAD / MGM Emergency Guidance
            </h3>
            <span className="flex items-center gap-1 text-[11px] text-slate-400">
              <Compass className="h-3.5 w-3.5" />
              {Math.round(weather?.wind_direction_deg ?? 0)}° @{" "}
              {weather?.wind_speed_kmh ?? 0} km/h
            </span>
          </div>
          <ul className="space-y-2 text-xs text-slate-300 leading-relaxed">
            {guidanceItems.map((item, idx) => (
              <li
                key={idx}
                className="rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
