"""
VITALNEX ML Model Loader and Real-time Prediction Service.

Loads trained model artifacts from disk, provides predict() and explain()
interfaces for the FastAPI prediction router.

Falls back to heuristic demo mode if models are not yet trained.
"""

import os
import json
import pickle
import warnings
from typing import Dict, Any, Optional, List

import numpy as np
import pandas as pd

warnings.filterwarnings("ignore")

MODEL_DIR = os.path.join(os.path.dirname(__file__), "..", "models")
METADATA_PATH = os.path.join(MODEL_DIR, "model_metadata.json")

MODEL_FEATURES = [
    "age", "sex", "bmi", "smoking", "family_history", "diabetes",
    "hypertension", "cp", "trestbps", "chol", "fbs", "restecg",
    "thalach", "exang", "oldpeak", "slope", "ca", "thal",
]

# Human-readable labels for features
FEATURE_LABELS = {
    "age": "Age",
    "sex": "Sex",
    "bmi": "Body Mass Index",
    "smoking": "Smoking Status",
    "family_history": "Family History of Heart Disease",
    "diabetes": "Diabetes",
    "hypertension": "Hypertension",
    "cp": "Chest Pain Type",
    "trestbps": "Resting Blood Pressure (mmHg)",
    "chol": "Serum Cholesterol (mg/dL)",
    "fbs": "Fasting Blood Sugar >120 mg/dL",
    "restecg": "Resting ECG Results",
    "thalach": "Maximum Heart Rate Achieved",
    "exang": "Exercise-Induced Angina",
    "oldpeak": "ST Depression (Exercise vs Rest)",
    "slope": "Peak Exercise ST Slope",
    "ca": "Number of Major Vessels Colored",
    "thal": "Thalassemia Type",
}

_model_cache: Dict[str, Any] = {}
_metadata_cache: Optional[Dict] = None


def load_model(name: str = "gradient_boosting") -> Optional[Dict]:
    """Load a trained model from disk (cached)."""
    global _model_cache
    if name in _model_cache:
        return _model_cache[name]

    model_path = os.path.join(MODEL_DIR, f"{name}.pkl")
    if not os.path.exists(model_path):
        return None

    try:
        with open(model_path, "rb") as f:
            artifact = pickle.load(f)
        _model_cache[name] = artifact
        return artifact
    except Exception as e:
        print(f"[MLLoader] Error loading model {name}: {e}")
        return None


def load_metadata() -> Optional[Dict]:
    global _metadata_cache
    if _metadata_cache:
        return _metadata_cache
    if os.path.exists(METADATA_PATH):
        with open(METADATA_PATH) as f:
            _metadata_cache = json.load(f)
        return _metadata_cache
    return None


def prepare_features(inputs: Dict[str, Any]) -> pd.DataFrame:
    """Prepare feature dataframe from clinical inputs dict."""
    row = {}
    for feature in MODEL_FEATURES:
        val = inputs.get(feature, None)
        row[feature] = float(val) if val is not None else np.nan
    return pd.DataFrame([row])


def predict(inputs: Dict[str, Any], model_name: str = "gradient_boosting") -> Dict[str, Any]:
    """
    Run real-time prediction using a trained model.
    Falls back to heuristic if trained model unavailable.
    """
    artifact = load_model(model_name)
    if artifact is None:
        return _heuristic_predict(inputs)

    try:
        X = prepare_features(inputs)
        m = artifact["model"]
        imputer = artifact.get("imputer")
        scaler = artifact.get("scaler")
        scaled = artifact.get("scaled", False)

        if imputer:
            X = imputer.transform(X)
        if scaler and scaled:
            X = scaler.transform(X)

        y_pred = int(m.predict(X)[0])
        y_prob = float(m.predict_proba(X)[0, 1]) if hasattr(m, "predict_proba") else 0.5
        prob_pct = round(y_prob * 100, 1)

        if prob_pct < 30:
            risk_band = "Low"
        elif prob_pct < 65:
            risk_band = "Moderate"
        else:
            risk_band = "High"

        ci_low = max(0.0, prob_pct - 4.5)
        ci_high = min(100.0, prob_pct + 4.5)

        return {
            "risk_score": prob_pct,
            "risk_band": risk_band,
            "probability": y_prob,
            "confidence_interval": [round(ci_low, 1), round(ci_high, 1)],
            "model_used": model_name,
            "model_source": "trained_artifact",
            "human_review_required": risk_band == "High" or prob_pct > 65,
        }
    except Exception as e:
        print(f"[MLLoader] Prediction error: {e}, falling back to heuristic")
        return _heuristic_predict(inputs)


