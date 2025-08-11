import React, { useEffect, useState } from "react";
import { getFeatureColumns, apiBase, hasBasicAuth } from "../lib/api";

export default function OpsPage() {
  const [features, setFeatures] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const cols = await getFeatureColumns();
        if (!alive) return;
        setFeatures(cols || []);

        // probe list endpoint (optional)
        const authHeader =
          hasBasicAuth && import.meta.env.VITE_API_BASIC
            ? { Authorization: `Basic ${btoa(import.meta.env.VITE_API_BASIC)}` }
            : undefined;

        const try1 = await fetch(`${apiBase}/v1/predictions?limit=1`, { headers: authHeader });
        if (!try1.ok) {
          const try2 = await fetch(`${apiBase}/predictions?limit=1`, { headers: authHeader });
          if (!try2.ok) {
            setMessage("Predictions list endpoint not available on the backend.");
          }
        }
      } catch (e: any) {
        setMessage(`Failed to load features. ${e?.message || ""}`.trim());
      }
    })();

    return () => { alive = false; };
  }, []);

  return (
    <>
      <h1 style={{ marginBottom: 12 }}>Ops</h1>
      <div style={{ opacity: 0.8, fontSize: 14, marginBottom: 12 }}>
        <strong>API_BASE:</strong> {apiBase} | <strong>Has Basic:</strong> {hasBasicAuth ? "yes" : "no"} |{" "}
        <strong>Using path:</strong> {message?.includes("not available") ? "(not found)" : "(ok)"}
      </div>

      {message && <div className="alert" style={{ marginBottom: 14 }}>{message}</div>}

      <section>
        <h2 style={{ fontSize: 16, margin: "0 0 12px 0" }}>Feature columns</h2>
        <div className="card">
          <table className="table">
            <thead><tr><th>#</th><th>Feature name</th></tr></thead>
            <tbody>
              {features.map((f, i) => (
                <tr key={f}><td>{i + 1}</td><td>{f}</td></tr>
              ))}
              {features.length === 0 && (
                <tr><td colSpan={2} style={{ opacity: 0.8, padding: "12px" }}>No features returned.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section style={{ marginTop: 28 }}>
        <h2 style={{ fontSize: 16, margin: "0 0 10px 0" }}>Latest predictions</h2>
        <div className="card" style={{ padding: 14, color: "var(--ink-dim)" }}>
          {message?.includes("not available")
            ? "Predictions list endpoint not available on the backend."
            : "Predictions data will appear here once the endpoint is exposed."}
        </div>
      </section>
    </>
  );
}
