"""P8: assistant endpoint — emergency always wins, medicines always refused, out-of-scope abstains,
and no message text is ever stored. No network: DB clients are replaced by in-memory fakes.
Tests that need the local encoder are skipped if its cache is missing (run `python -m ml.nlp.train_intents`)."""

import json
import sys
import time
from pathlib import Path

import jwt
import pytest
from fastapi.testclient import TestClient

from apps.api.core import auth
from apps.api.core.config import settings
from apps.api.main import app
from ml.nlp import encoder, rules
from ml.nlp.intent_model import META_PATH

svc = sys.modules["apps.api.services.assistant_service"]
client = TestClient(app)
SECRET = "test-only-jwt-secret-at-least-32-bytes-long"
PATIENT = "00000000-0000-4000-a000-000000000001"
DATA = Path(__file__).resolve().parents[2] / "ml" / "nlp" / "data"

needs_model = pytest.mark.skipif(not (META_PATH.exists() and encoder.is_available()),
                                 reason="encoder cache / intent artifact missing (run python -m ml.nlp.train_intents)")


def rows(name):
    return [json.loads(l) for l in (DATA / name).read_text(encoding="utf-8").splitlines() if l.strip()]


class FakeQuery:
    def __init__(self, store, table):
        self.store, self.table_name, self._insert = store, table, None

    def insert(self, row):
        self._insert = row
        return self

    def select(self, *_a, **_k):
        return self

    def eq(self, *_a, **_k):
        return self

    def order(self, *_a, **_k):
        return self

    def limit(self, *_a, **_k):
        return self

    async def execute(self):
        if self._insert is not None:
            self.store.inserts.append((self.table_name, self._insert))
            return type("R", (), {"data": [self._insert]})()
        return type("R", (), {"data": self.store.assessments})()


class FakeDB:
    def __init__(self):
        self.inserts, self.assessments = [], []

    def table(self, name):
        return FakeQuery(self, name)


@pytest.fixture
def db(monkeypatch):
    monkeypatch.setattr(settings, "SUPABASE_JWT_SECRET", SECRET)
    monkeypatch.setattr(settings, "SUPABASE_URL", "https://vitalnex-test.invalid")
    monkeypatch.setattr(settings, "SUPABASE_SECRET_KEY", "test-service-key")
    monkeypatch.setattr(settings, "SUPABASE_PUBLISHABLE_KEY", "test-publishable-key")

    async def role(uid):
        return "patient" if uid == PATIENT else None

    monkeypatch.setattr(auth, "lookup_role", role)
    fake = FakeDB()
    monkeypatch.setattr(svc, "service_db", lambda: fake)
    monkeypatch.setattr(svc, "user_db", lambda token: fake)
    return fake


def ask(message, lang="en"):
    claims = {"sub": PATIENT, "aud": "authenticated", "exp": int(time.time()) + 3600}
    h = {"Authorization": f"Bearer {jwt.encode(claims, SECRET, algorithm='HS256')}"}
    res = client.post("/api/v1/assistant/message", headers=h, json={"message": message, "language": lang})
    assert res.status_code == 200, res.text
    return res.json()


def assert_logged_without_text(db, message):
    logs = [r for t, r in db.inserts if t == "assistant_logs"]
    assert logs, "every message is logged"
    for r in logs:
        assert set(r) == {"user_id", "intent", "confidence", "emergency_flag"}
        assert message not in json.dumps(r, ensure_ascii=False)
    assert {t for t, _ in db.inserts} == {"assistant_logs"}  # nothing else is written


# ---------------------------------------------------------------- rule paths (no encoder needed)

@pytest.mark.parametrize("message,lang", [
    ("I have crushing chest pain", "en"), ("सीने में बहुत तेज़ दर्द है", "hi"), ("chhatit khup dukhtay", "mr"),
])
def test_emergency_reply_shows_108_112_and_is_logged_without_text(db, message, lang):
    data = ask(message, lang)
    assert data["intent"] == "EMERGENCY" and data["escalation_recommended"] is True
    assert "108" in data["response"] and "112" in data["response"]
    assert data["suggestions"][0]["action_type"] == "emergency_call"
    assert_logged_without_text(db, message)
    assert db.inserts[-1][1]["emergency_flag"] is True


@pytest.mark.parametrize("message,lang", [
    ("how much metformin should I take", "en"), ("kitni goli leni chahiye", "hi"), ("मी किती मेटफॉर्मिन घ्यावे", "mr"),
])
def test_medication_request_is_refused(db, message, lang):
    data = ask(message, lang)
    assert data["intent"] == "MEDICATION_REQUEST" and data["escalation_recommended"] is False
    assert data["response"] == svc.content("assistant", lang)["medication_refusal"]  # fixed text, no drug named
    assert data["citations"] == []
    assert_logged_without_text(db, message)


def test_emergency_beats_medication(db):
    data = ask("I took too many pills and my chest hurts")
    assert data["intent"] == "EMERGENCY"


