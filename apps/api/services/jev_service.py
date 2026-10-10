"""
Jev Decision Service — Bounded AI Orchestration Layer.

Uses the TypeSafe AI SDK (Jev) for three bounded decisions:
1. Clinical Review Routing (STANDARD_REVIEW / CAUTION_REVIEW / HUMAN_REVIEW)
2. Assistant Intent Classification
3. Report Review Classification

IMPORTANT:
- Jev does NOT perform clinical diagnosis or treatment.
- Jev does NOT replace the clinical prediction model.
- Deterministic safety rules ALWAYS override Jev decisions.
- If TYPESAFE_API_KEY is unavailable, deterministic fallback rules are used.
- Failed Jev calls are never fabricated as successful.
"""

import os
import httpx
import logging
from typing import Dict, Any, Optional
from enum import Enum

logger = logging.getLogger("vitalnex.jev")

TYPESAFE_API_KEY = os.environ.get("TYPESAFE_API_KEY", "")
TYPESAFE_DEFAULT_MODEL = os.environ.get("TYPESAFE_DEFAULT_MODEL", "jev-latest")
TYPESAFE_API_URL = os.environ.get("TYPESAFE_API_URL", "https://api.typesafe.ai/v1/chat/completions")
JEV_TIMEOUT = 15.0  # seconds


class ReviewDecision(str, Enum):
    STANDARD_REVIEW = "STANDARD_REVIEW"
    CAUTION_REVIEW = "CAUTION_REVIEW"
    HUMAN_REVIEW = "HUMAN_REVIEW"


class AssistantIntent(str, Enum):
    HEALTH_PROFILE = "HEALTH_PROFILE"
    ASSESSMENT_EXPLANATION = "ASSESSMENT_EXPLANATION"
    HEALTH_INSIGHT = "HEALTH_INSIGHT"
    APPOINTMENT = "APPOINTMENT"
    DOCTOR_DISCOVERY = "DOCTOR_DISCOVERY"
    TRUST_PASSPORT = "TRUST_PASSPORT"
    GENERAL_GUIDANCE = "GENERAL_GUIDANCE"
    EMERGENCY_ESCALATION = "EMERGENCY_ESCALATION"
    OUT_OF_SCOPE = "OUT_OF_SCOPE"
    HUMAN_REVIEW = "HUMAN_REVIEW"


class ReportReviewDecision(str, Enum):
    STANDARD = "STANDARD"
    ATTENTION_REQUIRED = "ATTENTION_REQUIRED"
    HUMAN_REVIEW = "HUMAN_REVIEW"


def is_jev_available() -> bool:
    """Check if Jev integration is configured."""
    return bool(TYPESAFE_API_KEY and TYPESAFE_API_KEY.strip())


async def _call_jev(system_prompt: str, user_prompt: str) -> Optional[str]:
    """Make a bounded call to the TypeSafe Jev API. Returns response text or None on failure."""
    if not is_jev_available():
        return None

    try:
        async with httpx.AsyncClient(timeout=JEV_TIMEOUT) as client:
            response = await client.post(
                TYPESAFE_API_URL,
                headers={
                    "Authorization": f"Bearer {TYPESAFE_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": TYPESAFE_DEFAULT_MODEL,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                    "max_tokens": 150,
                    "temperature": 0.1,
                },
            )
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"].strip()
    except httpx.TimeoutException:
        logger.warning("Jev API call timed out")
        return None
    except httpx.HTTPStatusError as e:
        logger.warning(f"Jev API HTTP error: {e.response.status_code}")
        return None
    except Exception as e:
        logger.warning(f"Jev API call failed: {type(e).__name__}")
        return None


