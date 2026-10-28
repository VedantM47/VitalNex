"""
P7 tests: Trust Passport, principle map, consent centre (withdraw / export / delete) and the QR
patient-held record. Database = in-memory fake (tests/fakedb.py); models = real ml/artifacts.
"""

import base64
import hashlib
import json
from datetime import datetime, timedelta, timezone
from urllib.parse import urlparse

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient

from apps.api.core import db as core_db
from apps.api.main import app
from apps.api.schemas.consent import CONSENT_PURPOSES, NOTICE_VERSION
from apps.api.services import screening, trust_service
from apps.api.services.aggregates import NOT_AVAILABLE
from fakedb import FakeStore, bearer, install
from test_clinician_review import ADMIN, DOC, HIGH, LOW, PAT_A, PAT_B, assess, seed_people

client = TestClient(app)

SPEC_7_1 = {  # docs/SPEC.md §7.1: principle -> live evidence labels
    "Safety and Reliability": ["Coverage per class", "Abstention rate", "Emergency triggers count"],
    "Equality": ["Recall & FPR gap tables"],
    "Inclusivity and Non-discrimination": ["Language parity table", "Excluded-features list"],
    "Privacy and Security": ["Consent rates", "Share revocations", "Data-request log"],
    "Transparency": ["Model card version", "Data hash"],
    "Accountability": ["Override rate by disease", "Audit entries"],
    "Protection and Reinforcement of Positive Human Values": ["Medication-refusal count", "Recourse usage"],
}


@pytest.fixture
def store(monkeypatch):
    s = FakeStore()
    cleanup = install(monkeypatch, s)
    seed_people(s)
    yield s
    cleanup()


@pytest.fixture
def db_down(monkeypatch):
    def unreachable():
        raise HTTPException(status_code=503, detail="Database is not configured.")

    monkeypatch.setattr(core_db, "service_db", unreachable)


# --- Trust Passport ------------------------------------------------------------------------

def test_trust_passport_is_public_and_from_model_meta(store):
    assess(PAT_A, HIGH)
    tp = client.get("/api/v1/trust-passport").json()
    for d, m in tp["models"].items():
        meta = screening.models()[d].meta
        assert m["auroc"] == meta["test_metrics"]["auroc"]
        assert m["auroc_ci95"] == meta["test_metrics"]["ci95"]["auroc"]
        assert m["brier"] == meta["test_metrics"]["brier"]
        assert m["recall_at_moderate_threshold"] == meta["test_metrics"]["recall_at_t_mod"]
        assert m["miss_rate_in_low_band"] == meta["bands_test"]["low"]["share_of_true_cases"]
        assert m["abstention"]["abstention_rate_total"] == meta["conformal_test"]["abstention_rate_total"]
        assert m["version"] == meta["version"] and m["trained_at"] == meta["created_at"]
        for url in m["images"].values():
            img = client.get(url)
            assert img.status_code == 200 and img.content[:8] == b"\x89PNG\r\n\x1a\n"
        gap = tp["age_gap"]["by_disease"][d]
        assert gap["youngest_recall"] == meta["fairness"]["groups"]["AgeGroup"]["by_group"]["18-39"]["recall"]
    ids = {d["id"]: d for d in tp["accepted_decisions"]}
    assert set(ids) == {"D-22", "D-23", "D-24"}
    assert all(d["decision"] != NOT_AVAILABLE and d["status"].startswith("Confirmed") for d in ids.values())
    assert tp["data"]["rows"] == 253680 and tp["data"]["licence"] == "CC0: Public Domain"
    assert len(tp["data"]["limitations"]) >= 10
    assert tp["live"]["assessments"]["assessments"] == 1


def test_trust_passport_without_database_says_not_available(db_down):
    tp = client.get("/api/v1/trust-passport").json()
    assert tp["live"]["assessments"] == NOT_AVAILABLE
    assert tp["live"]["emergency_triggers"] == NOT_AVAILABLE
    assert tp["live"]["clinician_review"] == NOT_AVAILABLE
    assert tp["models"]["heart"]["auroc"] == screening.models()["heart"].meta["test_metrics"]["auroc"]


def test_report_contact_is_not_invented(db_down, monkeypatch):
    from apps.api.core.config import settings

    monkeypatch.setattr(settings, "PROBLEM_REPORT_CONTACT", "")
    assert client.get("/api/v1/trust-passport").json()["report_a_problem"]["contact"] == NOT_AVAILABLE


