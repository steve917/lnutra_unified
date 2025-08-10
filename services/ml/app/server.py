"""Stub ML microservice for L‑Nutra unified pipeline.

This service exposes a single endpoint `/v1/predict` which accepts the
same feature payload as the API layer and returns deterministic or
model‑driven predictions.  By default it falls back to deterministic
logic unless real artefacts are provided via environment variables.
"""

from __future__ import annotations

import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
import numpy as np
import joblib

app = FastAPI(title="L‑Nutra ML Service", version="1.0.0")

MODEL_GLY = os.getenv("GLY_MODEL")
MODEL_ANTH = os.getenv("ANTH_MODEL")
PREPROC = os.getenv("PREPROC")

class Features(BaseModel):
    age_years: int = Field(..., ge=0)
    sex: str
    weight_kg: float
    bmi: float
    hba1c: float
    meds_diabetes: int
    fmd_regimen_type: str
    n_cycles: int
    adherence_pct: float


@app.on_event("startup")
def load_models() -> None:
    """Attempt to load models and preprocessor from disk."""
    global gly_model, anth_model, preproc
    gly_model = anth_model = preproc = None
    try:
        if MODEL_GLY and os.path.exists(MODEL_GLY):
            gly_model = joblib.load(MODEL_GLY)
        if MODEL_ANTH and os.path.exists(MODEL_ANTH):
            anth_model = joblib.load(MODEL_ANTH)
        if PREPROC and os.path.exists(PREPROC):
            preproc = joblib.load(PREPROC)
    except Exception:
        # swallow exceptions and fall back to stub
        pass


@app.post("/v1/predict")
def predict(features: Features):
    """Return predicted weight and HbA1c change.

    In stub mode returns deterministic values.  When models and
    preprocessor are available, it performs a real prediction.
    """
    if gly_model is None or anth_model is None or preproc is None:
        # Deterministic stub – simple proportional reduction based on adherence and cycles
        base_weight_change = -0.02 * features.weight_kg * min(features.n_cycles, 6) * (features.adherence_pct / 100)
        base_hba1c_change = -0.1 * features.hba1c * min(features.n_cycles, 6) * (features.adherence_pct / 100)
        return {
            "predicted_weight_change": base_weight_change,
            "predicted_hba1c_change": base_hba1c_change,
            "model_version": "stub-ml-0.1",
        }
    # Real prediction path
    # Assemble feature vector according to your training pipeline
    x = np.array([
        [
            features.age_years,
            1 if features.sex.lower().startswith("m") else 0,
            features.weight_kg,
            features.bmi,
            features.hba1c,
            features.meds_diabetes,
            features.n_cycles,
            features.adherence_pct,
        ]
    ], dtype=float)
    try:
        x_proc = preproc.transform(x)
        weight_pred = float(anth_model.predict(x_proc))
        hba1c_pred = float(gly_model.predict(x_proc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Model error: {exc}")
    return {
        "predicted_weight_change": weight_pred,
        "predicted_hba1c_change": hba1c_pred,
        "model_version": "real",
    }