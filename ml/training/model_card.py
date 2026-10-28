"""Render model_card.md from model_meta.json (Mitchell et al. 2019 structure).

Run: python -m ml.training.model_card   (re-renders all cards from saved metadata)
Every number in the card comes from model_meta.json.
"""
import json
import shutil
import sys

from ml.data.download import ROOT
from ml.predictor import ARTIFACTS
from ml.training.features import DISEASES

DOCS = ROOT / "docs" / "model_cards"
LABELS = {
    "diabetes": "diabetes or prediabetes (BRFSS: ever told by a doctor)",
    "heart": "coronary heart disease or heart attack (BRFSS: ever reported)",
    "stroke": "stroke (BRFSS: ever told)",
}
NAMES = {"logreg": "Logistic Regression", "lightgbm": "LightGBM", "mlp": "PyTorch MLP"}


def _f(v, nd=3):
    return "—" if v is None else f"{v:.{nd}f}"


def _pct(v):
    return "—" if v is None else f"{v:.1%}"


def render(m: dict) -> str:
    d, th, t = m["disease"], m["thresholds"], m["test_metrics"]
    ci = t["ci95"]
    comp = "\n".join(
        f"| {NAMES[k]}{' **(chosen)**' if k == m['chosen_model'] else ''} | {_f(r['cv_auroc_train'])} | "
        f"{_f(r['cal_b_auroc'])} | {_f(r['cal_b_brier_raw'], 4)} | {_f(r['cal_b_brier_calibrated'], 4)} | "
        f"{_f(r['test']['auroc'])} | {_f(r['test']['brier'], 4)} | {_f(r['test']['recall_at_t_mod'])} | "
        f"{r['fit_seconds']} | `{json.dumps(r['best_params'])}` |"
        for k, r in m["comparison"].items())
    band_rows = "\n".join(
        f"| {name} | {_pct(m['bands_cal_b'][name]['share'])} | {_pct(b['share'])} | "
        f"{_pct(b['observed_rate'])} | {_pct(b['share_of_true_cases'])} |"
        for name, b in m["bands_test"].items())
    ct = m["conformal_test"]
    shap_rows = "\n".join(f"| {i} | `{f}` | {v:.4f} |"
                          for i, (f, v) in enumerate(m["shap"]["global_mean_abs"].items(), 1))
    fair_sections = []
    for g, info in m["fairness"]["groups"].items():
        rows = "\n".join(
            f"| {k} | {int(r['n']):,} | {int(r['positives']):,} | {_f(r['recall'])} | "
            f"{_f(r['false_positive_rate'])} | {_f(r['precision'])} | {_f(r['mean_predicted'])} | "
            f"{_f(r['observed_rate'])} | {_pct(r['abstention_rate'])} |"
            for k, r in info["by_group"].items())
        gp = info["gaps"]
        fair_sections.append(
            f"**{g}** — max gap: recall {_f(gp['recall']['max_gap'])}, FPR "
            f"{_f(gp['false_positive_rate']['max_gap'])}, precision {_f(gp['precision']['max_gap'])}, "
            f"abstention {_f(gp['abstention_rate']['max_gap'])}\n\n"
            "| Group | n | positives | recall | FPR | precision | mean predicted | observed | abstention |\n"
            "|---|---|---|---|---|---|---|---|---|\n" + rows)
    flags = "\n".join(f"- {f}" for f in m["flags"]) or "- none"
    dd = m["test_metrics_deduplicated"]
    cal = m["calibration"]

    return f"""# Model card — {d} ({m['version']})

*Generated from `ml/artifacts/{d}/model_meta.json` by `ml/training/model_card.py`. Do not edit by hand.*

## Model details

- Version `{m['version']}`, created {m['created_at']}. Data hash `{m['data_hash'][:16]}…`.
- Production model: **{NAMES[m['chosen_model']]}** with isotonic calibration. Selection: {m['chosen_reason']}.
- Rule: {m['selection_rule']}.
- Inputs: the 14 self-reported answers in SPEC §3.3 ({', '.join(m['features'])}).
- Output: a calibrated probability turned into a screening band (low / moderate / high), plus an
  abstention decision (conformal prediction set and out-of-distribution check).
- Libraries: {', '.join(f'{k} {v}' for k, v in m['libraries'].items())}.

## Intended use

Screening and care navigation in the VITALNEX MVP: show how similar a person's answers are to people
in a US survey who reported {LABELS[d]}, explain the main contributing answers, and route to a next-step
category. High and uncertain results go to clinician review. Users are dummy accounts (MVP).

## Out-of-scope use

- Diagnosis, or ruling a condition in or out. The label is "ever told", not a clinical test.
- Predicting future (e.g. 10-year) risk — the data is cross-sectional.
- Choosing, naming or dosing medicines.
- Use on people under 18, or as validated for Indian populations (it is not).
- Any automatic decision without the safety rules and clinician review around it.

## Factors

Audited groups (test set): sex, age group (18–39 / 40–59 / 60+), income, education, healthcare
coverage, cost barrier to seeing a doctor. Income, education, coverage and cost barrier are audit-only
columns: never model inputs and never asked in the app.

## Metrics

- Discrimination: AUROC. Calibration: Brier score, expected calibration error (10 bins).
- Screening: recall at t_mod (share of true cases flagged moderate or high), precision at t_high.
- Uncertainty: 95% bootstrap intervals ({evaluate_n(m)} resamples of the test set).
- Abstention: conformal coverage per class (target 90%) and abstention rate.

## Evaluation data

Test split: {m['split_sizes']['test']:,} rows (20%, stratified, seed 42), used once after model choice.
Prevalence {_pct(t['prevalence'])}.

## Training data

CDC BRFSS 2015 Diabetes Health Indicators (UCI id 891, DOI 10.24432/C53919, Kaggle licence
"CC0: Public Domain"). See `docs/data_card.md`. Train {m['split_sizes']['train']:,} rows (60%);
calibration cal-A {m['split_sizes']['cal_a']:,} (isotonic) and cal-B {m['split_sizes']['cal_b']:,}
(model comparison, thresholds, conformal).

## Quantitative analyses

### Model comparison

| Model | CV AUROC (train) | cal-B AUROC | cal-B Brier raw | cal-B Brier calibrated | test AUROC | test Brier | test recall@t_mod | fit s | best params |
|---|---|---|---|---|---|---|---|---|---|
{comp}

Each model's test recall uses its own t_mod from cal-B. Raw Brier for Logistic Regression and the MLP
is high by design (class weighting); compare calibrated Brier.

### Production model on test

| Metric | Value | 95% CI |
|---|---|---|
| AUROC | {_f(t['auroc'])} | {_f(ci['auroc'][0])}–{_f(ci['auroc'][1])} |
| Brier | {_f(t['brier'], 4)} | {_f(ci['brier'][0], 4)}–{_f(ci['brier'][1], 4)} |
| Recall at t_mod | {_f(t['recall_at_t_mod'])} | {_f(ci['recall_at_t_mod'][0])}–{_f(ci['recall_at_t_mod'][1])} |
| Precision at t_mod | {_f(t['precision_at_t_mod'])} | — |
| Recall at t_high | {_f(t['recall_at_t_high'])} | — |
| Precision at t_high | {_f(t['precision_at_t_high'])} | — |

De-duplicated test set ({dd['rows_removed']:,} duplicate rows removed): AUROC {_f(dd['auroc'])},
recall at t_mod {_f(dd['recall_at_t_mod'])}, Brier {_f(dd['brier'], 4)}.

### Calibration (fitted on cal-A, measured on cal-B)

| | Brier | ECE (10 bins) |
|---|---|---|
| Before | {_f(cal['before']['brier'], 4)} | {_f(cal['before']['ece_10'], 4)} |
| After isotonic | {_f(cal['after']['brier'], 4)} | {_f(cal['after']['ece_10'], 4)} |

![reliability](../../ml/artifacts/{d}/reliability.png)

### Screening bands

t_mod = {th['t_mod']:.4f} (largest threshold with recall ≥ {th['recall_target']:.2f} on cal-B).
t_high = {th['t_high']:.4f} ({th['t_high_method']}; target precision {th['precision_target']:.3f} =
3 × prevalence {th['base_prevalence']:.3f}). These are screening bands, not clinical cut-offs.

| Band | share (cal-B) | share (test) | observed rate in band (test) | share of all true cases (test) |
|---|---|---|---|---|
{band_rows}

### Abstention

Mondrian split conformal, α = {m['conformal']['alpha']} per class on cal-B (q0 = {m['conformal']['q0']:.4f},
q1 = {m['conformal']['q1']:.4f}). OOD: {m['ood']['method']}, threshold = {m['ood']['percentile']:.0f}th
percentile of train scores.

| | Test |
|---|---|
| Coverage, true negatives | {_f(ct['coverage']['class_0'])} |
| Coverage, true positives | {_f(ct['coverage']['class_1'])} |
| Abstained (conformal) | {_pct(ct['abstention_rate_conformal'])} |
| Out-of-distribution | {_pct(ct['ood_rate'])} |
| Abstained (total) | {_pct(ct['abstention_rate_total'])} |
| Abstained among true negatives / positives | {_pct(ct['abstention_rate_by_true_class']['class_0'])} / {_pct(ct['abstention_rate_by_true_class']['class_1'])} |

### Explainability (SHAP, {m['shap']['explainer']})

Mean |SHAP| on {m['shap']['global_rows']}, {m['shap']['output_space']}; background = 200 train rows.

| Rank | Feature | mean abs SHAP |
|---|---|---|
{shap_rows}

![shap](../../ml/artifacts/{d}/shap_global.png)

### Fairness (test set)

{m['fairness']['definition']}. Gaps are reported, not judged against any legal rule.

{chr(10).join(fair_sections)}

## Ethical considerations

- Labels are self-reported diagnoses; people who are undiagnosed count as negatives, so the model
  learns "diagnosed" as much as "has the condition". Groups with less access to care may be
  under-diagnosed and therefore under-flagged.
- Some inputs (general health, difficulty walking, physical health days) may be consequences of the
  condition, so explanations describe associations, not causes or things to fix.
- Results are always shown with "similar to people who have been told they have…" wording, never as
  a diagnosis, and emergency symptoms bypass the model.

## Caveats and recommendations

- US 2014/2015 survey data; not validated on Indian users. Smokeless tobacco and bidis are not captured.
- Survey weights are unavailable, so prevalence and precision are not nationally representative.
- About 20% of true cases fall in the Low band by design (recall target 0.80) — stated openly to users.

### Flags for the team

{flags}
"""


def evaluate_n(m: dict) -> int:
    from ml.training.evaluate import N_BOOT
    return N_BOOT


def write(meta: dict) -> None:
    d = meta["disease"]
    path = ARTIFACTS / d / "model_card.md"
    path.write_text(render(meta), encoding="utf-8")
    DOCS.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(path, DOCS / f"{d}.md")


def main() -> int:
    for d in DISEASES:
        p = ARTIFACTS / d / "model_meta.json"
        if p.exists():
            write(json.loads(p.read_text(encoding="utf-8")))
            print(f"rendered {d}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
