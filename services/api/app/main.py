"""Main FastAPI application for L‑Nutra API service."""

from __future__ import annotations

import hashlib
import json
from datetime import datetime
from typing import Dict

from fastapi import Depends, FastAPI, HTTPException, Path

from .config import get_settings
from .models import (
    Features,
    PredictRequest,
    PredictionOutcomes,
    ValidationResult,
)
from .utils import (
    apply_safety_and_risk,
    call_ml_service,
    fetch_playbook_by_slug,
    fetch_playbooks,
    validate_features,
)


app = FastAPI(title="L‑Nutra Unified API", version="1.0.0")


def compute_feature_checksum() -> str:
    """Compute a stable checksum of the feature model to detect changes."""
    # Serialise the schema definition of Features for clients to verify compatibility
    schema = Features.model_json_schema()
    m = hashlib.sha256()
    m.update(json.dumps(schema, sort_keys=True).encode("utf-8"))
    return m.hexdigest()[:8]


@app.get("/health")
async def health(settings=Depends(get_settings)) -> Dict[str, str]:
    """Return basic health information for the service."""
    return {
        "status": "ok",
        "timestamp": datetime.utcnow().isoformat(),
        "feature_checksum": compute_feature_checksum(),
        "dev_stub": str(settings.dev_stub).lower(),
    }


@app.post("/v1/validate", response_model=ValidationResult)
async def post_validate(req: Dict[str, Features]) -> ValidationResult:
    """Validate incoming features and return errors/hints."""
    # Request body must contain a `features` key
    if "features" not in req:
        raise HTTPException(status_code=400, detail="Missing 'features' in request body")
    features_obj = Features.parse_obj(req["features"])
    ok, errors, hints = await validate_features(features_obj)
    return ValidationResult(ok=ok, errors=errors, hints=hints)


@app.post("/v1/predict", response_model=PredictionOutcomes)
async def post_predict(body: PredictRequest) -> PredictionOutcomes:
    """Perform prediction after validating input features."""
    ok, errors, hints = await validate_features(body.features)
    if not ok:
        raise HTTPException(status_code=400, detail={"errors": errors, "hints": hints})
    raw = await call_ml_service(body.features)
    return apply_safety_and_risk(body.features, raw)


@app.get("/v1/playbooks")
async def get_playbooks() -> list:
    """Retrieve all playbooks from Supabase via proxy."""
    return await fetch_playbooks()


@app.get("/v1/playbooks/{slug}")
async def get_playbook(slug: str = Path(..., description="Slug of the playbook")) -> Dict:
    """Retrieve a single playbook by its slug."""
    playbook = await fetch_playbook_by_slug(slug)
    if not playbook:
        raise HTTPException(status_code=404, detail="Playbook not found")
    return playbookfrom fastapi.middleware.cors import CORSMiddleware

# MVP CORS: allow everything (tighten later)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
