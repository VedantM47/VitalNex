"""
VITALNEX Clinical Risk ML Training Pipeline.

Trains Logistic Regression, Random Forest, Gradient Boosting, and Neural Network
(sklearn MLPClassifier) on the Pune Clinical Risk Synthetic Dataset.

IMPORTANT: This uses a SYNTHETIC academic research dataset.
All model metrics are for demonstration/research only.
Not for clinical use.

Usage:
    python -m ml.pipelines.train_pipeline
"""

import os
import json
import pickle
import warnings
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List, Tuple

import numpy as np
import pandas as pd

warnings.filterwarnings("ignore")

# Feature contract — these are the validated model features
# (excludes patient_id, target cols, risk_band, clinical_risk_probability)
MODEL_FEATURES = [
    "age", "sex", "bmi", "smoking", "family_history", "diabetes",
    "hypertension", "cp", "trestbps", "chol", "fbs", "restecg",
    "thalach", "exang", "oldpeak", "slope", "ca", "thal",
]

# Leakage-excluded columns (never used as model input)
EXCLUDED_COLUMNS = [
    "patient_id", "heart_disease_risk", "risk_band", "clinical_risk_probability",
]

TARGET_COLUMN = "heart_disease_risk"

DATASET_PATH = os.path.join(
    os.path.dirname(__file__), "..", "..", "data", "raw",
    "Pune_Clinical_Risk_Synthetic_Dataset_20000.csv"
)

MODEL_SAVE_DIR = os.path.join(os.path.dirname(__file__), "..", "models")


def load_dataset() -> Optional[pd.DataFrame]:
    paths_to_try = [
        DATASET_PATH,
        "data/raw/Pune_Clinical_Risk_Synthetic_Dataset_20000.csv",
        os.path.join(os.getcwd(), "data", "raw", "Pune_Clinical_Risk_Synthetic_Dataset_20000.csv"),
    ]
    for p in paths_to_try:
        if os.path.exists(p):
            df = pd.read_csv(p)
            print(f"[Pipeline] Loaded dataset: {p} ({len(df)} rows, {len(df.columns)} cols)")
            return df
    print("[Pipeline] WARNING: Dataset not found.")
    return None


def preprocess(df: pd.DataFrame):
    from sklearn.impute import SimpleImputer
    available_features = [f for f in MODEL_FEATURES if f in df.columns]
    X = df[available_features].copy()
    y = df[TARGET_COLUMN].values if TARGET_COLUMN in df.columns else None
    if y is None:
        raise ValueError(f"Target column '{TARGET_COLUMN}' not found.")
    imputer = SimpleImputer(strategy="median")
    X_imputed = imputer.fit_transform(X)
    return X_imputed, y, available_features, imputer


def train_all_models(df: pd.DataFrame):
    from sklearn.linear_model import LogisticRegression
    from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
    from sklearn.neural_network import MLPClassifier
    from sklearn.model_selection import train_test_split
    from sklearn.preprocessing import StandardScaler
    from sklearn.metrics import (
        accuracy_score, precision_score, recall_score,
        f1_score, roc_auc_score, confusion_matrix, brier_score_loss
    )

    RANDOM_STATE = 42
    X_raw, y, features, imputer = preprocess(df)
    X_train, X_test, y_train, y_test = train_test_split(
        X_raw, y, test_size=0.2, random_state=RANDOM_STATE, stratify=y
    )
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    print(f"[Pipeline] Train: {X_train.shape[0]} | Test: {X_test.shape[0]}")

    model_configs = {
        "logistic_regression": {
            "model": LogisticRegression(max_iter=1000, random_state=RANDOM_STATE, class_weight="balanced"),
            "scaled": True,
        },
        "random_forest": {
            "model": RandomForestClassifier(n_estimators=100, random_state=RANDOM_STATE, class_weight="balanced"),
            "scaled": False,
        },
        "gradient_boosting": {
            "model": GradientBoostingClassifier(n_estimators=100, random_state=RANDOM_STATE),
            "scaled": False,
        },
        "neural_network_mlp": {
            "model": MLPClassifier(
                hidden_layer_sizes=(64, 32), activation="relu", max_iter=500,
                random_state=RANDOM_STATE, early_stopping=True, validation_fraction=0.1,
            ),
            "scaled": True,
        },
    }

    results = {}
    trained_models = {}

    for name, config in model_configs.items():
        print(f"\n[Pipeline] Training {name}...")
        m = config["model"]
        X_tr = X_train_scaled if config["scaled"] else X_train
        X_te = X_test_scaled if config["scaled"] else X_test
        m.fit(X_tr, y_train)
        y_pred = m.predict(X_te)
        y_prob = m.predict_proba(X_te)[:, 1] if hasattr(m, "predict_proba") else None

        acc = accuracy_score(y_test, y_pred)
        prec = precision_score(y_test, y_pred, zero_division=0)
        rec = recall_score(y_test, y_pred, zero_division=0)
        f1 = f1_score(y_test, y_pred, zero_division=0)
        roc = roc_auc_score(y_test, y_prob) if y_prob is not None else None
        brier = brier_score_loss(y_test, y_prob) if y_prob is not None else None
        cm = confusion_matrix(y_test, y_pred).tolist()

        metrics = {
            "accuracy": round(float(acc), 4),
            "precision": round(float(prec), 4),
            "recall": round(float(rec), 4),
            "f1_score": round(float(f1), 4),
            "roc_auc": round(float(roc), 4) if roc is not None else None,
            "brier_score": round(float(brier), 4) if brier is not None else None,
            "confusion_matrix": cm,
            "test_samples": int(X_te.shape[0]),
        }
        roc_str = f"{roc:.4f}" if roc is not None else "N/A"
        print(f"  Accuracy: {acc:.4f} | ROC-AUC: {roc_str} | F1: {f1:.4f}")

        results[name] = metrics
        trained_models[name] = {
            "model": m,
            "scaler": scaler if config["scaled"] else None,
            "imputer": imputer,
            "features": features,
            "scaled": config["scaled"],
        }

    return results, trained_models


