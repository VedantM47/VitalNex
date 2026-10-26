"""
Audit log writer for actions the database cannot see by itself (e.g. LOGIN).

Consent changes, assessments, overrides, shares and data requests are audited by
database triggers (supabase/migrations/20261026000001_p1_auth_persistence.sql), so they
are logged whichever path made the change.
"""

from typing import Any, Dict, Optional

from fastapi import Request

from apps.api.core.db import service_db


async def log_event(
    user_id: Optional[str],
    action: str,
    resource_type: str,
    resource_id: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
    request: Optional[Request] = None,
) -> None:
    row = {
        "user_id": user_id,
        "action": action,
        "resource_type": resource_type,
        "resource_id": resource_id,
        "metadata": metadata or {},
    }
    if request is not None:
        row["ip_address"] = request.client.host if request.client else None
        row["user_agent"] = request.headers.get("user-agent")
    await service_db().table("audit_logs").insert(row).execute()
