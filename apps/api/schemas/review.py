"""
Clinician Review Pydantic Schemas for VITALNEX Decision Support.
"""

from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime


class PatientReviewUpdate(BaseModel):
    review_status: str = Field(..., pattern="^(pending|in_review|reviewed)$")
    clinician_id: Optional[str] = "doc-pune-001"
    review_notes: Optional[str] = None
    override_risk_band: Optional[str] = Field(None, pattern="^(Low|Moderate|High)$")


class PatientReviewResponse(BaseModel):
    id: str
    assessment_id: str
    patient_id: str
    patient_name: str
    evaluated_at: datetime
    risk_score: float
    risk_band: str
    model_version: str
    human_review_required: bool
    review_status: str = Field("pending", pattern="^(pending|in_review|reviewed)$")
    assigned_clinician_id: Optional[str] = None
    review_notes: Optional[str] = None
    data_quality_score: float = 96.5
    explainability_summary: str
    input_snapshot: Dict[str, Any] = {}
    reviewed_at: Optional[datetime] = None
