"""
Assessment schemas: the 14-feature form (docs/SPEC.md §3.3, ml/training/features.py).

Every medical input is required and has no default (CLAUDE.md hard rule 3). Unknown fields are
rejected. Only the symptom tick-boxes default to unticked; they feed the emergency rule, not a model.
"""

from datetime import datetime
from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field

Sex = Literal["female", "male", "prefer_not_to_say"]
Language = Literal["en", "hi", "mr"]


class AssessmentInputs(BaseModel):
    model_config = ConfigDict(extra="forbid")

    age: int = Field(..., ge=18, le=120, description="Years. Under 18 is blocked.")
    sex: Sex
    height_cm: float = Field(..., ge=120, le=220)
    weight_kg: float = Field(..., ge=30, le=250)
    high_bp: bool
    high_chol: bool
    smoker: bool = Field(..., description="Smoked at least 100 cigarettes in your life")
    phys_activity: bool
    fruits: bool
    veggies: bool
    heavy_alcohol: bool
    gen_health: int = Field(..., ge=1, le=5, description="1 excellent … 5 poor")
    ment_health_days: int = Field(..., ge=0, le=30)
    phys_health_days: int = Field(..., ge=0, le=30)
    diff_walk: bool


class Symptoms(BaseModel):
    model_config = ConfigDict(extra="forbid")

    chest_pain: bool = False
    stroke_signs: bool = False
    severe_breathlessness: bool = False
    fainting: bool = False


class AssessmentRequest(AssessmentInputs):
    symptoms: Symptoms = Field(default_factory=Symptoms)
    free_text: Optional[str] = Field(None, max_length=500, description="Checked for red flags, never stored")
    language: Language = "en"


CHANGEABLE_FIELDS = (
    "weight_kg", "smoker", "phys_activity", "fruits", "veggies", "heavy_alcohol",
    "gen_health", "ment_health_days", "phys_health_days",
)


class WhatIfRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    base: AssessmentInputs
    changes: Dict[str, Any] = Field(..., description=f"Only: {', '.join(CHANGEABLE_FIELDS)}")
    language: Language = "en"


class RecourseRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    base: AssessmentInputs
    language: Language = "en"


class AssessmentRecord(BaseModel):
    """A stored assessment (risk_assessments row, docs/SPEC.md §2.1)."""
    id: str
    user_id: str
    assessment_mode: str  # live | demo
    inputs: Dict[str, Any]
    results: Dict[str, Any]
    next_step: str
    emergency_flag: bool
    review_status: str
    model_versions: Dict[str, Any]
    created_at: datetime


class AssessmentResponse(BaseModel):
    """Shaped by role: patients never receive probabilities or conformal sets (D-10)."""
    id: Optional[str] = None
    stored: bool
    queued_for_review: bool
    next_step: str
    emergency: bool
    data_quality: Dict[str, Any]
    bmi: Optional[float] = None
    results: Dict[str, Any]
    shared_factors: List[Dict[str, Any]] = []
    notes: List[str] = []
    guidance: List[Dict[str, Any]] = []
    model_versions: Dict[str, Any] = {}
    disclaimer: str
