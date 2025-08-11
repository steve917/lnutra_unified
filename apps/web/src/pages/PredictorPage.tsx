// apps/web/src/pages/PredictorPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";

type Prediction = {
  id: number;
  created_at: string; // ISO
  safety_badge: "green" | "yellow" | "red";
  delta_weight_kg: number | null;
  delta_hba1c_pct: number | null;
  features: Record<string, unknown>;
};

function summarizeFeatures(f: Record<string, unknown>): string {
  try {
    const keys = Object.keys(f);
    const show = keys.slice(0, 6).map((k) => `${k}: ${String((f as any)[k])}`);
    return show.join(", ") + (keys.length > 6 ? " …" : "");
  } catch {
    return "";
  }
}

export default function PredictorPage() {
  const [limit, setLimit] = useState<number>(50);
  const [rows, setRows] = useState<Prediction[]>([]);
  const [error, setError] = useState<string | null>(null);
  const apiURL = import.meta.env.VITE_API_BASE_URL;

  const limits = useMemo(() => [10, 25, 50, 100, 200], []);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setError(null);
      try {
        const resp = await api.get<{ items: Prediction[] }>(
          "/v1/predictions",
          { params: { limit } }
        );
        if (!cancelled) {
          const data = Array.isArray(resp.data)
            ? (resp.data as Prediction[])
            : (resp.data.items ?? []);
          setRows(data);
        }
      } catch (e: any) {
        const detail =
          e?.response?.data?.detail ??
          e?.message ??
          "Unknown error. Check credentials/environment.";
        if (!cancelled) setError(String(detail));
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [limit]);

  return (
    <div style={{ padding: "24px", fontFamily: "system-ui, Segoe UI, Arial" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <h1 style={{ margin: 0 }}>Predictor</h1>
        <small style={{ color: "#666" }}>API: {apiURL}</small>
      </header>

      <div style={{ margin: "12px 0", display: "flex", gap: 16, alignItems: "center" }}>
        <label>
          Rows:&nbsp;
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            style={{ padding: "4px 8px" }}
          >
            {limits.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && (
        <div style={{ color: "#b00020", marginBottom: 12 }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            minWidth: 900,
            border: "1px solid #e5e7eb",
          }}
        >
          <thead style={{ background: "#f9fafb" }}>
            <tr>
              <th style={th}>Time (UTC)</th>
              <th style={th}>Badge</th>
              <th style={th}>Δ Weight (kg)</th>
              <th style={th}>Δ HbA1c (%)</th>
              <th style={th}>Features (summary)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td style={td}>{new Date(r.created_at).toISOString().replace("T", " ").replace("Z","")}</td>
                <td style={{ ...td, textTransform: "capitalize" }}>{r.safety_badge}</td>
                <td style={td}>{r.delta_weight_kg ?? ""}</td>
                <td style={td}>{r.delta_hba1c_pct ?? ""}</td>
                <td style={td}>{summarizeFeatures(r.features || {})}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td style={{ ...td, color: "#6b7280" }} colSpan={5}>
                  {error ? "No data due to error." : "No data."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const th: React.CSSProperties = {
  textAlign: "left",
  padding: "10px 12px",
  borderBottom: "1px solid #e5e7eb",
  fontWeight: 600,
  fontSize: 14,
};

const td: React.CSSProperties = {
  padding: "10px 12px",
  borderBottom: "1px solid #f3f4f6",
  fontSize: 14,
};
