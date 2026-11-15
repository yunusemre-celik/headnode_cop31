import { useState } from "react";
import { MapContainer, TileLayer, CircleMarker, useMapEvents } from "react-leaflet";
import { Check, MapPin } from "lucide-react";
import BackButton from "./BackButton.jsx";

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
  onBack,
  isRtl = false,
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
      <div className="flex items-center justify-center gap-2 text-[#a1a1a6] text-sm font-medium py-1">
        <MapPin className="w-[18px] h-[18px] stroke-[1.5] text-[#dc2626] shrink-0" aria-hidden="true" />
        <span>{t.s02_tap_hint}</span>
      </div>

      <div className="flex-1 min-h-80 rounded-2xl overflow-hidden border border-[#ededed]/[0.08] relative">
        <MapContainer
          center={center}
          zoom={13}
          className="w-full h-full min-h-80"
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
                weight: 2,
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
          className="w-full bg-[#ededed] hover:bg-white text-[#141415] rounded-xl min-h-16 px-5 py-4 font-semibold text-base sm:text-lg flex items-center justify-center gap-3 active:scale-[0.98] unslop-transition disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer whitespace-normal break-words text-center"
        >
          <Check className="w-5 h-5 shrink-0 stroke-[1.5]" aria-hidden="true" />
          <span>{t.s02_confirm_location}</span>
        </button>
        {onBack && (
          <BackButton
            label={t.back || "Back"}
            onClick={onBack}
            isRtl={isRtl}
          />
        )}
      </div>
    </div>
  );
}
