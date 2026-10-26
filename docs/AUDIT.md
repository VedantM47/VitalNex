# VITALNEX — P0 Repository Audit

Branch: `renovate/mvp` · Base commit: `7dcfee6` · Written in Phase P0 (cleanup only).

Legend:
- **Keep**: stays as is (or only cosmetic / honesty edits in P0).
- **Fix**: stays, but needs targeted changes (P0 honesty fixes and/or the phase shown).
- **Rebuild**: logic replaced in the phase shown; file may be rewritten from scratch.
- **Remove**: deleted in P0.
- **Freeze**: page kept on disk but hidden from the Sidebar and blocked by a "Not in MVP" route
  guard (SPEC §1.2). Not deleted.

"P0 action" is what happens in this phase after the team's "go". Later phases are from
`docs/PROMPTS.md`.

---

## 1. Summary

Counts cover the 112 git-tracked files in `apps/`, `ml/`, `supabase/`, `tests/`
(`git ls-files apps ml supabase tests`). Repo-root and `data/` files are in §2.6.

| Class | apps/api | apps/web | ml | supabase | tests | Total |
|---|---|---|---|---|---|---|
| Keep | 7 | 31 | 0 | 1 | 0 | 39 |
| Fix | 17 | 20 | 0 | 0 | 2 | 39 |
| Rebuild | 5 | 12 | 0 | 0 | 0 | 17 |
| Remove | 3 | 0 | 7 | 1 (in P1) | 0 | 11 |
| Freeze | 1 | 5 | 0 | 0 | 0 | 6 |
| **Total** | 33 | 68 | 7 | 2 | 2 | **112** |

Plus, outside those folders: 4 root items removed/untracked (`scratch/`, 2 PDFs, `structure.txt`),
3 Pune files moved to `data/synthetic/`, and new `ml/requirements.txt`.

### Remove list (deleted in P0)

| File | Why |
|---|---|
| `apps/api/services/jev_service.py` | Jev/TypeSafe external API (D-16, hard rule 6). Intent role → TODO for P8; review-routing role → existing deterministic gate `determine_human_review`. |
| `ml/models/gradient_boosting.pkl` | Trained on the Pune synthetic dataset (D-4, hard rule 5). Also a scikit-learn 1.8.0 pickle that warns on load under 1.6.1. |
| `ml/models/logistic_regression.pkl` | Same as above. |
| `ml/models/neural_network_mlp.pkl` | Same as above. |
| `ml/models/random_forest.pkl` | Same as above. |
| `ml/models/model_metadata.json` | Metrics computed on the synthetic formula labels; must not be shown anywhere (hard rule 4/5). |
| `ml/pipelines/train_pipeline.py` | Trains on Pune data with an 18-feature heart-disease schema that is not the SPEC §3.3 contract. Replaced by `ml/training/*` in P3. |
| `ml/pipelines/model_loader.py` | Loads the removed artifacts and contains `_heuristic_predict` / `_heuristic_explain`, which return made-up scores and "SHAP-like" factors (hard rule 4). Replaced in P3/P4. |
| `apps/api/services/dataset_service.py` | Only serves Pune metadata for the frozen `admin/datasets` page and the `/dataset/*` endpoints. Data card comes in P2. *(see open question Q3)* |
| `scratch/e2e_verification.py` | Prompt P0-3e. |
| `test_report.pdf` (repo root) | Prompt P0-3e. |
| `test_verify.pdf` (repo root) | Prompt P0-3e. |
| `structure.txt` (repo root) | 4 MB UTF-16 folder dump. **Untracked from git** (`git rm --cached`) and added to `.gitignore` per team instruction; the local file is left on disk. |
| `supabase/seed/demo_seed.sql` | Replaced by idempotent `supabase/seed/seed_demo.py` in P1 (SPEC §6). *Removed in P1, not P0* — listed here for completeness. |

### Freeze list (hidden + route guard "Not in MVP", SPEC §1.2)

`apps/web/src/app/voice/page.tsx`, `apps/web/src/app/consultation/[id]/page.tsx`,
`apps/web/src/app/admin/model-lab/page.tsx`, `apps/web/src/app/admin/datasets/page.tsx`,
`apps/web/src/app/health-insights/page.tsx`, plus the voice API surface
(`apps/api/schemas/voice.py` and the `/voice/*` routes, see Q2).

