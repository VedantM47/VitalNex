# VITALNEX MVP — Product & Technical Specification

Version 0.1 (pre-development freeze) · Owner: VITALNEX team · Built by: Claude Code
Status of each decision: see `docs/DECISIONS.md`.

---

## 1. Product summary

**Problem.** Many people in India do not know they are at risk of diabetes, heart disease or
stroke until late, and often do not know what kind of care to seek. Screening information is
mostly in English and often not explained.

**Product.** VITALNEX lets a person answer ~15 simple questions (in English, Hindi or Marathi,
by typing or tapping), and returns, for three conditions:

- a **screening level** (Low / Moderate / High, or "Not confident — clinician review"),
- the **main factors** behind it, in plain language,
- **what they can change** (only things that are changeable),
- a **next step**: routine check-up / discuss at next visit / see a doctor soon / emergency.

Clinicians get a review queue for high-risk and uncertain cases, can agree or override with a
reason, and every override is logged. Admins see governance: model cards, fairness tables,
override rates and the audit log. A public **Trust Passport** explains how the AI works and where
it fails, mapped to NITI Aayog's Responsible AI principles.

**What it is not.** Not a diagnosis, not a prescription, not a replacement for a doctor, not
validated on Indian patients. Users are dummy accounts in the MVP.

### 1.1 Users and roles

| Role | Who (MVP) | Can do |
|---|---|---|
| Patient | Dummy accounts | Onboard + consent, health profile, assessment, results, what-if, history, assistant, care-connect booking (dummy slots), PDF report, QR share, data rights (view / withdraw / delete) |
| Clinician | Dummy doctor accounts | Patient list (only consented patients), review queue, approve / override with reason, appointments, view shared QR records |
| Admin | Dummy admin account | Governance dashboard, model registry/cards, fairness, override analytics, audit log, dataset cards |
| Public | Anyone | Landing page, Trust Passport, shared QR record (with valid token only) |

### 1.2 MVP feature list (frozen)

Status: **Keep** = existing repo page reused and fixed. **Rebuild** = logic replaced.
**New** = does not exist yet.

| # | Feature | Status | Page / module |
|---|---|---|---|
| F1 | Auth for 3 roles via Supabase (dummy accounts) | Rebuild | `auth/*`, `login/*`, `lib/auth-context.tsx` |
| F2 | Onboarding with purpose-specific consent | Rebuild | `onboarding` |
| F3 | Health profile | Keep + trim fields to feature contract | `health-profile` |
| F4 | Risk assessment, 3 diseases, one form | Rebuild | `risk-assessment` |
| F5 | Results: levels, factors, next step, abstain state | Rebuild | `risk-assessment` (results view) |
| F6 | What-if / actionable recourse (changeable factors only) | Rebuild | `risk-assessment` |
| F7 | Assessment history + trend chart | Keep, real data | `history`, `dashboard` |
| F8 | AI assistant (intent NLP + curated FAQ retrieval + emergency) | Rebuild | `ai-assistant` |
| F9 | Care-connect + appointment booking (dummy doctors/slots) | Keep, move to Supabase | `care-connect`, `appointments` |
| F10 | Clinician dashboard, patient list, review queue | Keep + rebuild queue | `doctor/*` |
| F11 | Clinician override log (novelty 8) | New | `doctor/patients`, `admin/governance` |
| F12 | Trust Passport + principle traceability map (novelty 5) | Rebuild | `ai-trust` |
| F13 | Abstaining model / conformal prediction (novelty 1) | New | ML + results view |
| F14 | Emergency red-flag override (novelty 6) | Keep + extend | assistant + assessment |
| F15 | QR patient-held record (novelty 9) | New | `reports` + public `share/[token]` |
| F16 | Consent & data-rights centre (DPDP) | New (uses `consents` table) | `settings` → "My data" |
| F17 | PDF report | Keep, real data | `reports` |
| F18 | Admin governance + audit log | Keep + real data | `admin/dashboard`, `admin/governance` |
| F19 | Language switch EN / HI / MR | Keep + complete strings | global |

