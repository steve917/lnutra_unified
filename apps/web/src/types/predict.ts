export type Sex = "M" | "F" | "Other";
export type Regimen = "standard_fmd" | "modified_fmd" | "maintenance";

export interface Features {
  age_years: number;
  sex: Sex;
  weight_kg: number;
  bmi: number;
  hba1c: number;
  meds_diabetes: 0 | 1;
  fmd_regimen_type: Regimen;
  n_cycles: number;
  adherence_pct: number;
}

export interface PredictRequest {
  user_id?: string;
  session_id?: string;
  features: Features;
}

export interface PredictionConfidence {
  weight: number;
  hba1c: number;
}

export interface PerCycleChange {
  weight: number;
  hba1c: number;
}

export type RiskCategory = "low" | "moderate" | "high";
export type SafetyBadge = "green" | "amber" | "red";

export interface PredictionOutcomes {
  predicted_weight_change: number;
  predicted_bmi_change: number | null;
  predicted_hba1c_change: number;
  per_cycle: PerCycleChange;
  confidence: PredictionConfidence;
  risk_category: RiskCategory;
  safety_badge: SafetyBadge;
  rationale: { reason: string; inputs_used: Features };
  model_meta: Record<string, any>;
}

export interface ValidationResult {
  ok: boolean;
  errors: string[];
  hints: string[];
}