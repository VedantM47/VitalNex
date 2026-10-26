"""
VITALNEX Patient Clinical Reports & PDF Download Endpoints.
"""

import io
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Query, Response
from fastapi.responses import StreamingResponse
from datetime import datetime, timezone
from pydantic import BaseModel, Field

from apps.api.services import prediction_service
from apps.api.services.report_service import generate_pdf_report

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

    # TODO(P9): add factor explanations once real models produce them.
    pdf_bytes = generate_pdf_report(assessment_data=asm.model_dump())

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
