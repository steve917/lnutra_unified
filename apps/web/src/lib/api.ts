import axios from "axios";

/**
 * Builds a base URL like:
 *   https://ln-api-rgxr.onrender.com/v1
 */
const RAW_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");
const BASE_URL = `${RAW_BASE}/v1`;

// Optional Basic auth: VITE_API_BASIC="username:password"
const BASIC = import.meta.env.VITE_API_BASIC as string | undefined;
const headers: Record<string, string> = {};
if (BASIC) {
  // btoa is available in the browser build
  headers["Authorization"] = `Basic ${btoa(BASIC)}`;
}

const api = axios.create({
  baseURL: BASE_URL,
  headers,
  timeout: 15000,
});

// Convenience functions (used by Predictor page)
export async function fetchFeatureColumns(): Promise<string[]> {
  const res = await api.get("/features");
  // Backend returns either { columns: [...] } or just [...]
  if (Array.isArray(res.data)) return res.data as string[];
  if (Array.isArray(res.data?.columns)) return res.data.columns as string[];
  return []; // fallback
}

export async function fetchPredictions(limit: number) {
  const res = await api.get("/predictions", { params: { limit } });
  return res.data;
}

export default api;
