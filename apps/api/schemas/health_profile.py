"""
Health Profile Pydantic Schemas.
Explicitly isolates Model Features, Context Features, Lifestyle Features, and Nutrition.
"""

from typing import Optional
from pydantic import BaseModel, Field
from datetime import datetime


class ClinicalModelFeatures(BaseModel):
    """
    Strictly validated clinical features consumed by the predictive ML/DL pipeline.
    """
    age: int = Field(..., ge=18, le=100, description="Age in years")
    sex: int = Field(..., ge=0, le=1, description="0=Female, 1=Male")
    bmi: float = Field(..., ge=10.0, le=60.0, description="Body Mass Index")
    smoking: int = Field(0, ge=0, le=1, description="0=No, 1=Yes")
    family_history: int = Field(0, ge=0, le=1, description="Cardiovascular family history 0=No, 1=Yes")
    diabetes: int = Field(0, ge=0, le=1, description="Diagnosed diabetes 0=No, 1=Yes")
    hypertension: int = Field(0, ge=0, le=1, description="Diagnosed hypertension 0=No, 1=Yes")
    cp: int = Field(4, ge=1, le=4, description="Chest pain type (1=typical, 2=atypical, 3=non-anginal, 4=asymptomatic)")
    trestbps: float = Field(120.0, ge=80.0, le=220.0, description="Resting blood pressure (mm Hg)")
    chol: float = Field(190.0, ge=100.0, le=550.0, description="Serum cholesterol (mg/dL)")
    fbs: int = Field(0, ge=0, le=1, description="Fasting blood sugar > 120 mg/dL")
    restecg: int = Field(0, ge=0, le=2, description="Resting electrocardiographic results")
    thalach: float = Field(150.0, ge=60.0, le=220.0, description="Maximum heart rate achieved")
    exang: int = Field(0, ge=0, le=1, description="Exercise-induced angina (0=No, 1=Yes)")
    oldpeak: float = Field(0.0, ge=0.0, le=10.0, description="ST depression induced by exercise relative to rest")
    slope: int = Field(1, ge=1, le=3, description="Slope of the peak exercise ST segment")
    ca: int = Field(0, ge=0, le=3, description="Number of major vessels (0-3) colored by flourosopy")
    thal: int = Field(3, description="3=normal, 6=fixed defect, 7=reversible defect")


class LifestyleFeatures(BaseModel):
    physical_activity: str = Field("Moderate", pattern="^(Low|Moderate|High)$")
    sedentary_hours_per_day: float = Field(6.0, ge=0.0, le=24.0)
    sleep_hours_per_night: float = Field(7.0, ge=2.0, le=16.0)
    stress_level: str = Field("Moderate", pattern="^(Low|Moderate|High|Severe)$")
    hydration_liters_per_day: float = Field(2.0, ge=0.5, le=10.0)


class NutritionFeatures(BaseModel):
    diet_quality: str = Field("Moderate", pattern="^(Needs_Improvement|Moderate|Healthy)$")
    diet_pattern: str = Field("Mixed", pattern="^(Vegetarian|Non-Vegetarian|Vegan|Jain|Mixed)$")
    meal_frequency_per_day: int = Field(3, ge=1, le=6)
    daily_fruit_veg_servings: int = Field(2, ge=0, le=15)
    processed_food_frequency: str = Field("Occasional", pattern="^(Rarely|Occasional|Frequent|Daily)$")


class ContextFeatures(BaseModel):
    locality_type: str = Field("Urban_Pune", pattern="^(Urban_Pune|Peri_Urban_Pune|PCMC|Rural_Maharashtra)$")
    socioeconomic_band: str = Field("Middle", pattern="^(Lower|Lower_Middle|Middle|Upper_Middle|Upper)$")
    city: str = "Pune"
    region: str = "Maharashtra"
    country: str = "India"
    occupation: Optional[str] = None
    work_pattern: Optional[str] = None


class HealthProfileCreate(BaseModel):
    user_id: str
    clinical_model: ClinicalModelFeatures
    lifestyle: LifestyleFeatures
    nutrition: NutritionFeatures
    context: ContextFeatures
    height_cm: Optional[float] = Field(None, ge=50, le=250)
    weight_kg: Optional[float] = Field(None, ge=20, le=300)
    blood_group: Optional[str] = None


class HealthProfileUpdate(BaseModel):
    clinical_model: Optional[ClinicalModelFeatures] = None
    lifestyle: Optional[LifestyleFeatures] = None
    nutrition: Optional[NutritionFeatures] = None
    context: Optional[ContextFeatures] = None
    height_cm: Optional[float] = None
    weight_kg: Optional[float] = None
    blood_group: Optional[str] = None


class HealthProfileResponse(BaseModel):
    id: str
    user_id: str
    completeness_score: int
    clinical_model: ClinicalModelFeatures
    lifestyle: LifestyleFeatures
    nutrition: NutritionFeatures
    context: ContextFeatures
    created_at: datetime
    updated_at: datetime
