export const COMPANY_NAME = import.meta.env.VITE_COMPANY_NAME || "L-Nutra AI";
export const BRAND_TAGLINE = import.meta.env.VITE_BRAND_TAGLINE || "Backed by Science. Powered by AI.";
export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

export const BILLING_ENABLED = (import.meta.env.VITE_BILLING_ENABLED || "false") === "true";
export const INTERNAL_BUILD = (import.meta.env.VITE_INTERNAL_BUILD || "false") === "true";
