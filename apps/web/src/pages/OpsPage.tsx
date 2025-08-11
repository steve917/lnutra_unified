import React, { useEffect, useState } from "react";
import CanvasLoader from "../components/CanvasLoader";
import { getFeatureColumns, apiBase, hasBasicAuth } from "../lib/api";

const MIN_LOADER_MS = 600; // guarantees the loader is visible briefly

export default function OpsPage() {
  const [loading, setLoading] = useState(true);
  const [features, setFeatures] = useState<string[]>([]);
  const [rows] = useState<number>(50);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const started = performance.now();

    const authHeader =
      hasBasicAuth && import.meta.env.VITE_API_BASIC
        ? { Authorization: `Basic ${btoa(import.meta.env.VITE_API_BASIC)}` }
        : undefined;

    (async () => {
      try {
        // Fetch feature columns
        const cols = await getFeatureColumns();
        if (!alive) return;
        setFeatures(cols || []);

        // Probe predictions list endpoint (optional)
        try {
          const url1 = `${apiBase}/v1/predictions?limit=1`;
          const r1 = await fetch(url1, { headers: authHeader });
          if (!r1.ok) {
            const url2 = `${apiBase}/predictions?limit=1`;
            const r2 = await fetch(url2, { headers: authHeader });
            if (!r2.ok) {
              setMessage("Predictions list endpoint not available on the backend.");
            }
          }
        } catch {
          setMessage("Predictions list endpoint not available on the backend.");
        }
      } catch (err: any) {
        setMessage(`Failed to load features. ${err?.message || ""}`.trim());
      } finally {
        // enforce minimum loader time
        const elapsed = performance.now() - started;
        const wait = Math.max(0, MIN_LOADER_MS - elapsed);
        await new Promise((res) => setTimeout(res, wait));
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="root">
      <div className="stage" style={{ padding: "16px 18px 32px 18px" }}>
        <header style={{ marginBottom: 12 }}>
          <h1 style={{ margin: "8px 0 4px 0" }}>Ops</h1>
          <div style={{ opacity: 0.8, fontSize: 14 }}>
            <strong>API_BASE:</strong> {apiBase} | <strong>Has Basic:</strong>{" "}
            {hasBasicAuth ? "yes" : "no"} |{" "}
            <strong>Using path:</strong>{" "}
            {message && message.includes("not available") ? "(not found)" : "(ok)"}
          </div>
        </header>

        {message && (
          <div
            style={{
              background: "rgba(255, 70, 70, 0.12)",
              color: "#ffd7d7",
              border: "1px solid rgba(255, 120, 120, 0.25)",
              padding: "10px 12px",
              borderRadius: 8,
              marginBottom: 14,
              fontSize: 14,
            }}
          >
            {message}
          </div>
        )}

        <section style={{ marginTop: 12 }}>
          <h2 style={{ fontSize: 16, margin: "0 0 12px 0" }}>Feature columns</h2>
          <div
            style={{
              border: "1px solid rgba(160,180,220,0.22)",
              borderRadius: 12,
              overflow: "hidden",
              background: "rgba(255,255,255,0.02)",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "rgba(160,180,255,0.06)" }}>
                  <th style={thStyle}>#</th>
                  <th style={thStyle}>Feature name</th>
                </tr>
              </thead>
              <tbody>
                {features.map((f, i) => (
                  <tr key={f} style={{ borderTop: "1px solid rgba(160,180,220,0.18)" }}>
                    <td style={tdStyle}>{i + 1}</td>
                    <td style={tdStyle}>{f}</td>
                  </tr>
                ))}
                {features.length === 0 && !loading && (
                  <tr>
                    <td style={tdStyle} colSpan={2}>
                      No features returned.
                    </td>
                  </tr>
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section style={{ marginTop: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <h2 style={{ fontSize: 16, margin: 0 }}>Latest predictions</h2>
            <span style={{ opacity: 0.7, fontSize: 13 }}>(Rows: {rows})</span>
          </div>

          <div
            style={{
              border: "1px dashed rgba(160,180,220,0.25)",
              color: "rgba(230,235,255,0.75)",
              background: "rgba(255,255,255,0.02)",
              padding: "14px 12px",
              borderRadius: 12,
              fontSize: 14,
            }}
          >
            {message && message.includes("not available")
              ? "Predictions list endpoint not available on the backend."
              : "Predictions data will appear here once the endpoint is exposed."}
          </div>
        </section>
      </div>

      <CanvasLoader show={loading} />
    </div>
  );
}

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "10px 12px",
  fontWeight: 600,
};

const tdStyle: React.CSSProperties = {
  padding: "10px 12px",
};
