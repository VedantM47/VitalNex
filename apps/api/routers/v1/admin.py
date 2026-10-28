"""
Admin governance (PROMPTS P6 step 5). Admin role only. Aggregates only — no patient
identities: no patient ids, names, answers or assessment ids leave these endpoints.
"""

from datetime import datetime
from typing import Any, Dict, List, Literal, Optional

from fastapi import APIRouter, Depends, Query

from apps.api.core.auth import CurrentUser, require_role
from apps.api.services import aggregates
from apps.api.services.governance_service import audit_logs as audit_log_view
from apps.api.services.governance_service import fairness_tables, model_registry as registry

router = APIRouter(prefix="/admin/governance", tags=["Admin Governance"])

admin = require_role("admin")


@router.get("/models")
async def model_registry(user: CurrentUser = Depends(admin)) -> List[Dict[str, Any]]:
    """Versions, data hash and model-card links, from ml/artifacts/<disease>/model_meta.json."""
    return registry()


@router.get("/fairness")
async def fairness(user: CurrentUser = Depends(admin)) -> Dict[str, Any]:
    """Fairness tables from model_meta.json (test set), with a plain-language reading."""
    return fairness_tables()


@router.get("/overrides")
async def override_analytics(user: CurrentUser = Depends(admin)) -> Dict[str, Any]:
    """Override rate per disease, overrides per reason, agree rate."""
    return await aggregates.override_analytics()


@router.get("/activity")
async def activity(days: int = Query(30, ge=1, le=365), user: CurrentUser = Depends(admin)) -> Dict[str, Any]:
    """Assessments, abstentions and emergency flags per day."""
    return await aggregates.activity(days)


@router.get("/consents")
async def consent_stats(user: CurrentUser = Depends(admin)) -> Dict[str, Any]:
    return {
        "consents": await aggregates.consent_stats(),
        "shares": await aggregates.share_stats(),
        "data_requests": await aggregates.data_request_stats(),
    }


@router.get("/audit-logs")
async def audit_logs(
    action: Optional[str] = Query(None, max_length=64),
    resource_type: Optional[str] = Query(None, max_length=64),
    actor_role: Optional[Literal["patient", "doctor", "admin", "system"]] = None,
    since: Optional[datetime] = None,
    until: Optional[datetime] = None,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    user: CurrentUser = Depends(admin),
) -> Dict[str, Any]:
    """Audit log viewer. Patients appear only as the role 'patient'; identifying metadata is dropped."""
    return await audit_log_view(
        action, resource_type, actor_role,
        since.isoformat() if since else None, until.isoformat() if until else None, limit, offset,
    )
