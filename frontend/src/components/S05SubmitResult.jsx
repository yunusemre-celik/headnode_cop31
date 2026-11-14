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
              style={{ backgroundColor: "#15803D" }}
              className="w-full px-5 py-6 rounded-2xl text-white font-bold text-xl flex flex-col items-center justify-center gap-3 shadow-lg text-center whitespace-normal break-words"
            >
              <CheckCircle2 className="w-10 h-10 shrink-0" aria-hidden="true" />
              <span>{t.s05_success}</span>
            </div>

            <button
              type="button"
              onClick={onViewMap}
              style={{ backgroundColor: "#2563EB" }}
              className="w-full min-h-[68px] px-5 py-4 rounded-2xl text-white font-bold text-lg flex items-center justify-center gap-3 shadow-md active:scale-[0.99] transition-transform cursor-pointer whitespace-normal break-words text-center"
            >
              <Map className="w-6 h-6 shrink-0" aria-hidden="true" />
              <span>{t.s05_view_map}</span>
            </button>

            <button
              type="button"
              onClick={onMainChoice}
              style={{ backgroundColor: "#EA580C" }}
              className="w-full min-h-[68px] px-5 py-4 rounded-2xl text-white font-bold text-lg flex items-center justify-center gap-3 shadow-md active:scale-[0.99] transition-transform cursor-pointer whitespace-normal break-words text-center"
            >
              <Home className="w-6 h-6 shrink-0" aria-hidden="true" />
              <span>{t.s05_main_choice}</span>
            </button>
          </>
        ) : (
          <>
            <div
              role="alert"
              style={{ backgroundColor: "#991B1B" }}
              className="w-full px-5 py-6 rounded-2xl text-white font-bold text-lg flex flex-col items-center justify-center gap-3 shadow-lg text-center whitespace-normal break-words"
            >
              <AlertCircle className="w-10 h-10 shrink-0" aria-hidden="true" />
              <span>{t.s05_error}</span>
            </div>

            <button
              type="button"
              disabled={retrying}
              onClick={onRetry}
              style={{ backgroundColor: "#EA580C" }}
              className="w-full min-h-[68px] px-5 py-4 rounded-2xl text-white font-bold text-lg flex items-center justify-center gap-3 shadow-md active:scale-[0.99] transition-transform cursor-pointer disabled:opacity-60 whitespace-normal break-words text-center"
            >
              <RotateCcw className="w-6 h-6 shrink-0" aria-hidden="true" />
              <span>{retrying ? t.s04_submitting : t.s05_retry}</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
