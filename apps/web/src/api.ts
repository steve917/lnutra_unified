// apps/web/src/lib/api.ts
import axios, { AxiosInstance } from "axios";

// Vite env vars (set these in apps/web/.env)
const baseURL = import.meta.env.VITE_API_BASE_URL as string | undefined;
const basicAuth = import.meta.env.VITE_API_BASIC as string | undefined;

if (!baseURL) {
  console.warn("⚠️ VITE_API_BASE_URL is not set in .env — API calls will fail.");
}

const headers: Record<string, string> = {};
if (basicAuth) {
  // username:password -> base64
  const encoded = btoa(basicAuth);
  headers["Authorization"] = `Basic ${encoded}`;
} else {
  console.warn("⚠️ VITE_API_BASIC is not set in .env — API may return 401 Unauthorized.");
}

const api: AxiosInstance = axios.create({
  baseURL,
  headers,
  timeout: 15000,
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error("API error:", err?.response || err);
    return Promise.reject(err);
  }
);

// Export BOTH default and named so any import style works
export default api;
export { api };
