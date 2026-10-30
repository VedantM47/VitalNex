import type { DocPage } from "../types";

// Sources: docs/SPEC.md, docs/DECISIONS.md, docs/PROGRESS.md, README.md, apps/web/src/messages/en.json,
// apps/web/src/lib/{i18n.tsx,api-client.ts}, apps/web/src/app/{settings,risk-assessment,auth/login}/page.tsx,
// apps/api/main.py, apps/api/core/config.py, ml/artifacts/<disease>/model_meta.json.

const page: DocPage = {
  slug: "faq",
  title: "FAQ, troubleshooting and glossary",
  summary:
    "Short answers to the questions patients, clinicians and admins ask most, a table of common problems when you run VITALNEX on your own laptop, and a list of the words used across these docs in very simple language.",
  audience: "Everyone",
  blocks: [
    { type: "h2", id: "how-to-use-this-page", text: "How to use this page" },
    {
      type: "p",
      text: "This page has three parts. **Part 1** answers common questions, grouped by who is asking: patients, clinicians (doctors) and admins. **Part 2** is a troubleshooting table for people who run the app on their own computer. **Part 3** is a glossary: a list of words with a plain meaning for each.",
    },
    {
      type: "p",
      text: "Every answer here describes what the app really does today. If you want the full story of a feature, follow the link to its own page, for example [Risk assessment](/admin/docs/risk-assessment) or [Clinician workspace](/admin/docs/clinician-workspace).",
    },
    {
      type: "callout",
      kind: "danger",
      title: "Emergency first",
      text: "VITALNEX is not an emergency service. If someone has chest pain, signs of a stroke (face drooping, arm weakness, difficulty speaking) or severe breathlessness, call **108** or **112** (the emergency numbers in India) now. Do not wait for a screening result.",
    },
    {
      type: "callout",
      kind: "info",
      title: "Demo only",
      text: "VITALNEX is an MVP (a first, small working version). All accounts, doctors and appointment slots are synthetic (made up). Do not enter real personal health information.",
    },

    // ---------------------------------------------------------------- Part 1: FAQ
    { type: "h2", id: "patients-faq", text: "Questions from patients" },
    {
      type: "p",
      text: "These are the questions a patient is most likely to ask while using the screening, the results, the history and the consent settings.",
    },
    {
      type: "faq",
      items: [
        {
          q: "Is this a diagnosis?",
          a: "No. VITALNEX is a **screening** and **care-navigation** tool. It does not say that you have a disease. It says how similar your answers are to people who have been told they have diabetes or prediabetes, heart disease or a heart attack, or a stroke. For example: \"Your answers are similar to people who have been told they have a stroke.\" Only a doctor can diagnose you.",
        },
        {
          q: "What do Low, Moderate and High mean?",
          a: "They are **screening levels**. Low means your answers are less similar to people who have the condition. Moderate means somewhat similar. High means similar. Each level comes with a **next step**: keep up regular check-ups (all Low), discuss it at your next check-up (any Moderate), or see a doctor soon, within 2 weeks (any High).",
        },
        {
          q: "Does Low mean I have no risk?",
          a: "No. Low does not mean no risk. In testing, some people who had been told they have a condition were still placed in Low. The share that was caught (placed in Moderate or High) was 0.855 for diabetes, 0.838 for heart disease and 0.792 for stroke (`recall_at_t_mod` in `ml/artifacts/<disease>/model_meta.json`). So roughly 15 to 21 out of every 100 such people were shown as Low. The result page tells you this number for each condition.",
        },
        {
          q: "Why does my result say \"Not confident — see a doctor\"?",
          a: "Sometimes the model is not sure. This can happen in two ways: your answers fall where the model could go either way (a check called **conformal prediction** says both outcomes are possible), or your answers are unlike most people the model learned from (an **out-of-distribution** check). When that happens VITALNEX shows **no level** for that condition, only \"Not confident — see a doctor\". This is on purpose: showing a level the model is not sure about would be false precision (decision D-10, D-22). In testing this happened for about 37% (diabetes), 39% (heart) and 44% (stroke) of people.",
        },
        {
          q: "Can I skip a question?",
          a: "In the **screening form**, no. Every one of the questions must be answered before you can see a result. If you leave one empty, the form shows \"Please answer this question.\" This is a safety rule: VITALNEX never fills in a \"normal\" value for you, because a made-up answer could give a wrong result. Two things are optional: the symptom ticks (you only tick what is true) and the free-text box \"Anything else you want to tell us?\". In your **Health profile** page every answer is optional; an empty answer simply stays empty and is not used to fill the form.",
        },
        {
          q: "Why do some answers show \"From your profile\"?",
          a: "If you saved answers in **My health** (the Health profile page), the screening form fills them in for you and marks them \"From your profile\". Please check each one before you continue. Questions you left empty in your profile stay empty in the form.",
        },
        {
          q: "What do 108 and 112 mean?",
          a: "They are emergency phone numbers in India. **108** is the ambulance and emergency medical service number. **112** is the national all-in-one emergency number. If you tick an emergency symptom (chest pain or pressure now, sudden face drooping or arm weakness or difficulty speaking, severe breathlessness, fainting) or type an emergency warning sign in the free-text box, VITALNEX stops, shows \"Call for emergency help now\" with 108 / 112 buttons, and shows **no** screening levels. The AI assistant also shows the 108 / 112 card when you write words like \"chest pain\", \"stroke\" or \"heart attack\".",
        },
        {
          q: "Why is the free text \"not saved\"?",
          a: "The free-text box is only checked for emergency warning signs, on the server. It is not stored, and it is not used by the screening model. This keeps the data we hold to the minimum.",
        },
        {
          q: "I am under 18. Why can I not get a result?",
          a: "The models were built from data about adults only, so they cannot give a fair result for anyone under 18. The form shows a message asking you to talk to a doctor or a trusted adult, and to call 108 / 112 in an emergency.",
        },
        {
          q: "Why does my result have a note about being under 40?",
          a: "In testing, the models missed more cases in younger people than in older people (decision D-24). So everyone under 40 sees a note that results are less reliable for their age group. The gap is shown openly on the AI Trust Passport.",
        },
        {
          q: "I chose \"Prefer not to say\" for sex. What happens?",
          a: "VITALNEX runs the screening twice, once for each value, and shows the **higher** level for each condition, with a note that explains why (decision D-9). This avoids giving you false comfort.",
        },
        {
          q: "Why is my result different from what my doctor told me?",
          a: "This is normal and expected. VITALNEX only knows the answers you gave in one short form. It does not know your blood tests, your examination, your family history or your medicines. The models were trained on a US survey (CDC BRFSS 2015), not on Indian patients. Your doctor has much more information. **Always follow your doctor.** If a VITALNEX clinician reviewed your result and changed the level, your history shows the \"Clinician's level\" and any note they left for you.",
        },
        {
          q: "Who can see my data?",
          a: "**You** can see all of your own data. **VITALNEX clinicians** can see your answers, results and history only while \"Let VITALNEX clinicians review my results\" is turned on; if you turn it off they lose access immediately. **Admins** see only totals (counts and rates) with no names, and only for people who turned on \"Count my results in anonymous safety statistics\". **Anyone with a share link** you created can see the parts you chose, until the link expires or you revoke it. The database enforces these rules with Row Level Security (see the glossary). Your health data is never sent to any outside company: the models run on the VITALNEX server.",
        },
        {
          q: "How do I withdraw consent?",
          a: "Open **Settings** in the left menu (`/settings`). Under **Consents** each purpose has an **On** or **Off** badge and a button. Press **Withdraw** to turn a purpose off, or **Turn on** to turn it back on. The change is saved straight away and the page says \"Saved.\". Each purpose explains what happens if it is off. For example, if you withdraw \"Process my answers to give me a screening result\" you cannot run a screening; if you withdraw \"Save my results so I can see my history\" each result is shown once and not saved, and your saved history is hidden.",
        },
        {
          q: "Can I get a copy of my data, or delete it?",
          a: "Yes, both are on the **Settings** page. **Download JSON** gives you a file with everything VITALNEX holds about you. **Delete my data…** removes your screenings, saved answers, shares, consents, profile and account. You must type `DELETE` to confirm. Only a minimal record that a deletion happened is kept. This cannot be undone.",
        },
        {
          q: "How do I change the language?",
          a: "Use the **globe button** at the top right of every signed-in page, or the **Language** list on the Settings page. You can choose English, हिन्दी (Hindi) or मराठी (Marathi). The whole app changes at once. The choice is remembered in this browser on this device. Note: the language saved in your account is not applied automatically when you sign in on a new device; choose it again there.",
        },
        {
          q: "Are the Hindi and Marathi texts checked by a doctor?",
          a: "Not yet. Hindi and Marathi medical wording is still waiting for review by a native-speaking clinician (decision D-15). The list of texts to review is kept in `docs/i18n_review.md` and `docs/i18n_review_p8.md`.",
        },
        {
          q: "Is the AI assistant a chatbot like ChatGPT?",
          a: "No. The assistant does not write new text. It works out what kind of question you asked (its \"intent\") with a small local model, and then shows a reply that was written and checked in advance. It never names or doses a medicine. It runs on the VITALNEX server, so your messages are not sent to any outside company. See [AI assistant](/admin/docs/ai-assistant).",
        },
        {
          q: "Are the doctors in Care Connect real?",
          a: "No. All doctors and time slots in Care Connect are synthetic demo data. No real appointment is made. Care Connect is not for emergencies.",
        },
      ],
    },
    {
      type: "image",
      src: "/docs/faq/language-selector.png",
      alt: "Patient dashboard with the language menu open at the top right, showing English, Hindi and Marathi.",
      caption: "Changing the language from any signed-in page.",
      markers: [
        { n: 1, text: "The globe button. It shows the current language. Click it to open the menu." },
        { n: 2, text: "The language menu. Pick English, हिन्दी (Hindi) or मराठी (Marathi). The tick shows the current choice." },
      ],
    },
    {
      type: "image",
      src: "/docs/faq/settings-consent.png",
      alt: "Settings page with the Language list and the Consents section.",
      caption: "The Settings page: language, consents and data rights in one place.",
      markers: [
        { n: 1, text: "The Language list. Same effect as the globe button." },
        { n: 2, text: "The button for the first consent purpose. It says Withdraw when the purpose is on, and Turn on when it is off." },
        { n: 3, text: "Download a copy of all your data as a JSON file." },
      ],
    },

    { type: "h2", id: "clinicians-faq", text: "Questions from clinicians" },
    {
      type: "p",
      text: "These answers are for doctors who use the clinician portal. The full guide is [Clinician workspace](/admin/docs/clinician-workspace).",
    },
    {
      type: "faq",
      items: [
        {
          q: "Which patients can I see?",
          a: "Only patients who turned on \"Let VITALNEX clinicians review my results\". If a patient withdraws that consent, you lose access at once and their case shows \"This case is not available\". In the demo, patient1 to patient4 share with clinicians; patient5 and patient6 do not.",
        },
        {
          q: "Why is a case in my review queue?",
          a: "A screening from a consenting patient enters the queue for one or more of four reasons, shown under \"Why it is here\": **High screening level**, **VITALNEX not confident**, **Data-quality flag** (some answers look unlikely together) or **Emergency symptoms reported**.",
        },
        {
          q: "How do I review a case?",
          a: "Open the queue (**Patients & reviews**), press **Open case**, read the case, then under **Your review** choose **Agree with the model** or **Override**. You can add an optional note for the patient. Press **Save review**. The patient then sees that a clinician reviewed the result.",
        },
        {
          q: "Why are the factors shown before the model's level?",
          a: "On purpose. For each condition the case page shows (1) the main factors, (2) the uncertainty and only then (3) the model's level, so the model's level does not anchor (unfairly steer) your own judgement.",
        },
        {
          q: "What do I need to override a level?",
          a: "Choose the condition, a new level that differs from the model's level, and a **reason** from the list (for example \"Clinical history not captured\" or \"Model overestimates\"). A reason is required for every override. If the reason is \"Other\", you must also write a note. You can also set a level where the model was not confident.",
        },
        {
          q: "Will my overrides retrain the model?",
          a: "No. Overrides are logged for accountability and shown to admins as totals. They are **never** used to retrain the models (hard rule 9).",
        },
        {
          q: "What should I write in the note for the patient?",
          a: "Plain guidance, such as \"Please book a visit to check your blood sugar.\" The patient sees this note with their result. Do not name or dose medicines; VITALNEX never gives medicine advice.",
        },
        {
          q: "What is the \"Calibrated probability\" I see?",
          a: "It is the model's estimate after calibration (a correction step so that, for example, 0.3 means about 30 out of 100 similar people had the condition). Clinicians see it on the case page; patients see only levels, never percentages.",
        },
        {
          q: "What is the \"Conformal set\"?",
          a: "It lists which outcomes the model thinks are possible: 0 (no condition), 1 (condition), or both. If both are possible, the model abstains (says it is not confident) and no level is shown to the patient.",
        },
        {
          q: "Why does a case have no results at all?",
          a: "If the patient reported emergency symptoms, the models do not run. The case shows \"No model ran for this screening\" and the emergency flag.",
        },
        {
          q: "How do I handle appointments?",
          a: "Open **Appointments** in the clinician menu. For each booking you can **Confirm**, **Mark completed** or **Cancel booking**. If the booking was linked to a screening, **Open case** takes you to it. All slots are demo slots.",
        },
      ],
    },

    { type: "h2", id: "admins-faq", text: "Questions from admins" },
    {
      type: "p",
      text: "These answers are for people who use the governance portal. See [Admin console](/admin/docs/admin-console) for the full guide.",
    },
    {
      type: "faq",
      items: [
        {
          q: "Why can I not see patient names?",
          a: "Admin pages show aggregates (totals and rates) only. This is a privacy rule: an admin checks how the system behaves, not individual patients.",
        },
        {
          q: "Why are the screening counts smaller than I expect?",
          a: "Counts include only patients who turned on \"Count my results in anonymous safety statistics\". People who said no are left out.",
        },
        {
          q: "Where do the numbers on the governance pages come from?",
          a: "Model numbers (AUROC, Brier score, recall, abstention, fairness) are read from `ml/artifacts/<disease>/model_meta.json`. Counts (screenings, reviews, overrides, consents, audit entries) are read from the database. Nothing is typed in by hand.",
        },
        {
          q: "Why does some evidence say \"not available\"?",
          a: "VITALNEX shows \"not available\" instead of guessing when a number was never recorded. For example, \"recourse usage\" (how often people use the \"What you can change\" suggestions) is not recorded, so it says not available.",
        },
        {
          q: "How do I add a clinician or admin account?",
          a: "Not in the app. Patients can sign up themselves, but clinician and admin accounts are created by the VITALNEX team. In this MVP they come from the seed script `supabase/seed/seed_demo.py`.",
        },
        {
          q: "Can I retrain the models from the admin console?",
          a: "No. Training is done offline by developers with `python -m ml.training.train_all`, and the team must sign off on new models. The old \"Model Lab\" and \"Datasets\" pages are switched off in this MVP.",
        },
        {
          q: "Are the Pune synthetic data used anywhere?",
          a: "Only to make demo patient profiles and for stress tests. They are never used to train or test the production models, and they are not real patient data (decision D-4).",
        },
        {
          q: "What is in the audit log?",
          a: "A list of important actions (for example sign-in and sign-out, clinician review decisions, PDF report downloads and data deletions), with the time, the action, the type of record and the role of the person who did it. You can filter by action, resource type, role and date.",
        },
        {
          q: "Why are these docs only in English?",
          a: "The documentation is for admins and reviewers, not patients, so it is written in English only (decision D-27). The menu, search and \"On this page\" labels around it still change with the language.",
        },
        {
          q: "Which parts of the app are switched off?",
          a: "Voice, video consultation, health insights, the model lab and the datasets page are frozen for the MVP (decision D-8). They are kept on disk but not shown or used.",
        },
      ],
    },

    // ---------------------------------------------------------------- Part 2: troubleshooting
    { type: "h2", id: "troubleshooting", text: "Troubleshooting when you run VITALNEX locally" },
    {
      type: "p",
      text: "VITALNEX runs on one laptop: the **API** (the Python server, FastAPI) on port 8000 and the **web app** (Next.js) on port 3000. Both talk to one Supabase project (the online database and sign-in service). Most problems come from one of these three not matching or not running. Setup steps are in [Getting started](/admin/docs/getting-started).",
    },
    {
      type: "table",
      head: ["Problem", "Likely cause", "Fix"],
      rows: [
        [
          "Login says **\"Email or password is incorrect.\"** but you are sure the password is right.",
          "(a) The web app is talking to a **different Supabase project** than the API and seeds. This happens when a leftover `apps/web/.env.local` sets other `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` values than the root `.env`. (b) Someone re-ran `seed_demo.py`, which **resets every demo password** to `DEMO_PASSWORD` from `.env`. Note: the login page shows this same message for almost every sign-in failure, not only a wrong password.",
          "(a) Make the Supabase values in `apps/web/.env.local` match the root `.env`, or rename that file so the root `.env` is used. Then restart the web dev server. (b) Sign in with the current `DEMO_PASSWORD`. If the accounts were never seeded in this project, run `python supabase/seed/seed_demo.py` and then `python supabase/seed/seed_history.py`.",
        ],
        [
          "Login says **\"Sign-in is not available: Supabase is not configured for this app.\"**",
          "`NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` is empty for the web app.",
          "Fill them in the root `.env` (see `.env.example`) and restart the web dev server.",
        ],
        [
          "Login says **\"This account has no VITALNEX profile.\"**",
          "The sign-in account exists in Supabase Auth but has no row in the `profiles` table.",
          "Run `python supabase/seed/seed_demo.py` (it is safe to run again) for demo accounts.",
        ],
        [
          "The API takes about **30 seconds** before it answers.",
          "At start-up the API loads the three disease models and then **warms up the assistant**: it loads the local sentence encoder (a language model that turns text into numbers), the intent model and the FAQ data. The first time, the encoder is also downloaded once from Hugging Face.",
          "Wait until uvicorn prints \"Application startup complete\". This is normal. If the encoder cannot load, the API still starts; the assistant still answers emergency and medicine rules and says the rest is unavailable.",
        ],
        [
          "A red banner says **\"The VITALNEX server is not reachable right now. Nothing is shown rather than guessed.\"** (or a page says \"The screening service is not available right now\").",
          "The web app could not reach the API. Usually the API is **not running on port 8000**, is still starting, or crashed. The same message appears when the API answers with a server error (5xx), for example when Supabase is not configured for the API.",
          "Start it with `python -m uvicorn apps.api.main:app --reload --port 8000` (or `npm run dev` from the repo root, which starts both). Check `http://localhost:8000/docs` opens. Read the API terminal for errors. If you use another address, set `NEXT_PUBLIC_API_URL`.",
        ],
        [
          "\"Please sign in again to see this page.\"",
          "The API returned 401: your sign-in session expired or the API could not check your token (for example the API's `SUPABASE_URL` points at a different project than the web app).",
          "Sign out and sign in again. Make sure `SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_URL` are the same project.",
        ],
        [
          "You changed a `NEXT_PUBLIC_...` value but the app still uses the old one.",
          "`NEXT_PUBLIC_` values are built into the web app when the dev server starts. A running server does not see the change.",
          "Stop the web dev server (Ctrl+C) and start it again with `npm --prefix apps/web run dev`. Then reload the browser page.",
        ],
        [
          "`ModuleNotFoundError` (for example `No module named 'lightgbm'` or `'sentence_transformers'`) when starting the API or a script.",
          "The Python you are running does not have the packages. Often a `.venv` was created but the requirements were never installed into it, or the venv is not activated (or the other way round).",
          "Activate the venv (`.venv\\Scripts\\Activate.ps1` in PowerShell, `source .venv/Scripts/activate` in Git Bash) and run `pip install -r apps/api/requirements.txt -r ml/requirements.txt`. Or use the interpreter that already has them, and start the API with `python -m uvicorn ...` so the same Python is used.",
        ],
        [
          "`cannot import name 'create_client' from 'supabase' (unknown location)` when running a seed script or the API.",
          "The repo has a folder called `supabase/` (migrations and seeds). When the pip package `supabase` is **not installed** in the Python you use, Python picks up that folder instead, and it has no code (`docs/PROGRESS.md`: the folder shadows the package).",
          "Install the requirements into this Python (see the row above). Never add an `__init__.py` file to the `supabase/` folder. Run seeds as files, `python supabase/seed/seed_demo.py`, not as `python -m supabase...`.",
        ],
        [
          "Port already in use: uvicorn says the address is already in use (on Windows `[Errno 10048]`), or Next.js moves to port 3001.",
          "An older API or web server is still running, often from an earlier terminal.",
          "Use the server that is already running, or stop it first. In PowerShell: `Get-NetTCPConnection -LocalPort 8000` shows the process id, then `Stop-Process -Id <id>`. Keep the web app on port 3000: the API only allows browser calls from `http://localhost:3000` and `http://127.0.0.1:3000` (`CORS_ORIGINS` in `apps/api/core/config.py`), so the web app on port 3001 cannot reach the API.",
        ],
        [
          "Live database tests fail with \"Invalid login credentials\".",
          "The demo passwords no longer match `DEMO_PASSWORD`, or the accounts were not seeded.",
          "Re-run both seeds: `python supabase/seed/seed_demo.py`, then `python supabase/seed/seed_history.py`. To skip live tests: `python -m pytest tests -q --deselect tests/test_live_supabase.py`.",
        ],
        [
          "The app is in English after you set Hindi or Marathi in your profile.",
          "The language is remembered in the browser (`vitalnex_lang`), not taken from your account at sign-in.",
          "Pick the language again with the globe button or on the Settings page.",
        ],
      ],
    },
    {
      type: "callout",
      kind: "warning",
      title: "Never share secrets",
      text: "When you ask for help, do not paste the contents of `.env` or `apps/web/.env.local`. They hold secret keys (for example `SUPABASE_SECRET_KEY`). Say only whether a value is set or empty.",
    },
    {
      type: "callout",
      kind: "tip",
      title: "Quick health check",
      text: "If the API is running, `http://localhost:8000/docs` opens the API's own page with all its endpoints. If that page does not open, the web app cannot work either.",
    },

    // ---------------------------------------------------------------- Part 3: glossary
    { type: "h2", id: "glossary", text: "Glossary" },
    {
      type: "p",
      text: "Words used in VITALNEX and in these docs, in simple language. Where a number is given, the source is named.",
    },
    {
      type: "table",
      head: ["Word", "What it means"],
      rows: [
        ["Screening", "A quick check to find people who may need a closer look by a doctor. It is not a diagnosis."],
        ["Diagnosis", "A doctor's decision that a person has a disease. VITALNEX never makes one."],
        ["Care navigation", "Telling a person what kind of care to seek and how soon, for example \"see a doctor soon (within 2 weeks)\"."],
        ["Screening level (risk band)", "Low, Moderate or High for each condition. It says how similar your answers are to people who have been told they have that condition."],
        ["Next step", "The single action shown with a result: keep up regular check-ups, discuss at your next check-up, see a doctor soon, please correct your answers, not confident (see a doctor), or emergency (call 108 / 112). It is chosen by fixed rules, not by the AI."],
        ["Model", "A program that learned patterns from many past examples and can then make an estimate for a new person. VITALNEX uses one small model per condition."],
        ["LightGBM", "A type of model made of many small decision trees. It is used for diabetes and heart disease."],
        ["Logistic regression", "A simple, well-understood type of model. It is used for stroke."],
        ["Probability", "A number from 0 to 1 for how likely something is. Clinicians see it; patients see only levels."],
        ["Threshold", "A cut-off number. If the probability is above the Moderate threshold, the level is at least Moderate; above the High threshold, it is High."],
        ["AUROC", "A score from 0.5 (guessing) to 1 (perfect) for how well a model ranks people with a condition above people without it. Test AUROC: diabetes 0.824, heart 0.842, stroke 0.810 (`model_meta.json`)."],
        ["Recall", "Of all people who had the condition, the share the model caught (placed in Moderate or High)."],
        ["False-positive rate", "Of all people who did not have the condition, the share the model wrongly flagged."],
        ["Brier score", "The average error of the probabilities. Lower is better."],
        ["Calibration", "A correction step after training so the probabilities mean what they say (0.3 means about 30 in 100). VITALNEX uses isotonic calibration (`ml/training/calibrate.py`)."],
        ["Conformal prediction", "A method that checks whether the model is sure. It gives a set of possible answers; if both \"has\" and \"does not have\" are in the set, the model is uncertain. VITALNEX aims for at most 10% error (α = 0.10)."],
        ["Uncertain / not confident", "What the patient sees when the model is not sure: no level, only \"Not confident — see a doctor\"."],
        ["Abstention", "When the model chooses not to give an answer because it is unsure. Test abstention: about 37% (diabetes), 39% (heart), 44% (stroke), accepted in decision D-22."],
        ["Out-of-distribution (OOD)", "Answers that are very unlike the data the model learned from. VITALNEX checks this with an Isolation Forest and abstains if the answers are too unusual."],
        ["SHAP", "A method that shows how much each answer pushed the result up or down. VITALNEX runs it for real; the results are the \"main factors\" (\"Why this result?\")."],
        ["Main factors", "The answers that mattered most for one result, in plain language."],
        ["What you can change", "The smallest realistic change in changeable answers (like activity or weight) that would lower a level. Age, sex, blood pressure, cholesterol and difficulty walking are never changed here."],
        ["BRFSS", "The US CDC Behavioral Risk Factor Surveillance System, a phone survey of adults. VITALNEX is trained on the 2015 Health Indicators version: 253,680 rows (`docs/data_card.md`)."],
        ["Training data", "The examples a model learns from."],
        ["Synthetic data", "Made-up data that looks realistic but is not about real people. The Pune synthetic dataset is used only for demo profiles and stress tests, never for training or reported numbers."],
        ["Demo account", "A made-up account for trying the app, for example `patient1@vitalnex.demo`."],
        ["Fairness audit", "A check of how well the models work for different groups (for example age, sex, income). Income, education and healthcare access are used only for this check and are never asked in the app."],
        ["Age gap", "The models catch fewer cases in people aged 18–39 than in people over 60 (decision D-24). People under 40 see a note about this."],
        ["Red flag", "A warning sign of an emergency, such as chest pain or stroke signs. Red flags override everything and show 108 / 112."],
        ["108 / 112", "Emergency numbers in India: 108 for ambulance and medical emergencies, 112 for all emergencies."],
        ["Clinician review", "A doctor looks at High, not-confident, data-quality and emergency results from patients who agreed to share."],
        ["Clinician override", "When a doctor changes the model's level. A reason is always required, and every override is logged. Overrides never retrain the model."],
        ["Consent", "Your permission for one purpose. VITALNEX has four: process my answers, save my history, share with clinicians, count me in anonymous statistics. Each can be withdrawn at any time."],
        ["Withdraw", "To turn a consent off. It takes effect immediately."],
        ["Data minimisation", "Collecting only the data the product really needs."],
        ["DPDP", "India's Digital Personal Data Protection Act, 2023: the law on how personal data must be handled, including consent and data minimisation."],
        ["RLS (Row Level Security)", "A database rule that checks, row by row, who is allowed to see or change each record. It is how Supabase keeps one patient from seeing another's data."],
        ["Supabase", "The online service VITALNEX uses for its database (Postgres) and for sign-in."],
        ["API", "Application Programming Interface: the server program the web app calls to get results. In VITALNEX it is a FastAPI app on port 8000."],
        ["Audit log", "A record of important actions (who, what, when) so they can be checked later."],
        ["Share link / QR code", "A read-only link to parts of your record that you can show a doctor. You choose what is included and how long it works (1 hour, 24 hours or 7 days), and you can revoke it."],
        ["Trust Passport", "The public page `/ai-trust` that explains how VITALNEX works, how well it was tested and where it fails. Its numbers are read live from the model files and the database."],
        ["Model card", "A document per model with its data, numbers, limits and known issues (`docs/model_cards/`)."],
        ["NITI Aayog", "The Indian government's policy think-tank. Its \"Responsible AI for All\" (2021) sets seven principles that VITALNEX maps its features to."],
        ["Responsible AI", "Building AI that is safe, fair, private, open about how it works, and has people accountable for it."],
        ["Intent", "What kind of question a person is asking the assistant, for example \"what does my result mean\" or an emergency."],
        ["Encoder", "A model that turns a sentence into a list of numbers so similar sentences get similar numbers. VITALNEX uses `l3cube-pune/indic-sentence-bert-nli` on its own server."],
        ["Intent classifier", "A small model that reads the encoder's numbers and picks the intent."],
        ["i18n", "Short for \"internationalisation\": making the app work in several languages. Texts live in `apps/web/src/messages/{en,hi,mr}.json`."],
      ],
    },

    // ---------------------------------------------------------------- NITI
    { type: "h2", id: "niti-principles", text: "Which NITI Aayog principles this follows" },
    {
      type: "p",
      text: "This page itself is part of how VITALNEX is open and honest with the people who use it.",
    },
    {
      type: "niti",
      items: [
        {
          id: "transparency",
          how: [
            "The answers here describe what the code does, including the limits: about 15–21 in 100 people with a condition were shown as Low in testing, and 37–44% of people got \"not confident\" (`model_meta.json`).",
            "The glossary explains every technical word on the result, case and governance pages, so a reader can check what a number means.",
            "When a number was never recorded, the app says \"not available\" instead of guessing, and this page explains why.",
          ],
        },
        {
          id: "positive_human_values",
          how: [
            "The answers never say a person \"has\" a disease and never give medicine advice; they always point back to a doctor.",
            "Emergency help (108 / 112) is the first thing on this page and the first answer whenever red flags are reported.",
            "The page tells patients that their doctor's opinion comes first when it differs from the screening result.",
          ],
        },
      ],
    },

    { type: "h2", id: "read-more", text: "Where to read more" },
    {
      type: "list",
      items: [
        "[Introduction](/admin/docs/introduction) — what VITALNEX is and is not.",
        "[Getting started](/admin/docs/getting-started) — install and run on your laptop.",
        "[Understanding results](/admin/docs/understanding-results) — levels, factors, next steps.",
        "[Responsible AI](/admin/docs/responsible-ai) — the NITI Aayog principle map.",
        "[Models and data](/admin/docs/models-and-data) — the models, the data and all their numbers.",
      ],
    },
  ],
};

export default page;
