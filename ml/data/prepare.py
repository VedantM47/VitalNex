"""Validate the raw BRFSS file, compute stats, write stratified splits and the prepared parquet.

Run: python -m ml.data.prepare   (after python -m ml.data.download)
Outputs:
  data/processed/brfss2015.parquet (+ .sha256)   git-ignored
  ml/data/splits/<disease>.json                   row indices into the parquet (committed)
  ml/data/stats.json                              numbers used by docs/data_card.md
  docs/figures/eda_*.png
"""
import hashlib
import json
import sys
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split

from ml.data.download import RAW_CSV, ROOT
from ml.training.features import ALL_COLUMNS, DISEASES, FEATURES, RANGES, TARGETS

PROCESSED = ROOT / "data" / "processed" / "brfss2015.parquet"
SPLITS_DIR = ROOT / "ml" / "data" / "splits"
STATS_JSON = ROOT / "ml" / "data" / "stats.json"
FIG_DIR = ROOT / "docs" / "figures"
SEED = 42


def validate(df: pd.DataFrame) -> pd.DataFrame:
    missing = sorted(set(ALL_COLUMNS) - set(df.columns))
    extra = sorted(set(df.columns) - set(ALL_COLUMNS))
    if missing or extra:
        raise ValueError(f"Column mismatch. missing={missing} unexpected={extra}")
    if df.isna().any().any():
        raise ValueError(f"Missing values in: {df.columns[df.isna().any()].tolist()}")
    df = df[list(ALL_COLUMNS)].astype("int64")
    for col, (lo, hi) in RANGES.items():
        bad = ~df[col].between(lo, hi)
        if bad.any():
            raise ValueError(f"{col}: {int(bad.sum())} values outside [{lo}, {hi}]")
    for t in TARGETS.values():
        if not set(df[t].unique()) <= {0, 1}:
            raise ValueError(f"Target {t} is not binary")
    return df


def make_splits(y: np.ndarray, seed: int = SEED) -> dict:
    """Stratified 60/20/20 train/cal/test; cal is further halved into cal_a / cal_b."""
    idx = np.arange(len(y))
    train, rest = train_test_split(idx, test_size=0.4, stratify=y, random_state=seed)
    cal, test = train_test_split(rest, test_size=0.5, stratify=y[rest], random_state=seed)
    cal_a, cal_b = train_test_split(cal, test_size=0.5, stratify=y[cal], random_state=seed)
    return {k: sorted(v.tolist()) for k, v in
            dict(train=train, cal=cal, cal_a=cal_a, cal_b=cal_b, test=test).items()}


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def plots(df: pd.DataFrame) -> list[str]:
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    FIG_DIR.mkdir(parents=True, exist_ok=True)
    out = []

    fig, ax = plt.subplots(figsize=(6, 3.5))
    prev = [df[TARGETS[d]].mean() * 100 for d in DISEASES]
    ax.bar(DISEASES, prev, color="#4C78A8")
    for i, v in enumerate(prev):
        ax.text(i, v + 0.3, f"{v:.1f}%", ha="center")
    ax.set_ylabel("% of respondents (label = 1)")
    ax.set_title("Prevalence of each label (BRFSS 2015, unweighted)")
    out.append(_save(fig, "eda_prevalence.png"))

    fig, ax = plt.subplots(figsize=(7, 3.5))
    for d in DISEASES:
        ax.plot(range(1, 14), df.groupby("Age")[TARGETS[d]].mean() * 100, marker="o", label=d)
    ax.set_xlabel("BRFSS age band (1 = 18–24 … 13 = 80+)")
    ax.set_ylabel("% label = 1")
    ax.set_title("Label rate by age band")
    ax.legend()
    out.append(_save(fig, "eda_age.png"))

    fig, ax = plt.subplots(figsize=(6, 3.5))
    ax.hist(df["BMI"].clip(upper=60), bins=48, color="#4C78A8")
    ax.set_xlabel("BMI (clipped at 60 for display)")
    ax.set_ylabel("respondents")
    ax.set_title("BMI distribution")
    out.append(_save(fig, "eda_bmi.png"))

    fig, ax = plt.subplots(figsize=(7, 3.5))
    w = 0.27
    for j, d in enumerate(DISEASES):
        rates = df.groupby("GenHlth")[TARGETS[d]].mean() * 100
        ax.bar(rates.index + (j - 1) * w, rates.values, width=w, label=d)
    ax.set_xlabel("General health (1 excellent … 5 poor)")
    ax.set_ylabel("% label = 1")
    ax.set_title("Label rate by self-rated general health")
    ax.legend()
    out.append(_save(fig, "eda_genhlth.png"))
    return out


