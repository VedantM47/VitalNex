"""
Prediction Service.

There is no risk model until the BRFSS models are trained (P3) and wired in (P4), so
`predict_risk` raises `ModelsUnavailableError` and the router returns HTTP 503.
Stored assessments are read from Supabase with the caller's RLS-scoped client, so a
patient only ever sees their own and a clinician only consented patients'.
"""

from typing import List, Optional

from postgrest import AsyncPostgrestClient

from apps.api.schemas import AssessmentRecord, AssessmentRequest, AssessmentResponse


class ModelsUnavailableError(RuntimeError):
    """Raised when an assessment is requested but no trained model is loaded."""


MODELS_UNAVAILABLE_MESSAGE = (
    "Risk models are not available yet. VITALNEX is being rebuilt on real survey data; "
    "the screening will return once the new models are trained and reviewed."
)


class PredictionService:
    async def predict_risk(self, request: AssessmentRequest) -> AssessmentResponse:
        raise ModelsUnavailableError(MODELS_UNAVAILABLE_MESSAGE)

    async def get_assessment(self, db: AsyncPostgrestClient, assessment_id: str) -> Optional[AssessmentRecord]:
        rows = (await db.table("risk_assessments").select("*").eq("id", assessment_id).execute()).data
        return AssessmentRecord(**rows[0]) if rows else None

    async def list_assessments(self, db: AsyncPostgrestClient, user_id: str) -> List[AssessmentRecord]:
        rows = (
            await db.table("risk_assessments")
            .select("*")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .execute()
        ).data
        return [AssessmentRecord(**r) for r in rows]
