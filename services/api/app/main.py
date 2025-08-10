from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os, httpx

app = FastAPI(title="L-Nutra API", version="0.1.1")

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

# ---------- Validation (aliases) ----------
@app.post("/v1/validate")
@app.post("/validate")
async def validate(req: PredictRequest):
    return {"ok": True}

# ---------- Helpers ----------
def _normalize_keys(data: dict) -> dict:
    # Pull any available names
    weight = data.get("weight")
    if weight is None:
        weight = data.get("predicted_weight_change")
    if weight is None:
        weight = data.get("predicted_weight_change_kg")

    hba1c = data.get("hba1c")
    if hba1c is None:
        hba1c = data.get("predicted_hba1c_change")
    if hba1c is None:
        hba1c = data.get("predicted_hba1c_change_pct")

    badge = data.get("safetyBadge", data.get("safety_badge", "green"))

    # Return a superset so the UI can use any naming it expects
    superset = {
        "weight": weight,
        "hba1c": hba1c,
        "safetyBadge": badge,
        "safety_badge": badge,
        "predicted_weight_change": weight,
        "predicted_weight_change_kg": weight,
        "predicted_hba1c_change": hba1c,
        "predicted_hba1c_change_pct": hba1c,
    }
    # Keep all original fields too
    for k, v in data.items():
        if k not in superset:
            superset[k] = v
    # Also provide a nested object some UIs expect
    superset["recommendation"] = {"weight": weight, "hba1c": hba1c, "badge": badge}
    return superset

# ---------- Prediction (aliases + normalization) ----------
@app.post("/v1/predict")
@app.post("/predict")
async def predict(req: PredictRequest):
    n = req.features.n_cycles
    if DEV_STUB:
        base = {
            "predicted_weight_change_kg": round(-0.7 * n, 2),
            "predicted_hba1c_change_pct": round(-0.2 * n, 2),
            "safety_badge": "green",
            "source": "stub",
            "confidence": 0.7
        }
        return _normalize_keys(base)

    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.post(f"{ML_URL}/v1/predict", json=req.model_dump())
        if r.status_code >= 400:
            raise HTTPException(status_code=r.status_code, detail=r.text)
        return _normalize_keys(r.json())

# ---------- Playbooks stubs ----------
@app.get("/v1/playbooks")
async def list_playbooks():
    return []

@app.get("/v1/playbooks/{playbook_id}")
async def get_playbook(playbook_id: str):
    return {"id": playbook_id, "title": "Unavailable", "steps": []}
