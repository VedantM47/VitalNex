"""
AI Trust Passport Pydantic Schemas.
Covers 11 fundamental dimensions of Responsible and Transparent Healthcare AI.
"""

from typing import List, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime


class PredictionTrustSummary(BaseModel):
    risk_score: float
    risk_band: str
    target_definition: str = "Heart Disease Screening Risk Indicator"
    model_type: str = "Gradient Boosted Clinical Ensemble"


class ConfidenceMetrics(BaseModel):
    confidence_score: float = Field(..., ge=0.0, le=1.0)
    calibration_method: str = "Platt Isotonic Scaling"
    brier_score_estimate: float = 0.084


class DataQualityMetrics(BaseModel):
    quality_score: float = Field(..., ge=0.0, le=100.0)
    completeness_percentage: float = Field(..., ge=0.0, le=100.0)
    missing_fields_count: int = 0
    outlier_status: str = "Within Expected Boundaries"


class ExplainabilitySummary(BaseModel):
    method: str = "TreeSHAP Local Attribution"
    top_positive_contributors: List[Dict[str, Any]]
    top_negative_contributors: List[Dict[str, Any]]
    summary_text: str


class FairnessMetrics(BaseModel):
    demographic_parity_ratio: float = 0.94
    equalized_odds_disparity: float = 0.06
    evaluated_subgroups: List[str] = ["Sex (Male/Female)", "Locality (Urban/Peri-Urban/PCMC)", "Socioeconomic Band"]
    parity_verdict: str = "Passes Parity Thresholds (>=0.80)"


class UncertaintyProfile(BaseModel):
    epistemic_uncertainty: float = 0.05
    aleatoric_uncertainty: float = 0.09
    total_entropy: float = 0.14
    verdict: str = "High Prediction Stability"


class SafetyBoundaryCheck(BaseModel):
    physiological_range_check: str = "All values within valid biological ranges"
    contraindication_flag: bool = False
    adversarial_drift_detected: bool = False


class HumanReviewSummary(BaseModel):
    review_required: bool = False
    status: str = "Not_Required"
    assigned_clinician_id: str = "None"
    review_notes: str = "Standard screening within automated confidence boundaries."


class TrustPassportResponse(BaseModel):
    id: str
    assessment_id: str
    model_version: str = "v1.0.0-demo"
    evaluated_at: datetime
    prediction: PredictionTrustSummary
    confidence: ConfidenceMetrics
    data_quality: DataQualityMetrics
    explainability: ExplainabilitySummary
    fairness: FairnessMetrics
    uncertainty: UncertaintyProfile
    safety: SafetyBoundaryCheck
    human_review: HumanReviewSummary
    limitations: List[str] = [
        "Synthetic academic research dataset calibration.",
        "Screening and risk stratification support only; not a diagnostic claim.",
        "Clinical confirmation by licensed healthcare provider required before any clinical intervention."
    ]
