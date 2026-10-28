# VITALNEX — Build progress and handoff

*Last updated: 2026-10-28. Read this first when resuming. Phase prompts: `docs/PROMPTS.md`.
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
| P8 Assistant ⛔ | ✅ Approved (D-25, D-26); 🟡 follow-up unfinished | `838bf9c`, `ce3c84f` | See "Uncommitted work" A |
| P9 PDF, care-connect, i18n | 🟡 In progress, unfinished | — | See "Uncommitted work" B |
| P10 Verification, red-team, docs | ⬜ Not started | — | |
| Architecture diagrams | ✅ Done | `519b816` | `docs/ARCHITECTURE_DIAGRAMS.md` (6 starred diagrams) |

## Uncommitted work (agents stopped mid-task on 2026-10-28; NOT verified)

Run `git status` first. Nothing below has passed tests/lint/build yet.

**A. P8 follow-up (D-25, D-26 + chat page).** The agent had finished the backend changes and was
about to write the chat page.
- Files: `apps/api/core/emergency.py`, `apps/api/schemas/assistant.py`,
  `apps/api/services/assistant_service.py`, `ml/nlp/rules.py`, `ml/nlp/train_intents.py`,
  `ml/nlp/data/emergency_phrases.json`, `ml/nlp/artifacts/nlp_meta.json`,
  `docs/model_cards/assistant.md`, `tests/nlp/*`, `tests/test_assessment_api.py`,
  `apps/web/src/app/ai-assistant/page.tsx` (chat page probably incomplete).
- Still to do: bare red-flag words ("stroke", "heart attack", "chest pain" + HI/MR, Devanagari and
  romanised) always show the 108/112 card, with the normal answer still shown in the assistant and
  a full emergency in assessment free text (D-26). Add the missed Marathi phrase "chhativar konitari
  basla aahe asa vatat" and "chest heavy / pressure / tight" wordings; re-report the untouched
  hold-out result honestly (was 29/30) (D-25). Chat page per PROMPTS P8 step 6. New HI/MR strings
  go in `docs/i18n_review_p8.md`.

**B. P9 (PDF, care-connect, i18n).** The agent was in the middle of the i18n sweep.
- Files: `apps/api/routers/v1/reports.py`, `apps/api/services/report_service.py` (new),
  `apps/api/content/report.{en,hi,mr}.json` (new), `apps/api/assets/` (Noto Sans Devanagari font +
  OFL, new), `apps/api/requirements.txt`, `apps/api/schemas/appointment.py`,
  `apps/api/services/doctor_service.py`, `tests/test_reports.py` (new),
  `apps/web/package.json` + `apps/web/scripts/` (i18n:check), `apps/web/src/components/care/`,
  `apps/web/src/lib/care.ts`, `apps/web/src/app/{care-connect,appointments,reports}/page.tsx`,
  `components/assessment/ResultsView.tsx` (care-connect link), many pages/components touched by the
  i18n sweep (layout, login, onboarding, home, Sidebar, Topbar, Footer…), `messages/{en,hi,mr}.json`.
- Still to verify: Devanagari shaping in reportlab PDFs (check conjuncts/matras honestly, don't
  just claim it works), care-connect booking on live Supabase, i18n sweep complete,
  `npm run i18n:check`. New HI/MR medical strings go under "## Added in Phase P9" in
  `docs/i18n_review.md`.

**How to resume:** run `python -m pytest tests -q --deselect tests/test_live_supabase.py`,
`npm --prefix apps/web run lint`, `npm --prefix apps/web run build`; fix, finish A and B, commit A as
"P8: assistant emergency rules (D-25, D-26) and chat page" and B as "P9: PDF, care-connect, i18n
completion". Then do P10.

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
  stroke Logistic Regression 0.810 (0.801–0.819). Abstention 37% / 39% / 44% (accepted, D-22).
  Low band holds 56–66% of people (accepted, D-23). Age recall gap reported, not mitigated; under-40
  note shown (D-24).
- Assistant: encoder + MLP head; emergency hold-out 29/30 before the D-25 fix.

## Open items for P10

- Red-team checklist (SPEC §8.2), claims audit, `docs/ERAI_REPORT.md`, README (embed diagrams from
  `docs/ARCHITECTURE_DIAGRAMS.md`), `docs/DEMO_SCRIPT.md`.
- Demo data has no **High** case: add one demo visit that scores High (for the clinician override
  part of the demo).
- Known gap: a patient can read their own stored probabilities directly through Supabase (the
  `results` JSON); only the API hides them (D-10). Decide whether to move probabilities to a
  clinician-only column/table.
- "Recourse usage" evidence is "not available" (not recorded).
- Human review of all HI/MR medical wording is still pending (D-15): `docs/i18n_review.md`,
  `docs/i18n_review_p8.md`.
- Nothing signed-in has been clicked through in a browser yet; Playwright is not installed.
