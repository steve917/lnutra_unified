import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    Authorization: `Basic ${btoa(import.meta.env.VITE_API_BASIC)}`,
  },
});

export default api;

// Expose for UI diagnostics
export const apiBase = import.meta.env.VITE_API_BASE_URL;
export const hasBasicAuth = Boolean(import.meta.env.VITE_API_BASIC);

// ---------- Features ----------
export async function getFeatureColumns(): Promise<string[]> {
  const { data } = await api.get("/v1/features");
  return data as string[];
}

// ---------- Predictions (optional) ----------
/**
 * Try to find a list endpoint for predictions (if backend provides one).
 * We DO NOT try /v1/predict because that is POST-only.
 */
const PREDICTION_LIST_CANDIDATES = [
  "/v1/predictions",
  "/v1/predictions/",
  "/predictions",
  "/predictions/",
];

export async function resolvePredictionsPath(): Promise<string | null> {
  for (const path of PREDICTION_LIST_CANDIDATES) {
    try {
      // HEAD often returns 405 on some frameworks, so use GET with a small limit
      const url = path.includes("?") ? path : `${path}?limit=1`;
      await api.get(url);
      return path.replace(/\/$/, ""); // normalize trailing slash
    } catch {
      // ignore and try next candidate
    }
  }
  return null;
}

export type PredictionRow = {
  created_at: string;
  badge: string;
  delta_weight_kg: number;
  delta_hba1c_pct: number;
  features: Record<string, unknown>;
};

/**
 * Fetch a list of predictions from the resolved path. If no list endpoint
 * exists on the backend, this will throw so the UI can show a banner.
 */
export async function getPredictions(limit: number): Promise<PredictionRow[]> {
  const path = await resolvePredictionsPath();
  if (!path) {
    throw new Error(
      "No predictions endpoint found (tried /v1/predictions and /predictions)."
    );
  }
  const { data } = await api.get(`${path}?limit=${limit}`);
  return data as PredictionRow[];
}
