"""
P6 tests: clinician review queue, case view, Agree / Override, patient-facing note, and admin
governance aggregates. The database is the in-memory fake in tests/fakedb.py (RLS emulated per
the P1 policies); the real models in ml/artifacts score the assessments.
"""

import json
import pathlib

import pytest
from fastapi.testclient import TestClient

from apps.api.main import app
from apps.api.services import screening
from fakedb import FakeStore, bearer, install

client = TestClient(app)

PAT_A = "00000000-0000-4000-a000-00000000000a"   # shares with clinicians
PAT_B = "00000000-0000-4000-a000-00000000000b"   # does not share
DOC = "00000000-0000-4000-a000-00000000000d"
ADMIN = "00000000-0000-4000-a000-0000000000ad"
ALL = ("assessment_processing", "store_history", "share_with_clinician", "aggregate_audit")

LOW = {"age": 30, "sex": "female", "height_cm": 162, "weight_kg": 55, "high_bp": False, "high_chol": False,
       "smoker": False, "phys_activity": True, "fruits": True, "veggies": True, "heavy_alcohol": False,
       "gen_health": 1, "ment_health_days": 0, "phys_health_days": 0, "diff_walk": False}
HIGH = {**LOW, "age": 68, "sex": "male", "weight_kg": 88, "high_bp": True, "high_chol": True, "smoker": True,
        "phys_activity": False, "gen_health": 4, "phys_health_days": 15, "diff_walk": True}
ABSTAIN = {**LOW, "age": 52, "sex": "male", "weight_kg": 80, "high_bp": True, "smoker": True,
           "phys_activity": False, "gen_health": 3}


def seed_people(store: FakeStore, b_purposes=("assessment_processing", "store_history", "aggregate_audit")):
    store.add("profiles", id=PAT_A, role="patient", full_name="Asha Patil", preferred_language="mr")
    store.add("profiles", id=PAT_B, role="patient", full_name="Bina Rao", preferred_language="en")
    store.add("profiles", id=DOC, role="doctor", full_name="Dr Joshi", preferred_language="en")
    store.add("profiles", id=ADMIN, role="admin", full_name="Admin", preferred_language="en")
    for p in ALL:
        store.add("consents", user_id=PAT_A, purpose=p, granted=True, granted_at="2026-10-01T00:00:00+00:00")
    for p in b_purposes:
        store.add("consents", user_id=PAT_B, purpose=p, granted=True, granted_at="2026-10-01T00:00:00+00:00")


def assess(uid, payload):
    res = client.post("/api/v1/assessment", headers=bearer(uid), json=payload)
    assert res.status_code == 200, res.text
    return res.json()


@pytest.fixture
def store(monkeypatch):
    s = FakeStore()
    cleanup = install(monkeypatch, s)
    seed_people(s)
    yield s
    cleanup()


@pytest.fixture
def cases(store):
    """A: one High case (queued); B: one High case (stored, but B does not share -> not queued)."""
    a = assess(PAT_A, HIGH)
    assert a["queued_for_review"]
    # B shares nothing with clinicians: insert a queue row anyway, as if consent was withdrawn later.
    b = assess(PAT_B, HIGH)
    store.add("review_queue", assessment_id=b["id"], patient_id=PAT_B, reasons=["high_band"])
    return {"a": a["id"], "b": b["id"]}


# --- consent-limited clinician access ------------------------------------------------------

def test_clinician_sees_only_consented_patients(store, cases):
    queue = client.get("/api/v1/doctor/reviews", headers=bearer(DOC)).json()
    assert [q["assessment_id"] for q in queue] == [cases["a"]]
    patients = client.get("/api/v1/doctor/patients", headers=bearer(DOC)).json()
    assert [p["id"] for p in patients] == [PAT_A]
    assert patients[0]["pending_reviews"] == 1
    assert client.get(f"/api/v1/doctor/cases/{cases['b']}", headers=bearer(DOC)).status_code == 404
    assert client.get(f"/api/v1/assessment/{cases['b']}", headers=bearer(DOC)).status_code == 404
    res = client.patch(f"/api/v1/doctor/reviews/{cases['b']}", headers=bearer(DOC), json={"decision": "agree"})
    assert res.status_code == 404
    assert not any(q["status"] != "pending" for q in store.rows("review_queue"))


@pytest.mark.parametrize("uid", [PAT_A, ADMIN])
def test_only_clinicians_use_review_endpoints(store, cases, uid):
    for method, path in (("GET", "/api/v1/doctor/patients"), ("GET", f"/api/v1/doctor/cases/{cases['a']}"),
                         ("PATCH", f"/api/v1/doctor/reviews/{cases['a']}")):
        assert client.request(method, path, headers=bearer(uid), json={"decision": "agree"}).status_code == 403


# --- case view -----------------------------------------------------------------------------

