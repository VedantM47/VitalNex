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
    assert "URGENT SAFETY NOTICE" in data["response"]


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
        "doctor_id": "doc-001",
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
