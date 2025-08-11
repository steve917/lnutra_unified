import React, { useEffect, useMemo, useState } from "react";

type PredictionItem = {
  time?: string;
  badge?: "green" | "yellow" | "red" | string;
  delta_weight_kg?: number;
  delta_hba1c_pct?: number;
  // If your API returns something like { features: {...} }, keep it generic:
  features?: Record<string, unknown> | string | null;
};

const apiBase = import.meta.env.VITE_API_BASE_URL;

export default function PredictorPage() {
  const [data, setData] = useState<PredictionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [limit, setLimit] = useState(50);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const url = `${apiBase}/predictions?limit=${limit}`;
        const res = await fetch(url, { headers: { "Content-Type": "application/json" } });
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        const json = await res.json();

        // The API may return either an array or an object with a 'items'/'data' field.
        const rows: PredictionItem[] =
          Array.isArray(json) ? json :
          Array.isArray(json?.items) ? json.items :
          Array.isArray(json?.data) ? json.data : [];

        if (!cancelled) setData(rows);
      } catch (e: any) {
        if (!cancelled) setError(e.message || "Failed to load predictions");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [limit]);

  const prettyRows = useMemo(() => {
    return data.map((r) => {
      const features =
        typeof r.features === "string"
          ? r.features
          : r.features
          ? JSON.stringify(r.features)
          : "";
      return {
        time: r.time ?? "",
        badge: r.badge ?? "",
        delta_weight_kg: r.delta_weight_kg ?? null,
        delta_hba1c_pct: r.delta_hba1c_pct ?? null,
        features,
      };
    });
  }, [data]);

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: "0 auto", fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial" }}>
      <h1 style={{ marginBottom: 12 }}>Predictor</h1>

      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
        <label htmlFor="limit">Rows:</label>
        <select
          id="limit"
          value={limit}
          onChange={(e) => setLimit(Number(e.target.value))}
          style={{ padding: "6px 10px" }}
        >
          {[20, 50, 100, 200].map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
        <div style={{ marginLeft: "auto", opacity: 0.7, fontSize: 13 }}>
          API: {apiBase || "(missing VITE_API_BASE_URL)"}
        </div>
      </div>

      {loading && <div>Loading…</div>}
      {error && <div style={{ color: "crimson" }}>Error: {error}</div>}

      {!loading && !error && (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              border: "1px solid #e3e3e3",
            }}
          >
            <thead>
              <tr style={{ background: "#fafafa" }}>
                <th style={th}>Time</th>
                <th style={th}>Badge</th>
                <th style={th}>Δ Weight (kg)</th>
                <th style={th}>Δ HbA1c (%)</th>
                <th style={th}>Features</th>
              </tr>
            </thead>
            <tbody>
              {prettyRows.map((r, i) => (
                <tr key={i} style={{ borderTop: "1px solid #eee" }}>
                  <td style={td}>{r.time}</td>
                  <td style={{ ...td, fontWeight: 600, color: colorForBadge(r.badge as string) }}>
                    {r.badge}
                  </td>
                  <td style={td}>{fmtNum(r.delta_weight_kg)}</td>
                  <td style={td}>{fmtNum(r.delta_hba1c_pct)}</td>
                  <td style={{ ...td, whiteSpace: "nowrap", maxWidth: 0 }}>
                    <code style={{ fontSize: 12 }}>{r.features}</code>
                  </td>
                </tr>
              ))}
              {prettyRows.length === 0 && (
                <tr><td colSpan={5} style={{ ...td, textAlign: "center", opacity: 0.7 }}>No data</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const th: React.CSSProperties = { textAlign: "left", padding: "10px 12px", borderBottom: "1px solid #e3e3e3", fontWeight: 600, fontSize: 14 };
const td: React.CSSProperties = { padding: "8px 12px", fontSize: 14 };

function colorForBadge(b?: string) {
  const s = (b || "").toLowerCase();
  if (s === "green") return "#0a7c2e";
  if (s === "yellow") return "#a37a00";
  if (s === "red") return "#b00020";
  return "#333";
}

function fmtNum(n: number | null) {
  if (n === null || Number.isNaN(n)) return "";
  return Number(n).toFixed(1);
}
