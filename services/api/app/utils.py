"""Helper functions for validation, prediction, and Supabase integration."""

from __future__ import annotations

import math
from typing import Any, Dict, Tuple

import httpx

from .config import get_settings
from .models import Features, PredictionOutcomes, PerCycleChange, PredictionConfidence


async def validate_features(features: Features) -> Tuple[bool, list[str], list[str]]:
    """Perform additional business‑rule validation on the incoming feature set.

    Returns a tuple of (ok, errors, hints).  Pydantic has already enforced
    basic bounds, but domain rules (like max cycles or medication hints) live here.
    """
    errors: list[str] = []
    hints: list[str] = []
    # Example: hint if medication flag is set but HbA1c is low
    if features.meds_diabetes == 1 and features.hba1c < 6.0:
        hints.append("Patient is on diabetes medications despite low HbA1c; verify inputs.")
    if features.weight_kg / ((features.bmi / 703.0) ** 0.5) < 40:
        # This check is intentionally nonsensical to demonstrate hints; adjust as needed
        hints.append("Unusual weight to BMI ratio; double‑check height inputs.")
    # Example: limit adherence
    if features.adherence_pct < 50:
        errors.append("Adherence must be at least 50% for meaningful projections.")
    ok = len(errors) == 0
    return ok, errors, hints


async def call_ml_service(features: Features) -> Dict[str, Any]:
    """Send features to the ML microservice and return the raw response.

    If `DEV_STUB` is true, returns deterministic outputs.  Otherwise
    performs an HTTP POST to the ML service.
    """
    settings = get_settings()
    if settings.dev_stub:
        # Simple deterministic function: weight change and HbA1c change scale with cycles and baseline values
        age_factor = 0.002 * features.age_years
        regimen_factor = {
            "standard_fmd": 1.0,
            "modified_fmd": 0.7,
            "maintenance": 0.3,
        }[features.fmd_regimen_type]
        weight_change = -regimen_factor * features.n_cycles * min(features.weight_kg * 0.01, settings.max_wl_cycle_kg)
        hba1c_change = -regimen_factor * features.n_cycles * min(features.hba1c * 0.1, settings.hba1c_drop_amber)
        return {
            "predicted_weight_change": weight_change,
            "predicted_hba1c_change": hba1c_change,
            "model_version": "stub-0.1",
        }
    # Real mode: call the ML microservice
    async with httpx.AsyncClient(timeout=30) as client:
        url = f"{settings.ml_url}/v1/predict"
        payload = features.dict()
        r = await client.post(url, json=payload)
        r.raise_for_status()
        return r.json()


def apply_safety_and_risk(features: Features, raw: Dict[str, Any]) -> PredictionOutcomes:
    """Adjust raw predictions based on safety thresholds and derive risk categories."""
    settings = get_settings()
    weight_change = float(raw.get("predicted_weight_change", 0.0))
    hba1c_change = float(raw.get("predicted_hba1c_change", 0.0))
    # Calculate projected BMI given weight change (assume height derived from BMI and weight)
    # BMI = weight_kg / (height_m^2) ⇒ height_m = sqrt(weight_kg / bmi)
    height_m = math.sqrt(features.weight_kg / features.bmi)
    projected_weight = features.weight_kg + weight_change
    projected_bmi = projected_weight / (height_m ** 2)
    # Determine risk flags
    risk = "low"
    badge = "green"
    if abs(weight_change) > settings.max_wl_cycle_kg * features.n_cycles or projected_bmi < settings.min_projected_bmi:
        risk = "high"
        badge = "red"
    elif abs(hba1c_change) > settings.hba1c_drop_amber * features.n_cycles:
        risk = "moderate"
        badge = "amber"
    # Build response
    per_cycle_weight = weight_change / features.n_cycles
    per_cycle_hba1c = hba1c_change / features.n_cycles
    rationale = {
        "reason": "Predictions are generated based on baseline metrics and chosen regimen.",
        "inputs_used": features.dict(),
    }
    model_meta = {k: v for k, v in raw.items() if k not in {"predicted_weight_change", "predicted_hba1c_change"}}
    return PredictionOutcomes(
        predicted_weight_change=weight_change,
        predicted_bmi_change=projected_bmi - features.bmi,
        predicted_hba1c_change=hba1c_change,
        per_cycle=PerCycleChange(weight=per_cycle_weight, hba1c=per_cycle_hba1c),
        confidence=PredictionConfidence(weight=0.75, hba1c=0.75),
        risk_category=risk,
        safety_badge=badge,
        rationale=rationale,
        model_meta=model_meta,
    )


async def fetch_playbooks() -> list[dict[str, Any]]:
    """Fetch all playbooks from Supabase via REST.  Returns an empty list if unsupported."""
    settings = get_settings()
    if not settings.supabase_url or not settings.supabase_api_key:
        return []
    async with httpx.AsyncClient(timeout=30) as client:
        url = f"{settings.supabase_url}/v_playbooks"
        params = {"select": "*"}
        headers = {
            "apikey": settings.supabase_api_key,
            "Authorization": f"Bearer {settings.supabase_api_key}",
        }
        r = await client.get(url, params=params, headers=headers)
        r.raise_for_status()
        return r.json()


async def fetch_playbook_by_slug(slug: str) -> dict[str, Any] | None:
    """Fetch a single playbook by its slug from Supabase."""
    settings = get_settings()
    if not settings.supabase_url or not settings.supabase_api_key:
        return None
    async with httpx.AsyncClient(timeout=30) as client:
        url = f"{settings.supabase_url}/v_playbooks"
        params = {"select": "*", "slug": f"eq.{slug}"}
        headers = {
            "apikey": settings.supabase_api_key,
            "Authorization": f"Bearer {settings.supabase_api_key}",
        }
        r = await client.get(url, params=params, headers=headers)
        r.raise_for_status()
        arr = r.json()
        return arr[0] if arr else None