"""
Current user, session audit and consent endpoints.
"""

from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Request
from postgrest import AsyncPostgrestClient

from apps.api.core.auth import CurrentUser, get_current_user, get_user_db, require_role
from apps.api.schemas.consent import CONSENT_PURPOSES, NOTICE_VERSION, ConsentStatus, ConsentUpdate
from apps.api.schemas.profile import ProfileResponse
from apps.api.services import audit_service

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
    out = []
    for purpose in CONSENT_PURPOSES:
        r = by_purpose.get(purpose)
        out.append(
            ConsentStatus(
                purpose=purpose,
                granted=bool(r and r["granted"] and r["withdrawn_at"] is None),
                granted_at=r["granted_at"] if r else None,
                withdrawn_at=r["withdrawn_at"] if r else None,
                notice_version=r["notice_version"] if r else NOTICE_VERSION,
            )
        )
    return out


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
