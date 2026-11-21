/**
 * DevQuest Atelier — Runtime Configuration
 * Automatically uses same-origin when served by FastAPI, or http://127.0.0.1:8000
 * when opened from a separate static frontend server (e.g., port 5501).
 */
export const API_BASE_URL =
  window.location.port === "8000" || window.location.protocol === "https:"
    ? window.location.origin
    : "http://127.0.0.1:8000";
