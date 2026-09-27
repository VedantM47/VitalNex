# VITALNEX — Health. Humanity. High-Tech.
### AI-Powered Healthcare Intelligence & Connected Care Platform

> **Clinical Research Disclaimer**: VITALNEX is an academic research and clinical decision-support prototype. It is calibrated on synthetic cardiometabolic screening data from the Pune metropolitan region. It does not provide medical diagnoses, prescribe medications, or replace certified healthcare practitioners. High-risk outputs and borderline cases require mandatory human-in-the-loop clinical review.

---

## 🌟 Key Highlights & Capabilities

1. **AI Trust Passport & Responsible AI (11 Dimensions)**
   - Transparent model governance with real-time explainability (feature attribution).
   - Platt isotonic scaling calibration & Brier scores for confidence bounds.
   - Demographic parity & equalized odds fairness auditing across age, sex, and socioeconomic subgroups.
   - Physiological safety guardrails and deterministic human-in-the-loop review triage.

2. **Multi-Model Clinical Risk Machine Learning Suite**
   - Trained on 20,000 synthetic clinical records (`data/raw/Pune_Clinical_Risk_Synthetic_Dataset_20000.csv`).
   - Ensemble of 4 architectures: **Logistic Regression**, **Random Forest**, **Gradient Boosting (Production)**, and **MLP Neural Network**.
   - Model Registry and offline artifact persistence (`ml/models/`).

3. **Connected Care Ecosystem**
   - **Triage & Emergency Assistant**: Rule-guided triage routing with automated red-flag detection.
   - **Care Connect & Telehealth**: Doctor discovery, verified credentials, and appointment scheduling.
   - **Voice Health Assistant**: Conversational screening with real-time speech and auditory responses.
   - **What-If Risk Simulator**: Interactive scenario modeling to assess how lifestyle modifications affect risk trajectory.
   - **Admin Governance Portal**: Dataset provenance inspection, bias metrics, and model registry management.

---

## 📂 Repository Structure

```
VITALNEX/
├── apps/
│   ├── api/                     # FastAPI backend
│   │   ├── core/                # Settings & middleware
│   │   ├── routers/v1/          # Endpoints (assessment, trust-passport, doctors, assistant, etc.)
│   │   ├── schemas/             # Pydantic v2 data contracts
│   │   └── services/            # Business logic & ML inference adapters
│   └── web/                     # Next.js 16 (App Router, Turbopack, TailwindCSS)
│       └── src/app/             # Pages (dashboard, risk-assessment, ai-trust, admin, care-connect, etc.)
├── data/
│   └── raw/                     # Synthetic Pune clinical dataset & data dictionaries
├── ml/
│   ├── models/                  # Serialized .pkl artifacts & model_metadata.json
│   └── pipelines/               # train_pipeline.py & model_loader.py
├── supabase/
│   └── migrations/              # Database schemas, RLS policies & seed data
├── tests/                       # Pytest test suite (100% passing)
└── README.md
```

---

## 🚀 Quickstart & Local Setup

### 1. Prerequisites
- Python 3.11+ (tested on Python 3.13)
- Node.js 18+ & npm

### 2. Environment Configuration
Create a `.env` file from `.env.example`:
```bash
cp .env.example .env
```

### 3. ML Pipeline Training
Train all 4 clinical risk models on the Pune synthetic dataset:
```bash
python -m ml.pipelines.train_pipeline
```
*Output: Serializes model artifacts and saves `ml/models/model_metadata.json` with subgroup fairness benchmarks.*

### 4. Running Backend Tests
```bash
python -m pytest tests -v
```

### 5. Starting the FastAPI Backend
```bash
uvicorn apps.api.main:app --reload --port 8000
```
- API Docs: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/api/v1/health`

### 6. Starting the Next.js Frontend
```bash
cd apps/web
npm run dev
```
- Application: `http://localhost:3000`

---

## 🛡️ Responsible AI & Governance

VITALNEX follows the WHO guidelines for AI in Health:
- **Ethics by Design**: Models do not auto-diagnose; all predictions are risk indices with confidence intervals.
- **Fairness Guarantee**: Audited against the 80% four-fifths demographic parity rule.
- **Explainability**: Both positive and negative risk contributors are surfaced for clinician review.
- **Human-in-the-Loop**: High-risk scores or data anomalies automatically transition to a `Pending` clinician review status.