@pytest.mark.parametrize("path", [
    "/api/v1/trust-passport/images/heart/model.joblib",
    "/api/v1/trust-passport/images/heart/model_meta.json",
    "/api/v1/trust-passport/images/flu/reliability.png",
    "/api/v1/trust-passport/images/heart/..%2Fdiabetes%2Fmodel.joblib",
    "/api/v1/trust-passport/images/heart/training_curves.png",
])
def test_only_passport_images_are_served(path):
    assert client.get(path).status_code in (404, 422)


# --- principle map -------------------------------------------------------------------------

def test_principle_map_matches_spec_and_resolves_live(store, monkeypatch):
    monkeypatch.setattr(trust_service, "NLP_META_CANDIDATES", ())
    raw = trust_service.load_principle_map()
    assert {p["principle"]: [e["label"] for e in p["evidence"]] for p in raw["principles"]} == SPEC_7_1
    assert all(f["page"].startswith("/") for p in raw["principles"] for f in p["implemented_by"])

    assess(PAT_A, HIGH)
    pm = client.get("/api/v1/trust-passport/principles").json()
    ev = {e["id"]: e for p in pm["principles"] for e in p["evidence"]}
    assert ev["model_card_version"]["value"] == {d: m.meta["version"] for d, m in screening.models().items()}
    assert ev["coverage_per_class"]["value"]["stroke"] == screening.models()["stroke"].meta["conformal_test"]["coverage"]
    assert ev["consent_rates"]["value"]["share_with_clinician"] == 0.5  # A shares, B does not
    assert ev["audit_entries"]["available"]
    # Nothing records these yet: shown as "not available", never a number.
    assert ev["language_parity_table"]["value"] == NOT_AVAILABLE
    assert ev["recourse_usage"]["value"] == NOT_AVAILABLE


def test_principle_map_db_evidence_unavailable_when_db_down(db_down):
    pm = client.get("/api/v1/trust-passport/principles").json()
    ev = {e["id"]: e for p in pm["principles"] for e in p["evidence"]}
    for k in ("emergency_triggers_count", "consent_rates", "share_revocations", "data_request_log",
              "override_rate_by_disease", "audit_entries", "medication_refusal_count"):
        assert ev[k]["value"] == NOT_AVAILABLE and not ev[k]["available"], k
    assert ev["abstention_rate"]["value"]["live"] == NOT_AVAILABLE
    assert ev["data_hash"]["available"]


# --- consent centre ------------------------------------------------------------------------

def test_consents_carry_notice_text_and_version(store):
    rows = client.get("/api/v1/consents", headers=bearer(PAT_A)).json()
    assert [r["purpose"] for r in rows] == list(CONSENT_PURPOSES)
    assert all(r["notice"] and r["title"] and r["effect_if_off"] and r["notice_version"] == NOTICE_VERSION for r in rows)
    assert [r["required"] for r in rows] == [True, False, False, False]
    assert client.get("/api/v1/consents/notice").json()["notice_version"] == NOTICE_VERSION


def test_withdraw_consent_removes_clinician_access(store):
    asm = assess(PAT_A, HIGH)
    assert client.get(f"/api/v1/doctor/cases/{asm['id']}", headers=bearer(DOC)).status_code == 200
    rows = client.put("/api/v1/consents/share_with_clinician", headers=bearer(PAT_A), json={"granted": False}).json()
    assert not next(r for r in rows if r["purpose"] == "share_with_clinician")["granted"]
    assert client.get("/api/v1/doctor/reviews", headers=bearer(DOC)).json() == []
    assert client.get(f"/api/v1/doctor/cases/{asm['id']}", headers=bearer(DOC)).status_code == 404
    assert client.patch(f"/api/v1/doctor/reviews/{asm['id']}", headers=bearer(DOC),
                        json={"decision": "agree"}).status_code == 404


def test_withdraw_store_history_hides_history(store):
    assess(PAT_A, LOW)
    assert client.get("/api/v1/assessment/history", headers=bearer(PAT_A)).json()["total_assessments"] == 1
    client.put("/api/v1/consents/store_history", headers=bearer(PAT_A), json={"granted": False})
    hist = client.get("/api/v1/assessment/history", headers=bearer(PAT_A)).json()
    assert hist["assessments"] == [] and hist["hidden"] == "store_history_withdrawn"