---

## 2. File-by-file audit

### 2.1 `apps/api`

| File | Class | P0 action | Later | Why |
|---|---|---|---|---|
| `apps/api/Dockerfile` | Keep | — | — | Hosting not needed (D-21); harmless. |
| `apps/api/main.py` | Keep | — | P1 (auth deps) | App wiring is fine. |
| `apps/api/requirements.txt` | Fix | Add `reportlab`; pin versions | — | `reportlab` used by `report_service.py` but missing (P0-3f). |
| `apps/api/core/config.py` | Fix | Point synthetic paths at `data/synthetic/` (or drop them if Q3 = remove) | P1 (JWT settings, DEMO_PASSWORD) | Dataset path changes with the move to `data/synthetic/`. |
| `apps/api/routers/v1/__init__.py` | Keep | — | — | Router aggregator. |
| `apps/api/routers/v1/health.py` | Keep | — | — | Honest status endpoint. |
| `apps/api/routers/v1/assessment.py` | Rebuild | Remove trust-passport route's hardcoded fallback; `/assessment` + `/what-if` return an honest "models not available until Phase 3" error *(Q1)* | P4 | Old 18-feature schema; no real model exists after P0. |
| `apps/api/routers/v1/assistant.py` | Fix | Keep `/assistant/message`; voice routes frozen *(Q2)* | P8 | — |
| `apps/api/routers/v1/doctors.py` | Fix | — *(LiveKit/WebRTC code: Q2)* | P1 (Supabase), P6 (review queue), P9 | Doctor/appointment routes are kept features (F9, F10); query-param `user_id`/`role` must become JWT-based in P1. |
| `apps/api/routers/v1/models.py` | Fix | Remove hardcoded `/governance/{id}` "COMPLIANT" response; remove `/dataset/*` routes | P6 | Returns invented governance status (hard rule 4). |
| `apps/api/routers/v1/profile.py` | Fix | — | P1 | In-memory profile store with fake demo person ("Rajesh Sharma", phone). |
| `apps/api/routers/v1/reports.py` | Fix | Remove hardcoded `explanation_data` ("TreeSHAP", "+8.2%"…) and Jev routing call | P9 | Fake SHAP numbers in the PDF (hard rule 4). |
| `apps/api/schemas/__init__.py` | Fix | Drop exports of removed schemas | P4 | — |
| `apps/api/schemas/appointment.py` | Keep | — | P9 | Kept feature F9. |
| `apps/api/schemas/assessment.py` | Rebuild | — | P4 | Old heart-disease feature set; replaced by 14-feature contract. |
| `apps/api/schemas/assistant.py` | Fix | — | P8 | Shape mostly reusable. |
| `apps/api/schemas/doctor.py` | Keep | — | P9 | Kept feature F9. |
| `apps/api/schemas/governance.py` | Fix | — | P6 | Fields like `fairness_compliance_rate` imply compliance claims. |
| `apps/api/schemas/health_profile.py` | Fix | — | P5 | Trim to feature contract (SPEC F3). |
| `apps/api/schemas/models.py` | Fix | — | P3/P6 | Registry shape; fed from `model_meta.json` later. |
| `apps/api/schemas/profile.py` | Keep | — | P1 | Fine. |
| `apps/api/schemas/review.py` | Rebuild | — | P6 | Review queue + override log are new. |
| `apps/api/schemas/trust_passport.py` | Rebuild → **Removed** (see §5) | Deleted | P7 | Built around invented metrics. |
| `apps/api/schemas/voice.py` | Freeze | — | — | Voice is frozen (SPEC §1.2). *(Q2)* |
| `apps/api/services/__init__.py` | Fix | Drop `DatasetService`; keep others | — | — |
| `apps/api/services/base.py` | Fix | Remove interfaces for removed services | — | Interfaces only. |
| `apps/api/services/prediction_service.py` | Rebuild | Delete `_init_demo_assessments` (hardcoded 18.1 / 34.6 / 42.8, "Platt Isotonic"), `_heuristic_predict`, hardcoded TreeSHAP/fairness 0.93/Brier 0.082/confidence 0.91 in `TrustPassportService`. Keep `determine_human_review` (deterministic gate). | P4 | Core of the fake-number problem. |
| `apps/api/services/assistant_service.py` | Rebuild | Remove Gemini path and `GEMINI_*` reads (team instruction), remove Jev import (TODO → P8). Keep emergency gate + deterministic fallback. Remove "TreeSHAP"/"11-dimension" text. | P8 | External API (hard rule 6); false claims. |
| `apps/api/services/doctor_service.py` | Fix | — | P1, P6, P9 | In-memory doctors/appointments/reviews → Supabase. |
| `apps/api/services/governance_service.py` | Fix | Remove hardcoded summary (1420 assessments, 98.4% fairness, "FAIRNESS_AUDIT_PASS 0.93") → return honest zero/"not available" | P6 | Invented numbers. |
| `apps/api/services/jev_service.py` | **Remove** | Delete | — | D-16. |
| `apps/api/services/dataset_service.py` | **Remove** | Delete *(Q3)* | — | Serves frozen page only. |
| `apps/api/services/report_service.py` | Fix | Remove claim strings ("Platt", "TreeSHAP", Jev routing block) | P9 | Keep reportlab layout. |

