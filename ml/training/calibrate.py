"""Isotonic calibration on cal-A; metrics before/after on cal-B (SPEC §4.2)."""
import numpy as np
from sklearn.isotonic import IsotonicRegression
from sklearn.metrics import brier_score_loss


def fit_isotonic(p_raw: np.ndarray, y: np.ndarray) -> IsotonicRegression:
    return IsotonicRegression(out_of_bounds="clip", y_min=0.0, y_max=1.0).fit(p_raw, y)


def ece(p: np.ndarray, y: np.ndarray, bins: int = 10) -> float:
    """Expected calibration error with equal-width bins."""
    idx = np.clip((p * bins).astype(int), 0, bins - 1)
    total = 0.0
    for b in range(bins):
        m = idx == b
        if m.any():
            total += m.mean() * abs(p[m].mean() - y[m].mean())
    return float(total)


def calib_metrics(p: np.ndarray, y: np.ndarray) -> dict:
    return {"brier": float(brier_score_loss(y, p)), "ece_10": ece(p, y)}


def reliability_plot(path, y, p_before, p_after, title: str) -> None:
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    fig, ax = plt.subplots(figsize=(5, 5))
    ax.plot([0, 1], [0, 1], "k--", lw=1, label="perfect")
    for p, label in ((p_before, "before (raw model output)"), (p_after, "after (isotonic)")):
        idx = np.clip((p * 10).astype(int), 0, 9)
        keep = [b for b in range(10) if (idx == b).sum() >= 20]
        ax.plot([p[idx == b].mean() for b in keep], [y[idx == b].mean() for b in keep],
                marker="o", label=label)
    ax.set_xlabel("mean predicted probability")
    ax.set_ylabel("observed rate (cal-B)")
    ax.set_title(title)
    ax.legend()
    fig.tight_layout()
    fig.savefig(path, dpi=110)
    plt.close(fig)
