"""
Clinician review (docs/SPEC.md §1.3 clinician flow, PROMPTS P6 steps 2-3).

Reads go through the clinician's RLS-scoped client (`db`, from get_user_db): a clinician only
ever sees patients with an active `share_with_clinician` consent, and withdrawing that consent
removes access immediately. Writes (overrides, review status) use the service role, and only
after the same RLS-scoped read has shown the clinician may see the case — clinician_overrides
has no insert policy (append-only, written by the API only).

HARD RULE 9 (CLAUDE.md): clinician_overrides is an accountability log. It must never be read
by training, calibration or evaluation code under ml/ and is never used to retrain a model.
tests/test_clinician_review.py asserts that no file under ml/ references the table.
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import HTTPException, Request
from postgrest import AsyncPostgrestClient
from pydantic import ValidationError

from apps.api.core import db as core_db
from apps.api.core.auth import CurrentUser
from apps.api.schemas.assessment import AssessmentInputs
from apps.api.schemas.review import ReviewDecision
from apps.api.services import audit_service, screening

DB_BAND = {"low": "Low", "moderate": "Moderate", "high": "High"}
# Display order for the case view (PROMPTS P6 step 2): factors and uncertainty come before
# the model's band, to reduce automation bias.
DISPLAY_ORDER = ["top_factors", "probability", "conformal_set", "abstained", "abstain_reason", "model_band"]


def model_band(result: Dict[str, Any]) -> str:
    """The model's band as stored in clinician_overrides.model_band."""
    return "not_confident" if result.get("abstained") else DB_BAND[result["band"]]


def _data_quality(inputs: Dict[str, Any]) -> Dict[str, Any]:
    """Recompute the data-quality notes from the stored answers (same rules as the assessment)."""
    try:
        parsed = AssessmentInputs(**{k: inputs[k] for k in AssessmentInputs.model_fields})
    except (KeyError, ValidationError):
        return {"available": False}
    return {"available": True, **screening.data_quality(parsed)}


def _thresholds(disease: str, version: Optional[str]) -> Optional[Dict[str, float]]:
    """Band thresholds, only if the stored result came from the model version loaded now."""
    m = screening.models().get(disease)
    if not m or m.meta["version"] != version:
        return None
    return {"t_mod": m.meta["thresholds"]["t_mod"], "t_high": m.meta["thresholds"]["t_high"]}


def _disease_view(d: str, r: Dict[str, Any], versions: Dict[str, Any]) -> Dict[str, Any]:
    version = (versions.get(d) or {}).get("version")
    return {
        "top_factors": r.get("top_factors", []),
        "probability": r.get("probability"),
        "conformal_set": r.get("conformal_set"),
        "abstained": bool(r.get("abstained")),
        "abstain_reason": r.get("abstain_reason"),
        "model_band": r.get("band"),
        "model_version": version,
        "thresholds": _thresholds(d, version),
    }


async def list_patients(db: AsyncPostgrestClient) -> List[Dict[str, Any]]:
    """Consented patients only (RLS on profiles / risk_assessments / review_queue)."""
    patients = (await db.table("profiles").select("id, full_name, preferred_language")
                .eq("role", "patient").order("full_name").execute()).data
    if not patients:
        return []
    ids = [p["id"] for p in patients]
    asms = (await db.table("risk_assessments").select("user_id, created_at, next_step")
            .in_("user_id", ids).order("created_at", desc=True).execute()).data
    queue = (await db.table("review_queue").select("patient_id, status").in_("patient_id", ids).execute()).data
    out = []
    for p in patients:
        mine = [a for a in asms if a["user_id"] == p["id"]]
        out.append({
            **p,
            "assessments": len(mine),
            "latest_assessment_at": mine[0]["created_at"] if mine else None,
            "latest_next_step": mine[0]["next_step"] if mine else None,
            "pending_reviews": sum(1 for q in queue if q["patient_id"] == p["id"] and q["status"] == "pending"),
        })
    return out


async def case_detail(db: AsyncPostgrestClient, assessment_id: str) -> Optional[Dict[str, Any]]:
    rows = (await db.table("risk_assessments").select("*").eq("id", assessment_id).execute()).data
    if not rows:
        return None
    asm = rows[0]
    queue = (await db.table("review_queue").select("*").eq("assessment_id", assessment_id).execute()).data
    overrides = (await db.table("clinician_overrides").select("*").eq("assessment_id", assessment_id)
                 .order("created_at").execute()).data
    patient = (await db.table("profiles").select("id, full_name").eq("id", asm["user_id"]).execute()).data
    history = (await db.table("risk_assessments")
               .select("id, created_at, next_step, emergency_flag, review_status, results")
               .eq("user_id", asm["user_id"]).order("created_at").execute()).data
    versions = asm.get("model_versions") or {}
    return {
        "assessment_id": asm["id"],
        "created_at": asm["created_at"],
        "patient": patient[0] if patient else {"id": asm["user_id"], "full_name": None},
        "inputs": asm["inputs"],
        "data_quality": _data_quality(asm["inputs"]),
        "next_step": asm["next_step"],
        "emergency_flag": asm["emergency_flag"],
        "review_status": asm["review_status"],
        "review": queue[0] if queue else None,
        "display_order": DISPLAY_ORDER,
        "diseases": {d: _disease_view(d, r, versions) for d, r in (asm.get("results") or {}).items()},
        "model_versions": versions,
        "overrides": overrides,
        "history": [
            {
                "id": h["id"],
                "created_at": h["created_at"],
                "next_step": h["next_step"],
                "emergency_flag": h["emergency_flag"],
                "review_status": h["review_status"],
                "diseases": {
                    d: {"probability": r.get("probability"), "band": r.get("band"), "abstained": bool(r.get("abstained"))}
                    for d, r in (h.get("results") or {}).items()
                },
            }
            for h in history
        ],
    }


