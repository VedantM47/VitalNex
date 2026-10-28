"""
QR patient-held record (novelty 9, PROMPTS P7 step 4).

- A share is a random 256-bit token (secrets.token_urlsafe). Only its SHA-256 hash is stored
  (share_tokens.token_hash); the raw token exists once, in the URL / QR returned to the patient.
- Opening a share goes through resolve_share_token() in Postgres (service role only), which
  checks revoked / expired and writes share_access_log for every successful open.
- The public view is a read-only, patient-level summary (bands and text only, no
  probabilities, D-10), with "shared by the patient, expires at …" and the non-diagnostic notice.
"""

import base64
import hashlib
import io
import re
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

import qrcode
from fastapi import HTTPException
from postgrest import AsyncPostgrestClient

from apps.api.core import db as core_db
from apps.api.core.config import settings
from apps.api.schemas.share import ShareCreate, ShareCreated, ShareInfo, ShareOpen
from apps.api.services import screening

EXPIRY = {"1h": timedelta(hours=1), "24h": timedelta(hours=24), "7d": timedelta(days=7)}
TOKEN_BYTES = 32
TOKEN_RE = re.compile(r"^[A-Za-z0-9_-]{32,128}$")
HISTORY_MAX = 20


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def qr_data_uri(url: str) -> str:
    img = qrcode.make(url, box_size=8, border=2)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode("ascii")


def _status(row: Dict[str, Any], now: datetime) -> str:
    if row.get("revoked_at"):
        return "revoked"
    if datetime.fromisoformat(str(row["expires_at"])) <= now:
        return "expired"
    return "active"


async def create(user_id: str, req: ShareCreate) -> ShareCreated:
    token = secrets.token_urlsafe(TOKEN_BYTES)
    now = datetime.now(timezone.utc)
    expires = now + EXPIRY[req.expires_in]
    sections = list(dict.fromkeys(req.sections))  # de-duplicate, keep order
    # Created with the service role: share_tokens has no insert policy for users.
    row = (await core_db.service_db().table("share_tokens").insert({
        "token_hash": hash_token(token),
        "user_id": user_id,
        "scope": {"sections": sections},
        "expires_at": expires.isoformat(),
    }).execute()).data[0]
    url = f"{settings.PUBLIC_WEB_URL.rstrip('/')}/share/{token}"
    return ShareCreated(id=row["id"], sections=sections, expires_at=expires, url=url, qr_png_data_uri=qr_data_uri(url))


async def list_shares(db: AsyncPostgrestClient) -> List[ShareInfo]:
    """The patient's own shares and every open (RLS: owner only). Hashes are never returned."""
    rows = (await db.table("share_tokens").select("id, scope, expires_at, revoked_at, created_at")
            .order("created_at", desc=True).execute()).data
    if not rows:
        return []
    opens = (await db.table("share_access_log").select("token_id, accessed_at, accessor_role")
             .in_("token_id", [r["id"] for r in rows]).order("accessed_at", desc=True).execute()).data
    now = datetime.now(timezone.utc)
    out = []
    for r in rows:
        mine = [ShareOpen(accessed_at=o["accessed_at"], accessor_role=o["accessor_role"])
                for o in opens if o["token_id"] == r["id"]]
        out.append(ShareInfo(
            id=r["id"], sections=(r.get("scope") or {}).get("sections", []), created_at=r["created_at"],
            expires_at=r["expires_at"], revoked_at=r.get("revoked_at"), status=_status(r, now),
            open_count=len(mine), opens=mine,
        ))
    return out


async def revoke(db: AsyncPostgrestClient, share_id: str) -> None:
    rows = (await db.table("share_tokens").select("id, revoked_at").eq("id", share_id).execute()).data
    if not rows:
        raise HTTPException(status_code=404, detail="Share not found.")
    if rows[0]["revoked_at"]:
        return
    # Owner update allowed by RLS; the P7 migration limits it to setting revoked_at once.
    await db.table("share_tokens").update({"revoked_at": datetime.now(timezone.utc).isoformat()}) \
        .eq("id", share_id).execute()