### 2.2 `apps/web`

| File | Class | P0 action | Later | Why |
|---|---|---|---|---|
| `apps/web/.gitignore`, `AGENTS.md`, `CLAUDE.md`, `README.md`, `Dockerfile`, `eslint.config.mjs`, `next.config.ts`, `package.json`, `package-lock.json`, `postcss.config.mjs`, `tsconfig.json` | Keep (11 files) | — | — | Config / tooling. `apps/web/README.md` is the create-next-app default — harmless. |
| `apps/web/public/*.svg` (5 files: file, globe, next, vercel, window) | Keep | — | — | Default assets; unused but harmless. *(could remove — not required)* |
| `src/app/favicon.ico`, `src/app/globals.css`, `src/app/layout.tsx` | Keep (3) | — | — | Shell. |
| `src/app/page.tsx` (landing) | Fix | Remove "11 rigorous dimensions", SHAP, "demographic parity audited" claims | P7 | False claims. |
| `src/app/dashboard/page.tsx` | Fix | Remove "Platt Isotonic Calibrated", "11 governance dimensions"; empty state when no assessment | P5 | — |
| `src/app/history/page.tsx` | Fix | Remove hardcoded history rows ("Platt Isotonic"); empty state | P5 | — |
| `src/app/health-profile/page.tsx` | Fix | Remove "demographic parity audits across Pune subgroups" | P5 | Trim to feature contract later. |
| `src/app/risk-assessment/page.tsx` | Rebuild | Remove hardcoded `cp, fbs, restecg, exang, oldpeak, slope, ca, thal`; show honest "assessment is being rebuilt" state *(Q1)* | P5 | Hard rule 3. |
| `src/app/ai-trust/page.tsx` | Rebuild | Strip hardcoded metrics; honest "Trust Passport will be generated from real model cards" empty state | P7 | 26 claim hits. |
| `src/app/ai-assistant/page.tsx` | Rebuild | Remove claim text only | P8 | — |
| `src/app/onboarding/page.tsx` | Rebuild | Remove claim text only | P1/P7 | Single consent checkbox, default `true` → purpose-specific consent (SPEC §2.2). |
| `src/app/settings/page.tsx` | Fix | Remove "Gradient Boosting (Trained ML)", "Platt", "≥80% parity", "TreeSHAP" | P7 | "My data" centre later. |
| `src/app/reports/page.tsx` | Fix | Remove "Platt Isotonic confidence intervals, local TreeSHAP" | P9 | — |
| `src/app/care-connect/page.tsx` | Fix | Check/remove claim text | P9 | — |
| `src/app/appointments/page.tsx` | Fix | Check/remove claim text | P9 | — |
| `src/app/doctor/dashboard/page.tsx` | Fix | Hardcoded `reviewQueue` / `todaysAppointments` arrays → empty state | P6 | Fake data. |
| `src/app/doctor/patients/page.tsx` | Fix | Remove "SHAP feature attributions", "Platt Calibrated" | P6 | — |
| `src/app/doctor/appointments/page.tsx` | Fix | Check/remove claim text | P6 | — |
| `src/app/admin/dashboard/page.tsx` | Fix | Remove hardcoded `0.91`, "Demographic Parity" | P6 | — |
| `src/app/admin/governance/page.tsx` | Fix | Remove hardcoded `0.93` | P6 | — |
| `src/app/admin/model-lab/page.tsx` | **Freeze** | Hide + guard | — | SPEC §1.2. |
| `src/app/admin/datasets/page.tsx` | **Freeze** | Hide + guard | — | SPEC §1.2. |
| `src/app/health-insights/page.tsx` | **Freeze** | Hide + guard | — | SPEC §1.2 (merged into results). |
| `src/app/voice/page.tsx` | **Freeze** | Hide + guard | — | SPEC §1.2. |
| `src/app/consultation/[id]/page.tsx` | **Freeze** | Hide + guard | — | SPEC §1.2. |
| `src/app/auth/login/page.tsx`, `auth/signup/page.tsx`, `auth/forgot-password/page.tsx`, `auth/reset-password/page.tsx` | Rebuild (4) | — | P1 | Supabase Auth; no doctor/admin signup. |
| `src/app/login/patient/page.tsx`, `login/doctor/page.tsx`, `login/admin/page.tsx` | Rebuild (3) | — | P1 | Role from `profiles`, not from the page picked. |
| `src/components/layout/Sidebar.tsx` | Fix | Remove frozen pages from nav (incl. "Model Laboratory", voice, health-insights) | P1 (roles) | — |
| `src/components/layout/AppShell.tsx` | Fix | Add "Not in MVP" route guard for frozen routes | P1 | — |
| `src/components/layout/Footer.tsx` | Fix | Check/remove claim text | — | 2 hits. |
| `src/components/layout/BrandLogo.tsx`, `Topbar.tsx` | Keep (2) | — | — | Hit in BrandLogo is an SVG comment ("shaped"), not a claim. |
| `src/components/ui/*.tsx` (Button, Card, EmptyState, Input, LanguageSelector, Select, StatCard, StatusBadge) | Keep (8) | — | — | UI kit. |
| `src/lib/api-client.ts` | Fix | — | P1 | Must send Supabase JWT. |
| `src/lib/auth-context.tsx` | Rebuild | — | P1 | localStorage fake login; user picks own role. |
| `src/lib/i18n.tsx` | Keep | — | P9 | — |
| `src/lib/supabase/client.ts` | Keep | — | P1 | — |
| `src/messages/en.json`, `hi.json`, `mr.json` | Fix (3) | Remove claim strings (11 / 3 / 3 hits) | P9 | — |

