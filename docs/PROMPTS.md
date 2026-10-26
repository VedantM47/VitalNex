# VITALNEX — Claude Code Build Prompts (MVP, 2–3 working days)

## How to use this file

1. Do the **Before you start** steps once.
2. Open Claude Code in the repo root. Paste **one phase prompt at a time**, in order.
3. Wait for the phase report. Check the "You check" list. Only then paste the next phase.
4. If Claude Code stops and asks a question, answer it — that is intended. If you change a
   decision, edit `docs/DECISIONS.md` first, then tell Claude Code.
5. Phases marked ⛔ have a **human sign-off gate**: read the report and reply "approved" (or what to
   change) before moving on.

Suggested schedule (cut-lines in §"If you run out of time"):

| Day | Phases |
|---|---|
| Day 1 | P0 Cleanup · P1 Supabase & auth · P2 Data ⛔ · P3 Models ⛔ |
| Day 2 | P4 Prediction API · P5 Assessment UI · P6 Clinician & governance · P7 Trust Passport, consent, QR |
| Day 3 | P8 Assistant NLP ⛔ · P9 Reports, i18n, care-connect · P10 Verification & docs |

---

## Before you start (you, ~20 minutes)

1. **Supabase project**
   - Sign up at supabase.com → **New project** (free tier). Region: **Mumbai (ap-south-1)** —
     keeps demo data in India. Save the database password somewhere safe.
   - Project Settings → **API**: copy the Project URL, the **publishable / anon** key and the
     **secret / service_role** key.
   - Project Settings → **Database**: copy the connection string (URI).
   - (Optional, lets Claude Code run migrations for you) Account → **Access Tokens** → create one.
2. **Copy the spec pack into the repo root**: `CLAUDE.md`, `docs/SPEC.md`, `docs/DECISIONS.md`,
   `docs/PROMPTS.md`.
3. Create `.env` from `.env.example` and fill in the Supabase values. Add
   `DEMO_PASSWORD=<choose one>` and `SUPABASE_ACCESS_TOKEN=<optional>`. Never commit `.env`.
4. Make sure you have Python 3.11+, Node 20+, git, and ~3 GB free disk (PyTorch CPU + the
   encoder model).

---

## P0 — Repo cleanup and honesty pass

```
Read CLAUDE.md, docs/SPEC.md and docs/DECISIONS.md completely before doing anything.

You are starting the renovation of this repo into the VITALNEX MVP. This phase is cleanup only —
no new features.

1. Create and switch to branch `renovate/mvp`.
2. Produce `docs/AUDIT.md`: a table of every file in apps/, ml/, supabase/, tests/ with one of
   Keep / Fix / Rebuild / Remove, and why. Use SPEC §1.2 for which features stay. Then STOP and
   show me the table summary (counts + the Remove list) and wait for my "go".
3. After my go:
   a. Remove the Jev/TypeSafe integration entirely (apps/api/services/jev_service.py and every
      import/call; replace its intent role with a TODO pointing to Phase 8, and its review-routing
      role with the existing deterministic review gate).
   b. Remove every unverified claim from code, UI strings and README: "Calibrated (Platt
      Isotonic)", "TreeSHAP" where SHAP did not run, "11 Dimensions", "four-fifths compliant",
      "WHO compliant", hardcoded scores / confidence intervals / demo assessments in
      prediction_service.py, and the hardcoded test values (cp, fbs, restecg, exang, oldpeak,
      slope, ca, thal) in apps/web/src/app/risk-assessment/page.tsx. Where a page then has no
      data, show an honest empty state ("No assessment yet") — never placeholder numbers.
   c. Freeze (do not delete yet) the pages listed as frozen in SPEC §1.2: hide them from the
      Sidebar and add a route guard that shows "Not in MVP". List them in docs/AUDIT.md.
   d. Remove the old Pune-trained artifacts in ml/models/ and move the Pune CSVs to
      data/synthetic/ with a README stating: synthetic, demo and stress-test use only (D-4).
      Git-ignore data/raw/ for the real dataset that comes in Phase 2.
   e. Remove scratch/, test_report.pdf, test_verify.pdf from the repo root.
   f. Add missing dependencies to apps/api/requirements.txt (reportlab is used but missing).
      Create ml/requirements.txt (scikit-learn, lightgbm, torch CPU, shap, fairlearn, joblib,
      ucimlrepo, matplotlib, sentence-transformers, qrcode). Pin compatible versions after
      checking they install on Python 3.11+.
   g. Rewrite README.md to describe only what exists after this phase, with a clear
      "Not a diagnostic tool" notice and a "Project status: MVP in progress" line.
4. Make sure the app still starts (API + web) and `python -m pytest tests -v` passes; delete or
   rewrite tests that only tested removed behaviour, and say which.
5. Commit: "P0: cleanup, remove unverified claims and Jev integration".

Report: files removed/changed, tests status, anything that broke, anything you were unsure about.
```

