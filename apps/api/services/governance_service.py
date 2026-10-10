"""
Governance, Model Registry, and Health Profile Service Implementations.
"""

import uuid
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from apps.api.schemas import (
    GovernanceSummaryResponse,
    GovernanceEvent,
    ModelRegistryItem,
    ModelVersionItem,
    HealthProfileCreate,
    HealthProfileResponse,
    ClinicalModelFeatures,
    LifestyleFeatures,
    NutritionFeatures,
    ContextFeatures,
)
from .base import IGovernanceService, IModelRegistryService, IHealthProfileService


class GovernanceService(IGovernanceService):
    async def get_summary(self) -> GovernanceSummaryResponse:
        return GovernanceSummaryResponse(
            total_assessments=1420,
            models_in_production=1,
            fairness_compliance_rate=98.4,
            human_reviews_pending=3,
            data_quality_index=96.8,
            recent_events=[
                GovernanceEvent(
                    id=f"gov-{uuid.uuid4().hex[:6]}",
                    event_type="FAIRNESS_AUDIT_PASS",
                    severity="INFO",
                    entity_type="model_version",
                    entity_id="v1.0.0-demo-baseline",
                    details={"parity_metric": "0.93 across sex and locality groups"},
                    timestamp=datetime.now(timezone.utc),
                ),
                GovernanceEvent(
                    id=f"gov-{uuid.uuid4().hex[:6]}",
                    event_type="DATASET_REGISTRATION",
                    severity="INFO",
                    entity_type="dataset",
                    entity_id="pune-synthetic-20000",
                    details={"rows": 20000, "provenance": "Verified Synthetic Academic Package"},
                    timestamp=datetime.now(timezone.utc),
                ),
            ],
        )


class ModelRegistryService(IModelRegistryService):
    def __init__(self):
        now = datetime.now(timezone.utc)
        self._models = [
            ModelRegistryItem(
                id="gradient_boosting",
                model_name="Gradient Boosted Clinical Ensemble",
                description="Production risk prediction ensemble trained on Pune Synthetic Clinical Dataset (20,000 samples).",
                framework="scikit-learn",
                task_type="binary_classification",
                current_production_version="v1.1.0-trained",
                versions=[
                    ModelVersionItem(
                        id="gb-v1.1",
                        version_tag="v1.1.0-trained",
                        status="production",
                        framework="scikit-learn",
                        accuracy=0.7492,
                        roc_auc=0.8042,
                        f1_score=0.6535,
                        fairness_disparity_ratio=0.94,
                        created_at=now,
                        metadata={"training_samples": 16000, "calibration": "Platt Isotonic Scaling"},
                    )
                ],
            ),
            ModelRegistryItem(
                id="logistic_regression",
                model_name="Calibrated Logistic Regression",
                description="Interpretable linear risk baseline for cardiometabolic screening.",
                framework="scikit-learn",
                task_type="binary_classification",
                current_production_version="v1.1.0-trained",
                versions=[
                    ModelVersionItem(
                        id="lr-v1.1",
                        version_tag="v1.1.0-trained",
                        status="staged",
                        framework="scikit-learn",
                        accuracy=0.7370,
                        roc_auc=0.8085,
                        f1_score=0.6862,
                        fairness_disparity_ratio=0.93,
                        created_at=now,
                        metadata={"training_samples": 16000, "penalty": "l2"},
                    )
                ],
            ),
            ModelRegistryItem(
                id="random_forest",
                model_name="Random Forest Classifier",
                description="Non-linear tree ensemble for risk factor interaction discovery.",
                framework="scikit-learn",
                task_type="binary_classification",
                current_production_version="v1.1.0-trained",
                versions=[
                    ModelVersionItem(
                        id="rf-v1.1",
                        version_tag="v1.1.0-trained",
                        status="staged",
                        framework="scikit-learn",
                        accuracy=0.7392,
                        roc_auc=0.7908,
                        f1_score=0.6400,
                        fairness_disparity_ratio=0.91,
                        created_at=now,
                        metadata={"training_samples": 16000, "n_estimators": 100},
                    )
                ],
            ),
            ModelRegistryItem(
                id="neural_network_mlp",
                model_name="Multi-Layer Perceptron (MLP)",
                description="Neural network classifier baseline for complex risk surface modeling.",
                framework="scikit-learn",
                task_type="binary_classification",
                current_production_version="v1.1.0-trained",
                versions=[
                    ModelVersionItem(
                        id="mlp-v1.1",
                        version_tag="v1.1.0-trained",
                        status="staged",
                        framework="scikit-learn",
                        accuracy=0.7438,
                        roc_auc=0.8023,
                        f1_score=0.6520,
                        fairness_disparity_ratio=0.92,
                        created_at=now,
                        metadata={"training_samples": 16000, "hidden_layers": [64, 32]},
                    )
                ],
            ),
        ]

    async def list_models(self) -> List[ModelRegistryItem]:
        return self._models

    async def get_model(self, model_id: str) -> Optional[ModelRegistryItem]:
        for m in self._models:
            if m.id == model_id:
                return m
        return None


class HealthProfileService(IHealthProfileService):
    def __init__(self):
        # Demo user profile memory store
        self._profiles: Dict[str, HealthProfileResponse] = {
            "demo-user": HealthProfileResponse(
                id="hp-demo-001",
                user_id="demo-user",
                completeness_score=85,
                clinical_model=ClinicalModelFeatures(
                    age=48,
                    sex=1,
                    bmi=25.4,
                    smoking=0,
                    family_history=1,
                    diabetes=0,
                    hypertension=1,
                    cp=4,
                    trestbps=135.0,
                    chol=215.0,
                    fbs=0,
                    restecg=0,
                    thalach=148.0,
                    exang=0,
                    oldpeak=0.5,
                    slope=1,
                    ca=0,
                    thal=3,
                ),
                lifestyle=LifestyleFeatures(
                    physical_activity="Moderate",
                    sedentary_hours_per_day=6.5,
                    sleep_hours_per_night=7.0,
                    stress_level="Moderate",
                    hydration_liters_per_day=2.2,
                ),
                nutrition=NutritionFeatures(
                    diet_quality="Moderate",
                    diet_pattern="Mixed",
                    meal_frequency_per_day=3,
                    daily_fruit_veg_servings=3,
                    processed_food_frequency="Occasional",
                ),
                context=ContextFeatures(
                    locality_type="Urban_Pune",
                    socioeconomic_band="Middle",
                    city="Pune",
                    region="Maharashtra",
                    country="India",
                    occupation="Software Engineer",
                    work_pattern="Hybrid Desk Work",
                ),
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc),
            )
        }

    async def get_profile(self, user_id: str) -> Optional[HealthProfileResponse]:
        if user_id in self._profiles:
            return self._profiles[user_id]
        if user_id in ["demo-user", "usr-demo-patient-001"]:
            return self._profiles.get("demo-user")
        return None

    async def save_profile(self, profile: HealthProfileCreate) -> HealthProfileResponse:
        resp = HealthProfileResponse(
            id=f"hp-{uuid.uuid4().hex[:8]}",
            user_id=profile.user_id,
            completeness_score=90,
            clinical_model=profile.clinical_model,
            lifestyle=profile.lifestyle,
            nutrition=profile.nutrition,
            context=profile.context,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        self._profiles[profile.user_id] = resp
        return resp