### 2.3 `ml/`

| File | Class | P0 action | Later | Why |
|---|---|---|---|---|
| `ml/models/*.pkl` (4), `ml/models/model_metadata.json` | **Remove** (5) | Delete | P3 → `ml/artifacts/<disease>/` | Pune-trained (D-4). |
| `ml/pipelines/train_pipeline.py` | **Remove** | Delete | P3 → `ml/training/` | Pune-trained, wrong feature set. |
| `ml/pipelines/model_loader.py` | **Remove** | Delete | P3/P4 | Heuristic fallback invents scores. |
| `ml/requirements.txt` | New | Create, pinned | — | P0-3f. |

### 2.4 `supabase/`

| File | Class | P0 action | Later | Why |
|---|---|---|---|---|
| `supabase/migrations/20260927000001_initial_schema.sql` | Keep | — | P1 adds a new migration on top (never edit this one) | 23 tables incl. `consents`, `audit_logs`. |
| `supabase/seed/demo_seed.sql` | Remove (in P1) | — | P1 → `seed_demo.py` | Doctor names in SQL differ from SPEC §6 (`dr.joshi`, `dr.khan`, `dr.patil`). |

### 2.5 `tests/`

| File | Class | P0 action | Later | Why |
|---|---|---|---|---|
| `tests/test_endpoints.py` | Fix | Delete/rewrite tests of removed behaviour: `test_assessment_endpoint`, `test_trust_passport_endpoint`, `test_what_if_simulation`, `test_models_registry`, `test_governance_summary`, `test_report_pdf_generation`, `test_assessment_history`, `test_patient_data_isolation` (depends on in-memory store) — exact list confirmed after edits | P1, P4 | Tested fake data paths. |
| `tests/test_schemas.py` | Fix | `test_clinical_model_features_*` tests old schema — keep until P4 replaces it | P4 | — |

