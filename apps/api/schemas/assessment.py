"""
Risk Assessment Pydantic Schemas.
"""

from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field
from datetime import datetime
from .health_profile import ClinicalModelFeatures


class AssessmentRequest(BaseModel):
    user_id: str
    clinical_inputs: ClinicalModelFeatures
    model_version_id: Optional[str] = None
    assessment_mode: str = Field("demo", pattern="^(demo|clinical_screening|research)$")


class AssessmentResponse(BaseModel):
    id: str
    user_id: str
    assessment_mode: str
    risk_score: float = Field(..., ge=0.0, le=100.0, description="Risk index estimate (0-100)")
    risk_band: str = Field(..., pattern="^(Low|Moderate|High)$")
    confidence_interval: List[float] = Field(..., min_length=2, max_length=2)
    calibration_status: str = "Calibrated"
    human_review_required: bool = False
    human_review_status: str = Field("Not_Required", pattern="^(Not_Required|Pending|Approved|Modified|Rejected)$")
    model_version: str = "v1.0.0-demo"
    disclaimer: str = (
        "VITALNEX is a research and decision-support prototype. "
        "It does not diagnose disease, prescribe treatment, or replace a qualified healthcare professional."
    )
    evaluated_at: datetime
    input_snapshot: Dict[str, Any]
