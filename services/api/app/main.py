import os
import secrets
from typing import List, Literal

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from pydantic import BaseModel

app = FastAPI(title="L-Nutra API", version="1.0.0")

# CORS so the web app can call us from the Render domain
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # you can lock this down later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------- Basic Auth (must match your frontend .env VITE_API_BASIC) -------
security = HTTPBasic()
OPS_USER = os.getenv("OPS_USER", "steve917")
OPS_PASS = os.getenv("OPS_PASS", "193!RuyeFu")


def require_basic(credentials: HTTPBasicCredentials = Depends(security)) -> None:
    ok_user = secrets.compare_digest(credentials.username, OPS_USER)
    ok_pass = secrets.compare_digest(credentials.password, OPS_PASS)
    if not (ok_user and ok_pass):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Basic"},
        )


# ------------------------ Feature columns ------------------------
FEATURES: List[str] = [
    "adherence_pct",
    "age_years",
    "bmi",
    "fmd_regimen_type",
    "hba1c",
    "meds_diabetes",
    "n_cycles",
    "sex",
    "weight_kg",
]


@app.get("/v1/features", response_model=List[str], dependencies=[Depends(require_basic)])
def get_features() -> List[str]:
    return FEATURES


# ------------------------ Predict endpoint ------------------------
class PredictIn(BaseModel):
    adherence_pct: float
    age_years: int
    bmi: float
    fmd_regimen_type: Literal["standard_fmd", "intense_fmd", "mini_fmd", "other"] = "standard_fmd"
    hba1c: float
    meds_diabetes: int
    n_cycles: int
    sex: Literal["M", "F"]
    weight_kg: float


class PredictOut(BaseModel):
    badge: Literal["green", "yellow", "red"]
    delta_weight_kg: float
    delta_hba1c_pct: float
    features: PredictIn


@app.post("/v1/predict", response_model=PredictOut, dependencies=[Depends(require_basic)])
def predict(payload: PredictIn) -> PredictOut:
    # Simple placeholder logic (replace with real model later)
    adherence = max(0.0, min(1.0, payload.adherence_pct / 100.0))
    dw = -0.05 * payload.n_cycles * adherence * (payload.bmi / 22.0)
    dh = -0.02 * payload.n_cycles * adherence

    badge = "green" if dw <= -1.0 else ("yellow" if dw < 0 else "red")

    return PredictOut(
        badge=badge,
        delta_weight_kg=round(dw, 1),
        delta_hba1c_pct=round(dh, 1),
        features=payload,
    )


# ------------------------ (Optional) Health check ------------------------
@app.get("/healthz")
def healthz():
    return {"ok": True}
