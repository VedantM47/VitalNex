"""
Assistant service — the SPEC §5 pipeline. No generative model, no external API (D-13, hard rule 6).

Per message:
1. Emergency rules (ml/nlp/data/emergency_phrases.json, shared with the assessment) -> 108 / 112.
   D-26: a bare red-flag word ("stroke", "लकवा", "heart attack", ...) sets `emergency_card`: the
   108 / 112 card is shown AND the normal answer below it.
2. Medicine / dose rule (ml/nlp/data/medication_phrases.json) -> polite refusal.
3. Encode with the local IndicSBERT encoder (loaded once, CPU).
4. Intent classifier. Safety backstops first (P(EMERGENCY) / P(MEDICATION_REQUEST) above their
   validation-chosen thresholds), then abstain to OUT_OF_SCOPE when max probability < threshold.
5. Action: templated explanation from the user's latest stored assessment, sourced FAQ retrieval
   (below the similarity threshold -> "no reliable answer"), or a navigation reply + button.
6. Log only intent, confidence and emergency flag (true whenever the 108 / 112 card was shown) in assistant_logs. Message text is never stored
   or logged anywhere.
Every sentence returned comes from apps/api/content/assistant.{lang}.json, the FAQ files, or the
existing explanation / guidance content files.
"""

import json
import logging
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi.concurrency import run_in_threadpool

from apps.api.core.auth import CurrentUser
from apps.api.core.db import service_db, user_db
from apps.api.schemas import ActionSuggestion, AssistantMessageRequest, AssistantMessageResponse
from apps.api.schemas.assessment import AssessmentInputs
from ml.nlp import encoder, faq, rules
from ml.nlp.intent_model import load_classifier

log = logging.getLogger("vitalnex.assistant")
CONTENT = Path(__file__).resolve().parents[1] / "content"
DISEASES = ("diabetes", "heart", "stroke")

EMERGENCY, MEDICATION, OOS = "EMERGENCY", "MEDICATION_REQUEST", "OUT_OF_SCOPE"
UNAVAILABLE = "UNAVAILABLE"  # encoder / classifier could not be loaded (logged as such, never hidden)

NAV = {
    "BOOK_APPOINTMENT": ("book", [("appointments", "/appointments"), ("care_connect", "/care-connect")]),
    "FIND_DOCTOR": ("find_doctor", [("care_connect", "/care-connect"), ("appointments", "/appointments")]),
    "MY_DATA": ("my_data", [("my_data", "/settings")]),
}


@lru_cache(maxsize=9)
def content(kind: str, lang: str) -> Dict[str, Any]:
    return json.loads((CONTENT / f"{kind}.{lang}.json").read_text(encoding="utf-8"))


@dataclass
class Decision:
    """What the pipeline decided. `confidence` is the classifier probability; None when a
    deterministic rule decided (rules have no probability)."""
    intent: str
    confidence: Optional[float]
    source: str  # rule | classifier | abstain | unavailable
    embedding: Any = field(default=None, repr=False)
    emergency_card: bool = False  # show the 108 / 112 card (full emergency or D-26 bare red-flag word)


def warm_up() -> bool:
    """Optional: load encoder + classifier + FAQ embeddings once (e.g. at API startup)."""
    try:
        load_classifier()
        encoder.get_model()
        for lang in faq.LANGS:
            faq.question_embeddings(lang)
        return True
    except Exception as e:  # noqa: BLE001 — report, don't crash startup
        log.warning("assistant warm-up failed: %s", type(e).__name__)
        return False


def classify(text: str) -> Decision:
    """Steps 1-4. Pure function of the text (no I/O besides the local model); used by tests."""
    d = _classify(text)
    d.emergency_card = d.intent == EMERGENCY or rules.has_bare_red_flag(text)
    return d


def _classify(text: str) -> Decision:
    if rules.is_emergency(text):
        return Decision(EMERGENCY, None, "rule")
    if rules.is_medication_request(text):
        return Decision(MEDICATION, None, "rule")
    try:
        clf = load_classifier()
        emb = encoder.encode([text])
        proba = clf.predict_proba([text], emb)[0]
    except Exception as e:  # missing artifact / encoder cache
        log.warning("assistant classifier unavailable: %s", type(e).__name__)
        return Decision(UNAVAILABLE, None, "unavailable")
    th = clf.thresholds
    labels = clf.labels
    p_em, p_med = float(proba[labels.index(EMERGENCY)]), float(proba[labels.index(MEDICATION)])
    if p_em >= th["emergency"]:
        return Decision(EMERGENCY, p_em, "classifier", emb[0])
    if p_med >= th["medication"]:
        return Decision(MEDICATION, p_med, "classifier", emb[0])
    i = int(proba.argmax())
    conf = float(proba[i])
    if conf < th["oos"]:
        return Decision(OOS, conf, "abstain", emb[0])
    return Decision(labels[i], conf, "classifier", emb[0])


