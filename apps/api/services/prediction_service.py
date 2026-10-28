"""
Prediction service: consent checks, running the screening engine, persistence and review queue.

- `assessment_processing` consent is required to run an assessment (SPEC §2.2).
- With `store_history`: the assessment is stored with model versions. Without it, nothing is stored
  except an audit entry with no health data.
- If the next-step rule says queue and `share_with_clinician` is granted (and the row is stored),
  a review_queue row is inserted with its reasons.
- Free text is only checked for red flags and is never stored.
Writes use the service role; reads use the caller's RLS-scoped client.
"""

from typing import Any, Dict, List, Optional, Set

from fastapi.concurrency import run_in_threadpool
from postgrest import AsyncPostgrestClient

from apps.api.core.db import service_db
from apps.api.schemas import AssessmentRecord, AssessmentRequest
from apps.api.services import screening
from apps.api.services.audit_service import log_event


class ConsentRequiredError(PermissionError):
    """The user has not granted assessment_processing."""


CONSENT_REQUIRED_MESSAGE = (
    "To run a screening, please turn on 'Process my answers to give me a screening result' "
    "in My data → Consent."
)


def stored_inputs(req: AssessmentRequest) -> Dict[str, Any]:
    """What is saved: the form answers, computed BMI and ticked symptoms. Never free text."""
    data = {k: getattr(req, k) for k in screening.AssessmentInputs.model_fields}
    data["bmi"] = screening.bmi_of(req)
    data["symptoms"] = [k for k, v in req.symptoms.model_dump().items() if v]
    return data


class PredictionService:
    async def granted_purposes(self, user_id: str) -> Set[str]:
        rows = (
            await service_db().table("consents").select("purpose")
            .eq("user_id", user_id).eq("granted", True).is_("withdrawn_at", "null").execute()
        ).data
        return {r["purpose"] for r in rows}

    async def store(self, user_id: str, req: AssessmentRequest, result: Dict[str, Any], queue: bool,
                    mode: str = "live", created_at: Optional[str] = None) -> str:
        row = {
            "user_id": user_id,
            "assessment_mode": mode,
            "inputs": stored_inputs(req),
            "results": result["results"],
            "next_step": result["next_step"],
            "emergency_flag": result["emergency"],
            "review_status": "pending" if queue else "not_required",
            "model_versions": result["model_versions"],
        }
        if created_at:
            row["created_at"] = created_at
        asm_id = (await service_db().table("risk_assessments").insert(row).execute()).data[0]["id"]
        if queue:
            await service_db().table("review_queue").insert(
                {"assessment_id": asm_id, "patient_id": user_id, "reasons": result["queue_reasons"]}
            ).execute()
        return asm_id

    async def run(self, user_id: str, req: AssessmentRequest) -> Dict[str, Any]:
        purposes = await self.granted_purposes(user_id)
        if "assessment_processing" not in purposes:
            raise ConsentRequiredError(CONSENT_REQUIRED_MESSAGE)

        result = await run_in_threadpool(screening.assess, req)
        response = screening.shape_for_role(result, "patient")
        response.update({"id": None, "stored": False, "queued_for_review": False})
        if result["next_step"] == screening.CORRECT_INPUTS:
            return response

        wants_queue = bool(result["queue_reasons"])
        if "store_history" in purposes:
            queue = wants_queue and "share_with_clinician" in purposes
            response["id"] = await self.store(user_id, req, result, queue)
            response.update({"stored": True, "queued_for_review": queue})
        else:
            queue = False
            await log_event(user_id, "ASSESSMENT_NOT_STORED", "risk_assessment",
                            metadata={"next_step": result["next_step"],
                                      "model_versions": {d: v["version"] for d, v in result["model_versions"].items()}})
        if wants_queue and not queue:
            response["notes"] = [*response["notes"], "no_clinician_review_without_consent"]
        return response

    async def get_assessment(self, db: AsyncPostgrestClient, assessment_id: str) -> Optional[AssessmentRecord]:
        rows = (await db.table("risk_assessments").select("*").eq("id", assessment_id).execute()).data
        return AssessmentRecord(**rows[0]) if rows else None

    async def list_assessments(self, db: AsyncPostgrestClient, user_id: str) -> List[AssessmentRecord]:
        rows = (
            await db.table("risk_assessments")
            .select("*")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .execute()
        ).data
        return [AssessmentRecord(**r) for r in rows]


def shape_record(record: AssessmentRecord, role: str) -> Dict[str, Any]:
    data = record.model_dump(mode="json")
    data["results"] = screening.shape_results(data["results"], role)
    return data
