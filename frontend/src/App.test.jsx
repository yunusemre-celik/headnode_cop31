import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import App from "./App.jsx";
import * as api from "./api.js";

vi.mock("./api.js", () => ({
  fetchState: vi.fn(),
  submitReport: vi.fn(),
  simulateSurge: vi.fn(),
  resetDemo: vi.fn(),
  approveAlert: vi.fn(),
}));

vi.mock("react-leaflet", () => ({
  MapContainer: ({ children }) => <div data-testid="leaflet-map">{children}</div>,
  TileLayer: () => <div data-testid="leaflet-tile" />,
  CircleMarker: ({ children }) => <div data-testid="leaflet-circle">{children}</div>,
  Polyline: ({ children }) => <div data-testid="leaflet-polyline">{children}</div>,
  Marker: ({ children }) => <div data-testid="leaflet-marker">{children}</div>,
  Popup: ({ children }) => <div>{children}</div>,
  Tooltip: ({ children }) => <div>{children}</div>,
  useMap: () => ({ setView: vi.fn() }),
}));

vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }) => <div data-testid="recharts-container">{children}</div>,
  BarChart: ({ children }) => <div data-testid="recharts-barchart">{children}</div>,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  Cell: () => null,
}));

function makeMockState(overrides = {}) {
  return {
    weather: {
      temperature_c: 34.2,
      relative_humidity: 42,
      wind_speed_kmh: 14,
      wind_direction_deg: 210,
      solar_radiation_wm2: 780,
      utci_c: 36.8,
      stress_category: "Strong Heat Stress",
      source: "open-meteo",
      timestamp: "2026-11-13T12:00:00Z",
    },
    alert_state: {
      status: "MONITORING",
      hub_count: 3,
      approved_by: null,
      updated_at: "2026-11-13T12:00:00Z",
    },
    public_alert_active: false,
    any_verified_anomaly: false,
    node_states: [
      {
        node_id: "kepez_dokuma",
        name: "Dokuma",
        district: "Kepez",
        lat: 36.912,
        lon: 30.678,
        report_count: 1,
        verified_anomaly: false,
        risk_now: 0.25,
        risk_1h: 0.3,
        risk_2h: 0.35,
        risk_3h: 0.4,
        threshold_prob_2h: 0.32,
        shap_drivers: [
          { driver: "UTCI Heat Index", impact: 0.14 },
          { driver: "15-min Report Surge", impact: 0.08 },
        ],
      },
      {
        node_id: "muratpasa_kaleici",
        name: "Kaleici",
        district: "Muratpasa",
        lat: 36.884,
        lon: 30.704,
        report_count: 0,
        verified_anomaly: false,
        risk_now: 0.18,
        risk_1h: 0.2,
        risk_2h: 0.22,
        risk_3h: 0.24,
        threshold_prob_2h: 0.2,
        shap_drivers: [{ driver: "UTCI Heat Index", impact: 0.1 }],
      },
    ],
    propagation_edges: [],
    hubs: [
      {
        hub_id: "hub_1",
        name: "Dokuma Park Cooling Center",
        node_id: "kepez_dokuma",
        district: "Kepez",
        lat: 36.915,
        lon: 30.68,
        assigned_nodes: ["kepez_dokuma"],
        hub_type: "Cooling & Hydration Hub",
      },
    ],
    nearest_hub_by_node: {
      kepez_dokuma: {
        hub_id: "hub_1",
        name: "Dokuma Park Cooling Center",
        distance_km: 0.42,
      },
      muratpasa_kaleici: {
        hub_id: "hub_1",
        name: "Dokuma Park Cooling Center",
        distance_km: 3.85,
      },
    },
    ...overrides,
  };
}

describe("HEATNODE AI App", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders top navigation with Citizen View, Crisis Console, and Simulate Crowd Surge", async () => {
    api.fetchState.mockResolvedValue(makeMockState());

    render(<App />);

    expect(await screen.findByRole("button", { name: /Citizen View/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Crisis Console/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Simulate Crowd Surge/i })).toBeInTheDocument();
  });

  it("shows Monitoring status and hides active evacuation banner when public_alert_active is false", async () => {
    api.fetchState.mockResolvedValue(
      makeMockState({
        public_alert_active: false,
        alert_state: {
          status: "MONITORING",
          hub_count: 3,
          approved_by: null,
          updated_at: "2026-11-13T12:00:00Z",
        },
      })
    );

    render(<App />);

    expect(await screen.findByText(/Monitoring — No Active Emergency Alert/i)).toBeInTheDocument();
    expect(screen.queryByText(/ACTIVE HEAT EMERGENCY ALERT/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Nearest Safe Cooling Hub/i)).not.toBeInTheDocument();
  });

  it("displays active alert banner and nearest Safe Hub details when public_alert_active is true", async () => {
    api.fetchState.mockResolvedValue(
      makeMockState({
        public_alert_active: true,
        any_verified_anomaly: true,
        alert_state: {
          status: "ACTIVE",
          hub_count: 3,
          approved_by: "Municipal Operator",
          updated_at: "2026-11-13T12:05:00Z",
        },
      })
    );

    render(<App />);

    expect(await screen.findByText(/ACTIVE HEAT EMERGENCY ALERT/i)).toBeInTheDocument();
    expect(screen.getByText("Nearest Safe Cooling Hub")).toBeInTheDocument();
    expect(screen.getAllByText(/Dokuma Park Cooling Center/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/0\.42 km/i)).toBeInTheDocument();
  });

  it("switches to Crisis Console view when Crisis Console tab is clicked", async () => {
    api.fetchState.mockResolvedValue(
      makeMockState({
        any_verified_anomaly: true,
        alert_state: {
          status: "PENDING_APPROVAL",
          hub_count: 3,
          approved_by: null,
          updated_at: "2026-11-13T12:05:00Z",
        },
      })
    );

    render(<App />);

    const consoleTab = await screen.findByRole("button", { name: /Crisis Console/i });
    fireEvent.click(consoleTab);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Approve & Activate Public Alert/i })).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: "+2h" })).toBeInTheDocument();
  });
});
