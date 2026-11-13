const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const errData = await response.json();
      if (errData?.detail) {
        message = typeof errData.detail === "string"
          ? errData.detail
          : JSON.stringify(errData.detail);
      }
    } catch {
      // ignore non-JSON error body
    }
    throw new Error(message);
  }

  return response.json();
}

export function fetchState() {
  return request("/state");
}

export function submitReport(nodeId, category) {
  return request("/report", {
    method: "POST",
    body: JSON.stringify({ node_id: nodeId, category }),
  });
}

export function simulateSurge() {
  return request("/simulate-surge", {
    method: "POST",
  });
}

export function resetDemo() {
  return request("/reset-demo", {
    method: "POST",
  });
}

export function approveAlert(approved, hubCount = 3) {
  return request("/approve-alert", {
    method: "POST",
    body: JSON.stringify({
      approved,
      hub_count: hubCount,
    }),
  });
}
