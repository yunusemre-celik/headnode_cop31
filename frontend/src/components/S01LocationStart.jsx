import { useState } from "react";
import { LocateFixed, MapPin } from "lucide-react";

export default function S01LocationStart({
  t,
  lang = "en",
  onChangeLang,
  onGpsSuccess,
  onManualSelect,
}) {
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState("");

  function handleAllowLocation() {
    setError("");
    if (
      typeof navigator === "undefined" ||
      !navigator.geolocation ||
      typeof navigator.geolocation.getCurrentPosition !== "function"
    ) {
      setError(t.s01_location_error);
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        const lat = position?.coords?.latitude;
        const lng = position?.coords?.longitude;
        if (
          typeof lat === "number" &&
          typeof lng === "number" &&
          Number.isFinite(lat) &&
          Number.isFinite(lng) &&
          lat >= -90 &&
          lat <= 90 &&
          lng >= -180 &&
          lng <= 180
        ) {
          onGpsSuccess(lat, lng);
        } else {
          setError(t.s01_location_error);
        }
      },
      () => {
        setLocating(false);
        setError(t.s01_location_error);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  return (
    <div className="flex flex-col justify-between min-h-dvh p-4 sm:p-6 max-w-md mx-auto gap-4">
      <header className="flex items-center justify-between py-2">
        <div className="flex items-center gap-2">
          <span
            className="w-1.5 h-1.5 rounded-full bg-[#4cc38a] shrink-0"
            aria-hidden="true"
          />
          <span className="font-semibold text-sm text-[#ededed] tracking-tight">
            HEATNODE
          </span>
        </div>
        {onChangeLang && (
          <div
            role="group"
            aria-label="Language"
            className="inline-flex rounded-lg bg-[#19191b] border border-[#ededed]/[0.08] p-1 text-xs font-semibold"
          >
            <button
              type="button"
              onClick={() => onChangeLang("en")}
              aria-pressed={lang === "en"}
              className={`px-2.5 py-1 rounded-md cursor-pointer unslop-transition ${
                lang === "en"
                  ? "bg-[#232325] text-[#ededed]"
                  : "text-[#85858b] hover:text-[#ededed]"
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => onChangeLang("tr")}
              aria-pressed={lang === "tr"}
              className={`px-2.5 py-1 rounded-md cursor-pointer unslop-transition ${
                lang === "tr"
                  ? "bg-[#232325] text-[#ededed]"
                  : "text-[#85858b] hover:text-[#ededed]"
              }`}
            >
              TR
            </button>
          </div>
        )}
      </header>

      <div className="flex-1 flex flex-col justify-center gap-4">
        <button
          type="button"
          onClick={handleAllowLocation}
          disabled={locating}
          className="w-full bg-[#ededed] hover:bg-white text-[#141415] rounded-xl min-h-20 px-5 py-4 font-semibold text-base sm:text-lg flex items-center justify-center gap-3 active:scale-[0.98] unslop-transition cursor-pointer disabled:opacity-50 whitespace-normal break-words text-center"
        >
          <LocateFixed className="w-5 h-5 shrink-0 stroke-[1.5]" aria-hidden="true" />
          <span>{locating ? t.s01_locating : t.s01_allow_location}</span>
        </button>

        <button
          type="button"
          onClick={onManualSelect}
          className="w-full bg-[#19191b] hover:bg-[#232325] border border-[#ededed]/[0.08] hover:border-[#ededed]/[0.14] text-[#ededed] rounded-xl min-h-20 px-5 py-4 font-medium text-base sm:text-lg flex items-center justify-center gap-3 active:scale-[0.98] unslop-transition cursor-pointer whitespace-normal break-words text-center"
        >
          <MapPin className="w-5 h-5 shrink-0 stroke-[1.5] text-[#a1a1a6]" aria-hidden="true" />
          <span>{t.s01_manual_location}</span>
        </button>

        {error && (
          <p
            role="alert"
            className="bg-[#dc2626]/10 border border-[#dc2626]/30 text-[#fca5a5] rounded-xl px-4 py-3 text-sm text-center"
          >
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