class AgentService:
    # ------------------------------------------------------------------ public

    async def handle_message(self, request: AssistantMessageRequest, user: CurrentUser) -> AssistantMessageResponse:
        lang = request.language
        decision = await run_in_threadpool(classify, request.message)
        reply = await self._act(decision, lang, user)
        await self._log(user.id, decision)
        return reply

    # ------------------------------------------------------------------ actions

    async def _act(self, d: Decision, lang: str, user: CurrentUser) -> AssistantMessageResponse:
        c = content("assistant", lang)
        L = c["labels"]
        if d.intent == EMERGENCY:
            return self._reply(lang, d, c["emergency"], [
                self._sug("act-emergency", L["call"], "emergency_call", {"numbers": ["108", "112"]}),
                self._nav(L["care_connect"], "/care-connect"),
            ], escalate=True)
        if d.intent == MEDICATION:
            return self._reply(lang, d, c["medication_refusal"], [
                self._nav(L["care_connect"], "/care-connect"), self._nav(L["appointments"], "/appointments")])
        if d.intent == UNAVAILABLE:
            return self._reply(lang, d, c["unavailable"], self._default_suggestions(L))
        if d.intent == "GREETING":
            return self._reply(lang, d, c["greeting"], self._default_suggestions(L))
        if d.intent == OOS:
            return self._reply(lang, d, c["out_of_scope"], self._default_suggestions(L))
        if d.intent in NAV:
            key, buttons = NAV[d.intent]
            return self._reply(lang, d, c[key], [self._nav(L[b], path) for b, path in buttons])
        if d.intent in ("DISEASE_INFO", "HOW_AI_WORKS"):
            return await run_in_threadpool(self._faq, d, lang)
        if d.intent == "EXPLAIN_RESULT":
            return await self._explain(d, lang, user)
        if d.intent == "WHAT_CAN_I_CHANGE":
            return await self._what_can_i_change(d, lang, user)
        return self._reply(lang, d, c["out_of_scope"], self._default_suggestions(L))  # unknown label

    def _faq(self, d: Decision, lang: str) -> AssistantMessageResponse:
        c = content("assistant", lang)
        topics = faq.DISEASE_TOPICS if d.intent == "DISEASE_INFO" else faq.VITALNEX_TOPICS
        entry, sim = faq.best_match(d.embedding, lang, topics)
        if entry is None or sim < load_classifier().thresholds["faq_similarity"]:
            return self._reply(lang, d, c["no_faq_answer"], self._default_suggestions(c["labels"]),
                               extra={"faq_id": None, "faq_similarity": round(sim, 3)})
        sugg = [self._nav(c["labels"]["ai_trust"], "/ai-trust")] if d.intent == "HOW_AI_WORKS" else \
            [self._nav(c["labels"]["risk_assessment"], "/risk-assessment"), self._nav(c["labels"]["care_connect"], "/care-connect")]
        return self._reply(lang, d, entry["answer"], sugg,
                           citations=[{"title": entry["source_title"], "url": entry["source_url"]}],
                           extra={"faq_id": entry["id"], "faq_similarity": round(sim, 3)})

    async def latest_assessment(self, user: CurrentUser) -> Optional[Dict[str, Any]]:
        """The caller's newest stored assessment, read through RLS with their own token."""
        try:
            rows = (await user_db(user.access_token).table("risk_assessments")
                    .select("created_at,inputs,results,next_step")
                    .eq("user_id", user.id).order("created_at", desc=True).limit(1).execute()).data
        except Exception as e:  # noqa: BLE001 — DB down: say we found nothing rather than fail
            log.warning("latest assessment lookup failed: %s", type(e).__name__)
            return None
        return rows[0] if rows else None

    async def _explain(self, d: Decision, lang: str, user: CurrentUser) -> AssistantMessageResponse:
        c = content("assistant", lang)
        L = c["labels"]
        row = await self.latest_assessment(user)
        if not row:
            return self._reply(lang, d, c["no_assessment"], [self._nav(L["risk_assessment"], "/risk-assessment")])
        return self._reply(lang, d, explain_text(row, lang),
                           [self._nav(L["history"], "/history"), self._nav(L["care_connect"], "/care-connect")])

    async def _what_can_i_change(self, d: Decision, lang: str, user: CurrentUser) -> AssistantMessageResponse:
        c = content("assistant", lang)
        L = c["labels"]
        row = await self.latest_assessment(user)
        items = change_items(row, lang) if row else None
        if not items:
            return self._reply(lang, d, c["change_none"], [self._nav(L["risk_assessment"], "/risk-assessment")])
        text = "\n".join([c["change_intro"], *[f"• {i['text']}" for i in items], c["change_footer"]])
        cites = [{"title": i["source_title"], "url": i["source_url"]} for i in items if i.get("source_url")]
        return self._reply(lang, d, text, [self._nav(L["history"], "/history")], citations=cites)

    # ------------------------------------------------------------------ helpers

    async def _log(self, user_id: str, d: Decision) -> None:
        """assistant_logs has no message column; only these three fields are written."""
        row = {"user_id": user_id, "intent": d.intent,
               "confidence": None if d.confidence is None else round(float(d.confidence), 4),
               "emergency_flag": d.intent == EMERGENCY or d.emergency_card}
        try:
            await service_db().table("assistant_logs").insert(row).execute()
        except Exception as e:  # noqa: BLE001 — logging must never block an emergency reply
            log.warning("assistant_logs insert failed: %s", type(e).__name__)

    @staticmethod
    def _sug(sid: str, label: str, action_type: str, payload: Optional[Dict[str, Any]] = None) -> ActionSuggestion:
        return ActionSuggestion(id=sid, label=label, action_type=action_type, payload=payload or {})

    def _nav(self, label: str, path: str) -> ActionSuggestion:
        return self._sug(f"nav-{path.strip('/') or 'home'}", label, "navigate", {"path": path})

    def _default_suggestions(self, L: Dict[str, str]) -> List[ActionSuggestion]:
        return [self._sug("ask-explain", L["ask_explain"], "ask"), self._sug("ask-change", L["ask_change"], "ask"),
                self._sug("ask-disease", L["ask_disease"], "ask"), self._sug("ask-ai", L["ask_ai"], "ask"),
                self._nav(L["care_connect"], "/care-connect")]

    def _reply(self, lang: str, d: Decision, text: str, suggestions: List[ActionSuggestion],
               citations: Optional[List[Dict[str, str]]] = None, escalate: bool = False,
               extra: Optional[Dict[str, Any]] = None) -> AssistantMessageResponse:
        return AssistantMessageResponse(
            id=f"ast-{uuid.uuid4().hex[:8]}",
            response=text,
            language=lang,
            intent=d.intent,
            confidence=None if d.confidence is None else round(float(d.confidence), 4),
            decided_by=d.source,
            suggestions=suggestions,
            citations=citations or [],
            escalation_recommended=escalate,
            disclaimer=content("assistant", lang)["disclaimer"],
            emergency_card=d.emergency_card,
            details=extra or {},
            timestamp=datetime.now(timezone.utc),
        )