**Frozen / removed for MVP:** voice page (`voice`), consultation page (`consultation/[id]`),
`admin/model-lab` and `admin/datasets` (folded into governance), `health-insights` (merged into
results), settings beyond language + "My data". Jev / TypeSafe service: **removed**.
A/B experiments: **reserved** — not built until the team asks (see DECISIONS D-14).

### 1.3 Core user flows

**Patient assessment flow**
1. Login → (first time) onboarding: what VITALNEX is / is not, consent choices → health profile.
2. Assessment form (§3.3). Under 18 → blocked with explanation.
3. Server: validate → emergency check → data-quality gate → 3 models → calibrate → conformal →
   band → next-step rules → explanations → store → (if needed) add to review queue.
4. Results page shows the three conditions side by side, shared factors highlighted
   (interaction view), next step, and "Why this result?" / "What can I change?" / "How sure is
   VITALNEX?" sections.
5. Patient can open the assistant, book an appointment, download PDF, create a QR share.

**Clinician review flow**
1. Queue lists cases with reason (High band, abstained, data-quality flag, emergency flag).
2. Clinician opens a case: inputs, calibrated probability, conformal set, top SHAP factors, data
   quality, history.
3. Clinician chooses **Agree** or **Override** (new level + required reason from a list + free
   text). Override is logged with clinician id, model version, timestamp.
4. Patient sees "Reviewed by a clinician" and the clinician's note.

### 1.4 Next-step rules (deterministic — not the model)

Evaluated in this order; first match wins.

| Order | Condition | Next step shown | Queue? |
|---|---|---|---|
| 1 | Emergency red flag in any free text or symptom tick | **Emergency: call 108 / 112 now** (no scores shown) | Yes, flagged |
| 2 | Data-quality gate failed (impossible values) | Ask user to correct inputs | No |
| 3 | Any condition abstained (conformal set = {0,1} or input out-of-distribution) | "VITALNEX is not confident for you. Please see a doctor." | Yes |
| 4 | Any condition High | "See a doctor soon (within 2 weeks)" | Yes |
| 5 | Any condition Moderate | "Discuss at your next check-up" | No |
| 6 | All Low | "Keep up regular check-ups" | No |

General lifestyle guidance shown with results comes **only** from a curated, cited content file
(`apps/api/content/guidance.{en,hi,mr}.json`) written from WHO / ICMR public material, each entry
with a source URL. BMI guidance uses **Asian-Indian cut-offs** (overweight ≥ 23, obese ≥ 27.5).

---

## 2. Architecture

```
Next.js (apps/web) ──HTTPS/JSON──► FastAPI (apps/api) ──► ML runtime (ml/, joblib + torch CPU)
      │                                   │            └─► NLP runtime (sentence-transformers, local)
      └── Supabase Auth (JWT) ────────────┴──► Supabase Postgres (RLS)
```

- The browser authenticates with Supabase Auth and sends the JWT to FastAPI.
- FastAPI verifies the JWT (Supabase JWT secret / JWKS), reads the user's role from `profiles`,
  and uses the service key only server-side.
- All model inference happens in FastAPI. Models are loaded once at startup from `ml/artifacts/`.
- Every prediction stores `model_version` and `data_hash` so it can be traced to a model card.

### 2.1 Database changes (on top of the existing 23 tables)

Keep existing tables. Add / change:

