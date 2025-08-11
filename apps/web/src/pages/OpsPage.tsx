import React, { useEffect, useMemo, useState } from "react";
import api from "../lib/api";

type Features = Record<string, any>;

type PredictionRow = {
  id: number;
  created_at: string; // ISO in UTC
  safety_badge: "green" | "yellow" | "red";
  delta_weight_kg: number;
  delta_hba1c_pct: number;
  features: Features;
};

const prettyFeatures = (f: Features) => {
  // Show a compact summary like: "age_years: 40, sex: M, weight_kg: 70, ..."
  const keys = [
    "age_years",
    "sex",
    "weight_kg",
    "bmi",
    "hba1c",
    "fmd_regimen_type",
    "n_cycles",
    "adherence_pct",
    "meds_diabetes",
  ];
  const parts: string[] = [];
  for (const k of keys) {
    if (k in f) parts.push(`${k}: ${f[k]}`);
  }
  return parts.join(", ");
};

export default function OpsPage() {
  const [rows, setRows] = useState<PredictionRow[]>([]);
  const [limit, setLimit] = useState<number>(50);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const backend = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, "") || "";

  const load = async (n = limit) => {
    setLoading(true);
    setErr(null);
    try {
      const { data } = await api.get<PredictionRow[]>(`/v1/predictions`, {
        params: { limit: n },
      });
      setRows(data);
    } catch (e: any) {
      setErr(e?.message || "Failed to load predictions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(limit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit]);

  const total = rows.length;
  const tableBody = useMemo(
    () =>
      rows.map((r) => (
        <tr key={r.id}>
          <td>{new Date(r.created_at).toISOString().replace("T", " ").replace("Z", "")}</td>
          <td style={{ textTransform: "capitalize" }}>{r.safety_badge}</td>
          <td>{r.delta_weight_kg}</td>
          <td>{r.delta_hba1c_pct}</td>
          <td>{prettyFeatures(r.features)}</td>
        </tr>
      )),
    [rows]
  );

  return (
    <div style={{ maxWidth: 1200, margin: "24px auto", padding: "0 16px" }}>
      <h1 style={{ marginBottom: 8 }}>Ops Dashboard</h1>
      <div style={{ color: "#666", fontSize: 12, marginBottom: 16 }}>
        Backend: {backend}
      </div>

      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
        <label>
          Rows:&nbsp;
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
          >
            {[10, 25, 50, 100, 200].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <button onClick={() => load()} disabled={loading}>
          {loading ? "Loading…" : "Reload"}
        </button>
        {err && <span style={{ color: "#b00020" }}>Error: {err}</span>}
        <span style={{ marginLeft: "auto", color: "#666" }}>
          Showing {total} row{total === 1 ? "" : "s"}
        </span>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: 14,
            lineHeight: 1.4,
          }}
        >
          <thead>
            <tr style={{ background: "#f4f6f8" }}>
              <th style={{ textAlign: "left", padding: "8px 6px", borderBottom: "1px solid #ddd" }}>
                Time (UTC)
              </th>
              <th style={{ textAlign: "left", padding: "8px 6px", borderBottom: "1px solid #ddd" }}>
                Badge
              </th>
              <th style={{ textAlign: "left", padding: "8px 6px", borderBottom: "1px solid #ddd" }}>
                Δ Weight (kg)
              </th>
              <th style={{ textAlign: "left", padding: "8px 6px", borderBottom: "1px solid #ddd" }}>
                Δ HbA1c (%)
              </th>
              <th style={{ textAlign: "left", padding: "8px 6px", borderBottom: "1px solid #ddd" }}>
                Features (summary)
              </th>
            </tr>
          </thead>
          <tbody>{tableBody}</tbody>
        </table>
      </div>
    </div>
  );
}
