# VITALNEX — 10-minute demo script

*Phase P10, 2026-10-29. Replaces the earlier hackathon script, which described features and
numbers that did not exist (synthetic-data training, "95% CI" per patient, "Platt scaling",
model lab). Everything below uses the real demo accounts and what the code actually does.*

**Before the demo (5 minutes, once):**

1. `python supabase/seed/seed_demo.py` then `python supabase/seed/seed_history.py`. Check that the
   second script prints `patient1@vitalnex.demo: … see_doctor_soon (queued)` and that patient2 and
   patient4 print `not_confident (queued)`.
2. Start the API (`uvicorn apps.api.main:app --port 8000`) and the web app
   (`npm --prefix apps/web run dev`). Open <http://localhost:3000>.
3. Use two browser windows (one normal, one private) so a patient and a clinician can be signed in
   at the same time. Password for every account = `DEMO_PASSWORD` from `.env`.
4. Say once, at the start: *"All accounts are synthetic demo accounts. VITALNEX is a screening and
   care-navigation prototype, not a diagnosis."*

**Honest caveat for the presenter:** the signed-in pages have been checked through API tests,
lint and build, not by an automated browser run. Do a full dry run before presenting.

---

## Timing

| # | Segment | Time | Account |
|---|---|---|---|
| 1 | What VITALNEX is / is not | 0:00 – 0:45 | public |
| 2 | Patient flow in Marathi | 0:45 – 2:45 | `patient3@vitalnex.demo` |
| 3 | High result → clinician override | 2:45 – 4:45 | `patient1@` + `dr.joshi@vitalnex.demo` |
| 4 | Abstained ("not confident") case | 4:45 – 5:30 | `patient4@vitalnex.demo` |
| 5 | Emergency in the assistant | 5:30 – 6:30 | `patient3@vitalnex.demo` |
| 6 | Trust Passport + principle map | 6:30 – 8:00 | public |
| 7 | QR share + revoke | 8:00 – 9:00 | `patient1@vitalnex.demo` |
| 8 | Consent withdrawal | 9:00 – 10:00 | `patient1@` + `dr.joshi@` |

---

## 1. What VITALNEX is / is not (0:00 – 0:45)

- Open the landing page `/`.
- *"VITALNEX asks 14 simple questions in English, Hindi or Marathi and tells you how similar your
  answers are to people who have been told they have diabetes, heart disease or stroke — and what
  kind of care to seek, and how soon. It never diagnoses, never names a medicine, and if you
  describe emergency symptoms it tells you to call 108 or 112 before anything else."*
- *"Models are small, trained on 253,680 rows of the US CDC BRFSS 2015 survey, and run on this
  laptop. No health data goes to any outside AI service."*

## 2. Patient flow in Marathi (0:45 – 2:45)

- Sign in at `/login/patient` as **`patient3@vitalnex.demo`** (a Marathi-speaking demo patient).
  Switch the UI to **मराठी** with the EN / HI / MR language switch (the stored preferred language
  is not applied automatically at sign-in, so do this by hand).
- Open **Risk assessment** (`/risk-assessment`). Point out: age and sex come from the health
  profile; nothing is pre-filled with "normal" values — an unanswered question stays unanswered.
- Answer the questions (any plausible answers) and submit.
- On the results view, show for each of the three conditions: the level, **"Why this result?"**
  (top factors, fixed sentences from SHAP), **"What can I change?"** (only changeable factors;
  age, sex and "told by a doctor" facts are never suggested), **"How sure is VITALNEX?"**, and the
  next step.
- Open the **what-if** panel: change weight or activity and show the level re-computed by the
  same models. *"This is model behaviour, not medical advice."*
- If the patient is under 40, point out the note: results are less reliable for people under 40.
- *Do not promise a particular level here; the result depends on the answers you type.*

## 3. High result → clinician override (2:45 – 4:45)

- Patient window: sign in as **`patient1@vitalnex.demo`** → **History** (`/history`). The latest
  demo visit shows **"See a doctor soon"** and "A clinician will review this result." (This visit
  was made by running the real models on invented demo answers: high blood pressure, high
  cholesterol, smoker, poor general health, difficulty walking.)
- Clinician window: sign in at `/login/doctor` as **`dr.joshi@vitalnex.demo`** →
  **Patients / review queue** (`/doctor/patients`). The case is listed with reason **High band**.
  *"A clinician only sees patients who consented to share; the database enforces this with Row
  Level Security, not just the page."*
- Open the case (`/doctor/cases/<id>`): inputs, calibrated probabilities, the conformal set, top
  factors, history. *"The clinician sees uncertainty and factors, so they can disagree."*
