# VITALNEX — Claims audit (P10)

*2026-10-29. Scope: `apps/api`, `apps/web/src` (incl. `messages/{en,hi,mr}.json`), `ml`, `docs`.
**Not audited here:** `README.md`, `docs/ERAI_REPORT.md`, `docs/DEMO_SCRIPT.md` (being rewritten in
parallel; audit them afterwards).*

Method: grep for metrics and numbers (`AUROC`, `%`, `0.xxx`, `accuracy`, `F1`, `Brier`, `ECE`), method
names (`calibrated`, `isotonic`, `SHAP`, `conformal`, `bootstrap`, `LightGBM`, …) and compliance or
quality words (`compliant`, `certified`, `HIPAA`, `GDPR`, `FDA`, `validated`, `clinically`,
`production-grade`, `reviewed`, `accurate`). For each hit: where the value or claim comes from.
Generated documents were re-rendered from their source data into a temp file and compared
byte-for-byte.

## Result

- **3 claims changed** (rows marked *Fixed*). Nothing else needed removal.
- No compliance or certification claim exists. Every "validated" hit is a negation ("not validated on
  Indian patients").
- The web app shows no hard-coded metric: every number on the Trust Passport, governance and clinician
  pages is read from the API, which reads `ml/artifacts/<d>/model_meta.json`,
  `ml/nlp/artifacts/nlp_meta.json` or the database.

## Table

| Claim | Location | Source | Verdict / action |
|---|---|---|---|
| "Answers come from a fixed, **reviewed** library" (+ "my reviewed library", FAQ `vx_assistant`) | `apps/api/content/assistant.{en,hi,mr}.json` (`disclaimer`, `no_faq_answer`), `apps/api/schemas/assistant.py:46`, `apps/web/src/messages/{en,hi,mr}.json` `assistant.notice`, `ml/nlp/faq.{en,hi,mr}.json` `vx_assistant`, comment in `apps/web/src/app/ai-assistant/page.tsx:12` | The same files say `"_review": "pending"` and "not yet reviewed by a clinician" (D-15) | **Fixed** → "fixed, pre-written library" (HI "पहले से लिखी", MR "आधीच लिहिलेल्या"); `docs/i18n_review_p8.md` rows updated, still `pending`. Put "reviewed" back once the human review is signed off. (`docs/PROMPTS.md` P8 step 6 still quotes the old wording — it is the instruction text, left as is.) |
| "**Production-grade** backend … **clinical** risk prediction"; title "Clinical Intelligence" | `apps/api/main.py:33-36` (OpenAPI title/description), router tag `apps/api/routers/v1/assessment.py:18` | None — the product is an MVP screening aid with demo accounts (CLAUDE.md, SPEC §1) | **Fixed** → "VITALNEX Screening & Care-Navigation API", "MVP backend … demo accounts only, not a diagnostic tool"; tag → "Screening" |
| "**14 questions** you can answer yourself" | `apps/web/src/messages/{en,hi,mr}.json` `landing.f1Body` | The form has 15 answers (`AssessmentInputs`, `apps/api/schemas/assessment.py:17-34`; height and weight become one BMI feature, so 14 model features) | **Fixed** → "15 questions" in all three languages |
| Test AUROC 0.824 / 0.842 / 0.810 with 95% CIs | `docs/ARCHITECTURE_DIAGRAMS.md:106-110`, `docs/PROGRESS.md:66-67`, model cards | `model_meta.json` `test_metrics.auroc`, `.ci95.auroc` (0.8237 [0.8190, 0.8282]; 0.8419 [0.8363, 0.8476]; 0.8098 [0.8013, 0.8185]); 500 resamples `ml/training/evaluate.py:5` | Traces. Stroke upper CI rounds to 0.818 (both docs now say 0.818) |
| Abstention 37% / 39% / 44% | `docs/ARCHITECTURE_DIAGRAMS.md`, `docs/PROGRESS.md`, D-22 | `model_meta.json` `conformal_test.abstention_rate_total` 0.3676 / 0.3850 / 0.4445 | Traces |
| Low band 56–66% of people | D-23, `docs/PROGRESS.md` | `model_meta.json` `bands_test.low.share` 0.563 / 0.648 / 0.659 | Traces |
| "~20% miss rate" | D-23, SPEC §4.3 | Design target (t_mod: recall ≥ 0.80). Measured test recall at t_mod 0.855 / 0.838 / 0.792 | Traces as a target. The UI never shows "20%": `results.sure.missRate` fills `{n}` per disease from `model_meta.json` |
| Age recall gap 18–39: 0.12–0.40 vs 60+: 0.86–0.91 | D-24, Trust Passport `trust.fairness.ageGap` (values filled at runtime) | `model_meta.json` `fairness.groups.AgeGroup.by_group` (18–39: 0.396 / 0.118 / 0.170; 60+: 0.905 / 0.901 / 0.862) | Traces |
| Per-age threshold experiment numbers | `docs/fairness_mitigation.md` | `python -m ml.training.mitigation` re-run into a temp file | Traces (identical output) |
| Data: 253,680 rows, prevalence 13.93% / 9.42% / 4.06%, licence | `docs/data_card.md`, `docs/PROGRESS.md:64` | `ml/data/stats.json` → `python -m ml.data.data_card` re-rendered to temp | Traces (identical output) |
| Splits 60 / 10 / 10 / 20 | `docs/ARCHITECTURE_DIAGRAMS.md:75-78` | `model_meta.json` `split_sizes` 152,208 / 25,368 / 25,368 / 50,736 | Traces |
| Model cards: every number, "isotonic", "SHAP TreeExplainer/LinearExplainer", Brier/ECE before → after | `docs/model_cards/{diabetes,heart,stroke}.md` = `ml/artifacts/<d>/model_card.md` | `ml.training.model_card.render(model_meta.json)` re-rendered | Traces (byte-identical). Isotonic slightly worsened Brier on cal-B for diabetes (+0.0002) and heart (+0.00007) and improved it for stroke (−0.146, logistic regression with balanced weights); the two non-improvements are in `model_meta.json` `flags` and the cards |
| "Calibrated probability" (clinician view, admin) | `apps/web/src/messages/*.json` `doctor.case.probability`, `doctor.case.historyIntro` | `ml/predictor.py:48` applies the saved isotonic calibrator (`ml/training/calibrate.py`) to every prediction | Traces — calibration runs |
| "SHAP" factors / global SHAP plot | `messages` `doctor.case.factors`, `trust.models.shap`; `apps/api/routers/v1/doctors.py:162` | `ml/predictor.py:63` (per prediction), `model_meta.json` `shap` (explainer, 200 background rows), `shap_global.png` | Traces — SHAP runs |
| "Conformal set", coverage per class | clinician view, Trust Passport, principle map | `apps/api/services/screening.py:130-138`, `conformal.json`, `model_meta.json` `conformal_test.coverage` (≈0.90–0.93 per class) | Traces; `tests/ml/test_models.py::test_conformal_coverage_on_test` |
| Assistant accuracy / macro-F1 per language, emergency hold-out 29/30 (D-25) and 30/30 with current rules | `docs/model_cards/assistant.md`, D-25, `docs/PROGRESS.md:70`, Trust Passport language parity table | `ml/nlp/artifacts/nlp_meta.json` (`per_language`, `emergency_holdout.pipeline` 0.9667 = 29/30, `emergency_holdout_current_rules.pipeline` 1.0) | Traces (assistant card re-rendered from `nlp_meta.json`: identical) |
| Encoder `l3cube-pune/indic-sentence-bert-nli`, CC-BY-4.0, ~40 ms/message on CPU | assistant card, FAQ `vx_assistant` | `nlp_meta.json` `encoder` (licence, revision, `encode_ms_per_message_cpu_median` 39.7) | Traces |
| "Not validated on Indian patients" | `messages` `landing.not3`, `trust.what.items.validated_on_indian_patients`, model/data cards | Negation; true (trained on US BRFSS 2015) | OK |
| "not compliant" / four-fifths | none in scope | SPEC §4.7 forbids claiming four-fifths compliance | No hit — OK |
| HIPAA, GDPR, FDA, certified, clinically validated | none in scope | — | No hit — OK |
| WHO 150 min/week activity; 400 g fruit & veg; < 5 g salt | `apps/api/content/guidance.*.json`, `ml/nlp/faq.*.json` | Each entry carries a WHO fact-sheet `source_url` | Traces to cited document |
| BMI cut-offs 23 / 27.5 (Asian-Indian) | `guidance.*.json`, `messages` `assess.bmi.*`, `screening.py:27` | WHO Expert Consultation, Lancet 2004 (doi 10.1016/S0140-6736(03)15268-3) cited in `guidance.en.json` | Traces to cited document |
| "100 cigarettes", "14 / 7 drinks a week", "past 30 days" | assessment question texts | BRFSS question definitions (`docs/data_card.md`) | Traces |
| "See a doctor soon (within 2 weeks)" | `messages` `results.nextStep.see_doctor_soon.title` | SPEC §1.4 next-step rule (deterministic, not a model output) | Traces to spec rule |
| BMI 12–70 data-quality range; recourse limits (weight −10%) | `messages`, `screening.py:26, 299, 356` | Code constants | Traces to code |
| D-4: Pune "LR AUROC 0.80 ≈ the generator's own score 0.825" | `docs/DECISIONS.md` D-4 rationale | Pre-development analysis; labels-from-formula is confirmed by `data/synthetic/Pune_Clinical_Risk_Dataset_Provenance.txt:22`, but **no script in the repo reproduces 0.80 / 0.825** | Not traceable in the repo. Internal rationale only, never shown in the UI. Left in the team-owned decision log; **team to confirm or drop the numbers** |
| Example responses (probabilities, SHAP values) | `docs/api_examples.md` | Generated from the real models; example (a) re-run: heart p 0.0015, stroke 0.0024, SHAP −0.7786 match | Traces |
| `docs/AUDIT.md` mentions of "COMPLIANT", Platt, SHAP | P0 audit of the original repo | Describes claims that were removed (D-16) | Historical — OK |

## Re-run

`grep -rniE "compliant|certified|HIPAA|clinically|validated|production-grade|reviewed library" apps/api apps/web/src ml docs`
should only return the negations and historical rows above.