def _save(fig, name: str) -> str:
    fig.tight_layout()
    fig.savefig(FIG_DIR / name, dpi=110)
    import matplotlib.pyplot as plt
    plt.close(fig)
    return f"docs/figures/{name}"


def main() -> int:
    if not RAW_CSV.exists():
        print(f"Missing {RAW_CSV}. Run: python -m ml.data.download")
        return 1
    df = validate(pd.read_csv(RAW_CSV))

    n = len(df)
    dup_all = int(df.duplicated().sum())
    dup_feat = int(df.duplicated(subset=list(FEATURES)).sum())
    stats = {
        "rows": n,
        "exact_duplicate_rows": dup_all,
        "duplicate_rows_on_14_features": dup_feat,
        "prevalence": {d: round(float(df[TARGETS[d]].mean()), 4) for d in DISEASES},
        "positives": {d: int(df[TARGETS[d]].sum()) for d in DISEASES},
        "label_overlap": {
            "diabetes_and_heart": int((df.Diabetes_binary & df.HeartDiseaseorAttack).sum()),
            "diabetes_and_stroke": int((df.Diabetes_binary & df.Stroke).sum()),
            "heart_and_stroke": int((df.HeartDiseaseorAttack & df.Stroke).sum()),
        },
        "ranges": {c: [int(df[c].min()), int(df[c].max())] for c in df.columns},
        "distributions": {
            c: ({str(k): int(v) for k, v in df[c].value_counts().sort_index().items()}
                if df[c].nunique() <= 31 else
                {q: float(df[c].quantile(float(q))) for q in ("0.01", "0.25", "0.5", "0.75", "0.99")})
            for c in df.columns
        },
        "bmi_over_70": int((df.BMI > 70).sum()),
    }

    PROCESSED.parent.mkdir(parents=True, exist_ok=True)
    df.to_parquet(PROCESSED, index=False)
    stats["data_hash"] = sha256(PROCESSED)
    PROCESSED.with_suffix(".parquet.sha256").write_text(stats["data_hash"] + "\n")

    SPLITS_DIR.mkdir(parents=True, exist_ok=True)
    stats["splits"] = {}
    for d in DISEASES:
        y = df[TARGETS[d]].to_numpy()
        s = make_splits(y)
        payload = {"disease": d, "target": TARGETS[d], "seed": SEED,
                   "data_hash": stats["data_hash"], **s}
        (SPLITS_DIR / f"{d}.json").write_text(json.dumps(payload, separators=(",", ":")))
        stats["splits"][d] = {k: {"n": len(v), "prevalence": round(float(y[v].mean()), 4)}
                              for k, v in s.items()}

    stats["figures"] = plots(df)
    STATS_JSON.write_text(json.dumps(stats, indent=2))

    print(f"rows: {n:,}   exact duplicates: {dup_all:,} ({dup_all / n:.1%})"
          f"   duplicates on 14 features: {dup_feat:,}")
    for d in DISEASES:
        print(f"  {d:9s} prevalence {stats['prevalence'][d]:.2%}  positives {stats['positives'][d]:,}")
    print(f"data_hash: {stats['data_hash']}")
    print(f"BMI > 70: {stats['bmi_over_70']:,}")
    for c in df.columns:
        print(f"  {c:20s} {stats['ranges'][c]}  {stats['distributions'][c]}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
