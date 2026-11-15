import { ArrowLeft } from "lucide-react";
import { DISASTER_CODES } from "../i18n.js";
import { DISASTER_META } from "./disasterMeta.js";

export default function S04DisasterSelection({
  t,
  isRtl = false,
  reportMode = "normal",
  submitting,
  onBack,
  onSelectDisaster,
}) {
  const isEmergency = reportMode === "emergency";

  return (
    <div className="flex flex-col justify-between min-h-dvh p-4 sm:p-6 max-w-2xl mx-auto gap-4">
      <div className="flex items-center justify-between gap-2">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="min-h-12 px-3.5 py-2 rounded-xl bg-[#232325] hover:bg-[#2c2c2f] border border-[#ededed]/[0.08] text-[#ededed] text-sm font-medium inline-flex items-center gap-2 cursor-pointer unslop-transition"
          >
            <ArrowLeft
              className={`w-4 h-4 shrink-0 stroke-[1.5] ${isRtl ? "rotate-180" : ""}`}
              aria-hidden="true"
            />
            <span>{t.back}</span>
          </button>
        )}
        <span
          className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs sm:text-sm font-bold border ${
            isEmergency
              ? "bg-red-950/80 border-red-700 text-red-200"
              : "bg-orange-950/80 border-orange-700 text-orange-200"
          }`}
        >
          {isEmergency ? t.mode_emergency : t.mode_normal}
        </span>
      </div>
      <div className="flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {DISASTER_CODES.map((code) => {
            const { Icon, color } = DISASTER_META[code] || {};
            return (
              <button
                key={code}
                type="button"
                disabled={submitting}
                onClick={() => onSelectDisaster(code)}
                className="w-full bg-[#19191b] hover:bg-[#232325] border border-[#ededed]/[0.08] hover:border-[#ededed]/[0.14] rounded-xl min-h-16 px-4 py-3.5 text-[#ededed] font-medium text-base flex items-center justify-start gap-3 active:scale-[0.98] unslop-transition cursor-pointer disabled:opacity-50 text-start whitespace-normal break-words"
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: color }}
                  aria-hidden="true"
                />
                {Icon && (
                  <Icon
                    className="w-[18px] h-[18px] shrink-0 text-[#a1a1a6]"
                    strokeWidth={1.5}
                    aria-hidden="true"
                  />
                )}
                <span className="flex-1">{t.disasters[code]}</span>
              </button>
            );
          })}
        </div>
        {submitting && (
          <p className="text-center text-[#a1a1a6] text-sm mt-3">
            {t.s04_submitting}
          </p>
        )}
      </div>
    </div>
  );
}
