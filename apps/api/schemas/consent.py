"""
Consent schemas (docs/SPEC.md §2.2).
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel

CONSENT_PURPOSES = ("assessment_processing", "store_history", "share_with_clinician", "aggregate_audit")
NOTICE_VERSION = "v1"  # must equal notice_version in apps/api/content/consent_notices.json


class ConsentStatus(BaseModel):
    purpose: str
    granted: bool
    granted_at: Optional[datetime] = None
    withdrawn_at: Optional[datetime] = None
    notice_version: str
    # From apps/api/content/consent_notices.json (English source text; the web app translates
    # by `purpose` through its i18n files).
    required: bool = False
    title: Optional[str] = None
    notice: Optional[str] = None
    effect_if_off: Optional[str] = None


class ConsentUpdate(BaseModel):
    granted: bool
