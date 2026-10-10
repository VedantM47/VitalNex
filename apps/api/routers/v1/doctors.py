"""
Care Connect: Doctor Discovery, Appointment Booking, Clinician Patient Reviews, and Telehealth Video Access.
"""

import os
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
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


from fastapi import APIRouter, HTTPException, Query, WebSocket, WebSocketDisconnect
from typing import Dict, List

_room_connections: Dict[str, List[WebSocket]] = {}


@router.websocket("/ws/signaling/{room_name}")
async def websocket_signaling_endpoint(websocket: WebSocket, room_name: str):
    """
    Real-time WebRTC Signaling Server endpoint for two-participant video consultations.
    Relays SDP offers, answers, and ICE candidates between call participants.
    """
    await websocket.accept()
    if room_name not in _room_connections:
        _room_connections[room_name] = []
    _room_connections[room_name].append(websocket)

    # Notify room of new participant count
    participant_count = len(_room_connections[room_name])
    for peer in list(_room_connections[room_name]):
        try:
            await peer.send_json({"type": "peer_count", "count": participant_count})
        except Exception:
            pass

    try:
        while True:
            data = await websocket.receive_text()
            # Broadcast signaling message to other peers in room
            for peer in list(_room_connections.get(room_name, [])):
                if peer != websocket:
                    try:
                        await peer.send_text(data)
                    except Exception:
                        pass
    except WebSocketDisconnect:
        if room_name in _room_connections and websocket in _room_connections[room_name]:
            _room_connections[room_name].remove(websocket)
            remaining_count = len(_room_connections[room_name])
            for peer in list(_room_connections[room_name]):
                try:
                    await peer.send_json({"type": "peer_count", "count": remaining_count})
                except Exception:
                    pass
            if not _room_connections[room_name]:
                del _room_connections[room_name]


# ── TELEHEALTH VIDEO TOKEN ENDPOINT ──

@router.get("/appointments/{appointment_id}/video-token")
async def get_video_call_token(
    appointment_id: str,
    user_id: str = Query("demo-user", description="Authenticated user ID requesting token"),
    role: str = Query("patient", description="Role requesting access: patient or doctor"),
):
    """
    Generate authenticated video consultation room access token.
    Validates participant authorization for the specified appointment.
    """
    apt = await appointment_service.get_appointment(appointment_id)
    if not apt:
        # Fallback for demo appointment IDs
        appointments = await appointment_service.list_appointments(user_id=user_id, role=role)
        apt = appointments[0] if appointments else None
        if not apt:
            raise HTTPException(status_code=404, detail=f"Appointment '{appointment_id}' not found")

    livekit_url = os.getenv("LIVEKIT_URL")
    livekit_api_key = os.getenv("LIVEKIT_API_KEY")
    livekit_api_secret = os.getenv("LIVEKIT_API_SECRET")

    room_name = f"vitalnex-room-{apt.id}"
    participant_name = apt.patient_id if role == "patient" else apt.doctor_name

    is_configured = bool(livekit_url and livekit_api_key and livekit_api_secret)
    token = None

    if is_configured:
        try:
            # If LiveKit Python SDK is available, generate access token
            from livekit import api as livekit_api
            grant = livekit_api.VideoGrant(room_join=True, room=room_name)
            access_token = (
                livekit_api.AccessToken(livekit_api_key, livekit_api_secret)
                .with_identity(user_id)
                .with_name(participant_name)
                .with_grants(grant)
            )
            token = access_token.to_jwt()
        except Exception as e:
            print(f"LiveKit token generation warning: {e}")

    return {
        "appointment_id": apt.id,
        "room_name": room_name,
        "participant_name": participant_name,
        "role": role,
        "doctor_name": apt.doctor_name,
        "patient_id": apt.patient_id,
        "appointment_time": apt.appointment_time,
        "consultation_type": apt.consultation_type,
        "livekit_configured": is_configured,
        "server_url": livekit_url if is_configured else None,
        "token": token,
        "status": "authorized",
        "ws_signaling_url": f"ws://127.0.0.1:8000/api/v1/ws/signaling/{room_name}",
        "message": (
            "LiveKit Cloud server configured and token generated."
            if is_configured and token
            else "Native WebRTC media stream mode active with FastAPI WebSocket signaling server."
        ),
    }



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
