import { useEffect } from "react";
import { AlertCircle, Cpu, Database, X } from "lucide-react";

export default function AiTransparencyModal({ open, onClose, t }) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
      data-testid="ai-transparency-backdrop"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ai-transparency-title"
        data-testid="ai-transparency-modal"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[85dvh] overflow-y-auto rounded-2xl bg-slate-900 border border-slate-700 text-slate-100 shadow-2xl p-5 sm:p-6 flex flex-col gap-5"
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
          <h2 id="ai-transparency-title" className="text-lg font-bold text-white">
            {t?.ai_modal_title || "AI Model, Data Sources & Limitations"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t?.ai_modal_close || "Close"}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* 3-Stage AI Pipeline */}
        <section className="flex flex-col gap-2.5">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm uppercase tracking-wider">
            <Cpu className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{t?.ai_modal_stages_title || "3-Stage AI Pipeline"}</span>
          </div>
          <div className="grid grid-cols-1 gap-2 text-xs sm:text-sm">
            <div className="rounded-xl bg-slate-800/70 border border-slate-700/80 p-3">
              <div className="font-bold text-white">
                {t?.ai_modal_stage1_title || "1. DBSCAN + Isolation Forest"}
              </div>
              <p className="text-slate-300 mt-0.5">
                {t?.ai_modal_stage1_desc ||
                  "Spatial-temporal clustering and anomaly verification to filter spoofed or isolated outlier reports."}
              </p>
            </div>
            <div className="rounded-xl bg-slate-800/70 border border-slate-700/80 p-3">
              <div className="font-bold text-white">
                {t?.ai_modal_stage2_title || "2. XGBoost + SHAP (1–3h Forecast)"}
              </div>
              <p className="text-slate-300 mt-0.5">
                {t?.ai_modal_stage2_desc ||
                  "Multi-horizon (+1h, +2h, +3h) urban heat & hazard propagation risk forecast with SHAP feature attribution."}
              </p>
            </div>
            <div className="rounded-xl bg-slate-800/70 border border-slate-700/80 p-3">
              <div className="font-bold text-white">
                {t?.ai_modal_stage3_title || "3. Weighted K-Means + Safezone Routing"}
              </div>
              <p className="text-slate-300 mt-0.5">
                {t?.ai_modal_stage3_desc ||
                  "Population-weighted cooling hub allocation and hazard-avoiding Dijkstra evacuation routing."}
              </p>
            </div>
          </div>
        </section>

        {/* Data Sources */}
        <section className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-sky-400 font-semibold text-sm uppercase tracking-wider">
            <Database className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{t?.ai_modal_sources_title || "Data Sources"}</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm text-slate-300">
            <li>
              {t?.ai_modal_source1 ||
                "Open-Meteo: Hourly weather & 5-year historical climate baseline."}
            </li>
            <li>
              {t?.ai_modal_source2 ||
                "OpenStreetMap / CartoDB: Base map tiles and Antalya arterial intersection graph."}
            </li>
            <li>
              {t?.ai_modal_source3 ||
                "Citizen Reports: Anonymous, neighborhood-only Zero-PII reports."}
            </li>
          </ul>
        </section>

        {/* Limitations & Next Pilot Step */}
        <section className="flex flex-col gap-2 rounded-xl bg-amber-950/40 border border-amber-700/60 p-3.5">
          <div className="flex items-center gap-2 text-amber-300 font-semibold text-sm uppercase tracking-wider">
            <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>
              {t?.ai_modal_limits_title ||
                "Explicit Limitations & Data Requirements"}
            </span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm text-amber-100/90">
            <li>
              {t?.ai_modal_limit1 ||
                "Trained on physics-proxy risk labels rather than municipal 112 / hospital heatstroke records."}
            </li>
            <li>
              {t?.ai_modal_limit2 ||
                "Uses Zero-PII neighborhood-centroid resolution rather than street-level GPS tracking."}
            </li>
            <li>
              {t?.ai_modal_limit3 ||
                "Next pilot step: Validation & calibration with Antalya Metropolitan Municipality and MGM."}
            </li>
          </ul>
        </section>

        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold cursor-pointer"
          >
            {t?.ai_modal_close || "Close"}
          </button>
        </div>
      </div>
    </div>
  );
}
