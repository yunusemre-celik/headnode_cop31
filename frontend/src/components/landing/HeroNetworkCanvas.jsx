import { useEffect, useRef } from "react";
import { ArrowRight, ShieldCheck } from "lucide-react";

const ANTALYA_COORDS = { lat: 36.89, lon: 30.71, label: "ANTALYA 36.89°N 30.71°E" };

const SIGNAL_HUBS = [
  { id: "belem", label: "BELÉM", lat: -1.45, lon: -48.5, color: "#4cc38a", phase: 0.1 },
  { id: "nyc", label: "NYC", lat: 40.71, lon: -74.0, color: "#d97706", phase: 0.35 },
  { id: "bonn", label: "BONN", lat: 50.73, lon: 7.09, color: "#4cc38a", phase: 0.55 },
  { id: "geneva", label: "GENEVA", lat: 46.2, lon: 6.14, color: "#4cc38a", phase: 0.72 },
  { id: "nairobi", label: "NAIROBI", lat: -1.29, lon: 36.82, color: "#dc2626", phase: 0.22 },
  { id: "dubai", label: "DUBAI", lat: 25.2, lon: 55.27, color: "#d97706", phase: 0.64 },
  { id: "tokyo", label: "TOKYO", lat: 35.67, lon: 139.65, color: "#dc2626", phase: 0.85 },
];

// Coarse continental polygons [lon, lat] for crisp dot-matrix world silhouette
const CONTINENT_POLYGONS = [
  // North America
  [
    [-168, 66], [-140, 70], [-95, 72], [-78, 62], [-55, 52], [-66, 44],
    [-80, 26], [-88, 21], [-97, 19], [-105, 20], [-117, 32], [-125, 48], [-152, 60],
  ],
  // South America
  [
    [-78, 10], [-62, 10], [-35, -6], [-38, -18], [-48, -28], [-58, -38],
    [-68, -54], [-75, -46], [-72, -18], [-81, -5],
  ],
  // Europe
  [
    [-9, 36], [-9, 43], [-2, 48], [6, 54], [10, 58], [22, 69],
    [42, 68], [58, 60], [50, 45], [30, 41], [22, 37], [12, 41], [3, 43], [-5, 36],
  ],
  // Africa
  [
    [-17, 15], [-6, 35], [11, 37], [32, 31], [43, 12], [51, 12],
    [40, -10], [32, -26], [20, -35], [14, -22], [9, 4], [-8, 5],
  ],
  // Asia
  [
    [27, 41], [44, 42], [60, 58], [85, 72], [135, 70], [170, 66],
    [142, 44], [128, 35], [120, 24], [108, 12], [98, 16], [80, 8],
    [68, 22], [55, 25], [36, 31], [28, 37],
  ],
  // Australia
  [
    [114, -22], [130, -12], [142, -11], [153, -26], [148, -38], [135, -35], [115, -34],
  ],
];

function pointInPolygon(lon, lat, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0];
    const yi = polygon[i][1];
    const xj = polygon[j][0];
    const yj = polygon[j][1];
    const intersect =
      yi > lat !== yj > lat &&
      lon < ((xj - xi) * (lat - yi)) / (yj - yi + 1e-9) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function isLand(lon, lat) {
  for (let i = 0; i < CONTINENT_POLYGONS.length; i++) {
    if (pointInPolygon(lon, lat, CONTINENT_POLYGONS[i])) return true;
  }
  return false;
}

function project(lon, lat, width, height) {
  const x = ((lon + 180) / 360) * width;
  const y = ((82 - lat) / 142) * height;
  return { x, y };
}

function buildLandDots() {
  const dots = [];
  for (let lon = -172; lon <= 174; lon += 5.5) {
    for (let lat = -54; lat <= 74; lat += 5.5) {
      if (isLand(lon, lat)) {
        dots.push({ lon, lat });
      }
    }
  }
  return dots;
}

const LAND_DOTS = buildLandDots();