def test_classifier_unavailable_is_reported_not_hidden(db, monkeypatch):
    def broken():
        raise FileNotFoundError("no artifact")

    monkeypatch.setattr(svc, "load_classifier", broken)
    data = ask("tell me about my result")
    assert data["intent"] == "UNAVAILABLE" and data["decided_by"] == "unavailable"
    assert ask("my father collapsed and is unconscious")["intent"] == "EMERGENCY"  # rules still work


def test_assistant_service_has_no_external_or_generative_calls():
    src = Path(svc.__file__).read_text(encoding="utf-8")
    for banned in ("httpx", "requests", "openai", "gemini", "GEMINI", "anthropic", "generate("):
        assert banned not in src


def test_explain_text_uses_bands_and_templates_only():
    row = {"created_at": "2026-10-20T10:00:00+00:00", "next_step": "see_doctor_soon",
           "results": {"diabetes": {"band": "high", "abstained": False, "probability": 0.6123,
                                    "top_factors": [{"feature": "BMI", "direction": "raises"}]},
                       "heart": {"band": None, "abstained": True, "top_factors": []},
                       "stroke": {"band": "low", "abstained": False, "top_factors": []}}}
    for lang in ("en", "hi", "mr"):
        t = svc.explain_text(row, lang)
        assert "0.61" not in t and "61" not in t  # no probability is shown
    en = svc.explain_text(row, "en")
    assert "high band" in en and "not confident" in en and "within 2 weeks" in en and "not a diagnosis" in en


# ---------------------------------------------------------------- classifier paths

@needs_model
@pytest.mark.parametrize("lang", ["en", "hi", "mr"])
def test_pipeline_emergency_recall_is_100_percent_on_test_phrases(lang):
    msgs = [r["text"] for r in rows("intents_test.jsonl") if r["intent"] == "EMERGENCY" and r["lang"] == lang]
    missed = [m for m in msgs if svc.classify(m).intent != "EMERGENCY"]
    assert missed == []


@needs_model
def test_pipeline_emergency_recall_on_untuned_holdout_is_reported():
    """The hold-out was written after the rules were frozen and is never tuned on. Its recall is reported
    in nlp_meta.json (1 romanised Marathi miss at P8 sign-off); this guards against regressions."""
    msgs = [r["text"] for r in rows("emergency_holdout.jsonl")]
    hit = sum(svc.classify(m).intent == "EMERGENCY" for m in msgs)
    assert hit / len(msgs) >= 0.9


@needs_model
@pytest.mark.parametrize("lang", ["en", "hi", "mr"])
def test_pipeline_refuses_every_medication_test_request(lang):
    msgs = [r["text"] for r in rows("intents_test.jsonl") if r["intent"] == "MEDICATION_REQUEST" and r["lang"] == lang]
    assert [m for m in msgs if svc.classify(m).intent not in ("MEDICATION_REQUEST", "EMERGENCY")] == []


@needs_model
@pytest.mark.parametrize("message,lang", [
    ("who won the cricket match yesterday", "en"), ("what's a good recipe for paneer tikka", "en"),
    ("koi web series batao", "hi"), ("पुण्याहून नाशिक किती किलोमीटर आहे", "mr"),
])
def test_out_of_scope_abstains(db, message, lang):
    data = ask(message, lang)
    assert data["intent"] == "OUT_OF_SCOPE"
    assert data["citations"] == []
    assert_logged_without_text(db, message)


@needs_model
def test_encoder_runs_offline_after_local_load(monkeypatch):
    """No outbound call: a local load switches HF to offline mode (blocks transformers' auto-conversion ping)."""
    import os

    import httpx

    encoder.get_model()
    assert os.environ.get("HF_HUB_OFFLINE") == "1"

    def no_network(*_a, **_k):
        raise AssertionError("network call from the assistant")

    monkeypatch.setattr(httpx.Client, "send", no_network)
    assert svc.classify("what is a stroke?").intent == "DISEASE_INFO"


@needs_model
def test_out_of_scope_rate_on_test_set():
    msgs = [r["text"] for r in rows("intents_test.jsonl") if r["intent"] == "OUT_OF_SCOPE"]
    ok = sum(svc.classify(m).intent == "OUT_OF_SCOPE" for m in msgs)
    assert ok / len(msgs) >= 0.75  # 0.80 at P8 sign-off (24/30); misses go to a FAQ / nav reply, never to advice


@needs_model
def test_faq_answer_has_source_and_is_from_library(db):
    data = ask("what is prediabetes?")
    assert data["intent"] == "DISEASE_INFO"
    assert data["citations"] and data["citations"][0]["url"].startswith("https://")
    library = {e["answer"] for e in json.loads((DATA.parent / "faq.en.json").read_text(encoding="utf-8"))["entries"]}
    assert data["response"] in library


@needs_model
def test_explain_result_reads_latest_assessment(db):
    db.assessments = [{"created_at": "2026-10-20T10:00:00+00:00", "next_step": "discuss_next_checkup", "inputs": {},
                       "results": {d: {"band": "moderate", "abstained": False, "top_factors": []}
                                   for d in ("diabetes", "heart", "stroke")}}]
    data = ask("please explain my screening result")
    assert data["intent"] == "EXPLAIN_RESULT"
    assert "moderate band" in data["response"]
    assert_logged_without_text(db, "please explain my screening result")
