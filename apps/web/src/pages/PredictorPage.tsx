import React, { useEffect, useRef, useState } from "react";
import { postPredict, PredictIn, PredictOut, apiBase, hasBasicAuth } from "../lib/api";

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
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PredictOut | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const onChange = (k: keyof PredictIn, v: string | number) => {
    setForm((s) => ({ ...s, [k]: typeof s[k] === "number" ? Number(v) : String(v) }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const out = await postPredict(form);
      setResult(out);
    } catch (err: any) {
      setError(`Prediction failed: ${err?.response?.status || ""} ${err?.message || ""}`);
    } finally {
      setBusy(false);
    }
  };

  // Draw small viz when result changes
  useEffect(() => {
    const c = canvasRef.current;
    if (!c || !result) return;
    const ctx = c.getContext("2d")!;
    const w = (c.width = 400);
    const h = (c.height = 160);

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "rgba(255,255,255,0.04)";
    ctx.fillRect(0, 0, w, h);

    const bars = [
      { label: "Δ Weight (kg)", value: result.delta_weight_kg },
      { label: "Δ HbA1c (%)", value: result.delta_hba1c_pct },
    ];

    const cx = 40, barW = 260, top = 38, step = 56;

    ctx.font = "12px ui-sans-serif, system-ui";
    ctx.fillStyle = "rgba(230,235,255,0.9)";
    ctx.strokeStyle = "rgba(160,180,220,0.35)";

    bars.forEach((b, i) => {
      const y = top + i * step;
      // axis
      ctx.beginPath();
      ctx.moveTo(cx, y);
      ctx.lineTo(cx + barW, y);
      ctx.stroke();

      // center = no change
      const mid = cx + barW / 2;
      ctx.beginPath();
      ctx.moveTo(mid, y - 12);
      ctx.lineTo(mid, y + 12);
      ctx.stroke();

      // bar
      const scale = 30; // 1 unit = 30px
      const px = Math.max(-barW/2, Math.min(barW/2, b.value * scale));
      ctx.fillStyle = b.value < 0 ? "rgba(134,239,172,0.9)" : "rgba(255,167,102,0.9)";
      const left = px < 0 ? mid + px : mid;
      const width = Math.abs(px);
      ctx.fillRect(left, y - 8, width, 16);

      ctx.fillStyle = "rgba(230,235,255,0.9)";
      ctx.fillText(`${b.label}: ${b.value}`, cx, y - 16);
    });

    // badge
    const badgeColor =
      result.badge === "green" ? "rgba(134,239,172,0.95)" :
      result.badge === "yellow" ? "rgba(255,223,99,0.95)" :
      "rgba(255,129,129,0.95)";
    ctx.fillStyle = badgeColor;
    ctx.fillRect(w - 110, 18, 90, 26);
    ctx.fillStyle = "#0b1220";
    ctx.font = "700 13px ui-sans-serif, system-ui";
    ctx.fillText(result.badge.toUpperCase(), w - 92, 36);
  }, [result]);

  return (
    <>
      <h1 style={{ marginBottom: 12 }}>Prediction</h1>
      <div style={{ opacity: 0.8, fontSize: 14, marginBottom: 12 }}>
        <strong>API_BASE:</strong> {apiBase} | <strong>Has Basic:</strong> {hasBasicAuth ? "yes" : "no"}
      </div>

      {error && <div className="alert" style={{ marginBottom: 12 }}>{error}</div>}

      <div className="card" style={{ padding: 14, marginBottom: 18 }}>
        <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
          <div className="inputRow">
            <label>adherence_pct</label>
            <input className="input" type="number" value={form.adherence_pct} onChange={(e)=>onChange("adherence_pct", e.target.value)} />
          </div>

          <div className="inputRow">
            <label>age_years</label>
            <input className="input" type="number" value={form.age_years} onChange={(e)=>onChange("age_years", e.target.value)} />
          </div>

          <div className="inputRow">
            <label>bmi</label>
            <input className="input" type="number" step="0.1" value={form.bmi} onChange={(e)=>onChange("bmi", e.target.value)} />
          </div>

          <div className="inputRow">
            <label>fmd_regimen_type</label>
            <select className="input" value={form.fmd_regimen_type} onChange={(e)=>onChange("fmd_regimen_type", e.target.value)}>
              <option value="standard_fmd">standard_fmd</option>
              <option value="mini_fmd">mini_fmd</option>
            </select>
          </div>

          <div className="inputRow">
            <label>hba1c</label>
            <input className="input" type="number" step="0.1" value={form.hba1c} onChange={(e)=>onChange("hba1c", e.target.value)} />
          </div>

          <div className="inputRow">
            <label>meds_diabetes</label>
            <input className="input" type="number" value={form.meds_diabetes} onChange={(e)=>onChange("meds_diabetes", e.target.value)} />
          </div>

          <div className="inputRow">
            <label>n_cycles</label>
            <input className="input" type="number" value={form.n_cycles} onChange={(e)=>onChange("n_cycles", e.target.value)} />
          </div>

          <div className="inputRow">
            <label>sex</label>
            <select className="input" value={form.sex} onChange={(e)=>onChange("sex", e.target.value)}>
              <option value="M">M</option>
              <option value="F">F</option>
            </select>
          </div>

          <div className="inputRow">
            <label>weight_kg</label>
            <input className="input" type="number" step="0.1" value={form.weight_kg} onChange={(e)=>onChange("weight_kg", e.target.value)} />
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
            <button className="button" type="submit" disabled={busy}>
              {busy ? "Predicting…" : "Predict"}
            </button>
            <button className="button" type="button" style={{ background: "#c7d2fe" }}
              onClick={() => setForm(defaultInput)} disabled={busy}>
              Reset
            </button>
          </div>
        </form>
      </div>

      {result && (
        <div className="card" style={{ padding: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className="badge">badge: {result.badge}</span>
              <span className="badge">Δ weight: {result.delta_weight_kg} kg</span>
              <span className="badge">Δ HbA1c: {result.delta_hba1c_pct} %</span>
            </div>
          </div>

          <canvas ref={canvasRef} style={{ width: "100%", maxWidth: 560, borderRadius: 10 }} />
        </div>
      )}
    </>
  );
}