function drawNetworkFrame(ctx, width, height, elapsedSec, reducedMotion) {
  ctx.clearRect(0, 0, width, height);

  // Subtle obsidian backdrop
  ctx.fillStyle = "#141415";
  ctx.fillRect(0, 0, width, height);

  // Faint latitude/longitude hairlines
  ctx.strokeStyle = "rgba(237, 237, 237, 0.04)";
  ctx.lineWidth = 1;
  for (let i = 1; i < 6; i++) {
    const y = (height / 6) * i;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  for (let i = 1; i < 12; i++) {
    const x = (width / 12) * i;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  // World dot matrix
  ctx.fillStyle = "rgba(237, 237, 237, 0.17)";
  const dotRadius = Math.max(1.1, Math.min(1.8, width / 620));
  for (let i = 0; i < LAND_DOTS.length; i++) {
    const p = project(LAND_DOTS[i].lon, LAND_DOTS[i].lat, width, height);
    ctx.beginPath();
    ctx.arc(p.x, p.y, dotRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  const target = project(ANTALYA_COORDS.lon, ANTALYA_COORDS.lat, width, height);

  // Cooperative signal arcs converging on Antalya
  for (let i = 0; i < SIGNAL_HUBS.length; i++) {
    const hub = SIGNAL_HUBS[i];
    const start = project(hub.lon, hub.lat, width, height);
    const midX = (start.x + target.x) * 0.5;
    const arcLift = Math.max(24, Math.hypot(target.x - start.x, target.y - start.y) * 0.24);
    const ctrlY = Math.min(start.y, target.y) - arcLift;

    ctx.strokeStyle = `${hub.color}44`;
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.quadraticCurveTo(midX, ctrlY, target.x, target.y);
    ctx.stroke();

    // Origin node dot
    ctx.fillStyle = hub.color;
    ctx.beginPath();
    ctx.arc(start.x, start.y, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Traveling cooperative signal packet
    const t = reducedMotion ? 0.58 : (elapsedSec * 0.28 + hub.phase) % 1;
    const inv = 1 - t;
    const px = inv * inv * start.x + 2 * inv * t * midX + t * t * target.x;
    const py = inv * inv * start.y + 2 * inv * t * ctrlY + t * t * target.y;

    ctx.fillStyle = hub.color;
    ctx.beginPath();
    ctx.arc(px, py, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Antalya convergence rings
  const pulse = reducedMotion ? 0.5 : (elapsedSec * 0.9) % 1;
  const ringRadius = 8 + pulse * 18;
  ctx.strokeStyle = `rgba(220, 38, 38, ${0.55 * (1 - pulse)})`;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(target.x, target.y, ringRadius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = "#4cc38a";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(target.x, target.y, 6.5, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = "#dc2626";
  ctx.beginPath();
  ctx.arc(target.x, target.y, 3.2, 0, Math.PI * 2);
  ctx.fill();

  // Antalya coordinate tag
  ctx.font = "600 10px 'IBM Plex Mono', ui-monospace, monospace";
  ctx.fillStyle = "#ededed";
  const tagX = Math.min(width - 155, target.x + 12);
  const tagY = Math.max(16, target.y - 10);
  ctx.fillText(ANTALYA_COORDS.label, tagX, tagY);
}

export default function HeroNetworkCanvas({ copy, onOpenApp, onOpenAuthority }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    let ctx = null;
    try {
      ctx = canvas.getContext("2d");
    } catch {
      ctx = null;
    }
    if (!ctx) return undefined;

    const reducedMotion =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let width = 960;
    let height = 420;
    let rafId = null;
    const startTime = typeof performance !== "undefined" ? performance.now() : Date.now();

    const syncSize = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(320, Math.round(rect.width || 960));
      height = Math.max(220, Math.round(rect.height || 420));
      const dpr = typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, 2) : 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    syncSize();

    let resizeObserver = null;
    if (typeof ResizeObserver === "function") {
      resizeObserver = new ResizeObserver(() => {
        syncSize();
        if (reducedMotion) {
          drawNetworkFrame(ctx, width, height, 0, true);
        }
      });
      resizeObserver.observe(canvas);
    }

    if (reducedMotion || typeof requestAnimationFrame !== "function") {
      drawNetworkFrame(ctx, width, height, 0, true);
      return () => {
        if (resizeObserver) resizeObserver.disconnect();
      };
    }

    const renderLoop = (now) => {
      const elapsedSec = (now - startTime) / 1000;
      drawNetworkFrame(ctx, width, height, elapsedSec, false);
      rafId = requestAnimationFrame(renderLoop);
    };

    rafId = requestAnimationFrame(renderLoop);

    return () => {
      if (rafId !== null && typeof cancelAnimationFrame === "function") {
        cancelAnimationFrame(rafId);
      }
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, []);

  return (
    <section
      id="network"
      className="relative overflow-hidden border-b border-[rgba(237,237,237,0.08)] bg-[#141415]"
    >
      <div className="mx-auto max-w-6xl px-4 pb-12 pt-10 sm:px-6 lg:px-8 lg:pb-16 lg:pt-14">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border border-[rgba(237,237,237,0.08)] bg-[#19191b] px-3.5 py-2">
          <span className="font-mono-tabular text-[11px] font-medium tracking-wider text-[#a1a1a6]">
            {copy.eyebrow}
          </span>
          <div className="flex flex-wrap items-center gap-4">
            {copy.telemetry.map((item) => (
              <div key={item.label} className="flex items-center gap-1.5 font-mono-tabular text-[11px]">
                <span className="text-[#85858b]">{item.label}:</span>
                <span className="font-semibold text-[#ededed]">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-5">
            <h1 className="text-3xl font-semibold tracking-tight text-[#ededed] sm:text-4xl lg:text-[42px] lg:leading-[1.12]">
              {copy.title}
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-[#a1a1a6] sm:text-base">
              {copy.subtitle}
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
              <button
                type="button"
                onClick={onOpenApp}
                className="unslop-transition inline-flex items-center justify-center gap-2 border border-[#dc2626] bg-[#dc2626] px-4 py-2.5 text-sm font-medium text-[#ededed] hover:bg-[#b91c1c] cursor-pointer"
              >
                <span>{copy.ctaApp}</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={onOpenAuthority}
                className="unslop-transition inline-flex items-center justify-center gap-2 border border-[rgba(237,237,237,0.14)] bg-[#19191b] px-4 py-2.5 text-sm font-medium text-[#ededed] hover:border-[rgba(237,237,237,0.28)] hover:bg-[#232325] cursor-pointer"
              >
                <ShieldCheck className="h-4 w-4 text-[#4cc38a]" aria-hidden="true" />
                <span>{copy.ctaAuthority}</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="border border-[rgba(237,237,237,0.08)] bg-[#0f0f10]">
              <div className="flex items-center justify-between border-b border-[rgba(237,237,237,0.08)] px-3.5 py-2">
                <span className="font-mono-tabular text-[11px] uppercase tracking-wider text-[#a1a1a6]">
                  {copy.canvasCaption}
                </span>
                <span className="inline-flex items-center gap-1.5 font-mono-tabular text-[11px] text-[#4cc38a]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#4cc38a]" />
                  LIVE MESH
                </span>
              </div>
              <div className="relative h-[260px] w-full sm:h-[320px] lg:h-[360px]">
                <canvas
                  ref={canvasRef}
                  aria-label={copy.canvasCaption}
                  className="block h-full w-full"
                />
              </div>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-[rgba(237,237,237,0.08)] bg-[#19191b] px-3.5 py-2.5">
                {copy.legend.map((entry) => (
                  <div key={entry.key} className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="font-mono-tabular text-[11px] text-[#a1a1a6]">
                      {entry.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
