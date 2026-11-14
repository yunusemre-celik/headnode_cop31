import { DISASTER_CODES } from "../i18n.js";
import { DISASTER_META } from "./disasterMeta.js";

export default function S04DisasterSelection({
  t,
  submitting,
  onSelectDisaster,
}) {
  return (
    <div className="flex flex-col justify-between min-h-dvh p-4 sm:p-6 max-w-2xl mx-auto gap-4">
      <div className="flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {DISASTER_CODES.map((code) => {
            const { Icon, bg } = DISASTER_META[code];
            return (
              <button
                key={code}
                type="button"
                disabled={submitting}
                onClick={() => onSelectDisaster(code)}
                style={{ backgroundColor: bg }}
                className="w-full min-h-[68px] px-4 py-3.5 rounded-2xl text-white font-bold text-base sm:text-lg flex items-center justify-center gap-3 shadow-md active:scale-[0.99] transition-transform cursor-pointer disabled:opacity-60 whitespace-normal break-words text-center"
              >
                <Icon className="w-6 h-6 shrink-0" aria-hidden="true" />
                <span>{t.disasters[code]}</span>
              </button>
            );
          })}
        </div>
        {submitting && (
          <p className="text-center text-slate-300 text-sm mt-3">
            {t.s04_submitting}
          </p>
        )}
      </div>
    </div>
  );
}
