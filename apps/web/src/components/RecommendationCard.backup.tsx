import React from 'react';
import type { PredictionOutcomes, SafetyBadge } from '../types/predict';

function Badge({ color }: { color: SafetyBadge }) {
  const bg = {
    green: '#16a34a',
    amber: '#d97706',
    red: '#dc2626',
  }[color];
  const style: React.CSSProperties = {
    backgroundColor: bg,
    color: 'white',
    padding: '2px 6px',
    borderRadius: '9999px',
    fontSize: '0.75rem',
    textTransform: 'uppercase',
  };
  return <span style={style}>{color}</span>;
}

export function RecommendationCard({ r }: { r: PredictionOutcomes }) {
  const sectionStyle: React.CSSProperties = {
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    padding: '16px',
    marginTop: '16px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
  };
  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
  };
  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    marginBottom: '8px',
  };
  const muted: React.CSSProperties = { fontSize: '0.8rem', color: '#6b7280' };
  const strong: React.CSSProperties = { fontSize: '1.25rem', fontWeight: 600 };
  return (
    <section aria-live="polite" style={sectionStyle}>
      <div style={headerStyle}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Personalized Recommendation</h2>
          <Badge color={r.safety_badge} />
      </div>
      <div style={gridStyle}>
        <div>
          <div style={muted}>Total Weight Change</div>
          <div style={strong}>{r.predicted_weight_change.toFixed(1)} kg</div>
          <div style={{ ...muted, fontSize: '0.7rem' }}>
            Per cycle: {r.per_cycle.weight.toFixed(2)} kg
          </div>
        </div>
        <div>
          <div style={muted}>Total HbA1c Change</div>
          <div style={strong}>{r.predicted_hba1c_change.toFixed(2)} %</div>
          <div style={{ ...muted, fontSize: '0.7rem' }}>
            Per cycle: {r.per_cycle.hba1c.toFixed(2)} %
          </div>
        </div>
      </div>
      <div>
        <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>Why this matters</div>
        <p style={{ fontSize: '0.875rem' }}>{r.rationale.reason}</p>
      </div>
      <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
        <button style={{ padding: '8px 12px', borderRadius: '8px', background: '#000', color: '#fff' }}>
          Accept & Schedule
        </button>
        <button style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #d1d5db' }}>
          View Alternatives
        </button>
      </div>
    </section>
  );
}