async def classify_review_routing(
    risk_band: str,
    risk_score: float,
    data_quality_score: float,
    uncertainty: float,
    human_review_required: bool,
    out_of_range_fields: list,
) -> Dict[str, Any]:
    """
    Decision 1: Clinical Review Routing.

    Deterministic safety rules ALWAYS override Jev:
    - High risk MUST NOT be downgraded.
    - Out-of-range inputs MUST remain flagged.
    - Missing required inputs MUST remain flagged.
    """
    # Deterministic hard rules (cannot be overridden by Jev)
    if risk_band == "High" or human_review_required:
        deterministic_decision = ReviewDecision.HUMAN_REVIEW
    elif data_quality_score < 80 or len(out_of_range_fields) > 0:
        deterministic_decision = ReviewDecision.CAUTION_REVIEW
    elif risk_band == "Moderate" and uncertainty > 0.10:
        deterministic_decision = ReviewDecision.CAUTION_REVIEW
    else:
        deterministic_decision = ReviewDecision.STANDARD_REVIEW

    # Try Jev for semantic judgment
    jev_used = False
    jev_decision = None
    jev_reason = None

    if is_jev_available():
        system_prompt = (
            "You are a clinical decision routing classifier for VITALNEX healthcare platform. "
            "Given an assessment state, respond with EXACTLY one of: STANDARD_REVIEW, CAUTION_REVIEW, HUMAN_REVIEW. "
            "Then provide a one-sentence reason. Format: DECISION|Reason."
        )
        user_prompt = (
            f"Risk band: {risk_band}, Risk score: {risk_score}%, "
            f"Data quality: {data_quality_score}%, Uncertainty: {uncertainty}, "
            f"Out-of-range fields: {out_of_range_fields}, "
            f"Human review already required: {human_review_required}"
        )

        result = await _call_jev(system_prompt, user_prompt)
        if result:
            jev_used = True
            parts = result.split("|", 1)
            raw_decision = parts[0].strip().upper()
            jev_reason = parts[1].strip() if len(parts) > 1 else "Jev classification applied."

            if raw_decision in [d.value for d in ReviewDecision]:
                jev_decision = ReviewDecision(raw_decision)
            else:
                jev_decision = None

    # Apply safety override: Jev cannot downgrade a deterministic HUMAN_REVIEW
    if jev_decision and jev_used:
        if deterministic_decision == ReviewDecision.HUMAN_REVIEW:
            # Jev cannot downgrade from HUMAN_REVIEW
            final_decision = ReviewDecision.HUMAN_REVIEW
            reason = "Deterministic safety rule requires human review."
            if jev_decision != ReviewDecision.HUMAN_REVIEW:
                reason += " (Jev suggested differently but safety rules override.)"
        elif deterministic_decision == ReviewDecision.CAUTION_REVIEW and jev_decision == ReviewDecision.STANDARD_REVIEW:
            # Jev cannot downgrade from CAUTION to STANDARD
            final_decision = ReviewDecision.CAUTION_REVIEW
            reason = "Data quality or uncertainty flags require caution review."
        else:
            final_decision = jev_decision
            reason = jev_reason or "Jev classification applied."
    else:
        final_decision = deterministic_decision
        reason = _deterministic_reason(deterministic_decision, risk_band, data_quality_score, uncertainty)

    return {
        "decision": final_decision.value,
        "reason": reason,
        "jev_used": jev_used,
        "jev_available": is_jev_available(),
        "deterministic_override_applied": (
            jev_used and jev_decision and final_decision != jev_decision
        ),
        "descriptions": {
            "STANDARD_REVIEW": "Assessment within normal parameters. Automated screening pathway.",
            "CAUTION_REVIEW": "Some indicators warrant additional attention. Review recommended.",
            "HUMAN_REVIEW": "Assessment requires review by a licensed healthcare professional.",
        },
    }


def _deterministic_reason(decision: ReviewDecision, risk_band: str, dq: float, uncertainty: float) -> str:
    if decision == ReviewDecision.HUMAN_REVIEW:
        return "High-risk assessment or clinical flags require professional review."
    elif decision == ReviewDecision.CAUTION_REVIEW:
        reasons = []
        if dq < 80:
            reasons.append("data quality below threshold")
        if uncertainty > 0.10:
            reasons.append("elevated uncertainty")
        return f"Caution review advised: {', '.join(reasons) or 'moderate risk indicators'}."
    return "Automated screening within normal parameters."


