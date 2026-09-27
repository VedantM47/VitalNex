"""
Schema validation tests for VITALNEX.
"""

import pytest
from pydantic import ValidationError
from apps.api.schemas import (
    ProfileBase,
    ClinicalModelFeatures,
    LifestyleFeatures,
    NutritionFeatures,
    ContextFeatures,
    AssessmentRequest,
    DoctorResponse,
    TrustPassportResponse,
)


def test_clinical_model_features_valid():
    features = ClinicalModelFeatures(
        age=52,
        sex=1,
        bmi=24.9,
        smoking=0,
        family_history=0,
        diabetes=0,
        hypertension=1,
        cp=4,
        trestbps=132.0,
        chol=181.0,
        fbs=0,
        restecg=0,
        thalach=195.0,
        exang=0,
        oldpeak=0.0,
        slope=1,
        ca=0,
        thal=3,
    )
    assert features.age == 52
    assert features.sex == 1
    assert features.bmi == 24.9


def test_clinical_model_features_invalid_age():
    with pytest.raises(ValidationError):
        ClinicalModelFeatures(
            age=10,  # Below minimum 18
            sex=1,
            bmi=22.0,
            trestbps=120.0,
            chol=180.0,
        )


def test_doctor_schema_demo_flag():
    doc = DoctorResponse(
        id="doc-test-1",
        full_name="Dr. Test Joshi",
        medical_license_number="TEST-1234",
        specialization="Cardiology",
        years_of_experience=10,
        languages_spoken=["English", "Marathi"],
        consultation_modes=["video"],
        rating=4.9,
        review_count=20,
        is_demo=True,
    )
    assert doc.is_demo is True
    assert "English" in doc.languages_spoken


def test_profile_role_validation():
    p = ProfileBase(
        email="test@vitalnex.health",
        full_name="Test User",
        role="patient",
        preferred_language="mr",
    )
    assert p.role == "patient"
    assert p.preferred_language == "mr"

    with pytest.raises(ValidationError):
        ProfileBase(
            email="test@vitalnex.health",
            full_name="Test User",
            role="super_hacker",  # Invalid role
        )
