import React, { useEffect, useState } from "react";
import { getFeatureColumns, apiBase, hasBasicAuth } from "../lib/api";

// History is off because the backend doesn't expose a list endpoint.
// Flip to true later if you add /predictions on your API.
const SHOW_HISTORY = false;

export default function OpsPage() {
  const [cols, setCols] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const list = await getFeatureColumns();
        setCols(list);
      } catch (e: any) {
        setErr(e?.message ?? "Failed to load feature columns.");
      } finally {
        setLoading(false);
      }
    })();

    if (SHOW_HISTORY) {
      // If/when you build an API list endpoint, fetch it here.
      // Example:
      // (async () => {
      //   const r = await api.get("/v1/predictions?limit=50");
      //   setPredictions(r.data);
      // })();
    }
  }, []);

  return (
    <div className="page">
      {/* Top info line */}
      <div style={{ marginBottom: 12, color: "#9CA3AF", fontSize: 14 }}>
        <b>API_BASE:</b> {apiBase} &nbsp; | &nbsp; <b>Has Basic:</b>{" "}
        {hasBasicAuth ? "yes" : "no"} &nbsp; | &nbsp; <b>Using path:</b>{" "}
        {SHOW_HISTORY ? "features + history" : "features only"}
      </div>

      {/* Red banner is suppressed while SHOW_HISTORY=false */}
      {SHOW_HISTORY && (
        <div
          style={{
            background: "#7f1d1d",
            color: "#fff",
            padding: 12,
            borderRadius: 6,
            marginBottom: 12,
          }}
        >
          Predictions list endpoint not available on the backend.
        </div>
      )}

      <h1>Ops</h1>

      <h2 style={{ marginTop: 24 }}>Feature columns</h2>
      {loading ? (
        <div>Loading…</div>
      ) : err ? (
        <div style={{ color: "#f87171" }}>{err}</div>
      ) : (
        <table className="simple">
          <thead>
            <tr>
              <th>#</th>
              <th>Feature name</th>
            </tr>
          </thead>
          <tbody>
            {cols.map((f, i) => (
              <tr key={f}>
                <td>{i + 1}</td>
                <td>{f}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* “Latest predictions” section hidden while history is off */}
      {SHOW_HISTORY && (
        <>
          <h2 style={{ marginTop: 32 }}>Latest predictions</h2>
          {/* render your predictions list here when the backend provides it */}
        </>
      )}
    </div>
  );
}
