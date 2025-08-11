import React, { useEffect, useMemo, useState } from "react";
import api, { fetchFeatureColumns, fetchPredictions } from "../lib/api";


// Types for safety
type FeatureValues = Record<string, string>;
type FeaturesObject = Record<string, any>;

type PredictionRow = {
  id?: number;
  created_at?: string;
  safety_badge?: string;
  features: FeaturesObject;
};

const API_URL = import.meta.env.VITE_API_BASE_URL || "(not set)";

function isAxios404(err: unknown): boolean {
  // Don't import axios here—keep it simple.
  return Boolean((err as any)?.response?.status === 404);
}

async function loadFeatureColumns(): Promise<string[]> {
  // 1) Try a dedicated /features if it exists
  try {
    const r = await api.get("/features");
    // Accept either: {columns: [...] } or plain [ ... ]
    const data = r.data;
    if (Array.isArray(data)) return data.map(String);
    if (Array.isArray(data?.columns)) return data.columns.map(String);
    // If the shape is unexpected, fall through to the fallback
  } catch (err) {
    if (!isAxios404(err)) {
      // If it's not a 404, rethrow so the UI can show the real error
      throw err;
    }
  }

  // 2) Fallback: read keys from the latest prediction's "features" object
  const r2 = await api.get("/predictions", { params: { limit: 1 } });
  const data2 = r2.data;

  // Common shapes:
  // - [ { features: {...} } ]
  // - { items: [ { features: {...} } ] }
  let first: PredictionRow | undefined;
  if (Array.isArray(data2)) first = data2[0];
  else if (Array.isArray(data2?.items)) first = data2.items[0];

  if (!first?.features || typeof first.features !== "object") {
    throw new Error("Could not infer feature columns from /predictions.");
  }
  return Object.keys(first.features);
}

function coerceValue(raw: string): any {
  // Try to send numbers as numbers; otherwise send string
  if (raw.trim() === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) && raw.match(/^-?\d+(\.\d+)?$/) ? n : raw;
}

export default function PredictorPage() {
  const [columns, setColumns] = useState<string[]>([]);
  const [values, setValues] = useState<FeatureValues>({});
  const [rows, setRows] = useState(50);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setErrMsg(null);
      setLoading(true);
      try {
        const cols = await loadFeatureColumns();
        if (!mounted) return;
        // Keep a stable, readable order
        const sorted = [...cols].sort((a, b) => a.localeCompare(b));
        setColumns(sorted);
        // Initialize form state
        const init: FeatureValues = {};
        sorted.forEach((c) => (init[c] = ""));
        setValues(init);
      } catch (err: any) {
        if (!mounted) return;
        setErrMsg(
          `Failed to load feature columns. Check API URL and Basic Auth. ${
            err?.message ? " — " + err.message : ""
          }`
        );
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const canSubmit = useMemo(() => {
    if (!columns.length) return false;
    // Require all inputs to be filled for now
    return columns.every((c) => values[c] !== "");
  }, [columns, values]);

  const onChange = (name: string, val: string) => {
    setValues((prev) => ({ ...prev, [name]: val }));
  };

  async function submitPredict() {
    setErrMsg(null);
    setResult(null);
    try {
      const payload = {
        features: Object.fromEntries(
          Object.entries(values).map(([k, v]) => [k, coerceValue(v)])
        ),
      };

      // Try /predict first
      try {
        const r = await api.post("/predict", payload);
        setResult(r.data);
        return;
      } catch (e: any) {
        if (!isAxios404(e)) throw e;
      }

      // Fallback to /v1/predict if /predict is 404 on your backend
      const r2 = await api.post("/v1/predict", payload);
      setResult(r2.data);
    } catch (err: any) {
      setErrMsg(
        `Prediction failed${
          err?.response?.status ? " (" + err.response.status + ")" : ""
        }${
          err?.response?.data ? ": " + JSON.stringify(err.response.data) : ""
        }`
      );
    }
  }

  return (
    <div style={{ maxWidth: 960, margin: "24px auto", padding: "0 16px" }}>
      <h1 style={{ marginBottom: 4 }}>Prediction</h1>
      <div style={{ color: "#666", fontSize: 12, marginBottom: 16 }}>
        Backend: {API_URL}
      </div>

      {errMsg && (
        <div
          style={{
            background: "#fde2e2",
            color: "#7a1f1f",
            border: "1px solid #f5c2c2",
            padding: "10px 12px",
            borderRadius: 6,
            marginBottom: 12,
          }}
        >
          {errMsg}
        </div>
      )}

      {loading && <div>Loading available features…</div>}

      {!loading && columns.length > 0 && (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: 12,
              marginBottom: 16,
            }}
          >
            {columns.map((c) => (
              <label
                key={c}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  fontSize: 13,
                }}
              >
                <span style={{ fontWeight: 600 }}>{c}</span>
                <input
                  value={values[c] ?? ""}
                  onChange={(e) => onChange(c, e.target.value)}
                  placeholder={`Enter ${c}`}
                  style={{
                    padding: "8px 10px",
                    borderRadius: 8,
                    border: "1px solid #ddd",
                  }}
                />
              </label>
            ))}
          </div>

          <button
            onClick={submitPredict}
            disabled={!canSubmit}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid #ddd",
              cursor: canSubmit ? "pointer" : "not-allowed",
              background: canSubmit ? "#f4f4f4" : "#fafafa",
            }}
          >
            Predict
          </button>
        </>
      )}

      {result && (
        <div
          style={{
            marginTop: 18,
            padding: 12,
            border: "1px solid #eee",
            borderRadius: 8,
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Result</div>
          <pre
            style={{
              margin: 0,
              fontSize: 13,
              background: "#fbfbfb",
              padding: 12,
              borderRadius: 8,
              overflow: "auto",
            }}
          >
{JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