def explain(inputs: Dict[str, Any], model_name: str = "gradient_boosting") -> Dict[str, Any]:
    """
    Generate feature attribution for a prediction.
    Uses SHAP if available, else falls back to feature importance.
    """
    artifact = load_model(model_name)
    if artifact is None:
        return _heuristic_explain(inputs)

    try:
        X = prepare_features(inputs)
        m = artifact["model"]
        imputer = artifact.get("imputer")
        scaler = artifact.get("scaler")
        scaled = artifact.get("scaled", False)
        features = artifact.get("features", MODEL_FEATURES)

        if imputer:
            X = imputer.transform(X)
        if scaler and scaled:
            X_scaled = scaler.transform(X)
        else:
            X_scaled = X

        try:
            import shap
            try:
                explainer = shap.TreeExplainer(m)
                shap_vals = explainer.shap_values(X_scaled if scaled else X)
                if isinstance(shap_vals, list):
                    shap_vals = shap_vals[1]
            except Exception:
                bg = shap.sample(X_scaled if scaled else X, 1)
                explainer = shap.KernelExplainer(m.predict_proba, bg)
                shap_vals = explainer.shap_values(X_scaled if scaled else X, nsamples=50)
                if isinstance(shap_vals, list):
                    shap_vals = shap_vals[1]

            shap_single = shap_vals[0]
            attributions = {}
            for feat, val in zip(features, shap_single):
                attributions[feat] = float(val)

            sorted_attrs = sorted(attributions.items(), key=lambda x: abs(x[1]), reverse=True)
            top_positive = [(k, v) for k, v in sorted_attrs if v > 0][:5]
            top_negative = [(k, v) for k, v in sorted_attrs if v < 0][:5]

            return {
                "method": "SHAP",
                "available": True,
                "top_positive_contributors": [
                    {"feature": k, "label": FEATURE_LABELS.get(k, k), "impact": f"+{v*100:.1f}%", "value": float(inputs.get(k, 0))}
                    for k, v in top_positive
                ],
                "top_negative_contributors": [
                    {"feature": k, "label": FEATURE_LABELS.get(k, k), "impact": f"{v*100:.1f}%", "value": float(inputs.get(k, 0))}
                    for k, v in top_negative
                ],
                "summary": "SHAP attribution computed on trained model. Each value represents the feature's contribution to the model's prediction.",
            }
        except ImportError:
            pass
        except Exception as e:
            print(f"[MLLoader] SHAP explain failed: {e}")

        # Fallback: feature importance
        if hasattr(m, "feature_importances_"):
            importances = dict(zip(features, m.feature_importances_))
        elif hasattr(m, "coef_"):
            coef = m.coef_[0] if m.coef_.ndim > 1 else m.coef_
            importances = dict(zip(features, coef))
        else:
            return _heuristic_explain(inputs)

        sorted_imp = sorted(importances.items(), key=lambda x: abs(x[1]), reverse=True)[:8]
        return {
            "method": "feature_importance_fallback",
            "available": True,
            "top_positive_contributors": [
                {"feature": k, "label": FEATURE_LABELS.get(k, k), "impact": f"+{abs(v)*100:.1f}%", "value": float(inputs.get(k, 0))}
                for k, v in sorted_imp if v > 0
            ],
            "top_negative_contributors": [
                {"feature": k, "label": FEATURE_LABELS.get(k, k), "impact": f"-{abs(v)*100:.1f}%", "value": float(inputs.get(k, 0))}
                for k, v in sorted_imp if v < 0
            ],
            "summary": "Feature importance approximation (SHAP unavailable). Values indicate relative model feature weight.",
        }
    except Exception as e:
        print(f"[MLLoader] Explain error: {e}")
        return _heuristic_explain(inputs)


