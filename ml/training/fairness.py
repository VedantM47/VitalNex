"""Subgroup audit on the test set with fairlearn MetricFrame (SPEC §4.7).

Reports gaps only. No claim of compliance with any rule is made.
"""
import numpy as np
import pandas as pd
from fairlearn.metrics import MetricFrame, false_positive_rate
from sklearn.metrics import precision_score, recall_score

RECALL_GAP_FLAG = 0.10


def groups(df: pd.DataFrame) -> dict[str, pd.Series]:
    """Sensitive groupings. Income/Education/AnyHealthcare/NoDocbcCost are audit-only columns."""
    return {
        "Sex": df["Sex"].map({0: "female", 1: "male"}),
        "AgeGroup": pd.cut(df["Age"], [0, 4, 8, 13], labels=["18-39", "40-59", "60+"]).astype(str),
        "Income": pd.cut(df["Income"], [0, 4, 6, 8], labels=["low (<$25k)", "mid ($25-50k)",
                                                             "high (>=$50k)"]).astype(str),
        "Education": np.where(df["Education"] <= 4, "high school or less", "more than high school"),
        "AnyHealthcare": df["AnyHealthcare"].map({0: "no coverage", 1: "has coverage"}),
        "NoDocbcCost": df["NoDocbcCost"].map({0: "no cost barrier", 1: "cost barrier"}),
    }


def _mean_pred(y_true, y_pred):
    return float(np.mean(y_pred))


def audit(y: np.ndarray, p: np.ndarray, flagged: np.ndarray, abstain: np.ndarray,
          df: pd.DataFrame) -> dict:
    """flagged = band >= moderate (p >= t_mod). Metrics use all rows; abstention reported alongside."""
    out, flags = {}, []
    for name, g in groups(df).items():
        g = pd.Series(np.asarray(g), name=name)
        cls = MetricFrame(
            metrics={
                "recall": lambda yt, yp: recall_score(yt, yp, zero_division=0),
                "false_positive_rate": false_positive_rate,
                "precision": lambda yt, yp: precision_score(yt, yp, zero_division=0),
            },
            y_true=y, y_pred=flagged.astype(int), sensitive_features=g)
        cal = MetricFrame(metrics={"mean_predicted": _mean_pred, "observed_rate": lambda yt, yp: float(np.mean(yt))},
                          y_true=y, y_pred=p, sensitive_features=g)
        abst = MetricFrame(metrics={"abstention_rate": _mean_pred}, y_true=y,
                           y_pred=abstain.astype(float), sensitive_features=g)
        table = pd.concat([cls.by_group, cal.by_group, abst.by_group], axis=1)
        table["n"] = g.value_counts().reindex(table.index)
        table["positives"] = pd.Series(y).groupby(g).sum().reindex(table.index)
        gaps = {m: {"max_gap": float(table[m].max() - table[m].min()),
                    "ratio_min_over_max": float(table[m].min() / table[m].max()) if table[m].max() > 0 else None}
                for m in ("recall", "false_positive_rate", "precision", "abstention_rate")}
        if gaps["recall"]["max_gap"] > RECALL_GAP_FLAG:
            flags.append(f"{name}: recall gap {gaps['recall']['max_gap']:.3f} > {RECALL_GAP_FLAG}")
        out[name] = {"by_group": {str(k): {c: (None if pd.isna(v) else float(v)) for c, v in row.items()}
                                  for k, row in table.iterrows()},
                     "gaps": gaps}
    return {"definition": "flagged = calibrated p >= t_mod (moderate or high band); test set; "
                          "metrics on all rows, abstention reported separately",
            "groups": out, "flags": flags}
