"""
Auth and role-guard tests (no network: HS256 test tokens, role lookup stubbed).
"""

import time

import jwt
import pytest
from fastapi.testclient import TestClient

from apps.api.core import auth
from apps.api.core.config import settings
from apps.api.main import app

client = TestClient(app)

SECRET = "test-only-jwt-secret-at-least-32-bytes-long"
PATIENT = "00000000-0000-4000-a000-000000000001"
DOCTOR = "00000000-0000-4000-a000-000000000002"
ADMIN = "00000000-0000-4000-a000-000000000003"
NO_PROFILE = "00000000-0000-4000-a000-000000000004"
ROLES = {PATIENT: "patient", DOCTOR: "doctor", ADMIN: "admin"}

ASSESSMENT_PAYLOAD = {
    "clinical_inputs": {
        "age": 55, "sex": 1, "bmi": 26.2, "smoking": 1, "family_history": 1,
        "diabetes": 0, "hypertension": 1, "cp": 4, "trestbps": 140.0, "chol": 220.0,
        "fbs": 0, "restecg": 0, "thalach": 145.0, "exang": 0, "oldpeak": 0.5,
        "slope": 1, "ca": 0, "thal": 3,
    },
}


@pytest.fixture(autouse=True)
def hs256_and_stub_roles(monkeypatch):
    monkeypatch.setattr(settings, "SUPABASE_JWT_SECRET", SECRET)
    # Looks configured, but no test here reaches the network: requests either stop at a
    # guard / validation or hit an endpoint that does not touch the database.
    monkeypatch.setattr(settings, "SUPABASE_URL", "https://vitalnex-test.invalid")
    monkeypatch.setattr(settings, "SUPABASE_SECRET_KEY", "test-service-key")
    monkeypatch.setattr(settings, "SUPABASE_PUBLISHABLE_KEY", "test-publishable-key")

    async def fake_lookup_role(user_id):
        return ROLES.get(user_id)

    monkeypatch.setattr(auth, "lookup_role", fake_lookup_role)


def token(sub=PATIENT, *, secret=SECRET, aud="authenticated", exp_in=3600, alg="HS256"):
    claims = {"sub": sub, "aud": aud, "exp": int(time.time()) + exp_in, "role": "authenticated"}
    return jwt.encode(claims, secret, algorithm=alg)


def bearer(sub=PATIENT, **kw):
    return {"Authorization": f"Bearer {token(sub, **kw)}"}


# Every endpoint that touches personal data or acts as a user.
PROTECTED = [
    ("GET", "/api/v1/me"),
    ("POST", "/api/v1/me/login-event"),
    ("GET", "/api/v1/profile"),
    ("PUT", "/api/v1/profile"),
    ("GET", "/api/v1/health-profile"),
    ("PUT", "/api/v1/health-profile"),
    ("GET", "/api/v1/consents"),
    ("PUT", "/api/v1/consents/store_history"),
    ("POST", "/api/v1/assessment"),
    ("GET", "/api/v1/assessment/history"),
    ("GET", "/api/v1/assessment/some-id"),
    ("POST", "/api/v1/what-if"),
    ("GET", "/api/v1/appointments"),
    ("POST", "/api/v1/appointments"),
    ("PATCH", "/api/v1/appointments/some-id"),
    ("GET", "/api/v1/doctor/reviews"),
    ("GET", "/api/v1/reports"),
    ("GET", "/api/v1/governance/summary"),
    ("POST", "/api/v1/assistant/message"),
]


@pytest.mark.parametrize("method,path", PROTECTED)
def test_protected_endpoints_require_auth(method, path):
    res = client.request(method, path, json={})
    assert res.status_code == 401, f"{method} {path} -> {res.status_code}"


@pytest.mark.parametrize(
    "headers",
    [
        {"Authorization": "Bearer not-a-jwt"},
        {"Authorization": "Basic dXNlcjpwYXNz"},
        bearer(secret="a-different-secret-that-is-also-32-bytes"),
        bearer(exp_in=-60),
        bearer(aud="anon"),
    ],
    ids=["garbage", "basic-scheme", "wrong-signature", "expired", "wrong-audience"],
)
def test_invalid_tokens_rejected(headers):
    assert client.get("/api/v1/me", headers=headers).status_code == 401


