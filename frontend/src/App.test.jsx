import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import App from "./App.jsx";
import { detectInitialLanguage, DISASTER_CODES, TRANSLATIONS } from "./i18n.js";

// Mock react-leaflet so Leaflet DOM/canvas calls don't fail in jsdom
vi.mock("react-leaflet", () => ({
  MapContainer: ({ children }) => (
    <div data-testid="leaflet-map">{children}</div>
  ),
  TileLayer: () => null,
  Circle: () => null,
  CircleMarker: ({ children }) => (
    <div data-testid="leaflet-marker">{children}</div>
  ),
  Popup: ({ children }) => <div>{children}</div>,
  useMapEvents: (handlers) => {
    // Expose a clickable trigger for S02 pin placement in tests
    globalThis.__leafletClickHandler = handlers?.click;
    return null;
  },
}));

describe("Heatnode i18n", () => {
  it("detects supported languages and falls back to en", () => {
    expect(detectInitialLanguage("tr-TR")).toBe("tr");
    expect(detectInitialLanguage("ar-SA")).toBe("ar");
    expect(detectInitialLanguage("es-MX")).toBe("es");
    expect(detectInitialLanguage("zh-CN")).toBe("zh");
    expect(detectInitialLanguage("en-GB")).toBe("en");
    expect(detectInitialLanguage("fr-FR")).toBe("en");
  });
});