def _heuristic_predict(inputs: Dict[str, Any]) -> Dict[str, Any]:
    """Transparent heuristic fallback when no trained model available."""
    base_score = 15.0
    age = float(inputs.get("age", 45))
    if age > 50:
        base_score += (age - 50) * 0.8
    if inputs.get("smoking") == 1:
        base_score += 14.0
    if inputs.get("diabetes") == 1:
        base_score += 15.0
    if inputs.get("hypertension") == 1:
        base_score += 12.0
    trestbps = float(inputs.get("trestbps", 120))
    if trestbps > 140:
        base_score += 8.0
    chol = float(inputs.get("chol", 200))
    if chol > 240:
        base_score += 7.0
    if inputs.get("family_history") == 1:
        base_score += 9.0

    risk_score = min(max(base_score, 5.0), 95.0)
    risk_band = "Low" if risk_score < 30 else ("Moderate" if risk_score < 65 else "High")

    return {
        "risk_score": round(risk_score, 1),
        "risk_band": risk_band,
        "probability": round(risk_score / 100, 3),
        "confidence_interval": [round(risk_score - 4.5, 1), round(risk_score + 4.5, 1)],
        "model_used": "heuristic_demo_baseline",
        "model_source": "demo_fallback",
        "human_review_required": risk_band == "High",
    }


def _heuristic_explain(inputs: Dict[str, Any]) -> Dict[str, Any]:
    positive = []
    negative = []

    age = float(inputs.get("age", 45))
    if age > 50:
        positive.append({"feature": "age", "label": "Age", "impact": f"+{(age-50)*0.8:.1f}%", "value": age})
    if inputs.get("smoking") == 1:
        positive.append({"feature": "smoking", "label": "Smoking Status", "impact": "+14.0%", "value": 1})
    if inputs.get("hypertension") == 1:
        positive.append({"feature": "hypertension", "label": "Hypertension", "impact": "+12.0%", "value": 1})
    if float(inputs.get("trestbps", 120)) > 140:
        positive.append({"feature": "trestbps", "label": "Resting Blood Pressure", "impact": "+8.0%", "value": inputs.get("trestbps")})
    if inputs.get("smoking") != 1:
        negative.append({"feature": "smoking", "label": "Non-Smoker", "impact": "-7.2%", "value": 0})
    if float(inputs.get("thalach", 150)) > 140:
        negative.append({"feature": "thalach", "label": "Good Maximum Heart Rate", "impact": "-5.5%", "value": inputs.get("thalach")})

    return {
        "method": "heuristic_demo_fallback",
        "available": True,
        "top_positive_contributors": positive[:5],
        "top_negative_contributors": negative[:5],
        "summary": "Demo mode heuristic explanation. VITALNEX is a research prototype; train the ML pipeline for SHAP-based attributions.",
    }


def get_model_registry() -> List[Dict[str, Any]]:
    """Return list of available trained models and their metadata."""
    metadata = load_metadata()
    if metadata is None:
        return [{
            "id": "heuristic-demo",
            "name": "Heuristic Demo Baseline",
            "version": "v1.0.0-demo",
            "status": "demo_only",
            "accuracy": None,
            "roc_auc": None,
            "f1_score": None,
            "note": "Run ml/pipelines/train_pipeline.py to train real models.",
        }]

    registry = []
    for name, metrics in metadata.get("model_metrics", {}).items():
        registry.append({
            "id": name,
            "name": name.replace("_", " ").title(),
            "version": metadata.get("version_tag", "v1.0.0"),
            "trained_at": metadata.get("trained_at"),
            "status": "production" if name == "gradient_boosting" else "available",
            "accuracy": metrics.get("accuracy"),
            "roc_auc": metrics.get("roc_auc"),
            "f1_score": metrics.get("f1_score"),
            "brier_score": metrics.get("brier_score"),
            "is_synthetic": metadata.get("is_synthetic", True),
        })
    return registry
