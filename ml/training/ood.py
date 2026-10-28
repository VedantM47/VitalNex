"""Out-of-distribution check: IsolationForest on train inputs, 99th-percentile threshold (SPEC §4.4)."""
import numpy as np
from sklearn.ensemble import IsolationForest

PERCENTILE = 99.0


def fit(X_train, seed: int = 42) -> dict:
    X_train = np.asarray(X_train, dtype=np.float32)
    iso = IsolationForest(n_estimators=200, random_state=seed).fit(X_train)
    scores = -iso.score_samples(X_train)
    return {"model": iso, "threshold": float(np.percentile(scores, PERCENTILE)),
            "percentile": PERCENTILE, "method": "IsolationForest(n_estimators=200)"}


def is_ood(ood: dict, X) -> np.ndarray:
    return -ood["model"].score_samples(np.asarray(X, dtype=np.float32)) > ood["threshold"]