describe("Heatnode PWA Flow", () => {
  const originalLang = navigator.language;
  const originalGeolocation = navigator.geolocation;

  beforeEach(() => {
    Object.defineProperty(navigator, "language", {
      value: "tr-TR",
      configurable: true,
    });
    globalThis.fetch = vi.fn((url) => {
      if (String(url).includes("/api/session")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ browser_id: "11111111-1111-4111-8111-111111111111" }),
        });
      }
      if (String(url).includes("/api/map")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              query_lat: 36.89,
              query_lng: 30.71,
              radius_m: 500,
              model_version: "rule-v1",
              active_reports: [],
              events: [],
              heatmap_points: [],
            }),
        });
      }
      if (String(url).includes("/api/demo-authority")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              is_demo: true,
              notice: "DEMO ONLY",
              records: [
                {
                  id: "rec-1",
                  report_id: "rep-12345678",
                  event_id: "evt-12345678",
                  disaster_type: "wildfire",
                  latitude: 36.89,
                  longitude: 30.71,
                  report_mode: "emergency",
                  accepted_at: "2026-11-14T12:00:00Z",
                  is_demo: true,
                  risk_1h: 45,
                  risk_2h: 62,
                  risk_3h: 78,
                  anomaly_flag: true,
                },
              ],
            }),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });
  });

  afterEach(() => {
    Object.defineProperty(navigator, "language", {
      value: originalLang,
      configurable: true,
    });
    Object.defineProperty(navigator, "geolocation", {
      value: originalGeolocation,
      configurable: true,
    });
    vi.restoreAllMocks();
  });

  it("falls back to English when browser language is unsupported", () => {
    Object.defineProperty(navigator, "language", {
      value: "fr-FR",
      configurable: true,
    });

    render(<App />);
    expect(screen.getByText("Allow location access")).toBeInTheDocument();
    expect(screen.queryByText("Go back")).not.toBeInTheDocument();
    expect(screen.queryByText("Geri dön")).not.toBeInTheDocument();
  });

  it("blocks S03 without valid coordinates and stays on S01 on GPS deny", () => {
    Object.defineProperty(navigator, "geolocation", {
      value: {
        getCurrentPosition: (_ok, err) => err({ code: 1 }),
      },
      configurable: true,
    });

    render(<App initialScreen="S03" />);
    // Guarded: falls back to S01
    expect(screen.getByText("Konum erişimine izin ver")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Konum erişimine izin ver"));
    // Stays on S01
    expect(screen.getByText("Konum erişimine izin ver")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.queryByText("Geri dön")).not.toBeInTheDocument();
  });

  it("supports S02 manual pin placement and renders no BackButton on S01-S06", async () => {
    render(<App />);
    // S01: no BackButton
    expect(screen.queryByText("Geri dön")).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("Konumumu kendim seçeceğim"));
    // S02: no BackButton
    expect(screen.getByTestId("leaflet-map")).toBeInTheDocument();
    expect(screen.queryByText("Geri dön")).not.toBeInTheDocument();

    const confirmBtn = screen.getByText("Konumu onayla").closest("button");
    expect(confirmBtn).toBeDisabled();

    // Simulate map click
    act(() => {
      globalThis.__leafletClickHandler({ latlng: { lat: 36.89, lng: 30.71 } });
    });

    await waitFor(() => {
      expect(confirmBtn).not.toBeDisabled();
    });

    fireEvent.click(confirmBtn);
    // S03: no BackButton
    expect(screen.getByText("Acil bir durumdayım")).toBeInTheDocument();
    expect(screen.queryByText("Geri dön")).not.toBeInTheDocument();
  });

  it("submits report on S04 tap, shows Raporunuz ulaştı on accepted, and reuses client_request_id on retry", async () => {
    Object.defineProperty(navigator, "geolocation", {
      value: {
        getCurrentPosition: (ok) =>
          ok({ coords: { latitude: 36.8969, longitude: 30.7133 } }),
      },
      configurable: true,
    });

    const reportBodies = [];
    let shouldFail = true;

    globalThis.fetch = vi.fn((url, opts) => {
      if (String(url).includes("/api/session")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ browser_id: "11111111-1111-4111-8111-111111111111" }),
        });
      }
      if (String(url).includes("/api/reports")) {
        reportBodies.push(JSON.parse(opts.body));
        if (shouldFail) {
          return Promise.reject(new Error("Network error"));
        }
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              status: "accepted",
              event_id: "evt-1",
              demo_record_created: true,
            }),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    render(<App />);
    fireEvent.click(screen.getByText("Konum erişimine izin ver"));

    // Now on S03
    expect(screen.getByText("Acil bir durumdayım")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Acil bir durumdayım"));

    // Now on S04: all 10 disaster buttons rendered, no BackButton
    expect(screen.getAllByRole("button").length).toBe(DISASTER_CODES.length);
    expect(screen.queryByText("Geri dön")).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("Orman yangını"));

    // Network failure -> S05 must NOT show Raporunuz ulaştı, no BackButton
    await waitFor(() => {
      expect(screen.getByText("Tekrar dene")).toBeInTheDocument();
    });
    expect(screen.queryByText("Raporunuz ulaştı")).not.toBeInTheDocument();
    expect(screen.queryByText("Geri dön")).not.toBeInTheDocument();

    // Retry with server succeeding
    shouldFail = false;
    fireEvent.click(screen.getByText("Tekrar dene"));

    await waitFor(() => {
      expect(screen.getByText("Raporunuz ulaştı")).toBeInTheDocument();
    });
    expect(screen.queryByText("Geri dön")).not.toBeInTheDocument();

    expect(reportBodies.length).toBe(2);
    expect(reportBodies[0].client_request_id).toBe(
      reportBodies[1].client_request_id
    );
    expect(reportBodies[0].disaster_type).toBe("wildfire");
    expect(reportBodies[0].report_mode).toBe("emergency");
    expect(reportBodies[0].location_source).toBe("gps");
  });

  it("renders unified live S06 map with color legend, no score/refresh UI, and Ana seçime dön button", async () => {
    Object.defineProperty(navigator, "geolocation", {
      value: {
        getCurrentPosition: (ok) =>
          ok({ coords: { latitude: 36.8969, longitude: 30.7133 } }),
      },
      configurable: true,
    });

    render(<App />);
    fireEvent.click(screen.getByText("Konum erişimine izin ver"));
    fireEvent.click(screen.getByText("Çevrem hakkında bilgi almak istiyorum"));

    await waitFor(() => {
      expect(screen.getByText("Canlı akış")).toBeInTheDocument();
    });

    // No tablist, no Confidence / Criticality / Active Reports / Refresh / BackButton
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
    expect(screen.queryByText("Güvenilirlik")).not.toBeInTheDocument();
    expect(screen.queryByText("Kritiklik")).not.toBeInTheDocument();
    expect(screen.queryByText("Aktif rapor")).not.toBeInTheDocument();
    expect(screen.queryByText("Yenile")).not.toBeInTheDocument();
    expect(screen.queryByText("Geri dön")).not.toBeInTheDocument();

    // All disaster types rendered in the color legend
    for (const code of DISASTER_CODES) {
      expect(screen.getByText(TRANSLATIONS.tr.disasters[code])).toBeInTheDocument();
    }

    // Has "Ana seçime dön" button that returns to S03
    const mainChoiceBtn = screen.getByText("Ana seçime dön");
    expect(mainChoiceBtn).toBeInTheDocument();
    fireEvent.click(mainChoiceBtn);
    expect(screen.getByText("Acil bir durumdayım")).toBeInTheDocument();
  });

  it("renders Demo Authority Panel clearly labeled DEMO with live stream and ML badges", async () => {
    render(<App initialRoute="/demo-authority" />);
    expect(
      screen.getByText(/DEMO — NO REAL INSTITUTION NOTIFICATIONS/i)
    ).toBeInTheDocument();
    expect(screen.getByText("Canlı akış")).toBeInTheDocument();
    expect(screen.queryByText("Yenile")).not.toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Orman yangını")).toBeInTheDocument();
    });
    expect(screen.getByText("+1h 45%")).toBeInTheDocument();
    expect(screen.getByText("+2h 62%")).toBeInTheDocument();
    expect(screen.getByText("+3h 78%")).toBeInTheDocument();
    expect(screen.getByText("Anomali")).toBeInTheDocument();
  });
});
