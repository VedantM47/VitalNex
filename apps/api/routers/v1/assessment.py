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
    from apps.api.schemas import ClinicalModelFeatures
    from datetime import datetime, timezone
    return AssessmentResponse(
        id=assessment_id,
        user_id="demo-user",
        assessment_mode="demo",
        risk_score=38.5,
        risk_band="Moderate",
        confidence_interval=[34.0, 43.0],
        calibration_status="Calibrated (Demo Baseline)",
        human_review_required=False,
        human_review_status="Not_Required",
        model_version="v1.0.0-demo-baseline",
        disclaimer="VITALNEX is a research and decision-support prototype. It does not diagnose disease, prescribe treatment, or replace a qualified healthcare professional.",
        evaluated_at=datetime.now(timezone.utc),
        input_snapshot=ClinicalModelFeatures(
            age=48, sex=1, bmi=25.4, smoking=0, family_history=1, diabetes=0, hypertension=1
        ).model_dump(),
    )


@router.get("/trust-passport/{assessment_id}", response_model=TrustPassportResponse)
async def get_trust_passport(assessment_id: str):
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
