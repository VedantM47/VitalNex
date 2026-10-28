"""Train, compare, calibrate, band, conformalise, explain and audit all three diseases (SPEC §4).

Run: python -m ml.training.train_all [disease ...]
The test split is used only in the final evaluation step, after the model choice is fixed.
"""
import json
import sys
import time
from datetime import datetime, timezone

import fairlearn
import joblib
import lightgbm
import numpy as np
import pandas as pd
import shap
import sklearn
import torch
from sklearn.metrics import brier_score_loss, roc_auc_score
from sklearn.model_selection import GridSearchCV, StratifiedKFold

from ml.data.prepare import PROCESSED, SPLITS_DIR, sha256
from ml.predictor import ARTIFACTS, DiseaseModel
from ml.training import bands, calibrate, conformal, evaluate, explain, fairness, model_card, ood
from ml.training.features import DISEASES, FAIRNESS_ONLY, FEATURES, TARGETS
from ml.training.models import SEED, SIMPLICITY, candidates, fit_index, raw_proba, strip_fit_index

VERSION = "1.0.0"
AUROC_TOLERANCE = 0.005
MAX_BAND_SHARE = 0.50
MAX_ABSTENTION = 0.30
COVERAGE_TOL = 0.03


def select(results: dict) -> tuple[str, str]:
    """SPEC §4.1: highest cal-B AUROC, unless another model is within 0.005 AUROC with a better
    (calibrated) Brier score — then prefer the better-calibrated / simpler one."""
    best = max(results, key=lambda m: results[m]["cal_b_auroc"])
    best_auc = results[best]["cal_b_auroc"]
    close = [m for m in results if best_auc - results[m]["cal_b_auroc"] <= AUROC_TOLERANCE]
    pick = min(close, key=lambda m: (round(results[m]["cal_b_brier_calibrated"], 4), SIMPLICITY.index(m)))
    if pick == best:
        reason = f"highest cal-B AUROC ({best_auc:.4f})"
    else:
        reason = (f"within {AUROC_TOLERANCE} AUROC of {best} ({results[pick]['cal_b_auroc']:.4f} vs "
                  f"{best_auc:.4f}) with better or equal calibrated Brier "
                  f"({results[pick]['cal_b_brier_calibrated']:.4f} vs {results[best]['cal_b_brier_calibrated']:.4f})")
    return pick, reason


def training_curves(path, history: dict, title: str) -> None:
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    ep = range(1, len(history["train_loss"]) + 1)
    fig, (a, b) = plt.subplots(1, 2, figsize=(9, 3.5))
    a.plot(ep, history["train_loss"], label="train")
    a.plot(ep, history["val_loss"], label="inner val")
    a.set_xlabel("epoch"), a.set_ylabel("BCE loss (pos_weight)"), a.legend()
    b.plot(ep, history["val_auroc"], color="C2")
    b.set_xlabel("epoch"), b.set_ylabel("inner val AUROC")
    fig.suptitle(title)
    fig.tight_layout()
    fig.savefig(path, dpi=110)
    plt.close(fig)


