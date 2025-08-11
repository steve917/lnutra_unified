// apps/web/src/lib/api.ts
import axios from "axios";

// Read the API base URL from your .env (e.g., https://ln-api-rgxr.onrender.com)
const baseURL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");

// Optional: Basic auth "username:password" from .env (VITE_API_BASIC)
const basic = import.meta.env.VITE_API_BASIC;

// Build default headers
const headers: Record<string, string> = {};
if (basic) {
  // Browser-safe base64
  headers["Authorization"] = `Basic ${btoa(basic)}`;
}

const api = axios.create({
  baseURL,
  headers,
  timeout: 20000,
});

export default api;
export { api };
