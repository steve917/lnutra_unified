from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import os, httpx

app = FastAPI(title="L-Nutra API", version="0.1.3")

# CORS (MVP)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- Models ----------
class Features(BaseModel):
    age_years: int
    sex: str
    weight_kg: float
    bmi: float
    hba1c: float
    meds_diabetes: int
    fmd_regimen_type: str
    n_cycles: int
    adherence_pct: int

# accepts either {features:{...}} OR raw top-level fields
class PredictFlexible(BaseModel):
    features: Optional[Features] = None
    age_years: Optional[int] = None
    sex: Optional[str] = None
    weight_kg: Optional[float] = None
    bmi: Optional[float] = None
    hba1c: Optional[float] = None
    meds_diabetes: Optional[int] = None
    fmd_regimen_type: Optional[str] = None
    n_cycles: Optional[int] = None
    adherence_pct: Optional[int] = None

# ---------- Config ----------
DEV_STUB = os.getenv("DEV_STUB", "true").lower() == "true"
ML_URL = os.getenv("ML_URL", "http://localhost:9000")

# ---------- Basic routes ----------
@app.get("/")
async def root():
    return {"service": "api", "ok": True}

@app.get("/health")
async def health():
    return {"status": "ok", "stub": DEV_STUB, "ml_url": ML_URL}

@app.post("/v1/validate")
@app.post("/validate")
async def validate(_: PredictFlexible):
    return {"ok": True}

# ---------- Helpers ----------
def _superset(weight: float, hba1c: float, badge: str = "green", **extra):
    base = {
        "weight": weight,
        "hba1c": hba1c,
        "safetyBadge": badge,
        "safety_badge": badge,
        "predicted_weight_change": weight,
        "predicted_weight_change_kg": weight,
        "predicted_hba1c_change": hba1c,
        "predicted_hba1c_change_pct": hba1c,
    }
    base.update(extra or {})
    rec = {"weight": weight, "hba1c": hba1c, "badge": badge}
    base["recommendation"] = rec
    base["result"] = {"recommendation": rec}
    base["data"] = {"recommendation": rec}
    return base

def _normalize_model_response(d: dict):
    w = d.get("weight") or d.get("predicted_weight_change") or d.get("predicted_weight_change_kg")
    h = d.get("hba1c") or d.get("predicted_hba1c_change") or d.get("predicted_hba1c_change_pct")
    b = d.get("safetyBadge") or d.get("safety_badge") or "green"
    passthrough = {k:v for k,v in d.items() if k not in {
      "weight","hba1c","predicted_weight_change","predicted_weight_change_kg",
      "predicted_hba1c_change","predicted_hba1c_change_pct","safetyBadge","safety_badge"
    }}
    return _superset(w, h, b, **passthrough)

def _to_features(req: PredictFlexible) -> Features:
    if req.features:
        return req.features
    # fallback: build from top-level fields (defaulting safely)
    return Features(
        age_years = int(req.age_years or 0),
        sex = (req.sex or "M"),
        weight_kg = float(req.weight_kg or 0),
        bmi = float(req.bmi or 0),
        hba1c = float(req.hba1c or 0),
        meds_diabetes = int(req.meds_diabetes or 0),
        fmd_regimen_type = (req.fmd_regimen_type or "standard_fmd"),
        n_cycles = int(req.n_cycles or 0),
        adherence_pct = int(req.adherence_pct or 0),
    )

# ---------- Predict ----------
@app.post("/v1/predict")
@app.post("/predict")
async def predict(req: PredictFlexible):
    f = _to_features(req)
    n = f.n_cycles

    if DEV_STUB:
        weight_delta = round(-0.7 * n, 2)
        hba1c_delta  = round(-0.2 * n, 2)
        return _superset(weight_delta, hba1c_delta, "green", source="stub", confidence=0.7)

    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.post(f"{ML_URL}/v1/predict", json={"features": f.model_dump()})
        if r.status_code >= 400:
            raise HTTPException(status_code=r.status_code, detail=r.text)
        return _normalize_model_response(r.json())

# ---------- Playbooks stubs ----------
@app.get("/v1/playbooks")
async def list_playbooks():
    return []

@app.get("/v1/playbooks/{playbook_id}")
async def get_playbook(playbook_id: str):
    return {"id": playbook_id, "title": "Unavailable", "steps": []}
