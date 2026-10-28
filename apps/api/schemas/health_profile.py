"""
Health profile schemas (docs/SPEC.md §1.2 F3: "trim fields to feature contract").

The health profile holds only answers from the 14-question screening form
(apps/api/schemas/assessment.py AssessmentInputs, docs/SPEC.md §3.3), stored in
health_profiles.answers. Every answer is optional here, and none has a default: a question the
user did not answer is simply absent, never filled in with a "normal" value (CLAUDE.md hard rule 3).
Validation limits are the same as the screening form. Unknown fields are rejected.
"""

from datetime import datetime
from typing import Any, Dict, Optional

from pydantic import BaseModel, ConfigDict, Field

from apps.api.schemas.assessment import Sex


class HealthProfileAnswers(BaseModel):
    """Saved answers. None / absent = not answered."""
    model_config = ConfigDict(extra="forbid")

    age: Optional[int] = Field(None, ge=18, le=120)
    sex: Optional[Sex] = None
    height_cm: Optional[float] = Field(None, ge=120, le=220)
    weight_kg: Optional[float] = Field(None, ge=30, le=250)
    high_bp: Optional[bool] = None
    high_chol: Optional[bool] = None
    smoker: Optional[bool] = None
    phys_activity: Optional[bool] = None
    fruits: Optional[bool] = None
    veggies: Optional[bool] = None
    heavy_alcohol: Optional[bool] = None
    gen_health: Optional[int] = Field(None, ge=1, le=5)
    ment_health_days: Optional[int] = Field(None, ge=0, le=30)
    phys_health_days: Optional[int] = Field(None, ge=0, le=30)
    diff_walk: Optional[bool] = None

    def answered(self) -> Dict[str, Any]:
        """Only the questions the user answered."""
        return self.model_dump(mode="json", exclude_none=True)


class HealthProfileUpdate(BaseModel):
    """PUT body. Replaces the saved answers; the owner is the signed-in user (from the JWT)."""
    model_config = ConfigDict(extra="forbid")

    answers: HealthProfileAnswers


class HealthProfileResponse(BaseModel):
    """`answers` holds only what the user answered; nothing is filled in. `saved` is False when
    the user has never saved a profile (then `answers` is empty)."""
    saved: bool
    answers: Dict[str, Any] = {}
    updated_at: Optional[datetime] = None
