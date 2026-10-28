"""
User Profile and Health Profile Endpoints. The user is always the signed-in user.
"""

from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException
from postgrest import AsyncPostgrestClient
from pydantic import ValidationError

from apps.api.core.auth import CurrentUser, get_current_user, get_user_db, require_role
from apps.api.schemas import (
    ProfileResponse,
    ProfileUpdate,
    HealthProfileAnswers,
    HealthProfileResponse,
    HealthProfileUpdate,
)

router = APIRouter(tags=["User & Health Profiles"])


@router.get("/profile", response_model=ProfileResponse)
async def get_profile(user: CurrentUser = Depends(get_current_user), db: AsyncPostgrestClient = Depends(get_user_db)):
    res = await db.table("profiles").select("*").eq("id", user.id).limit(1).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Profile not found.")
    return res.data[0]


@router.put("/profile", response_model=ProfileResponse)
async def update_profile(
    update: ProfileUpdate,
    user: CurrentUser = Depends(get_current_user),
    db: AsyncPostgrestClient = Depends(get_user_db),
):
    # ProfileUpdate has no role/email field; the DB trigger also rejects such changes.
    changes = update.model_dump(exclude_unset=True)
    if changes:
        await db.table("profiles").update(changes).eq("id", user.id).execute()
    return await get_profile(user=user, db=db)


def _clean_answers(raw: Any) -> Dict[str, Any]:
    """Saved answers that still fit the 14-question contract. Anything else (e.g. rows written
    before P4 with the old clinical fields) is dropped, never converted or filled in."""
    out: Dict[str, Any] = {}
    if not isinstance(raw, dict):
        return out
    for k in HealthProfileAnswers.model_fields:
        if raw.get(k) is None:
            continue
        try:
            out.update(HealthProfileAnswers(**{k: raw[k]}).answered())
        except ValidationError:
            continue
    return out


@router.get("/health-profile", response_model=HealthProfileResponse)
async def get_health_profile(
    user: CurrentUser = Depends(require_role("patient")), db: AsyncPostgrestClient = Depends(get_user_db)
):
    """The signed-in patient's saved answers (only questions they answered)."""
    res = await db.table("health_profiles").select("answers, updated_at").eq("user_id", user.id).limit(1).execute()
    if not res.data:
        return HealthProfileResponse(saved=False, answers={})
    row = res.data[0]
    return HealthProfileResponse(saved=True, answers=_clean_answers(row.get("answers")), updated_at=row.get("updated_at"))


@router.put("/health-profile", response_model=HealthProfileResponse)
async def update_health_profile(
    body: HealthProfileUpdate,
    user: CurrentUser = Depends(require_role("patient")),
    db: AsyncPostgrestClient = Depends(get_user_db),
):
    """Replace the saved answers. Unanswered questions are stored as absent, never defaulted."""
    answers = body.answers.answered()
    row = {
        "user_id": user.id,
        "answers": answers,
        "height_cm": answers.get("height_cm"),
        "weight_kg": answers.get("weight_kg"),
    }
    await db.table("health_profiles").upsert(row, on_conflict="user_id").execute()
    return await get_health_profile(user=user, db=db)
