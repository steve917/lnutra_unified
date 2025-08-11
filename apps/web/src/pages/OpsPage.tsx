// apps/web/src/pages/OpsPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import api, { apiBase, hasBasicAuth, getFeatureColumns, getPredictions, PredictOut } from "../lib/api";

type Row = PredictOut;

function badgeClass(b: Row["safety_badge"]) {
  switch (b) {
    case "green":
      return { color: "#0a0", label: "Green" };
    case "yellow":
      return { color: "#c9a400", label: "Yellow" };
    case "red":
      return { color: "#c00", label: "Red" };
    default:
      return { color: "#666", label: String(b) };
  }
}

function toUTC(ts: string) {
  try {
    return new Date(ts).toISOString().replace("T", " ").replace("Z", "");
  } catch {
    return ts;
  }
}

function toCSV(rows: Row[]): string {
  const headers = [
    "created_at_utc",
    "badge",
    "delta_weight_kg",
    "delta_hba1c_pct",
    "features_json",
  ];
  const lines = rows.map((r) =>
    [
      toUTC(r.created_at),
      r.safety_badge,
      r.delta_weight_kg,
      r.delta_hba1c_pct,
      JSON.stringify(r.features),
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(",")
  );
  return [headers.join(","), ...lines].join("\n");
}

export default function OpsPage() {
  const [features, setFeatures] = useState<string[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [limit, setLimit] = useState<number>(50);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const cols = await getFeatureColumns();
        setFeatures(cols);
      } catch (e: any) {
        setFeatures([]);
        setErr(`Failed to load feature columns. ${e?.message ?? e}`);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const data = await getPredictions(limit);
        setRows(data);
      } catch (e: any) {
        setRows([]);
        setErr(`Failed to load predictions. ${e?.message ?? e}`);
      } finally {
        setLoading(false);
      }
    })();
  }, [limit]);

  const csvBlobUrl = useMemo(() => {
    if (!rows?.length) return null;
    const blob = new Blob([toCSV(rows)], { type: "text/csv;charset=utf-8" });
    return URL.createObjectURL(blob);
  }, [rows]);

  return (
    <div style={{ padding: "1.25rem" }}>
      <h1 style={{ marginTop: 0 }}>Ops</h1>

      <div style={{ marginBottom: 12, color: "#555" }}>
        <b>API_BASE:</b> {apiBase || "(missing)"} &nbsp;|&nbsp; <b>Has Basic:</b>{" "}
        {hasBasicAuth ? "yes" : "no"}
      </div>

      {err && (
        <div
          style={{
            background: "#fde8e8",
            border: "1px solid #f5b5b5",
            color: "#8a1f1f",
            padding: "10px 12px",
            borderRadius: 6,
            marginBottom: 12,
          }}
        >
          {err}
        </div>
      )}

      {/* Feature columns */}
      <section style={{ marginBottom: 28 }}>
        <h3 style={{ margin: "16px 0 8px" }}>Feature columns</h3>
        {!features && <div>Loading…</div>}
        {features && (
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              border: "1px solid #eee",
            }}
          >
            <thead>
              <tr style={{ background: "#fafafa" }}>
                <th style={{ textAlign: "left", padding: "10px" }}>#</th>
                <th style={{ textAlign: "left", padding: "10px" }}>
                  Feature name
                </th>
              </tr>
            </thead>
            <tbody>
              {features.map((f, i) => (
                <tr key={f} style={{ borderTop: "1px solid #f2f2f2" }}>
                  <td style={{ padding: "10px" }}>{i + 1}</td>
                  <td style={{ padding: "10px" }}>{f}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Predictions */}
      <section>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <h3 style={{ margin: "16px 0 8px" }}>Latest predictions</h3>
          <label style={{ fontSize: 14 }}>
            Rows:&nbsp;
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
            >
              {[10, 25, 50, 100, 200, 500].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          {csvBlobUrl && (
            <a
              href={csvBlobUrl}
              download={`predictions_${limit}.csv`}
              style={{
                fontSize: 14,
                padding: "6px 10px",
                border: "1px solid #ddd",
                borderRadius: 6,
                textDecoration: "none",
              }}
            >
              Download CSV
            </a>
          )}
        </div>

        {loading && <div>Loading predictions…</div>}
        {!loading && rows && (
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              border: "1px solid #eee",
            }}
          >
            <thead>
              <tr style={{ background: "#fafafa" }}>
                <th style={{ textAlign: "left", padding: "10px" }}>Time (UTC)</th>
                <th style={{ textAlign: "left", padding: "10px" }}>Badge</th>
                <th style={{ textAlign: "left", padding: "10px" }}>
                  Δ Weight (kg)
                </th>
                <th style={{ textAlign: "left", padding: "10px" }}>
                  Δ HbA1c (%)
                </th>
                <th style={{ textAlign: "left", padding: "10px" }}>
                  Features (summary)
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const badge = badgeClass(r.safety_badge);
                const summary = Object.entries(r.features || {})
                  .slice(0, 5)
                  .map(([k, v]) => `${k}: ${v}`)
                  .join(", ");
                return (
                  <tr key={r.id} style={{ borderTop: "1px solid #f2f2f2" }}>
                    <td style={{ padding: "10px" }}>{toUTC(r.created_at)}</td>
                    <td style={{ padding: "10px" }}>
                      <span
                        style={{
                          display: "inline-block",
                          background: badge.color,
                          color: "#fff",
                          padding: "2px 8px",
                          borderRadius: 999,
                          fontSize: 12,
                        }}
                      >
                        {badge.label}
                      </span>
                    </td>
                    <td style={{ padding: "10px" }}>{r.delta_weight_kg}</td>
                    <td style={{ padding: "10px" }}>{r.delta_hba1c_pct}</td>
                    <td style={{ padding: "10px" }}>{summary}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
