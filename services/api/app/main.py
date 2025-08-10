from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os, httpx

app = FastAPI(title="L-Nutra API", version="0.1.0")

# Permissive CORS for MVP (tighten later to the web domain)
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

class PredictRequest(BaseModel):
    features: Features

# ---------- Config ----------
DEV_STUB = os.getenv("DEV_STUB", "true").lower() == "true"
ML_URL = os.getenv("ML_URL", "http://localhost:9000")

# ---------- Health / root ----------
@app.get("/")
async def root():
    return {"service": "api", "ok": True}

@app.get("/health")
async def health():
    return {"status": "ok", "stub": DEV_STUB, "ml_url": ML_URL}

# ---------- Validation (alias both /validate and /v1/validate) ----------
@app.post("/v1/validate")
@app.post("/validate")
async def validate(req: PredictRequest):
    return {"ok": True}

# ---------- Prediction (aliases + normalized keys) ----------
def _normalize_model_response(data: dict) -> dict:
    weight = data.get("predicted_weight_change", data.get("predicted_weight_change_kg"))
    hba1c  = data.get("predicted_hba1c_change", data.get("predicted_hba1c_change_pct"))
    badge  = data.get("safety_badge", data.get("safetyBadge", "green"))
    # mirror keys both ways so the UI can't crash on naming
    return {
        "predicted_weight_change": weight,
        "predicted_weight_change_kg": weight,
        "predicted_hba1c_change": hba1c,
        "predicted_hba1c_change_pct": hba1c,
        "safety_badge": badge,
        "safetyBadge": badge,
        **{k:v for k,v in data.items() if k not in {
            "predicted_weight_change","predicted_weight_change_kg",
            "predicted_hba1c_change","predicted_hba1c_change_pct",
            "safety_badge","safetyBadge"
        }}
    }

@app.post("/v1/predict")
@app.post("/predict")
async def predict(req: PredictRequest):
    n = req.features.n_cycles
    if DEV_STUB:
        weight_delta = round(-0.7 * n, 2)
        hba1c_delta  = round(-0.2 * n, 2)
        return _normalize_model_response({
            "predicted_weight_change_kg": weight_delta,
            "predicted_hba1c_change_pct": hba1c_delta,
            "safety_badge": "green",
            "source": "stub",
            "confidence": 0.7
        })

    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.post(f"{ML_URL}/v1/predict", json=req.model_dump())
        if r.status_code >= 400:
            raise HTTPException(status_code=r.status_code, detail=r.text)
        return _normalize_model_response(r.json())

# ---------- Playbooks stubs so the UI doesn't 404 ----------
@app.get("/v1/playbooks")
async def list_playbooks():
    # empty list when Supabase not configured
    return []

@app.get("/v1/playbooks/{playbook_id}")
async def get_playbook(playbook_id: str):
    # 404-friendly empty stub
    return {"id": playbook_id, "title": "Unavailable", "steps": []}