def test_export_my_data(store):
    assess(PAT_A, HIGH)
    client.post("/api/v1/shares", headers=bearer(PAT_A), json={"sections": ["latest_results"], "expires_in": "1h"})
    res = client.get("/api/v1/me/data-export", headers=bearer(PAT_A))
    assert res.status_code == 200 and "attachment" in res.headers["content-disposition"]
    doc = res.json()
    assert doc["profile"]["id"] == PAT_A and len(doc["assessments"]) == 1 and len(doc["consents"]) == 4
    assert "probability" not in json.dumps(doc["assessments"])  # patient-shaped (D-10)
    assert "token_hash" not in json.dumps(doc)
    assert PAT_B not in json.dumps(doc)
    assert any(r["type"] == "export" and r["status"] == "completed" for r in store.rows("data_requests"))


def test_deletion_removes_rows_and_keeps_minimal_audit(store):
    a = assess(PAT_A, HIGH)
    assess(PAT_B, LOW)
    client.post("/api/v1/shares", headers=bearer(PAT_A), json={"sections": ["history"], "expires_in": "24h"})
    client.patch(f"/api/v1/doctor/reviews/{a['id']}", headers=bearer(DOC), json={"decision": "agree", "note": "ok"})
    store.add("audit_logs", user_id=PAT_A, action="LOGIN", resource_type="session", metadata={})
    store.add("audit_logs", user_id=None, action="CONSENT_GRANTED", resource_type="consent",
              metadata={"subject_user_id": PAT_A})

    assert client.post("/api/v1/me/data-deletion", headers=bearer(PAT_A), json={}).status_code == 422
    res = client.post("/api/v1/me/data-deletion", headers=bearer(PAT_A), json={"confirm": "DELETE"})
    assert res.status_code == 200 and res.json()["status"] == "completed"

    dump = json.dumps(store.tables)
    assert PAT_A not in dump and a["id"] not in dump  # no row anywhere still points at the person
    assert store.deleted_auth_users == [PAT_A]
    [req] = [r for r in store.rows("data_requests") if r["type"] == "delete"]
    assert req["user_id"] is None and req["status"] == "completed"
    [kept] = [e for e in store.rows("audit_logs") if e["action"] == "USER_DATA_DELETED"]
    assert kept["user_id"] is None and set(kept["metadata"]) == {"tables_cleared", "auth_account_deleted"}
    # Patient B is untouched.
    assert any(r["user_id"] == PAT_B for r in store.rows("risk_assessments"))
    # The deleted account can no longer use the API.
    assert client.get("/api/v1/consents", headers=bearer(PAT_A)).status_code == 403


# --- QR patient-held record ----------------------------------------------------------------

def _create(sections=("latest_results", "factors", "history", "clinician_notes"), expires_in="24h", uid=PAT_A):
    res = client.post("/api/v1/shares", headers=bearer(uid), json={"sections": list(sections), "expires_in": expires_in})
    assert res.status_code == 201, res.text
    body = res.json()
    return body, urlparse(body["url"]).path.rsplit("/", 1)[-1]


def test_share_stores_only_the_hash(store):
    assess(PAT_A, HIGH)
    body, token = _create(expires_in="7d")
    assert body["url"].endswith(f"/share/{token}")
    png = base64.b64decode(body["qr_png_data_uri"].split(",", 1)[1])
    assert png[:8] == b"\x89PNG\r\n\x1a\n"
    [row] = store.rows("share_tokens")
    assert row["token_hash"] == hashlib.sha256(token.encode()).hexdigest()
    assert token not in json.dumps(store.tables)  # the raw token is never stored
    assert len(token) >= 40  # 256 random bits: the hash cannot be reversed by guessing
    expires = datetime.fromisoformat(row["expires_at"])
    assert timedelta(days=6, hours=23) < expires - datetime.now(timezone.utc) <= timedelta(days=7)
    listed = client.get("/api/v1/shares", headers=bearer(PAT_A)).json()
    assert "token_hash" not in json.dumps(listed) and listed[0]["status"] == "active"


@pytest.mark.parametrize("body", [
    {"sections": [], "expires_in": "1h"},
    {"sections": ["latest_results"], "expires_in": "30d"},
    {"sections": ["raw_inputs"], "expires_in": "1h"},
])
def test_share_request_validated(store, body):
    assert client.post("/api/v1/shares", headers=bearer(PAT_A), json=body).status_code == 422


