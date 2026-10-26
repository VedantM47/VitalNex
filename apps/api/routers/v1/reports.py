"""
VITALNEX Patient Reports. The PDF itself is rebuilt on the new results in P9.
"""

from datetime import datetime
from typing import Dict, List

from fastapi import APIRouter, Depends, HTTPException
from postgrest import AsyncPostgrestClient
from pydantic import BaseModel

from apps.api.core.auth import CurrentUser, get_user_db, require_role
from apps.api.services import prediction_service

router = APIRouter(tags=["Clinical Reports & Documentation"])


class ReportSummary(BaseModel):
    assessment_id: str
    created_at: datetime
    next_step: str
    review_status: str
    model_versions: Dict
    pdf_download_url: str


@router.get("/reports", response_model=List[ReportSummary])
async def list_reports(
    user: CurrentUser = Depends(require_role("patient")), db: AsyncPostgrestClient = Depends(get_user_db)
):
    assessments = await prediction_service.list_assessments(db, user.id)
    return [
        ReportSummary(
            assessment_id=a.id,
            created_at=a.created_at,
            next_step=a.next_step,
            review_status=a.review_status,
            model_versions=a.model_versions,
            pdf_download_url=f"/api/v1/reports/{a.id}/pdf",
        )
        for a in assessments
    ]


@router.get("/reports/{assessment_id}/pdf")
async def download_report_pdf(
    assessment_id: str,
    user: CurrentUser = Depends(require_role("patient")),
    db: AsyncPostgrestClient = Depends(get_user_db),
):
    asm = await prediction_service.get_assessment(db, assessment_id)
    if not asm or asm.user_id != user.id:
        raise HTTPException(status_code=404, detail=f"Assessment record '{assessment_id}' not found")
    # TODO(P9): PDF from the three-disease results (bands, factors, next step, clinician note).
    raise HTTPException(status_code=503, detail="PDF reports are rebuilt for the new results in P9.")