# ---------------------------------------------------------------------- templated text

def explain_text(row: Dict[str, Any], lang: str) -> str:
    """Bands and top factors of a stored assessment, using the same explanation templates as the
    results page (apps/api/content/explanations.{lang}.json). No probability is shown."""
    c = content("assistant", lang)
    ex = content("explanations", lang)
    lines = [c["explain_intro"].format(date=str(row.get("created_at", ""))[:10])]
    step = row.get("next_step")
    results = row.get("results") or {}
    if step in ("emergency", "correct_inputs") or not results:
        lines.append(c["next_step"].get(step, c["next_step"]["not_confident"]))
        return "\n".join(lines)
    for dis in DISEASES:
        r = results.get(dis)
        if not r:
            continue
        name = c["diseases"][dis]
        if r.get("abstained") or not r.get("band"):
            lines.append(c["explain_abstained"].format(disease=name))
            continue
        lines.append(c["explain_band"].format(disease=name, band=c["bands"].get(r["band"], r["band"])))
        factors = []
        for f in r.get("top_factors", [])[:3]:
            feat, direction = f.get("feature"), f.get("direction")
            if feat in ex["features"] and direction in ex["templates"]:
                t = ex["templates"][direction].format(feature=ex["features"][feat])
                factors.append(t[:1].upper() + t[1:])
        if factors:
            lines.append(c["explain_factors"].format(factors=" ".join(factors)))
    if step in c["next_step"]:
        lines.append(c["next_step"][step])
    lines.append(c["explain_footer"])
    return "\n".join(lines)


def change_items(row: Dict[str, Any], lang: str) -> Optional[List[Dict[str, Any]]]:
    """The curated, cited guidance items for the stored answers (same rules as the results page)."""
    from apps.api.services import screening  # read-only reuse of the P4 guidance rules

    inputs = row.get("inputs") or {}
    try:
        answers = AssessmentInputs.model_validate({k: inputs[k] for k in AssessmentInputs.model_fields})
    except Exception:  # noqa: BLE001 — stored row without full answers
        return None
    return [i for i in screening.guidance(answers, lang) if i["key"] != "regular_checkups"] or \
        screening.guidance(answers, lang)