| Table | Purpose | Key columns |
|---|---|---|
| `risk_assessments` (change) | One row per assessment | `user_id, inputs jsonb, results jsonb (per disease: prob, band, conformal_set, abstained, top_factors), next_step, emergency_flag, review_status, model_versions jsonb, created_at` |
| `review_queue` (new, or a view on `risk_assessments`) | Clinician work list | `assessment_id, reason[], status (pending/agreed/overridden), assigned_to` |
| `clinician_overrides` (new) | Novelty 8 | `assessment_id, disease, model_band, clinician_band, reason_code, note, clinician_id, model_version, created_at` |
| `share_tokens` (new) | Novelty 9 | `token_hash, user_id, scope jsonb (which sections), expires_at, revoked_at, created_at` |
| `share_access_log` (new) | Who opened a share | `token_id, accessed_at, accessor_role` |
| `consents` (use existing) | DPDP | `user_id, purpose, granted, granted_at, withdrawn_at, notice_version` |
| `data_requests` (new) | Access / deletion requests | `user_id, type (export/delete), status, created_at, completed_at` |
| `assistant_logs` (new, minimal) | Safety audit | `user_id, intent, confidence, emergency_flag, created_at` — **no message text stored** |
| `audit_logs` (use existing) | Everything sensitive | actor, action, target, timestamp |

RLS: patients read/write only their own rows; clinicians read only patients who granted
`share_with_clinician` consent; admins read aggregates and audit; nobody reads another patient's
raw inputs except a consented clinician. Seed: 1 admin, 3 doctors, 6 patients (see §6).

### 2.2 Consent purposes (shown at onboarding, each separately toggleable)

| Purpose | Required? | Effect if off |
|---|---|---|
| `assessment_processing` | Required to use assessments | Cannot run assessment |
| `store_history` | Optional | Result shown once, not saved |
| `share_with_clinician` | Optional | No clinician review; high-risk users told to see a doctor directly |
| `aggregate_audit` | Optional | Excluded from governance aggregates |

Withdrawal is as easy as granting (one toggle in "My data"). Deletion request removes the user's
assessments, shares and profile data, keeps only a minimal audit entry that a deletion happened.

---

## 3. Data

### 3.1 Sources and roles

| Dataset | Role | Use for metrics? |
|---|---|---|
| **CDC BRFSS "Diabetes Health Indicators"** (UCI ML Repository id 891, DOI 10.24432/C53919; same data as Kaggle `alexteboul/diabetes-health-indicators-dataset`). 253,680 survey respondents, 21 features, no missing values. | Train / calibrate / test all three models | **Yes** — the only source of reported metrics |
| Pune Clinical Risk Synthetic Dataset (20,000 rows, team-made) | Demo patient profiles (age, sex, locality), stress tests (missing / out-of-range / odd inputs) | **No** |
| data.gov.in Pune / Maharashtra HMIS (aggregated) | Post-MVP context only | No |

Licence: the underlying BRFSS is US CDC public survey data; UCI defers licensing to the Kaggle
page. Phase 2 must record the exact licence text shown on the source page in the data card. If it
is unclear, the data card says so.

### 3.2 Targets (one dataset, three binary targets)

| Disease key | Column | Meaning (BRFSS wording) | Approx. prevalence* |
|---|---|---|---|
| `diabetes` | `Diabetes_binary` | Ever told they have diabetes **or prediabetes** | ~14% |
| `heart` | `HeartDiseaseorAttack` | Ever reported coronary heart disease or myocardial infarction | ~9% |
| `stroke` | `Stroke` | Ever told they had a stroke | ~4% |

*Recompute in Phase 2 and write the real numbers into the data card.

**Important honesty point:** these labels are "ever told / ever had" from a cross-sectional
survey. The model estimates **similarity to people who have the condition now**, not a
10-year future risk. All UI wording must reflect this.

### 3.3 Feature contract (the assessment form)

All three models use the **same 14 inputs**. None of the three target columns is used as an input
to any model. The form asks these and nothing else.

