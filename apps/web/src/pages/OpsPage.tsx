import React, { useEffect, useMemo, useState } from "react";

type Row = {
  id: number;
  created_at: string;
  safety_badge: string;
  delta_weight_kg?: number | null;
  delta_hba1c_pct?: number | null;
  features?: Record<string, any> | null;
};

const OpsPage: React.FC = () => {
  // Read envs exactly how Vite exposes them
  const apiBase =
    (import.meta.env.VITE_API_BASE_URL as string) ||
    (import.meta.env.VITE_API_BASE as string) ||
    "";
  const basicCred = import.meta.env.VITE_API_BASIC as string | undefined;

  const [rows, setRows] = useState<Row[]>([]);
  const [err, setErr] = useState<string>("");

  const hasBasic = !!basicCred;
  const headers = useMemo(() => {
    const h: Record<string, string> = { "Accept": "application/json" };
    if (hasBasic) {
      const encoded = btoa(basicCred!);
      h["Authorization"] = `Basic ${encoded}`;
    }
    return h;
  }, [hasBasic, basicCred]);

  useEffect(() => {
    console.log("[OPS] component mounted");
    console.log("[OPS] apiBase =", apiBase);
    console.log("[OPS] hasBasic =", hasBasic);

    if (!apiBase) {
      setErr("No API base URL. Set VITE_API_BASE_URL on Render.");
      return;
    }

    const url = `${apiBase.replace(/\/+$/, "")}/v1/predictions?limit=50`;
    console.log("[OPS] fetching:", url);
    fetch(url, { headers })
      .then(async (r) => {
        console.log("[OPS] status:", r.status);
        const text = await r.text();
        console.log("[OPS] raw body:", text);
        if (!r.ok) {
          throw new Error(`HTTP ${r.status} — ${text}`);
        }
        const data = JSON.parse(text);
        setRows(Array.isArray(data) ? data : data?.items ?? []);
      })
      .catch((e) => {
        console.error("[OPS] fetch error:", e);
        setErr(String(e));
      });
  }, [apiBase, headers, hasBasic]);

  return (
    <div style={{ padding: "24px" }}>
      <h1>Ops</h1>

      {/* Small debug block so we can see envs rendered in the DOM */}
      <div style={{ fontSize: 12, color: "#666", marginBottom: 12 }}>
        API_BASE: <code>{apiBase || "(empty)"}</code> &nbsp;|&nbsp; Has Basic:{" "}
        <code>{hasBasic ? "yes" : "no"}</code>
      </div>

      {err && (
        <div
          style={{
            background: "#fde2e2",
            color: "#a40000",
            padding: 10,
            borderRadius: 6,
            marginBottom: 12,
          }}
        >
          {err}
        </div>
      )}

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          tableLayout: "fixed",
          fontSize: 14,
        }}
      >
        <thead>
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
              <td style={td}>{r.created_at}</td>
              <td style={td}>{r.safety_badge}</td>
              <td style={td}>{fmtNum(r.delta_weight_kg)}</td>
              <td style={td}>{fmtNum(r.delta_hba1c_pct)}</td>
              <td style={td}>{summarizeFeatures(r.features)}</td>
            </tr>
          ))}
          {!rows.length && !err && (
            <tr>
              <td style={td} colSpan={5}>
                (No rows yet)
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

const th: React.CSSProperties = {
  textAlign: "left",
  borderBottom: "1px solid #ddd",
  padding: "8px 6px",
  fontWeight: 600,
};
const td: React.CSSProperties = {
  borderBottom: "1px solid #eee",
  padding: "8px 6px",
  verticalAlign: "top",
};

function fmtNum(v?: number | null) {
  return typeof v === "number" ? v.toFixed(1) : "";
}

function summarizeFeatures(f?: Record<string, any> | null) {
  if (!f) return "";
  const keys = Object.keys(f);
  return keys
    .slice(0, 5)
    .map((k) => `${k}: ${String(f[k]).slice(0, 20)}`)
    .join(", ");
}

export default OpsPage;
