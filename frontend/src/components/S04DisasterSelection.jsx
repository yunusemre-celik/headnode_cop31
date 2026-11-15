import { DISASTER_CODES } from "../i18n.js";
import { DISASTER_META } from "./disasterMeta.js";
import BackButton from "./BackButton.jsx";

export default function S04DisasterSelection({
  t,
  submitting,
  onSelectDisaster,
  onBack,
  isRtl = false,
  reportMode,
}) {
  return (
    <div className="flex flex-col justify-between min-h-dvh p-4 sm:p-6 max-w-2xl mx-auto gap-4">
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
      {onBack && (
        <div className="pt-2">
          <BackButton
            label={t.back || "Back"}
            onClick={onBack}
            isRtl={isRtl}
          />
        </div>
      )}
    </div>
  );
}