def test_unsigned_token_rejected():
    unsigned = jwt.encode({"sub": PATIENT, "aud": "authenticated", "exp": int(time.time()) + 60}, None, algorithm="none")
    assert client.get("/api/v1/me", headers={"Authorization": f"Bearer {unsigned}"}).status_code == 401


def test_hs256_rejected_when_project_uses_signing_keys(monkeypatch):
    monkeypatch.setattr(settings, "SUPABASE_JWT_SECRET", "")
    assert client.get("/api/v1/me", headers=bearer()).status_code == 401


def test_account_without_profile_is_forbidden():
    assert client.get("/api/v1/consents", headers=bearer(NO_PROFILE)).status_code == 403


def test_role_comes_from_profile_not_token():
    """A token claiming app_metadata.role=admin does not make a patient an admin."""
    claims = {
        "sub": PATIENT, "aud": "authenticated", "exp": int(time.time()) + 60,
        "role": "service_role", "app_metadata": {"role": "admin"},
    }
    forged = jwt.encode(claims, SECRET, algorithm="HS256")
    res = client.get("/api/v1/governance/summary", headers={"Authorization": f"Bearer {forged}"})
    assert res.status_code == 403


@pytest.mark.parametrize(
    "sub,method,path",
    [
        (PATIENT, "GET", "/api/v1/governance/summary"),
        (PATIENT, "GET", "/api/v1/doctor/reviews"),
        (PATIENT, "PATCH", "/api/v1/doctor/reviews/some-id"),
        (DOCTOR, "GET", "/api/v1/governance/summary"),
        (DOCTOR, "GET", "/api/v1/consents"),
        (DOCTOR, "POST", "/api/v1/assessment"),
        (DOCTOR, "POST", "/api/v1/appointments"),
        (ADMIN, "GET", "/api/v1/doctor/reviews"),
        (ADMIN, "GET", "/api/v1/appointments"),
        (ADMIN, "GET", "/api/v1/health-profile"),
        (ADMIN, "POST", "/api/v1/assessment"),
    ],
)
def test_role_guard_forbids_wrong_role(sub, method, path):
    res = client.request(method, path, headers=bearer(sub), json=ASSESSMENT_PAYLOAD)
    assert res.status_code == 403, f"{ROLES[sub]} {method} {path} -> {res.status_code}"


def test_role_guard_allows_right_role():
    """A patient passes the guard; the request then stops at 'no models yet' (503), not 401/403."""
    res = client.post("/api/v1/assessment", headers=bearer(PATIENT), json=ASSESSMENT_PAYLOAD)
    assert res.status_code == 503
    assert "not available" in res.json()["detail"]


def test_missing_medical_input_is_rejected_not_defaulted():
    """Hard rule 3: a missing medical input must never be silently filled in."""
    import copy

    payload = copy.deepcopy(ASSESSMENT_PAYLOAD)
    for field in ("ca", "thal", "oldpeak", "cp"):
        del payload["clinical_inputs"][field]
    res = client.post("/api/v1/assessment", headers=bearer(PATIENT), json=payload)
    assert res.status_code == 422
    missing = {err["loc"][-1] for err in res.json()["detail"]}
    assert {"ca", "thal", "oldpeak", "cp"} <= missing


def test_what_if_returns_503_without_models():
    res = client.post("/api/v1/what-if", headers=bearer(PATIENT), json=ASSESSMENT_PAYLOAD)
    assert res.status_code == 503


def test_unknown_consent_purpose_rejected():
    res = client.put("/api/v1/consents/sell_my_data", headers=bearer(PATIENT), json={"granted": True})
    assert res.status_code == 422


def test_require_role_rejects_unknown_roles():
    with pytest.raises(ValueError):
        auth.require_role("researcher")


def test_assistant_emergency_triage():
    payload = {"message": "I am having severe crushing chest pain and pressure", "language": "en"}
    res = client.post("/api/v1/assistant/message", headers=bearer(PATIENT), json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["escalation_recommended"] is True
    assert "108" in data["response"]


def test_assistant_non_emergency_reply_is_fixed_text():
    payload = {"message": "hello", "language": "en"}
    res = client.post("/api/v1/assistant/message", headers=bearer(PATIENT), json=payload)
    assert res.status_code == 200
    assert res.json()["escalation_recommended"] is False
    assert res.json()["citations"] == []