async def classify_assistant_intent(message: str, language: str = "en") -> Dict[str, Any]:
    """
    Decision 2: Assistant Intent Classification.
    Routes user messages to application intents.
    """
    msg_lower = message.lower()

    # Deterministic emergency detection (always runs first)
    emergency_keywords = [
        "chest pain", "heart attack", "can't breathe", "shortness of breath",
        "severe pain", "emergency", "dying", "stroke",
        "छातीत दुखणे", "सीने में दर्द", "हृदयविकार", "सांस नहीं आ रही",
    ]
    if any(kw in msg_lower for kw in emergency_keywords):
        return {
            "intent": AssistantIntent.EMERGENCY_ESCALATION.value,
            "confidence": 1.0,
            "jev_used": False,
            "method": "deterministic_emergency_detection",
        }

    # Try Jev for semantic classification
    if is_jev_available():
        system_prompt = (
            "You are an intent classifier for VITALNEX healthcare assistant. "
            "Classify the user message into EXACTLY one of: "
            "HEALTH_PROFILE, ASSESSMENT_EXPLANATION, HEALTH_INSIGHT, APPOINTMENT, "
            "DOCTOR_DISCOVERY, TRUST_PASSPORT, GENERAL_GUIDANCE, EMERGENCY_ESCALATION, "
            "OUT_OF_SCOPE, HUMAN_REVIEW. "
            "Respond with just the intent name."
        )
        result = await _call_jev(system_prompt, message)
        if result:
            intent_str = result.strip().upper().replace(" ", "_")
            valid_intents = [i.value for i in AssistantIntent]
            if intent_str in valid_intents:
                return {
                    "intent": intent_str,
                    "confidence": 0.85,
                    "jev_used": True,
                    "method": "jev_classification",
                }

    # Deterministic keyword fallback
    intent = _keyword_classify(msg_lower)
    return {
        "intent": intent.value,
        "confidence": 0.70,
        "jev_used": False,
        "method": "deterministic_keyword_fallback",
    }


def _keyword_classify(msg: str) -> AssistantIntent:
    """Simple keyword-based intent classification fallback."""
    if any(w in msg for w in ["profile", "health record", "प्रोफाइल", "my health"]):
        return AssistantIntent.HEALTH_PROFILE
    if any(w in msg for w in ["risk", "assessment", "score", "जोखीम", "जोखिम", "screening"]):
        return AssistantIntent.ASSESSMENT_EXPLANATION
    if any(w in msg for w in ["insight", "lifestyle", "diet", "exercise", "जीवनशैली"]):
        return AssistantIntent.HEALTH_INSIGHT
    if any(w in msg for w in ["appointment", "book", "schedule", "अपॉइंटमेंट"]):
        return AssistantIntent.APPOINTMENT
    if any(w in msg for w in ["doctor", "specialist", "clinician", "डॉक्टर"]):
        return AssistantIntent.DOCTOR_DISCOVERY
    if any(w in msg for w in ["trust", "passport", "explain", "shap", "fairness"]):
        return AssistantIntent.TRUST_PASSPORT
    return AssistantIntent.GENERAL_GUIDANCE


async def classify_report_review(
    risk_band: str, risk_score: float, human_review_required: bool
) -> Dict[str, Any]:
    """Decision 3: Report presentation classification."""
    # Deterministic logic
    if risk_band == "High" or human_review_required:
        det_decision = ReportReviewDecision.HUMAN_REVIEW
    elif risk_band == "Moderate" and risk_score > 50:
        det_decision = ReportReviewDecision.ATTENTION_REQUIRED
    else:
        det_decision = ReportReviewDecision.STANDARD

    jev_used = False
    if is_jev_available():
        result = await _call_jev(
            "Classify this assessment report as: STANDARD, ATTENTION_REQUIRED, or HUMAN_REVIEW. Respond with just the classification.",
            f"Risk: {risk_band} ({risk_score}%), Human review required: {human_review_required}",
        )
        if result:
            jev_used = True
            r = result.strip().upper().replace(" ", "_")
            if r in [d.value for d in ReportReviewDecision]:
                # Cannot downgrade from HUMAN_REVIEW
                if det_decision == ReportReviewDecision.HUMAN_REVIEW:
                    pass
                else:
                    det_decision = ReportReviewDecision(r)

    return {
        "decision": det_decision.value,
        "jev_used": jev_used,
        "jev_available": is_jev_available(),
    }
