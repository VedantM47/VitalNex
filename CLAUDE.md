# VITALNEX — Project Context for Claude Code

Read this file fully before doing anything. Then read `docs/SPEC.md` and `docs/DECISIONS.md`.
The phase you are working on is given to you in the prompt (from `docs/PROMPTS.md`).

## What VITALNEX is

A multilingual (English / Hindi / Marathi) health **screening and care-navigation** platform for
**patients and clinicians**. It estimates how similar a person's self-reported profile is to people
who have **diabetes/prediabetes, heart disease (CHD or heart attack), and stroke**, explains the
main contributing factors, and tells the person **what kind of care to seek and how soon**.

It is an **MVP**. Users are **dummy accounts** only. It is **not** a diagnostic tool.

## What VITALNEX must never do (hard rules)

1. Never state or imply a diagnosis ("you have diabetes"). Use: "Your answers are similar to people
   who have been told they have …".
2. Never recommend, name or dose a medicine.
3. Never invent or silently default a medical input. If the user did not answer, it is missing —
   never fill in a "normal" value. (The old form fixed `ca=0, thal=3, oldpeak=0`; that was wrong.)
4. Never report a metric, claim, or label that the code did not actually compute. No "Calibrated"
   unless calibration ran; no "SHAP" unless SHAP ran. Every number shown in the UI must trace to
   `ml/artifacts/<disease>/model_meta.json` or a database row.
5. Never present the Pune synthetic dataset as real patient data, and never use it to train or
   evaluate the production models.
6. Never send user health data to any third-party API. All ML and NLP runs locally on the server.
7. Never let the model output alone decide anything irreversible. Safety rules run first; high-risk
   and uncertain results go to clinician review.
8. Emergency red flags always override everything else: show 108 / 112 immediately.
9. Never use clinician overrides or user data to retrain automatically.
10. Never collect data the product does not need (DPDP data minimisation). Income, education and
    healthcare-access are **not** asked in the app.

## Stack (keep what the repo already uses)

- Frontend: Next.js 16 (App Router) + React 19 + TailwindCSS + Recharts, in `apps/web`.
  **Next.js 16 has breaking changes** — read `apps/web/AGENTS.md` and the docs in
  `apps/web/node_modules/next/dist/docs/` before changing routing, data fetching or config.
- Backend: FastAPI + Pydantic v2, in `apps/api` (routers → services → schemas).
- Database + Auth: Supabase (Postgres + Auth + Row Level Security). Migrations in `supabase/migrations`.
- ML: Python, scikit-learn, LightGBM, PyTorch (CPU), SHAP, fairlearn. Code in `ml/`.
- NLP: `sentence-transformers` with `l3cube-pune/indic-sentence-bert-nli` (CC-BY-4.0), run locally.
- PDF: reportlab. QR: `qrcode` (Python) or `qrcode.react` (web).
- Everything must run on a **CPU-only laptop**. No GPU, no paid APIs.

## Repository layout (target)

```
apps/api/            FastAPI app (routers/v1, services, schemas, core)
apps/web/            Next.js app (src/app pages, components, messages/{en,hi,mr}.json)
ml/data/             data download + preparation scripts (raw data is git-ignored)
ml/training/         training, calibration, conformal, fairness, explainability
ml/artifacts/<d>/    model.joblib / mlp.pt, model_meta.json, model_card.md (d = diabetes|heart|stroke)
ml/nlp/              intent dataset, FAQ, encoder wrapper, intent classifier, evaluation
supabase/            migrations + seed
docs/                SPEC.md, DECISIONS.md, PROMPTS.md, model cards, ERAI report
tests/               pytest (api + ml), plus web tests if added
```

## Working rules

- Work on branch `renovate/mvp`. Commit at the end of each phase with a clear message. Do not push
  unless asked.
- Before writing code in a phase, list the files you will touch and why. After the phase, report:
  what changed, test results, anything that does not work, and any decision you had to make.
- If something in this spec is impossible, contradictory or would take far longer than planned,
  **stop and ask** instead of improvising. Never cover a gap with fake data or a fake success path.
- Prefer deleting dead or misleading code over keeping it "for later".
- Every user-facing string goes through i18n (`apps/web/src/messages/{en,hi,mr}.json`). Medical
  wording in Hindi/Marathi must be marked `"_review": "pending"` in a review list
  (`docs/i18n_review.md`) until a human confirms it.
- Keep secrets in `.env` (never commit). Update `.env.example` when adding a variable.
- Tests must pass before a phase is considered done: `python -m pytest tests -v` and `npm run lint`
  (and `npm run build` for frontend phases).

## Commands

```
python -m venv .venv && source .venv/bin/activate
pip install -r apps/api/requirements.txt -r ml/requirements.txt
python -m ml.data.download          # fetch BRFSS data (Phase 2)
python -m ml.data.prepare           # validate, split, hash (Phase 2)
python -m ml.data.data_card         # render docs/data_card.md
python -m ml.training.train_all     # train 3 diseases (Phase 3)
python -m ml.training.model_card    # re-render model cards from model_meta.json
python -m ml.nlp.train_intents      # train assistant intent model (Phase 8)
python supabase/seed/seed_demo.py     # demo accounts, doctors, slots, consents (idempotent)
python supabase/seed/seed_history.py  # demo assessment history from the real models
uvicorn apps.api.main:app --reload --port 8000
npm --prefix apps/web run dev
python -m pytest tests -v             # add --deselect tests/test_live_supabase.py to skip live DB tests
```

## Current status

Read `docs/PROGRESS.md` before starting work: it records which phases are done, uncommitted
work in progress, environment facts (Windows, global Python 3.13, live Supabase project, `.env`
must never be read) and open items. Update it at the end of every phase.
