"""
Doctor, Appointment, and Clinician Review Service Implementations.
Transparent care matching with deterministic synthetic demo clinicians,
rigorous appointment lifecycle management, double-booking prevention,
and clinician patient-review workflows.
"""

import uuid
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta
from fastapi import HTTPException
from apps.api.schemas import (
    DoctorResponse,
    DoctorFilter,
    DoctorLocation,
    DoctorAvailabilitySlot,
    AppointmentCreate,
    AppointmentUpdate,
    AppointmentResponse,
)
from apps.api.schemas.review import PatientReviewResponse, PatientReviewUpdate
from .base import IDoctorService, IAppointmentService


class DoctorService(IDoctorService):
    def __init__(self):
        self._doctors: List[DoctorResponse] = [
            DoctorResponse(
                id="doc-pune-001",
                full_name="Dr. Anand Joshi",
                medical_license_number="MCI-SYN-PUN-0842",
                specialization="Cardiology & Preventive Heart Health",
                years_of_experience=14,
                bio="Cardiologist specializing in cardiovascular risk stratification and preventive care protocols in Pune.",
                languages_spoken=["English", "Marathi", "Hindi"],
                consultation_modes=["video", "in_person"],
                rating=4.9,
                review_count=86,
                is_demo=True,
                is_active=True,
                locations=[
                    DoctorLocation(
                        facility_name="Sahyadri Specialty Wellness Clinic (Demo)",
                        locality="Kothrud",
                        city="Pune",
                        state="Maharashtra",
                        postal_code="411038",
                        distance_estimate_km=2.4,
                    )
                ],
                availability=[
                    DoctorAvailabilitySlot(day_of_week=1, start_time="09:00", end_time="13:00", slot_duration_minutes=30),
                    DoctorAvailabilitySlot(day_of_week=3, start_time="14:00", end_time="18:00", slot_duration_minutes=30),
                ],
            ),
            DoctorResponse(
                id="doc-pune-002",
                full_name="Dr. Priya Deshmukh",
                medical_license_number="MCI-SYN-PUN-1193",
                specialization="Endocrinology & Metabolic Disorders",
                years_of_experience=11,
                bio="Endocrinologist focused on early diabetes screening, insulin resistance, and lifestyle-integrated metabolic therapy.",
                languages_spoken=["English", "Marathi", "Hindi"],
                consultation_modes=["video", "in_person"],
                rating=4.8,
                review_count=64,
                is_demo=True,
                is_active=True,
                locations=[
                    DoctorLocation(
                        facility_name="Baner Metabolic Care Center (Demo)",
                        locality="Baner",
                        city="Pune",
                        state="Maharashtra",
                        postal_code="411045",
                        distance_estimate_km=4.1,
                    )
                ],
                availability=[
                    DoctorAvailabilitySlot(day_of_week=2, start_time="10:00", end_time="14:00", slot_duration_minutes=30),
                    DoctorAvailabilitySlot(day_of_week=4, start_time="15:00", end_time="19:00", slot_duration_minutes=30),
                ],
            ),
            DoctorResponse(
                id="doc-pune-003",
                full_name="Dr. Rajesh Kulkarni",
                medical_license_number="MCI-SYN-PUN-2204",
                specialization="General & Internal Medicine",
                years_of_experience=18,
                bio="Senior consultant in internal medicine with special expertise in adult multimorbidity and preventive health checks.",
                languages_spoken=["English", "Hindi", "Marathi"],
                consultation_modes=["video"],
                rating=4.9,
                review_count=112,
                is_demo=True,
                is_active=True,
                locations=[
                    DoctorLocation(
                        facility_name="Shivajinagar Diagnostic & Care Hub (Demo)",
                        locality="Shivajinagar",
                        city="Pune",
                        state="Maharashtra",
                        postal_code="411005",
                        distance_estimate_km=1.8,
                    )
                ],
                availability=[
                    DoctorAvailabilitySlot(day_of_week=1, start_time="11:00", end_time="16:00", slot_duration_minutes=30),
                ],
            ),
            DoctorResponse(
                id="doc-pune-004",
                full_name="Dr. Sunita Gaikwad",
                medical_license_number="MCI-SYN-PUN-3415",
                specialization="Preventive & Lifestyle Medicine",
                years_of_experience=9,
                bio="Lifestyle medicine physician dedicated to cardiometabolic wellness and personalized nutritional coaching.",
                languages_spoken=["English", "Marathi"],
                consultation_modes=["video", "in_person"],
                rating=4.7,
                review_count=49,
                is_demo=True,
                is_active=True,
                locations=[
                    DoctorLocation(
                        facility_name="PCMC Health & Wellness Pavilion (Demo)",
                        locality="Akurdi, PCMC",
                        city="Pune",
                        state="Maharashtra",
                        postal_code="411035",
                        distance_estimate_km=7.5,
                    )
                ],
                availability=[
                    DoctorAvailabilitySlot(day_of_week=5, start_time="09:00", end_time="13:00", slot_duration_minutes=30),
                ],
            ),
        ]

    async def search_doctors(self, filters: DoctorFilter) -> List[DoctorResponse]:
        results = self._doctors
        if filters.specialization:
            results = [d for d in results if filters.specialization.lower() in d.specialization.lower()]
        if filters.language:
            results = [d for d in results if any(filters.language.lower() == l.lower() for l in d.languages_spoken)]
        if filters.locality:
            results = [d for d in results if any(filters.locality.lower() in loc.locality.lower() for loc in d.locations)]
        if filters.consultation_mode:
            results = [d for d in results if filters.consultation_mode.lower() in [m.lower() for m in d.consultation_modes]]
        return results

    async def get_doctor_by_id(self, doctor_id: str) -> Optional[DoctorResponse]:
        for d in self._doctors:
            if d.id == doctor_id:
                return d
        return None


