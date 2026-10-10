"""
Services package initialization.
"""

from .base import (
    IPredictionService,
    IModelRegistryService,
    IDatasetService,
    IExplainabilityService,
    IFairnessService,
    IUncertaintyService,
    ISafetyService,
    ITrustPassportService,
    IGovernanceService,
    IHealthProfileService,
    IPersonalizationService,
    IDoctorService,
    IAppointmentService,
    IVoiceService,
    IRealtimeService,
    IAgentService,
    IAuditService,
)
from .dataset_service import DatasetService
from .prediction_service import PredictionService, TrustPassportService
from .doctor_service import DoctorService, AppointmentService, PatientReviewService
from .assistant_service import AgentService, VoiceService
from .governance_service import GovernanceService, ModelRegistryService, HealthProfileService

# Global service singletons
dataset_service = DatasetService()
prediction_service = PredictionService()
trust_passport_service = TrustPassportService()
doctor_service = DoctorService()
appointment_service = AppointmentService(doctor_service)
patient_review_service = PatientReviewService()
agent_service = AgentService()
voice_service = VoiceService()
governance_service = GovernanceService()
model_registry_service = ModelRegistryService()
health_profile_service = HealthProfileService()

__all__ = [
    "IPredictionService",
    "IModelRegistryService",
    "IDatasetService",
    "IExplainabilityService",
    "IFairnessService",
    "IUncertaintyService",
    "ISafetyService",
    "ITrustPassportService",
    "IGovernanceService",
    "IHealthProfileService",
    "IPersonalizationService",
    "IDoctorService",
    "IAppointmentService",
    "IVoiceService",
    "IRealtimeService",
    "IAgentService",
    "IAuditService",
    "dataset_service",
    "prediction_service",
    "trust_passport_service",
    "doctor_service",
    "appointment_service",
    "agent_service",
    "voice_service",
    "governance_service",
    "model_registry_service",
    "health_profile_service",
]
