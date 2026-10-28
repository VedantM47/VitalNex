"""
P4 prediction API tests: validation, rule order, role shaping, consent-driven persistence,
what-if / recourse, model registry, and stress tests built from the Pune synthetic rows.
Database calls are replaced by in-memory fakes; the real models in ml/artifacts are used.
"""

import sys
import time

import jwt
import pandas as pd
import pytest
from fastapi.testclient import TestClient

from apps.api.core import auth
from apps.api.core.config import settings
from apps.api.main import app
from apps.api.schemas import AssessmentRequest
from apps.api.services import prediction_service, screening

# The services package exports an instance named prediction_service; get the module itself.
ps_module = sys.modules["apps.api.services.prediction_service"]

client = TestClient(app)
SECRET = "test-only-jwt-secret-at-least-32-bytes-long"
PATIENT, DOCTOR = "00000000-0000-4000-a000-000000000001", "00000000-0000-4000-a000-000000000002"
ROLES = {PATIENT: "patient", DOCTOR: "doctor"}
ALL = {"assessment_processing", "store_history", "share_with_clinician", "aggregate_audit"}

LOW = {"age": 30, "sex": "female", "height_cm": 162, "weight_kg": 55, "high_bp": False, "high_chol": False,
       "smoker": False, "phys_activity": True, "fruits": True, "veggies": True, "heavy_alcohol": False,
       "gen_health": 1, "ment_health_days": 0, "phys_health_days": 0, "diff_walk": False}
HIGH = {**LOW, "age": 68, "sex": "male", "weight_kg": 88, "high_bp": True, "high_chol": True, "smoker": True,
        "phys_activity": False, "gen_health": 4, "phys_health_days": 15, "diff_walk": True}
ABSTAIN = {**LOW, "age": 52, "sex": "male", "weight_kg": 80, "high_bp": True, "smoker": True,
           "phys_activity": False, "gen_health": 3}


def bearer(sub):
    claims = {"sub": sub, "aud": "authenticated", "exp": int(time.time()) + 3600}
    return {"Authorization": f"Bearer {jwt.encode(claims, SECRET, algorithm='HS256')}"}


class FakeDB:
    def __init__(self):
        self.assessments, self.queue, self.audit = [], [], []


@pytest.fixture
def db(monkeypatch):
    monkeypatch.setattr(settings, "SUPABASE_JWT_SECRET", SECRET)
    monkeypatch.setattr(settings, "SUPABASE_URL", "https://vitalnex-test.invalid")
    monkeypatch.setattr(settings, "SUPABASE_SECRET_KEY", "test-service-key")

    async def role(uid):
        return ROLES.get(uid)

    monkeypatch.setattr(auth, "lookup_role", role)
    fake = FakeDB()
    fake.purposes = set(ALL)

    async def purposes(uid):
        return fake.purposes

    async def store(uid, req, result, queue, mode="live", created_at=None):
        fake.assessments.append({"inputs": ps_module.stored_inputs(req), "result": result, "queue": queue})
        if queue:
            fake.queue.append(result["queue_reasons"])
        return f"asm-{len(fake.assessments)}"

    async def log_event(*args, **kwargs):
        fake.audit.append((args, kwargs))

    monkeypatch.setattr(prediction_service, "granted_purposes", purposes)
    monkeypatch.setattr(prediction_service, "store", store)
    monkeypatch.setattr(ps_module, "log_event", log_event)
    return fake


def post(payload, sub=PATIENT, path="/api/v1/assessment"):
    return client.post(path, headers=bearer(sub), json=payload)


# --- validation -----------------------------------------------------------------------------

@pytest.mark.parametrize("field,value", [
    ("age", 17), ("age", 121), ("height_cm", 300), ("weight_kg", 10), ("gen_health", 6),
    ("ment_health_days", 40), ("phys_health_days", -1), ("sex", "other"),
])
def test_impossible_values_rejected(db, field, value):
    res = post({**LOW, field: value})
    assert res.status_code == 422
    assert field in {e["loc"][-1] for e in res.json()["detail"]}


def test_unknown_or_old_fields_rejected(db):
    assert post({**LOW, "ca": 0}).status_code == 422
    assert post({**LOW, "thal": 3}).status_code == 422