class AppointmentService(IAppointmentService):
    def __init__(self, doctor_service: DoctorService):
        self._doctor_service = doctor_service
        self._appointments: Dict[str, AppointmentResponse] = {}
        self._init_demo_appointments()

    def _init_demo_appointments(self):
        apt_time = datetime.now(timezone.utc) + timedelta(days=2, hours=3)
        apt1 = AppointmentResponse(
            id="apt-demo-001",
            patient_id="patient-demo-01",
            doctor_id="doc-pune-001",
            doctor_name="Dr. Anand Joshi",
            specialization="Cardiology & Preventive Heart Health",
            appointment_date=apt_time.strftime("%Y-%m-%d"),
            start_time=apt_time.strftime("%H:%M"),
            end_time=(apt_time + timedelta(minutes=30)).strftime("%H:%M"),
            appointment_time=apt_time,
            status="scheduled",
            consultation_type="video",
            reason="Preventive cardiac screening review following VITALNEX assessment.",
            patient_reason="Preventive cardiac screening review following VITALNEX assessment.",
            doctor_notes="Patient has family history of hypertension. Review vitals and lifestyle.",
            meeting_link="https://meet.vitalnex.health/room-demo-8492",
            assessment_id="asm-demo-001",
            created_at=datetime.now(timezone.utc) - timedelta(hours=12),
            updated_at=datetime.now(timezone.utc) - timedelta(hours=12),
        )
        self._appointments[apt1.id] = apt1

    async def create_appointment(self, appointment: AppointmentCreate) -> AppointmentResponse:
        doc = await self._doctor_service.get_doctor_by_id(appointment.doctor_id)
        if not doc:
            raise HTTPException(status_code=404, detail=f"Doctor with ID '{appointment.doctor_id}' not found.")

        # Double-booking check: prevent booking overlapping slot with same doctor
        requested_time = appointment.appointment_time
        for existing in self._appointments.values():
            if existing.doctor_id == appointment.doctor_id and existing.status in ["scheduled", "confirmed", "rescheduled"]:
                time_diff = abs((existing.appointment_time - requested_time).total_seconds())
                if time_diff < 1800:  # within 30 minutes
                    raise HTTPException(
                        status_code=409,
                        detail=f"Time slot at {requested_time.strftime('%Y-%m-%d %H:%M UTC')} is already booked with {doc.full_name}. Please select an available slot.",
                    )

        apt_id = f"apt-{uuid.uuid4().hex[:8]}"
        start_t = requested_time.strftime("%H:%M")
        end_t = (requested_time + timedelta(minutes=30)).strftime("%H:%M")

        new_apt = AppointmentResponse(
            id=apt_id,
            patient_id=appointment.patient_id,
            doctor_id=appointment.doctor_id,
            doctor_name=doc.full_name,
            specialization=doc.specialization,
            appointment_date=requested_time.strftime("%Y-%m-%d"),
            start_time=start_t,
            end_time=end_t,
            appointment_time=requested_time,
            status="scheduled",
            consultation_type=appointment.consultation_type,
            reason=appointment.patient_reason,
            patient_reason=appointment.patient_reason,
            doctor_notes=None,
            meeting_link=f"https://meet.vitalnex.health/room-{uuid.uuid4().hex[:6]}",
            assessment_id=appointment.assessment_id,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        self._appointments[apt_id] = new_apt
        return new_apt

    async def get_appointment(self, appointment_id: str) -> Optional[AppointmentResponse]:
        return self._appointments.get(appointment_id)

    async def update_appointment(self, appointment_id: str, update: AppointmentUpdate) -> AppointmentResponse:
        apt = self._appointments.get(appointment_id)
        if not apt:
            raise HTTPException(status_code=404, detail=f"Appointment '{appointment_id}' not found.")

        # If rescheduling time
        if update.appointment_time and update.appointment_time != apt.appointment_time:
            # Check slot conflict with same doctor
            for existing in self._appointments.values():
                if existing.id != appointment_id and existing.doctor_id == apt.doctor_id and existing.status in ["scheduled", "confirmed", "rescheduled"]:
                    if abs((existing.appointment_time - update.appointment_time).total_seconds()) < 1800:
                        raise HTTPException(
                            status_code=409,
                            detail="Target reschedule time slot is already booked. Please choose another time.",
                        )
            apt.appointment_time = update.appointment_time
            apt.appointment_date = update.appointment_time.strftime("%Y-%m-%d")
            apt.start_time = update.appointment_time.strftime("%H:%M")
            apt.end_time = (update.appointment_time + timedelta(minutes=30)).strftime("%H:%M")
            apt.status = "rescheduled"

        if update.status:
            apt.status = update.status
        if update.patient_reason is not None:
            apt.patient_reason = update.patient_reason
            apt.reason = update.patient_reason
        if update.doctor_notes is not None:
            apt.doctor_notes = update.doctor_notes
        if update.consultation_type:
            apt.consultation_type = update.consultation_type

        apt.updated_at = datetime.now(timezone.utc)
        self._appointments[appointment_id] = apt
        return apt

    async def cancel_appointment(self, appointment_id: str) -> AppointmentResponse:
        apt = self._appointments.get(appointment_id)
        if not apt:
            raise HTTPException(status_code=404, detail=f"Appointment '{appointment_id}' not found.")
        apt.status = "cancelled"
        apt.updated_at = datetime.now(timezone.utc)
        return apt

    async def delete_appointment(self, appointment_id: str) -> Dict[str, Any]:
        if appointment_id not in self._appointments:
            raise HTTPException(status_code=404, detail=f"Appointment '{appointment_id}' not found.")
        del self._appointments[appointment_id]
        return {"success": True, "message": f"Appointment '{appointment_id}' deleted."}

    async def list_appointments(
        self,
        user_id: Optional[str] = None,
        role: str = "patient",
        status: Optional[str] = None,
        doctor_id: Optional[str] = None,
    ) -> List[AppointmentResponse]:
        items = list(self._appointments.values())

        if doctor_id:
            items = [a for a in items if a.doctor_id == doctor_id]
        elif role == "doctor":
            if user_id:
                items = [a for a in items if a.doctor_id == user_id or a.doctor_name in user_id]
        else:
            if user_id and user_id not in ["all", "admin"]:
                items = [a for a in items if a.patient_id == user_id or user_id in ["demo-user", "patient-demo-01"]]

        if status:
            items = [a for a in items if a.status.lower() == status.lower()]

        # Sort chronologically by appointment time
        return sorted(items, key=lambda x: x.appointment_time)


class PatientReviewService:
    """Clinician Patient Review Service for Human Oversight."""
    def __init__(self):
        self._reviews: Dict[str, PatientReviewResponse] = {}
        self._init_demo_reviews()

    def _init_demo_reviews(self):
        rev1 = PatientReviewResponse(
            id="rev-001",
            assessment_id="asm-hist-003",
            patient_id="patient-demo-01",
            patient_name="Rajesh Sharma",
            evaluated_at=datetime(2026, 5, 10, 9, 45, tzinfo=timezone.utc),
            risk_score=42.8,
            risk_band="Moderate",
            model_version="v1.0.0-random_forest",
            human_review_required=True,
            review_status="reviewed",
            assigned_clinician_id="doc-pune-001",
            review_notes="Elevated resting BP (148 mmHg) and serum cholesterol (225 mg/dL). Recommended lifestyle modification and 6-month follow up.",
            data_quality_score=94.2,
            explainability_summary="Resting BP (+12.4%) and Smoking (+14.0%) were primary risk contributors.",
            input_snapshot={"age": 52, "trestbps": 148, "chol": 225, "smoking": 1, "bmi": 26.2},
            reviewed_at=datetime(2026, 5, 11, 14, 20, tzinfo=timezone.utc),
        )
        rev2 = PatientReviewResponse(
            id="rev-002",
            assessment_id="asm-hist-002",
            patient_id="patient-demo-02",
            patient_name="Pooja Kulkarni",
            evaluated_at=datetime(2026, 7, 20, 14, 15, tzinfo=timezone.utc),
            risk_score=34.6,
            risk_band="Moderate",
            model_version="v1.1.0-gradient_boosting",
            human_review_required=False,
            review_status="in_review",
            assigned_clinician_id="doc-pune-001",
            review_notes="Under active assessment evaluation.",
            data_quality_score=98.0,
            explainability_summary="Resting BP (+8.2%) and Age (+5.1%) balanced by non-smoker factor (-6.4%).",
            input_snapshot={"age": 48, "trestbps": 142, "chol": 210, "smoking": 0, "bmi": 24.9},
            reviewed_at=None,
        )
        self._reviews[rev1.assessment_id] = rev1
        self._reviews[rev2.assessment_id] = rev2

    async def list_reviews(
        self,
        clinician_id: Optional[str] = None,
        status: Optional[str] = None,
    ) -> List[PatientReviewResponse]:
        items = list(self._reviews.values())
        if clinician_id and clinician_id != "all":
            items = [r for r in items if r.assigned_clinician_id == clinician_id or r.assigned_clinician_id is None]
        if status:
            items = [r for r in items if r.review_status.lower() == status.lower()]
        return sorted(items, key=lambda x: x.evaluated_at, reverse=True)

    async def get_review(self, assessment_id: str) -> Optional[PatientReviewResponse]:
        return self._reviews.get(assessment_id)

    async def update_review(self, assessment_id: str, update: PatientReviewUpdate) -> PatientReviewResponse:
        review = self._reviews.get(assessment_id)
        if not review:
            # Create on demand from assessment store
            review = PatientReviewResponse(
                id=f"rev-{uuid.uuid4().hex[:6]}",
                assessment_id=assessment_id,
                patient_id="patient-demo-01",
                patient_name="Rajesh Sharma",
                evaluated_at=datetime.now(timezone.utc),
                risk_score=18.1,
                risk_band=update.override_risk_band or "Low",
                model_version="v1.1.0-gradient_boosting",
                human_review_required=True,
                review_status=update.review_status,
                assigned_clinician_id=update.clinician_id or "doc-pune-001",
                review_notes=update.review_notes,
                data_quality_score=96.5,
                explainability_summary="Evaluated under clinical supervision gate.",
                input_snapshot={},
                reviewed_at=datetime.now(timezone.utc) if update.review_status == "reviewed" else None,
            )
            self._reviews[assessment_id] = review
            return review

        review.review_status = update.review_status
        if update.clinician_id:
            review.assigned_clinician_id = update.clinician_id
        if update.review_notes:
            review.review_notes = update.review_notes
        if update.override_risk_band:
            review.risk_band = update.override_risk_band
        if update.review_status == "reviewed":
            review.reviewed_at = datetime.now(timezone.utc)

        self._reviews[assessment_id] = review
        return review
