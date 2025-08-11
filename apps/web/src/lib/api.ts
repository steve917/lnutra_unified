import axios from "axios";

export const apiBase =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/+$/,'') ?? "";

export const hasBasicAuth = !!import.meta.env.VITE_API_BASIC;

const headers = hasBasicAuth && import.meta.env.VITE_API_BASIC
  ? { Authorization: `Basic ${btoa(import.meta.env.VITE_API_BASIC)}` }
  : undefined;

const api = axios.create({
  baseURL: apiBase,
  headers,
});

export default api;

export async function getFeatureColumns(): Promise<string[]> {
  const { data } = await api.get("/v1/features");
  return data;
}

export type PredictIn = {
  adherence_pct: number;
  age_years: number;
  bmi: number;
  fmd_regimen_type: string;
  hba1c: number;
  meds_diabetes: number;
  n_cycles: number;
  sex: string;
  weight_kg: number;
};

export type PredictOut = {
  badge: string;               // "green", "yellow", "red"
  delta_weight_kg: number;     // e.g., -0.2
  delta_hba1c_pct: number;     // e.g., -0.1
  features: PredictIn;
};

export async function postPredict(body: PredictIn): Promise<PredictOut> {
  const { data } = await api.post("/v1/predict", body);
  return data;
}
