"""
Database aggregates for governance, the Trust Passport and the principle map.

Everything here returns counts and rates only — never a patient id, name or raw answer.
Rows are read with the service role because admins and the public have no RLS access to
patient tables; nothing row-level leaves this module.

Assessment-derived aggregates only count users with an active `aggregate_audit` consent
(docs/SPEC.md §2.2). Consent statistics count everyone, since they describe consent itself.

`safe()` turns any database failure (not configured, unreachable) into NOT_AVAILABLE so
callers show "not available" instead of a number that was never computed (hard rule 4).
"""

from collections import Counter, defaultdict
from datetime import datetime, timedelta, timezone
from typing import Any, Awaitable, Dict, List, Optional

from apps.api.core import db as core_db

NOT_AVAILABLE = "not available"
DISEASES = ("diabetes", "heart", "stroke")
PURPOSES = ("assessment_processing", "store_history", "share_with_clinician", "aggregate_audit")
MEDICATION_INTENT = "MEDICATION_REQUEST"


async def safe(awaitable: Awaitable[Any]) -> Any:
    try:
        return await awaitable
    except Exception:  # noqa: BLE001 — any DB failure means the value was not computed
        return NOT_AVAILABLE


def _rate(num: int, den: int) -> Optional[float]:
    return round(num / den, 4) if den else None


async def consenting_users() -> List[str]:
    res = (
        await core_db.service_db().table("consents").select("user_id")
        .eq("purpose", "aggregate_audit").eq("granted", True).is_("withdrawn_at", "null").execute()
    )
    return [r["user_id"] for r in res.data]


async def _assessments(users: List[str], since: Optional[str] = None) -> List[Dict[str, Any]]:
    if not users:
        return []
    q = (core_db.service_db().table("risk_assessments")
         .select("id, created_at, results, emergency_flag, next_step, review_status").in_("user_id", users))
    if since:
        q = q.gte("created_at", since)
    return (await q.execute()).data


def _abstained_any(row: Dict[str, Any]) -> bool:
    return any(r.get("abstained") for r in (row.get("results") or {}).values())


async def assessment_stats() -> Dict[str, Any]:
    """Live counts over stored assessments of consenting users."""
    rows = await _assessments(await consenting_users())
    scored = [r for r in rows if r.get("results")]  # emergency rows have no model results
    per_disease = {}
    for d in DISEASES:
        with_d = [r for r in scored if d in r["results"]]
        n_abs = sum(1 for r in with_d if r["results"][d].get("abstained"))
        per_disease[d] = {"assessments": len(with_d), "abstained": n_abs, "abstention_rate": _rate(n_abs, len(with_d))}
    n_abs_any = sum(1 for r in scored if _abstained_any(r))
    return {
        "assessments": len(rows),
        "scored_assessments": len(scored),
        "emergency_assessments": sum(1 for r in rows if r.get("emergency_flag")),
        "abstained_any": n_abs_any,
        "abstention_rate_any": _rate(n_abs_any, len(scored)),
        "per_disease": per_disease,
    }


async def assistant_stats() -> Dict[str, Any]:
    users = await consenting_users()
    if not users:
        return {"messages": 0, "emergency": 0, "medication_refusals": 0}
    rows = (await core_db.service_db().table("assistant_logs").select("intent, emergency_flag, created_at")
            .in_("user_id", users).execute()).data
    return {
        "messages": len(rows),
        "emergency": sum(1 for r in rows if r.get("emergency_flag")),
        "medication_refusals": sum(1 for r in rows if r.get("intent") == MEDICATION_INTENT),
    }


async def emergency_triggers() -> Dict[str, Any]:
    a = await assessment_stats()
    s = await assistant_stats()
    return {"assessment_form": a["emergency_assessments"], "assistant": s["emergency"],
            "total": a["emergency_assessments"] + s["emergency"]}