def compute_fairness(df: pd.DataFrame, trained_models: Dict) -> Dict[str, Any]:
    print("\n[Pipeline] Computing fairness metrics...")
    X_raw, y, features, imputer = preprocess(df)
    gb_entry = trained_models.get("gradient_boosting")
    if not gb_entry:
        return {}

    m = gb_entry["model"]
    y_pred = m.predict(X_raw)
    y_prob = m.predict_proba(X_raw)[:, 1]
    fairness = {}

    from sklearn.metrics import accuracy_score, recall_score, precision_score

    if "sex" in df.columns:
        for sex_val, sex_label in [(0, "Female"), (1, "Male")]:
            mask = df["sex"].values == sex_val
            if mask.sum() < 10:
                continue
            fairness[f"sex_{sex_label}"] = {
                "group": sex_label, "n": int(mask.sum()),
                "accuracy": round(float(accuracy_score(y[mask], y_pred[mask])), 4),
                "recall_tpr": round(float(recall_score(y[mask], y_pred[mask], zero_division=0)), 4),
                "precision": round(float(precision_score(y[mask], y_pred[mask], zero_division=0)), 4),
                "positive_rate": round(float(y_pred[mask].mean()), 4),
            }

    if "age" in df.columns:
        for lo, hi, label in [(18, 40, "18-40"), (40, 55, "40-55"), (55, 70, "55-70"), (70, 100, "70+")]:
            mask = (df["age"].values >= lo) & (df["age"].values < hi)
            if mask.sum() < 10:
                continue
            fairness[f"age_{label}"] = {
                "group": f"Age {label}", "n": int(mask.sum()),
                "accuracy": round(float(accuracy_score(y[mask], y_pred[mask])), 4),
                "recall_tpr": round(float(recall_score(y[mask], y_pred[mask], zero_division=0)), 4),
                "positive_rate": round(float(y_pred[mask].mean()), 4),
            }

    if "locality_type" in df.columns:
        for locality in df["locality_type"].dropna().unique():
            mask = df["locality_type"].values == locality
            if mask.sum() < 10:
                continue
            fairness[f"locality_{locality}"] = {
                "group": locality, "n": int(mask.sum()),
                "accuracy": round(float(accuracy_score(y[mask], y_pred[mask])), 4),
                "recall_tpr": round(float(recall_score(y[mask], y_pred[mask], zero_division=0)), 4),
                "positive_rate": round(float(y_pred[mask].mean()), 4),
            }

    positive_rates = [v["positive_rate"] for v in fairness.values() if "positive_rate" in v]
    if positive_rates:
        parity_ratio = round(min(positive_rates) / max(positive_rates), 4) if max(positive_rates) > 0 else 1.0
        fairness["_summary"] = {
            "demographic_parity_ratio": parity_ratio,
            "guideline": ">=0.80 per equal opportunity principle",
            "compliant": parity_ratio >= 0.80,
            "assessed_groups": len(fairness),
        }

    print(f"[Pipeline] Fairness computed for {len(fairness)} groups")
    return fairness


