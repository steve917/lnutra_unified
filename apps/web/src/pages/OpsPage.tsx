import React, { useEffect, useMemo, useState } from "react";

/**
 * Debug Ops page
 * - Displays resolved API base
 * - Calls GET /v1/predictions?limit=50 with Basic Auth
 * - Renders rows or the exact error
 * - Logs everything to the console
 */

type Prediction = {
  id: number;
  created_at: string; // ISO
  safety_badge: string; // "green" | "yellow" | "red" | etc
  delta_weight_kg?: number;
  delta_hba1c_pct?: number;
  features?: Record<string, unknown>;
};

export default function OpsPage() {
  console.log("[OPS] component mounted");

  // Read envs (both names supported; we’ll prefer VITE_API_BASE_URL)
  const apiBase =
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_API_BASE ||
    "";

  // Basic credentials "user:pass"
  const basic = import.meta.env.VITE_API_BASIC as string | undefined;

  const [rows, setRows] = useState<Prediction[]>([]);
  const [status, setStatus] = useState<{
    phase: "idle" | "loading" | "ok" | "error";
    message?: string;
  }>({ phase: "idle" });

  const headers = useMemo(() => {
    const h: Record<string, string> = { Accept: "application/json" };
    if (basic && basic.length > 0) {
      // Authorization: Basic base64(user:pass)
      const encoded = typeof window !== "undefined" ? btoa(basic) : "";
      h["Authorization"] = `Basic ${encoded}`;
    }
    return h;
  }, [basic]);

  useEffect(() => {
    (async () => {
      if (!apiBase) {
        setStatus({
          phase: "error",
          message:
            "API base URL is empty. Check VITE_API_BASE_URL or VITE_API_BASE on Render.",
        });
        console.warn("[OPS] Missing API base env");
        return;
      }

      const url = `${apiBase.replace(/\/+$/, "")}/v1/predictions?limit=50`;
      console.log("[OPS] fetching:", url, { headers });

      setStatus({ phase: "loading" });
      try {
        const resp = await fetch(url, { headers });
        const text = await resp.text();
        console.log("[OPS] raw status:", resp.status, resp.statusText);
        console.log("[OPS] raw body:", text);

        if (!resp.ok) {
          setStatus({
            phase: "error",
            message: `Request failed ${resp.status} ${resp.statusText}`,
          });
          return;
        }

        const data = JSON.parse(text) as Prediction[];
        setRows(Array.isArray(data) ? data : []);
        setStatus({ phase: "ok" });
      } catch (err: any) {
        console.error("[OPS] fetch error:", err);
        setStatus({
          phase: "error",
          message: err?.message || String(err),
        });
      }
    })();
  }, [apiBase, headers]);

  return (
    <div style={{ padding: 16 }}>
      <h1>Ops</h1>

      <div style={{ marginBottom: 12, fontSize: 12, color: "#555" }}>
        <div>
          <strong>API_BASE:</strong>{" "}
          {apiBase || <em>(undefined)</em>}
        </div>
        <div>
          <strong>Has Basic:</strong> {basic ? "yes" : "no"}
        </div>
      </div>

      {status.phase === "loading" && (
        <div style={{ color: "#444" }}>Loading predictions…</div>
      )}
      {status.phase === "error" && (
        <div
          style={{
            background: "#fde2e1",
            border: "1px solid #f5b3b0",
            color: "#7a2826",
            padding: 10,
            marginBottom: 12,
            borderRadius: 6,
            maxWidth: 900,
          }}
        >
          Failed to load. {status.message}
        </div>
      )}

      {status.phase === "ok" && rows.length === 0 && (
        <div style={{ color: "#444" }}>No rows.</div>
      )}

      {rows.length > 0 && (
        <table
          style={{
            borderCollapse: "collapse",
            width: "100%",
            maxWidth: 1100,
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
                <td style={tdCap}>{r.safety_badge}</td>
                <td style={tdNum}>
                  {r.delta_weight_kg ?? ""}
                </td>
                <td style={tdNum}>
                  {r.delta_hba1c_pct ?? ""}
                </td>
                <td style={tdMono}>
                  {summarize(r.features)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const th: React.CSSProperties = {
  textAlign: "left",
  borderBottom: "1px solid #ddd",
  padding: "8px 10px",
  background: "#fafafa",
};
const td: React.CSSProperties = {
  borderBottom: "1px solid #eee",
  padding: "8px 10px",
};
const tdCap: React.CSSProperties = { ...td, textTransform: "capitalize" };
const tdNum: React.CSSProperties = { ...td, textAlign: "right", fontVariantNumeric: "tabular-nums" };
const tdMono: React.CSSProperties = { ...td, fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" };

function summarize(obj?: Record<string, unknown>) {
  if (!obj) return "";
  try {
    // shorten long JSON for the table
    const s = JSON.stringify(obj);
    return s.length > 120 ? s.slice(0, 117) + "…" : s;
  } catch {
    return "";
  }
}
