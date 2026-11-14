import { useState } from "react";
import { MapContainer, TileLayer, CircleMarker, useMapEvents } from "react-leaflet";
import { Check, MapPin } from "lucide-react";

const DEFAULT_CENTER = [36.8969, 30.7133];

function PinSelector({ onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function S02ManualLocation({
  t,
  initialLocation,
  onConfirm,
}) {
  const [pin, setPin] = useState(
    initialLocation &&
      Number.isFinite(initialLocation.lat) &&
      Number.isFinite(initialLocation.lng)
      ? { lat: initialLocation.lat, lng: initialLocation.lng }
      : null
  );

  const center = pin ? [pin.lat, pin.lng] : DEFAULT_CENTER;

  return (
    <div className="flex flex-col justify-between min-h-dvh p-4 sm:p-6 max-w-2xl mx-auto gap-3">
      <div className="flex items-center justify-center gap-2 text-slate-200 text-sm sm:text-base font-medium py-1">
        <MapPin className="w-5 h-5 shrink-0 text-red-400" aria-hidden="true" />
        <span>{t.s02_tap_hint}</span>
      </div>

      <div className="flex-1 min-h-[320px] rounded-2xl overflow-hidden border border-slate-700 shadow-lg relative">
        <MapContainer
          center={center}
          zoom={13}
          className="w-full h-full min-h-[320px]"
        >
          <TileLayer
            attribution="&copy; OpenStreetMap"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <PinSelector onPick={(lat, lng) => setPin({ lat, lng })} />
          {pin && (
            <CircleMarker
              center={[pin.lat, pin.lng]}
              radius={10}
              pathOptions={{
                color: "#FFFFFF",
                weight: 3,
                fillColor: "#DC2626",
                fillOpacity: 1,
              }}
            />
          )}
        </MapContainer>
      </div>

      <div className="flex flex-col gap-3">
        <button
          type="button"
          disabled={!pin}
          onClick={() => pin && onConfirm(pin.lat, pin.lng)}
          style={{ backgroundColor: "#15803D" }}
          className="w-full min-h-[64px] px-5 py-4 rounded-2xl text-white font-bold text-lg flex items-center justify-center gap-3 shadow-lg active:scale-[0.99] transition-transform cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed whitespace-normal break-words text-center"
        >
          <Check className="w-6 h-6 shrink-0" aria-hidden="true" />
          <span>{t.s02_confirm_location}</span>
        </button>
      </div>
    </div>
  );
}