| Feature | Question shown to user | Type / values | Validation |
|---|---|---|---|
| `Age` | Your age (years) | int → mapped to BRFSS 13 bands (1 = 18–24, 2 = 25–29 … 12 = 75–79, 13 = 80+) | 18–120; < 18 blocked |
| `Sex` | Sex assigned at birth (used only for risk calculation) | 0 female / 1 male / "prefer not to say" | see D-9 |
| `BMI` | Height (cm) and weight (kg) → BMI computed | float | height 120–220, weight 30–250, BMI 12–70 |
| `HighBP` | Has a doctor or nurse ever told you that you have high blood pressure? | 0/1 | required |
| `HighChol` | … ever told you that your cholesterol is high? | 0/1 | required |
| `Smoker` | Have you smoked at least 100 cigarettes (5 packs) in your life? | 0/1 | required |
| `PhysActivity` | In the past 30 days, did you do any physical activity or exercise other than your regular job? | 0/1 | required |
| `Fruits` | Do you eat fruit at least once a day? | 0/1 | required |
| `Veggies` | Do you eat vegetables at least once a day? | 0/1 | required |
| `HvyAlcoholConsump` | Do you drink more than 14 drinks a week (men) / 7 a week (women)? | 0/1 | required |
| `GenHlth` | In general, how is your health? | 1 excellent … 5 poor | required |
| `MentHlth` | In the past 30 days, how many days was your mental health not good? | 0–30 | required |
| `PhysHlth` | In the past 30 days, how many days was your physical health not good? | 0–30 | required |
| `DiffWalk` | Do you have serious difficulty walking or climbing stairs? | 0/1 | required |

Optional separate symptom tick-box (not a model input, feeds emergency rule only): chest pain or
pressure now, sudden face drooping / arm weakness / speech difficulty, severe breathlessness,
fainting.

**Fairness-only columns (never model inputs, never asked in the app):** `Income`, `Education`,
`AnyHealthcare`, `NoDocbcCost`, `CholCheck`. Used only to audit model behaviour across groups
(D-6).

**Known limitations to state in the Trust Passport:**
- US 2014/2015 population; not validated on Indian users.
- Smokeless tobacco (gutka, khaini) and bidis — common in India — are not captured.
- BMI risk thresholds differ for South Asians; the model uses raw BMI, guidance uses Asian cut-offs.
- Sex is binary in the data; no data for intersex / non-binary people.
- Survey weights are not in the cleaned file, so prevalence is not nationally representative.
- Self-reported answers can be wrong; "ever told" excludes undiagnosed people (label noise).

### 3.4 Splits and hygiene

- Stratified (on the disease target) split per disease: **train 60% / calibration 20% / test 20%**,
  fixed seed 42. Test set is touched once, at the end.
- All preprocessing inside a scikit-learn `Pipeline` fitted on train only.
- Report exact-duplicate rows. Keep them (they can be different people with coarse answers), but
  also report test metrics on a de-duplicated test set as a robustness check.
- Save a SHA-256 hash of the prepared data file into every `model_meta.json`.

---

## 4. Models

### 4.1 Per disease (diabetes, heart, stroke)

| Model | Role | Notes |
|---|---|---|
| Logistic Regression | Interpretable baseline | standardised inputs, `class_weight="balanced"` |
| LightGBM | Strong tabular model | early stopping on an inner validation split from train |
| **PyTorch MLP** | Deep learning model | 14 → 64 → 32 → 1, ReLU, dropout 0.2, batch-norm optional, BCE with `pos_weight`, Adam, early stopping on inner val; save training curves (loss + AUROC per epoch) |

Hyperparameters: small fixed grid with 3-fold CV on train (keep total training time per disease
under ~10 minutes on a laptop CPU).

**Production model selection (per disease):** highest calibration-set AUROC, unless another model
is within 0.005 AUROC and has a better Brier score — then prefer the better-calibrated / simpler
one. The choice and the full comparison table go into `model_meta.json` and the model card.
The team signs off the selection (human gate, Phase 3).

### 4.2 Calibration

- Isotonic calibration (`CalibratedClassifierCV(method="isotonic", cv="prefit")` or manual
  `IsotonicRegression` for the MLP) fitted on **half** of the calibration split
  ("cal-A"); the other half ("cal-B") is used for conformal and thresholds.
- Report Brier score and expected calibration error (10 bins) before and after, and save a
  reliability plot (PNG) per disease.

### 4.3 Risk bands

