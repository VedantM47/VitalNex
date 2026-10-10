"""
User Profile and Health Profile Endpoints.
"""

from fastapi import APIRouter, HTTPException, Query
from datetime import datetime, timezone
from typing import Dict
from apps.api.schemas import (
    ProfileResponse,
    ProfileUpdate,
    HealthProfileResponse,
    HealthProfileCreate,
)
from apps.api.services import health_profile_service

router = APIRouter(tags=["User & Health Profiles"])

# Multi-tenant user profile memory store
_user_profiles_store: Dict[str, ProfileResponse] = {
    "usr-demo-patient-001": ProfileResponse(
        id="usr-demo-patient-001",
        email="rajesh.sharma@vitalnex.health",
        full_name="Rajesh Sharma",
        role="patient",
        phone_number="+91 98220 12345",
        preferred_language="en",
        avatar_url=None,
        is_demo=True,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
}


@router.get("/profile", response_model=ProfileResponse)
async def get_profile(user_id: str = Query("usr-demo-patient-001")):
    if user_id in _user_profiles_store:
        return _user_profiles_store[user_id]
    
    # Return dynamic default for non-demo users if not stored yet
    return ProfileResponse(
        id=user_id,
        email=f"{user_id}@vitalnex.health" if "@" not in user_id else user_id,
        full_name=user_id.split("@")[0].replace(".", " ").title() if "@" in user_id else "Patient User",
        role="patient",
        phone_number="+91 90000 00000",
        preferred_language="en",
        avatar_url=None,
        is_demo=user_id.startswith("usr-demo"),
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )


@router.put("/profile", response_model=ProfileResponse)
async def update_profile(update: ProfileUpdate, user_id: str = Query("usr-demo-patient-001")):
    current = await get_profile(user_id)
    if update.full_name:
        current.full_name = update.full_name
    if update.phone_number is not None:
        current.phone_number = update.phone_number
    if update.preferred_language:
        current.preferred_language = update.preferred_language
    current.updated_at = datetime.now(timezone.utc)
    _user_profiles_store[user_id] = current
    return current


@router.get("/health-profile", response_model=HealthProfileResponse)
async def get_health_profile(user_id: str = Query("usr-demo-patient-001")):
    profile = await health_profile_service.get_profile(user_id)
    if not profile:
        raise HTTPException(status_code=404, detail=f"Health profile for '{user_id}' not found")
    return profile


@router.put("/health-profile", response_model=HealthProfileResponse)
async def update_health_profile(profile_data: HealthProfileCreate):
    return await health_profile_service.save_profile(profile_data)

