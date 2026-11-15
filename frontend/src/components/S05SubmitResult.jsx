import {
  CheckCircle2,
  AlertCircle,
  Map,
  Home,
  RotateCcw,
} from "lucide-react";

export default function S05SubmitResult({
  t,
  result,
  retrying,
  onRetry,
  onViewMap,
  onMainChoice,
}) {
  const isSuccess =
    result && (result.status === "accepted" || result.status === "duplicate");

  return (
    <div className="flex flex-col justify-between min-h-dvh p-4 sm:p-6 max-w-md mx-auto gap-4">
      <div className="flex-1 flex flex-col justify-center gap-4">
        {isSuccess ? (
          <>
            <div
              role="status"
              className="w-full bg-[#19191b] border border-[#4cc38a]/30 rounded-xl px-5 py-6 text-[#ededed] flex flex-col items-center justify-center gap-3 text-center whitespace-normal break-words font-semibold text-lg"
            >
              <CheckCircle2 className="w-8 h-8 stroke-[1.5] text-[#4cc38a] shrink-0" aria-hidden="true" />
              <span>{t.s05_success}</span>
              {t.s05_next_step && (
                <p className="text-sm font-medium text-emerald-100">
                  {t.s05_next_step}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={onViewMap}
              className="w-full bg-[#ededed] hover:bg-white text-[#141415] rounded-xl min-h-16 px-5 py-4 font-semibold text-base flex items-center justify-center gap-3 active:scale-[0.98] unslop-transition cursor-pointer whitespace-normal break-words text-center"
            >
              <Map className="w-5 h-5 shrink-0 stroke-[1.5]" aria-hidden="true" />
              <span>{t.s05_view_map}</span>
            </button>

            <button
              type="button"
              onClick={onMainChoice}
              className="w-full bg-[#232325] hover:bg-[#2c2c2f] border border-[#ededed]/[0.08] text-[#ededed] rounded-xl min-h-16 px-5 py-4 font-medium text-base flex items-center justify-center gap-3 active:scale-[0.98] unslop-transition cursor-pointer whitespace-normal break-words text-center"
            >
              <Home className="w-5 h-5 shrink-0 stroke-[1.5]" aria-hidden="true" />
              <span>{t.s05_main_choice}</span>
            </button>
          </>
        ) : (
          <>
            <div
              role="alert"
              className="w-full bg-[#dc2626]/10 border border-[#dc2626]/30 rounded-xl px-5 py-6 text-[#fca5a5] flex flex-col items-center justify-center gap-3 text-center whitespace-normal break-words font-semibold text-lg"
            >
              <AlertCircle className="w-8 h-8 stroke-[1.5] text-[#dc2626] shrink-0" aria-hidden="true" />
              <span>{t.s05_error}</span>
            </div>

            <button
              type="button"
              disabled={retrying}
              onClick={onRetry}
              className="w-full bg-[#dc2626] hover:bg-[#b91c1c] text-white rounded-xl min-h-16 px-5 py-4 font-semibold text-base flex items-center justify-center gap-3 active:scale-[0.98] unslop-transition cursor-pointer disabled:opacity-50 whitespace-normal break-words text-center"
            >
              <RotateCcw className="w-5 h-5 shrink-0 stroke-[1.5]" aria-hidden="true" />
              <span>{retrying ? t.s04_submitting : t.s05_retry}</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
