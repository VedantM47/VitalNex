"""
Governance & Audit Pydantic Schemas.
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from datetime import datetime


class GovernanceEvent(BaseModel):
    id: str
    event_type: str
    severity: str = Field("INFO", pattern="^(INFO|WARNING|CRITICAL)$")
    entity_type: str
    entity_id: Optional[str] = None
    details: Dict[str, Any]
    timestamp: datetime


class GovernanceSummaryResponse(BaseModel):
    total_assessments: int
    models_in_production: int
    fairness_compliance_rate: float
    human_reviews_pending: int
    data_quality_index: float
    recent_events: List[GovernanceEvent]
