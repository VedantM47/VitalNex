"""
Appointment Pydantic Schemas for VITALNEX Connected Care.
"""

from typing import Optional
from pydantic import BaseModel, Field
from datetime import datetime


class AppointmentCreate(BaseModel):
    """The patient is the signed-in user; the time comes from the chosen slot."""
    slot_id: str
    consultation_type: str = Field("in_person", pattern="^(in_person|audio)$")
    patient_reason: Optional[str] = Field(None, max_length=500)
    assessment_id: Optional[str] = None


class AppointmentUpdate(BaseModel):
    """Patients may only cancel; the doctor may confirm, complete or cancel and add notes."""
    status: Optional[str] = Field(None, pattern="^(confirmed|completed|cancelled)$")
    doctor_notes: Optional[str] = Field(None, max_length=2000)


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
    status: str = Field("scheduled", pattern="^(scheduled|confirmed|in_progress|completed|cancelled)$")
    consultation_type: str
    reason: Optional[str] = None
    patient_reason: Optional[str] = None
    doctor_notes: Optional[str] = None
    patient_name: Optional[str] = None  # shown to the booked doctor only
    slot_id: Optional[str] = None
    assessment_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime
