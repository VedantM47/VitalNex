"""Load a disease's saved artifacts and score inputs. Shared by training evaluation and the API.

Inputs must contain all 14 features (ml.training.features.FEATURES). Missing values are rejected,
never filled (CLAUDE.md hard rule 3).
"""
import json
from functools import cached_property
from pathlib import Path

import joblib
import numpy as np
import pandas as pd

from ml.training import bands, conformal, explain, ood
from ml.training.features import FEATURES

ARTIFACTS = Path(__file__).resolve().parent / "artifacts"


class DiseaseModel:
    def __init__(self, disease: str, root: Path = ARTIFACTS):
        d = root / disease
        self.disease = disease
        self.meta = json.loads((d / "model_meta.json").read_text(encoding="utf-8"))
        self.pipeline = joblib.load(d / "model.joblib")
        self.calibrator = joblib.load(d / "calibrator.joblib")
        self.ood = joblib.load(d / "ood.joblib")
        self.conformal = json.loads((d / "conformal.json").read_text())
        self.background = pd.DataFrame(json.loads((d / "shap_background.json").read_text()),
                                       columns=list(FEATURES))
        self.t_mod = self.meta["thresholds"]["t_mod"]
        self.t_high = self.meta["thresholds"]["t_high"]

    @staticmethod
    def _frame(X) -> pd.DataFrame:
        X = pd.DataFrame(X)
        missing = [f for f in FEATURES if f not in X.columns]
        if missing:
            raise ValueError(f"missing features: {missing}")
        X = X[list(FEATURES)]
        if X.isna().any().any():
            raise ValueError("missing values are not allowed")
        return X

    def predict(self, X) -> dict:
        X = self._frame(X)
        p_raw = self.pipeline.predict_proba(X)[:, 1]
        p = self.calibrator.predict(p_raw)
        abst_conf = conformal.abstains(p, self.conformal)
        is_ood = ood.is_ood(self.ood, X)
        return {
            "p": p,
            "band": bands.assign(p, self.t_mod, self.t_high),
            "abstain_conformal": abst_conf,
            "ood": is_ood,
            "abstain": abst_conf | is_ood,
        }

    @cached_property
    def explainer(self):
        return explain.make_explainer(self.pipeline, self.background)

    def shap(self, X) -> np.ndarray:
        return explain.shap_values(self.explainer, self.pipeline, self._frame(X))
