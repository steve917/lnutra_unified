const BASE = import.meta.env.VITE_API_BASE;

type PredictPayload = any;

function pickNumber(...vals: any[]): number | undefined {
  for (const v of vals) {
    const n = typeof v === 'number' ? v : Number.isFinite(+v) ? +v : undefined;
    if (n !== undefined && !Number.isNaN(n)) return n;
  }
  return undefined;
}

function superset(json: any) {
  const rec = json?.recommendation ?? json?.result?.recommendation ?? json?.data?.recommendation ?? {};
  const weight = pickNumber(json?.weight, rec?.weight, json?.predicted_weight_change, json?.predicted_weight_change_kg);
  const hba1c  = pickNumber(json?.hba1c, rec?.hba1c, json?.predicted_hba1c_change, json?.predicted_hba1c_change_pct);
  const badge  = json?.safetyBadge ?? json?.safety_badge ?? rec?.badge ?? 'green';
  return {
    ...json,
    weight, hba1c,
    safetyBadge: badge,
    safety_badge: badge,
    predicted_weight_change: weight,
    predicted_weight_change_kg: weight,
    predicted_hba1c_change: hba1c,
    predicted_hba1c_change_pct: hba1c,
    recommendation: { weight, hba1c, badge },
    result: { recommendation: { weight, hba1c, badge } },
    data:   { recommendation: { weight, hba1c, badge } },
  };
}

export async function validate(payload: PredictPayload) {
  const r = await fetch(${BASE}/v1/validate, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function predict(payload: PredictPayload) {
  console.log("predict() HIT", payload);
  const r = await fetch(${BASE}/v1/predict, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error(await r.text());
  const json = await r.json();
  const sup = superset(json);
  try { window.dispatchEvent(new CustomEvent("ln:predict:done", { detail: sup })); } catch {}
  try { (window as any).__ln_last_prediction = sup; } catch {}
  return sup;
}