On cal-B, per disease, on calibrated probability p:
- **t_mod** = the largest threshold with **recall ≥ 0.80** (so "Low" contains at most ~20% of
  true cases — this miss rate is stated openly in the Trust Passport).
- **t_high** = the smallest threshold where **precision ≥ 3 × base prevalence** (people in High
  are at least 3× as likely as average to have the condition). If not reachable, use the top 10%
  of calibrated scores. Must satisfy t_high > t_mod.
- Bands: **Low** p < t_mod · **Moderate** t_mod ≤ p < t_high · **High** p ≥ t_high.
Record thresholds, the share of people in each band, and test-set precision/recall per band in
`model_meta.json`. If a band contains > 50% of people, flag it to the team. These are screening
bands, not clinical cut-offs, and the Trust Passport says so. The team signs off thresholds.

### 4.4 Abstention (novelty 1)

- **Class-conditional (Mondrian) split-conformal prediction** on cal-B with α = 0.10 per class,
  using nonconformity score 1 − p̂(true class). This gives ~90% coverage separately for positives
  and negatives — important because stroke is rare.
- Prediction set {0} or {1} → normal result. Set {0, 1} or {} → **abstain** for that disease.
- **Out-of-distribution check:** if the input combination is far from training data
  (e.g. Mahalanobis distance or an IsolationForest score beyond the 99th training percentile),
  also abstain.
- Report on test: empirical coverage per class, abstention rate overall and per subgroup.
  If abstention > 30% for a disease, flag it to the team rather than silently retuning α.

### 4.5 Explainability

- SHAP for the production model: `TreeExplainer` (LightGBM), `LinearExplainer` (LR) or
  `GradientExplainer` / `DeepExplainer` (MLP). Background sample = 200 rows from train.
- Per prediction: top 3 contributing factors (positive and negative) mapped to plain-language
  template sentences in EN/HI/MR (`apps/api/content/explanations.{lang}.json`).
- Global: mean |SHAP| bar chart per disease for the Trust Passport.

### 4.6 Actionable recourse (what-if)

- Changeable features only: `BMI` (via weight), `Smoker` (quitting is shown as "has quit" note —
  BRFSS "ever smoked" cannot go back to 0; show as limitation), `PhysActivity`, `Fruits`,
  `Veggies`, `HvyAlcoholConsump`, `GenHlth`, `MentHlth`, `PhysHlth`.
  **Never** suggest changing Age, Sex, HighBP, HighChol or DiffWalk ("told by a doctor" facts) —
  instead, for HighBP/HighChol, suggest "keeping it under control with your doctor".
- The what-if panel re-runs the models with the user's modified inputs and shows the new band.
- Recourse suggestion: search over single and pairs of changeable feature changes within
  realistic limits (e.g. BMI −10% max), return the smallest change that lowers the band.

### 4.7 Fairness

On the test set, with fairlearn `MetricFrame`, per disease, for groups: Sex, Age band
(18–39 / 40–59 / 60+), Income (low / mid / high), Education (≤ high school / more),
AnyHealthcare, NoDocbcCost.
Metrics: recall (TPR), false positive rate, precision, calibration (mean predicted vs observed),
abstention rate. Report max gap and ratio. Flag any recall gap > 0.10.
**Do not** claim "compliant" with the four-fifths rule (that is a US employment rule); just report
gaps and what was done about them. If a mitigation is tried (e.g. per-group threshold), report
before/after and keep it only if the team approves.

### 4.8 Uncertainty for display

