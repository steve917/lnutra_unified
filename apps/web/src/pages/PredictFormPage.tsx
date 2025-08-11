// apps/web/src/pages/PredictFormPage.tsx
import React, { useMemo, useState } from "react";
import api from "../lib/api";

type Payload = {
  adherence_pct: number;
  age_years: number;
  bmi: number;
  fmd_regimen_type: string;
  hba1c: number;          // NOTE: digit 1, not letter l
  meds_diabetes: number;  // 0 or 1
  n_cycles: number;
  sex: "M" | "F";
  weight_kg: number;
};

type ApiError = { message: string };

const PredictFormPage: React.FC = () => {
  const backend = import.meta.env.VITE_API_BASE_URL || "";

  const [form, setForm] = useState<Payload>({
    adherence_pct: 90,
    age_years: 40,
    bmi: 22,
    fmd_regimen_type: "standard_fmd",
    hba1c: 5.6,
    meds_diabetes: 0,
    n_cycles: 4,
    sex: "M",
    weight_kg: 70,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [result, setResult] = useState<any | null>(null);

  const handleNum = (k: keyof Payload) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setForm((f) => ({ ...f, [k]: v === "" ? ("" as any) : Number(v) }));
  };

  const handleStr = (k: keyof Payload) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
  };

  const prettyResult = useMemo(() => {
    if (!result) return "";
    try {
      return JSON.stringify(result, null, 2);
    } catch {
      return String(result);
    }
  }, [result]);

  const submit = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      // POST /v1/predict with the body the backend expects
      const { data } = await api.post("/v1/predict", form);
      setResult(data);
    } catch (err: any) {
      const msg =
        err?.response?.data
          ? JSON.stringify(err.response.data)
          : err?.message || "Request failed";
      setError({ message: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 960, margin: "24px auto", padding: "0 16px" }}>
      <h1 style={{ marginBottom: 8 }}>Prediction</h1>
      <div style={{ fontSize: 12, color: "#555", marginBottom: 16 }}>
        Backend: <a href={backend} target="_blank" rel="noreferrer">{backend}</a>
      </div>

      {error && (
        <div style={{ background: "#fde2e1", color: "#7a1d1a", padding: 12, borderRadius: 6, marginBottom: 16 }}>
          {`Error: ${error.message}`}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <label>
          <div>adherence_pct</div>
          <input
            type="number"
            value={form.adherence_pct}
            onChange={handleNum("adherence_pct")}
            className="input"
          />
        </label>

        <label>
          <div>age_years</div>
          <input
            type="number"
            value={form.age_years}
            onChange={handleNum("age_years")}
            className="input"
          />
        </label>

        <label>
          <div>bmi</div>
          <input
            type="number"
            value={form.bmi}
            onChange={handleNum("bmi")}
            className="input"
          />
        </label>

        <label>
          <div>fmd_regimen_type</div>
          <input
            type="text"
            value={form.fmd_regimen_type}
            onChange={handleStr("fmd_regimen_type")}
            className="input"
          />
        </label>

        <label>
          <div>hba1c</div>
          <input
            type="number"
            step="0.1"
            value={form.hba1c}
            onChange={handleNum("hba1c")}
            className="input"
          />
        </label>

        <label>
          <div>meds_diabetes</div>
          <input
            type="number"
            value={form.meds_diabetes}
            onChange={handleNum("meds_diabetes")}
            className="input"
          />
        </label>

        <label>
          <div>n_cycles</div>
          <input
            type="number"
            value={form.n_cycles}
            onChange={handleNum("n_cycles")}
            className="input"
          />
        </label>

        <label>
          <div>sex</div>
          <input
            type="text"
            value={form.sex}
            onChange={handleStr("sex")}
            className="input"
          />
        </label>

        <label>
          <div>weight_kg</div>
          <input
            type="number"
            value={form.weight_kg}
            onChange={handleNum("weight_kg")}
            className="input"
          />
        </label>
      </div>

      <button
        onClick={submit}
        disabled={loading}
        style={{
          padding: "10px 16px",
          borderRadius: 8,
          border: "1px solid #ccc",
          background: loading ? "#eee" : "#fff",
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "Predicting…" : "Predict"}
      </button>

      {result && (
        <div style={{ marginTop: 24 }}>
          <h3>Result</h3>
          <pre
            style={{
              background: "#f6f8fa",
              padding: 12,
              borderRadius: 6,
              overflowX: "auto",
            }}
          >
{prettyResult}
          </pre>
        </div>
      )}
    </div>
  );
};

export default PredictFormPage;
