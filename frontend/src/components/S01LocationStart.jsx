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
    <div className="flex flex-col justify-center min-h-dvh p-4 sm:p-6 max-w-md mx-auto gap-4">
      {onChangeLang && (
        <div className="flex justify-end">
          <div
            role="group"
            aria-label="Language"
            className="inline-flex rounded-xl bg-slate-900 border border-slate-700 p-0.5 text-xs font-semibold"
          >
            <button
              type="button"
              onClick={() => onChangeLang("en")}
              aria-pressed={lang === "en"}
              className={`px-2.5 py-1 rounded-lg cursor-pointer transition-colors ${
                lang === "en"
                  ? "bg-emerald-600 text-white"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => onChangeLang("tr")}
              aria-pressed={lang === "tr"}
              className={`px-2.5 py-1 rounded-lg cursor-pointer transition-colors ${
                lang === "tr"
                  ? "bg-emerald-600 text-white"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              TR
            </button>
          </div>
        </div>
      )}
      <div className="flex-1 flex flex-col justify-center gap-4">
        <button
          type="button"
          onClick={handleAllowLocation}
          disabled={locating}
          style={{ backgroundColor: "#15803D" }}
          className="w-full min-h-[84px] px-5 py-5 rounded-2xl text-white font-bold text-lg sm:text-xl flex items-center justify-center gap-3 shadow-lg active:scale-[0.99] transition-transform cursor-pointer disabled:opacity-70 whitespace-normal break-words text-center"
        >
          <LocateFixed className="w-6 h-6 shrink-0" aria-hidden="true" />
          <span>{locating ? t.s01_locating : t.s01_allow_location}</span>
        </button>

        <button
          type="button"
          onClick={onManualSelect}
          style={{ backgroundColor: "#DC2626" }}
          className="w-full min-h-[84px] px-5 py-5 rounded-2xl text-white font-bold text-lg sm:text-xl flex items-center justify-center gap-3 shadow-lg active:scale-[0.99] transition-transform cursor-pointer whitespace-normal break-words text-center"
        >
          <MapPin className="w-6 h-6 shrink-0" aria-hidden="true" />
          <span>{t.s01_manual_location}</span>
        </button>

        {error && (
          <p
            role="alert"
            className="text-red-300 bg-red-950/60 border border-red-800 rounded-xl px-4 py-3 text-sm sm:text-base text-center"
          >
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