**You check:** the app still opens; the risk page no longer has fake values; README is honest.

---

## P1 — Supabase, real auth and persistence

```
Read CLAUDE.md and SPEC §1.1, §2, §2.1, §2.2, §6 before starting. Use the values in .env.

Goal: replace the localStorage demo login and in-memory stores with Supabase Auth + Postgres + RLS.

1. Review supabase/migrations/20260927000001_initial_schema.sql. Write a NEW migration (do not
   edit the old one) that implements the table changes in SPEC §2.1: changes to
   risk_assessments, and new tables review_queue (or a view), clinician_overrides, share_tokens,
   share_access_log, data_requests, assistant_logs. Map the existing role CHECK constraint so
   'doctor' is the clinician role; keep 'researcher' unused.
2. Write RLS policies exactly as SPEC §2.1 describes (patient: own rows; clinician: only patients
   with an active share_with_clinician consent; admin: aggregates + audit; share tokens via a
   server-side function only). Add a SQL test file (supabase/tests/rls.sql or a pytest using
   role JWTs) that proves patient A cannot read patient B.
3. Apply migrations to my Supabase project. If SUPABASE_ACCESS_TOKEN is set, use the Supabase
   CLI (`supabase link` + `supabase db push`); otherwise print the exact SQL for me to paste into
   the SQL editor and STOP until I confirm.
4. Seed script `supabase/seed/seed_demo.py` (uses the service key, idempotent): creates the
   accounts in SPEC §6 with DEMO_PASSWORD, profiles with roles, 3 synthetic doctors with
   specialisations and appointment slots for the next 14 days, and consents for the demo
   patients (patients 1–4 share with clinicians, 5–6 do not). Demographics for patients from
   data/synthetic (labelled synthetic). Do NOT create any assessments yet (that needs Phase 3
   models).
5. Backend: add JWT verification in apps/api/core (Supabase JWT via JWKS or the project's JWT
   secret — check which this project uses), a `get_current_user` dependency returning id + role,
   and role guards (`require_role("doctor")` etc.). Replace in-memory stores in services with
   Supabase/Postgres access (supabase-py or psycopg — pick one, justify briefly).
6. Frontend: replace lib/auth-context.tsx localStorage logic with Supabase Auth (@supabase/ssr is
   already installed). Login pages for patient/doctor/admin all use the same Supabase sign-in;
   the role comes from `profiles`, never from what the user picked. Protect routes by role.
   Remove signup for doctor/admin (dummy accounts only); keep patient signup.
7. Every sensitive action writes to audit_logs (login, consent change, assessment created,
   override, share created/opened/revoked, data request).
8. Tests: auth required on protected endpoints; role guard works; RLS test passes.
9. Commit: "P1: Supabase auth, persistence, RLS, demo seed".

Report: what was applied, the demo login list (without the password), test results.
```

**You check:** log in as `patient1@vitalnex.demo` and `dr.joshi@vitalnex.demo`; each sees only
their own area.

