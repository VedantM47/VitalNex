"""
Live tests against the real Supabase project, using the seeded demo accounts' JWTs.

Skipped unless .env has SUPABASE_URL, SUPABASE_SECRET_KEY, SUPABASE_PUBLISHABLE_KEY and
DEMO_PASSWORD, and `python supabase/seed/seed_demo.py` has run. The SQL-level RLS proof
(including assessments, which do not exist until P4) is supabase/tests/rls.sql.
"""

import pytest
from fastapi.testclient import TestClient

from apps.api.core.config import settings

pytestmark = pytest.mark.skipif(
    not (settings.supabase_configured and settings.SUPABASE_PUBLISHABLE_KEY and settings.DEMO_PASSWORD),
    reason="Supabase project / DEMO_PASSWORD not configured in .env",
)

PATIENT_SHARING = "patient1@vitalnex.demo"
PATIENT_NOT_SHARING = "patient5@vitalnex.demo"
DOCTOR = "dr.joshi@vitalnex.demo"
ADMIN = "admin@vitalnex.demo"


@pytest.fixture(scope="module")
def sessions():
    from supabase import create_client

    out = {}
    for email in (PATIENT_SHARING, PATIENT_NOT_SHARING, DOCTOR, ADMIN):
        c = create_client(settings.SUPABASE_URL, settings.SUPABASE_PUBLISHABLE_KEY)
        res = c.auth.sign_in_with_password({"email": email, "password": settings.DEMO_PASSWORD})
        out[email] = {"client": c, "token": res.session.access_token, "id": res.user.id}
    return out


@pytest.fixture(scope="module")
def api():
    from apps.api.main import app

    return TestClient(app)


def auth(sessions, email):
    return {"Authorization": f"Bearer {sessions[email]['token']}"}


def test_role_comes_from_profiles(sessions, api):
    expected = {PATIENT_SHARING: "patient", DOCTOR: "doctor", ADMIN: "admin"}
    for email, role in expected.items():
        res = api.get("/api/v1/me", headers=auth(sessions, email))
        assert res.status_code == 200, res.text
        assert res.json()["role"] == role
        assert res.json()["is_demo"] is True


def test_patient_cannot_read_another_patient(sessions):
    a = sessions[PATIENT_SHARING]["client"]
    b_id = sessions[PATIENT_NOT_SHARING]["id"]
    for table, col in (("profiles", "id"), ("consents", "user_id"), ("health_profiles", "user_id"),
                       ("risk_assessments", "user_id"), ("audit_logs", "user_id")):
        rows = a.table(table).select("*").eq(col, b_id).execute().data
        assert rows == [], f"patient A read patient B's {table}"


def test_patient_cannot_promote_self(sessions):
    a = sessions[PATIENT_SHARING]
    with pytest.raises(Exception):
        a["client"].table("profiles").update({"role": "admin"}).eq("id", a["id"]).execute()


def test_patient_cannot_write_assessments(sessions):
    a = sessions[PATIENT_SHARING]
    with pytest.raises(Exception):
        a["client"].table("risk_assessments").insert(
            {"user_id": a["id"], "inputs": {}, "results": {}, "next_step": "routine_checkup", "model_versions": {}}
        ).execute()


def test_clinician_sees_only_consented_patients(sessions):
    doc = sessions[DOCTOR]["client"]
    assert doc.table("profiles").select("id").eq("id", sessions[PATIENT_SHARING]["id"]).execute().data
    assert doc.table("profiles").select("id").eq("id", sessions[PATIENT_NOT_SHARING]["id"]).execute().data == []


def test_admin_reads_audit_but_not_patients(sessions):
    adm = sessions[ADMIN]["client"]
    assert adm.table("audit_logs").select("id").limit(1).execute().data
    assert adm.table("profiles").select("id").eq("role", "patient").execute().data == []


def test_role_guards_against_real_tokens(sessions, api):
    assert api.get("/api/v1/doctor/reviews", headers=auth(sessions, PATIENT_SHARING)).status_code == 403
    assert api.get("/api/v1/doctor/reviews", headers=auth(sessions, DOCTOR)).status_code == 200
    assert api.get("/api/v1/governance/summary", headers=auth(sessions, DOCTOR)).status_code == 403
    assert api.get("/api/v1/governance/summary", headers=auth(sessions, ADMIN)).status_code == 200


def test_consents_seeded_per_spec(sessions, api):
    def granted(email):
        res = api.get("/api/v1/consents", headers=auth(sessions, email))
        assert res.status_code == 200
        return {c["purpose"]: c["granted"] for c in res.json()}

    assert granted(PATIENT_SHARING)["share_with_clinician"] is True
    assert granted(PATIENT_NOT_SHARING)["share_with_clinician"] is False


def test_login_event_is_audited(sessions, api):
    res = api.post("/api/v1/me/login-event", headers=auth(sessions, PATIENT_SHARING))
    assert res.status_code == 204
    rows = (
        sessions[PATIENT_SHARING]["client"].table("audit_logs").select("action")
        .eq("action", "LOGIN").eq("user_id", sessions[PATIENT_SHARING]["id"]).execute().data
    )
    assert rows


def test_demo_doctors_and_booking(sessions, api):
    doctors = api.get("/api/v1/doctors").json()
    assert {d["specialization_code"] for d in doctors} >= {"cardiology", "endocrinology", "neurology"}
    assert all(d["is_demo"] and d["rating"] is None for d in doctors)
    doc = next(d for d in doctors if d["next_slots"])

    headers = auth(sessions, PATIENT_SHARING)
    slot_id = doc["next_slots"][0]["id"]
    booked = api.post("/api/v1/appointments", headers=headers, json={"slot_id": slot_id})
    assert booked.status_code == 200, booked.text
    apt_id = booked.json()["id"]
    try:
        # The same slot cannot be booked twice.
        again = api.post("/api/v1/appointments", headers=auth(sessions, PATIENT_NOT_SHARING), json={"slot_id": slot_id})
        assert again.status_code == 409
        # Another patient cannot see or cancel it.
        other = api.patch(f"/api/v1/appointments/{apt_id}", headers=auth(sessions, PATIENT_NOT_SHARING),
                          json={"status": "cancelled"})
        assert other.status_code == 404
    finally:
        cancelled = api.patch(f"/api/v1/appointments/{apt_id}", headers=headers, json={"status": "cancelled"})
        assert cancelled.status_code == 200
        assert cancelled.json()["status"] == "cancelled"
