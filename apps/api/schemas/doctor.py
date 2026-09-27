"""
Doctor & Care Connect Pydantic Schemas.
"""

from typing import List, Optional
from pydantic import BaseModel, Field


class DoctorLocation(BaseModel):
    facility_name: str
    locality: str
    city: str = "Pune"
    state: str = "Maharashtra"
    postal_code: Optional[str] = None
    distance_estimate_km: float


class DoctorAvailabilitySlot(BaseModel):
    day_of_week: int  # 0=Monday, 6=Sunday
    start_time: str
    end_time: str
    slot_duration_minutes: int = 30
    is_available: bool = True


class DoctorResponse(BaseModel):
    id: str
    full_name: str
    medical_license_number: str
    specialization: str
    years_of_experience: int
    bio: Optional[str] = None
    languages_spoken: List[str]
    consultation_modes: List[str]  # e.g. ["video", "in_person"]
    rating: float
    review_count: int
    is_demo: bool = True
    is_active: bool = True
    locations: List[DoctorLocation] = []
    availability: List[DoctorAvailabilitySlot] = []


class DoctorFilter(BaseModel):
    specialization: Optional[str] = None
    locality: Optional[str] = None
    language: Optional[str] = None
    consultation_mode: Optional[str] = None
    max_distance_km: Optional[float] = None
