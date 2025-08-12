import React, { useEffect, useMemo, useRef, useState } from "react";
import "chart.js/auto";
import { Chart } from "chart.js/auto";
import { postPredict, type PredictIn, type PredictOut, apiBase, hasBasicAuth } from "../lib/api";

/** Simple badge color */
const badgeColor: Record<string, string> = {
  green: "#22c55e",
  yellow: "#facc15",
  red: "#ef4444",
};

const defaultInput: PredictIn = {
  adherence_pct: 90,
  age_years: 40,
  bmi: 22,
  fmd_regimen_type: "standard_fmd",
  hba1c: 5.6,
  meds_diabetes: 0,
  n_cycles: 4,
  sex: "M",
  weight_kg: 70,
};

export default function PredictorPage() {
  const [form, setForm] = useState<PredictIn>(defaultInput);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PredictOut | null>(null);

  // Chart.js refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<Chart | null>(null);

  const canPredict = useMemo(() => !loading, [loading]);

  function update<K extends keyof PredictIn>(key: K, val: PredictIn[K]) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const out = await postPredict(form);
      setResult(out);
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail ||
        err?.message ||
        "Prediction failed. Please try again.";
      setError(String(msg));
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setForm(defaultInput);
    setResult(null);
    setError(null);
    // clean chart
    if (chartRef.current) {
      chartRef.current.destroy();
      chartRef.current = null;
    }
  }

  // Draw/update canvas chart whenever result changes
  useEffect(() => {
    if (!canvasRef.current) return;
    if (chartRef.current) {
      chartRef.current.destroy();
      chartRef.current = null;
    }
    if (!result) return;

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    const weight = result.delta_weight_kg;
    const hba1c = result.delta_hba1c_pct;

    chartRef.current = new Chart(ctx, {
      type: "bar",
      data: {
        labels: ["Δ Weight (kg)", "Δ HbA1c (%)"],
        datasets: [
          {
            label: "Change",
            data: [weight, hba1c],
            backgroundColor: [
              weight < 0 ? "#60a5fa" : "#f87171",
              hba1c < 0 ? "#60a5fa" : "#f87171",
            ],
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: true },
          title: {
            display: true,
            text: `Badge: ${result.badge.toUpperCase()}`,
            color: badgeColor[result.badge] || "#93c5fd",
          },
        },
        scales: {
          x: { grid: { color: "rgba(148,163,184,0.2)" }, ticks: { color: "#e5eefc" } },
          y: { grid: { color: "rgba(148,163,184,0.2)" }, ticks: { color: "#e5eefc" } },
        },
      },
    });
  }, [result]);

  return (
    <div className="grid gap-6">
      <div className="text-sm text-slate-400">
        <strong>API_BASE:</strong> {apiBase || "(not set)"} &nbsp;|&nbsp; <strong>Has Basic:</strong>{" "}
        {hasBasicAuth ? "yes" : "no"}
      </div>

      <h1>Prediction</h1>

      {error && (
        <div role="alert" style={{ background: "#7f1d1d", color: "#fecaca", padding: 12, borderRadius: 8 }}>
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="grid md:grid-cols-2 gap-4" aria-label="Prediction form">
        <LabeledInput
          label="adherence_pct"
          type="number"
          value={form.adherence_pct}
          onChange={(v) => update("adherence_pct", Number(v))}
        />
        <LabeledInput label="age_years" type="number" value={form.age_years} onChange={(v) => update("age_years", Number(v))} />
        <LabeledInput label="bmi" type="number" value={form.bmi} onChange={(v) => update("bmi", Number(v))} />

        <div className="grid gap-1">
          <label>fmd_regimen_type</label>
          <select
            value={form.fmd_regimen_type}
            onChange={(e) => update("fmd_regimen_type", e.target.value)}
            className="p-2 rounded bg-slate-800 text-slate-100 border border-slate-700"
          >
            <option value="standard_fmd">standard_fmd</option>
            <option value="prolon">prolon</option>
            <option value="alternate_day">alternate_day</option>
          </select>
        </div>

        <LabeledInput label="hba1c" type="number" step="0.1" value={form.hba1c} onChange={(v) => update("hba1c", Number(v))} />
        <LabeledInput
          label="meds_diabetes"
          type="number"
          value={form.meds_diabetes}
          onChange={(v) => update("meds_diabetes", Number(v) as 0 | 1)}
        />
        <LabeledInput label="n_cycles" type="number" value={form.n_cycles} onChange={(v) => update("n_cycles", Number(v))} />

        <div className="grid gap-1">
          <label>sex</label>
          <select
            value={form.sex}
            onChange={(e) => update("sex", e.target.value as "M" | "F")}
            className="p-2 rounded bg-slate-800 text-slate-100 border border-slate-700"
          >
            <option value="M">M</option>
            <option value="F">F</option>
          </select>
        </div>

        <LabeledInput label="weight_kg" type="number" value={form.weight_kg} onChange={(v) => update("weight_kg", Number(v))} />
      </form>

      <div className="flex gap-3">
        <button
          onClick={onSubmit as any}
          disabled={!canPredict}
          className="rounded bg-blue-500 px-4 py-2 text-white disabled:opacity-60"
        >
          {loading ? "Predicting..." : "Predict"}
        </button>
        <button onClick={reset} className="rounded bg-slate-700 px-4 py-2 text-white">
          Reset
        </button>
      </div>

      {result && (
        <section className="grid gap-4">
          <div
            className="inline-flex items-center gap-2 text-sm"
            style={{ color: badgeColor[result.badge] || "#e5eefc" }}
          >
            <strong>badge:</strong> {result.badge} &nbsp; • &nbsp;
            <strong>Δ weight (kg):</strong> {result.delta_weight_kg} &nbsp; • &nbsp;
            <strong>Δ HbA1c (%):</strong> {result.delta_hba1c_pct}
          </div>

          <div style={{ background: "#0b1220", borderRadius: 12, padding: 12 }}>
            <canvas ref={canvasRef} height={220} />
          </div>
        </section>
      )}
    </div>
  );
}

function LabeledInput(props: {
  label: string;
  type?: string;
  step?: number | string;
  value: number | string;
  onChange: (v: string) => void;
}) {
  const { label, type = "number", step, value, onChange } = props;
  return (
    <div className="grid gap-1">
      <label htmlFor={label}>{label}</label>
      <input
        id={label}
        type={type}
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="p-2 rounded bg-slate-800 text-slate-100 border border-slate-700"
      />
    </div>
  );
}