def compute_explainability(model_entry: Dict, X_sample: np.ndarray, feature_names: List[str]) -> Dict:
    try:
        import shap
        m = model_entry["model"]
        scaler = model_entry.get("scaler")
        X_eval = scaler.transform(X_sample[:100]) if scaler else X_sample[:100]
        try:
            explainer = shap.TreeExplainer(m)
            shap_vals = explainer.shap_values(X_eval)
            if isinstance(shap_vals, list):
                shap_vals = shap_vals[1]
        except Exception:
            explainer = shap.KernelExplainer(m.predict_proba, shap.sample(X_eval, 50))
            shap_vals = explainer.shap_values(X_eval[:10], nsamples=100)
            if isinstance(shap_vals, list):
                shap_vals = shap_vals[1]

        mean_shap = np.abs(shap_vals).mean(axis=0)
        fi = dict(zip(feature_names, mean_shap.tolist()))
        sorted_fi = sorted(fi.items(), key=lambda x: x[1], reverse=True)
        return {
            "method": "SHAP", "available": True,
            "top_features": [{"feature": k, "importance": round(v, 6), "label": k.replace("_", " ").title()} for k, v in sorted_fi[:10]],
        }
    except ImportError:
        pass
    except Exception as e:
        print(f"[Pipeline] SHAP failed: {e}")

    m = model_entry["model"]
    if hasattr(m, "feature_importances_"):
        fi = dict(zip(feature_names, m.feature_importances_.tolist()))
        sorted_fi = sorted(fi.items(), key=lambda x: x[1], reverse=True)
        return {
            "method": "sklearn_feature_importance", "available": True,
            "top_features": [{"feature": k, "importance": round(v, 6), "label": k.replace("_", " ").title()} for k, v in sorted_fi[:10]],
        }
    elif hasattr(m, "coef_"):
        coef = np.abs(m.coef_[0]) if m.coef_.ndim > 1 else np.abs(m.coef_)
        fi = dict(zip(feature_names, coef.tolist()))
        sorted_fi = sorted(fi.items(), key=lambda x: x[1], reverse=True)
        return {
            "method": "logistic_coefficient_magnitude", "available": True,
            "top_features": [{"feature": k, "importance": round(v, 6), "label": k.replace("_", " ").title()} for k, v in sorted_fi[:10]],
        }
    return {"method": "unavailable", "available": False, "top_features": []}


def save_models(trained_models: Dict, results: Dict, fairness: Dict) -> str:
    os.makedirs(MODEL_SAVE_DIR, exist_ok=True)
    timestamp = datetime.now(timezone.utc).isoformat()

    metadata = {
        "version_tag": "v1.1.0-trained",
        "trained_at": timestamp,
        "dataset": "Pune_Clinical_Risk_Synthetic_Dataset_20000.csv",
        "feature_contract": MODEL_FEATURES,
        "excluded_columns": EXCLUDED_COLUMNS,
        "target": TARGET_COLUMN,
        "is_synthetic": True,
        "disclaimer": "Research/demo system. Not for clinical use.",
        "model_metrics": results,
        "fairness": fairness,
    }

    meta_path = os.path.join(MODEL_SAVE_DIR, "model_metadata.json")
    with open(meta_path, "w") as f:
        json.dump(metadata, f, indent=2, default=str)

    for name, entry in trained_models.items():
        artifact = {k: v for k, v in entry.items()}
        model_path = os.path.join(MODEL_SAVE_DIR, f"{name}.pkl")
        with open(model_path, "wb") as f:
            pickle.dump(artifact, f)
        print(f"[Pipeline] Saved: {model_path}")

    print(f"\n[Pipeline] Metadata saved: {meta_path}")
    return meta_path


def run_pipeline():
    print("=" * 60)
    print("VITALNEX Clinical Risk ML Training Pipeline")
    print("DISCLAIMER: Synthetic academic research dataset only.")
    print("Not for clinical use.")
    print("=" * 60)

    df = load_dataset()
    if df is None:
        print("[Pipeline] ERROR: Cannot proceed without dataset.")
        return None

    results, trained_models = train_all_models(df)
    fairness = compute_fairness(df, trained_models)

    X_raw, y, features, imputer = preprocess(df)
    gb_entry = trained_models.get("gradient_boosting")
    if gb_entry:
        shap_result = compute_explainability(gb_entry, X_raw, features)
        results["gradient_boosting"]["explainability"] = shap_result

    save_models(trained_models, results, fairness)

    print("\n" + "=" * 60)
    print("[Pipeline] TRAINING COMPLETE")
    for name, metrics in results.items():
        acc = metrics.get("accuracy", "N/A")
        auc = metrics.get("roc_auc", "N/A")
        print(f"  {name:35s} Acc={acc} | AUC={auc}")
    print("=" * 60)
    return results


if __name__ == "__main__":
    run_pipeline()