async def decide(
    user: CurrentUser,
    db: AsyncPostgrestClient,
    assessment_id: str,
    decision: ReviewDecision,
    request: Optional[Request] = None,
) -> Dict[str, Any]:
    # 1. Visibility check through RLS: no consent -> not found.
    items = (await db.table("review_queue").select("*").eq("assessment_id", assessment_id).execute()).data
    if not items:
        raise HTTPException(status_code=404, detail="No review item for this assessment.")
    item = items[0]
    if item["status"] != "pending":
        raise HTTPException(status_code=409, detail=f"This case was already reviewed ({item['status']}).")
    asm_rows = (await db.table("risk_assessments").select("id, results, model_versions")
                .eq("id", assessment_id).execute()).data
    if not asm_rows:
        raise HTTPException(status_code=404, detail="Assessment not found.")
    asm = asm_rows[0]
    results, versions = asm.get("results") or {}, asm.get("model_versions") or {}

    # 2. Validate every override before writing anything.
    rows = []
    for o in decision.overrides:
        r = results.get(o.disease)
        if r is None:
            raise HTTPException(status_code=422, detail=(
                f"There is no model result for '{o.disease}' in this assessment (for example an emergency "
                "case, where no model ran). Use Agree with a note instead."))
        mb = model_band(r)
        if mb == o.clinician_band:
            raise HTTPException(status_code=422, detail=(
                f"The new band for '{o.disease}' equals the model's band ({mb}). Use Agree instead."))
        version = (versions.get(o.disease) or {}).get("version")
        if not version:
            raise HTTPException(status_code=422, detail=f"No model version stored for '{o.disease}'.")
        rows.append({
            "assessment_id": assessment_id, "disease": o.disease, "model_band": mb,
            "clinician_band": o.clinician_band, "reason_code": o.reason_code,
            "note": (o.note or "").strip() or None, "clinician_id": user.id, "model_version": version,
        })

    status = "overridden" if decision.decision == "override" else "agreed"
    now = datetime.now(timezone.utc).isoformat()
    svc = core_db.service_db()
    # 3. Status first, guarded on 'pending', so two clinicians cannot both decide one case.
    updated = (await svc.table("review_queue").update({
        "status": status, "reviewed_by": user.id, "reviewed_at": now,
        "clinician_note": (decision.note or "").strip() or None,
    }).eq("id", item["id"]).eq("status", "pending").execute()).data
    if not updated:
        raise HTTPException(status_code=409, detail="This case was just reviewed by someone else.")
    if rows:
        # Append-only override log (audited by trigger as OVERRIDE_CREATED). Never used for training.
        await svc.table("clinician_overrides").insert(rows).execute()
    await svc.table("risk_assessments").update({"review_status": status}).eq("id", assessment_id).execute()
    await audit_service.log_event(
        user.id, "REVIEW_DECISION", "review_queue", item["id"],
        metadata={
            "decision": status,
            "diseases": [r["disease"] for r in rows],
            "reason_codes": [r["reason_code"] for r in rows],
            "model_versions": {d: (v or {}).get("version") for d, v in versions.items()},
        },
        request=request,
    )
    return {"review": updated[0], "overrides": rows}


async def review_info_for(db: AsyncPostgrestClient, assessment_ids: List[str]) -> Dict[str, Dict[str, Any]]:
    """What a patient sees about a clinician review: status, note and any new band.
    Reason codes and clinician identity are not shown to the patient."""
    if not assessment_ids:
        return {}
    queue = (await db.table("review_queue").select("assessment_id, status, reviewed_at, clinician_note")
             .in_("assessment_id", assessment_ids).execute()).data
    overrides = (await db.table("clinician_overrides").select("assessment_id, disease, clinician_band")
                 .in_("assessment_id", assessment_ids).execute()).data
    out = {}
    for q in queue:
        reviewed = q["status"] in ("agreed", "overridden")
        out[q["assessment_id"]] = {
            "status": q["status"],
            "reviewed_by_clinician": reviewed,
            "reviewed_at": q["reviewed_at"],
            "clinician_note": q["clinician_note"] if reviewed else None,
            "clinician_bands": {o["disease"]: o["clinician_band"] for o in overrides
                                if o["assessment_id"] == q["assessment_id"]},
        }
    return out
