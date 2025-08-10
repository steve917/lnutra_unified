"""Configuration and environment variables for the API service."""

import os
from functools import lru_cache
from typing import Optional


class Settings:
    """Application settings loaded from environment variables.

    Environment variables:

    * `DEV_STUB` – if set to a truthy value, the API will use deterministic stub predictions.
    * `ML_URL` – the base URL of the ML microservice (defaults to `http://localhost:9000`).
    * `MAX_WL_CYCLE_KG` – maximum weight loss per cycle before raising a high‑risk badge (kg).
    * `MIN_PROJECTED_BMI` – minimum projected BMI allowed before flagging amber/red risk.
    * `HBA1C_DROP_PER_CYCLE_HIGH` – high‑risk threshold for HbA1c drop per cycle.
    * `HBA1C_DROP_PER_CYCLE_AMBER` – amber‑risk threshold for HbA1c drop per cycle.
    * `SUPABASE_URL` – base URL of your Supabase project (e.g. `https://yyelpvvnagpdlqbtkvub.supabase.co/rest/v1`).
    * `SUPABASE_API_KEY` – API key or anon key with read permissions.
    """

    def __init__(self) -> None:
        # Stubbing mode: if true, predictions do not call the ML service.
        self.dev_stub: bool = os.getenv("DEV_STUB", "false").lower() in {"1", "true", "yes"}
        # ML microservice URL
        self.ml_url: str = os.getenv("ML_URL", "http://localhost:9000")
        # Safety thresholds
        self.max_wl_cycle_kg: float = float(os.getenv("MAX_WL_CYCLE_KG", "3.0"))
        self.min_projected_bmi: float = float(os.getenv("MIN_PROJECTED_BMI", "18.5"))
        self.hba1c_drop_high: float = float(os.getenv("HBA1C_DROP_PER_CYCLE_HIGH", "1.5"))
        self.hba1c_drop_amber: float = float(os.getenv("HBA1C_DROP_PER_CYCLE_AMBER", "1.0"))
        # Supabase configuration
        self.supabase_url: Optional[str] = os.getenv("SUPABASE_URL")
        self.supabase_api_key: Optional[str] = os.getenv("SUPABASE_API_KEY")


@lru_cache
def get_settings() -> Settings:
    """Return a cached Settings instance."""
    return Settings()