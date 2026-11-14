import { AlertTriangle, Megaphone, Map } from "lucide-react";

export default function S03MainChoice({
  t,
  onEmergency,
  onNormal,
  onMap,
}) {
  return (
    <div className="flex flex-col justify-between min-h-dvh p-4 sm:p-6 max-w-md mx-auto gap-4">
      <div className="flex-1 flex flex-col justify-center gap-4">
        <button
          type="button"
          onClick={onEmergency}
          style={{ backgroundColor: "#DC2626" }}
          className="w-full min-h-[84px] px-5 py-5 rounded-2xl text-white font-bold text-lg sm:text-xl flex items-center justify-center gap-3 shadow-lg active:scale-[0.99] transition-transform cursor-pointer whitespace-normal break-words text-center"
        >
          <AlertTriangle className="w-6 h-6 shrink-0" aria-hidden="true" />
          <span>{t.s03_emergency}</span>
        </button>

        <button
          type="button"
          onClick={onNormal}
          style={{ backgroundColor: "#EA580C" }}
          className="w-full min-h-[84px] px-5 py-5 rounded-2xl text-white font-bold text-lg sm:text-xl flex items-center justify-center gap-3 shadow-lg active:scale-[0.99] transition-transform cursor-pointer whitespace-normal break-words text-center"
        >
          <Megaphone className="w-6 h-6 shrink-0" aria-hidden="true" />
          <span>{t.s03_normal}</span>
        </button>

        <button
          type="button"
          onClick={onMap}
          style={{ backgroundColor: "#2563EB" }}
          className="w-full min-h-[84px] px-5 py-5 rounded-2xl text-white font-bold text-lg sm:text-xl flex items-center justify-center gap-3 shadow-lg active:scale-[0.99] transition-transform cursor-pointer whitespace-normal break-words text-center"
        >
          <Map className="w-6 h-6 shrink-0" aria-hidden="true" />
          <span>{t.s03_map}</span>
        </button>
      </div>
    </div>
  );
}
