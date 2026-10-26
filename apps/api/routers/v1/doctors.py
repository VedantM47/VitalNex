"""
Care Connect: doctor directory, appointment booking and the clinician review queue.
"""

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, WebSocket
from postgrest import AsyncPostgrestClient

from apps.api.core.auth import CurrentUser, get_user_db, require_role
from apps.api.core.frozen import NOT_IN_MVP_DETAIL, not_in_mvp
from apps.api.schemas import (
    AppointmentCreate,
    AppointmentResponse,
    AppointmentUpdate,
    DoctorFilter,
    DoctorResponse,
    ReviewQueueItem,
)
from apps.api.services import appointment_service, doctor_service, review_queue_service

router = APIRouter(tags=["Care Connect & Appointments"])

any_role = require_role("patient", "doctor", "admin")


# ── DOCTOR DIRECTORY (public: synthetic demo doctors only) ──

@router.get("/doctors", response_model=List[DoctorResponse])
async def list_doctors(
    specialization: Optional[str] = Query(None, description="Specialization code, e.g. cardiology"),
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
        raise HTTPException(status_code=404, detail=f"Doctor '{doctor_id}' not found")
    return doc


# ── APPOINTMENTS ──

@router.get("/appointments", response_model=List[AppointmentResponse])
async def list_appointments(
    status: Optional[str] = Query(None),
    user: CurrentUser = Depends(require_role("patient", "doctor")),
    db: AsyncPostgrestClient = Depends(get_user_db),
):
    """A patient sees their own bookings; a doctor sees bookings with them."""
    return await appointment_service.list_appointments(user, db, status=status)


@router.post("/appointments", response_model=AppointmentResponse)
async def create_appointment(
    booking: AppointmentCreate,
    user: CurrentUser = Depends(require_role("patient")),
):
    return await appointment_service.create_appointment(user, booking)


@router.get("/appointments/{appointment_id}", response_model=AppointmentResponse)
async def get_appointment(
    appointment_id: str,
    user: CurrentUser = Depends(require_role("patient", "doctor")),
    db: AsyncPostgrestClient = Depends(get_user_db),
):
    apt = await appointment_service.get_appointment(user, db, appointment_id)
    if not apt:
        raise HTTPException(status_code=404, detail=f"Appointment '{appointment_id}' not found")
    return apt


@router.patch("/appointments/{appointment_id}", response_model=AppointmentResponse)
async def update_appointment(
    appointment_id: str,
    update: AppointmentUpdate,
    user: CurrentUser = Depends(require_role("patient", "doctor")),
    db: AsyncPostgrestClient = Depends(get_user_db),
):
    """Patients can cancel. Doctors can confirm, complete or cancel and add notes."""
    return await appointment_service.update_appointment(user, db, appointment_id, update)


# ── TELEHEALTH VIDEO (frozen for the MVP, docs/SPEC.md §1.2) ──

@router.websocket("/ws/signaling/{room_name}")
async def websocket_signaling_endpoint(websocket: WebSocket, room_name: str):
    await websocket.close(code=1008, reason=NOT_IN_MVP_DETAIL)


@router.get("/appointments/{appointment_id}/video-token")
async def get_video_call_token(appointment_id: str):
    raise not_in_mvp()


# ── CLINICIAN REVIEW QUEUE ──

@router.get("/doctor/reviews", response_model=List[ReviewQueueItem])
async def list_review_queue(
    status: Optional[str] = Query(None, pattern="^(pending|agreed|overridden)$"),
    user: CurrentUser = Depends(require_role("doctor")),
    db: AsyncPostgrestClient = Depends(get_user_db),
):
    """Only patients with an active share_with_clinician consent appear (RLS)."""
    return await review_queue_service.list_items(db, status=status)


@router.get("/doctor/reviews/{assessment_id}", response_model=ReviewQueueItem)
async def get_review_item(
    assessment_id: str,
    user: CurrentUser = Depends(require_role("doctor")),
    db: AsyncPostgrestClient = Depends(get_user_db),
):
    item = await review_queue_service.get_item(db, assessment_id)
    if not item:
        raise HTTPException(status_code=404, detail=f"No review item for assessment '{assessment_id}'")
    return item


@router.patch("/doctor/reviews/{assessment_id}")
async def update_review_item(assessment_id: str, user: CurrentUser = Depends(require_role("doctor"))):
    # TODO(P6): Agree / Override with a required reason code (writes clinician_overrides).
    raise HTTPException(status_code=503, detail="Clinician review actions are not available yet (P6).")
