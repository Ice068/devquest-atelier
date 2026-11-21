import { API_BASE_URL } from "./config.js";

const TOKEN_KEY = "dq_atelier_jwt";

export function getToken() {
  return sessionStorage.getItem(TOKEN_KEY) || "";
}

export function setToken(token) {
  if (token) {
    sessionStorage.setItem(TOKEN_KEY, token);
  } else {
    sessionStorage.removeItem(TOKEN_KEY);
  }
}

async function apiFetch(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const resp = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });
  let data = null;
  try {
    data = await resp.json();
  } catch {
    data = null;
  }
  if (!resp.ok) {
    const detail =
      (data && (typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail))) ||
      `Request failed (${resp.status})`;
    const err = new Error(detail);
    err.status = resp.status;
    throw err;
  }
  return data;
}

export const api = {
  health: () => apiFetch("/api/health"),
  signup: (username, password) =>
    apiFetch("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),
  login: (username, password) =>
    apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),
  logout: () => apiFetch("/auth/logout", { method: "POST" }),
  me: () => apiFetch("/users/me"),
  completeQuest: (questId, expReward, soloLevel) =>
    apiFetch(`/users/me/quests/${encodeURIComponent(questId)}/complete`, {
      method: "POST",
      body: JSON.stringify({ exp_reward: expReward, solo_level: soloLevel }),
    }),
  leaderboard: () => apiFetch("/leaderboard"),
  soloAnalyze: (payload) =>
    apiFetch("/ai/solo-analyze", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};
