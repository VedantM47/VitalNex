"""
User Profile and Health Profile Endpoints.
"""

from fastapi import APIRouter, HTTPException, Query
from datetime import datetime, timezone
from apps.api.schemas import (
    ProfileResponse,
    ProfileUpdate,
    HealthProfileResponse,
    HealthProfileCreate,
    HealthProfileUpdate,
)
from apps.api.services import health_profile_service

router = APIRouter(tags=["User & Health Profiles"])

# In-memory demo profile
_demo_profile = ProfileResponse(
    id="usr-demo-001",
    email="demo.patient@vitalnex.health",
    full_name="Rajesh Sharma",
    role="patient",
    phone_number="+91 98220 12345",
    preferred_language="en",
    avatar_url=None,
    is_demo=True,
    created_at=datetime.now(timezone.utc),
    updated_at=datetime.now(timezone.utc),
)


@router.get("/profile", response_model=ProfileResponse)
async def get_profile():
    return _demo_profile


@router.put("/profile", response_model=ProfileResponse)
async def update_profile(update: ProfileUpdate):
    global _demo_profile
    if update.full_name:
        _demo_profile.full_name = update.full_name
    if update.phone_number is not None:
        _demo_profile.phone_number = update.phone_number
    if update.preferred_language:
        _demo_profile.preferred_language = update.preferred_language
    _demo_profile.updated_at = datetime.now(timezone.utc)
    return _demo_profile


@router.get("/health-profile", response_model=HealthProfileResponse)
async def get_health_profile(user_id: str = Query("demo-user")):
    profile = await health_profile_service.get_profile(user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Health profile not found")
    return profile


@router.put("/health-profile", response_model=HealthProfileResponse)
async def update_health_profile(profile_data: HealthProfileCreate):
    return await health_profile_service.save_profile(profile_data)
