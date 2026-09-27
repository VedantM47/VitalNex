"""
Appointment Pydantic Schemas.
"""

from typing import Optional
from pydantic import BaseModel, Field
from datetime import datetime


class AppointmentCreate(BaseModel):
    doctor_id: str
    patient_id: str
    appointment_time: datetime
    consultation_type: str = Field("video", pattern="^(video|in_person|audio)$")
    patient_reason: Optional[str] = None
    assessment_id: Optional[str] = None


class AppointmentResponse(BaseModel):
    id: str
    patient_id: str
    doctor_id: str
    doctor_name: str
    doctor_specialization: str
    appointment_time: datetime
    status: str = Field("scheduled", pattern="^(scheduled|confirmed|in_progress|completed|cancelled)$")
    consultation_type: str
    patient_reason: Optional[str] = None
    meeting_link: Optional[str] = None
    created_at: datetime
    updated_at: datetime
