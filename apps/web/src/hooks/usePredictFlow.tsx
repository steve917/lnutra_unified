import { useState } from 'react';
import type { Features, PredictionOutcomes } from '../types/predict';
import { apiValidate, apiPredict } from '../lib/api';

export function usePredictFlow() {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [hints, setHints] = useState<string[]>([]);
  const [result, setResult] = useState<PredictionOutcomes | null>(null);

  async function submit(features: Features) {
    setLoading(true);
    setErrors([]);
    setHints([]);
    setResult(null);
    try {
      const validation = await apiValidate(features);
      if (!validation.ok) {
        setErrors(validation.errors);
        setHints(validation.hints);
        return;
      }
      const prediction = await apiPredict(features);
      setResult(prediction);
    } catch (err: any) {
      setErrors([err.message ?? 'An unexpected error occurred']);
    } finally {
      setLoading(false);
    }
  }
  return { loading, errors, hints, result, submit };
}