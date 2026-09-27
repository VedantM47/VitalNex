# VITALNEX — Official Hackathon Demo Script (3–5 Minutes)

> **Platform Tagline**: *Health. Humanity. High-Tech.*  
> **Key Value Proposition**: Transparent, fair, and responsible AI-powered clinical risk intelligence with connected care navigation.  
> **Target Audience**: Hackathon Judges, Clinicians, Health-Tech Evaluators.  
> **Safety Disclosure**: *Calibrated on synthetic academic research data from the Pune metropolitan region. Non-diagnostic decision support prototype.*

---

## ⏱️ Demo Timing Breakdown

| Segment | Time | Screen / Feature | Key Focus |
|---|---|---|---|
| **1. Hook & Introduction** | 0:00 – 0:35 | Landing Page (`/`) | The Problem with Black-Box Healthcare AI |
| **2. Patient Onboarding & Profile** | 0:35 – 1:05 | Patient Dashboard (`/dashboard`) → Health Profile (`/health-profile`) | Clean data capture, completeness score |
| **3. Risk Assessment & Model Output** | 1:05 – 1:40 | Assessment (`/risk-assessment`) | Real-time prediction with confidence intervals |
| **4. Star Innovation: AI Trust Passport** | 1:40 – 2:25 | AI Trust (`/ai-trust`) | 11 evidence dimensions, SHAP attribution, fairness parity |
| **5. Star Innovation: What-If Simulator** | 2:25 – 2:55 | What-If Simulation (`/risk-assessment` or `/dashboard`) | Real-time counterfactual model exploration |
| **6. Care Navigation & Doctor Matching** | 2:55 – 3:35 | Care Connect (`/care-connect`) → Appointments (`/appointments`) | Transparent specialty matching & video booking |
| **7. Governance & Model Lab** | 3:35 – 4:15 | Model Lab (`/admin/model-lab`) → Governance (`/admin/governance`) | 4-model benchmark & demographic fairness audit |
| **8. Wrap-up & Q&A Hook** | 4:15 – 4:45 | Landing / Live Consultation | "Health. Humanity. High-Tech." |

---

## 🎙️ Step-by-Step Script & Narration

### Step 1: Hook & Introduction (0:00 – 0:35)
- **URL**: `http://localhost:3000`
- **Action**: Scroll smoothly past the hero section to the 11 Trust Dimensions badge.
- **Narrator**:
  > *"Every year, hundreds of AI models are developed for healthcare, yet fewer than 2% make it into actual clinical workflows. Why? Lack of trust, fear of black-box bias, and the absence of human oversight.*  
  > *This is VITALNEX — where clinical intelligence meets human-centered transparency. VITALNEX bridges the gap between predictive ML, responsible AI governance, and actionable care navigation."*

---

### Step 2: Patient Health Profile & Risk Screening (0:35 – 1:05)
- **URL**: Click **"Try Live Demo"** or navigate to `/dashboard` → `/health-profile`.
- **Action**: Show pre-populated clinical features (Age: 55, Blood Pressure: 140, Cholesterol: 220, BMI: 28.5).
- **Narrator**:
  > *"Here is Rajesh, a 55-year-old patient in Pune. His profile captures physiological markers alongside lifestyle and context. Our data-quality engine pre-checks completeness and physiological boundaries before the model even runs."*

---

### Step 3: Run Assessment & View Prediction (1:05 – 1:40)
- **URL**: Navigate to `/risk-assessment`.
- **Action**: Click **"Run Clinical Assessment"**. Observe the prediction banner.
- **Narrator**:
  > *"With one click, our trained Gradient Boosted ensemble evaluates 18 clinical features. Notice: we never output an uncalibrated point prediction. We output a calibrated risk index — 62.2% Moderate Risk — accompanied by a 95% Confidence Interval [57.7% – 66.7%]."*

---

### Step 4: Star Feature 1 — The AI Trust Passport (1:40 – 2:25)
- **URL**: Click **"Inspect AI Trust Passport"** (`/ai-trust`).
- **Action**: Point out the 11 Trust Dimensions:
  1. *Explainability*: Feature attribution (Hypertension +26%, Age +22%, vs normal heart rate -5%).
  2. *Calibration & Uncertainty*: Brier score 0.082 with Platt scaling.
  3. *Fairness*: 93% Demographic parity across male/female and Pune urban/rural subgroups.
  4. *Human Review Gate*: Deterministic trigger flagged for clinician sign-off.
- **Narrator**:
  > *"This is our core innovation: The AI Trust Passport. Every single AI output is paired with cryptographic-grade auditability. We answer: Which model? How confident? What features contributed? Were subgroup fairness checks passed? And crucially: Does this require human oversight? Because Rajesh's risk is elevated, the Adaptive Review Gate automatically sets the case to 'Pending Clinician Review'."*

---

### Step 5: Star Feature 2 — What-If Model Simulator (2:25 – 2:55)
- **URL**: Click the **"What-If Scenario Simulator"** toggle.
- **Action**: Adjust Resting Blood Pressure from 140 to 120 mmHg and toggle smoking off. Click **"Recalculate Scenario"**.
- **Narrator**:
  > *"Patients often ask: 'What does this mean for me?' In our What-If simulator, users explore counterfactuals. If Rajesh stabilizes his blood pressure to 120 and cessates smoking, the model-estimated risk drops from 62% to 41%. We label this clearly: 'Model-Behavior Simulation — Not Medical Advice'."*

---

### Step 6: Care Navigation & Doctor Connect (2:55 – 3:35)
- **URL**: Navigate to `/care-connect`.
- **Action**: Filter by "Cardiologist", select **Dr. Ananya Joshi**, click **"Book Video Consultation"**.
- **Narrator**:
  > *"VITALNEX does not leave the patient stranded with numbers. Through Care Connect, we match the patient with verified local specialists in Pune. Transparent matching explains why this doctor was recommended: 'Cardiology specialist, speaks Marathi & English, available today'. With one tap, an appointment is scheduled."*

---

### Step 7: Governance & Model Lab (Admin View) (3:35 – 4:15)
- **URL**: Switch role to Admin or navigate to `/admin/model-lab` and `/admin/governance`.
- **Action**: Show the 4-model comparison table (Gradient Boosting, Logistic Regression, Random Forest, MLP) and fairness audit across 11 demographic cohorts.
- **Narrator**:
  > *"For clinical directors and regulatory officers, the Model Lab provides transparency into model provenance. All 4 architectures trained on our 20,000 Pune cohort are benchmarked here — from ROC-AUC to equalized odds disparity across age and socioeconomic brackets."*

---

### Step 8: Wrap-up & Hackathon Closer (4:15 – 4:45)
- **Narrator**:
  > *"VITALNEX is not another black-box symptom checker. It is an end-to-end framework where artificial intelligence respects clinical boundaries, earns patient trust through evidence, and keeps human clinicians in the loop.*  
  > *Health. Humanity. High-Tech. Thank you!"*

---

## 💡 Quick Tips for the Presenter

1. **Keep Demo Mode Active**: Everything runs locally without requiring live third-party API keys or internet access.
2. **If Asked About Medical Device Regulations**: State clearly: *"VITALNEX is designed under SaMD (Software as a Medical Device) research guidelines as a Class I/II decision-support prototype. It enforces human-in-the-loop signoff and never auto-prescribes."*
3. **If Asked About Real Patient Data**: State: *"We train on a synthetic dataset derived from validated Pune regional demographic parameters to prevent patient privacy exposure."*
