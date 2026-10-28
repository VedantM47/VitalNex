"""
QR patient-held record (novelty 9, docs/SPEC.md §1.2 F15, PROMPTS P7 step 4).
"""

from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field

ShareSection = Literal["latest_results", "factors", "history", "clinician_notes"]
ShareExpiry = Literal["1h", "24h", "7d"]
SHARE_SECTIONS = ShareSection.__args__


class ShareCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    sections: List[ShareSection] = Field(..., min_length=1)
    expires_in: ShareExpiry


class ShareOpen(BaseModel):
    accessed_at: datetime
    accessor_role: str


class ShareInfo(BaseModel):
    id: str
    sections: List[str]
    created_at: datetime
    expires_at: datetime
    revoked_at: Optional[datetime] = None
    status: Literal["active", "expired", "revoked"]
    open_count: int
    opens: List[ShareOpen]


class ShareCreated(BaseModel):
    id: str
    sections: List[str]
    expires_at: datetime
    # The raw token is returned exactly once, inside the URL; only its SHA-256 hash is stored.
    url: str
    qr_png_data_uri: str