### 2.6 Repo root and `data/`

| File | Class | P0 action | Why |
|---|---|---|---|
| `README.md` | Rebuild | Rewrite to describe only what exists; "Not a diagnostic tool"; "Project status: MVP in progress" | P0-3g. |
| `.env.example` | Fix | Add `DEMO_PASSWORD`, `SUPABASE_ACCESS_TOKEN` (optional) with comments. (`TYPESAFE_*`/`GEMINI_*` are not in this file; they were read via `os.environ` in Jev/assistant code, removed there.) | Team instruction. |
| `.gitignore` | Fix | Add `structure.txt`, `data/raw/`, `data/processed/` | P0-3d + team instruction. |
| `docker-compose.yml` | Keep | — | Hosting not needed (D-21). |
| `package.json`, `package-lock.json` | Keep | — | Root scripts. `train:ml` script points at removed pipeline → update to "not available until P3" *(or remove the script)*. |
| `docs/DEMO_SCRIPT.md` | Keep for now | — | Old script with false claims; P10 rewrites it (team did not ask to remove in P0). |
| `data/README.md` | Fix | Update paths | — |
| `data/raw/Pune_Clinical_Risk_*.csv/.txt` (3) | Move | → `data/synthetic/` + README: synthetic, demo and stress-test use only (D-4) | P0-3d. |

---

## 3. Open questions for the team (answer before "go")

- **Q1 — Assessment after P0.** Once the Pune models and the heuristic fallback are removed, there is
  no model until P3/P4. Proposed: `/api/v1/assessment` and `/what-if` return HTTP 503
  `"Risk models are not available yet"`, and the risk-assessment page shows an honest
  "being rebuilt" notice instead of the old form. (Alternative would be a fake path — not allowed.)
- **Q2 — Backend for frozen features.** P0 only freezes *pages*. Proposed: also return 404/"Not in
  MVP" from `/voice/*` routes, and leave the WebRTC signalling + LiveKit `video-token` code in
  `doctors.py` untouched but unused (it only reads `LIVEKIT_*` if set). Or should I remove the
  LiveKit/WebRTC/voice backend code and the `OPENAI_*`, `LIVEKIT_*`, `VOICE_PROVIDER_*`,
  `MAPS_PROVIDER_*` lines from `.env.example` now?
- **Q3 — `dataset_service.py` + `/dataset/*` routes.** Only used by the frozen datasets page.
  Proposed: remove. Alternative: keep and repoint at `data/synthetic/`.

---

## 4. Team answers (2026-10-26)

- **Q1:** approved. `/assessment` and `/what-if` return HTTP 503; the risk page shows a "being rebuilt" notice.
- **Q2:** frozen backend routes answer "Not in MVP / under development" (HTTP 503).
- **Q3:** delegated to Claude → `dataset_service.py` and `/dataset/*` removed.

## 5. P0 outcome — what was actually done, and deviations from §2

