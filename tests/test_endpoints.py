"""
API endpoint integration tests using FastAPI TestClient.
"""

from fastapi.testclient import TestClient
from apps.api.main import app

client = TestClient(app)

# Old 18-feature request shape, still accepted by the schema until P4 replaces it.
OLD_ASSESSMENT_PAYLOAD = {
    "user_id": "test-patient-001",
    "assessment_mode": "demo",
    "clinical_inputs": {
    "age": 55, "sex": 1, "bmi": 26.2, "smoking": 1, "family_history": 1,
    "diabetes": 0, "hypertension": 1, "cp": 4, "trestbps": 140.0, "chol": 220.0,
    "fbs": 0, "restecg": 0, "thalach": 145.0, "exang": 0, "oldpeak": 0.5,
    "slope": 1, "ca": 0, "thal": 3,
},
}


def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["product"] == "VITALNEX"
    assert "disclaimer" in data


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["demo_mode"] is True


def test_assessment_returns_503_without_models():
    """P0: no trained model exists, so no score may be produced (hard rule 4)."""
    response = client.post("/api/v1/assessment", json=OLD_ASSESSMENT_PAYLOAD)
    assert response.status_code == 503
    assert "not available" in response.json()["detail"]
    assert "risk_score" not in response.json()


def test_doctors_endpoint():
    response = client.get("/api/v1/doctors")
    assert response.status_code == 200
    doctors = response.json()
    assert len(doctors) > 0
    # Every demo doctor must have is_demo = True
    for doc in doctors:
        assert doc["is_demo"] is True


def test_missing_medical_input_is_rejected_not_defaulted():
    """Hard rule 3: a missing medical input must never be silently filled in."""
    import copy
    payload = copy.deepcopy(OLD_ASSESSMENT_PAYLOAD)
    for field in ("ca", "thal", "oldpeak", "cp"):
        del payload["clinical_inputs"][field]
    response = client.post("/api/v1/assessment", json=payload)
    assert response.status_code == 422
    missing = {err["loc"][-1] for err in response.json()["detail"]}
    assert {"ca", "thal", "oldpeak", "cp"} <= missing


def test_trust_passport_not_available():
    response = client.get("/api/v1/trust-passport/asm-12345")
    assert response.status_code == 503


def test_assistant_emergency_triage():
    # Prompt with emergency cardiac warning symptom
    payload = {
        "user_id": "test-patient-001",
        "message": "I am having severe crushing chest pain and pressure",
        "language": "en"
    }
    response = client.post("/api/v1/assistant/message", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["escalation_recommended"] is True
    assert "URGENT MEDICAL NOTICE" in data["response"] or "URGENT SAFETY NOTICE" in data["response"]


def test_models_registry_empty_until_trained():
    response = client.get("/api/v1/models")
    assert response.status_code == 200
    assert response.json() == []


def test_what_if_returns_503_without_models():
    response = client.post("/api/v1/what-if", json=OLD_ASSESSMENT_PAYLOAD)
    assert response.status_code == 503


def test_appointments_lifecycle():
    from datetime import datetime, timezone
    booking = {
        "patient_id": "test-patient-001",
        "doctor_id": "doc-pune-001",
        "appointment_time": datetime.now(timezone.utc).isoformat(),
        "consultation_type": "video",
        "patient_reason": "Cardiovascular risk consultation",
    }
    response = client.post("/api/v1/appointments", json=booking)
    assert response.status_code == 200
    created = response.json()
    assert created["patient_id"] == "test-patient-001"
    assert created["status"] in ["scheduled", "pending"]

    # Verify listing appointments
    list_res = client.get("/api/v1/appointments?user_id=test-patient-001&role=patient")
    assert list_res.status_code == 200
    assert len(list_res.json()) >= 1


def test_governance_summary_has_no_invented_metrics():
    response = client.get("/api/v1/governance/summary")
    assert response.status_code == 200
    gov = response.json()
    assert gov["total_assessments"] == 0
    assert gov["fairness_compliance_rate"] is None
    assert gov["data_quality_index"] is None
    assert gov["recent_events"] == []


def test_reports_list_empty_without_assessments():
    response = client.get("/api/v1/reports?user_id=demo-user")
    assert response.status_code == 200
    assert response.json() == []


def test_report_pdf_unknown_assessment_404():
    response = client.get("/api/v1/reports/asm-demo-001/pdf")
    assert response.status_code == 404


def test_assessment_history_empty():
    response = client.get("/api/v1/assessment/history/demo-user")
    assert response.status_code == 200
    history = response.json()
    assert history["total_assessments"] == 0
    assert history["trajectory"] == []



def test_invalid_assessment_404():
    """Verify invalid assessment ID returns 404 instead of demo fallback data."""
    res = client.get("/api/v1/assessment/non-existent-asm-id-999")
    assert res.status_code == 404


def test_video_token_not_in_mvp():
    res = client.get("/api/v1/appointments/apt-demo-001/video-token")
    assert res.status_code == 503
    assert "Not in MVP" in res.json()["detail"]


def test_voice_routes_not_in_mvp():
    res = client.post("/api/v1/voice/transcribe", json={"audio_base64": "", "language": "en"})
    assert res.status_code == 503
    assert "Not in MVP" in res.json()["detail"]


def test_assistant_non_emergency_reply_is_fixed_text():
    payload = {"user_id": "test-patient-001", "message": "hello", "language": "en"}
    response = client.post("/api/v1/assistant/message", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["escalation_recommended"] is False
    assert data["citations"] == []


def test_no_external_ai_integrations_remain():
    """Jev/TypeSafe and Gemini were removed (D-16, hard rule 6)."""
    import importlib.util
    import pathlib
    assert importlib.util.find_spec("apps.api.services.jev_service") is None
    src = pathlib.Path("apps/api/services/assistant_service.py").read_text(encoding="utf-8")
    assert "GEMINI" not in src and "httpx" not in src