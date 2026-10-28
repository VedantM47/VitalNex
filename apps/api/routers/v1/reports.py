"""
Patient reports: the list of saved screenings and the printable PDF (docs/SPEC.md §1.2 F17).

A patient can only download their own assessment (RLS-scoped read). The PDF shows bands and text
only — never probabilities (D-10) — and is built in services/report_service.py.
"""

from datetime import datetime
from typing import Dict, List, Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response
from fastapi.concurrency import run_in_threadpool
from postgrest import AsyncPostgrestClient
from pydantic import BaseModel

from apps.api.core.auth import CurrentUser, get_user_db, require_role
from apps.api.services import audit_service, prediction_service, report_service, review_service

router = APIRouter(tags=["Clinical Reports & Documentation"])


class ReportSummary(BaseModel):
    assessment_id: str
    created_at: datetime
    next_step: str
    review_status: str
    model_versions: Dict
    pdf_download_url: str


async def _history_allowed(user_id: str) -> bool:
    # Withdrawing store_history hides saved history (and so its reports) immediately (SPEC §2.2).
    return "store_history" in await prediction_service.granted_purposes(user_id)


@router.get("/reports", response_model=List[ReportSummary])
async def list_reports(
    user: CurrentUser = Depends(require_role("patient")), db: AsyncPostgrestClient = Depends(get_user_db)
):
    if not await _history_allowed(user.id):
        return []
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
    request: Request,
    lang: Optional[Literal["en", "hi", "mr"]] = Query(None, description="Report language; default: profile language"),
    user: CurrentUser = Depends(require_role("patient")),
    db: AsyncPostgrestClient = Depends(get_user_db),
):
    asm = await prediction_service.get_assessment(db, assessment_id)
    if not asm or asm.user_id != user.id or not await _history_allowed(user.id):
        raise HTTPException(status_code=404, detail=f"Assessment record '{assessment_id}' not found")
    profile_rows = (await db.table("profiles").select("full_name, preferred_language").eq("id", user.id).execute()).data
    profile = profile_rows[0] if profile_rows else {}
    language = lang or (profile.get("preferred_language") if profile.get("preferred_language") in report_service.LANGS
                        else "en")
    review = (await review_service.review_info_for(db, [asm.id])).get(asm.id)
    try:
        pdf = await run_in_threadpool(report_service.build_pdf, asm, profile.get("full_name"), review, language)
    except report_service.ShapingUnavailableError:
        raise HTTPException(status_code=503, detail="Hindi and Marathi PDFs are not available on this server.")
    await audit_service.log_event(user.id, "REPORT_DOWNLOADED", "risk_assessment", asm.id,
                                  metadata={"language": language}, request=request)
    filename = f"vitalnex-report-{asm.created_at:%Y%m%d}-{language}.pdf"
    return Response(content=pdf, media_type="application/pdf",
                    headers={"Content-Disposition": f'attachment; filename="{filename}"', "Cache-Control": "no-store"})