---

## P2 — Data pipeline ⛔

```
Read CLAUDE.md and SPEC §3 fully.

Goal: get the real BRFSS data, prepare it reproducibly, and write an honest data card.

1. ml/data/download.py: fetch the CDC Diabetes Health Indicators dataset (UCI id 891) with
   `ucimlrepo`. If that fails, print instructions for manual download from the Kaggle page
   (alexteboul/diabetes-health-indicators-dataset, file diabetes_binary_health_indicators_BRFSS2015.csv)
   into data/raw/ and stop. Never commit raw data.
2. ml/data/prepare.py:
   - Verify columns match SPEC §3.3 + the three targets + fairness-only columns. Fail loudly on
     any mismatch.
   - Compute and print: rows, prevalence of each target, exact-duplicate count, value ranges,
     and the distribution of each feature.
   - For each disease create stratified train/cal/test splits (60/20/20, seed 42) and save split
     indices (not copies of data) in ml/data/splits/<disease>.json.
   - Save the prepared parquet to data/processed/ and its SHA-256 hash.
3. Generate docs/data_card.md: source + DOI + licence text exactly as shown on the source page
   (if unclear, say "unclear" and why), collection method (telephone survey, self-reported,
   US 2014–2015), what labels mean ("ever told…"), prevalence, duplicates, feature table from
   SPEC §3.3, fairness-only columns, and every limitation in SPEC §3.3 plus any new one you find.
   Include a short EDA section with 3–4 plots saved to docs/figures/.
4. Tests in tests/ml/test_data.py: column contract, split disjointness, stratification,
   reproducibility (same seed → same indices), no target column in feature list.
5. Commit: "P2: BRFSS data pipeline and data card".

Then STOP. Show me the prevalence table, duplicate count, licence finding and limitations list,
and wait for my approval before Phase 3.
```

**You check (sign-off):** licence is recorded; prevalence numbers look sensible (~14% / ~9% / ~4%);
limitations are honest.

---

## P3 — Model training, calibration, abstention, fairness ⛔

```
Read CLAUDE.md and SPEC §4 fully. Use the splits from Phase 2. Never touch the test split until
the final evaluation step.

Goal: for each disease (diabetes, heart, stroke) train, compare, calibrate, set bands, add
conformal abstention + OOD, explain, audit fairness, and save artifacts + model card.

Structure:
- ml/training/features.py   — feature contract (single source of truth, imported by the API)
- ml/training/models.py     — LR, LightGBM, PyTorch MLP (SPEC §4.1), each as an sklearn-
                              compatible estimator with predict_proba
- ml/training/calibrate.py  — isotonic on cal-A, metrics before/after, reliability plot
- ml/training/bands.py      — t_mod / t_high per SPEC §4.3
- ml/training/conformal.py  — class-conditional split conformal on cal-B (α = 0.10) per SPEC §4.4
- ml/training/ood.py        — OOD detector + 99th-percentile threshold
- ml/training/explain.py    — SHAP (global plot + per-row function)
- ml/training/fairness.py   — fairlearn MetricFrame per SPEC §4.7
- ml/training/evaluate.py   — final test metrics + 500-bootstrap CIs, de-duplicated test check
- ml/training/model_card.py — renders model_card.md from model_meta.json
- ml/training/train_all.py  — runs everything for all 3 diseases

Requirements:
1. All preprocessing inside a Pipeline fitted on train only. Add an assertion test that the
   pipeline never sees cal/test rows during fit.
2. MLP: PyTorch CPU, 14→64→32→1, ReLU, dropout 0.2, BCEWithLogitsLoss with pos_weight, Adam,
   early stopping on an inner validation split of train; save training curves PNG. Set seeds.
3. Small hyperparameter grids, 3-fold CV on train. Keep each disease under ~10 min on CPU; print
   timings.
4. Model selection rule exactly as SPEC §4.1. Save the full comparison table.
5. Bands per SPEC §4.3. If t_high ≤ t_mod, or any band holds > 50% of people, or abstention
   > 30%, do NOT silently retune — record it and tell me.
6. model_meta.json per SPEC §4.9 (include version e.g. heart-v1.0.0, data_hash, created_at,
   library versions).
7. Fairness tables on the test set only. Report gaps; do not claim compliance with any rule.
8. Write docs/model_cards/<disease>.md (copied from the generated card) using the Mitchell et
   al. 2019 sections: details, intended use, out-of-scope use, factors, metrics, evaluation
   data, training data, quantitative analyses, ethical considerations, caveats.
9. Tests in tests/ml/: artifacts load and predict on a sample row; calibrated probs in [0,1];
   conformal empirical coverage per class on test within ±3% of 90%; features.py matches SPEC
   §3.3; SHAP returns one value per feature.
10. Commit: "P3: models, calibration, conformal abstention, fairness, model cards".

Then STOP and show me, per disease: comparison table (AUROC, Brier, recall@t_mod for LR/LightGBM/
MLP), chosen model, thresholds + band sizes, coverage + abstention rate, top 5 SHAP features,
the largest fairness gaps, and anything flagged. Wait for my approval.
```

