"""
API endpoint integration tests using FastAPI TestClient.
"""

from fastapi.testclient import TestClient
from apps.api.main import app

client = TestClient(app)


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


def test_assessment_endpoint():
    payload = {
        "user_id": "test-patient-001",
        "assessment_mode": "demo",
        "clinical_inputs": {
            "age": 55,
            "sex": 1,
            "bmi": 26.2,
            "smoking": 1,
            "family_history": 1,
            "diabetes": 0,
            "hypertension": 1,
            "cp": 4,
            "trestbps": 140.0,
            "chol": 220.0,
            "fbs": 0,
            "restecg": 0,
            "thalach": 145.0,
            "exang": 0,
            "oldpeak": 0.5,
            "slope": 1,
            "ca": 0,
            "thal": 3,
        }
    }
    response = client.post("/api/v1/assessment", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "risk_score" in data
    assert data["risk_band"] in ["Low", "Moderate", "High"]
    assert "disclaimer" in data


def test_doctors_endpoint():
    response = client.get("/api/v1/doctors")
    assert response.status_code == 200
    doctors = response.json()
    assert len(doctors) > 0
    # Every demo doctor must have is_demo = True
    for doc in doctors:
        assert doc["is_demo"] is True


def test_trust_passport_endpoint():
    response = client.get("/api/v1/trust-passport/asm-12345")
    assert response.status_code == 200
    passport = response.json()
    assert "prediction" in passport
    assert "confidence" in passport
    assert "data_quality" in passport
    assert "explainability" in passport
    assert "fairness" in passport
    assert "uncertainty" in passport
    assert "safety" in passport
    assert "human_review" in passport
    assert len(passport["limitations"]) > 0


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


def test_models_registry():
    response = client.get("/api/v1/models")
    assert response.status_code == 200
    models = response.json()
    assert len(models) >= 4
    model_ids = [m["id"] for m in models]
    assert "gradient_boosting" in model_ids
    assert "logistic_regression" in model_ids


def test_what_if_simulation():
    payload = {
        "user_id": "test-patient-001",
        "assessment_mode": "demo",
        "clinical_inputs": {
            "age": 55,
            "sex": 1,
            "bmi": 28.5,
            "smoking": 1,
            "family_history": 1,
            "diabetes": 0,
            "hypertension": 1,
            "cp": 2,
            "trestbps": 140.0,
            "chol": 220.0,
            "fbs": 0,
            "restecg": 0,
            "thalach": 145.0,
            "exang": 0,
            "oldpeak": 0.5,
            "slope": 1,
            "ca": 0,
            "thal": 3,
        }
    }
    response = client.post("/api/v1/what-if", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "simulation_result" in data
    assert "MODEL-BEHAVIOR SIMULATION" in data["disclaimer"]


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


def test_governance_summary():
    response = client.get("/api/v1/governance/summary")
    assert response.status_code == 200
    gov = response.json()
    assert "total_assessments" in gov
    assert "fairness_compliance_rate" in gov


def test_reports_list():
    response = client.get("/api/v1/reports?user_id=demo-user")
    assert response.status_code == 200
    reports = response.json()
    assert len(reports) >= 1
    assert "pdf_download_url" in reports[0]
    assert "risk_band" in reports[0]


def test_report_pdf_generation():
    response = client.get("/api/v1/reports/asm-demo-001/pdf")
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert len(response.content) > 1000  # Valid binary PDF data


def test_assessment_history():
    response = client.get("/api/v1/assessment/history/demo-user")
    assert response.status_code == 200
    history = response.json()
    assert history["total_assessments"] >= 1
    assert len(history["trajectory"]) >= 1


def test_patient_data_isolation():
    """Verify that patient-alpha and patient-beta records are isolated and cannot see each other's data."""
    # Patient Alpha creates assessment
    alpha_payload = {
        "user_id": "patient-alpha-999",
        "assessment_mode": "clinical_screening",
        "clinical_inputs": {
            "age": 45, "sex": 1, "bmi": 22.0, "smoking": 0, "family_history": 0,
            "diabetes": 0, "hypertension": 0, "cp": 4, "trestbps": 115.0, "chol": 170.0,
            "fbs": 0, "restecg": 0, "thalach": 160.0, "exang": 0, "oldpeak": 0.0,
            "slope": 1, "ca": 0, "thal": 3,
        }
    }
    alpha_res = client.post("/api/v1/assessment", json=alpha_payload)
    assert alpha_res.status_code == 200
    alpha_asm = alpha_res.json()
    assert alpha_asm["user_id"] == "patient-alpha-999"

    # Patient Beta checks reports & history
    beta_reports_res = client.get("/api/v1/reports?user_id=patient-beta-888")
    assert beta_reports_res.status_code == 200
    beta_reports = beta_reports_res.json()
    assert not any(r["assessment_id"] == alpha_asm["id"] for r in beta_reports)

    beta_history_res = client.get("/api/v1/assessment/history/patient-beta-888")
    assert beta_history_res.status_code == 200
    beta_history = beta_history_res.json()
    assert not any(a["id"] == alpha_asm["id"] for a in beta_history["assessments"])


def test_invalid_assessment_404():
    """Verify invalid assessment ID returns 404 instead of demo fallback data."""
    res = client.get("/api/v1/assessment/non-existent-asm-id-999")
    assert res.status_code == 404


def test_video_token_endpoint():
    """Verify video token authorization and signaling URL generation."""
    res = client.get("/api/v1/appointments/apt-demo-001/video-token?user_id=patient-alpha-999&role=patient")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "authorized"
    assert "ws_signaling_url" in data
    assert "vitalnex-room-apt-demo-001" in data["room_name"]


