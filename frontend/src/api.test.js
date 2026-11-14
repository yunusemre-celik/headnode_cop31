import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("API base & Service Worker resilience", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("trims whitespace in VITE_API_BASE_URL when calling API endpoints", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "  https://example-backend.up.railway.app/  ");
    const fetchMock = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ status: "accepted" }),
      })
    );
    globalThis.fetch = fetchMock;

    const { submitReport } = await import("./api.js");
    await submitReport({
      disaster_type: "wildfire",
      report_mode: "normal",
      latitude: 36.89,
      longitude: 30.71,
      location_source: "gps",
      client_request_id: "11111111-1111-4111-8111-111111111111",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://example-backend.up.railway.app/api/reports",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("uses network-first for HTML navigation in sw.js and bumps cache version", () => {
    const swPath = path.resolve(process.cwd(), "public/sw.js");
    const swCode = fs.readFileSync(swPath, "utf8");
    expect(swCode).not.toContain('CACHE_NAME = "heatnode-shell-v1"');
    expect(swCode).toMatch(/request\.mode\s*===\s*["']navigate["']/);
  });
});
