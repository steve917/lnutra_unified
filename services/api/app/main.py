from fastapi import FastAPI, HTTPException, Request, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import os, httpx

from app.db import SessionLocal, init_db
from app.models import Prediction

app = FastAPI(title="L-Nutra API", version="0.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://lnutra-unified.onrender.com","http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

DEV_STUB = os.getenv("DEV_STUB", "true").lower() == "true"
ML_URL = os.getenv("ML_URL", "http://localhost:9000")

@app.on_event("startup")
async def _startup():
    await init_db()

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

def _to_features(req: PredictFlexible) -> Features:
    if req.features:
        return req.features
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

@app.post("/v1/predict")
@app.post("/predict")
async def predict(req: PredictFlexible, request: Request):
    f = _to_features(req)
    n = f.n_cycles
    if DEV_STUB:
        weight_delta = round(-0.7 * n, 2)
        hba1c_delta  = round(-0.2 * n, 2)
        result = _superset(weight_delta, hba1c_delta, "green", source="stub", confidence=0.7)
    else:
        async with httpx.AsyncClient(timeout=30) as client:
            r = await client.post(f"{ML_URL}/v1/predict", json={"features": f.model_dump()})
            if r.status_code >= 400:
                raise HTTPException(status_code=r.status_code, detail=r.text)
            data = r.json()
        w = data.get("weight") or data.get("predicted_weight_change") or data.get("predicted_weight_change_kg")
        h = data.get("hba1c") or data.get("predicted_hba1c_change") or data.get("predicted_hba1c_change_pct")
        badge = data.get("safetyBadge") or data.get("safety_badge") or "green"
        result = _superset(w, h, badge, **{k:v for k,v in data.items() if k not in ("weight","hba1c")})

    # Save to DB
    client_ip = request.headers.get("x-forwarded-for") or request.client.host
    ua = request.headers.get("user-agent")
    from sqlalchemy import insert
    async with SessionLocal() as session:
        await session.execute(insert(Prediction).values(
            client_ip=client_ip, user_agent=ua,
            features=f.model_dump(), result=result,
            weight_delta_kg=result.get("weight"),
            hba1c_delta_pct=result.get("hba1c"),
            safety_badge=result.get("safety_badge") or result.get("safetyBadge")
        ))
        await session.commit()
    return result

@app.get("/v1/predictions")
async def list_predictions(limit: int = Query(50, ge=1, le=500)):
    from sqlalchemy import select, desc
    async with SessionLocal() as session:
        rows = (await session.execute(
            select(Prediction).order_by(desc(Prediction.created_at)).limit(limit)
        )).scalars().all()
    return [
      {
        "id": r.id,
        "created_at": r.created_at.isoformat() if r.created_at else None,
        "client_ip": r.client_ip,
        "safety_badge": r.safety_badge,
        "weight": r.weight_delta_kg,
        "hba1c": r.hba1c_delta_pct,
        "features": r.features,
      } for r in rows
    ]

@app.get("/v1/playbooks")
async def list_playbooks():
    return []

@app.get("/v1/playbooks/{playbook_id}")
async def get_playbook(playbook_id: str):
    return {"id": playbook_id, "title": "Unavailable", "steps": []}