Bootstrap (500 resamples of the test set) 95% CIs for AUROC, recall and Brier per disease, shown
in the Trust Passport. Per-patient display uses the conformal result ("confident" / "not
confident"), not a fake ±CI.

### 4.9 Artifacts

```
ml/artifacts/<disease>/
  model.joblib | mlp.pt      production model (+ calibrator)
  pipeline.joblib            preprocessing
  conformal.json             per-class quantiles, alpha
  ood.joblib                 OOD detector + threshold
  model_meta.json            version, data_hash, features, comparison table, chosen model,
                             thresholds, calibration before/after, test metrics + CIs,
                             fairness tables, abstention stats, SHAP global, created_at
  reliability.png, shap_global.png, training_curves.png (MLP)
  model_card.md              generated from model_meta.json (Mitchell et al. 2019 structure)
```
Model version format: `<disease>-v<major>.<minor>.<patch>` (e.g. `heart-v1.0.0`).

---

## 5. Assistant NLP (F8)

**Goal:** understand what the user wants in EN / HI / MR (including romanised Hindi/Marathi),
answer only with **vetted** text, and never generate medical claims.

Pipeline per message:
1. **Emergency rules** (keyword / regex lists in EN, HI, MR, romanised) → emergency response.
2. **Medicine/dose rule** (e.g. "kitni goli", "dose", drug names list) → polite refusal + "ask your
   doctor or pharmacist".
3. **Encode** with `l3cube-pune/indic-sentence-bert-nli` (MuRIL-based SBERT, CC-BY-4.0), local.
4. **Intent classifier** (trained head on frozen embeddings — logistic regression and a small
   PyTorch MLP compared; also compare against a TF-IDF baseline to show the value of the
   pretrained encoder). Intents:
   `EXPLAIN_RESULT, WHAT_CAN_I_CHANGE, DISEASE_INFO, HOW_AI_WORKS, BOOK_APPOINTMENT,
   FIND_DOCTOR, MY_DATA, EMERGENCY, MEDICATION_REQUEST, GREETING, OUT_OF_SCOPE`.
   If max probability < threshold → treat as `OUT_OF_SCOPE` (abstain).
5. **Action:**
   - `EXPLAIN_RESULT` / `WHAT_CAN_I_CHANGE` → templated text built from the user's latest
     assessment (same templates as results page).
   - `DISEASE_INFO` / `HOW_AI_WORKS` → **FAQ retrieval**: cosine similarity against curated FAQ
     entries (`ml/nlp/faq.{en,hi,mr}.json`, ~15 per disease + ~10 about VITALNEX, each with a
     source URL). Below similarity threshold → "I don't have a reliable answer" + suggestions.
   - Navigation intents → reply + button to the right page.
6. Log only `intent, confidence, emergency_flag` (no message text).

**Training data:** Claude Code writes ~40 example utterances per intent per language
(incl. ~10 romanised for HI/MR), held-out test set of ~10 per intent per language written
separately. Report accuracy and macro-F1 **per language** (language parity is an inclusivity
metric) and the confusion matrix. All HI/MR text is listed in `docs/i18n_review.md` for human
review.

Model size note: MuRIL-base is ~240M parameters; encoding a short message on CPU is fast enough
for a demo. Load once at API startup.

---

## 6. Demo data

- Supabase seed script creates: `admin@vitalnex.demo`, `dr.joshi@`, `dr.khan@`, `dr.patil@`,
  and 6 patients (`patient1…6@vitalnex.demo`), with a shared demo password stored only in `.env`.
- Patient profiles: age / sex / locality sampled from the Pune synthetic dataset (clearly labelled
  "synthetic demo patient").
- Assessment history: generated by **running the real models** on plausible input sequences for
  each demo patient (e.g. improving BMI over 3 visits) — never copied scores.
- Doctors / slots: synthetic, clearly labelled.
- Stress-test suite uses Pune rows to create missing / out-of-range / contradictory inputs.

---

## 7. Responsible AI design

### 7.1 NITI Aayog principle traceability map (novelty 5)

Stored as `apps/api/content/principle_map.json`, rendered in the Trust Passport. Each entry:
principle → features that implement it → live evidence (a metric from `model_meta.json`, a count
from the DB, or a link to the page).

| NITI Aayog principle | Implemented by | Live evidence |
|---|---|---|
| Safety and Reliability | Data-quality gate, conformal abstention, OOD check, emergency override, recall-first bands | Coverage per class, abstention rate, emergency triggers count |
| Equality | Fairness audit across sex/age/income/education/access | Recall & FPR gap tables |
| Inclusivity and Non-discrimination | EN/HI/MR UI, plain-language explanations, sensitive attributes excluded from inputs, per-language NLP accuracy | Language parity table, excluded-features list |
| Privacy and Security | Purpose-specific consent, data minimisation, RLS, no third-party APIs, revocable QR shares, no chat text stored | Consent rates, share revocations, data-request log |
| Transparency | Trust Passport, model cards, per-result "why" and "how sure", honest limitations | Model card version, data hash |
| Accountability | Clinician review queue, override log, audit log, versioned models, human sign-off gates | Override rate by disease, audit entries |
| Protection and Reinforcement of Positive Human Values | Non-diagnostic wording, no medicine advice, recourse only on changeable factors, patient-held record | Medication-refusal count, recourse usage |

### 7.2 Regulatory / ethical guidance considered

- NITI Aayog, *Responsible AI for All* (Part 1 Principles, 2021).
- ICMR, *Ethical Guidelines for Application of AI in Biomedical Research and Healthcare* (2023).
- Digital Personal Data Protection Act 2023 and DPDP Rules 2025 (notified 14 Nov 2025; phased).
- WHO, *Ethics and Governance of AI for Health* (2021).
- Medical-device boundary: VITALNEX avoids diagnostic / treatment claims so it stays a screening
  and navigation aid; any future clinical use would need CDSCO regulatory review.
Claude Code must cite these by name only where relevant, and must not invent clause numbers.

### 7.3 Risk register (top items)

| Risk | Harm | Mitigation in MVP |
|---|---|---|
| False reassurance (missed case) | Person skips care | Recall-first High threshold, abstention, "Low ≠ no risk" wording, always-on "see a doctor if symptoms" |
| False alarm | Anxiety, cost | Moderate band, plain wording, clinician review before strong messaging |
| Population shift (US → India) | Mis-calibrated scores | Stated limitation, Asian BMI guidance, post-MVP Indian validation (NFHS-5) |
| Automation bias in clinicians | Rubber-stamping | Show uncertainty and factors, require a reason on override, track agree rate |
| Language errors in HI/MR medical text | Misunderstanding | Templates only, human review list, no generative text |
| Data leak / misuse of shares | Privacy harm | RLS, expiring hashed tokens, access log, revocation |
| Over-trust in "AI" | Treat as diagnosis | Non-diagnostic copy everywhere, Trust Passport, PDF disclaimer |

### 7.4 Human sign-off gates

1. After Phase 2: team approves the data card.
2. After Phase 3: team approves production model choice, thresholds and fairness report.
3. After Phase 8: team approves NLP evaluation and HI/MR wording list.
4. Before demo: team runs the red-team checklist (§8.2).

---

## 8. Quality

### 8.1 Tests (minimum)
- ML: pipeline fits only on train (assert); feature contract matches form; calibration improves or
  equals Brier on cal-B; conformal coverage within ±3% of target on test; artifacts load.
- API: validation rejects impossible values; missing value never silently filled; emergency text
  bypasses models; abstain path; review queue insertion; RLS behaviour with role tokens; share
  token expiry/revocation; deletion request removes data.
- NLP: per-language accuracy above a floor (set after first run, reported); emergency recall 100%
  on the emergency test list.
- Web: lint + build; smoke test of the assessment flow.

### 8.2 Red-team checklist (manual, before demo)
Ask the assistant for a medicine dose; type "seene mein dard" / "छातीत दुखतंय"; enter BMI 80;
enter age 15; tick "prefer not to say" for sex; open an expired QR link; log in as patient A and
try to fetch patient B's assessment by ID; withdraw consent and check history is hidden.

---

## 9. Post-MVP (not now)

Indian validation with NFHS-5 (DHS Program registration), 70k cardiovascular dataset with measured
BP, hypertension model, voice input/output, Pune district context from data.gov.in, TabPFN
comparison, A/B experiments (when the team asks), real clinician pilot.
