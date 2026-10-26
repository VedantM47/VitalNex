"""
Services package initialization.
"""

from .prediction_service import PredictionService
from .doctor_service import DoctorService, AppointmentService, ReviewQueueService
from .assistant_service import AgentService
from .governance_service import GovernanceService, ModelRegistryService

# Global service singletons (stateless; all data lives in Supabase)
prediction_service = PredictionService()
doctor_service = DoctorService()
appointment_service = AppointmentService(doctor_service)
review_queue_service = ReviewQueueService()
agent_service = AgentService()
governance_service = GovernanceService()
model_registry_service = ModelRegistryService()

__all__ = [
    "prediction_service",
    "doctor_service",
    "appointment_service",
    "review_queue_service",
    "agent_service",
    "governance_service",
    "model_registry_service",
]
