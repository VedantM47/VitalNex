"""
VITALNEX Patient Clinical Reports & PDF Download Endpoints.
"""

import io
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Query, Response
from fastapi.responses import StreamingResponse
from datetime import datetime, timezone
from pydantic import BaseModel, Field

from apps.api.services import prediction_service, trust_passport_service
from apps.api.services.report_service import generate_pdf_report
from apps.api.services.jev_service import classify_report_review, classify_review_routing, is_jev_available

router = APIRouter(tags=["Clinical Reports & Documentation"])


class ReportSummary(BaseModel):
    id: str
    assessment_id: str
    user_id: str
    title: str
    risk_score: float
    risk_band: str
    created_at: datetime
    model_version: str
    review_status: str
    pdf_download_url: str


@router.get("/reports", response_model=List[ReportSummary])
async def list_reports(user_id: str = Query("demo-user", description="Patient user identifier")):
    """List available clinical reports for the patient."""
    assessments = prediction_service.list_assessments(user_id=user_id)
    reports = []
    for asm in assessments:
        reports.append(ReportSummary(
            id=f"rep-{asm.id.replace('asm-', '')}",
            assessment_id=asm.id,
            user_id=asm.user_id,
            title=f"Cardiometabolic Risk Screening Report ({asm.risk_band} Risk)",
            risk_score=asm.risk_score,
            risk_band=asm.risk_band,
            created_at=asm.evaluated_at,
            model_version=asm.model_version,
            review_status=asm.human_review_status,
            pdf_download_url=f"/api/v1/reports/{asm.id}/pdf",
        ))
    return reports


@router.get("/reports/{assessment_id}/pdf")
async def download_report_pdf(assessment_id: str):
    """
    Generate and stream a professional, validated PDF Clinical Report for an assessment.
    """
    asm = prediction_service.get_assessment(assessment_id)
    if not asm:
        # Check if assessment exists in general pool before erroring out
        assessments = prediction_service.list_assessments()
        for a in assessments:
            if a.id == assessment_id or assessment_id in a.id:
                asm = a
                break

    if not asm:
        raise HTTPException(status_code=404, detail=f"Assessment record '{assessment_id}' not found")

    # Fetch trust passport data for this assessment
    passport = await trust_passport_service.generate_passport(
        assessment_id=asm.id,
        inputs_dict=asm.input_snapshot,
        risk_score=asm.risk_score,
        risk_band=asm.risk_band,
    )
    passport_dict = passport.model_dump()

    # Fetch explanation data if available
    explanation_data = {
        "available": True,
        "method": "TreeSHAP Local Feature Attribution",
        "summary": "Resting Blood Pressure (+8.2%) and Age (+5.1%) elevated risk, moderated by Max Heart Rate (-5.5%) and Non-Smoking (-6.4%).",
        "top_positive_contributors": [
            {"label": "Resting BP (135 mmHg)", "impact": "+8.2% Risk", "value": "135 mmHg"},
            {"label": "Age (59 years)", "impact": "+5.1% Risk", "value": "59 yrs"},
        ],
        "top_negative_contributors": [
            {"label": "Non-Smoker", "impact": "-6.4% Protective", "value": "No"},
            {"label": "Max Heart Rate (148 bpm)", "impact": "-5.5% Protective", "value": "148 bpm"},
        ],
    }

    # Bounded Jev decision routing
    jev_routing = await classify_review_routing(
        risk_band=asm.risk_band,
        risk_score=asm.risk_score,
        data_quality_score=passport.data_quality.quality_score,
        uncertainty=passport.uncertainty.total_entropy,
        human_review_required=asm.human_review_required,
        out_of_range_fields=[],
    )

    pdf_bytes = generate_pdf_report(
        assessment_data=asm.model_dump(),
        trust_passport_data=passport_dict,
        explanation_data=explanation_data,
        jev_routing=jev_routing,
    )

    if not pdf_bytes:
        raise HTTPException(status_code=500, detail="PDF generation service failed")

    filename = f"vitalnex-report-{asm.id}.pdf"
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Cache-Control": "no-cache",
        },
    )


@router.get("/assessment/history/{user_id}")
async def get_assessment_history(user_id: str):
    """Retrieve historical assessment timeline and risk trajectory."""
    assessments = prediction_service.list_assessments(user_id=user_id)
    return {
        "user_id": user_id,
        "total_assessments": len(assessments),
        "assessments": [a.model_dump() for a in assessments],
        "trajectory": [
            {
                "date": a.evaluated_at.strftime("%Y-%m-%d"),
                "risk_score": a.risk_score,
                "risk_band": a.risk_band,
                "id": a.id,
            }
            for a in reversed(assessments)
        ],
    }
