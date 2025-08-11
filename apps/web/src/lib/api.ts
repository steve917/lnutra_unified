// apps/web/src/lib/api.ts
import axios from "axios";

// Prefer VITE_API_BASE_URL, fall back to VITE_API_BASE if needed
const apiBase =
  (import.meta.env.VITE_API_BASE_URL as string) ??
  (import.meta.env.VITE_API_BASE as string) ??
  "";

const hasBasicAuth = !!import.meta.env.VITE_API_BASIC;

const api = axios.create({
  baseURL: apiBase,
  headers: hasBasicAuth
    ? { Authorization: `Basic ${btoa(import.meta.env.VITE_API_BASIC as string)}` }
    : {},
});

export default api;
export { apiBase, hasBasicAuth };

/** Features */
export async function getFeatureColumns(): Promise<string[]> {
  const { data } = await api.get("/v1/features");
  return data;
}

/** Predictions */
export type PredictOut = {
  id: number;
  created_at: string; // ISO UTC
  safety_badge: "green" | "yellow" | "red";
  delta_weight_kg: number;
  delta_hba1c_pct: number;
  features: Record<string, unknown>;
};

export async function getPredictions(limit = 50): Promise<PredictOut[]> {
  const { data } = await api.get(`/v1/predict`, { params: { limit } });
  return data;
}
