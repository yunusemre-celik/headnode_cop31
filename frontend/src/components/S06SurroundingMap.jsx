import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Circle,
  CircleMarker,
  Polyline,
  Popup,
} from "react-leaflet";
import { Home, Navigation, ShieldCheck } from "lucide-react";
import { DISASTER_CODES } from "../i18n.js";
import { DISASTER_META } from "./disasterMeta.js";
import { subscribeMapStream } from "../api.js";

const HEAT_RINGS_METERS = [
  { radius: 500, opacity: 0.08 },
  { radius: 350, opacity: 0.16 },
  { radius: 200, opacity: 0.28 },
  { radius: 100, opacity: 0.42 },
];

export default function S06SurroundingMap({ t, location, onMainChoice }) {
  const [mapData, setMapData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!location) return;
    setError("");
    const unsubscribe = subscribeMapStream({
      lat: location.lat,
      lng: location.lng,
      onData: (data) => {
        setError("");
        setMapData(data);
      },
      onError: () => {
        setError(t.s05_error);
      },
    });
    return () => unsubscribe();
  }, [location, t.s05_error]);

  const events = mapData?.events || [];
  const reports = mapData?.active_reports || [];
  const safezones = mapData?.safezones || [];
  const safeRoute = mapData?.safe_route || null;

  return (
    <div className="flex flex-col justify-between min-h-dvh p-4 sm:p-6 max-w-3xl mx-auto gap-3">
      <div className="flex items-center justify-between">
        <div
          role="status"
          className="bg-[#19191b] border border-[#ededed]/[0.08] rounded-full px-3 py-1.5 inline-flex items-center gap-2 text-xs font-medium text-[#ededed]"
        >
          <span
            className="w-1.5 h-1.5 rounded-full bg-[#4cc38a]"
            aria-hidden="true"
          />
          <span>{t.s06_live}</span>
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="text-[#fca5a5] bg-[#dc2626]/10 border border-[#dc2626]/30 rounded-xl px-4 py-2 text-sm text-center"
        >
          {error}
        </p>
      )}

      {/* Map */}
      <div className="flex-1 min-h-80 rounded-2xl overflow-hidden border border-[#ededed]/[0.08] relative">
        <MapContainer
          center={[location.lat, location.lng]}
          zoom={14}
          className="w-full h-full min-h-80"
        >
          <TileLayer
            attribution="&copy; OpenStreetMap"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* User location */}
          <CircleMarker
            center={[location.lat, location.lng]}
            radius={8}
            pathOptions={{
              color: "#FFFFFF",
              weight: 2,
              fillColor: "#2563EB",
              fillOpacity: 1,
            }}
          />

          {/* 500m radius heatmap rings around active event origins */}
          {events.map((ev) => {
            const eventColor =
              DISASTER_META[ev.disaster_type]?.color || "#2563EB";
            const riskFactor =
              0.6 + 0.8 * Math.min(1, (ev.risk_1h || 20) / 100);
            return HEAT_RINGS_METERS.map((ring) => (
              <Circle
                key={`${ev.id}-${ring.radius}`}
                center={[ev.origin_lat, ev.origin_lng]}
                radius={ring.radius}
                pathOptions={{
                  color: eventColor,
                  weight: ring.radius === 500 ? 1 : 0,
                  fillColor: eventColor,
                  fillOpacity: Math.min(0.85, ring.opacity * riskFactor),
                }}
              />
            ));
          })}

          {/* Evacuation route polyline */}
          {safeRoute?.waypoints?.length >= 2 && (
            <Polyline
              positions={safeRoute.waypoints}
              pathOptions={{
                color: safeRoute.status === "safe" ? "#10B981" : "#F59E0B",
                weight: 5,
                opacity: 0.9,
                dashArray: safeRoute.status === "safe" ? undefined : "8 8",
              }}
            />
          )}

          {/* Active Safezones */}
          {safezones.map((sz) => (
            <CircleMarker
              key={`sz-${sz.node_id}`}
              center={[sz.lat, sz.lng]}
              radius={9}
              pathOptions={{
                color: "#FFFFFF",
                weight: 2.5,
                fillColor: "#10B981",
                fillOpacity: 1,
              }}
            >
              <Popup>
                <div className="text-slate-900 text-xs">
                  <div className="font-bold text-emerald-700">
                    {t.safezone_label || "Safezone"}: {sz.name}
                  </div>
                  <div className="text-slate-600">{sz.intersection_name}</div>
                </div>
              </Popup>
            </CircleMarker>
          ))}

          {/* Individual active report points */}
          {reports.map((rep) => {
            const reportColor =
              DISASTER_META[rep.disaster_type]?.color || "#2563EB";
            return (
              <CircleMarker
                key={rep.id}
                center={[rep.latitude, rep.longitude]}
                radius={6}
                pathOptions={{
                  color: "#FFFFFF",
                  weight: 2,
                  fillColor: reportColor,
                  fillOpacity: 0.95,
                }}
              >
                <Popup>
                  <div className="text-slate-900 text-xs font-semibold">
                    {t.disasters[rep.disaster_type] || rep.disaster_type} (
                    {rep.location_source})
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>

      {/* 3-item map layer legend bar */}
      <div
        aria-label="Map layer legend"
        className="flex flex-wrap items-center justify-center gap-4 px-3 py-2 rounded-xl bg-[#19191b] border border-[#ededed]/[0.08] text-xs font-medium text-[#a1a1a6]"
      >
        <div className="inline-flex items-center gap-1.5">
          <span
            className="w-2 h-2 rounded-full shrink-0 bg-[#ef4444]"
            aria-hidden="true"
          />
          <span>{t.s06_legend_risk || "Risk"}</span>
        </div>
        <div className="inline-flex items-center gap-1.5">
          <span
            className="w-2 h-2 rounded-full shrink-0 bg-[#f97316]"
            aria-hidden="true"
          />
          <span>{t.s06_legend_report || "Report"}</span>
        </div>
        <div className="inline-flex items-center gap-1.5">
          <span
            className="w-2 h-2 rounded-full shrink-0 bg-[#10b981]"
            aria-hidden="true"
          />
          <span>{t.s06_legend_safezone || "Safezone"}</span>
        </div>
      </div>

      {/* Nearest safezone card */}
      {!safeRoute && safezones.length > 0 && (
        <div className="rounded-xl border border-[#4cc38a]/30 bg-[#19191b] px-4 py-3 flex items-center justify-between gap-2 text-[#ededed] text-sm">
          <div className="flex items-center gap-2">
            <ShieldCheck
              className="w-4 h-4 stroke-[1.5] text-[#4cc38a] shrink-0"
              strokeWidth={1.5}
              aria-hidden="true"
            />
            <span className="font-medium">
              {t.s06_nearest_safezone || "Nearest Safezone"}: {safezones[0].name}
            </span>
          </div>
          {safezones[0].intersection_name && (
            <span className="text-xs text-[#a1a1a6] truncate">
              {safezones[0].intersection_name}
            </span>
          )}
        </div>
      )}

      {/* Evacuation Route Banner */}
      {safeRoute && (
        <div
          data-testid="safe-route-banner"
          className={`rounded-2xl border p-3.5 flex flex-col gap-1.5 bg-[#19191b] ${
            safeRoute.status === "safe"
              ? "border-[#4cc38a]/40"
              : "border-[#d97706]/40"
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-semibold text-sm text-[#ededed]">
              <ShieldCheck
                className="w-4 h-4 stroke-[1.5] text-[#4cc38a] shrink-0"
                strokeWidth={1.5}
                aria-hidden="true"
              />
              <span>
                {t.safezone_route_title || "Safe Evacuation Route"}:{" "}
                {safeRoute.target_safezone.name}
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-md bg-[#232325] border border-[#ededed]/[0.08] text-xs text-[#ededed] font-mono-tabular">
              {safeRoute.total_distance_km} km
            </span>
          </div>
          <div className="text-xs text-[#a1a1a6]">
            {safeRoute.status === "safe"
              ? t.safezone_route_safe || "Avoids all active hazard zones"
              : t.safezone_route_risky ||
                "Warning: All paths cross hazards; lowest-risk route shown"}
          </div>
          {safeRoute.steps?.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-[#a1a1a6] pt-0.5 flex-wrap">
              <Navigation
                className="w-3.5 h-3.5 stroke-[1.5] text-[#a1a1a6] shrink-0"
                strokeWidth={1.5}
                aria-hidden="true"
              />
              <span>
                {safeRoute.steps.map((s) => s.name).join(" → ")}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Disaster color legend */}
      <div
        aria-label="Disaster color legend"
        className="bg-[#19191b] border border-[#ededed]/[0.08] rounded-xl p-3 flex flex-wrap gap-2 justify-center"
      >
        {DISASTER_CODES.map((code) => {
          const { Icon, color } = DISASTER_META[code];
          return (
            <div
              key={code}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#232325] border border-[#ededed]/[0.08] text-[#a1a1a6] text-xs font-medium"
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: color }}
                aria-hidden="true"
              />
              <Icon
                className="w-3.5 h-3.5 shrink-0 text-[#a1a1a6]"
                strokeWidth={1.5}
                aria-hidden="true"
              />
              <span>{t.disasters[code]}</span>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onMainChoice}
        className="w-full min-h-14 px-5 py-3.5 rounded-xl bg-[#232325] hover:bg-[#2c2c2f] border border-[#ededed]/[0.08] text-[#ededed] font-medium text-base flex items-center justify-center gap-2.5 active:scale-[0.98] unslop-transition cursor-pointer whitespace-normal break-words text-center"
      >
        <Home
          className="w-[18px] h-[18px] stroke-[1.5] text-[#a1a1a6] shrink-0"
          strokeWidth={1.5}
          aria-hidden="true"
        />
        <span>{t.s05_main_choice}</span>
      </button>
    </div>
  );
}
