"""P2 data-pipeline tests: column contract, splits, reproducibility."""
import json
import re
from pathlib import Path

import numpy as np
import pandas as pd
import pytest

from ml.data.prepare import PROCESSED, SPLITS_DIR, make_splits, validate
from ml.training.features import (
    ALL_COLUMNS, DISEASES, FAIRNESS_ONLY, FEATURES, TARGETS, age_to_band,
)

ROOT = Path(__file__).resolve().parents[2]
needs_data = pytest.mark.skipif(not PROCESSED.exists(), reason="run python -m ml.data.prepare")


def test_feature_contract_matches_spec():
    spec = (ROOT / "docs" / "SPEC.md").read_text(encoding="utf-8")
    section = spec.split("### 3.3")[1].split("### 3.4")[0]
    table = section.split("Optional separate symptom")[0]
    spec_features = re.findall(r"^\| `(\w+)` \|", table, flags=re.M)
    assert tuple(spec_features) == FEATURES
    assert len(FEATURES) == 14


def test_no_target_or_fairness_column_in_features():
    assert not set(TARGETS.values()) & set(FEATURES)
    assert not set(FAIRNESS_ONLY) & set(FEATURES)


def test_validate_rejects_missing_column():
    df = pd.DataFrame({c: [0] for c in ALL_COLUMNS}).assign(Age=1, BMI=25, GenHlth=3)
    validate(df)
    with pytest.raises(ValueError, match="Column mismatch"):
        validate(df.drop(columns=["Stroke"]))
    with pytest.raises(ValueError, match="outside"):
        validate(df.assign(GenHlth=9))


def _y(n=10_000, p=0.04, seed=0):
    return (np.random.default_rng(seed).random(n) < p).astype(int)


def test_splits_disjoint_complete_and_stratified():
    y = _y()
    s = make_splits(y)
    tr, cal, te = set(s["train"]), set(s["cal"]), set(s["test"])
    assert not (tr & cal or tr & te or cal & te)
    assert tr | cal | te == set(range(len(y)))
    assert set(s["cal_a"]) | set(s["cal_b"]) == cal and not set(s["cal_a"]) & set(s["cal_b"])
    assert abs(len(tr) / len(y) - 0.6) < 0.01 and abs(len(te) / len(y) - 0.2) < 0.01
    for k in ("train", "cal", "test", "cal_a", "cal_b"):
        assert abs(y[s[k]].mean() - y.mean()) < 0.005


def test_splits_reproducible():
    y = _y()
    assert make_splits(y) == make_splits(y)
    assert make_splits(y, seed=42) != make_splits(y, seed=7)


def test_age_to_band():
    assert age_to_band(18) == 1 and age_to_band(29) == 2 and age_to_band(79) == 12
    assert age_to_band(80) == 13 and age_to_band(120) == 13
    with pytest.raises(ValueError):
        age_to_band(17)


@needs_data
@pytest.mark.parametrize("disease", DISEASES)
def test_saved_splits_match_data(disease):
    df = pd.read_parquet(PROCESSED)
    s = json.loads((SPLITS_DIR / f"{disease}.json").read_text())
    assert s["target"] == TARGETS[disease]
    assert len(s["train"]) + len(s["cal"]) + len(s["test"]) == len(df)
    assert make_splits(df[TARGETS[disease]].to_numpy()) == {
        k: s[k] for k in ("train", "cal", "cal_a", "cal_b", "test")}
