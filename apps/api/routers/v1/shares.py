"""
QR patient-held record (novelty 9, PROMPTS P7 step 4).

Patient: create a share (sections + expiry 1h / 24h / 7d), list shares with every open, revoke.
Public: GET /share/{token} — read-only summary; every open is logged in share_access_log.
"""

from typing import List, Optional

from fastapi import APIRouter, Depends, Response
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from postgrest import AsyncPostgrestClient

from apps.api.core import auth
from apps.api.core.auth import CurrentUser, get_user_db, require_role
from apps.api.schemas.share import ShareCreate, ShareCreated, ShareInfo
from apps.api.services import share_service

router = APIRouter(tags=["QR Patient-held Record"])

_optional_bearer = HTTPBearer(auto_error=False)
patient = require_role("patient")


@router.post("/shares", response_model=ShareCreated, status_code=201)
async def create_share(req: ShareCreate, user: CurrentUser = Depends(patient)):
    """Returns the share URL and its QR code once. Only the token's SHA-256 hash is stored."""
    return await share_service.create(user.id, req)


@router.get("/shares", response_model=List[ShareInfo])
async def list_shares(user: CurrentUser = Depends(patient), db: AsyncPostgrestClient = Depends(get_user_db)):
    return await share_service.list_shares(db)


@router.post("/shares/{share_id}/revoke", status_code=204)
async def revoke_share(share_id: str, user: CurrentUser = Depends(patient),
                       db: AsyncPostgrestClient = Depends(get_user_db)):
    await share_service.revoke(db, share_id)


async def _accessor_role(credentials: Optional[HTTPAuthorizationCredentials] = Depends(_optional_bearer)) -> str:
    """Signed-in viewers (e.g. a clinician scanning the QR) are logged by role; anyone else is 'public'.
    A bad or missing token never blocks the public view."""
    if credentials is None:
        return "public"
    try:
        claims = await auth.verify_token(credentials.credentials)
        return share_service.optional_accessor_role(await auth.lookup_role(claims["sub"]))
    except Exception:  # noqa: BLE001 — invalid token, unknown user or DB issue: treat as public
        return "public"


@router.get("/share/{token}")
async def open_share(token: str, response: Response, accessor_role: str = Depends(_accessor_role)):
    """Read-only summary shared by the patient. Expired / revoked links answer 410 with a code."""
    response.headers["Cache-Control"] = "no-store"
    response.headers["Referrer-Policy"] = "no-referrer"
    return await share_service.open_share(token, accessor_role)

