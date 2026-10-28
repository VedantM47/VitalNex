"""
Clinician review queue schemas (docs/SPEC.md §1.3, §2.1) and the P6 Agree / Override action.
"""

from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, model_validator


class ReviewQueueItem(BaseModel):
    id: str
    assessment_id: str
    patient_id: str
    patient_name: Optional[str] = None
    reasons: List[str]  # high_band | abstained | data_quality | emergency
    status: str  # pending | agreed | overridden
    assigned_to: Optional[str] = None
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    clinician_note: Optional[str] = None
    created_at: datetime


# ── Agree / Override (PROMPTS P6 step 3) ──

Disease = Literal["diabetes", "heart", "stroke"]
ClinicianBand = Literal["Low", "Moderate", "High"]
# Same list as the CHECK constraint on clinician_overrides.reason_code.
ReasonCode = Literal[
    "clinical_history_not_captured",
    "symptoms_present",
    "input_likely_wrong",
    "model_overestimates",
    "model_underestimates",
    "other",
]
REASON_CODES = ReasonCode.__args__


class OverrideItem(BaseModel):
    model_config = ConfigDict(extra="forbid")

    disease: Disease
    clinician_band: ClinicianBand
    reason_code: ReasonCode  # required: an override without a reason is rejected (422)
    note: Optional[str] = Field(None, max_length=1000)

    @model_validator(mode="after")
    def other_needs_note(self):
        if self.reason_code == "other" and not (self.note or "").strip():
            raise ValueError("reason_code 'other' needs a free-text note")
        return self


class ReviewDecision(BaseModel):
    """Agree with the model, or override one or more diseases, each with a band and a reason."""
    model_config = ConfigDict(extra="forbid")

    decision: Literal["agree", "override"]
    note: Optional[str] = Field(None, max_length=2000, description="Clinician note shown to the patient")
    overrides: List[OverrideItem] = Field(default_factory=list)

    @model_validator(mode="after")
    def consistent(self):
        if self.decision == "agree" and self.overrides:
            raise ValueError("'agree' cannot carry overrides")
        if self.decision == "override":
            if not self.overrides:
                raise ValueError("'override' needs at least one disease with a new band and a reason")
            diseases = [o.disease for o in self.overrides]
            if len(set(diseases)) != len(diseases):
                raise ValueError("each disease can be overridden once per review")
        return self