def test_case_view_has_full_clinician_detail(store, cases):
    case = client.get(f"/api/v1/doctor/cases/{cases['a']}", headers=bearer(DOC)).json()
    assert case["patient"]["full_name"] == "Asha Patil"
    assert case["inputs"]["age"] == HIGH["age"] and "free_text" not in case["inputs"]
    assert case["data_quality"]["available"] and case["data_quality"]["passed"]
    assert case["display_order"].index("top_factors") < case["display_order"].index("model_band")
    assert case["display_order"].index("conformal_set") < case["display_order"].index("model_band")
    for d, v in case["diseases"].items():
        assert list(v)[: len(case["display_order"])] == case["display_order"]
        assert 0 <= v["probability"] <= 1 and isinstance(v["conformal_set"], list)
        assert all("shap" in f for f in v["top_factors"])
        meta = screening.models()[d].meta
        assert v["model_version"] == meta["version"]
        assert v["thresholds"] == {"t_mod": meta["thresholds"]["t_mod"], "t_high": meta["thresholds"]["t_high"]}
    assert [h["id"] for h in case["history"]] == [cases["a"]]


def test_case_view_shows_abstain_reason(store):
    asm = assess(PAT_A, ABSTAIN)
    case = client.get(f"/api/v1/doctor/cases/{asm['id']}", headers=bearer(DOC)).json()
    abst = [v for v in case["diseases"].values() if v["abstained"]]
    assert abst and all(v["abstain_reason"] in ("conformal_uncertain", "out_of_distribution") for v in abst)


# --- Agree / Override ----------------------------------------------------------------------

def _high_disease(store, asm_id):
    asm = next(a for a in store.rows("risk_assessments") if a["id"] == asm_id)
    return next(d for d, r in asm["results"].items() if r["band"] == "high" and not r["abstained"])


@pytest.mark.parametrize("body", [
    {"decision": "override", "overrides": [{"disease": "heart", "clinician_band": "Low"}]},           # no reason
    {"decision": "override", "overrides": [{"disease": "heart", "clinician_band": "Low", "reason_code": "because"}]},
    {"decision": "override", "overrides": [{"disease": "heart", "clinician_band": "Low", "reason_code": "other"}]},
    {"decision": "override", "overrides": []},
    {"decision": "agree", "overrides": [{"disease": "heart", "clinician_band": "Low",
                                         "reason_code": "model_overestimates"}]},
])
def test_override_requires_reason(store, cases, body):
    res = client.patch(f"/api/v1/doctor/reviews/{cases['a']}", headers=bearer(DOC), json=body)
    assert res.status_code == 422
    assert store.rows("clinician_overrides") == []
    assert all(q["status"] == "pending" for q in store.rows("review_queue"))


def test_override_to_same_band_is_rejected(store, cases):
    d = _high_disease(store, cases["a"])
    body = {"decision": "override",
            "overrides": [{"disease": d, "clinician_band": "High", "reason_code": "symptoms_present"}]}
    assert client.patch(f"/api/v1/doctor/reviews/{cases['a']}", headers=bearer(DOC), json=body).status_code == 422


def test_override_is_logged_and_patient_sees_note(store, cases):
    d = _high_disease(store, cases["a"])
    body = {"decision": "override", "note": "Please book a lipid test with your GP.",
            "overrides": [{"disease": d, "clinician_band": "Moderate", "reason_code": "model_overestimates",
                           "note": "Recent normal ECG reported"}]}
    res = client.patch(f"/api/v1/doctor/reviews/{cases['a']}", headers=bearer(DOC), json=body)
    assert res.status_code == 200, res.text

    [ovr] = store.rows("clinician_overrides")
    assert ovr["disease"] == d and ovr["model_band"] == "High" and ovr["clinician_band"] == "Moderate"
    assert ovr["reason_code"] == "model_overestimates" and ovr["clinician_id"] == DOC
    assert ovr["model_version"] == screening.models()[d].meta["version"]
    item = next(q for q in store.rows("review_queue") if q["assessment_id"] == cases["a"])
    assert item["status"] == "overridden" and item["reviewed_by"] == DOC and item["reviewed_at"]
    asm = next(a for a in store.rows("risk_assessments") if a["id"] == cases["a"])
    assert asm["review_status"] == "overridden"
    audit = [a for a in store.rows("audit_logs") if a["action"] == "REVIEW_DECISION"]
    assert audit and audit[0]["user_id"] == DOC and audit[0]["metadata"]["reason_codes"] == ["model_overestimates"]

    # A case is decided once.
    again = client.patch(f"/api/v1/doctor/reviews/{cases['a']}", headers=bearer(DOC), json={"decision": "agree"})
    assert again.status_code == 409

    # Patient: "reviewed by a clinician" + note + new band; no reason code, no clinician id.
    for body in (client.get(f"/api/v1/assessment/{cases['a']}", headers=bearer(PAT_A)).json(),
                 client.get("/api/v1/assessment/history", headers=bearer(PAT_A)).json()["assessments"][0]):
        review = body["clinician_review"]
        assert review["reviewed_by_clinician"] and review["status"] == "overridden"
        assert review["clinician_note"] == "Please book a lipid test with your GP."
        assert review["clinician_bands"] == {d: "Moderate"}
        assert "reason_code" not in json.dumps(review) and DOC not in json.dumps(review)


