"""
Dataset Service implementation.
Reads and inspects the Pune Clinical Risk Synthetic Dataset (20,000 records, 26 columns).
"""

import os
import pandas as pd
from typing import Dict, Any, Optional
from apps.api.core.config import settings
from .base import IDatasetService


class DatasetService(IDatasetService):
    def __init__(self):
        self._df: Optional[pd.DataFrame] = None
        self._metadata: Optional[Dict[str, Any]] = None

    def load_dataset(self) -> Optional[pd.DataFrame]:
        if self._df is not None:
            return self._df

        # Resolve dataset path
        possible_paths = [
            settings.DATASET_PATH,
            os.path.join(os.getcwd(), settings.DATASET_PATH),
            os.path.join(os.getcwd(), "data", "raw", "Pune_Clinical_Risk_Synthetic_Dataset_20000.csv"),
            os.path.join("..", "..", "data", "raw", "Pune_Clinical_Risk_Synthetic_Dataset_20000.csv"),
        ]

        for p in possible_paths:
            if os.path.exists(p):
                try:
                    self._df = pd.read_csv(p)
                    return self._df
                except Exception as e:
                    print(f"Error loading dataset from {p}: {e}")

        # If not on disk, return None
        return None

    def get_metadata(self) -> Dict[str, Any]:
        df = self.load_dataset()
        if df is not None:
            row_count, col_count = df.shape
            cols = list(df.columns)
            target_distribution = {}
            if "risk_band" in df.columns:
                target_distribution = df["risk_band"].value_counts().to_dict()

            return {
                "dataset_name": "Pune Clinical Risk Synthetic Research Dataset",
                "version": "1.0.0-academic",
                "rows": row_count,
                "columns": col_count,
                "feature_names": cols,
                "target_column": "heart_disease_risk",
                "risk_band_distribution": target_distribution,
                "is_synthetic": True,
                "phi_detected": False,
                "disclaimer": "Academic synthetic dataset for clinical AI research; not real patient records.",
            }

        return {
            "dataset_name": "Pune Clinical Risk Synthetic Research Dataset",
            "version": "1.0.0-demo-fallback",
            "rows": 20000,
            "columns": 26,
            "target_column": "heart_disease_risk",
            "is_synthetic": True,
            "phi_detected": False,
            "disclaimer": "Synthetic dataset metadata schema registered.",
        }

    def get_feature_schema(self) -> Dict[str, Any]:
        return {
            "patient_id": {"type": "string", "category": "identifier", "description": "Synthetic ID"},
            "age": {"type": "integer", "category": "model_feature", "bounds": [18, 85]},
            "sex": {"type": "integer", "category": "model_feature", "values": {0: "female", 1: "male"}},
            "locality_type": {"type": "string", "category": "context", "values": ["Urban_Pune", "Peri_Urban_Pune", "PCMC", "Rural_Maharashtra"]},
            "socioeconomic_band": {"type": "string", "category": "fairness_subgroup", "values": ["Lower", "Lower_Middle", "Middle", "Upper_Middle", "Upper"]},
            "bmi": {"type": "float", "category": "model_feature", "bounds": [15.0, 48.0]},
            "smoking": {"type": "integer", "category": "lifestyle", "values": {0: "no", 1: "yes"}},
            "physical_activity": {"type": "string", "category": "lifestyle", "values": ["Low", "Moderate", "High"]},
            "diet_quality": {"type": "string", "category": "lifestyle", "values": ["Needs_Improvement", "Moderate", "Healthy"]},
            "family_history": {"type": "integer", "category": "clinical", "values": {0: "no", 1: "yes"}},
            "diabetes": {"type": "integer", "category": "clinical", "values": {0: "no", 1: "yes"}},
            "hypertension": {"type": "integer", "category": "clinical", "values": {0: "no", 1: "yes"}},
            "cp": {"type": "integer", "category": "model_feature", "description": "Chest pain type 1-4"},
            "trestbps": {"type": "float", "category": "model_feature", "description": "Resting BP mm Hg"},
            "chol": {"type": "float", "category": "model_feature", "description": "Serum cholesterol mg/dL"},
            "fbs": {"type": "integer", "category": "model_feature", "description": "Fasting blood sugar > 120"},
            "restecg": {"type": "integer", "category": "model_feature", "description": "Resting ECG 0-2"},
            "thalach": {"type": "float", "category": "model_feature", "description": "Max HR achieved"},
            "exang": {"type": "integer", "category": "model_feature", "description": "Exercise angina 0/1"},
            "oldpeak": {"type": "float", "category": "model_feature", "description": "ST depression"},
            "slope": {"type": "integer", "category": "model_feature", "description": "Peak exercise ST slope 1-3"},
            "ca": {"type": "integer", "category": "model_feature", "description": "Major vessels 0-3"},
            "thal": {"type": "integer", "category": "model_feature", "description": "Thalassemia 3, 6, 7"},
            "clinical_risk_probability": {"type": "float", "category": "synthetic_score", "bounds": [0.0, 100.0]},
            "risk_band": {"type": "string", "category": "target_band", "values": ["Low", "Moderate", "High"]},
            "heart_disease_risk": {"type": "integer", "category": "target_binary", "values": {0: "no_risk", 1: "risk"}},
        }
