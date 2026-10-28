# VITALNEX — Build progress and handoff

*Last updated: 2026-10-29. Read this first when resuming. Phase prompts: `docs/PROMPTS.md`.
Decisions: `docs/DECISIONS.md` (D-1 … D-26).*

## Phase status

| Phase | Status | Commit(s) | Notes |
|---|---|---|---|
| P0 Cleanup | ✅ Done | `165db26` | |
| P1 Supabase, auth, RLS, seed | ✅ Done | `1366ffa`, `2c9a67f` | Live project connected 2026-10-28; 10/10 live tests pass |
| P2 Data pipeline ⛔ | ✅ Approved | `1cd2048` | `docs/data_card.md` |
| P3 Models ⛔ | ✅ Approved (D-22…D-24) | `4dca0ac`, `82015e5` | Model cards in `docs/model_cards/` |
| P4 Prediction API | ✅ Done | `0f6c391` | Examples: `docs/api_examples.md` |
| P5 Assessment UI | ✅ Done | `c3eb87f` | Not yet clicked through in a browser |
| P6 Clinician + governance | ✅ Done | `e0c33f8` (API), `23f82ac` (web) | Signed-in pages not smoke-tested |
| P7 Trust Passport, consent, QR | ✅ Done | `e0c33f8` (API), `23f82ac` (web) | |
| P8 Assistant ⛔ | ✅ Approved (D-25, D-26) | `838bf9c`, `ce3c84f`, `6e80832` | D-25/D-26 emergency rules + chat page committed in `6e80832` |
| P9 PDF, care-connect, i18n | ✅ Done | `b89ae21` | PDF with shaped Devanagari, care-connect booking, i18n completion + `npm run i18n:check` |
| P10 Verification, red-team, docs | 🟡 In progress (uncommitted) | — | Docs written (see "P10 status"); red-team + claims audit by a parallel agent |
| Architecture diagrams | ✅ Done | `519b816` | `docs/ARCHITECTURE_DIAGRAMS.md` (6 starred diagrams) |

## P10 status (2026-10-29, uncommitted)

- **Docs half (done, not committed):** `docs/ERAI_REPORT.md` (new: overview, principle map with
  evidence from the artifact JSONs, risk register status, fairness findings, limitations, sign-off
  log, known gaps, pre-clinical-use list), `README.md` (rewritten: setup on Windows/Linux,
  migrations, data, training, seeds, run, tests, demo accounts, embedded system diagram, doc
  links), `docs/DEMO_SCRIPT.md` (rewritten: 10-minute walk-through with the real demo accounts;
  the old hackathon script made false claims).
- **High demo case (done):** `supabase/seed/seed_history.py` adds one final visit for patient1
  (fixed demo answers; the band is computed by `screening.assess`, not hard-coded). Live run on
  2026-10-29: `patient1@vitalnex.demo: 3 demo assessments -> routine_checkup, routine_checkup,
  see_doctor_soon (queued)`. Patients 2 and 4 are `not_confident (queued)` (abstained demo cases).
- **Other half (parallel agent):** tests, red-team checklist (`docs/redteam_report.md`), claims
  audit (`docs/claims_audit.md`), final feature status table, commit
  "P10: verification, red-team, ERAI report, docs".

## Environment facts

- Windows 11, Python 3.13 (global interpreter, no venv), Node; all ML/NLP deps installed globally.
  Everything runs on this laptop only — the user asked for no cloud/remote/virtual-machine runs.
- `.env` is filled in by the user (Supabase URL, publishable + secret keys, DEMO_PASSWORD,
  SUPABASE_ACCESS_TOKEN). A hook blocks reading `.env` — never read or print it. Check values with
  `apps.api.core.config.settings` (print set/empty only).
- Supabase project ref `lybfrncjcihmrtiqvvic` (Mumbai). All three migrations are applied, including
  `20261028000001_p7_share_revoke_guard.sql`. New migrations are applied via the Management API
  (`POST https://api.supabase.com/v1/projects/<ref>/database/query` with SUPABASE_ACCESS_TOKEN),
  never by editing old migrations.
- Seeds: `python supabase/seed/seed_demo.py` (accounts, doctors, slots, consents; idempotent; resets
  passwords to DEMO_PASSWORD) then `python supabase/seed/seed_history.py` (real-model demo history).
  If live tests fail with "Invalid login credentials", re-run both seeds.
- Demo accounts: `admin@vitalnex.demo`; `dr.joshi` (cardiology), `dr.khan` (endocrinology),
  `dr.patil` (neurology) `@vitalnex.demo`; `patient1..6@vitalnex.demo` (1–4 share with clinicians,
  5–6 don't; languages en, hi, mr, en, hi, mr). Password = DEMO_PASSWORD.
- Live tests are slow on this network (sometimes 5+ min, sometimes connection resets); retry once.
- Servers on ports 8000 (API) / 3000 (web) may still be running from an earlier agent.
- Git repo folder `supabase/` shadows the pip package `supabase`; seed scripts import siblings by path.
- `apps.api.services` exports an instance named `prediction_service`; in tests get the module via
  `sys.modules["apps.api.services.prediction_service"]`.

## Key results to keep consistent everywhere

- Data: BRFSS 2015, 253,680 rows; prevalence diabetes 13.93%, heart 9.42%, stroke 4.06%; licence
  "CC0: Public Domain" (Kaggle), UCI defers to Kaggle.
- Models (test): diabetes LightGBM AUROC 0.824 (0.819–0.828); heart LightGBM 0.842 (0.836–0.848);
  stroke Logistic Regression 0.810 (0.801–0.818). Abstention 37% / 39% / 44% (accepted, D-22).
  Low band holds 56–66% of people (accepted, D-23). Age recall gap reported, not mitigated; under-40
  note shown (D-24).
- Assistant: encoder + MLP head; untouched emergency hold-out 29/30 (D-25); 30/30 with the
  D-25 rules, but that set is no longer untouched.

## Open items (after P10 docs)

- Red-team checklist (SPEC §8.2) and claims audit (parallel agent); team's own pre-demo red-team
  sign-off (SPEC §7.4 gate 4) still pending.
- Known gap: a patient can read their own stored probabilities directly through Supabase (the
  `results` JSON); only the API hides them (D-10). Decide whether to move probabilities to a
  clinician-only column/table.
- "Recourse usage" evidence is "not available" (not recorded).
- Human review of all HI/MR medical wording is still pending (D-15): `docs/i18n_review.md`,
  `docs/i18n_review_p8.md`.
- Nothing signed-in has been clicked through in a browser yet; Playwright is not installed.
- The web app does not apply a user's stored `preferred_language` at sign-in (only the language
  switch changes the UI); the demo script tells the presenter to switch by hand.
- patient1's demo history jumps from all-Low to all-High between visits (fixed demo answers for
  the High case); fine for the demo, not a realistic trajectory.
