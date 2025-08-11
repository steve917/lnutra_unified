// apps/web/src/lib/api.ts
import axios from "axios";

// Prefer VITE_API_BASE_URL, fall back to VITE_API_BASE if needed
const apiBase =
  (import.meta.env.VITE_API_BASE_URL as string) ??
  (import.meta.env.VITE_API_BASE as string) ??
  "";

// Do we have Basic Auth configured?
const hasBasicAuth = !!import.meta.env.VITE_API_BASIC;

// Axios instance pre-configured with base URL and (optional) Basic auth
const api = axios.create({
  baseURL: apiBase,
  headers: hasBasicAuth
    ? {
        Authorization: `Basic ${btoa(
          import.meta.env.VITE_API_BASIC as string
        )}`,
      }
    : {},
});

// ---- exports ----
export default api;
export { apiBase, hasBasicAuth };

// Small helper used by OpsPage
export async function getFeatureColumns(): Promise<string[]> {
  // Your backend exposes GET /v1/features
  const { data } = await api.get("/v1/features");
  return data;
}
