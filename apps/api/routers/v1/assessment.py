"""
Clinical Risk Assessment Endpoints.

No trained model exists yet, so assessment and what-if return HTTP 503
(see prediction_service.ModelsUnavailableError). Rebuilt in P4.
"""

from fastapi import APIRouter, Depends, HTTPException
from postgrest import AsyncPostgrestClient

from apps.api.core.auth import CurrentUser, get_user_db, require_role
from apps.api.schemas import AssessmentRecord, AssessmentRequest, AssessmentResponse
from apps.api.services import prediction_service
from apps.api.services.prediction_service import ModelsUnavailableError

router = APIRouter(tags=["Clinical Intelligence & AI Trust"])


@router.post("/assessment", response_model=AssessmentResponse)
async def create_assessment(request: AssessmentRequest, user: CurrentUser = Depends(require_role("patient"))):
    try:
        return await prediction_service.predict_risk(request)
    except ModelsUnavailableError as e:
        raise HTTPException(status_code=503, detail=str(e))


@router.get("/assessment/history")
async def get_assessment_history(
    user: CurrentUser = Depends(require_role("patient")), db: AsyncPostgrestClient = Depends(get_user_db)
):
    """The signed-in patient's assessments, newest first."""
    assessments = await prediction_service.list_assessments(db, user.id)
    return {
        "user_id": user.id,
        "total_assessments": len(assessments),
        "assessments": [a.model_dump(mode="json") for a in assessments],
    }


@router.get("/assessment/{assessment_id}", response_model=AssessmentRecord)
async def get_assessment(
    assessment_id: str,
    user: CurrentUser = Depends(require_role("patient", "doctor")),
    db: AsyncPostgrestClient = Depends(get_user_db),
):
    # RLS: own assessment, or a consented patient's for a clinician. Anything else is 404.
    asm = await prediction_service.get_assessment(db, assessment_id)
    if asm:
        return asm
    raise HTTPException(status_code=404, detail=f"Assessment {assessment_id} not found")


@router.get("/trust-passport/{assessment_id}")
async def get_trust_passport(assessment_id: str):
    # TODO(P7): Trust Passport generated from ml/artifacts/<disease>/model_meta.json.
    raise HTTPException(
        status_code=503,
        detail="The Trust Passport is not available yet. It will be generated from real model cards.",
    )


@router.post("/what-if")
async def what_if_simulation(request: AssessmentRequest, user: CurrentUser = Depends(require_role("patient"))):
    """What-if simulator. Rebuilt in P4 (changeable features only, SPEC §4.6)."""
    try:
        await prediction_service.predict_risk(request)
    except ModelsUnavailableError as e:
        raise HTTPException(status_code=503, detail=str(e))
    raise HTTPException(status_code=503, detail="What-if is rebuilt in P4.")
