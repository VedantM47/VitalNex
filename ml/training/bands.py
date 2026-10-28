"""Screening bands from calibrated probabilities on cal-B (SPEC §4.3)."""
import numpy as np

BANDS = ("low", "moderate", "high")


def thresholds(p: np.ndarray, y: np.ndarray, min_recall: float = 0.80,
               precision_mult: float = 3.0) -> dict:
    prev = float(y.mean())
    cand = np.unique(p)
    recall = np.array([(p[y == 1] >= t).mean() for t in cand])
    t_mod = float(cand[recall >= min_recall].max())

    target = precision_mult * prev
    t_high, method = None, "smallest threshold with precision >= 3x prevalence"
    for t in cand:  # ascending
        if y[p >= t].mean() >= target:
            t_high = float(t)
            break
    if t_high is None:
        t_high, method = float(np.quantile(p, 0.90)), "top 10% fallback (precision target unreachable)"

    flags = []
    if t_high <= t_mod:
        flags.append(f"t_high ({t_high:.4f}) <= t_mod ({t_mod:.4f})")
    return {"t_mod": t_mod, "t_high": t_high, "t_high_method": method,
            "recall_target": min_recall, "precision_target": target, "base_prevalence": prev,
            "flags": flags}


def assign(p: np.ndarray, t_mod: float, t_high: float) -> np.ndarray:
    """0 = low, 1 = moderate, 2 = high."""
    return np.where(p >= t_high, 2, np.where(p >= t_mod, 1, 0))


def band_stats(p: np.ndarray, y: np.ndarray, t_mod: float, t_high: float) -> dict:
    """Per band: share of people, observed rate (= precision), share of all true cases (= recall)."""
    b = assign(p, t_mod, t_high)
    out = {}
    for i, name in enumerate(BANDS):
        m = b == i
        out[name] = {
            "share": float(m.mean()),
            "n": int(m.sum()),
            "observed_rate": float(y[m].mean()) if m.any() else None,
            "share_of_true_cases": float((m & (y == 1)).sum() / max(1, (y == 1).sum())),
        }
    return out
