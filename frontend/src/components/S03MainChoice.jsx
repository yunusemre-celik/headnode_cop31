import { AlertTriangle, Megaphone, Map, MapPin } from "lucide-react";

export default function S03MainChoice({
  t,
  location,
  onChangeLocation,
  onEmergency,
  onNormal,
  onMap,
}) {
  return (
    <div className="flex flex-col justify-between min-h-dvh p-4 sm:p-6 max-w-md mx-auto gap-4">
      {onChangeLocation && (
        <div className="flex items-center justify-between bg-[#19191b] border border-[#ededed]/[0.08] rounded-xl px-4 py-2.5 text-xs text-[#a1a1a6]">
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-[#dc2626] shrink-0" aria-hidden="true" />
            <span className="font-mono-tabular">
              {location && typeof location.lat === "number" && typeof location.lng === "number"
                ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`
                : ""}
            </span>
          </div>
          <button
            type="button"
            onClick={onChangeLocation}
            className="text-xs text-[#ededed] hover:underline cursor-pointer font-medium"
          >
            {t.change || "Change"}
          </button>
        </div>
      )}

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
