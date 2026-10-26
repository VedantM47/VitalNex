"""
Governance, Model Registry, and Health Profile Service Implementations.
"""

import uuid
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from apps.api.schemas import (
    GovernanceSummaryResponse,
    ModelRegistryItem,
    HealthProfileCreate,
    HealthProfileResponse,
)
from .base import IGovernanceService, IModelRegistryService, IHealthProfileService


class GovernanceService(IGovernanceService):
    async def get_summary(self) -> GovernanceSummaryResponse:
        # Real counts come from Supabase in P6. Until then nothing has been computed,
        # so report zero activity and leave metrics unset rather than inventing them.
        return GovernanceSummaryResponse(
            total_assessments=0,
            models_in_production=0,
            fairness_compliance_rate=None,
            human_reviews_pending=0,
            data_quality_index=None,
            recent_events=[],
        )


class ModelRegistryService(IModelRegistryService):
    """Model registry. Empty until P3 writes ml/artifacts/<disease>/model_meta.json."""

    def __init__(self):
        self._models: List[ModelRegistryItem] = []

    async def list_models(self) -> List[ModelRegistryItem]:
        return self._models

    async def get_model(self, model_id: str) -> Optional[ModelRegistryItem]:
        for m in self._models:
            if m.id == model_id:
                return m
        return None


class HealthProfileService(IHealthProfileService):
    def __init__(self):
        # In-memory store (Supabase in P1). Starts empty: no pre-filled medical values.
        self._profiles: Dict[str, HealthProfileResponse] = {}

    async def get_profile(self, user_id: str) -> Optional[HealthProfileResponse]:
        return self._profiles.get(user_id)

    async def save_profile(self, profile: HealthProfileCreate) -> HealthProfileResponse:
        resp = HealthProfileResponse(
            id=f"hp-{uuid.uuid4().hex[:8]}",
            user_id=profile.user_id,
            # Every field is required by the schema, so a saved profile is complete.
            completeness_score=100,
            clinical_model=profile.clinical_model,
            lifestyle=profile.lifestyle,
            nutrition=profile.nutrition,
            context=profile.context,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        self._profiles[profile.user_id] = resp
        return resp

