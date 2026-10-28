"""Final test-set metrics and 500-resample bootstrap CIs (SPEC §4.8)."""
import numpy as np
from sklearn.metrics import brier_score_loss, roc_auc_score

N_BOOT = 500


def metrics(y: np.ndarray, p: np.ndarray, t_mod: float, t_high: float) -> dict:
    flag, high = p >= t_mod, p >= t_high
    return {
        "auroc": float(roc_auc_score(y, p)),
        "brier": float(brier_score_loss(y, p)),
        "recall_at_t_mod": float(flag[y == 1].mean()),
        "precision_at_t_mod": float(y[flag].mean()) if flag.any() else None,
        "recall_at_t_high": float(high[y == 1].mean()),
        "precision_at_t_high": float(y[high].mean()) if high.any() else None,
        "n": int(len(y)),
        "prevalence": float(y.mean()),
    }


def bootstrap_ci(y: np.ndarray, p: np.ndarray, t_mod: float, n_boot: int = N_BOOT,
                 seed: int = 42) -> dict:
    rng = np.random.default_rng(seed)
    vals = {"auroc": [], "recall_at_t_mod": [], "brier": []}
    n = len(y)
    for _ in range(n_boot):
        i = rng.integers(0, n, n)
        yb, pb = y[i], p[i]
        vals["auroc"].append(roc_auc_score(yb, pb))
        vals["recall_at_t_mod"].append((pb[yb == 1] >= t_mod).mean())
        vals["brier"].append(brier_score_loss(yb, pb))
    return {k: [float(np.percentile(v, 2.5)), float(np.percentile(v, 97.5))] for k, v in vals.items()}
