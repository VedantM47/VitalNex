"""
Clinical Risk Assessment Endpoints.

Phase P0: no trained model exists, so assessment and what-if return HTTP 503
(see prediction_service.ModelsUnavailableError). Rebuilt in P4.
"""

from fastapi import APIRouter, HTTPException
from apps.api.schemas import (
    AssessmentRequest,
    AssessmentResponse,
)
from apps.api.services import prediction_service
from apps.api.services.prediction_service import ModelsUnavailableError

router = APIRouter(tags=["Clinical Intelligence & AI Trust"])


@router.post("/assessment", response_model=AssessmentResponse)
async def create_assessment(request: AssessmentRequest):
    try:
        return await prediction_service.predict_risk(request)
    except ModelsUnavailableError as e:
        raise HTTPException(status_code=503, detail=str(e))


@router.get("/assessment/{assessment_id}", response_model=AssessmentResponse)
async def get_assessment(assessment_id: str):
    asm = prediction_service.get_assessment(assessment_id)
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
async def what_if_simulation(request: AssessmentRequest):
    """What-if simulator. Rebuilt in P4 (changeable features only, SPEC §4.6)."""
    try:
        result = await prediction_service.predict_risk(request)
    except ModelsUnavailableError as e:
        raise HTTPException(status_code=503, detail=str(e))
    return {
        "simulation_result": result,
        "disclaimer": "MODEL-BEHAVIOR SIMULATION ONLY. Not a medical advice or guaranteed health outcome prediction.",
        "simulated_inputs": request.clinical_inputs.model_dump(),
    }
