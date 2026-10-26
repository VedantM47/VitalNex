"""
Consent schemas (docs/SPEC.md §2.2).
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel

CONSENT_PURPOSES = ("assessment_processing", "store_history", "share_with_clinician", "aggregate_audit")
NOTICE_VERSION = "v1"


class ConsentStatus(BaseModel):
    purpose: str
    granted: bool
    granted_at: Optional[datetime] = None
    withdrawn_at: Optional[datetime] = None
    notice_version: str


class ConsentUpdate(BaseModel):
    granted: bool
