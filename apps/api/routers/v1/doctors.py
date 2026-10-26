"""
Care Connect: Doctor Discovery, Appointment Booking, Clinician Patient Reviews, and Telehealth Video Access.
"""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, WebSocket
from apps.api.core.frozen import NOT_IN_MVP_DETAIL, not_in_mvp
from apps.api.schemas import (
    DoctorResponse,
    DoctorFilter,
    AppointmentCreate,
    AppointmentUpdate,
    AppointmentResponse,
)
from apps.api.schemas.review import PatientReviewResponse, PatientReviewUpdate
from apps.api.services import doctor_service, appointment_service, patient_review_service

router = APIRouter(tags=["Care Connect & Appointments"])


# ── DOCTOR DIRECTORY ──

@router.get("/doctors", response_model=List[DoctorResponse])
async def list_doctors(
    specialization: Optional[str] = Query(None),
    locality: Optional[str] = Query(None),
    language: Optional[str] = Query(None),
    consultation_mode: Optional[str] = Query(None),
):
    """Search verified demo clinicians across Pune, PCMC, and peri-urban locations."""
    filters = DoctorFilter(
        specialization=specialization,
        locality=locality,
        language=language,
        consultation_mode=consultation_mode,
    )
    return await doctor_service.search_doctors(filters)


@router.get("/doctors/{doctor_id}", response_model=DoctorResponse)
async def get_doctor(doctor_id: str):
    """Retrieve detailed doctor profile and verified availability schedule."""
    doc = await doctor_service.get_doctor_by_id(doctor_id)
    if not doc:
        raise HTTPException(status_code=404, detail=f"Doctor '{doctor_id}' not found")
    return doc


# ── APPOINTMENT LIFECYCLE ──

@router.get("/appointments", response_model=List[AppointmentResponse])
async def list_appointments(
    user_id: str = Query("demo-user"),
    role: str = Query("patient"),
    status: Optional[str] = Query(None),
    doctor_id: Optional[str] = Query(None),
):
    """List appointments filtered by patient, clinician role, or status."""
    return await appointment_service.list_appointments(
        user_id=user_id,
        role=role,
        status=status,
        doctor_id=doctor_id,
    )


@router.post("/appointments", response_model=AppointmentResponse)
async def create_appointment(appointment: AppointmentCreate):
    """Book a new consultation with double-booking prevention."""
    return await appointment_service.create_appointment(appointment)


@router.get("/appointments/{appointment_id}", response_model=AppointmentResponse)
async def get_appointment(appointment_id: str):
    """Retrieve a single appointment by ID."""
    apt = await appointment_service.get_appointment(appointment_id)
    if not apt:
        raise HTTPException(status_code=404, detail=f"Appointment '{appointment_id}' not found")
    return apt


@router.patch("/appointments/{appointment_id}", response_model=AppointmentResponse)
async def update_appointment(appointment_id: str, update: AppointmentUpdate):
    """Reschedule, cancel, confirm, or complete an appointment."""
    return await appointment_service.update_appointment(appointment_id, update)


@router.delete("/appointments/{appointment_id}")
async def delete_appointment(appointment_id: str):
    """Delete or permanently remove an appointment record."""
    return await appointment_service.delete_appointment(appointment_id)


# ── TELEHEALTH VIDEO (frozen for the MVP, docs/SPEC.md §1.2) ──
# The WebRTC signalling relay and LiveKit token code were removed from the active
# path; both endpoints answer "Not in MVP" until video consultation is in scope.

@router.websocket("/ws/signaling/{room_name}")
async def websocket_signaling_endpoint(websocket: WebSocket, room_name: str):
    await websocket.close(code=1008, reason=NOT_IN_MVP_DETAIL)


@router.get("/appointments/{appointment_id}/video-token")
async def get_video_call_token(appointment_id: str):
    raise not_in_mvp()


# ── CLINICIAN PATIENT REVIEWS ──

@router.get("/doctor/reviews", response_model=List[PatientReviewResponse])
async def list_patient_reviews(
    clinician_id: Optional[str] = Query("doc-pune-001"),
    status: Optional[str] = Query(None),
):
    """List patient screening assessments flagged for clinician human oversight."""
    return await patient_review_service.list_reviews(clinician_id=clinician_id, status=status)


@router.get("/doctor/reviews/{assessment_id}", response_model=PatientReviewResponse)
async def get_patient_review(assessment_id: str):
    """Retrieve detailed clinical review dossier for a patient assessment."""
    review = await patient_review_service.get_review(assessment_id)
    if not review:
        raise HTTPException(status_code=404, detail=f"Review record for assessment '{assessment_id}' not found")
    return review


@router.patch("/doctor/reviews/{assessment_id}", response_model=PatientReviewResponse)
async def update_patient_review(assessment_id: str, update: PatientReviewUpdate):
    """Submit clinician review notes, update review status (in_review, reviewed), and record timestamp."""
    return await patient_review_service.update_review(assessment_id, update)
