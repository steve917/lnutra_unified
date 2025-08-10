"""Pydantic models used across the API.

These models mirror the feature and response shapes defined in the
Frontend Integration Guide.  They are intentionally simple to start
and can be extended as you harden the product.
"""

from enum import Enum
from typing import Literal, Optional
from pydantic import BaseModel, Field, validator


class Sex(str, Enum):
    male = "M"
    female = "F"
    other = "Other"


class Regimen(str, Enum):
    standard_fmd = "standard_fmd"
    modified_fmd = "modified_fmd"
    maintenance = "maintenance"


class Features(BaseModel):
    age_years: int = Field(..., ge=0, description="Age in years")
    sex: Sex
    weight_kg: float = Field(..., gt=0, description="Current weight in kilograms")
    bmi: float = Field(..., gt=0, description="Body mass index")
    hba1c: float = Field(..., gt=0, description="HbA1c percentage")
    meds_diabetes: Literal[0, 1]
    fmd_regimen_type: Regimen
    n_cycles: int = Field(..., ge=1, description="Number of planned FMD cycles")
    adherence_pct: float = Field(..., ge=0, le=100, description="Expected adherence percentage")

    @validator("age_years")
    def age_bounds(cls, v: int) -> int:
        if not (18 <= v <= 90):
            raise ValueError("Age must be between 18 and 90")
        return v

    @validator("bmi")
    def bmi_bounds(cls, v: float) -> float:
        if not (10.0 <= v <= 60.0):
            raise ValueError("BMI must be between 10 and 60")
        return v

    @validator("hba1c")
    def hba1c_bounds(cls, v: float) -> float:
        if not (3.0 <= v <= 15.0):
            raise ValueError("HbA1c must be between 3.0 and 15.0")
        return v

    @validator("n_cycles")
    def cycles_bounds(cls, v: int) -> int:
        if v > 12:
            raise ValueError("Cannot plan more than 12 cycles at once")
        return v


class PredictRequest(BaseModel):
    user_id: Optional[str] = None
    session_id: Optional[str] = None
    features: Features


class PredictionConfidence(BaseModel):
    weight: float
    hba1c: float


class PerCycleChange(BaseModel):
    weight: float
    hba1c: float


class PredictionOutcomes(BaseModel):
    predicted_weight_change: float
    predicted_bmi_change: Optional[float]
    predicted_hba1c_change: float
    per_cycle: PerCycleChange
    confidence: PredictionConfidence
    risk_category: Literal["low", "moderate", "high"]
    safety_badge: Literal["green", "amber", "red"]
    rationale: dict
    model_meta: dict


class ValidationResult(BaseModel):
    ok: bool
    errors: list[str] = []
    hints: list[str] = []