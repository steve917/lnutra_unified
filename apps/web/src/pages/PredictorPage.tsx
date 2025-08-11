// apps/web/src/pages/PredictorPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api"; // <-- named import

type Features = Record<string, any>;

type ColumnsResponse = {
  columns: string[];
};

type PredictResponse = {
  y_pred: number[];
  proba?: number[];
};

export default function PredictorPage() {
  const [columns, setColumns] = useState<string[]>([]);
  const [values, setValues] = useState<Features>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchColumns() {
      setError(null);
      try {
        const { data } = await api.get<ColumnsResponse>("/features");
        setColumns(data.columns || []);
        const init: Features = {};
        (data.columns || []).forEach((c) => (init[c] = ""));
        setValues(init);
      } catch (e: any) {
        setError(
          e?.response?.data?.message ||
            "Failed to load feature columns. Check API URL and Basic Auth."
        );
      }
    }
    fetchColumns();
  }, []);

  const canSubmit = useMemo(() => {
    if (!columns.length) return false;
    return columns.every((c) => values[c] !== "" && values[c] !== undefined);
  }, [columns, values]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const { data } = await api.post<PredictResponse>("/predict", {
        features: values,
      });
      setResult(data);
    } catch (e: any) {
      setError(
        e?.response?.data?.message ||
          "Prediction failed. Check API base URL and Basic Auth."
      );
    } finally {
      setLoading(false);
    }
  }

  function onChange(name: string, value: any) {
    setValues((prev) => ({ ...prev, [name]: value }));
  }

  return (
    <div style={{ maxWidth: 900, margin: "40px auto", padding: 16 }}>
      <h1 style={{ marginBottom: 16 }}>Prediction</h1>

      <div style={{ marginBottom: 16, fontSize: 14, opacity: 0.8 }}>
        Backend: <code>{import.meta.env.VITE_API_BASE_URL || "(not set)"}</code>
      </div>

      {error && (
        <div
          style={{
            background: "#ffecec",
            border: "1px solid #f5c2c2",
            padding: "12px 16px",
            borderRadius: 8,
            marginBottom: 16,
          }}
        >
          {error}
        </div>
      )}

      {!columns.length ? (
        <div>Loading available features…</div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: 12,
            }}
          >
            {columns.map((c) => (
              <div key={c} style={{ display: "flex", flexDirection: "column" }}>
                <label style={{ fontSize: 12, marginBottom: 4 }}>{c}</label>
                <input
                  type="text"
                  value={values[c] ?? ""}
                  onChange={(e) => onChange(c, e.target.value)}
                  placeholder={`Enter ${c}`}
                  style={{
                    padding: "8px 10px",
                    borderRadius: 6,
                    border: "1px solid #ddd",
                  }}
                />
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={!canSubmit || loading}
            style={{
              marginTop: 16,
              padding: "10px 16px",
              borderRadius: 8,
              border: "none",
              background: canSubmit && !loading ? "#2563eb" : "#9ca3af",
              color: "white",
              cursor: canSubmit && !loading ? "pointer" : "not-allowed",
            }}
          >
            {loading ? "Predicting…" : "Predict"}
          </button>
        </form>
      )}

      {result && (
        <div
          style={{
            marginTop: 24,
            padding: 16,
            border: "1px solid #e5e7eb",
            borderRadius: 8,
          }}
        >
          <h3 style={{ marginTop: 0 }}>Result</h3>
          <pre
            style={{
              whiteSpace: "pre-wrap",
              background: "#f8fafc",
              padding: 12,
              borderRadius: 6,
            }}
          >
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