def test_agree_sets_status(store, cases):
    res = client.patch(f"/api/v1/doctor/reviews/{cases['a']}", headers=bearer(DOC),
                       json={"decision": "agree", "note": "Agree. Please see your doctor within two weeks."})
    assert res.status_code == 200
    assert store.rows("clinician_overrides") == []
    review = client.get(f"/api/v1/assessment/{cases['a']}", headers=bearer(PAT_A)).json()["clinician_review"]
    assert review["status"] == "agreed" and review["reviewed_by_clinician"]


def test_emergency_case_cannot_be_overridden_per_disease(store):
    asm = assess(PAT_A, {**HIGH, "symptoms": {"chest_pain": True}})
    body = {"decision": "override",
            "overrides": [{"disease": "heart", "clinician_band": "High", "reason_code": "symptoms_present"}]}
    res = client.patch(f"/api/v1/doctor/reviews/{asm['id']}", headers=bearer(DOC), json=body)
    assert res.status_code == 422


def test_no_ml_code_reads_clinician_overrides():
    """Hard rule 9: overrides are never used for training. Nothing under ml/ may touch the table."""
    hits = [str(p) for p in pathlib.Path("ml").rglob("*")
            if p.is_file() and p.suffix in {".py", ".json", ".md", ".sql", ".yaml", ".yml", ".txt", ".cfg", ".toml"}
            and "clinician_overrides" in p.read_text(encoding="utf-8", errors="ignore")]
    assert hits == []


# --- admin governance: aggregates only ----------------------------------------------------

ADMIN_PATHS = ["/api/v1/admin/governance/models", "/api/v1/admin/governance/fairness",
               "/api/v1/admin/governance/overrides", "/api/v1/admin/governance/activity?days=30",
               "/api/v1/admin/governance/consents", "/api/v1/admin/governance/audit-logs"]


@pytest.mark.parametrize("uid", [PAT_A, DOC])
def test_admin_endpoints_are_admin_only(store, uid):
    for path in ADMIN_PATHS:
        assert client.get(path, headers=bearer(uid)).status_code == 403, path


def test_admin_endpoints_return_aggregates_only(store, cases):
    d = _high_disease(store, cases["a"])
    client.patch(f"/api/v1/doctor/reviews/{cases['a']}", headers=bearer(DOC), json={
        "decision": "override", "overrides": [{"disease": d, "clinician_band": "Moderate",
                                               "reason_code": "clinical_history_not_captured"}]})
    secrets_ = {PAT_A, PAT_B, cases["a"], cases["b"], "Asha", "Bina"}
    for path in ADMIN_PATHS:
        res = client.get(path, headers=bearer(ADMIN))
        assert res.status_code == 200, path
        text = res.text
        leaked = [s for s in secrets_ if s in text]
        assert not leaked, f"{path} leaks {leaked}"

    ovr = client.get("/api/v1/admin/governance/overrides", headers=bearer(ADMIN)).json()
    assert ovr["overridden"] == 1 and ovr["agree_rate"] == 0.0
    assert ovr["per_disease"][d]["overrides"] == 1 and ovr["per_disease"][d]["override_rate"] == 1.0
    assert ovr["per_reason"] == {"clinical_history_not_captured": 1}

    activity = client.get("/api/v1/admin/governance/activity?days=7", headers=bearer(ADMIN)).json()
    assert sum(day["assessments"] for day in activity["series"]) == 2

    logs = client.get("/api/v1/admin/governance/audit-logs?actor_role=patient", headers=bearer(ADMIN)).json()
    assert all(e["actor_id"] is None and e["actor_role"] == "patient" for e in logs["entries"])
    staff = client.get("/api/v1/admin/governance/audit-logs?action=REVIEW_DECISION", headers=bearer(ADMIN)).json()
    assert staff["entries"][0]["actor_role"] == "doctor" and staff["entries"][0]["actor_id"] == DOC


def test_governance_excludes_users_without_aggregate_audit(store):
    store.tables["consents"] = [c for c in store.rows("consents")
                                if not (c["user_id"] == PAT_B and c["purpose"] == "aggregate_audit")]
    assess(PAT_A, LOW)
    assess(PAT_B, LOW)
    activity = client.get("/api/v1/admin/governance/activity", headers=bearer(ADMIN)).json()
    assert sum(day["assessments"] for day in activity["series"]) == 1


def test_model_registry_and_fairness_come_from_model_meta(store):
    reg = client.get("/api/v1/admin/governance/models", headers=bearer(ADMIN)).json()
    for m in reg:
        meta = screening.models()[m["disease"]].meta
        assert m["version"] == meta["version"] and m["data_hash"] == meta["data_hash"]
        assert m["test_auroc"] == meta["test_metrics"]["auroc"]
        assert client.get(m["model_card_url"]).status_code == 200
    fair = client.get("/api/v1/admin/governance/fairness", headers=bearer(ADMIN)).json()
    for d, f in fair.items():
        meta = screening.models()[d].meta["fairness"]
        assert f["flags"] == meta["flags"]
        assert f["groups"]["AgeGroup"]["by_group"] == meta["groups"]["AgeGroup"]["by_group"]
        assert f["age_gap"]["youngest_group"] == "18-39"
