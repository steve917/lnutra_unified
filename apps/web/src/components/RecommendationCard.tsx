import React, { useEffect, useState } from 'react';

type Props = { data: any };

function pickNumber(...vals: any[]): number | undefined {
  for (const v of vals) {
    const n = typeof v === 'number' ? v : Number.isFinite(+v) ? +v : undefined;
    if (n !== undefined && !Number.isNaN(n)) return n;
  }
  return undefined;
}

const RecommendationCard: React.FC<Props> = ({ data }) => {
  const [payload, setPayload] = useState<any>(data);

  useEffect(() => { if (data !== undefined) setPayload(data); }, [data]);

  useEffect(() => {
    const last = (window as any).__ln_last_prediction;
    if (payload === undefined && last !== undefined) setPayload(last);
  }, [payload]);

  useEffect(() => {
    const onDone = (e: any) => setPayload(e?.detail);
    window.addEventListener('ln:predict:done', onDone as any);
    return () => window.removeEventListener('ln:predict:done', onDone as any);
  }, []);

  const root = payload?.data ?? payload?.result ?? payload ?? {};
  const rec  = root?.recommendation ?? payload?.recommendation ?? {};

  const weight = pickNumber(
    root?.weight, rec?.weight, payload?.weight,
    root?.predicted_weight_change, root?.predicted_weight_change_kg,
    payload?.predicted_weight_change, payload?.predicted_weight_change_kg
  );
  const hba1c = pickNumber(
    root?.hba1c, rec?.hba1c, payload?.hba1c,
    root?.predicted_hba1c_change, root?.predicted_hba1c_change_pct,
    payload?.predicted_hba1c_change, payload?.predicted_hba1c_change_pct
  );
  const badge =
    root?.safetyBadge ?? root?.safety_badge ??
    payload?.safetyBadge ?? payload?.safety_badge ??
    rec?.badge ?? 'green';

  return (
    <div style={{border:'1px solid #e5e7eb',borderRadius:12,padding:16,maxWidth:640}}>
      <h3 style={{marginTop:0}}>Recommendation</h3>
      <div>
        <div><strong>Projected weight change:</strong> {weight ?? '—'} kg</div>
        <div><strong>Projected HbA1c change:</strong> {hba1c ?? '—'} %</div>
        <div><strong>Safety:</strong> {badge}</div>
      </div>
    </div>
  );
};

export { RecommendationCard };
export default RecommendationCard;
