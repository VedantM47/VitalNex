"""
Admin governance (PROMPTS P6 step 5): model registry, fairness tables, override analytics,
abstention / emergency counts over time, consent stats and an audit log viewer.

Aggregates only — no patient identities. Model facts come only from
ml/artifacts/<disease>/model_meta.json (via screening.models()); counts come from Supabase
through apps/api/services/aggregates.py. Assessments of users who did not grant
`aggregate_audit` are excluded (docs/SPEC.md §2.2).
"""

from typing import Any, Dict, List, Optional

from apps.api.core import db as core_db
from apps.api.schemas import GovernanceEvent, GovernanceSummaryResponse
from apps.api.services import aggregates, screening

RECENT_EVENTS = 10
AUDIT_PAGE_MAX = 200

# Audit metadata keys that describe what happened without identifying a patient. Anything
# else (subject_user_id, assessment ids, IPs, user agents, share scopes) is dropped.
AUDIT_METADATA_ALLOWED = {
    "purpose", "notice_version", "mode", "next_step", "emergency_flag", "disease", "model_band",
    "clinician_band", "reason_code", "model_version", "model_versions", "type", "accessor_role",
    "role", "decision", "diseases", "reason_codes", "tables_cleared", "auth_account_deleted",
}
STAFF_ROLES = ("doctor", "admin")


def model_registry() -> List[Dict[str, Any]]:
    out = []
    for d, m in screening.models().items():
        meta = m.meta
        t = meta["test_metrics"]
        out.append({
            "disease": d,
            "version": meta["version"],
            "chosen_model": meta["chosen_model"],
            "chosen_reason": meta["chosen_reason"],
            "selection_rule": meta["selection_rule"],
            "trained_at": meta["created_at"],
            "data_hash": meta["data_hash"],
            "data_file": meta["data_file"],
            "target": meta["target"],
            "features": meta["features"],
            "model_card_path": f"ml/artifacts/{d}/model_card.md",
            "model_card_url": f"/api/v1/models/{d}/card",
            "artifact_files": meta["artifact_files"],
            "libraries": meta["libraries"],
            "test_auroc": t["auroc"],
            "test_auroc_ci95": t["ci95"]["auroc"],
            "test_brier": t["brier"],
            "test_recall_at_t_mod": t["recall_at_t_mod"],
            "thresholds": {"t_mod": meta["thresholds"]["t_mod"], "t_high": meta["thresholds"]["t_high"]},
            "abstention_rate_test": meta["conformal_test"]["abstention_rate_total"],
            "flags": meta["flags"],
        })
    return out


def _group_reading(group: str, by_group: Dict[str, Dict[str, float]]) -> str:
    """Plain-language sentence built only from the numbers in model_meta.json."""
    rec = {g: v["recall"] for g, v in by_group.items() if v.get("recall") is not None}
    fpr = {g: v["false_positive_rate"] for g, v in by_group.items() if v.get("false_positive_rate") is not None}
    if not rec:
        return f"{group}: no recall values were computed."
    lo, hi = min(rec, key=rec.get), max(rec, key=rec.get)
    text = (f"{group}: of people who have the condition, VITALNEX flags {rec[lo]:.0%} in group '{lo}' "
            f"and {rec[hi]:.0%} in group '{hi}'.")
    if fpr:
        flo, fhi = min(fpr, key=fpr.get), max(fpr, key=fpr.get)
        text += (f" Among people without it, {fpr[flo]:.0%} ('{flo}') to {fpr[fhi]:.0%} ('{fhi}') "
                 f"are flagged anyway.")
    return text


def age_gap(meta: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """D-24: recall in the youngest vs oldest age group, from model_meta.json."""
    groups = meta.get("fairness", {}).get("groups", {}).get("AgeGroup", {}).get("by_group")
    if not groups:
        return None
    names = list(groups)
    young, old = names[0], names[-1]
    return {
        "youngest_group": young, "youngest_recall": groups[young]["recall"],
        "oldest_group": old, "oldest_recall": groups[old]["recall"],
        "recall_gap": meta["fairness"]["groups"]["AgeGroup"]["gaps"]["recall"]["max_gap"],
    }


def fairness_tables() -> Dict[str, Any]:
    out = {}
    for d, m in screening.models().items():
        f = m.meta["fairness"]
        out[d] = {
            "version": m.meta["version"],
            "definition": f["definition"],
            "groups": {
                g: {**v, "reading": _group_reading(g, v["by_group"])} for g, v in f["groups"].items()
            },
            "flags": f["flags"],
            "age_gap": age_gap(m.meta),
            "fairness_only_columns": m.meta["fairness_only_columns"],
        }
    return out


async def audit_logs(
    action: Optional[str] = None,
    resource_type: Optional[str] = None,
    actor_role: Optional[str] = None,
    since: Optional[str] = None,
    until: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
) -> Dict[str, Any]:
    """Audit entries with patient identity removed: actor shown as a role; staff ids kept."""
    db = core_db.service_db()
    limit = max(1, min(limit, AUDIT_PAGE_MAX))
    q = db.table("audit_logs").select("id, user_id, action, resource_type, metadata, created_at", count="exact")
    if action:
        q = q.eq("action", action)
    if resource_type:
        q = q.eq("resource_type", resource_type)
    if since:
        q = q.gte("created_at", since)
    if until:
        q = q.lte("created_at", until)
    if actor_role == "system":
        q = q.is_("user_id", "null")
    elif actor_role:
        ids = [r["id"] for r in (await db.table("profiles").select("id").eq("role", actor_role).execute()).data]
        if not ids:
            return {"total": 0, "limit": limit, "offset": offset, "entries": []}
        q = q.in_("user_id", ids)
    res = await q.order("created_at", desc=True).range(offset, offset + limit - 1).execute()
    actors = {r["user_id"] for r in res.data if r.get("user_id")}
    roles = {}
    if actors:
        roles = {p["id"]: p["role"] for p in
                 (await db.table("profiles").select("id, role").in_("id", list(actors)).execute()).data}
    entries = []
    for r in res.data:
        role = roles.get(r.get("user_id")) if r.get("user_id") else "system"
        entries.append({
            "id": r["id"],
            "created_at": r["created_at"],
            "action": r["action"],
            "resource_type": r["resource_type"],
            "actor_role": role or "unknown",
            # Staff identities are kept for accountability; patients are never identified.
            "actor_id": r["user_id"] if role in STAFF_ROLES else None,
            "metadata": {k: v for k, v in (r.get("metadata") or {}).items() if k in AUDIT_METADATA_ALLOWED},
        })
    return {"total": res.count if res.count is not None else len(entries), "limit": limit, "offset": offset,
            "entries": entries}


class GovernanceService:
    async def get_summary(self) -> GovernanceSummaryResponse:
        db = core_db.service_db()
        users = await aggregates.consenting_users()
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
            # Models loaded from ml/artifacts (approved at the P3 sign-off, D-24).
            models_in_production=len(screening.models()),
            fairness_compliance_rate=None,  # no compliance rule is defined; never invent one
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
