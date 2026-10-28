"""Class-conditional (Mondrian) split conformal on cal-B, alpha per class (SPEC §4.4).

Nonconformity score: 1 - p_hat(true class), with calibrated p_hat(1) = p, p_hat(0) = 1 - p.
Prediction set {0} or {1} -> answer; {0, 1} or {} -> abstain.
"""
import numpy as np


def fit(p: np.ndarray, y: np.ndarray, alpha: float = 0.10) -> dict:
    out = {"alpha": alpha, "score": "1 - p_hat(true class)", "method": "mondrian split conformal"}
    for c in (0, 1):
        s = (1 - p[y == 1]) if c == 1 else p[y == 0]
        n = len(s)
        level = min(1.0, np.ceil((n + 1) * (1 - alpha)) / n)
        out[f"q{c}"] = float(np.quantile(s, level, method="higher"))
        out[f"n{c}"] = int(n)
    return out


def prediction_sets(p: np.ndarray, conf: dict) -> tuple[np.ndarray, np.ndarray]:
    """Boolean arrays: (set contains 0, set contains 1)."""
    return (p <= conf["q0"]), (1 - p <= conf["q1"])


def abstains(p: np.ndarray, conf: dict) -> np.ndarray:
    has0, has1 = prediction_sets(p, conf)
    return has0 == has1  # both or neither


def coverage(p: np.ndarray, y: np.ndarray, conf: dict) -> dict:
    has0, has1 = prediction_sets(p, conf)
    covered = np.where(y == 1, has1, has0)
    return {"class_0": float(covered[y == 0].mean()), "class_1": float(covered[y == 1].mean()),
            "overall": float(covered.mean())}
