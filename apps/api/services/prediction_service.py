"""
Prediction Service.

Phase P0 state: the old Pune-trained models, the heuristic fallback scorer and all
hardcoded demo assessments were removed (CLAUDE.md hard rules 4 and 5). There is no
risk model until the BRFSS models are trained (P3) and wired in (P4), so
`predict_risk` raises `ModelsUnavailableError` and the router returns HTTP 503.
"""

from typing import Dict, Any, Optional, List
from apps.api.schemas import AssessmentRequest, AssessmentResponse
from .base import IPredictionService


class ModelsUnavailableError(RuntimeError):
    """Raised when an assessment is requested but no trained model is loaded."""


MODELS_UNAVAILABLE_MESSAGE = (
    "Risk models are not available yet. VITALNEX is being rebuilt on real survey data; "
    "the screening will return once the new models are trained and reviewed."
)


def determine_human_review(risk_band: str, data_quality: Dict[str, Any], uncertainty: float) -> tuple:
    """Deterministic human review gate (rules, not the model)."""
    reasons = []

    if risk_band == "High":
        reasons.append("High-risk model output requires clinician confirmation.")
    if data_quality["quality_score"] < 80:
        reasons.append("Data quality below threshold (missing or out-of-range inputs).")
    if uncertainty > 0.15:
        reasons.append("Elevated predictive uncertainty detected.")
    if data_quality["out_of_range_fields"]:
        reasons.append(f"Out-of-range values: {', '.join(data_quality['out_of_range_fields'])}.")

    required = len(reasons) > 0
    decision = "Pending" if required else "Not_Required"

    return required, decision, " ".join(reasons) or "Automated screening within normal parameters."


# In-memory store for assessments (replaced by Supabase in P1/P4). Starts empty.
_assessments_store: Dict[str, AssessmentResponse] = {}


class PredictionService(IPredictionService):
    async def predict_risk(self, request: AssessmentRequest) -> AssessmentResponse:
        raise ModelsUnavailableError(MODELS_UNAVAILABLE_MESSAGE)

    def get_assessment(self, assessment_id: str) -> Optional[AssessmentResponse]:
        return _assessments_store.get(assessment_id)

    def list_assessments(self, user_id: Optional[str] = None) -> List[AssessmentResponse]:
        items = list(_assessments_store.values())
        if user_id:
            items = [a for a in items if a.user_id == user_id]
        return sorted(items, key=lambda x: x.evaluated_at, reverse=True)