def test_bmi_gate_asks_to_correct_and_stores_nothing(db):
    res = post({**LOW, "height_cm": 120, "weight_kg": 110})  # BMI 76
    body = res.json()
    assert res.status_code == 200 and body["next_step"] == "correct_inputs"
    assert body["results"] == {} and not body["stored"] and db.assessments == []


# --- rule order -----------------------------------------------------------------------------

def test_emergency_bypasses_models(db, monkeypatch):
    def boom(*a, **k):
        raise AssertionError("models must not run for an emergency")

    monkeypatch.setattr(screening, "score", boom)
    for extra in ({"symptoms": {"chest_pain": True}}, {"free_text": "my father has crushing pain in chest"},
                  {"free_text": "सीने में दर्द हो रहा है"}):
        body = post({**HIGH, **extra}).json()
        assert body["next_step"] == "emergency" and body["emergency"] and body["results"] == {}
    assert db.queue[-1] == ["emergency"]


def test_free_text_is_never_stored(db):
    post({**LOW, "free_text": "I feel fine, just curious"})
    assert "free_text" not in db.assessments[-1]["inputs"]


def test_low_patient_view_has_no_probabilities(db):
    body = post(LOW).json()
    assert body["next_step"] == "routine_checkup"
    for r in body["results"].values():
        assert r["band"] == "low"
        assert "probability" not in r and "conformal_set" not in r
        assert all("shap" not in f for f in r["top_factors"])
    assert "age_under_40_less_reliable" in body["notes"]
    assert not body["queued_for_review"]


def test_high_goes_to_review_queue(db):
    body = post(HIGH).json()
    assert body["next_step"] == "see_doctor_soon"
    assert any(r["band"] == "high" for r in body["results"].values())
    assert body["queued_for_review"] and db.queue[-1] == ["high_band"]
    assert all(g["source_url"].startswith("https://") for g in body["guidance"])


def test_abstained_disease_shows_no_band_to_patient(db):
    body = post(ABSTAIN).json()
    assert body["next_step"] == "not_confident"
    abst = [r for r in body["results"].values() if r["abstained"]]
    assert abst and all(r["band"] is None and r["top_factors"] == [] for r in abst)
    assert "abstained" in db.queue[-1]


def test_prefer_not_to_say_uses_higher_band(db):
    full = {s: screening.score(AssessmentRequest(**{**HIGH, "sex": s}), explain=False)
            for s in ("female", "male", "prefer_not_to_say")}
    order = screening.BANDS.index
    for d in full["male"]:
        assert order(full["prefer_not_to_say"][d]["band"]) == max(order(full["female"][d]["band"]),
                                                                  order(full["male"][d]["band"]))
    assert "sex_not_stated_higher_band_used" in post({**HIGH, "sex": "prefer_not_to_say"}).json()["notes"]


# --- consent ---------------------------------------------------------------------------------

def test_no_processing_consent_blocks(db):
    db.purposes = {"store_history"}
    assert post(LOW).status_code == 403


def test_no_store_history_stores_nothing_but_audits(db):
    db.purposes = {"assessment_processing", "share_with_clinician"}
    body = post(HIGH).json()
    assert not body["stored"] and db.assessments == [] and len(db.audit) == 1
    audit_meta = db.audit[0][1]["metadata"]
    assert set(audit_meta) == {"next_step", "model_versions"}  # no health data in the audit row
    assert "no_clinician_review_without_consent" in body["notes"]


def test_no_share_consent_means_no_queue(db):
    db.purposes = {"assessment_processing", "store_history"}
    body = post(HIGH).json()
    assert body["stored"] and not body["queued_for_review"] and db.queue == []


# --- clinician shaping ------------------------------------------------------------------------

def test_clinician_shape_keeps_numbers_patient_shape_drops_them():
    full = screening.assess(AssessmentRequest(**HIGH))
    doc = screening.shape_for_role(full, "doctor")
    pat = screening.shape_for_role(full, "patient")
    for d in full["results"]:
        assert 0 <= doc["results"][d]["probability"] <= 1
        assert "probability" not in pat["results"][d]
    assert "queue_reasons" not in pat


def test_shared_factors_appear_in_two_diseases():
    full = screening.assess(AssessmentRequest(**HIGH))
    for s in full["shared_factors"]:
        assert len(s["diseases"]) >= 2