async def override_analytics() -> Dict[str, Any]:
    """Agree rate, override rate per disease, overrides per reason and direction."""
    users = await consenting_users()
    db = core_db.service_db()
    queue = (await db.table("review_queue").select("assessment_id, status, patient_id, reasons")
             .in_("patient_id", users).execute()).data if users else []
    reviewed = [q for q in queue if q["status"] in ("agreed", "overridden")]
    ids = [q["assessment_id"] for q in reviewed]
    results: Dict[str, Dict[str, Any]] = {}
    overrides: List[Dict[str, Any]] = []
    if ids:
        results = {r["id"]: r.get("results") or {} for r in
                   (await db.table("risk_assessments").select("id, results").in_("id", ids).execute()).data}
        overrides = (await db.table("clinician_overrides")
                     .select("assessment_id, disease, model_band, clinician_band, reason_code")
                     .in_("assessment_id", ids).execute()).data
    order = {"Low": 0, "Moderate": 1, "High": 2}
    per_disease = {}
    for d in DISEASES:
        eligible = sum(1 for a in ids if d in results.get(a, {}))
        n = sum(1 for o in overrides if o["disease"] == d)
        per_disease[d] = {"reviewed_with_result": eligible, "overrides": n, "override_rate": _rate(n, eligible)}
    direction = Counter()
    for o in overrides:
        if o["model_band"] == "not_confident":
            direction["from_not_confident"] += 1
        elif order[o["clinician_band"]] > order[o["model_band"]]:
            direction["raised"] += 1
        else:
            direction["lowered"] += 1
    agreed = sum(1 for q in reviewed if q["status"] == "agreed")
    return {
        "queue_items": len(queue),
        "pending": sum(1 for q in queue if q["status"] == "pending"),
        "reviewed": len(reviewed),
        "agreed": agreed,
        "overridden": len(reviewed) - agreed,
        "agree_rate": _rate(agreed, len(reviewed)),
        "per_disease": per_disease,
        "per_reason": dict(Counter(o["reason_code"] for o in overrides)),
        "direction": {k: direction.get(k, 0) for k in ("raised", "lowered", "from_not_confident")},
        "queue_reasons": dict(Counter(r for q in queue for r in q.get("reasons") or [])),
    }


async def activity(days: int) -> Dict[str, Any]:
    """Per-day assessments, abstentions and emergency flags over the last `days` days."""
    since_dt = datetime.now(timezone.utc) - timedelta(days=days)
    since = since_dt.isoformat()
    users = await consenting_users()
    rows = await _assessments(users, since)
    assistant = []
    if users:
        assistant = (await core_db.service_db().table("assistant_logs").select("emergency_flag, created_at")
                     .in_("user_id", users).gte("created_at", since).execute()).data
    buckets: Dict[str, Dict[str, Any]] = defaultdict(lambda: {
        "assessments": 0, "abstained_any": 0, "emergency_assessments": 0, "emergency_assistant": 0,
        "abstained_by_disease": {d: 0 for d in DISEASES},
    })
    for r in rows:
        b = buckets[str(r["created_at"])[:10]]
        b["assessments"] += 1
        b["emergency_assessments"] += int(bool(r.get("emergency_flag")))
        b["abstained_any"] += int(_abstained_any(r))
        for d, res in (r.get("results") or {}).items():
            if res.get("abstained") and d in b["abstained_by_disease"]:
                b["abstained_by_disease"][d] += 1
    for a in assistant:
        if a.get("emergency_flag"):
            buckets[str(a["created_at"])[:10]]["emergency_assistant"] += 1
    return {"days": days, "since": since, "series": [{"date": k, **buckets[k]} for k in sorted(buckets)]}


async def consent_stats() -> Dict[str, Any]:
    db = core_db.service_db()
    patients = (await db.table("profiles").select("id", count="exact", head=True).eq("role", "patient").execute()).count or 0
    rows = (await db.table("consents").select("purpose, granted, withdrawn_at, notice_version").execute()).data
    out = {}
    for p in PURPOSES:
        mine = [r for r in rows if r["purpose"] == p]
        active = sum(1 for r in mine if r["granted"] and r["withdrawn_at"] is None)
        withdrawn = sum(1 for r in mine if r["withdrawn_at"] is not None)
        out[p] = {"granted": active, "withdrawn": withdrawn, "granted_rate": _rate(active, patients),
                  "notice_versions": dict(Counter(r["notice_version"] for r in mine))}
    return {"patients": patients, "purposes": out}


async def consent_rates() -> Dict[str, Any]:
    s = await consent_stats()
    return {"patients": s["patients"], **{p: v["granted_rate"] for p, v in s["purposes"].items()}}


async def share_stats() -> Dict[str, Any]:
    db = core_db.service_db()
    rows = (await db.table("share_tokens").select("revoked_at, expires_at").execute()).data
    now = datetime.now(timezone.utc)
    opens = (await db.table("share_access_log").select("id", count="exact", head=True).execute()).count or 0
    return {
        "created": len(rows),
        "revoked": sum(1 for r in rows if r["revoked_at"]),
        "expired": sum(1 for r in rows if not r["revoked_at"] and datetime.fromisoformat(str(r["expires_at"])) <= now),
        "opens": opens,
    }


async def data_request_stats() -> Dict[str, Any]:
    rows = (await core_db.service_db().table("data_requests").select("type, status").execute()).data
    return {t: dict(Counter(r["status"] for r in rows if r["type"] == t)) for t in ("export", "delete")}


async def audit_entries() -> Dict[str, Any]:
    db = core_db.service_db()
    total = (await db.table("audit_logs").select("id", count="exact", head=True).execute()).count or 0
    return {"total": total}
