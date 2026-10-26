"""
Services package initialization.
"""

from .base import (
    IPredictionService,
    IModelRegistryService,
    IExplainabilityService,
    IFairnessService,
    IUncertaintyService,
    ISafetyService,
    IGovernanceService,
    IHealthProfileService,
    IPersonalizationService,
    IDoctorService,
    IAppointmentService,
    IRealtimeService,
    IAgentService,
    IAuditService,
)
from .prediction_service import PredictionService
from .doctor_service import DoctorService, AppointmentService, PatientReviewService
from .assistant_service import AgentService
from .governance_service import GovernanceService, ModelRegistryService, HealthProfileService

# Global service singletons
prediction_service = PredictionService()
doctor_service = DoctorService()
appointment_service = AppointmentService(doctor_service)
patient_review_service = PatientReviewService()
agent_service = AgentService()
governance_service = GovernanceService()
model_registry_service = ModelRegistryService()
health_profile_service = HealthProfileService()

__all__ = [
    "IPredictionService",
    "IModelRegistryService",
    "IExplainabilityService",
    "IFairnessService",
    "IUncertaintyService",
    "ISafetyService",
    "IGovernanceService",
    "IHealthProfileService",
    "IPersonalizationService",
    "IDoctorService",
    "IAppointmentService",
    "IRealtimeService",
    "IAgentService",
    "IAuditService",
    "prediction_service",
    "doctor_service",
    "appointment_service",
    "agent_service",
    "governance_service",
    "model_registry_service",
    "health_profile_service",
]