- Choose **Override** for one condition, pick a new level and a **reason** (e.g. "Clinical
  history not captured"), add a note, save. Show that saving without a reason is not possible.
- Patient window: reload History → the visit shows **"Reviewed by a clinician"** with the note.
- Optional: sign in as **`admin@vitalnex.demo`** → **Governance** (`/admin/governance`) → the
  override appears in the override log with clinician, model version and time. *"Overrides are
  an accountability log. They are never used to retrain the model."*

## 4. Abstained case (4:45 – 5:30)

- Sign in as **`patient4@vitalnex.demo`** → **History**. The demo visits show **"VITALNEX is not
  confident for you. Please see a doctor."** with no score for the abstained condition.
- *"When the conformal check says the model could go either way, or the answers are unlike the
  training data, VITALNEX shows no number at all. On the test set that happens for 37 to 44% of
  people depending on the condition — we accepted that rather than show false precision. Those
  cases go to the clinician queue."* (Values: `conformal_test.abstention_rate_total` in each
  `model_meta.json`.)
- Clinician window: the same patient appears in the queue with reason **Abstained**.

## 5. Emergency in the assistant (5:30 – 6:30)

- As `patient3`, open **AI assistant** (`/ai-assistant`). Type **`छातीत दुखतंय`** ("my chest
  hurts", Marathi). The **108 / 112 emergency card** appears at once.
- Type **`seene mein dard`** (romanised Hindi) → same card.
- Ask for a medicine dose (e.g. "what dose of metformin should I take?") → the assistant refuses
  and suggests a doctor or pharmacist. *"It never names or doses a medicine."*
- *"Replies are fixed, pre-written text; there is no generative model, so it cannot make up
  medical advice. The assistant model runs locally. On an untouched hold-out of 30 emergency
  messages the full pipeline caught 29; the missed Marathi wording has since been added to the
  rules."* (`nlp_meta.json: emergency_holdout`, D-25.)
- Optional: in the assessment free-text box, typing an emergency phrase gives the emergency
  result with no scores at all.

## 6. Trust Passport + principle map (6:30 – 8:00)

- Open **`/ai-trust`** (public, no sign-in). Walk through: data, models (AUROC with 95% CIs,
  calibration plots), **fairness**, abstention, how decisions are made, limitations, versions.
- **Fairness:** show the age gap. *"For people under 40 the models miss many more cases. We tried
  separate thresholds per age group: recall for young people went up, but 28 to 40% of them would
  have been flagged, almost all falsely. We chose to show the gap and warn users under 40 instead."*
  (`docs/fairness_mitigation.md`, D-24.)
- **Principle map:** scroll to the NITI Aayog principles. Open the evidence for **Safety and
  Reliability** (coverage per class, abstention rate, emergency trigger count) and
  **Accountability** (override rate by disease — it now includes the override from step 3).
  *"Every value is computed live from the model files or the database. If something is not
  recorded, it says 'not available' — like recourse usage."*

## 7. QR share + revoke (8:00 – 9:00)

- As `patient1`, open **Reports** (`/reports`). Download the PDF report (EN/HI/MR, with the
  "This is not a diagnosis" notice).
- Create a **share**: choose sections and an expiry (1 hour / 24 hours / 7 days). A link and QR
  code appear. Open the link in the other window: the shared record shows levels and next steps,
  "shared by the patient, expires at …", and no probabilities.
- Back on Reports, **Revoke** the share. Reload the shared link → it no longer opens.
  *"Only a hash of the token is stored; every open is logged and visible to the patient."*

## 8. Consent withdrawal (9:00 – 10:00)

- As `patient1`, open **Settings → My data** (`/settings`). Show the four purposes, each with its
  own toggle and notice text.
- Withdraw **Share with clinician**. Clinician window: reload `/doctor/patients` → patient1 is no
  longer visible. *"Withdrawal applies immediately, enforced in the database."*
- Withdraw **Store history** → `/history` shows the history as hidden.
- Show **Export my data** (JSON) and point out **Request deletion** (do not confirm it in the demo).
- **Afterwards, restore the demo:** re-grant both purposes, or re-run
  `python supabase/seed/seed_demo.py` and `python supabase/seed/seed_history.py`.

---

## If asked

- **"Is it accurate?"** Test AUROC 0.824 (diabetes), 0.842 (heart), 0.810 (stroke), on US survey
  data. Not validated on Indian people. See the Trust Passport and `docs/ERAI_REPORT.md`.
- **"Is it a medical device?"** It is designed as a screening and navigation aid with no
  diagnostic or treatment claims. Any real clinical use would need regulatory (CDSCO) review and
  validation first; we make no compliance claim.
- **"Where does the data come from?"** CDC BRFSS 2015 (UCI id 891). The Pune synthetic dataset is
  used only to give the demo patients an age and sex — never for training or metrics.
- **"Is the Hindi / Marathi checked?"** Not yet. All medical wording is listed for human review in
  `docs/i18n_review.md` and `docs/i18n_review_p8.md`.