**You check (sign-off):** chosen models make sense; MLP is reported honestly even if it is not
the winner; flagged items are explained; no metric looks too good to be true (AUROC around
0.75–0.85 is normal for this data).

---

## P4 — Prediction API

```
Read CLAUDE.md and SPEC §1.3, §1.4, §3.3, §4.4–§4.6, §7.3.

Goal: rebuild the assessment backend around the Phase 3 artifacts.

1. Replace apps/api/schemas/assessment.py with the 14-feature request model from
   ml/training/features.py (age in years, height, weight, sex incl. "prefer_not_to_say",
   yes/no answers, GenHlth 1–5, MentHlth/PhysHlth 0–30) plus the optional symptom ticks. Pydantic
   validation per SPEC §3.3 ranges. Missing required fields → 422 with field names. Never fill
   defaults for medical inputs.
2. Rewrite apps/api/services/prediction_service.py and ml model loading:
   - load the 3 artifact sets once at startup; expose model versions at /api/v1/models.
   - order of operations exactly SPEC §1.4: emergency symptoms → data-quality gate → per-disease
     predict → calibrate → OOD + conformal → band → next-step rules.
   - D-9: "prefer not to say" → run both sexes, keep the higher band, add a note.
   - Per disease return: calibrated probability (for clinicians only), band, abstained (bool) +
     reason, conformal set, top 3 SHAP factors (feature, direction, plain-language key).
   - Interaction view data: factors that appear in the top 3 of 2+ diseases.
   - Explanations: build from templates in apps/api/content/explanations.{en,hi,mr}.json.
   - Guidance: from apps/api/content/guidance.{en,hi,mr}.json — write this file now from WHO /
     ICMR public material, each item with source title + URL, BMI using Asian-Indian cut-offs.
     Add every HI/MR string to docs/i18n_review.md as pending.
3. What-if endpoint: takes modified changeable features only (SPEC §4.6); rejects changes to
   non-changeable ones. Recourse endpoint: smallest single/pair change that lowers a band, within
   the limits in SPEC §4.6.
4. Response shaping by role: patients never get raw probabilities (bands + text only, D-10);
   abstained diseases return no band to patients. Clinicians get everything.
5. Persist: store the assessment (if store_history consent) with model versions; if the next-step
   rule says queue (and share_with_clinician consent) → insert into review_queue with reasons.
   Without store_history consent, return the result but store nothing except an audit entry.
6. Generate demo history now: a script that, for demo patients 1–6, runs the REAL models on 2–4
   plausible input sequences dated over the past months and stores them (label them demo).
7. Stress tests using data/synthetic Pune rows: missing values, out-of-range, contradictory
   (e.g. MentHlth 40), all must be rejected or flagged, never silently fixed.
8. Tests for every rule in SPEC §8.1 API list that applies here. Commit: "P4: prediction API".

Report: example JSON for (a) a Low patient, (b) a High patient, (c) an abstained case,
(d) an emergency case — as patient and as clinician.
```

