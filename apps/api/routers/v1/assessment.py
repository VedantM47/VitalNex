"""
Screening endpoints: assessment, what-if, recourse, history (docs/SPEC.md §1.3, §1.4, §4.6).

Patients receive bands and text only; clinicians reading a stored assessment get probabilities,
conformal sets and SHAP values (D-10).
"""

from fastapi import APIRouter, Depends, HTTPException
from fastapi.concurrency import run_in_threadpool
from postgrest import AsyncPostgrestClient
from pydantic import ValidationError

from apps.api.core.auth import CurrentUser, get_user_db, require_role
from apps.api.schemas import AssessmentRequest, AssessmentResponse, RecourseRequest, WhatIfRequest
from apps.api.services import prediction_service, screening
from apps.api.services.prediction_service import ConsentRequiredError, shape_record

router = APIRouter(tags=["Clinical Intelligence & AI Trust"])


@router.post("/assessment", response_model=AssessmentResponse)
async def create_assessment(request: AssessmentRequest, user: CurrentUser = Depends(require_role("patient"))):
    try:
        return await prediction_service.run(user.id, request)
    except ConsentRequiredError as e:
        raise HTTPException(status_code=403, detail=str(e))


@router.post("/what-if")
async def what_if_simulation(request: WhatIfRequest, user: CurrentUser = Depends(require_role("patient", "doctor"))):
    """Re-run the models with changed answers (changeable answers only). Nothing is stored."""
    try:
        out = await run_in_threadpool(screening.what_if, request.base, request.changes, request.language)
    except screening.NotChangeableError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except ValidationError as e:
        raise HTTPException(status_code=422, detail=e.errors(include_url=False, include_context=False))
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    out["before"] = screening.shape_results(out["before"], user.role)
    out["after"] = screening.shape_results(out["after"], user.role)
    return out


@router.post("/recourse")
async def recourse(request: RecourseRequest, user: CurrentUser = Depends(require_role("patient", "doctor"))):
    """Smallest realistic single or paired change that lowers a band. Nothing is stored."""
    return await run_in_threadpool(screening.recourse, request.base, request.language)


@router.get("/assessment/history")
async def get_assessment_history(
    user: CurrentUser = Depends(require_role("patient")), db: AsyncPostgrestClient = Depends(get_user_db)
):
    """The signed-in patient's assessments, newest first."""
    assessments = await prediction_service.list_assessments(db, user.id)
    return {
        "user_id": user.id,
        "total_assessments": len(assessments),
        "assessments": [shape_record(a, user.role) for a in assessments],
    }


@router.get("/assessment/{assessment_id}")
async def get_assessment(
    assessment_id: str,
    user: CurrentUser = Depends(require_role("patient", "doctor")),
    db: AsyncPostgrestClient = Depends(get_user_db),
):
    # RLS: own assessment, or a consented patient's for a clinician. Anything else is 404.
    asm = await prediction_service.get_assessment(db, assessment_id)
    if asm:
        return shape_record(asm, user.role)
    raise HTTPException(status_code=404, detail=f"Assessment {assessment_id} not found")


@router.get("/trust-passport/{assessment_id}")
async def get_trust_passport(assessment_id: str):
    # TODO(P7): Trust Passport generated from ml/artifacts/<disease>/model_meta.json.
    raise HTTPException(
        status_code=503,
        detail="The Trust Passport is not available yet. It will be generated from real model cards.",
    )
