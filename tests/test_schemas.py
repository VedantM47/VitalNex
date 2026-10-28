"""
Schema validation tests for VITALNEX.
"""

import pytest
from pydantic import ValidationError
from apps.api.schemas import (
    ProfileBase,
    HealthProfileAnswers,
    AssessmentRequest,
    DoctorResponse,
)


def test_health_profile_answers_have_no_defaults():
    """Health profile = the 14-question contract. Unanswered questions stay absent (hard rule 3)."""
    empty = HealthProfileAnswers()
    assert empty.answered() == {}
    some = HealthProfileAnswers(age=52, sex="male", high_bp=True)
    assert some.answered() == {"age": 52, "sex": "male", "high_bp": True}


@pytest.mark.parametrize("bad", [
    {"age": 10},                    # under 18
    {"height_cm": 90},              # outside 120-220
    {"gen_health": 6},
    {"sex": 1},                     # old integer coding
    {"trestbps": 120},              # old pre-P4 clinical field: unknown fields are rejected
    {"ca": 0, "thal": 3},
])
def test_health_profile_answers_reject_invalid_and_old_fields(bad):
    with pytest.raises(ValidationError):
        HealthProfileAnswers(**bad)


def test_old_clinical_health_profile_schema_removed():
    import apps.api.schemas as schemas

    for name in ("ClinicalModelFeatures", "LifestyleFeatures", "NutritionFeatures", "ContextFeatures",
                 "HealthProfileCreate"):
        assert not hasattr(schemas, name)


def test_doctor_schema_demo_flag():
    doc = DoctorResponse(
        id="doc-test-1",
        full_name="Dr. Test Joshi",
        medical_license_number="TEST-1234",
        specialization="Cardiology",
        specialization_code="cardiology",
        years_of_experience=10,
        languages_spoken=["English", "Marathi"],
        consultation_modes=["in_person"],
        is_demo=True,
    )
    assert doc.is_demo is True
    # Demo doctors have no ratings; nothing is filled in.
    assert doc.rating is None and doc.review_count is None
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
