"""
User Profile and Health Profile Endpoints. The user is always the signed-in user.
"""

from fastapi import APIRouter, Depends, HTTPException
from postgrest import AsyncPostgrestClient

from apps.api.core.auth import CurrentUser, get_current_user, get_user_db, require_role
from apps.api.schemas import (
    ProfileResponse,
    ProfileUpdate,
    HealthProfileResponse,
    HealthProfileCreate,
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


@router.get("/health-profile", response_model=HealthProfileResponse)
async def get_health_profile(
    user: CurrentUser = Depends(require_role("patient")), db: AsyncPostgrestClient = Depends(get_user_db)
):
    res = await db.table("health_profiles").select("*").eq("user_id", user.id).limit(1).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="No health profile saved yet.")
    return res.data[0]


@router.put("/health-profile", response_model=HealthProfileResponse)
async def update_health_profile(
    profile_data: HealthProfileCreate,
    user: CurrentUser = Depends(require_role("patient")),
    db: AsyncPostgrestClient = Depends(get_user_db),
):
    row = {"user_id": user.id, "answers": profile_data.model_dump(mode="json", exclude_none=True)}
    if profile_data.height_cm is not None:
        row["height_cm"] = profile_data.height_cm
    if profile_data.weight_kg is not None:
        row["weight_kg"] = profile_data.weight_kg
    await db.table("health_profiles").upsert(row, on_conflict="user_id").execute()
    return await get_health_profile(user=user, db=db)
