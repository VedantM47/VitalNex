"""SHAP explanations for the production model (SPEC §4.5).

Values are in the model's raw output space (log-odds / logit), before isotonic calibration.
"""
import numpy as np
import shap
import torch
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline

from ml.training.features import FEATURES
from ml.training.models import LGBMEarlyStop, TorchMLP


def _pre(pipeline: Pipeline, X) -> np.ndarray:
    return np.asarray(pipeline[:-1].transform(X), dtype=np.float32)


def make_explainer(pipeline: Pipeline, background):
    clf = pipeline[-1]
    Xb = _pre(pipeline, background)
    if isinstance(clf, LGBMEarlyStop):
        return shap.TreeExplainer(clf.model_)
    if isinstance(clf, LogisticRegression):
        return shap.LinearExplainer(clf, Xb)
    if isinstance(clf, TorchMLP):
        return shap.GradientExplainer(clf.net_, torch.from_numpy(Xb))
    raise TypeError(f"no explainer for {type(clf).__name__}")


def explainer_name(explainer) -> str:
    return type(explainer).__name__


def shap_values(explainer, pipeline: Pipeline, X) -> np.ndarray:
    """(n_rows, 14) SHAP values, one per feature."""
    Xt = _pre(pipeline, X)
    if isinstance(explainer, shap.GradientExplainer):
        sv = explainer.shap_values(torch.from_numpy(Xt))
    else:
        sv = explainer.shap_values(Xt)
    if isinstance(sv, list):
        sv = sv[-1]
    sv = np.asarray(sv)
    if sv.ndim == 3:
        sv = sv[..., -1]
    return sv.reshape(len(Xt), len(FEATURES))


def top_factors(values: np.ndarray, k: int = 3) -> dict:
    """Top-k features raising and lowering the score for one row."""
    order = np.argsort(values)
    up = [{"feature": FEATURES[i], "shap": float(values[i])} for i in order[::-1][:k] if values[i] > 0]
    down = [{"feature": FEATURES[i], "shap": float(values[i])} for i in order[:k] if values[i] < 0]
    return {"raises": up, "lowers": down}


def global_importance(sv: np.ndarray) -> dict:
    imp = np.abs(sv).mean(axis=0)
    return dict(sorted(((f, float(v)) for f, v in zip(FEATURES, imp)), key=lambda kv: -kv[1]))


def global_plot(path, importance: dict, title: str) -> None:
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    names, vals = list(importance)[::-1], list(importance.values())[::-1]
    fig, ax = plt.subplots(figsize=(6, 5))
    ax.barh(names, vals, color="#4C78A8")
    ax.set_xlabel("mean |SHAP value| (model output, log-odds scale)")
    ax.set_title(title)
    fig.tight_layout()
    fig.savefig(path, dpi=110)
    plt.close(fig)
