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
  Polyline: ({ positions }) => (
    <div data-testid="leaflet-polyline" data-count={positions?.length || 0} />
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
    window.localStorage.removeItem("heatnode_lang");
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
    window.localStorage.removeItem("heatnode_lang");
    window.history.replaceState({}, "", "/");
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

  it("defaults to English even when browser language is tr-TR and supports TR/EN switching", () => {
    render(<App initialRoute="/app" />);
    expect(screen.getByText("Allow location access")).toBeInTheDocument();
    expect(screen.queryByText("Go back")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "TR" }));
    expect(screen.getByText("Konum erişimine izin ver")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "EN" }));
    expect(screen.getByText("Allow location access")).toBeInTheDocument();
  });

  it("blocks S03 without valid coordinates and stays on S01 on GPS deny", () => {
    Object.defineProperty(navigator, "geolocation", {
      value: {
        getCurrentPosition: (_ok, err) => err({ code: 1 }),
      },
      configurable: true,
    });

    render(<App initialRoute="/app" initialScreen="S03" />);
    // Guarded: falls back to S01
    expect(screen.getByText("Allow location access")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Allow location access"));
    // Stays on S01
    expect(screen.getByText("Allow location access")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.queryByText("Go back")).not.toBeInTheDocument();
  });

  it("supports S02 manual pin placement and renders essential navigation controls", async () => {
    render(<App initialRoute="/app" />);
    // S01: no BackButton, shows Zero-PII privacy note
    expect(screen.queryByText("Go back")).not.toBeInTheDocument();
    expect(screen.getByText(/Zero-PII/i)).toBeInTheDocument();

    fireEvent.click(screen.getByText("I will choose my location manually"));
    // S02: has Back button
    expect(screen.getByTestId("leaflet-map")).toBeInTheDocument();
    expect(screen.getByText("Go back")).toBeInTheDocument();

    const confirmBtn = screen.getByText("Confirm location").closest("button");
    expect(confirmBtn).toBeDisabled();

    // Simulate map click
    act(() => {
      globalThis.__leafletClickHandler({ latlng: { lat: 36.89, lng: 30.71 } });
    });

    await waitFor(() => {
      expect(confirmBtn).not.toBeDisabled();
    });

    fireEvent.click(confirmBtn);
    // S03: shows location badge and Change location button
    expect(screen.getByText("I am in an emergency")).toBeInTheDocument();
    expect(screen.getByText("Location: Manual")).toBeInTheDocument();
    expect(screen.getByText("Change location")).toBeInTheDocument();
  });

  it("submits report on S04 tap, shows confirmation on accepted, and reuses client_request_id on retry", async () => {
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

    render(<App initialRoute="/app" />);
    fireEvent.click(screen.getByText("Allow location access"));

    // Now on S03
    expect(screen.getByText("I am in an emergency")).toBeInTheDocument();
    fireEvent.click(screen.getByText("I am in an emergency"));

    // Now on S04: all 10 disaster buttons + 1 Back button + Emergency mode badge
    expect(screen.getAllByRole("button").length).toBe(DISASTER_CODES.length + 1);
    expect(screen.getByText("Go back")).toBeInTheDocument();
    expect(screen.getByText("Emergency")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Wildfire"));

    // Network failure -> S05 must NOT show confirmation, no BackButton
    await waitFor(() => {
      expect(screen.getByText("Try again")).toBeInTheDocument();
    });
    expect(
      screen.queryByText("Your report has been received")
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Go back")).not.toBeInTheDocument();

    // Retry with server succeeding
    shouldFail = false;
    fireEvent.click(screen.getByText("Try again"));

    await waitFor(() => {
      expect(
        screen.getByText("Your report has been received")
      ).toBeInTheDocument();
    });
    expect(screen.queryByText("Go back")).not.toBeInTheDocument();

    expect(reportBodies.length).toBe(2);
    expect(reportBodies[0].client_request_id).toBe(
      reportBodies[1].client_request_id
    );
    expect(reportBodies[0].disaster_type).toBe("wildfire");
    expect(reportBodies[0].report_mode).toBe("emergency");
    expect(reportBodies[0].location_source).toBe("gps");
  });

  it("renders unified live S06 map with color legend, no score/refresh UI, and Return to main choice button", async () => {
    Object.defineProperty(navigator, "geolocation", {
      value: {
        getCurrentPosition: (ok) =>
          ok({ coords: { latitude: 36.8969, longitude: 30.7133 } }),
      },
      configurable: true,
    });

    render(<App initialRoute="/app" />);
    fireEvent.click(screen.getByText("Allow location access"));
    fireEvent.click(
      screen.getByText("I want information about my surroundings")
    );

    await waitFor(() => {
      expect(screen.getByText("Live stream")).toBeInTheDocument();
    });

    // No tablist, no Confidence / Criticality / Active Reports / Refresh / BackButton
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
    expect(screen.queryByText("Confidence")).not.toBeInTheDocument();
    expect(screen.queryByText("Criticality")).not.toBeInTheDocument();
    expect(screen.queryByText("Active reports")).not.toBeInTheDocument();
    expect(screen.queryByText("Refresh")).not.toBeInTheDocument();
    expect(screen.queryByText("Go back")).not.toBeInTheDocument();

    // All disaster types rendered in the color legend
    for (const code of DISASTER_CODES) {
      expect(screen.getByText(TRANSLATIONS.en.disasters[code])).toBeInTheDocument();
    }

    // Has "Return to main choice" button that returns to S03
    const mainChoiceBtn = screen.getByText("Return to main choice");
    expect(mainChoiceBtn).toBeInTheDocument();
    fireEvent.click(mainChoiceBtn);
    expect(screen.getByText("I am in an emergency")).toBeInTheDocument();
  });

  it("renders Demo Authority Panel clearly labeled DEMO with live stream, ML badges, TR/EN switcher, and AI Transparency modal", async () => {
    render(<App initialRoute="/demo-authority" />);
    expect(
      screen.getByText(/DEMO — NO REAL INSTITUTION NOTIFICATIONS/i)
    ).toBeInTheDocument();
    expect(screen.getByText("Live stream")).toBeInTheDocument();
    expect(screen.queryByText("Refresh")).not.toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Wildfire")).toBeInTheDocument();
    });
    expect(screen.getByText("+1h 45%")).toBeInTheDocument();
    expect(screen.getByText("+2h 62%")).toBeInTheDocument();
    expect(screen.getByText("+3h 78%")).toBeInTheDocument();
    expect(screen.getByText("Anomaly")).toBeInTheDocument();

    // Open AI Model & Limitations modal
    fireEvent.click(screen.getByText("AI Model & Limitations"));
    const modal = screen.getByTestId("ai-transparency-modal");
    expect(modal).toBeInTheDocument();
    expect(modal).toHaveTextContent(/DBSCAN \+ Isolation Forest/i);
    expect(modal).toHaveTextContent(/XGBoost \+ SHAP/i);
    expect(modal).toHaveTextContent(/Weighted K-Means/i);
    expect(modal).toHaveTextContent(/Open-Meteo/i);
    expect(modal).toHaveTextContent(/OpenStreetMap/i);
    expect(modal).toHaveTextContent(/physics-proxy risk labels/i);
    expect(modal).toHaveTextContent(/Antalya Metropolitan Municipality/i);

    // Close modal
    fireEvent.click(screen.getByText("Close"));
    expect(
      screen.queryByTestId("ai-transparency-modal")
    ).not.toBeInTheDocument();

    // Switch to TR in Crisis Console
    fireEvent.click(screen.getByRole("button", { name: "TR" }));
    expect(screen.getByText("Canlı akış")).toBeInTheDocument();
    expect(screen.getByText("Orman yangını")).toBeInTheDocument();
  });

  it("renders safezone markers and evacuation route polyline on S06SurroundingMap", async () => {
    Object.defineProperty(navigator, "geolocation", {
      value: {
        getCurrentPosition: (success) =>
          success({ coords: { latitude: 36.852, longitude: 30.608 } }),
      },
      configurable: true,
    });

    const origFetch = globalThis.fetch;
    globalThis.fetch = vi.fn((url, opts) => {
      if (String(url).includes("/api/map")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              query_lat: 36.852,
              query_lng: 30.608,
              radius_m: 500,
              model_version: "rule-v1",
              active_reports: [],
              events: [],
              safezones: [
                {
                  node_id: "muratpasa_meltem",
                  name: "Meltem",
                  district: "Muratpaşa",
                  intersection_name: "Meltem Blvd & Tarik Akiltopu St",
                  lat: 36.886,
                  lng: 30.665,
                  is_active: true,
                  is_hazardous: false,
                },
              ],
              safe_route: {
                target_safezone: {
                  node_id: "muratpasa_meltem",
                  name: "Meltem",
                  district: "Muratpaşa",
                  intersection_name: "Meltem Blvd & Tarik Akiltopu St",
                  lat: 36.886,
                  lng: 30.665,
                  is_active: true,
                  is_hazardous: false,
                },
                waypoints: [
                  [36.852, 30.608],
                  [36.888, 30.638],
                  [36.886, 30.665],
                ],
                steps: [
                  {
                    node_id: "konyaalti_toros",
                    name: "Toros",
                    intersection_name: "Anadolu Ave & Uncali St",
                    lat: 36.888,
                    lng: 30.638,
                  },
                  {
                    node_id: "muratpasa_meltem",
                    name: "Meltem",
                    intersection_name: "Meltem Blvd & Tarik Akiltopu St",
                    lat: 36.886,
                    lng: 30.665,
                  },
                ],
                total_distance_km: 4.5,
                avoided_all_hazards: true,
                status: "safe",
              },
            }),
        });
      }
      return origFetch(url, opts);
    });

    render(<App initialRoute="/app" />);
    fireEvent.click(screen.getByText("Allow location access"));
    fireEvent.click(
      screen.getByText("I want information about my surroundings")
    );

    await waitFor(() => {
      expect(screen.getByTestId("safe-route-banner")).toBeInTheDocument();
    });
    expect(screen.getByTestId("leaflet-polyline")).toHaveAttribute(
      "data-count",
      "3"
    );
    expect(screen.getByText(/4\.5 km/)).toBeInTheDocument();
    expect(screen.getByText("Toros → Meltem")).toBeInTheDocument();
    expect(
      screen.getByText("Avoids all active hazard zones")
    ).toBeInTheDocument();
  });

  it("allows admin to toggle safezone nodes on DemoAuthorityPanel", async () => {
    const origFetch = globalThis.fetch;
    globalThis.fetch = vi.fn((url, opts) => {
      if (String(url).includes("/api/safezones/muratpasa_meltem/toggle")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              node_id: "muratpasa_meltem",
              name: "Meltem",
              district: "Muratpaşa",
              intersection_name: "Meltem Blvd & Tarik Akiltopu St",
              lat: 36.886,
              lng: 30.665,
              is_active: true,
              is_hazardous: false,
            }),
        });
      }
      if (String(url).includes("/api/demo-authority")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              is_demo: true,
              records: [],
              nodes: [
                {
                  node_id: "muratpasa_meltem",
                  name: "Meltem",
                  district: "Muratpaşa",
                  intersection_name: "Meltem Blvd & Tarik Akiltopu St",
                  lat: 36.886,
                  lng: 30.665,
                  is_active: false,
                  is_hazardous: false,
                },
              ],
            }),
        });
      }
      return origFetch(url, opts);
    });

    render(<App initialRoute="/demo-authority" />);

    await waitFor(() => {
      expect(screen.getByText("Meltem · Muratpaşa")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Meltem · Muratpaşa"));

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/safezones/muratpasa_meltem/toggle"),
        expect.objectContaining({ method: "POST" })
      );
    });
  });

  it("renders LandingPage at '/' and falls back unknown paths to '/'", () => {
    render(<App />);
    expect(screen.getByText("HEATNODE AI")).toBeInTheDocument();
    expect(
      screen.getByText("Human cooperation, accelerated to machine speed.")
    ).toBeInTheDocument();
    expect(screen.queryByText("Allow location access")).not.toBeInTheDocument();

    const { unmount } = render(<App initialRoute="/non-existent-route" />);
    expect(
      screen.getAllByText("Human cooperation, accelerated to machine speed.").length
    ).toBeGreaterThan(0);
    unmount();
  });

  it("supports TR/EN language toggle on LandingPage and persists heatnode_lang", () => {
    render(<App initialRoute="/" />);
    expect(
      screen.getByText("Human cooperation, accelerated to machine speed.")
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "TR" }));
    expect(window.localStorage.getItem("heatnode_lang")).toBe("tr");
    expect(
      screen.getByText("İnsan iş birliği, makine hızında eyleme dönüşür.")
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "EN" }));
    expect(window.localStorage.getItem("heatnode_lang")).toBe("en");
    expect(
      screen.getByText("Human cooperation, accelerated to machine speed.")
    ).toBeInTheDocument();
  });

  it("navigates from LandingPage CTAs to '/app' and '/demo-authority'", () => {
    const { unmount } = render(<App initialRoute="/" />);
    fireEvent.click(
      screen.getAllByRole("button", { name: /Launch Citizen App \(\/app\)/i })[0]
    );
    expect(window.location.pathname).toBe("/app");
    expect(screen.getByText("Allow location access")).toBeInTheDocument();
    unmount();

    window.history.replaceState({}, "", "/");
    render(<App initialRoute="/" />);
    fireEvent.click(
      screen.getAllByRole("button", {
        name: /Open Crisis Console \(\/demo-authority\)/i,
      })[0]
    );
    expect(window.location.pathname).toBe("/demo-authority");
    expect(
      screen.getByText(/DEMO — NO REAL INSTITUTION NOTIFICATIONS/i)
    ).toBeInTheDocument();
  });
});