def test_public_share_view_is_read_only_summary_and_logged(store):
    asm = assess(PAT_A, HIGH)
    client.patch(f"/api/v1/doctor/reviews/{asm['id']}", headers=bearer(DOC),
                 json={"decision": "agree", "note": "See your doctor soon."})
    _, token = _create(sections=("latest_results", "clinician_notes"))
    res = client.get(f"/api/v1/share/{token}")
    assert res.status_code == 200 and res.headers["cache-control"] == "no-store"
    view = res.json()
    assert view["shared_by"] == "patient" and "Expires at" in view["notice"] and view["read_only"]
    assert view["disclaimer"] == screening.DISCLAIMER
    assert set(view["sections"]) == {"latest_results", "clinician_notes"}
    assert "history" not in view and "factors" not in view
    assert view["clinician_notes"][0]["clinician_note"] == "See your doctor soon."
    text = json.dumps(view)
    assert "probability" not in text and PAT_A not in text and "Asha" not in text

    client.get(f"/api/v1/share/{token}", headers=bearer(DOC))
    opens = client.get("/api/v1/shares", headers=bearer(PAT_A)).json()[0]
    assert opens["open_count"] == 2
    assert sorted(o["accessor_role"] for o in opens["opens"]) == ["doctor", "public"]


def test_revoked_and_expired_shares_fail(store):
    assess(PAT_A, LOW)
    created, token = _create(expires_in="1h")
    assert client.post(f"/api/v1/shares/{created['id']}/revoke", headers=bearer(PAT_B)).status_code == 404
    assert client.post(f"/api/v1/shares/{created['id']}/revoke", headers=bearer(PAT_A)).status_code == 204
    res = client.get(f"/api/v1/share/{token}")
    assert res.status_code == 410 and res.json()["detail"]["code"] == "revoked"

    created2, token2 = _create(expires_in="1h")
    row = next(r for r in store.rows("share_tokens") if r["id"] == created2["id"])
    row["expires_at"] = (datetime.now(timezone.utc) - timedelta(seconds=1)).isoformat()
    res = client.get(f"/api/v1/share/{token2}")
    assert res.status_code == 410 and res.json()["detail"]["code"] == "expired"
    assert store.rows("share_access_log") == []  # failed opens are not logged as views

    assert client.get("/api/v1/share/" + "x" * 43).status_code == 404
    assert client.get("/api/v1/share/short").status_code == 404
    statuses = {s["id"]: s["status"] for s in client.get("/api/v1/shares", headers=bearer(PAT_A)).json()}
    assert statuses == {created["id"]: "revoked", created2["id"]: "expired"}


def test_share_endpoints_are_patient_only(store):
    for uid in (DOC, ADMIN):
        assert client.post("/api/v1/shares", headers=bearer(uid),
                           json={"sections": ["history"], "expires_in": "1h"}).status_code == 403
        assert client.get("/api/v1/shares", headers=bearer(uid)).status_code == 403


# --- Health profile (14-answer contract, no defaults) ----------------------------------------

def test_health_profile_round_trip_keeps_only_answered(store):
    got = client.get("/api/v1/health-profile", headers=bearer(PAT_A))
    assert got.status_code == 200 and got.json()["saved"] is False and got.json()["answers"] == {}
    res = client.put("/api/v1/health-profile", headers=bearer(PAT_A),
                     json={"answers": {"age": 45, "sex": "female", "smoker": False, "gen_health": None}})
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["saved"] is True
    # Only answered questions are stored; nothing is filled in.
    assert body["answers"] == {"age": 45, "sex": "female", "smoker": False}
    row = store.rows("health_profiles")[0]
    assert row["answers"] == {"age": 45, "sex": "female", "smoker": False}


@pytest.mark.parametrize("answers", [{"trestbps": 120}, {"age": 15}, {"sex": 1}])
def test_health_profile_rejects_old_or_invalid_fields(store, answers):
    res = client.put("/api/v1/health-profile", headers=bearer(PAT_A), json={"answers": answers})
    assert res.status_code == 422
    assert store.rows("health_profiles") == []


def test_health_profile_drops_old_stored_fields(store):
    store.add("health_profiles", user_id=PAT_A, answers={"age": 50, "ca": 0, "thal": 3, "sex": 1})
    body = client.get("/api/v1/health-profile", headers=bearer(PAT_A)).json()
    assert body["answers"] == {"age": 50}


def test_health_profile_is_patient_only(store):
    assert client.get("/api/v1/health-profile", headers=bearer(DOC)).status_code == 403
