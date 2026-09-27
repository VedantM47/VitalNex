"""
Doctor and Appointment Service Implementations.
Transparent care matching with deterministic synthetic demo clinicians.
"""

import uuid
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from apps.api.schemas import (
    DoctorResponse,
    DoctorFilter,
    DoctorLocation,
    DoctorAvailabilitySlot,
    AppointmentCreate,
    AppointmentResponse,
)
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
        self._appointments: List[AppointmentResponse] = [
            AppointmentResponse(
                id="apt-demo-001",
                patient_id="patient-demo-01",
                doctor_id="doc-pune-001",
                doctor_name="Dr. Anand Joshi",
                doctor_specialization="Cardiology & Preventive Heart Health",
                appointment_time=datetime.now(timezone.utc) + timedelta(days=2, hours=3),
                status="scheduled",
                consultation_type="video",
                patient_reason="Preventive cardiac screening review following VITALNEX assessment.",
                meeting_link="https://meet.vitalnex.health/room-demo-8492",
                created_at=datetime.now(timezone.utc) - timedelta(hours=12),
                updated_at=datetime.now(timezone.utc) - timedelta(hours=12),
            )
        ]

    async def create_appointment(self, appointment: AppointmentCreate) -> AppointmentResponse:
        doc = await self._doctor_service.get_doctor_by_id(appointment.doctor_id)
        doc_name = doc.full_name if doc else "Specialist Doctor"
        doc_spec = doc.specialization if doc else "Clinical Medicine"

        new_apt = AppointmentResponse(
            id=f"apt-{uuid.uuid4().hex[:8]}",
            patient_id=appointment.patient_id,
            doctor_id=appointment.doctor_id,
            doctor_name=doc_name,
            doctor_specialization=doc_spec,
            appointment_time=appointment.appointment_time,
            status="scheduled",
            consultation_type=appointment.consultation_type,
            patient_reason=appointment.patient_reason,
            meeting_link=f"https://meet.vitalnex.health/room-{uuid.uuid4().hex[:6]}",
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        self._appointments.append(new_apt)
        return new_apt

    async def list_appointments(self, user_id: str, role: str) -> List[AppointmentResponse]:
        if role == "doctor":
            return [a for a in self._appointments if a.doctor_id == user_id or a.doctor_name in user_id]
        return [a for a in self._appointments if a.patient_id == user_id or user_id == "demo-user"]
