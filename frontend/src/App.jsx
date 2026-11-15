import { useEffect, useState } from "react";
import {
  getTranslations,
  isRtlLanguage,
} from "./i18n.js";
import { ensureSession, generateRequestId, submitReport } from "./api.js";
import S01LocationStart from "./components/S01LocationStart.jsx";
import S02ManualLocation from "./components/S02ManualLocation.jsx";
import S03MainChoice from "./components/S03MainChoice.jsx";
import S04DisasterSelection from "./components/S04DisasterSelection.jsx";
import S05SubmitResult from "./components/S05SubmitResult.jsx";
import S06SurroundingMap from "./components/S06SurroundingMap.jsx";
import DemoAuthorityPanel from "./components/DemoAuthorityPanel.jsx";

function hasValidLocation(loc) {
  return (
    loc !== null &&
    typeof loc.lat === "number" &&
    typeof loc.lng === "number" &&
    Number.isFinite(loc.lat) &&
    Number.isFinite(loc.lng) &&
    loc.lat >= -90 &&
    loc.lat <= 90 &&
    loc.lng >= -180 &&
    loc.lng <= 180 &&
    (loc.source === "gps" || loc.source === "manual")
  );
}

export default function App({ initialScreen = "S01", initialRoute }) {
  const [route, setRoute] = useState(() => {
    if (initialRoute) return initialRoute;
    if (typeof window !== "undefined") {
      return window.location.pathname === "/demo-authority"
        ? "/demo-authority"
        : "/";
    }
    return "/";
  });

  const [lang, setLang] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = window.localStorage.getItem("heatnode_lang");
        if (saved === "tr" || saved === "en") return saved;
      } catch {
        // ignore storage errors
      }
    }
    return "en";
  });

  function handleChangeLang(nextLang) {
    setLang(nextLang);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem("heatnode_lang", nextLang);
      } catch {
        // ignore storage errors
      }
    }
  }
  const [screen, setScreen] = useState(initialScreen);
  const [location, setLocation] = useState(null);
  const [reportMode, setReportMode] = useState("normal");
  const [pendingSubmission, setPendingSubmission] = useState(null);
  const [submitResult, setSubmitResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const t = getTranslations(lang);
  const isRtl = isRtlLanguage(lang);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = lang;
      document.documentElement.dir = isRtl ? "rtl" : "ltr";
    }
  }, [lang, isRtl]);

  useEffect(() => {
    ensureSession().catch(() => {});
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onPopState = () => {
      setRoute(
        window.location.pathname === "/demo-authority"
          ? "/demo-authority"
          : "/"
      );
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  function navigateToRoute(nextRoute) {
    setRoute(nextRoute);
    if (typeof window !== "undefined" && window.history?.pushState) {
      window.history.pushState({}, "", nextRoute);
    }
  }

  async function executeSubmit(payload) {
    setSubmitting(true);
    try {
      const res = await submitReport(payload);
      if (res && (res.status === "accepted" || res.status === "duplicate")) {
        setSubmitResult(res);
      } else {
        setSubmitResult({ status: "rejected", reason: res?.reason || "rejected" });
      }
    } catch {
      setSubmitResult({ status: "error" });
    } finally {
      setSubmitting(false);
      setScreen("S05");
    }
  }

  function handleSelectDisaster(disasterCode) {
    if (!hasValidLocation(location) || submitting) return;
    const payload = {
      disaster_type: disasterCode,
      report_mode: reportMode,
      latitude: location.lat,
      longitude: location.lng,
      location_source: location.source,
      client_request_id: generateRequestId(),
    };
    setPendingSubmission(payload);
    executeSubmit(payload);
  }

  function handleRetrySubmit() {
    if (!pendingSubmission || submitting) return;
    executeSubmit(pendingSubmission);
  }

  if (route === "/demo-authority") {
    return (
      <div
        dir={isRtl ? "rtl" : "ltr"}
        className="min-h-dvh bg-[#141415] text-[#ededed]"
      >
        <DemoAuthorityPanel
          t={t}
          lang={lang}
          onChangeLang={handleChangeLang}
          onNavigateHome={() => navigateToRoute("/")}
        />
      </div>
    );
  }

  // Guard: S03, S04, S05, S06 cannot be accessed without valid coordinates
  const validLoc = hasValidLocation(location);
  const activeScreen =
    !validLoc && ["S03", "S04", "S05", "S06"].includes(screen)
      ? "S01"
      : screen;

  return (
    <main
      dir={isRtl ? "rtl" : "ltr"}
      className="min-h-dvh bg-[#141415] text-[#ededed]"
    >
      {activeScreen === "S01" && (
        <S01LocationStart
          t={t}
          lang={lang}
          onChangeLang={handleChangeLang}
          onGpsSuccess={(lat, lng) => {
            setLocation({ lat, lng, source: "gps" });
            setScreen("S03");
          }}
          onManualSelect={() => setScreen("S02")}
        />
      )}

      {activeScreen === "S02" && (
        <S02ManualLocation
          t={t}
          initialLocation={location}
          onConfirm={(lat, lng) => {
            setLocation({ lat, lng, source: "manual" });
            setScreen("S03");
          }}
        />
      )}

      {activeScreen === "S03" && (
        <S03MainChoice
          t={t}
          onEmergency={() => {
            setReportMode("emergency");
            setScreen("S04");
          }}
          onNormal={() => {
            setReportMode("normal");
            setScreen("S04");
          }}
          onMap={() => setScreen("S06")}
        />
      )}

      {activeScreen === "S04" && (
        <S04DisasterSelection
          t={t}
          submitting={submitting}
          onSelectDisaster={handleSelectDisaster}
        />
      )}

      {activeScreen === "S05" && (
        <S05SubmitResult
          t={t}
          result={submitResult}
          retrying={submitting}
          onRetry={handleRetrySubmit}
          onViewMap={() => setScreen("S06")}
          onMainChoice={() => setScreen("S03")}
        />
      )}

      {activeScreen === "S06" && (
        <S06SurroundingMap
          t={t}
          location={location}
          onMainChoice={() => setScreen("S03")}
        />
      )}
    </main>
  );
}
