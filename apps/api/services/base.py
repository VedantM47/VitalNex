"""
Service interfaces and abstractions for VITALNEX.
Prompts 2 and 3 will plug production ML/DL and Agentic implementations
into these exact interfaces without rewriting API contracts or routers.
"""

from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from apps.api.schemas import (
    ClinicalModelFeatures,
    AssessmentRequest,
    AssessmentResponse,
    TrustPassportResponse,
    DoctorResponse,
    DoctorFilter,
    AppointmentCreate,
    AppointmentResponse,
    AssistantMessageRequest,
    AssistantMessageResponse,
    VoiceTranscribeRequest,
    VoiceTranscribeResponse,
    VoiceSynthesizeRequest,
    VoiceSynthesizeResponse,
    GovernanceSummaryResponse,
    ModelRegistryItem,
    HealthProfileCreate,
    HealthProfileResponse,
)


class IPredictionService(ABC):
    @abstractmethod
    async def predict_risk(self, request: AssessmentRequest) -> AssessmentResponse:
        """Execute risk prediction pipeline."""
        pass


class IModelRegistryService(ABC):
    @abstractmethod
    async def list_models(self) -> List[ModelRegistryItem]:
        """List registered clinical models."""
        pass

    @abstractmethod
    async def get_model(self, model_id: str) -> Optional[ModelRegistryItem]:
        """Get model details by ID."""
        pass


class IDatasetService(ABC):
    @abstractmethod
    def load_dataset(self) -> Any:
        """Load registered dataset."""
        pass

    @abstractmethod
    def get_metadata(self) -> Dict[str, Any]:
        """Return dataset provenance, shapes, columns, and quality metrics."""
        pass

    @abstractmethod
    def get_feature_schema(self) -> Dict[str, Any]:
        """Return schema definition of all 26 clinical and demographic features."""
        pass


class IExplainabilityService(ABC):
    @abstractmethod
    async def compute_shap_explanations(self, features: ClinicalModelFeatures) -> Dict[str, Any]:
        """Compute SHAP / local feature attribution."""
        pass


class IFairnessService(ABC):
    @abstractmethod
    async def evaluate_fairness(self, model_version_id: str) -> Dict[str, Any]:
        """Evaluate demographic parity and equalized odds."""
        pass


class IUncertaintyService(ABC):
    @abstractmethod
    async def estimate_uncertainty(self, features: ClinicalModelFeatures) -> Dict[str, Any]:
        """Calculate confidence intervals and epistemic/aleatoric uncertainty."""
        pass


class ISafetyService(ABC):
    @abstractmethod
    async def validate_safety_boundaries(self, features: ClinicalModelFeatures) -> Dict[str, Any]:
        """Perform out-of-distribution and clinical boundary checks."""
        pass


class ITrustPassportService(ABC):
    @abstractmethod
    async def generate_passport(self, assessment_id: str) -> TrustPassportResponse:
        """Assemble the 11-dimension AI Trust Passport."""
        pass


class IGovernanceService(ABC):
    @abstractmethod
    async def get_summary(self) -> GovernanceSummaryResponse:
        """Return clinical AI governance overview."""
        pass


class IHealthProfileService(ABC):
    @abstractmethod
    async def get_profile(self, user_id: str) -> Optional[HealthProfileResponse]:
        """Fetch user health profile."""
        pass

    @abstractmethod
    async def save_profile(self, profile: HealthProfileCreate) -> HealthProfileResponse:
        """Create or update user health profile."""
        pass


class IPersonalizationService(ABC):
    @abstractmethod
    async def generate_lifestyle_insights(self, user_id: str) -> Dict[str, Any]:
        """Generate tailored lifestyle & nutrition recommendations."""
        pass


class IDoctorService(ABC):
    @abstractmethod
    async def search_doctors(self, filters: DoctorFilter) -> List[DoctorResponse]:
        """Find verified and demo doctors based on location, specialty, language."""
        pass

    @abstractmethod
    async def get_doctor_by_id(self, doctor_id: str) -> Optional[DoctorResponse]:
        """Get doctor details."""
        pass


class IAppointmentService(ABC):
    @abstractmethod
    async def create_appointment(self, appointment: AppointmentCreate) -> AppointmentResponse:
        """Schedule consultation."""
        pass

    @abstractmethod
    async def list_appointments(self, user_id: str, role: str) -> List[AppointmentResponse]:
        """List appointments for a user or doctor."""
        pass


class IVoiceService(ABC):
    @abstractmethod
    async def transcribe_audio(self, request: VoiceTranscribeRequest) -> VoiceTranscribeResponse:
        """Speech to text transcription."""
        pass

    @abstractmethod
    async def synthesize_speech(self, request: VoiceSynthesizeRequest) -> VoiceSynthesizeResponse:
        """Text to speech synthesis."""
        pass


class IRealtimeService(ABC):
    @abstractmethod
    async def create_room_token(self, room_name: str, identity: str) -> Dict[str, str]:
        """Generate WebRTC / LiveKit consultation room token."""
        pass


class IAgentService(ABC):
    @abstractmethod
    async def handle_message(self, request: AssistantMessageRequest) -> AssistantMessageResponse:
        """Process conversational agent prompt with tools and guardrails."""
        pass


class IAuditService(ABC):
    @abstractmethod
    async def log_event(self, action: str, resource_type: str, resource_id: str, user_id: Optional[str] = None, metadata: Optional[Dict[str, Any]] = None) -> None:
        """Log audit and compliance event."""
        pass