**You check:** the four example responses read correctly; patient view has no raw probabilities.

---

## P5 — Assessment, results, what-if, history (frontend)

```
Read CLAUDE.md, SPEC §1.2–§1.4, §4.6, and apps/web/AGENTS.md (Next.js 16 rules). Use the
frontend-design skill if available for layout quality; keep the existing UI kit and brand.

1. Rebuild apps/web/src/app/risk-assessment/page.tsx as a short stepper (About you → Health
   history → Lifestyle → How you feel → Symptoms check → Review) with the exact questions in
   SPEC §3.3. Under 18 → blocked screen. BMI is computed and shown with Asian-Indian guidance.
   No field is pre-filled except from the user's saved health profile, and then visibly.
2. Results view:
   - Three condition cards side by side (stack on mobile): band with colour + icon + text (not
     colour alone), "Not confident — see a doctor" state for abstained.
   - Next-step banner from the API (emergency state takes the whole screen with 108 / 112
     buttons and no scores).
   - "Why this result?" (top factors in plain language), "What you can change" (recourse),
     "How sure is VITALNEX?" (confident / not confident + link to Trust Passport),
     "Shared factors" (interaction view).
   - Fixed wording: "Your answers are similar to people who have been told they have …" and
     "This is not a diagnosis." Never "you have".
   - If queued: "A clinician will review this result."
3. What-if panel: sliders/toggles only for changeable features; calls the what-if endpoint; shows
   before → after band per disease. Smoking: explain that "ever smoked" cannot change but quitting
   still lowers real-world risk.
4. Health profile page: trim to the feature contract + language preference; saved values
   pre-fill the form visibly.
5. History + dashboard: real assessments, trend chart per disease (band over time, Recharts),
   "Reviewed by clinician" badges and notes. Empty states when none.
6. All strings via messages/{en,hi,mr}.json; add new HI/MR medical strings to
   docs/i18n_review.md. Check every page in all three languages for overflow.
7. Accessibility: labels on all inputs, keyboard navigable stepper, contrast AA.
8. `npm run lint` and `npm run build` pass. Commit: "P5: assessment, results, what-if, history".

Report with screenshots (use Playwright if available) of the form, a Low result, a High result,
an abstained result, the emergency screen, and the what-if panel, in EN and one of HI/MR.
```

---

## P6 — Clinician workspace and admin governance

```
Read CLAUDE.md and SPEC §1.1, §1.3 (clinician flow), §2.1, §7.1 (Accountability row).

1. doctor/dashboard: counts (pending reviews, today's appointments), recent queue items.
2. doctor/patients: only consented patients. Case view shows inputs, calibrated probability,
   conformal set, abstain reason, top SHAP factors, data-quality notes, history chart.
   Display order: factors and uncertainty BEFORE the model's band (reduces automation bias).
3. Review actions: Agree, or Override (new band per disease + required reason code from a list:
   "clinical history not captured", "symptoms present", "input likely wrong", "model
   overestimates", "model underestimates", "other" + free-text note). Writes
   clinician_overrides + audit_logs; updates review status; patient sees the note.
   Overrides are never used for training (add a comment + test asserting no training code reads
   this table).
4. doctor/appointments: real bookings from Supabase.
5. admin/dashboard + admin/governance: model registry (versions, data hash, links to model
   cards), fairness tables from model_meta.json, override analytics (rate per disease, per
   reason, agree rate), abstention and emergency counts over time, consent stats, audit log
   viewer with filters. Only aggregates — no patient identities on admin pages.
6. Tests: clinician cannot see non-consented patient; override requires a reason; admin endpoints
   return aggregates only. Lint/build pass. Commit: "P6: clinician review, override log,
   governance".
```

