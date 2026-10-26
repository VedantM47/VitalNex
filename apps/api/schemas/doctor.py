"""
Doctor & Care Connect Pydantic Schemas.
"""

from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel


class DoctorLocation(BaseModel):
    facility_name: str
    locality: str
    city: str = "Pune"
    state: str = "Maharashtra"
    postal_code: Optional[str] = None
    distance_estimate_km: Optional[float] = None


class DoctorSlot(BaseModel):
    """A concrete bookable slot that is not taken yet."""
    id: str
    starts_at: datetime
    ends_at: datetime


class DoctorResponse(BaseModel):
    id: str
    full_name: str
    medical_license_number: str
    specialization: str  # display title (English)
    specialization_code: str  # doctor_specializations.code
    years_of_experience: int
    bio: Optional[str] = None
    languages_spoken: List[str]
    consultation_modes: List[str]  # e.g. ["video", "in_person"]
    # Demo doctors have no ratings; never show an invented number.
    rating: Optional[float] = None
    review_count: Optional[int] = None
    is_demo: bool = True
    is_active: bool = True
    locations: List[DoctorLocation] = []
    next_slots: List[DoctorSlot] = []


class DoctorFilter(BaseModel):
    specialization: Optional[str] = None
    locality: Optional[str] = None
    language: Optional[str] = None
    consultation_mode: Optional[str] = None
