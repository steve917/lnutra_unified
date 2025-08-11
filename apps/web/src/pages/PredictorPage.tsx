// apps/web/src/pages/PredictorPage.tsx
import React, { useEffect, useMemo, useState } from "react";
// If your api.ts lives elsewhere, adjust this path:
import api from "../lib/api";

type Features = Record<string, any>;

interface Prediction {
  id: number;
  created_at: string; // ISO time
  safety_badge: "green" | "yellow" | "red" | string;
  delta_weight_kg: number | null;
  delta_hba1c_pct: number | null;
  features: Features | string;
}

const LIMIT_OPTIONS = [10, 20, 50, 100, 200, 500];

function badgeLabel(color: string) {
  const c = (color || "").toLowerCase();
  return c.charAt(0).toUpperCase() + c.slice(1);
}

function formatNumber(n: number | null, digits = 1) {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return n.toFixed(digits);
}

function summarizeFeatures(f: Features | string): string {
  try {
    const obj: Features =
      typeof f === "string" ? (JSON.parse(f) as Features) : (f as Features);
    const picks: string[] = [];

    const emit = (k: string, label?: string) => {
      if (obj[k] !== undefined) {
        picks.push(`${label ?? k}: ${obj[k]}`);
      }
    };

    emit("age_years", "age_years");
    emit("sex", "sex");
    emit("weight_kg", "weight_kg");
    emit("bmi", "bmi");
    emit("hba1c", "hba1c");
    emit("meds_diabetes", "meds_diabetes");
    emit("fmd_regimen_type", "fmd_regimen_type");
    emit("n_cycles", "n_cycles");
    emit("adherence_pct", "adherence_pct");

    // Truncate for table readability
    const txt = picks.join(", ");
    return txt.length > 120 ? txt.slice(0, 117) + " ..." : txt;
  } catch {
    // fall back to raw string if JSON parse fails
    return typeof f === "string" ? f : JSON.stringify(f);
  }
}

function toCsv(rows: Prediction[]) {
  if (!rows.length) return "";
  const cols = [
    "created_at",
    "safety_badge",
    "delta_weight_kg",
    "delta_hba1c_pct",
    "features",
  ] as const;

  const header = cols.join(",");
  const escape = (v: any) => {
    const s = (v ?? "").toString();
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
  const body = rows
    .map((r) =>
      cols
        .map((c) =>
          c === "features" ? escape(summarizeFeatures(r.features)) : escape((r as any)[c])
        )
        .join(",")
    )
    .join("\n");

  return `${header}\n${body}`;
}

export default function PredictorPage() {
  const [items, setItems] = useState<Prediction[]>([]);
  const [limit, setLimit] = useState<number>(50);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [lastUpdated, setLastUpdated] = useState<string>("");

  const apiBase = import.meta.env.VITE_API_BASE_URL as string | undefined;

  const fetchData = async (n: number) => {
    setLoading(true);
    setError("");
    try {
      // API path matches your FastAPI: /v1/predictions
      const res = await api.get(`/v1/predictions?limit=${n}`);
      setItems(res.data as Prediction[]);
      setLastUpdated(new Date().toUTCString());
    } catch (e: any) {
      // Helpful messages for common auth/misc issues
      if (e?.response?.status === 401 || e?.response?.status === 403) {
        setError("Not authenticated — check Basic Auth on the backend service.");
      } else if (e?.message) {
        setError(`Request failed: ${e.message}`);
      } else {
        setError("Request failed");
      }
    } finally {
      setLoading(false);
    }
  };

  // Initial + on limit change
  useEffect(() => {
    fetchData(limit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit]);

  // Auto-refresh every 30s (cleans up on unmount)
  useEffect(() => {
    const id = setInterval(() => fetchData(limit), 30000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit]);

  const handleDownloadCsv = () => {
    const csv = toCsv(items);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `predictions_${limit}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const apiNote = useMemo(
    () => (apiBase ? `API: ${apiBase}` : "API base URL not set"),
    [apiBase]
  );

  return (
    <div style={{ padding: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <h1 style={{ margin: 0 }}>Predictor</h1>

        <div style={{ fontSize: 12, color: "#666" }}>{apiNote}</div>
      </div>

      <div style={{ display: "flex", alignItems: "center", marginTop: 12, gap: 12 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span>Rows:</span>
          <select
            value={limit}
            onChange={(e) => setLimit(parseInt(e.target.value, 10))}
            style={{ padding: "4px 8px" }}
          >
            {LIMIT_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>

        <button onClick={() => fetchData(limit)} disabled={loading}>
          {loading ? "Refreshing…" : "Refresh"}
        </button>

        <button onClick={handleDownloadCsv} disabled={!items.length}>
          Download CSV
        </button>

        {lastUpdated && (
          <span style={{ marginLeft: 8, fontSize: 12, color: "#666" }}>
            Updated: {lastUpdated}
          </span>
        )}
      </div>

      {error && (
        <div style={{ color: "#b00020", marginTop: 10 }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      <div style={{ marginTop: 16, overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            minWidth: 760,
            border: "1px solid #e5e7eb",
          }}
        >
          <thead>
            <tr style={{ background: "#f9fafb" }}>
              <th style={thStyle}>Time (UTC)</th>
              <th style={thStyle}>Badge</th>
              <th style={thStyle}>Δ Weight (kg)</th>
              <th style={thStyle}>Δ HbA1c (%)</th>
              <th style={thStyle}>Features (summary)</th>
            </tr>
          </thead>
          <tbody>
            {!loading && items.length === 0 && !error && (
              <tr>
                <td colSpan={5} style={{ padding: 16, textAlign: "center", color: "#666" }}>
                  No data.
                </td>
              </tr>
            )}

            {items.map((p) => (
              <tr key={p.id}>
                <td style={tdStyle}>{p.created_at?.replace("T", " ").replace("Z", "")}</td>
                <td style={tdStyle}>{badgeLabel(p.safety_badge)}</td>
                <td style={tdStyle}>{formatNumber(p.delta_weight_kg)}</td>
                <td style={tdStyle}>{formatNumber(p.delta_hba1c_pct)}</td>
                <td style={tdStyle}>{summarizeFeatures(p.features)}</td>
              </tr>
            ))}

            {loading && (
              <tr>
                <td colSpan={5} style={{ padding: 16, textAlign: "center", color: "#666" }}>
                  Loading…
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "10px 12px",
  borderBottom: "1px solid #e5e7eb",
  fontWeight: 600,
  fontSize: 14,
  whiteSpace: "nowrap",
};

const tdStyle: React.CSSProperties = {
  padding: "10px 12px",
  borderBottom: "1px solid #f1f5f9",
  verticalAlign: "top",
  fontSize: 14,
};
