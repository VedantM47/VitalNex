"""
Current user, session audit, consent and data-rights endpoints ("My data", SPEC §2.2).
"""

import json
from datetime import datetime, timezone
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, List, Literal

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
from postgrest import AsyncPostgrestClient
from pydantic import BaseModel

from apps.api.core.auth import CurrentUser, get_current_user, get_user_db, require_role
from apps.api.schemas.consent import CONSENT_PURPOSES, NOTICE_VERSION, ConsentStatus, ConsentUpdate
from apps.api.schemas.profile import ProfileResponse
from apps.api.services import audit_service, data_rights_service

NOTICES_FILE = Path(__file__).resolve().parents[2] / "content" / "consent_notices.json"


@lru_cache(maxsize=1)
def consent_notices() -> Dict[str, Any]:
    return json.loads(NOTICES_FILE.read_text(encoding="utf-8"))

router = APIRouter(tags=["Session & Consent"])


@router.get("/me", response_model=ProfileResponse)
async def get_me(user: CurrentUser = Depends(get_current_user), db: AsyncPostgrestClient = Depends(get_user_db)):
    res = await db.table("profiles").select("*").eq("id", user.id).limit(1).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Profile not found.")
    return res.data[0]


@router.post("/me/login-event", status_code=204)
async def record_login(request: Request, user: CurrentUser = Depends(get_current_user)):
    """Called by the web app right after a successful Supabase sign-in."""
    await audit_service.log_event(user.id, "LOGIN", "session", metadata={"role": user.role}, request=request)


@router.post("/me/logout-event", status_code=204)
async def record_logout(request: Request, user: CurrentUser = Depends(get_current_user)):
    await audit_service.log_event(user.id, "LOGOUT", "session", request=request)


def _consent_list(rows: list) -> List[ConsentStatus]:
    by_purpose = {r["purpose"]: r for r in rows}
    notices = consent_notices()["purposes"]
    out = []
    for purpose in CONSENT_PURPOSES:
        r = by_purpose.get(purpose)
        n = notices[purpose]
        out.append(
            ConsentStatus(
                purpose=purpose,
                granted=bool(r and r["granted"] and r["withdrawn_at"] is None),
                granted_at=r["granted_at"] if r else None,
                withdrawn_at=r["withdrawn_at"] if r else None,
                notice_version=r["notice_version"] if r else NOTICE_VERSION,
                required=n["required"],
                title=n["title"],
                notice=n["notice"],
                effect_if_off=n["effect_if_off"],
            )
        )
    return out


@router.get("/consents/notice")
async def get_consent_notice() -> Dict[str, Any]:
    """The current consent notice (public, so it can be read before signing up)."""
    return consent_notices()


@router.get("/consents", response_model=List[ConsentStatus])
async def list_consents(
    user: CurrentUser = Depends(require_role("patient")), db: AsyncPostgrestClient = Depends(get_user_db)
):
    res = await db.table("consents").select("*").eq("user_id", user.id).execute()
    return _consent_list(res.data)


@router.put("/consents/{purpose}", response_model=List[ConsentStatus])
async def set_consent(
    purpose: str,
    update: ConsentUpdate,
    user: CurrentUser = Depends(require_role("patient")),
    db: AsyncPostgrestClient = Depends(get_user_db),
):
    """Grant or withdraw one purpose. Written as the user (RLS) and audited by trigger."""
    if purpose not in CONSENT_PURPOSES:
        raise HTTPException(status_code=422, detail=f"Unknown consent purpose '{purpose}'.")
    now = datetime.now(timezone.utc).isoformat()
    row = {
        "user_id": user.id,
        "purpose": purpose,
        "granted": update.granted,
        "notice_version": NOTICE_VERSION,
        "granted_at": now if update.granted else None,
        "withdrawn_at": None if update.granted else now,
    }
    await db.table("consents").upsert(row, on_conflict="user_id,purpose").execute()
    res = await db.table("consents").select("*").eq("user_id", user.id).execute()
    return _consent_list(res.data)


# ── Data rights (PROMPTS P7 step 3) ──

@router.get("/me/data-export")
async def export_my_data(
    user: CurrentUser = Depends(require_role("patient")), db: AsyncPostgrestClient = Depends(get_user_db)
):
    """Everything VITALNEX holds about me, as a JSON download."""
    doc = await data_rights_service.export(user, db)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%d")
    return JSONResponse(doc, headers={
        "Content-Disposition": f'attachment; filename="vitalnex-my-data-{stamp}.json"',
        "Cache-Control": "no-store",
    })


class DeletionConfirm(BaseModel):
    confirm: Literal["DELETE"]


@router.post("/me/data-deletion")
async def delete_my_data(body: DeletionConfirm, user: CurrentUser = Depends(require_role("patient"))):
    """Removes my assessments, shares, profile data and account (SPEC §2.2). Keeps only a
    minimal audit entry that a deletion happened. The web app confirms in-page first."""
    return await data_rights_service.delete_everything(user)