---

## P7 — Trust Passport, principle map, consent centre, QR record

```
Read CLAUDE.md and SPEC §2.2, §7.1, §7.2, §1.2 (F12, F15, F16).

1. Trust Passport (apps/web/src/app/ai-trust): public page generated from model_meta.json and DB
   aggregates via an API endpoint — nothing hardcoded. Sections: what VITALNEX is / is not;
   data (from data card); per-disease model card summary (chosen model, test AUROC + CI, Brier,
   recall at Moderate threshold, miss rate in Low band, reliability plot, global SHAP plot);
   fairness tables with plain-language reading; abstention & coverage; limitations; versions and
   last trained date; how to report a problem.
2. Principle traceability map: apps/api/content/principle_map.json exactly as SPEC §7.1, each
   evidence item resolved live from metrics/DB. Render as an interactive table/cards: principle
   → features (links to pages) → live evidence. If any evidence value is unavailable, show
   "not available" — never a placeholder number.
3. Consent & data rights ("My data" under settings): view consents and toggle each purpose
   (SPEC §2.2) with notice text and version; withdraw is one click; export my data (JSON
   download); request deletion (confirm dialog in-page, not a browser alert) → removes data per
   SPEC §2.2, keeps a minimal audit record. Effects of withdrawal apply immediately (e.g. history
   hidden, clinician access gone).
4. QR patient-held record (novelty 9): patient picks sections (latest results, factors, history,
   clinician notes) and an expiry (1 h / 24 h / 7 days). Server creates a random token, stores
   only its hash, returns a URL + QR (qrcode). Public page share/[token] shows a read-only
   summary with "shared by the patient, expires at …" and the non-diagnostic notice. Every open
   writes share_access_log. Patient can see opens and revoke. Expired/revoked → clear message.
5. Tests: expired and revoked tokens fail; token hash not reversible; withdraw consent removes
   clinician access; deletion removes rows. Lint/build pass. Commit: "P7: Trust Passport,
   principle map, consent centre, QR record".
```

---

## P8 — Assistant NLP ⛔

```
Read CLAUDE.md and SPEC §5 fully.

1. ml/nlp/data/: write intents_train.jsonl (~40 utterances per intent per language EN/HI/MR,
   including ~10 romanised per HI/MR intent) and intents_test.jsonl (~10 per intent per language,
   written separately, different phrasing — do not paraphrase train lines). Intents as SPEC §5.
   Add emergency_phrases.json and medication_phrases.json (EN/HI/MR + romanised) used by rules.
2. ml/nlp/faq.{en,hi,mr}.json: ~15 entries per disease + ~10 about VITALNEX (data, AI, privacy,
   limits). Each answer short, plain, non-diagnostic, with source title + URL (WHO, ICMR, NHS,
   CDC public pages). Same ids across languages.
3. ml/nlp/encoder.py: wrapper for sentence-transformers `l3cube-pune/indic-sentence-bert-nli`,
   cached locally, loaded once. Record model licence (CC-BY-4.0) and attribution in the Trust
   Passport.
4. ml/nlp/train_intents.py: compare (a) TF-IDF + LR baseline, (b) frozen encoder + LR,
   (c) frozen encoder + small PyTorch MLP head. Choose by macro-F1 on a validation split of
   train; then evaluate once on the test file. Pick the confidence threshold for OUT_OF_SCOPE on
   validation. Save artifact + nlp_meta.json (per-language accuracy & macro-F1, confusion matrix,
   threshold, versions) + docs/model_cards/assistant.md.
5. Rewrite apps/api/services/assistant_service.py to the SPEC §5 pipeline: emergency rules →
   medication rule → encode → intent (+ abstain) → action (templated explanation from latest
   assessment / FAQ retrieval with similarity threshold / navigation). Remove the Gemini path.
   Log only intent, confidence, emergency_flag in assistant_logs.
6. Frontend ai-assistant page: chat UI with language picker, suggestion chips, source links on
   FAQ answers, navigation buttons, emergency card. Clear notice: "answers come from a fixed,
   reviewed library — VITALNEX does not generate medical advice."
7. Tests: 100% emergency recall on emergency test phrases in all languages; medication requests
   always refused; out-of-scope abstains; no message text stored. Add all HI/MR texts to
   docs/i18n_review.md. Commit: "P8: multilingual assistant".

Then STOP and show me: comparison table (3 approaches × 3 languages), chosen model, threshold,
the weakest intent per language, and 6 sample conversations (2 per language). Wait for approval.
```

