import axios from "axios";

/** ---- Basic axios client with env-driven base URL + Basic auth ---- */
const rawBase = (import.meta.env.VITE_API_BASE_URL as string | undefined) || "";
export const apiBase = rawBase.replace(/\/+$/, ""); // trim trailing slash
const basicPair = import.meta.env.VITE_API_BASIC as string | undefined;
export const hasBasicAuth = Boolean(basicPair);

const api = axios.create({
  baseURL: apiBase,
  timeout: 8000,
  headers: basicPair
    ? { Authorization: `Basic ${btoa(basicPair)}` }
    : undefined,
});

export default api;

/** ---- Feature columns ---- */
export async function getFeatureColumns(): Promise<string[]> {
  const { data } = await api.get("/v1/features");
  return data as string[];
}

/** ---- Prediction I/O types ---- */
export type PredictIn = {
  adherence_pct: number;
  age_years: number;
  bmi: number;
  fmd_regimen_type: "standard_fmd" | "prolon" | "alternate_day" | string;
  hba1c: number;          // NOTE: digit “1”, not the letter “l”
  meds_diabetes: 0 | 1;
  n_cycles: number;
  sex: "M" | "F";
  weight_kg: number;
};

export type PredictOut = {
  badge: "green" | "yellow" | "red" | string;
  delta_weight_kg: number;     // negative is weight loss
  delta_hba1c_pct: number;     // negative means improved A1c
  features: PredictIn;
};

/** ---- Predict ---- */
export async function postPredict(body: PredictIn): Promise<PredictOut> {
  const { data } = await api.post("/v1/predict", body);
  return data as PredictOut;
}

/** ---- Optional predictions list (some backends don’t ship it) ----
 * We try /v1/predictions first, then fall back to /predictions.
 * If both 404, we surface a nice message to the UI.
 */
export async function listPredictions(limit = 50): Promise<{
  pathUsed: "/v1/predictions" | "/predictions" | "not-found";
  rows: any[];
}> {
  const tryPath = async (p: "/v1/predictions" | "/predictions") => {
    const { data } = await api.get(`${p}?limit=${limit}`);
    return { pathUsed: p, rows: data as any[] } as const;
  };
  try {
    return await tryPath("/v1/predictions");
  } catch (e: any) {
    if (e?.response?.status === 404) {
      try {
        return await tryPath("/predictions");
      } catch (e2: any) {
        if (e2?.response?.status === 404) {
          return { pathUsed: "not-found", rows: [] };
        }
        throw e2;
      }
    }
    throw e;
  }
}
