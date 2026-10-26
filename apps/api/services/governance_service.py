"""
Governance summary and model registry.

Counts are computed from Supabase with the service role and returned as aggregates
only (no patient identities). Assessments of users who did not grant `aggregate_audit`
are excluded (docs/SPEC.md §2.2). Full analytics are built in P6.
"""

from typing import List, Optional

from apps.api.core.db import service_db
from apps.api.schemas import GovernanceEvent, GovernanceSummaryResponse, ModelRegistryItem

RECENT_EVENTS = 10


async def _aggregate_consenting_users() -> List[str]:
    res = (
        await service_db()
        .table("consents")
        .select("user_id")
        .eq("purpose", "aggregate_audit")
        .eq("granted", True)
        .is_("withdrawn_at", "null")
        .execute()
    )
    return [r["user_id"] for r in res.data]


class GovernanceService:
    async def get_summary(self) -> GovernanceSummaryResponse:
        db = service_db()
        users = await _aggregate_consenting_users()
        total = 0
        if users:
            res = await db.table("risk_assessments").select("id", count="exact", head=True).in_("user_id", users).execute()
            total = res.count or 0
        pending = (
            await db.table("review_queue").select("id", count="exact", head=True).eq("status", "pending").execute()
        ).count or 0
        events = (
            await db.table("governance_events").select("*").order("created_at", desc=True).limit(RECENT_EVENTS).execute()
        ).data
        return GovernanceSummaryResponse(
            total_assessments=total,
            # Model artifacts arrive in P3; nothing is in production until then.
            models_in_production=0,
            fairness_compliance_rate=None,
            human_reviews_pending=pending,
            data_quality_index=None,
            recent_events=[
                GovernanceEvent(
                    id=e["id"],
                    event_type=e["event_type"],
                    severity=e["severity"],
                    entity_type=e["entity_type"],
                    entity_id=e.get("entity_id"),
                    details=e["details"],
                    timestamp=e["created_at"],
                )
                for e in events
            ],
        )


class ModelRegistryService:
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
