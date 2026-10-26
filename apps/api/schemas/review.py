"""
Clinician review queue schemas (docs/SPEC.md §1.3, §2.1).
Agree / override actions are built in P6.
"""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class ReviewQueueItem(BaseModel):
    id: str
    assessment_id: str
    patient_id: str
    patient_name: Optional[str] = None
    reasons: List[str]  # high_band | abstained | data_quality | emergency
    status: str  # pending | agreed | overridden
    assigned_to: Optional[str] = None
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    clinician_note: Optional[str] = None
    created_at: datetime