---

## P9 — Reports, care-connect, i18n completion

```
Read CLAUDE.md and SPEC §1.2 (F9, F17, F19).

1. PDF report (reports page + report_service.py with reportlab): patient name, date, model
   versions, per-disease band / not-confident, top factors, next step, clinician note if any,
   limitations, non-diagnostic notice, Trust Passport URL. Devanagari must render correctly —
   embed a Noto Sans Devanagari font (OFL licence) and test HI and MR PDFs.
2. Care-connect + appointments on Supabase: list synthetic doctors (labelled demo), filter by
   specialty, book a slot, cancel, see upcoming. When results say "see a doctor soon", the
   results page links here with a matching specialty pre-selected (endocrinology / cardiology /
   neurology).
3. i18n: find every hardcoded user-facing string in apps/web/src and move it to messages files.
   Write a check script (npm run i18n:check) that fails if keys differ across en/hi/mr.
4. Lint/build/tests pass. Commit: "P9: PDF, care-connect, i18n completion".
```

---

## P10 — Verification, red-team, docs

```
Read CLAUDE.md and SPEC §7.3, §7.4, §8.

1. Run the full test suite and fix failures. Add any missing test from SPEC §8.1.
2. Run the red-team checklist in SPEC §8.2 end-to-end using Playwright against the running app
   (or the API where UI automation is impractical). Record pass/fail with evidence in
   docs/redteam_report.md. Fix failures, re-run.
3. Claims audit: grep the whole repo (code, UI strings, README, docs) for any metric, method or
   compliance claim. For each, show where the number/claim comes from. Remove anything that
   does not trace to code output or a cited document. Record in docs/claims_audit.md.
4. Write docs/ERAI_REPORT.md: system overview; NITI Aayog principle map with evidence values;
   risk register (SPEC §7.3) with status; fairness findings; limitations; human sign-off log
   (dates I approved P2, P3, P8); what would be needed before any real clinical use.
5. Update README.md: what VITALNEX is, setup from scratch (Supabase, .env, data download,
   training, seed, run), demo accounts, architecture diagram (Mermaid), links to docs.
6. Write docs/DEMO_SCRIPT.md: a 10-minute walk-through (patient flow in Marathi, High result →
   clinician override, abstained case, emergency in the assistant, Trust Passport + principle
   map, QR share + revoke, consent withdrawal).
7. Commit: "P10: verification, red-team, ERAI report, docs". Report the final status of every
   feature in SPEC §1.2 as Working / Partial / Not done — be honest.
```

---

## If you run out of time (cut in this order)

1. P9 care-connect filters (keep basic booking).
2. QR record → keep share link without QR image.
3. Assistant FAQ retrieval → keep intents + emergency + medication refusal.
4. Admin override analytics charts → keep the table.
Never cut: emergency override, abstention, data-quality gate, consent, honest Trust Passport.

## Useful follow-up prompts

- "Show me exactly where the number <X> on page <Y> comes from."
- "Run the claims audit again and list anything new since P10."
- "I changed decision D-<n> in docs/DECISIONS.md — update the code to match and list affected
  files before editing."
- "We want to A/B test <feature>: propose a design (variants, metric, assignment, consent,
  stopping rule) before writing code." (D-14)
