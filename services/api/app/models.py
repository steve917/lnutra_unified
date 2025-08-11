from sqlalchemy import Column, Integer, String, Float, DateTime, JSON, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column
from typing import Optional
from .db import Base

class Prediction(Base):
    __tablename__ = 'predictions'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    created_at: Mapped[str] = mapped_column(DateTime(timezone=True), server_default=func.now())
    client_ip: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    user_agent: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)

    # Inputs / outputs (duplicates key numbers for easy querying)
    features: Mapped[dict] = mapped_column(JSONB, nullable=False)
    result: Mapped[dict] = mapped_column(JSONB, nullable=False)

    weight_delta_kg: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    hba1c_delta_pct: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    safety_badge: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
