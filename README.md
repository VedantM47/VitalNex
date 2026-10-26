# VITALNEX

**Project status: MVP in progress.** This repository is being rebuilt phase by phase
(see `docs/PROMPTS.md`). This README describes only what exists today.

> **Not a diagnostic tool.** VITALNEX is a screening and care-navigation prototype. It does not
> diagnose disease, does not name or dose medicines, and does not replace a doctor. All accounts
> are demo accounts. In an emergency call **108 / 112** (India).

## What VITALNEX is meant to be

A multilingual (English / Hindi / Marathi) platform for patients and clinicians. It estimates how
similar a person's self-reported answers are to people who have been told they have
diabetes/prediabetes, heart disease or stroke, explains the main factors, and suggests what kind
of care to seek and how soon. The full specification is in `docs/SPEC.md`; decisions are in
`docs/DECISIONS.md`.

## What works right now (after Phase P0)

| Area | State |
|---|---|
| Web app shell, navigation, EN/HI/MR language switch | Works |
| Risk screening | **Not available.** The old models were trained on a synthetic dataset and have been removed. `POST /api/v1/assessment` returns HTTP 503 until the new models are trained (P3) and wired in (P4). |
| Health profile | **Being rebuilt** (P5). The old form pre-filled clinical values. |
| AI Trust Passport | **Not available** until it can be generated from real model cards (P7). |
| Assistant | Emergency keyword check (shows 108 / 112) and a few fixed, pre-written replies. No external AI service is called. Rebuilt in P8. |
| Care Connect / appointments | Demo clinicians and demo bookings, in memory only (moves to Supabase in P1). |
| Clinician and admin pages | Show real counts from the API, which are zero until assessments exist. |
| Login | Demo-only, stored in the browser. Real Supabase Auth comes in P1. |
| Voice, video consultation, model lab, datasets, health insights | Frozen for the MVP. These pages show "Not in MVP". |

## Repository layout

```
apps/api/        FastAPI backend (routers/v1 → services → schemas, core/config)
apps/web/        Next.js 16 app (src/app pages, components, messages/{en,hi,mr}.json)
data/synthetic/  Pune Clinical Risk Synthetic Dataset — demo profiles and stress tests only (D-4)
ml/              ml/requirements.txt; training code arrives in P2/P3
supabase/        Database migration and old demo seed
tests/           pytest suite for the API
docs/            SPEC, DECISIONS, PROMPTS, AUDIT, i18n review list
```

## Running locally

Requirements: Python 3.11+, Node.js 20+.

```bash
# 1. Environment
cp .env.example .env          # fill in values; never commit .env

# 2. Backend
python -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r apps/api/requirements.txt
uvicorn apps.api.main:app --reload --port 8000
# API docs: http://localhost:8000/docs · health check: http://localhost:8000/health

# 3. Frontend (second terminal)
npm --prefix apps/web install
npm --prefix apps/web run dev
# App: http://localhost:3000

# Or run both from the repo root:
npm install && npm run dev

# 4. Tests
python -m pytest tests -v
npm --prefix apps/web run lint
```

`ml/requirements.txt` (scikit-learn, LightGBM, PyTorch CPU, SHAP, fairlearn, sentence-transformers …)
is only needed from Phase P2 onward.

## Data

- `data/synthetic/` holds a **synthetic** dataset made by the team. It contains no real patient
  data and is never used to train or evaluate the production models (decision D-4). See
  `data/README.md`.
- The real training data (CDC BRFSS Diabetes Health Indicators, UCI id 891) is downloaded in
  Phase P2 into `data/raw/`, which is git-ignored.

## Responsible AI

The rules VITALNEX follows are in `CLAUDE.md` ("What VITALNEX must never do"). In short: no
diagnosis wording, no medicine advice, no invented inputs, no metric that the code did not compute,
no health data sent to third-party APIs, emergency symptoms always override, and high-risk or
uncertain results go to a clinician.
