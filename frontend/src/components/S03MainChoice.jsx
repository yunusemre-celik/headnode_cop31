import { AlertTriangle, Megaphone, Map, MapPin, RefreshCw } from "lucide-react";

export default function S03MainChoice({
  t,
  location,
  onChangeLocation,
  onEmergency,
  onNormal,
  onMap,
}) {
  const locationLabel =
    location?.source === "gps" ? t.s03_location_gps : t.s03_location_manual;

  return (
    <div className="flex flex-col justify-between min-h-dvh p-4 sm:p-6 max-w-md mx-auto gap-4">
      <div className="flex items-center justify-between gap-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#19191b] border border-[#ededed]/[0.08] text-xs font-medium text-[#4cc38a]">
          <MapPin className="w-3.5 h-3.5 shrink-0 stroke-[1.5]" aria-hidden="true" />
          <span>{locationLabel}</span>
        </div>
        {onChangeLocation && (
          <button
            type="button"
            onClick={onChangeLocation}
            className="min-h-12 px-3.5 py-2 rounded-xl bg-[#19191b] hover:bg-[#232325] border border-[#ededed]/[0.08] text-[#ededed] text-xs sm:text-sm font-medium inline-flex items-center gap-1.5 cursor-pointer unslop-transition"
          >
            <RefreshCw className="w-3.5 h-3.5 shrink-0 stroke-[1.5] text-[#a1a1a6]" aria-hidden="true" />
            <span>{t.s03_change_location}</span>
          </button>
        )}
      </div>
      <div className="flex-1 flex flex-col justify-center gap-4">
        <button
          type="button"
          onClick={onEmergency}
          className="w-full bg-[#dc2626] hover:bg-[#b91c1c] text-white rounded-xl min-h-20 px-5 py-4 font-semibold text-base sm:text-lg flex items-center justify-center gap-3 active:scale-[0.98] unslop-transition cursor-pointer whitespace-normal break-words text-center"
        >
          <AlertTriangle className="w-5 h-5 shrink-0 stroke-[1.5]" aria-hidden="true" />
          <span>{t.s03_emergency}</span>
        </button>

        <button
          type="button"
          onClick={onNormal}
          className="w-full bg-[#19191b] hover:bg-[#232325] border border-[#ededed]/[0.08] hover:border-[#ededed]/[0.14] text-[#ededed] rounded-xl min-h-20 px-5 py-4 font-medium text-base sm:text-lg flex items-center justify-center gap-3 active:scale-[0.98] unslop-transition cursor-pointer whitespace-normal break-words text-center"
        >
          <Megaphone className="w-5 h-5 shrink-0 stroke-[1.5] text-[#a1a1a6]" aria-hidden="true" />
          <span>{t.s03_normal}</span>
        </button>

        <button
          type="button"
          onClick={onMap}
          className="w-full bg-[#19191b] hover:bg-[#232325] border border-[#ededed]/[0.08] hover:border-[#ededed]/[0.14] text-[#ededed] rounded-xl min-h-20 px-5 py-4 font-medium text-base sm:text-lg flex items-center justify-center gap-3 active:scale-[0.98] unslop-transition cursor-pointer whitespace-normal break-words text-center"
        >
          <Map className="w-5 h-5 shrink-0 stroke-[1.5] text-[#a1a1a6]" aria-hidden="true" />
          <span>{t.s03_map}</span>
        </button>
      </div>
    </div>
  );
}
