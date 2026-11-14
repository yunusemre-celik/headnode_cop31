const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").trim().replace(/\/$/, "");
const BROWSER_ID_KEY = "heatnode_browser_id";

function getStoredBrowserId() {
  try {
    return window.localStorage.getItem(BROWSER_ID_KEY) || "";
  } catch {
    return "";
  }
}

function setStoredBrowserId(id) {
  if (!id) return;
  try {
    window.localStorage.setItem(BROWSER_ID_KEY, id);
  } catch {
    // Ignore storage errors in restricted environments
  }
}

export function generateRequestId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

async function apiFetch(path, options = {}) {
  const browserId = getStoredBrowserId();
  const headers = {
    ...(options.headers || {}),
  };
  if (browserId && !headers["X-Browser-Id"]) {
    headers["X-Browser-Id"] = browserId;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    ...options,
    headers,
  });

  if (!response.ok) {
    let detail = `HTTP ${response.status}`;
    try {
      const errBody = await response.json();
      detail = errBody?.detail || errBody?.message || detail;
    } catch {
      // keep status text
    }
    const err = new Error(detail);
    err.status = response.status;
    throw err;
  }

  return response.json();
}

export async function ensureSession() {
  const data = await apiFetch("/api/session", { method: "POST" });
  if (data?.browser_id) {
    setStoredBrowserId(data.browser_id);
  }
  return data;
}

export async function submitReport({
  disaster_type,
  report_mode,
  latitude,
  longitude,
  location_source,
  client_request_id,
}) {
  return apiFetch("/api/reports", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      disaster_type,
      report_mode,
      latitude,
      longitude,
      location_source,
      client_request_id,
    }),
  });
}

export async function fetchMapData({ lat, lng, disaster_type } = {}) {
  const params = new URLSearchParams({
    lat: String(lat),
    lng: String(lng),
  });
  if (disaster_type) {
    params.set("disaster_type", disaster_type);
  }
  return apiFetch(`/api/map?${params.toString()}`);
}

export async function fetchDemoAuthority({ limit } = {}) {
  const params = new URLSearchParams();
  if (limit !== undefined && limit !== null) {
    params.set("limit", String(limit));
  }
  const qs = params.toString();
  return apiFetch(`/api/demo-authority${qs ? `?${qs}` : ""}`);
}

const STREAM_POLL_INTERVAL_MS = 2500;

function createStreamSubscription({ streamPath, pollFn, onData, onError }) {
  let closed = false;
  let es = null;
  let intervalId = null;

  const poll = async () => {
    if (closed) return;
    try {
      const data = await pollFn();
      if (!closed) onData?.(data);
    } catch (err) {
      if (!closed) onError?.(err);
    }
  };

  const startPolling = () => {
    if (closed || intervalId !== null) return;
    poll();
    intervalId = setInterval(poll, STREAM_POLL_INTERVAL_MS);
  };

  if (typeof EventSource !== "undefined") {
    try {
      es = new EventSource(`${API_BASE}${streamPath}`, {
        withCredentials: true,
      });
      es.onmessage = (event) => {
        if (closed) return;
        try {
          const parsed = JSON.parse(event.data);
          onData?.(parsed);
        } catch (err) {
          onError?.(err);
        }
      };
      es.onerror = () => {
        if (es) {
          es.close();
          es = null;
        }
        startPolling();
      };
    } catch {
      startPolling();
    }
  } else {
    startPolling();
  }

  return function unsubscribe() {
    closed = true;
    if (es) {
      es.close();
      es = null;
    }
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };
}

export function subscribeMapStream({ lat, lng, onData, onError }) {
  const params = new URLSearchParams({
    lat: String(lat),
    lng: String(lng),
  });
  return createStreamSubscription({
    streamPath: `/api/map/stream?${params.toString()}`,
    pollFn: () => fetchMapData({ lat, lng }),
    onData,
    onError,
  });
}

export function subscribeDemoAuthorityStream({ limit, onData, onError } = {}) {
  const params = new URLSearchParams();
  if (limit !== undefined && limit !== null) {
    params.set("limit", String(limit));
  }
  const qs = params.toString();
  return createStreamSubscription({
    streamPath: `/api/demo-authority/stream${qs ? `?${qs}` : ""}`,
    pollFn: () => fetchDemoAuthority({ limit }),
    onData,
    onError,
  });
}

export async function toggleSafezone(nodeId, isActive) {
  const options = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  };
  if (typeof isActive === "boolean") {
    options.body = JSON.stringify({ is_active: isActive });
  }
  return apiFetch(`/api/safezones/${encodeURIComponent(nodeId)}/toggle`, options);
}
