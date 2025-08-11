import React, { useEffect, useState } from "react";
import { getFeatureColumns, apiBase, hasBasicAuth } from "../lib/api";

/**
 * OpsPage
 * - Calls GET /v1/features
 * - Displays the feature keys your backend exposes
 * - Shows helpful status text at the top (API base, whether Basic auth is set)
 */

export default function OpsPage() {
  const [features, setFeatures] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const cols = await getFeatureColumns(); // GET /v1/features
        // API may return array of strings or {name: string}[]; normalize:
        const names =
          Array.isArray(cols)
            ? cols.map((c: any) => (typeof c === "string" ? c : c?.name)).filter(Boolean)
            : [];
        setFeatures(names);
        console.log("[OPS] loaded features:", names);
      } catch (err: any) {
        console.error("[OPS] features error:", err);
        const msg =
          err?.response?.status
            ? `HTTP ${err.response.status} — ${JSON.stringify(err.response.data)}`
            : err?.message || "Unknown error";
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ marginBottom: 8 }}>Ops</h1>

      <div style={{ color: "#666", fontSize: 14, marginBottom: 16 }}>
        API_BASE: <code>{apiBase}</code> &nbsp;|&nbsp; Has Basic:{" "}
        <strong>{hasBasicAuth ? "yes" : "no"}</strong>
      </div>

      {loading && <div>Loading features…</div>}

      {error && (
        <div
          style={{
            background: "#fde8e8",
            border: "1px solid #f8b4b4",
            color: "#c81e1e",
            padding: "10px 12px",
            borderRadius: 6,
            marginBottom: 12,
          }}
        >
          Failed to load features. {error}
        </div>
      )}

      {!loading && !error && (
        <>
          <h3 style={{ marginTop: 0 }}>Feature columns</h3>
          {features.length === 0 ? (
            <div style={{ color: "#666" }}>No features returned from /v1/features.</div>
          ) : (
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                marginTop: 8,
              }}
            >
              <thead>
                <tr>
                  <th style={th}>#</th>
                  <th style={th}>Feature name</th>
                </tr>
              </thead>
              <tbody>
                {features.map((name, idx) => (
                  <tr key={name}>
                    <td style={td}>{idx + 1}</td>
                    <td style={tdMono}>{name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </div>
  );
}

const th: React.CSSProperties = {
  textAlign: "left",
  padding: "8px 10px",
  borderBottom: "1px solid #ddd",
  background: "#fafafa",
  fontWeight: 600,
};

const td: React.CSSProperties = {
  padding: "8px 10px",
  borderBottom: "1px solid #eee",
};

const tdMono: React.CSSProperties = {
  ...td,
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
};