# ── public view ──

def _patient_results(results: Dict[str, Any]) -> Dict[str, Any]:
    return screening.shape_results(results or {}, "patient")


async def _summary(user_id: str, sections: List[str]) -> Dict[str, Any]:
    db = core_db.service_db()
    out: Dict[str, Any] = {}
    consent = (await db.table("consents").select("purpose").eq("user_id", user_id).eq("purpose", "store_history")
               .eq("granted", True).is_("withdrawn_at", "null").execute()).data
    if not consent:
        # Saved history is hidden while store_history is withdrawn (PROMPTS P7 step 3).
        return {s: None for s in sections} | {"history_hidden": True}
    asms = (await db.table("risk_assessments").select("id, created_at, next_step, emergency_flag, results, review_status")
            .eq("user_id", user_id).order("created_at", desc=True).limit(HISTORY_MAX).execute()).data
    latest = asms[0] if asms else None
    if "latest_results" in sections:
        out["latest_results"] = None if not latest else {
            "created_at": latest["created_at"],
            "next_step": latest["next_step"],
            "emergency_flag": latest["emergency_flag"],
            "results": {d: {"band": r["band"], "abstained": r["abstained"]}
                        for d, r in _patient_results(latest["results"]).items()},
        }
    if "factors" in sections:
        out["factors"] = None if not latest else {
            d: r["top_factors"] for d, r in _patient_results(latest["results"]).items()
        }
    if "history" in sections:
        out["history"] = [
            {"created_at": a["created_at"], "next_step": a["next_step"],
             "bands": {d: r["band"] for d, r in _patient_results(a["results"]).items()}}
            for a in asms
        ]
    if "clinician_notes" in sections:
        ids = [a["id"] for a in asms]
        notes = []
        if ids:
            queue = (await db.table("review_queue").select("assessment_id, status, reviewed_at, clinician_note")
                     .in_("assessment_id", ids).in_("status", ["agreed", "overridden"]).execute()).data
            ovr = (await db.table("clinician_overrides").select("assessment_id, disease, clinician_band")
                   .in_("assessment_id", ids).execute()).data
            when = {a["id"]: a["created_at"] for a in asms}
            for q in queue:
                notes.append({
                    "assessment_created_at": when.get(q["assessment_id"]),
                    "status": q["status"],
                    "reviewed_at": q["reviewed_at"],
                    "clinician_note": q["clinician_note"],
                    "clinician_bands": {o["disease"]: o["clinician_band"] for o in ovr
                                        if o["assessment_id"] == q["assessment_id"]},
                })
        out["clinician_notes"] = notes
    return out


async def open_share(token: str, accessor_role: str = "public") -> Dict[str, Any]:
    if not TOKEN_RE.match(token or ""):
        raise HTTPException(status_code=404, detail={"code": "not_found", "message": "This share link is not valid."})
    res = (await core_db.service_db().rpc(
        "resolve_share_token", {"p_token": token, "p_accessor_role": accessor_role}).execute()).data
    status = (res or {}).get("status")
    if status == "revoked":
        raise HTTPException(status_code=410, detail={"code": "revoked", "message": "The patient has revoked this share link."})
    if status == "expired":
        raise HTTPException(status_code=410, detail={"code": "expired", "message": "This share link has expired."})
    if status != "valid":
        raise HTTPException(status_code=404, detail={"code": "not_found", "message": "This share link is not valid."})
    sections = (res.get("scope") or {}).get("sections", [])
    expires_at = res["expires_at"]
    return {
        "shared_by": "patient",
        "notice": f"Shared by the patient. Expires at {expires_at}.",
        "expires_at": expires_at,
        "sections": sections,
        "read_only": True,
        "disclaimer": screening.DISCLAIMER,
        **await _summary(res["user_id"], sections),
    }


def optional_accessor_role(role: Optional[str]) -> str:
    return role if role in ("patient", "doctor", "admin") else "public"