| Item | Planned (§2) | Done | Why |
|---|---|---|---|
| `apps/api/schemas/trust_passport.py` | Rebuild (P7) | **Removed** | After the Trust Passport service was deleted nothing used it, and nearly every default was an invented metric (Brier 0.084, parity 0.94, "Platt Isotonic", "TreeSHAP"). CLAUDE.md: prefer deleting misleading code. P7 writes a new schema. |
| `apps/api/schemas/health_profile.py` | Fix (P5) | Fixed now: every medical / lifestyle field is **required** (no defaults) | It silently filled `cp=4, thal=3, ca=0, oldpeak=0`, BP 120, cholesterol 190 — hard rule 3. Test `test_missing_medical_input_is_rejected_not_defaulted` covers it. |
| `apps/api/schemas/review.py` | Rebuild (P6) | `data_quality_score` default 96.5 → `None` | Invented number. |
| `apps/api/schemas/governance.py` | Fix (P6) | `fairness_compliance_rate`, `data_quality_index` now optional (`None` = not computed) | No placeholder numbers. |
| `apps/api/routers/v1/doctors.py` video endpoints | Leave code unused (Q2 proposal) | WebRTC signalling relay + LiveKit token **bodies removed**; routes return "Not in MVP" | Dead code behind a 503; recoverable from git (`7dcfee6`). |
| `apps/api/services/doctor_service.py` | Fix (P1) | Seeded demo appointment and two fake reviews (hardcoded scores 42.8 / 34.6) removed | Invented scores. Demo doctor directory kept (labelled demo). |
| `apps/api/services/governance_service.py` | Fix | Hardcoded registry metrics (ROC-AUC 0.80…), summary numbers and seeded demo health profile removed | Hard rules 3–5. |
| `apps/api/services/assistant_service.py` | Rebuild (P8) | Gemini + Jev removed; `VoiceService` (fake transcript, confidence 0.96) removed; fixed replies rewritten in EN/HI/MR | Hard rules 4 and 6. HI/MR listed in `docs/i18n_review.md`. |
| `apps/web/src/app/health-profile/page.tsx` | Fix (P5) | **Replaced by a "being rebuilt" notice** | Pre-filled invented clinical values and asked for socioeconomic band (hard rules 3, 10). |
| `apps/web/src/app/history/page.tsx` | Fix | Rewritten: real API data only, empty state | Hardcoded fallback assessments and default vitals (`|| 132`, `|| 181`). |
| `apps/web/src/app/doctor/dashboard`, `admin/dashboard`, `admin/governance` | Fix (P6) | Rewritten to show only API counts / "not available" | Every number on them was hardcoded. |
| `apps/web/src/app/ai-trust/page.tsx` | Rebuild (P7) | Replaced by a "not available yet" notice | All metrics hardcoded. |
| Frozen-route guard | AppShell guard | **`layout.tsx` in each frozen segment** rendering `FrozenRouteNotice` | An AppShell guard still mounted the frozen page (the consultation page would request camera/microphone). A layout that does not render `children` prevents mounting. |
| `apps/web/src/components/layout/Footer.tsx` | Fix | Removed links to frozen pages and to pages that do not exist (`/privacy`, `/terms`, `/about`, `/how-it-works`, `/accessibility` "WCAG 2.2") | Broken links / unverified claim. |
| `apps/web/src/messages/*.json` | Fix | Unused `risk.*` claim keys and the unused `trust` namespace removed; new `status.*` keys added; `care.verifiedNotice` now says "Demo clinician profile (not a real doctor)" | Keys are identical across en/hi/mr. |
| `.env.example` third-party vars | Q2 | Kept, under a "NOT USED in the MVP" comment | Team did not ask to delete them; nothing reads them. |

### Known remaining issues (not fixed in P0)

- `npm run lint` had **4 errors that existed before P0** (`react-hooks/set-state-in-effect`). Fixed in P0 at the
  team's request: `auth-context.tsx` now reads the demo session with `useSyncExternalStore` (logout now persists
  across reload instead of silently re-logging in as the demo patient); `auth/login` uses the "adjust state when a
  prop changes" pattern; `voice` and `consultation` start browser APIs from a callback with a cancellation flag.
  Lint: 0 errors, 184 warnings (mostly `no-explicit-any`, pre-existing).
- `apps/web/src/app/onboarding/page.tsx` still pre-selects some Yes/No answers (e.g. hypertension "Yes"). Nothing on
  that page is sent to the API; the page is rebuilt with purpose-specific consent in P1/P7. Consent checkbox
  default changed to unticked, BP/cholesterol pre-fills blanked.
- `ml/requirements.txt` and pinned `apps/api/requirements.txt` were checked with `pip install --dry-run`
  (binary wheels, Python 3.11 and 3.13, Windows and Linux), not installed into a clean venv.
