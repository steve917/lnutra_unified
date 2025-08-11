import React, { useEffect, useMemo, useState } from "react";
import {
  apiBase,
  hasBasicAuth,
  getFeatureColumns,
  getPredictions,
  resolvePredictionsPath,
  type PredictionRow,
} from "../lib/api";

export default function OpsPage() {
  const [features, setFeatures] = useState<string[]>([]);
  const [predictions, setPredictions] = useState<PredictionRow[]>([]);
  const [limit, setLimit] = useState<number>(50);
  const [predPath, setPredPath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load features and detect predictions list endpoint (if any)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const cols = await getFeatureColumns();
        if (!mounted) return;
        setFeatures(cols);
      } catch (e: any) {
        if (!mounted) return;
        setError(
          `Failed to load features. ${e?.message ?? "Unexpected error."}`
        );
      }

      try {
        const path = await resolvePredictionsPath();
        if (!mounted) return;
        setPredPath(path);
      } catch {
        // ignore; predPath stays null
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Load predictions only if a list endpoint exists
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!predPath) return; // no list endpoint on the backend
      try {
        const rows = await getPredictions(limit);
        if (!mounted) return;
        setPredictions(rows);
        setError(null);
      } catch (e: any) {
        if (!mounted) return;
        setError(
          `Failed to load predictions. ${e?.response?.status ?? ""} ${
            e?.message ?? ""
          }`.trim()
        );
      }
    })();
    return () => {
      mounted = false;
    };
  }, [predPath, limit]);

  const rows = useMemo(() => predictions ?? [], [predictions]);

  return (
    <div style={{ padding: 16 }}>
      <h1>Ops</h1>
      <p style={{ fontSize: 12, color: "#444" }}>
        <strong>API_BASE:</strong> {apiBase} | <strong>Has Basic:</strong>{" "}
        {hasBasicAuth ? "yes" : "no"}{" "}
        {predPath ? (
          <>
            | <strong>Using predictions path:</strong> {predPath}
          </>
        ) : (
          <>| <strong>Using path:</strong> (not found)</>
        )}
      </p>

      {/* Banner when there is an error */}
      {error && (
        <div
          style={{
            background: "#fdecea",
            border: "1px solid #f5c2c0",
            color: "#7f1d1d",
            padding: "10px 12px",
            borderRadius: 6,
            marginBottom: 12,
          }}
        >
          {predPath
            ? error
            : "No predictions endpoint found (tried /v1/predictions and /predictions)."}
        </div>
      )}

      <h3>Feature columns</h3>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={th}>#</th>
            <th style={th}>Feature name</th>
          </tr>
        </thead>
        <tbody>
          {features.map((f, i) => (
            <tr key={f}>
              <td style={td}>{i + 1}</td>
              <td style={td}>{f}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ height: 24 }} />

      <h3>Latest predictions</h3>
      <div style={{ marginBottom: 8 }}>
        <label>
          Rows:{" "}
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
          >
            {[10, 25, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
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
          {rows.length === 0 ? (
            <tr>
              <td style={td} colSpan={5}>
                {predPath
                  ? "No rows."
                  : "Predictions list endpoint not available on the backend."}
              </td>
            </tr>
          ) : (
            rows.map((r, i) => (
              <tr key={i}>
                <td style={td}>{r.created_at}</td>
                <td style={td}>{r.badge}</td>
                <td style={td}>{r.delta_weight_kg}</td>
                <td style={td}>{r.delta_hba1c_pct}</td>
                <td style={td}>
                  {summarizeFeatures(r.features as Record<string, unknown>)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

const th: React.CSSProperties = {
  textAlign: "left",
  borderBottom: "1px solid #ddd",
  padding: "8px 6px",
  background: "#fafafa",
};

const td: React.CSSProperties = {
  borderBottom: "1px solid #eee",
  padding: "8px 6px",
};

function summarizeFeatures(feats: Record<string, unknown>) {
  const keys = Object.keys(feats ?? {}).slice(0, 4);
  return keys.map((k) => `${k}: ${String(feats[k])}`).join(", ") + (keys.length >= 4 ? " ..." : "");
}
