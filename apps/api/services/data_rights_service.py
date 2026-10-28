"""
Consent & data-rights centre (docs/SPEC.md §2.2, PROMPTS P7 step 3, DPDP Act 2023).

- Export: everything VITALNEX holds about the signed-in patient, read through their own
  RLS-scoped client, as one JSON document. Results are patient-shaped (no probabilities, D-10).
- Deletion: removes the patient's assessments (and with them review items and clinician
  overrides), shares and their access log, appointments, health profile, consents, assistant
  logs, audit entries about them, the profile and the sign-in account. What remains is a
  data_requests row with no user id and one audit entry saying a deletion happened.
"""

import json
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

import httpx
from postgrest import AsyncPostgrestClient

from apps.api.core import db as core_db
from apps.api.core.auth import CurrentUser
from apps.api.core.config import settings
from apps.api.services import audit_service, review_service, screening

EXPORT_FORMAT = "vitalnex-export-v1"

# Deleted in this order (children before parents keeps it valid even without cascades).
DELETE_BY_USER = (
    ("share_tokens", "user_id"),          # share_access_log cascades
    ("appointments", "patient_id"),
    ("risk_assessments", "user_id"),      # review_queue, clinician_overrides cascade
    ("health_profiles", "user_id"),       # health_* detail tables cascade
    ("assistant_logs", "user_id"),
    ("consents", "user_id"),
    ("user_preferences", "user_id"),
    ("voice_preferences", "user_id"),
)


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


async def export(user: CurrentUser, db: AsyncPostgrestClient) -> Dict[str, Any]:
    async def rows(table: str, col: str, select: str = "*", order: Optional[str] = "created_at") -> List[dict]:
        q = db.table(table).select(select).eq(col, user.id)
        if order:
            q = q.order(order)
        return (await q.execute()).data

    assessments = await rows("risk_assessments", "user_id")
    reviews = await review_service.review_info_for(db, [a["id"] for a in assessments])
    shares = await rows("share_tokens", "user_id", "id, scope, expires_at, revoked_at, created_at")
    opens: List[dict] = []
    if shares:
        opens = (await db.table("share_access_log").select("token_id, accessed_at, accessor_role")
                 .in_("token_id", [s["id"] for s in shares]).execute()).data
    doc = {
        "format": EXPORT_FORMAT,
        "generated_at": _now(),
        "notice": "Your VITALNEX data. Results show screening levels only; VITALNEX does not diagnose.",
        "profile": (await rows("profiles", "id", order=None) or [None])[0],
        "health_profile": (await rows("health_profiles", "user_id", order=None) or [None])[0],
        "consents": await rows("consents", "user_id", order=None),
        "assessments": [
            {**a, "results": screening.shape_results(a.get("results") or {}, "patient"),
             "clinician_review": reviews.get(a["id"])}
            for a in assessments
        ],
        "appointments": await rows("appointments", "patient_id"),
        "shares": shares,
        "share_opens": opens,
        "assistant_logs": await rows("assistant_logs", "user_id"),
        "data_requests": await rows("data_requests", "user_id"),
        "audit_entries_about_my_actions": await rows("audit_logs", "user_id",
                                                     "action, resource_type, created_at"),
    }
    # Recorded with the service role: users may only create 'pending' requests.
    await core_db.service_db().table("data_requests").insert(
        {"user_id": user.id, "type": "export", "status": "completed", "completed_at": _now()}
    ).execute()
    return json.loads(json.dumps(doc, default=str))


async def delete_auth_user(user_id: str) -> bool:
    """Remove the Supabase Auth account (our own project, service key; not a third party)."""
    key = settings.SUPABASE_SECRET_KEY
    headers = {"apikey": key, "Authorization": f"Bearer {key}"}
    url = f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1/admin/users/{user_id}"
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            res = await client.delete(url, headers=headers)
        return res.status_code in (200, 204, 404)
    except httpx.HTTPError:
        return False


async def delete_everything(user: CurrentUser) -> Dict[str, Any]:
    db = core_db.service_db()
    req = (await db.table("data_requests").insert({"user_id": user.id, "type": "delete", "status": "pending"})
           .execute()).data[0]
    cleared = []
    for table, col in DELETE_BY_USER:
        await db.table(table).delete().eq(col, user.id).execute()
        cleared.append(table)
    # Audit entries that identify this person (as actor or as subject).
    await db.table("audit_logs").delete().eq("user_id", user.id).execute()
    await db.table("audit_logs").delete().eq("metadata->>subject_user_id", user.id).execute()
    cleared.append("audit_logs")
    # Profile last; data_requests.user_id becomes NULL (ON DELETE SET NULL).
    await db.table("profiles").delete().eq("id", user.id).execute()
    cleared.append("profiles")
    account_deleted = await delete_auth_user(user.id)
    status = "completed" if account_deleted else "failed"
    await db.table("data_requests").update({"status": status, "completed_at": _now(), "user_id": None}) \
        .eq("id", req["id"]).execute()
    # The one record kept: that a deletion happened. No user id, no personal data.
    await audit_service.log_event(None, "USER_DATA_DELETED", "data_request", req["id"],
                                  metadata={"tables_cleared": cleared, "auth_account_deleted": account_deleted})
    return {"request_id": req["id"], "status": status, "tables_cleared": cleared,
            "auth_account_deleted": account_deleted}
