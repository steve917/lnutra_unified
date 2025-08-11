import React, { useState } from 'react';
import { usePredictFlow } from './hooks/usePredictFlow';
import { RecommendationCard } from './components/RecommendationCard';
import Playbooks from './components/Playbooks';
import type { Features } from './types/predict';
import OpsPage from './pages/OpsPage';


const initialFeatures: Features = {
  age_years: 40,
  sex: 'M',
  weight_kg: 70,
  bmi: 22,
  hba1c: 5.6,
  meds_diabetes: 0,
  fmd_regimen_type: 'standard_fmd',
  n_cycles: 4,
  adherence_pct: 90,
};

export default function App() {
  const [features, setFeatures] = useState<Features>(initialFeatures);
  const { loading, errors, hints, result, submit } = usePredictFlow();
if (typeof window !== 'undefined' && window.location.pathname === '/ops') {
  return <OpsPage />;
}


  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setFeatures((f) => ({ ...f, [name]: typeof f[name as keyof Features] === 'number' ? Number(value) : value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    submit(features);
  }

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '16px', fontFamily: 'system-ui' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '16px' }}>L‑Nutra FMD Predictor</h1>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <label style={{ display: 'block' }}>
            <span style={{ fontSize: '0.875rem' }}>Age (years)</span>
            <input
              type="number"
              name="age_years"
              min={18}
              max={90}
              style={{ border: '1px solid #d1d5db', borderRadius: '4px', padding: '4px', width: '100%' }}
              value={features.age_years}
              onChange={handleChange}
            />
          </label>
          <label style={{ display: 'block' }}>
            <span style={{ fontSize: '0.875rem' }}>Sex</span>
            <select
              name="sex"
              style={{ border: '1px solid #d1d5db', borderRadius: '4px', padding: '4px', width: '100%' }}
              value={features.sex}
              onChange={handleChange}
            >
              <option value="M">Male</option>
              <option value="F">Female</option>
              <option value="Other">Other</option>
            </select>
          </label>
          <label style={{ display: 'block' }}>
            <span style={{ fontSize: '0.875rem' }}>Weight (kg)</span>
            <input
              type="number"
              name="weight_kg"
              step="0.1"
              min={30}
              max={200}
              style={{ border: '1px solid #d1d5db', borderRadius: '4px', padding: '4px', width: '100%' }}
              value={features.weight_kg}
              onChange={handleChange}
            />
          </label>
          <label style={{ display: 'block' }}>
            <span style={{ fontSize: '0.875rem' }}>BMI</span>
            <input
              type="number"
              name="bmi"
              step="0.1"
              min={10}
              max={60}
              style={{ border: '1px solid #d1d5db', borderRadius: '4px', padding: '4px', width: '100%' }}
              value={features.bmi}
              onChange={handleChange}
            />
          </label>
          <label style={{ display: 'block' }}>
            <span style={{ fontSize: '0.875rem' }}>HbA1c (%)</span>
            <input
              type="number"
              name="hba1c"
              step="0.1"
              min={3}
              max={15}
              style={{ border: '1px solid #d1d5db', borderRadius: '4px', padding: '4px', width: '100%' }}
              value={features.hba1c}
              onChange={handleChange}
            />
          </label>
          <label style={{ display: 'block' }}>
            <span style={{ fontSize: '0.875rem' }}>Diabetes Medication?</span>
            <select
              name="meds_diabetes"
              style={{ border: '1px solid #d1d5db', borderRadius: '4px', padding: '4px', width: '100%' }}
              value={String(features.meds_diabetes)}
              onChange={(e) =>
                setFeatures((f) => ({ ...f, meds_diabetes: e.target.value === '1' ? 1 : 0 }))
              }
            >
              <option value="0">No</option>
              <option value="1">Yes</option>
            </select>
          </label>
          <label style={{ display: 'block' }}>
            <span style={{ fontSize: '0.875rem' }}>Regimen</span>
            <select
              name="fmd_regimen_type"
              style={{ border: '1px solid #d1d5db', borderRadius: '4px', padding: '4px', width: '100%' }}
              value={features.fmd_regimen_type}
              onChange={handleChange}
            >
              <option value="standard_fmd">Standard FMD</option>
              <option value="modified_fmd">Modified FMD</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </label>
          <label style={{ display: 'block' }}>
            <span style={{ fontSize: '0.875rem' }}>Number of cycles</span>
            <input
              type="number"
              name="n_cycles"
              min={1}
              max={12}
              style={{ border: '1px solid #d1d5db', borderRadius: '4px', padding: '4px', width: '100%' }}
              value={features.n_cycles}
              onChange={handleChange}
            />
          </label>
          <label style={{ display: 'block' }}>
            <span style={{ fontSize: '0.875rem' }}>Adherence (%)</span>
            <input
              type="number"
              name="adherence_pct"
              step="1"
              min={0}
              max={100}
              style={{ border: '1px solid #d1d5db', borderRadius: '4px', padding: '4px', width: '100%' }}
              value={features.adherence_pct}
              onChange={handleChange}
            />
          </label>
        </div>
        <button
          type="submit"
          disabled={loading}
          style={{ marginTop: '8px', padding: '8px 16px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', opacity: loading ? 0.5 : 1 }}
        >
          {loading ? 'Submitting…' : 'Predict'}
        </button>
      </form>
      {errors.length > 0 && (
        <div style={{ marginTop: '16px', color: '#dc2626' }}>
          <h2 style={{ fontWeight: 500 }}>Errors:</h2>
          <ul style={{ listStyleType: 'disc', paddingLeft: '20px' }}>
            {errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      )}
      {hints.length > 0 && (
        <div style={{ marginTop: '16px', color: '#d97706' }}>
          <h2 style={{ fontWeight: 500 }}>Hints:</h2>
          <ul style={{ listStyleType: 'disc', paddingLeft: '20px' }}>
            {hints.map((h, i) => (
              <li key={i}>{h}</li>
            ))}
          </ul>
        </div>
      )}
      {result && (
        <div style={{ marginTop: '16px' }}>
          <RecommendationCard r={result} />
        </div>
      )}
      {/* Playbooks section */}
      <Playbooks />
    </div>
  );
}