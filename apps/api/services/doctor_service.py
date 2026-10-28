"""
Care connect (synthetic demo doctors + slots), appointments and the clinician review
queue, all backed by Supabase.

Reads that belong to a user go through their RLS-scoped client; bookings and status
changes are written with the service role after the API has checked ownership, so a
patient cannot book a taken slot or rewrite a doctor's notes.
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import HTTPException
from postgrest import AsyncPostgrestClient
from postgrest.exceptions import APIError

from apps.api.core.auth import CurrentUser
from apps.api.core.db import service_db
from apps.api.schemas import (
    AppointmentCreate,
    AppointmentResponse,
    AppointmentUpdate,
    DoctorFilter,
    DoctorResponse,
    ReviewQueueItem,
)

NEXT_SLOTS_SHOWN = 10
DOCTOR_SELECT = "*, doctor_locations(*)"
UNIQUE_VIOLATION = "23505"


async def _specialization_titles() -> Dict[str, str]:
    res = await service_db().table("doctor_specializations").select("code, title_en").execute()
    return {r["code"]: r["title_en"] for r in res.data}


async def _free_slots(doctor_ids: List[str]) -> Dict[str, List[dict]]:
    """Upcoming slots per doctor that no active appointment holds."""
    if not doctor_ids:
        return {}
    db = service_db()
    now = datetime.now(timezone.utc).isoformat()
    slots = (
        await db.table("doctor_slots")
        .select("id, doctor_id, starts_at, ends_at")
        .in_("doctor_id", doctor_ids)
        .gt("starts_at", now)
        .order("starts_at")
        .execute()
    ).data
    taken = {
        r["slot_id"]
        for r in (
            await db.table("appointments").select("slot_id").in_("doctor_id", doctor_ids).neq("status", "cancelled").execute()
        ).data
        if r["slot_id"]
    }
    out: Dict[str, List[dict]] = {d: [] for d in doctor_ids}
    for s in slots:
        if s["id"] not in taken and len(out[s["doctor_id"]]) < NEXT_SLOTS_SHOWN:
            out[s["doctor_id"]].append(s)
    return out


def _doctor_response(row: dict, titles: Dict[str, str], slots: List[dict]) -> DoctorResponse:
    code = row["specialization"]
    return DoctorResponse(
        id=row["id"],
        full_name=row["full_name"],
        medical_license_number=row["medical_license_number"],
        specialization=titles.get(code, code),
        specialization_code=code,
        years_of_experience=row["years_of_experience"],
        bio=row.get("bio"),
        languages_spoken=row["languages_spoken"],
        consultation_modes=row["consultation_modes"],
        rating=row.get("rating"),
        review_count=row.get("review_count"),
        is_demo=row["is_demo"],
        is_active=row["is_active"],
        locations=row.get("doctor_locations") or [],
        next_slots=slots,
    )


class DoctorService:
    async def search_doctors(self, filters: DoctorFilter) -> List[DoctorResponse]:
        query = service_db().table("doctors").select(DOCTOR_SELECT).eq("is_active", True).order("full_name")
        if filters.specialization:
            query = query.eq("specialization", filters.specialization)
        rows = (await query.execute()).data
        if filters.language:
            rows = [r for r in rows if any(filters.language.lower() == l.lower() for l in r["languages_spoken"])]
        if filters.locality:
            rows = [
                r for r in rows
                if any(filters.locality.lower() in loc["locality"].lower() for loc in r.get("doctor_locations") or [])
            ]
        if filters.consultation_mode:
            rows = [r for r in rows if filters.consultation_mode in r["consultation_modes"]]
        titles = await _specialization_titles()
        slots = await _free_slots([r["id"] for r in rows])
        return [_doctor_response(r, titles, slots[r["id"]]) for r in rows]

    async def get_doctor_by_id(self, doctor_id: str) -> Optional[DoctorResponse]:
        res = await service_db().table("doctors").select(DOCTOR_SELECT).eq("id", doctor_id).eq("is_active", True).execute()
        if not res.data:
            return None
        titles = await _specialization_titles()
        slots = await _free_slots([doctor_id])
        return _doctor_response(res.data[0], titles, slots[doctor_id])

    async def doctor_id_for_profile(self, profile_id: str) -> Optional[str]:
        res = await service_db().table("doctors").select("id").eq("profile_id", profile_id).limit(1).execute()
        return res.data[0]["id"] if res.data else None


class AppointmentService:
    def __init__(self, doctor_service: DoctorService):
        self._doctors = doctor_service

    async def _to_responses(self, rows: List[dict], include_patient_name: bool) -> List[AppointmentResponse]:
        if not rows:
            return []
        db = service_db()
        doctor_ids = list({r["doctor_id"] for r in rows})
        doctors = {
            d["id"]: d
            for d in (await db.table("doctors").select("id, full_name, specialization").in_("id", doctor_ids).execute()).data
        }
        titles = await _specialization_titles()
        names: Dict[str, str] = {}
        if include_patient_name:
            # A booking shares the patient's name with that doctor only.
            patient_ids = list({r["patient_id"] for r in rows})
            names = {
                p["id"]: p["full_name"]
                for p in (await db.table("profiles").select("id, full_name").in_("id", patient_ids).execute()).data
            }
        slot_ends = {}
        slot_ids = [r["slot_id"] for r in rows if r.get("slot_id")]
        if slot_ids:
            slot_ends = {
                s["id"]: s["ends_at"]
                for s in (await db.table("doctor_slots").select("id, ends_at").in_("id", slot_ids).execute()).data
            }

        out = []
        for r in rows:
            doc = doctors.get(r["doctor_id"], {})
            start = datetime.fromisoformat(r["appointment_time"])
            end_raw = slot_ends.get(r.get("slot_id"))
            end = datetime.fromisoformat(end_raw) if end_raw else None
            out.append(
                AppointmentResponse(
                    id=r["id"],
                    patient_id=r["patient_id"],
                    doctor_id=r["doctor_id"],
                    doctor_name=doc.get("full_name", ""),
                    specialization=titles.get(doc.get("specialization"), doc.get("specialization", "")),
                    specialization_code=doc.get("specialization"),
                    appointment_date=start.strftime("%Y-%m-%d"),
                    start_time=start.strftime("%H:%M"),
                    end_time=end.strftime("%H:%M") if end else "",
                    appointment_time=start,
                    status=r["status"],
                    consultation_type=r["consultation_type"],
                    reason=r.get("patient_reason"),
                    patient_reason=r.get("patient_reason"),
                    doctor_notes=r.get("doctor_notes"),
                    patient_name=names.get(r["patient_id"]),
                    slot_id=r.get("slot_id"),
                    assessment_id=r.get("assessment_id"),
                    created_at=r["created_at"],
                    updated_at=r["updated_at"],
                )
            )
        return out

    async def list_appointments(
        self, user: CurrentUser, db: AsyncPostgrestClient, status: Optional[str] = None
    ) -> List[AppointmentResponse]:
        # RLS limits the rows to the patient's own, or the doctor's own bookings.
        query = db.table("appointments").select("*").order("appointment_time")
        if status:
            query = query.eq("status", status)
        rows = (await query.execute()).data
        return await self._to_responses(rows, include_patient_name=user.role == "doctor")

    async def get_appointment(
        self, user: CurrentUser, db: AsyncPostgrestClient, appointment_id: str
    ) -> Optional[AppointmentResponse]:
        rows = (await db.table("appointments").select("*").eq("id", appointment_id).execute()).data
        items = await self._to_responses(rows, include_patient_name=user.role == "doctor")
        return items[0] if items else None

    async def create_appointment(self, user: CurrentUser, booking: AppointmentCreate) -> AppointmentResponse:
        db = service_db()
        slot_rows = (await db.table("doctor_slots").select("*").eq("id", booking.slot_id).execute()).data
        if not slot_rows:
            raise HTTPException(status_code=404, detail="That slot does not exist.")
        slot = slot_rows[0]
        if datetime.fromisoformat(slot["starts_at"]) <= datetime.now(timezone.utc):
            raise HTTPException(status_code=409, detail="That slot is in the past. Please pick another one.")
        if booking.assessment_id:
            owned = (
                await db.table("risk_assessments").select("id").eq("id", booking.assessment_id).eq("user_id", user.id).execute()
            ).data
            if not owned:
                raise HTTPException(status_code=404, detail="Assessment not found.")
        try:
            res = await db.table("appointments").insert(
                {
                    "patient_id": user.id,
                    "doctor_id": slot["doctor_id"],
                    "slot_id": slot["id"],
                    "appointment_time": slot["starts_at"],
                    "status": "scheduled",
                    "consultation_type": booking.consultation_type,
                    "patient_reason": booking.patient_reason,
                    "assessment_id": booking.assessment_id,
                }
            ).execute()
        except APIError as e:
            if e.code == UNIQUE_VIOLATION:
                raise HTTPException(status_code=409, detail="That slot was just booked. Please pick another one.")
            raise
        return (await self._to_responses(res.data, include_patient_name=False))[0]

    async def update_appointment(
        self, user: CurrentUser, db: AsyncPostgrestClient, appointment_id: str, update: AppointmentUpdate
    ) -> AppointmentResponse:
        rows = (await db.table("appointments").select("*").eq("id", appointment_id).execute()).data
        if not rows:  # not visible to this user under RLS
            raise HTTPException(status_code=404, detail="Appointment not found.")
        apt = rows[0]
        changes: Dict[str, Any] = {}
        if user.role == "patient":
            if update.doctor_notes is not None or (update.status and update.status != "cancelled"):
                raise HTTPException(status_code=403, detail="Patients can only cancel an appointment.")
        if update.status:
            if apt["status"] in ("cancelled", "completed"):
                raise HTTPException(status_code=409, detail=f"Appointment is already {apt['status']}.")
            changes["status"] = update.status
        if update.doctor_notes is not None:
            changes["doctor_notes"] = update.doctor_notes
        if changes:
            rows = (await service_db().table("appointments").update(changes).eq("id", appointment_id).execute()).data
        return (await self._to_responses(rows, include_patient_name=user.role == "doctor"))[0]


class ReviewQueueService:
    """Clinician work list. Items are added by the assessment pipeline (P4)."""

    async def list_items(self, db: AsyncPostgrestClient, status: Optional[str] = None) -> List[ReviewQueueItem]:
        # RLS: only patients with an active share_with_clinician consent are visible.
        query = db.table("review_queue").select("*, profiles!review_queue_patient_id_fkey(full_name)").order(
            "created_at", desc=True
        )
        if status:
            query = query.eq("status", status)
        rows = (await query.execute()).data
        return [self._item(r) for r in rows]

    async def get_item(self, db: AsyncPostgrestClient, assessment_id: str) -> Optional[ReviewQueueItem]:
        rows = (
            await db.table("review_queue")
            .select("*, profiles!review_queue_patient_id_fkey(full_name)")
            .eq("assessment_id", assessment_id)
            .execute()
        ).data
        return self._item(rows[0]) if rows else None

    @staticmethod
    def _item(row: dict) -> ReviewQueueItem:
        patient = row.pop("profiles", None) or {}
        return ReviewQueueItem(**row, patient_name=patient.get("full_name"))