# --- what-if and recourse ---------------------------------------------------------------------

def test_what_if_rejects_non_changeable(db):
    for field in ("age", "high_bp", "sex", "diff_walk", "height_cm"):
        res = post({"base": HIGH, "changes": {field: 40 if field == "age" else False}}, path="/api/v1/what-if")
        assert res.status_code == 422, field


def test_what_if_smoker_cannot_be_reset(db):
    body = post({"base": HIGH, "changes": {"smoker": False, "phys_activity": True}}, path="/api/v1/what-if").json()
    assert "smoker_ever_cannot_reset" in body["notes"]
    assert body["applied_changes"] == {"phys_activity": True}
    assert all("probability" not in r for r in body["after"].values())


def test_recourse_finds_change_within_limits(db):
    body = post({"base": HIGH}, path="/api/v1/recourse").json()
    for d, r in body["recourse"].items():
        if r["suggestion"]:
            ch = r["suggestion"]["changes"]
            assert len(ch) <= 2
            assert set(ch) <= set(screening.CHANGEABLE_FIELDS) - {"smoker"}
            if "weight_kg" in ch:
                assert ch["weight_kg"] >= HIGH["weight_kg"] * 0.9 - 0.1
            assert screening.BANDS.index(r["suggestion"]["new_band"]) < screening.BANDS.index(r["current_band"])


# --- model registry ---------------------------------------------------------------------------

def test_models_endpoint_reports_artifact_versions():
    res = client.get("/api/v1/models")
    assert res.status_code == 200
    ids = {m["id"]: m for m in res.json()}
    assert set(ids) == {"diabetes", "heart", "stroke"}
    for d, m in ids.items():
        assert m["version"] == f"{d}-v1.0.0"
        assert m["test_auroc"] == screening.models()[d].meta["test_metrics"]["auroc"]


# --- stress tests from the Pune synthetic rows (never used for training or metrics) --------

PUNE = "data/synthetic/Pune_Clinical_Risk_Synthetic_Dataset_20000.csv"


def _pune_rows(n=40):
    return pd.read_csv(PUNE).sample(n, random_state=7).to_dict("records")


def test_pune_rows_alone_are_incomplete_and_rejected(db):
    """The Pune file lacks most of the 14 answers. They must be reported missing, never filled."""
    for r in _pune_rows():
        partial = {"age": int(r["age"]), "sex": "male" if r["sex"] == 1 else "female",
                   "height_cm": 165, "weight_kg": round(r["bmi"] * 1.65 ** 2, 1), "smoker": bool(r["smoking"])}
        res = post(partial)
        assert res.status_code == 422
        missing = {e["loc"][-1] for e in res.json()["detail"]}
        assert {"high_bp", "gen_health", "diff_walk"} <= missing


def test_pune_rows_contradictory_or_out_of_range_never_fixed(db):
    for r in _pune_rows(15):
        base = {**LOW, "age": max(18, int(r["age"])), "weight_kg": round(r["bmi"] * 1.65 ** 2, 1),
                "height_cm": 165, "high_bp": bool(r["hypertension"])}
        assert post({**base, "ment_health_days": 40}).status_code == 422
        assert post({**base, "age": 15}).status_code == 422
        warn = post({**base, "gen_health": 1, "phys_health_days": 25}).json()
        assert {"code": "excellent_health_but_many_unwell_days"} in warn["data_quality"]["warnings"]


@pytest.mark.parametrize("word", ["stroke", "heart attack", "paralysis", "लकवा", "स्ट्रोक", "दिल का दौरा",
                                  "अर्धांगवायू", "पक्षाघात", "हृदयविकाराचा झटका", "lakwa", "dil ka daura",
                                  "ardhangvayu"])
def test_bare_red_flag_word_in_free_text_is_a_full_emergency(db, monkeypatch, word):
    """D-26: in the assessment free-text box a bare red-flag word counts as a full emergency."""
    def boom(*a, **k):
        raise AssertionError("models must not run for an emergency")

    monkeypatch.setattr(screening, "score", boom)
    body = post({**LOW, "free_text": f"worried about {word}"}).json()
    assert body["next_step"] == "emergency" and body["emergency"] and body["results"] == {}
