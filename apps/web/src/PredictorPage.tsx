import React, { useMemo, useState } from "react";
import { submitPrediction } from "../lib/api";

type Form = {
  adherence_pct: number;
  age_years: number;
  bmi: number;
  fmd_regimen_type: string;
  hba1c: number;
  meds_diabetes: number;
  n_cycles: number;
  sex: string;
  weight_kg: number;
};

export default function PredictorPage() {
  const [form, setForm] = useState<Form>({
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

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const canSubmit = useMemo(() => !busy, [busy]);

  function change<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      // POST /v1/predict
      const data = await submitPrediction(form);
      setResult(data);
    } catch (err: any) {
      const status = err?.response?.status;
      const body = err?.response?.data
        ? JSON.stringify(err.response.data)
        : err?.message || "Unknown error";
      setError(`Request failed${status ? ` (${status})` : ""}: ${body}`);
      console.error("[Predict] error", err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page">
      <h1>Predict</h1>
      <form onSubmit={onSubmit} className="grid gap-3" style={{ maxWidth: 520 }}>
        <label>
          adherence_pct
          <input
            type="number"
            value={form.adherence_pct}
            onChange={(e) => change("adherence_pct", Number(e.target.value))}
          />
        </label>
        <label>
          age_years
          <input
            type="number"
            value={form.age_years}
            onChange={(e) => change("age_years", Number(e.target.value))}
          />
        </label>
        <label>
          bmi
          <input
            type="number"
            value={form.bmi}
            onChange={(e) => change("bmi", Number(e.target.value))}
          />
        </label>
        <label>
          fmd_regimen_type
          <input
            type="text"
            value={form.fmd_regimen_type}
            onChange={(e) => change("fmd_regimen_type", e.target.value)}
          />
        </label>
        <label>
          hba1c
          <input
            type="number"
            value={form.hba1c}
            onChange={(e) => change("hba1c", Number(e.target.value))}
          />
        </label>
        <label>
          meds_diabetes
          <input
            type="number"
            value={form.meds_diabetes}
            onChange={(e) => change("meds_diabetes", Number(e.target.value))}
          />
        </label>
        <label>
          n_cycles
          <input
            type="number"
            value={form.n_cycles}
            onChange={(e) => change("n_cycles", Number(e.target.value))}
          />
        </label>
        <label>
          sex
          <select
            value={form.sex}
            onChange={(e) => change("sex", e.target.value as "M" | "F")}
          >
            <option value="M">M</option>
            <option value="F">F</option>
          </select>
        </label>
        <label>
          weight_kg
          <input
            type="number"
            value={form.weight_kg}
            onChange={(e) => change("weight_kg", Number(e.target.value))}
          />
        </label>

        <button type="submit" disabled={!canSubmit}>
          {busy ? "Predicting…" : "Predict"}
        </button>
      </form>

      {error && (
        <div style={{ marginTop: 16, color: "crimson" }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {result && (
        <pre style={{ marginTop: 16, background: "#0b1020", padding: 12 }}>
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}
