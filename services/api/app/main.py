from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os, httpx

app = FastAPI(title="L-Nutra API", version="0.1.0")

# Permissive CORS for MVP (tighten later)
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

# ---------- Routes ----------
@app.get("/health")
async def health():
    return {"status": "ok", "stub": DEV_STUB, "ml_url": ML_URL}

@app.post("/v1/validate")
async def validate(req: PredictRequest):
    return {"ok": True}

@app.post("/v1/predict")
async def predict(req: PredictRequest):
    n = req.features.n_cycles
    if DEV_STUB:
        # Provide BOTH field names so the frontend won't crash
        weight_delta = round(-0.7 * n, 2)
        hba1c_delta  = round(-0.2 * n, 2)
        return {
            "predicted_weight_change": weight_delta,       # legacy/name A
            "predicted_weight_change_kg": weight_delta,    # name B
            "predicted_hba1c_change": hba1c_delta,         # legacy/name A
            "predicted_hba1c_change_pct": hba1c_delta,     # name B
            "safety_badge": "green",
            "source": "stub"
        }

    # Forward to ML service in non-stub mode
    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.post(f"{ML_URL}/v1/predict", json=req.model_dump())
        if r.status_code >= 400:
            raise HTTPException(status_code=r.status_code, detail=r.text)
        data = r.json()

        # Normalize keys on the way back (defensive)
        weight = data.get("predicted_weight_change", data.get("predicted_weight_change_kg"))
        hba1c  = data.get("predicted_hba1c_change", data.get("predicted_hba1c_change_pct"))
        data["predicted_weight_change"] = weight
        data["predicted_weight_change_kg"] = weight
        data["predicted_hba1c_change"] = hba1c
        data["predicted_hba1c_change_pct"] = hba1c
        return data
