import React, { useEffect, useState } from "react";
import api, { apiBase, hasBasicAuth } from "../lib/api";

type Features = Record<string, any>;

export default function OpsPage() {
  const [cols, setCols] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/v1/features");
        if (Array.isArray(data)) setCols(data as string[]);
        else setCols(Object.keys(data as Features));
      } catch (e: any) {
        setErr(e?.message || "Failed to load features");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="page">
      <h1 className="page-title">Ops</h1>

      <div className="muted mb-3">
        <strong>API_BASE:</strong> {apiBase} &nbsp;|&nbsp; <strong>Has Basic:</strong>{" "}
        {hasBasicAuth ? "yes" : "no"} &nbsp;|&nbsp; <strong>Using path:</strong>{" "}
        features only
      </div>

      {err && (
        <div role="alert" className="alert error">
          {err}
        </div>
      )}

      <section>
        <h2>Feature columns</h2>
        {loading ? (
          <div className="muted">Loading…</div>
        ) : (
          <div className="table">
            <div className="thead">
              <div>#</div>
              <div>Feature name</div>
            </div>
            <div className="tbody">
              {cols.map((c, i) => (
                <div className="tr" key={c}>
                  <div>{i + 1}</div>
                  <div>{c}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Note: We intentionally removed the “Latest predictions” list
          because the ML backend does not provide that endpoint.
          When you add a logging API, we can re-enable it. */}
    </div>
  );
}
