import type {
  Features,
  PredictionOutcomes,
  ValidationResult,
} from '../types/predict';

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8000';

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function apiValidate(features: Features): Promise<ValidationResult> {
  const res = await fetch(`${API_BASE}/v1/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ features }),
  });
  return handle<ValidationResult>(res);
}

export async function apiPredict(features: Features): Promise<PredictionOutcomes> {
  const res = await fetch(`${API_BASE}/v1/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ features }),
  });
  return handle<PredictionOutcomes>(res);
}

export async function apiListPlaybooks(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/v1/playbooks`);
  return handle<any[]>(res);
}

export async function apiGetPlaybook(slug: string): Promise<any> {
  const res = await fetch(`${API_BASE}/v1/playbooks/${slug}`);
  return handle<any>(res);
}