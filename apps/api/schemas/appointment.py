"""
Appointment Pydantic Schemas for VITALNEX Connected Care.
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


class AppointmentUpdate(BaseModel):
    appointment_time: Optional[datetime] = None
    status: Optional[str] = Field(None, pattern="^(scheduled|rescheduled|confirmed|in_progress|completed|cancelled)$")
    patient_reason: Optional[str] = None
    doctor_notes: Optional[str] = None
    consultation_type: Optional[str] = Field(None, pattern="^(video|in_person|audio)$")


class AppointmentResponse(BaseModel):
    id: str
    patient_id: str
    doctor_id: str
    doctor_name: str
    specialization: str
    appointment_date: str
    start_time: str
    end_time: str
    appointment_time: datetime
    status: str = Field("scheduled", pattern="^(scheduled|rescheduled|confirmed|in_progress|completed|cancelled)$")
    consultation_type: str
    reason: Optional[str] = None
    patient_reason: Optional[str] = None
    doctor_notes: Optional[str] = None
    meeting_link: Optional[str] = None
    assessment_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime
