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
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-700 text-xs sm:text-sm font-semibold text-emerald-300"
        >
          <span
            className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"
            aria-hidden="true"
          />
          <span>{t.s06_live}</span>
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="text-red-300 bg-red-950/60 border border-red-800 rounded-xl px-4 py-2 text-sm text-center"
        >
          {error}
        </p>
      )}

      {/* Map */}
      <div className="flex-1 min-h-[300px] rounded-2xl overflow-hidden border border-slate-700 shadow-lg relative">
        <MapContainer
          center={[location.lat, location.lng]}
          zoom={14}
          className="w-full h-full min-h-[300px]"
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

      {/* Evacuation Route Banner */}
      {safeRoute && (
        <div
          data-testid="safe-route-banner"
          className={`rounded-2xl border p-3.5 flex flex-col gap-1.5 ${
            safeRoute.status === "safe"
              ? "bg-emerald-950/60 border-emerald-600 text-emerald-100"
              : "bg-amber-950/60 border-amber-500 text-amber-100"
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-bold text-sm">
              <ShieldCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>
                {t.safezone_route_title || "Safe Evacuation Route"}:{" "}
                {safeRoute.target_safezone.name}
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-slate-900/80 text-xs font-mono font-semibold">
              {safeRoute.total_distance_km} km
            </span>
          </div>
          <div className="text-xs opacity-90">
            {safeRoute.status === "safe"
              ? t.safezone_route_safe || "Avoids all active hazard zones"
              : t.safezone_route_risky ||
                "Warning: All paths cross hazards; lowest-risk route shown"}
          </div>
          {safeRoute.steps?.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs font-medium pt-0.5 flex-wrap">
              <Navigation className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>
                {safeRoute.steps.map((s) => s.name).join(" → ")}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Compact color legend */}
      <div
        aria-label="Disaster color legend"
        className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex flex-wrap gap-2 justify-center"
      >
        {DISASTER_CODES.map((code) => {
          const { Icon, color } = DISASTER_META[code];
          return (
            <div
              key={code}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 text-slate-200 text-xs font-medium"
            >
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: color }}
                aria-hidden="true"
              />
              <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>{t.disasters[code]}</span>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onMainChoice}
        style={{ backgroundColor: "#EA580C" }}
        className="w-full min-h-[60px] px-5 py-3.5 rounded-2xl text-white font-bold text-base sm:text-lg flex items-center justify-center gap-3 shadow-md active:scale-[0.99] transition-transform cursor-pointer whitespace-normal break-words text-center"
      >
        <Home className="w-5 h-5 shrink-0" aria-hidden="true" />
        <span>{t.s05_main_choice}</span>
      </button>
    </div>
  );
}
