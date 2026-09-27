"""
Care Connect: Doctor Discovery and Appointment Booking Endpoints.
"""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from apps.api.schemas import (
    DoctorResponse,
    DoctorFilter,
    AppointmentCreate,
    AppointmentResponse,
)
from apps.api.services import doctor_service, appointment_service

router = APIRouter(tags=["Care Connect & Appointments"])


@router.get("/doctors", response_model=List[DoctorResponse])
async def list_doctors(
    specialization: Optional[str] = Query(None),
    locality: Optional[str] = Query(None),
    language: Optional[str] = Query(None),
    consultation_mode: Optional[str] = Query(None),
):
    filters = DoctorFilter(
        specialization=specialization,
        locality=locality,
        language=language,
        consultation_mode=consultation_mode,
    )
    return await doctor_service.search_doctors(filters)


@router.get("/doctors/{doctor_id}", response_model=DoctorResponse)
async def get_doctor(doctor_id: str):
    doc = await doctor_service.get_doctor_by_id(doctor_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Doctor not found")
    return doc


@router.get("/appointments", response_model=List[AppointmentResponse])
async def list_appointments(
    user_id: str = Query("demo-user"),
    role: str = Query("patient"),
):
    return await appointment_service.list_appointments(user_id, role)


@router.post("/appointments", response_model=AppointmentResponse)
async def create_appointment(appointment: AppointmentCreate):
    return await appointment_service.create_appointment(appointment)
