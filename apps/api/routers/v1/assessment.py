"""
Clinical Risk Assessment and Trust Passport Endpoints.
"""

from fastapi import APIRouter, HTTPException
from apps.api.schemas import (
    AssessmentRequest,
    AssessmentResponse,
    TrustPassportResponse,
)
from apps.api.services import prediction_service, trust_passport_service

router = APIRouter(tags=["Clinical Intelligence & AI Trust"])


@router.post("/assessment", response_model=AssessmentResponse)
async def create_assessment(request: AssessmentRequest):
    return await prediction_service.predict_risk(request)


@router.get("/assessment/{assessment_id}", response_model=AssessmentResponse)
async def get_assessment(assessment_id: str):
    asm = prediction_service.get_assessment(assessment_id)
    if asm:
        return asm
    raise HTTPException(status_code=404, detail=f"Assessment {assessment_id} not found")



@router.get("/trust-passport/{assessment_id}", response_model=TrustPassportResponse)
async def get_trust_passport(assessment_id: str):
    asm = prediction_service.get_assessment(assessment_id)
    if asm:
        return await trust_passport_service.generate_passport(
            assessment_id=assessment_id,
            inputs_dict=asm.input_snapshot,
            risk_score=asm.risk_score,
            risk_band=asm.risk_band,
        )
    return await trust_passport_service.generate_passport(assessment_id)


@router.post("/what-if")
async def what_if_simulation(request: AssessmentRequest):
    """
    What-If Model Behavior Simulator.
    Returns model prediction for modified inputs.
    Clearly labeled as model-behavior simulation, not medical advice.
    """
    result = await prediction_service.predict_risk(request)
    return {
        "simulation_result": result,
        "disclaimer": "MODEL-BEHAVIOR SIMULATION ONLY. Not a medical advice or guaranteed health outcome prediction.",
        "simulated_inputs": request.clinical_inputs.model_dump(),
    }