def run(disease: str, df: pd.DataFrame, data_hash: str) -> dict:
    t_start = time.time()
    out_dir = ARTIFACTS / disease
    out_dir.mkdir(parents=True, exist_ok=True)
    target = TARGETS[disease]
    split = json.loads((SPLITS_DIR / f"{disease}.json").read_text())
    assert split["data_hash"] == data_hash, "splits were made from a different data file"
    X, y = df[list(FEATURES)], df[target].to_numpy()
    idx = {k: np.asarray(split[k]) for k in ("train", "cal_a", "cal_b", "test")}
    Xs = {k: X.iloc[v] for k, v in idx.items()}
    ys = {k: y[v] for k, v in idx.items()}
    forbidden = set(idx["cal_a"]) | set(idx["cal_b"]) | set(idx["test"])

    # 1. Fit candidates on train (3-fold CV grid), calibrate on cal-A, compare on cal-B.
    fitted, results = {}, {}
    for name, (pipe, grid) in candidates().items():
        t0 = time.time()
        gs = GridSearchCV(pipe, grid, scoring="roc_auc", refit=True, n_jobs=1,
                          cv=StratifiedKFold(3, shuffle=True, random_state=SEED))
        gs.fit(Xs["train"], ys["train"])
        model = gs.best_estimator_
        seen = set(fit_index(model).tolist())
        assert seen == set(idx["train"].tolist()) and not seen & forbidden, "pipeline saw non-train rows"
        iso = calibrate.fit_isotonic(raw_proba(model, Xs["cal_a"]), ys["cal_a"])
        pb_raw = raw_proba(model, Xs["cal_b"])
        pb = iso.predict(pb_raw)
        th = bands.thresholds(pb, ys["cal_b"])
        fitted[name] = (model, iso, th)
        results[name] = {
            "best_params": {k.replace("clf__", ""): v for k, v in gs.best_params_.items()},
            "cv_auroc_train": float(gs.best_score_),
            "cal_b_auroc": float(roc_auc_score(ys["cal_b"], pb_raw)),
            "cal_b_brier_raw": float(brier_score_loss(ys["cal_b"], pb_raw)),
            "cal_b_brier_calibrated": float(brier_score_loss(ys["cal_b"], pb)),
            "fit_seconds": round(time.time() - t0, 1),
        }
        clf = model[-1]
        if name == "mlp":
            results[name]["best_epoch"] = clf.best_epoch_
            training_curves(out_dir / "training_curves.png", clf.history_, f"{disease}: MLP training")
        if name == "lightgbm":
            results[name]["best_iteration"] = clf.best_iteration_
        print(f"  [{disease}] {name:8s} cal-B AUROC {results[name]['cal_b_auroc']:.4f} "
              f"Brier(cal) {results[name]['cal_b_brier_calibrated']:.4f}  {results[name]['fit_seconds']}s")

    chosen, reason = select(results)
    model, iso, th = fitted[chosen]
    print(f"  [{disease}] chosen: {chosen} — {reason}")

    # 2. Calibration report, conformal, OOD on the chosen model (cal-A / cal-B / train only).
    pb_raw = raw_proba(model, Xs["cal_b"])
    pb = iso.predict(pb_raw)
    calib = {"fitted_on": "cal_a", "evaluated_on": "cal_b",
             "before": calibrate.calib_metrics(pb_raw, ys["cal_b"]),
             "after": calibrate.calib_metrics(pb, ys["cal_b"])}
    calibrate.reliability_plot(out_dir / "reliability.png", ys["cal_b"], pb_raw, pb,
                               f"{disease}: reliability on cal-B ({chosen})")
    conf = conformal.fit(pb, ys["cal_b"], alpha=0.10)
    ood_det = ood.fit(Xs["train"])

    rng = np.random.default_rng(SEED)
    background = Xs["train"].iloc[rng.choice(len(idx["train"]), 200, replace=False)]
    explainer = explain.make_explainer(model, background)
    shap_rows = Xs["cal_b"].iloc[rng.choice(len(idx["cal_b"]), 2000, replace=False)]
    shap_global = explain.global_importance(explain.shap_values(explainer, model, shap_rows))
    explain.global_plot(out_dir / "shap_global.png", shap_global, f"{disease}: global SHAP ({chosen})")

    joblib.dump(strip_fit_index(model), out_dir / "model.joblib")
    joblib.dump(iso, out_dir / "calibrator.joblib")
    joblib.dump(ood_det, out_dir / "ood.joblib")
    (out_dir / "conformal.json").write_text(json.dumps(conf, indent=2))
    (out_dir / "shap_background.json").write_text(json.dumps(background.to_numpy().tolist()))

    meta = {
        "disease": disease,
        "version": f"{disease}-v{VERSION}",
        "created_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "data_hash": data_hash,
        "data_file": "data/processed/brfss2015.parquet",
        "target": target,
        "features": list(FEATURES),
        "fairness_only_columns": list(FAIRNESS_ONLY),
        "split_sizes": {k: int(len(v)) for k, v in idx.items()},
        "libraries": {"python": sys.version.split()[0], "scikit-learn": sklearn.__version__,
                      "lightgbm": lightgbm.__version__, "torch": torch.__version__,
                      "shap": shap.__version__, "fairlearn": fairlearn.__version__,
                      "numpy": np.__version__, "pandas": pd.__version__},
        "comparison": results,
        "selection_rule": "highest cal-B AUROC unless another model is within 0.005 AUROC and has a "
                          "better calibrated Brier score; ties go to the simpler model",
        "chosen_model": chosen,
        "chosen_reason": reason,
        "calibration": calib,
        "thresholds": {k: th[k] for k in ("t_mod", "t_high", "t_high_method", "recall_target",
                                          "precision_target", "base_prevalence")},
        "bands_cal_b": bands.band_stats(pb, ys["cal_b"], th["t_mod"], th["t_high"]),
        "conformal": conf,
        "ood": {k: ood_det[k] for k in ("method", "percentile", "threshold")},
        "shap": {"explainer": explain.explainer_name(explainer), "background_rows": 200,
                 "global_rows": "2000 random cal-B rows", "output_space": "raw model output (log-odds)",
                 "global_mean_abs": shap_global},
        "artifact_files": ["model.joblib", "calibrator.joblib", "ood.joblib", "conformal.json",
                           "shap_background.json", "model_meta.json", "reliability.png",
                           "shap_global.png", "training_curves.png", "model_card.md"],
    }
    (out_dir / "model_meta.json").write_text(json.dumps(meta, indent=2), encoding="utf-8")

    # 3. Final evaluation on test — through the saved artifacts, exactly as the API will load them.
    dm = DiseaseModel(disease)
    yt, Xt = ys["test"], Xs["test"]
    pred = dm.predict(Xt)
    p = pred["p"]
    test = evaluate.metrics(yt, p, th["t_mod"], th["t_high"])
    test["ci95"] = evaluate.bootstrap_ci(yt, p, th["t_mod"])
    dedup_mask = ~df.iloc[idx["test"]][[*FEATURES, target]].duplicated().to_numpy()
    test_dedup = evaluate.metrics(yt[dedup_mask], p[dedup_mask], th["t_mod"], th["t_high"])

    for name, (m, cal, mth) in fitted.items():
        pt = cal.predict(raw_proba(m, Xt))
        results[name]["test"] = {k: v for k, v in
                                 evaluate.metrics(yt, pt, mth["t_mod"], mth["t_high"]).items()
                                 if k in ("auroc", "brier", "recall_at_t_mod", "precision_at_t_high")}
        results[name]["test"]["t_mod_own"] = mth["t_mod"]

    abstain = pred["abstain"]
    cov = conformal.coverage(p, yt, conf)
    sens = df.iloc[idx["test"]].reset_index(drop=True)
    fair = fairness.audit(yt, p, p >= th["t_mod"], abstain, sens)
    band_test = bands.band_stats(p, yt, th["t_mod"], th["t_high"])

    flags = list(th["flags"])
    for name, b in band_test.items():
        if b["share"] > MAX_BAND_SHARE:
            flags.append(f"band '{name}' holds {b['share']:.1%} of test people (> 50%)")
    if abstain.mean() > MAX_ABSTENTION:
        flags.append(f"abstention {abstain.mean():.1%} on test (> 30%)")
    for c in ("class_0", "class_1"):
        if abs(cov[c] - 0.90) > COVERAGE_TOL:
            flags.append(f"conformal coverage {c} = {cov[c]:.3f}, outside 0.90 ± {COVERAGE_TOL}")
    if calib["after"]["brier"] > calib["before"]["brier"]:
        flags.append("isotonic calibration did not improve Brier on cal-B")
    flags += fair["flags"]

    meta.update({
        "comparison": results,
        "test_metrics": test,
        "test_metrics_deduplicated": {**test_dedup, "rows_removed": int((~dedup_mask).sum())},
        "bands_test": band_test,
        "conformal_test": {"coverage": cov,
                           "abstention_rate_conformal": float(pred["abstain_conformal"].mean()),
                           "ood_rate": float(pred["ood"].mean()),
                           "abstention_rate_total": float(abstain.mean()),
                           "abstention_rate_by_true_class": {
                               "class_0": float(abstain[yt == 0].mean()),
                               "class_1": float(abstain[yt == 1].mean())}},
        "fairness": fair,
        "flags": flags,
        "train_seconds_total": round(time.time() - t_start, 1),
    })
    (out_dir / "model_meta.json").write_text(json.dumps(meta, indent=2), encoding="utf-8")
    model_card.write(meta)
    print(f"  [{disease}] done in {meta['train_seconds_total']}s; flags: {flags or 'none'}")
    return meta


def main(argv: list[str]) -> int:
    diseases = argv or list(DISEASES)
    df = pd.read_parquet(PROCESSED)
    data_hash = sha256(PROCESSED)
    for d in diseases:
        print(f"== {d} ==")
        run(d, df, data_hash)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
