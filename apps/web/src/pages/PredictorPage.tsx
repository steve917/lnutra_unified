import React, { useEffect, useMemo, useState } from "react";

/**
 * PredictorPage
 * - Reads your backend base URL from Vite env: VITE_API_BASE_URL
 * - Calls /v1/predictions?limit={n}
 * - Shows a small rows selector, the API base it’s using, and a simple table
 */

type Features = {
  age_years?: number;
  sex?: string;
  weight_kg?: number;
  bmi?: number;
  hba1c?: number;
  meds_diabetes?: number;
  fmd_regimen_type?: string;
  n_cycles?: number;
  adherence_pct?: number;
  // allow unknowns without breaking rendering
  [k: string]: unknown;
};

type Prediction = {
  id: number;
  created_at: string; // ISO string
  safety_badge: "green" | "yellow" | "red" | string;
  weight: number; // delta kg
  hba1c: number; // delta %
  features: Features;
};

const ROW_OPTIONS = [10, 20, 50, 100, 200];

export default function PredictorPage() {
  const apiBaseRaw = import.meta.env.VITE_API_BASE_URL as string | undefined;

  // normalize base (trim trailing slashes)
  const apiBase = useMemo(() => (apiBaseRaw || "").replace(/\/+$/, ""), [apiBaseRaw]);
  const predictionsPath = "/v1/predictions"; // from Swagger

  const [limit, setLimit] = useState<number>(50);
  const [rows, setRows] = useState<Prediction[] | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      if (!apiBase) {
        setLoading(false);
        setError(
          "VITE_API_BASE_URL is missing. Create apps/web/.env with VITE_API_BASE_URL=https://ln-api-rgxr.onrender.com"
        );
        return;
      }

      const url = `${apiBase}${predictionsPath}?limit=${encodeURIComponent(limit)}`;

      try {
        const res = await fetch(url, {
          headers: { Accept: "application/json" },
        });

        if (!res.ok) {
          // try to read response text for more context
          let detail = "";
          try {
            detail = await res.text();
          } catch {
            /* ignore */
          }
          throw new Error(
            `Request failed: ${res.status} ${res.statusText}${detail ? ` — ${detail}` : ""}`
          );
        }

        const data = (await res.json()) as Prediction[];
        if (!cancelled) setRows(data);
      } catch (err: any) {
        if (!cancelled) setError(err?.message || "Unknown error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [apiBase, limit]);

  return (
    <div style={{ padding: 24, fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <h1 style={{ margin: 0 }}>Predictor</h1>
        <small style={{ opacity: 0.7 }}>
          API:&nbsp;
          <code>{apiBase || "(not set)"}</code>
        </small>
      </header>

      <section style={{ marginTop: 16, display: "flex", gap: 16, alignItems: "center" }}>
        <label>
          Rows:&nbsp;
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            style={{ padding: "4px 8px" }}
          >
            {ROW_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
            <option value={50}>50</option>
          </select>
        </label>
        {loading && <span style={{ opacity: 0.7 }}>Loading…</span>}
      </section>

      {error && (
        <div style={{ marginTop: 16, color: "#b00020" }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      <div style={{ marginTop: 16, overflowX: "auto" }}>
        <table
          style={{
            borderCollapse: "collapse",
            minWidth: 680,
            width: "100%",
            border: "1px solid #e5e7eb",
          }}
        >
          <thead style={{ background: "#f9fafb" }}>
            <tr>
              <Th>Time (UTC)</Th>
              <Th>Badge</Th>
              <Th>Δ Weight (kg)</Th>
              <Th>Δ HbA1c (%)</Th>
              <Th>Features (summary)</Th>
            </tr>
          </thead>
          <tbody>
            {rows?.map((r) => (
              <tr key={r.id}>
                <Td mono>{new Date(r.created_at).toISOString()}</Td>
                <Td>
                  <Badge color={r.safety_badge} />
                </Td>
                <Td right>{fmtNum(r.weight)}</Td>
                <Td right>{fmtNum(r.hba1c)}</Td>
                <Td mono>
                  {summarizeFeatures(r.features)}
                </Td>
              </tr>
            ))}
            {!loading && !error && (rows?.length ?? 0) === 0 && (
              <tr>
                <Td colSpan={5} style={{ opacity: 0.7 }}>
                  No data.
                </Td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Small presentational helpers */

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th
      style={{
        textAlign: "left",
        padding: "10px 12px",
        borderBottom: "1px solid #e5e7eb",
        fontWeight: 600,
      }}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  right,
  mono,
  colSpan,
  style,
}: {
  children: React.ReactNode;
  right?: boolean;
  mono?: boolean;
  colSpan?: number;
  style?: React.CSSProperties;
}) {
  return (
    <td
      colSpan={colSpan}
      style={{
        padding: "10px 12px",
        borderBottom: "1px solid #f1f5f9",
        textAlign: right ? "right" : "left",
        fontFamily: mono ? "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" : undefined,
        ...style,
      }}
    >
      {children}
    </td>
  );
}

function Badge({ color }: { color: string }) {
  const bg =
    color === "green" ? "#d1fae5" : color === "yellow" ? "#fef3c7" : color === "red" ? "#fee2e2" : "#e5e7eb";
  const fg =
    color === "green" ? "#065f46" : color === "yellow" ? "#92400e" : color === "red" ? "#991b1b" : "#374151";
  const label = color || "unknown";
  return (
    <span
      style={{
        background: bg,
        color: fg,
        padding: "2px 8px",
        borderRadius: 999,
        fontSize: 12,
        textTransform: "capitalize",
      }}
    >
      {label}
    </span>
  );
}

function fmtNum(n: number | null | undefined) {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return n.toFixed(1);
}

function summarizeFeatures(f: Features) {
  // Show a short, readable subset
  const parts: string[] = [];
  if (f.age_years !== undefined) parts.push(`age:${f.age_years}`);
  if (f.sex) parts.push(`sex:${f.sex}`);
  if (f.weight_kg !== undefined) parts.push(`wt:${f.weight_kg}`);
  if (f.bmi !== undefined) parts.push(`bmi:${f.bmi}`);
  if (f.hba1c !== undefined) parts.push(`hba1c:${f.hba1c}`);
  if (f.meds_diabetes !== undefined) parts.push(`meds:${f.meds_diabetes}`);
  if (f.fmd_regimen_type) parts.push(`regimen:${f.fmd_regimen_type}`);
  if (f.n_cycles !== undefined) parts.push(`cycles:${f.n_cycles}`);
  if (f.adherence_pct !== undefined) parts.push(`adherence:${f.adherence_pct}%`);
  return parts.join(", ") || "(none)";
}
