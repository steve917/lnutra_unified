// apps/web/src/lib/api.ts
import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL as string | undefined;
const basicRaw = import.meta.env.VITE_API_BASIC as string | undefined;

if (!baseURL) {
  // eslint-disable-next-line no-console
  console.error("VITE_API_BASE_URL is not set. Check apps/web/.env");
}

let authHeader: string | undefined;
if (basicRaw && basicRaw.includes(":")) {
  const encoded =
    typeof window !== "undefined"
      ? window.btoa(basicRaw)
      : Buffer.from(basicRaw).toString("base64");
  authHeader = `Basic ${encoded}`;
}

export const api = axios.create({
  baseURL,
  headers: {
    Accept: "application/json",
    ...(authHeader ? { Authorization: authHeader } : {}),
  },
});
