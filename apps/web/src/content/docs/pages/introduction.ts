import type { DocPage } from "../types";

// Sources: CLAUDE.md, README.md, docs/SPEC.md (§1, §1.4, §2.2, §7), docs/ERAI_REPORT.md (§1, §2, §5),
// apps/web/src/app/page.tsx (landing), apps/web/src/components/layout/Sidebar.tsx (menus),
// apps/web/src/app/onboarding/page.tsx, supabase/migrations/20261026000001_p1_auth_persistence.sql.

const page: DocPage = {
  slug: "introduction",
  title: "Introduction",
  summary:
    "What VITALNEX is, what it is not, who uses it and how a person moves through it. Start here, then use the map below to find the page you need.",
  audience: "Everyone",
  blocks: [
    { type: "h2", id: "what-vitalnex-is", text: "What VITALNEX is" },
    {
      type: "p",
      text: "VITALNEX is a health **screening** and **care-navigation** web app. Screening means a quick check that tells you if you should look more closely. Care navigation means helping a person decide **what kind of care to seek and how soon**.",
    },
    {
      type: "p",
      text: "A person answers 14 simple questions about themselves (age, sex, height, weight, high blood pressure, high cholesterol, smoking, physical activity, fruit, vegetables, heavy alcohol use, general health, days of poor mental and physical health, and difficulty walking). They can also tick symptoms and type a few words in their own language. This list comes from the README and `docs/SPEC.md` §3.3.",
    },
    {
      type: "p",
      text: "VITALNEX then looks at three conditions: **diabetes or prediabetes**, **heart disease** (coronary heart disease or a heart attack) and **stroke**. For each one it shows:",
    },
    {
      type: "list",
      items: [
        "A **screening level**: Low, Moderate or High. If the model (the computer program that learned patterns from survey data) is not sure, it shows no level and says \"Not confident — please see a doctor\".",
        "The **main factors**: the answers that mattered most for that result, in plain words.",
        "**What could change it**: only things a person can actually change, such as activity or weight.",
        "A **next step**: keep up regular check-ups, discuss it at your next check-up, see a doctor soon, or — in an emergency — call **108 / 112** now.",
      ],
    },
    {
      type: "callout",
      kind: "info",
      title: "How the result is worded",
      text: "VITALNEX never says \"you have diabetes\". It says your answers are **similar to people who have been told they have** the condition. This is because the models only compare answers with a large survey; they do not examine anyone.",
    },
    {
      type: "p",
      text: "The models were trained on a public US survey, the CDC BRFSS 2015 (253,680 rows, from `ml/data/stats.json`). All the screening models and the assistant run on the VITALNEX server itself. No health data is sent to any outside AI service.",
    },

    { type: "h2", id: "what-vitalnex-is-not", text: "What VITALNEX is not" },
    {
      type: "list",
      items: [
        "**Not a diagnosis.** It does not tell anyone that they have a disease.",
        "**Not a prescription.** It never names, suggests or doses a medicine. The assistant refuses such questions.",
        "**Not a replacement for a doctor.** High and uncertain results are sent to a clinician for review when the patient has agreed to share.",
        "**Not tested on Indian patients.** The training data is from the USA. Results may be less accurate for people in India.",
        "**Not a real product with real users.** It is an MVP (a first, minimal working version). Every account is a dummy demo account.",
      ],
    },
    {
      type: "callout",
      kind: "danger",
      title: "Emergency",
      text: "If someone has signs of a heart attack or stroke (for example chest pain, face drooping, sudden weakness on one side, trouble speaking), they must call **108 or 112** at once. VITALNEX shows this message before anything else whenever it sees such signs.",
    },

    { type: "h2", id: "who-it-is-for", text: "Who it is for" },
    {
      type: "p",
      text: "There are three kinds of signed-in users (called **roles**) and a public view. Each role sees only its own menu. The server checks the role again on every request, so hiding a menu is not the only protection.",
    },
    {
      type: "table",
      head: ["Role", "Who in the MVP", "What they can do"],
      rows: [
        [
          "Patient",
          "`patient1@vitalnex.demo` … `patient6@vitalnex.demo`, or anyone who signs up",
          "Give consent, fill in a health profile, run a risk assessment, read results and \"what-if\", see history, use the assistant, book a demo doctor, download a PDF, make a QR share link, manage their data.",
        ],
        [
          "Clinician (doctor)",
          "`dr.joshi@`, `dr.khan@`, `dr.patil@vitalnex.demo`",
          "See only patients who agreed to share, work the review queue, **agree** or **override** a result with a required reason, see appointments.",
        ],
        [
          "Admin",
          "`admin@vitalnex.demo`",
          "Governance dashboard, model cards, fairness tables, override numbers, the audit log, and this documentation.",
        ],
        [
          "Public (not signed in)",
          "Anyone",
          "The landing page, the AI Trust Passport, and a shared record opened with a valid QR link.",
        ],
      ],
    },
    {
      type: "callout",
      kind: "tip",
      title: "New sign-ups are always patients",
      text: "When someone creates an account on the sign-up page, the database always gives it the **patient** role. The role is never taken from what the user typed (`supabase/migrations/20261026000001_p1_auth_persistence.sql`). Clinician and admin accounts exist only as seeded demo accounts.",
    },

    { type: "h2", id: "languages", text: "Three languages" },
    {
      type: "p",
      text: "The whole app works in **English**, **Hindi** and **Marathi**. You can switch language at any time with the language button in the top bar. Every on-screen sentence comes from the files `apps/web/src/messages/en.json`, `hi.json` and `mr.json`.",
    },
    {
      type: "list",
      items: [
        "English is the source language. Hindi and Marathi are translations.",
        "Hindi and Marathi **medical wording is still waiting for review** by a native-speaking clinician. The landing page says \"Wording review pending\" next to them. The list is kept in `docs/i18n_review.md` and `docs/i18n_review_p8.md`.",
        "The assistant understands questions typed in all three languages and answers with fixed, pre-written replies.",
        "This documentation itself is in English only (decision D-27 in `docs/DECISIONS.md`).",
      ],
    },

    { type: "h2", id: "first-look", text: "A first look at the app" },
    {
      type: "p",
      text: "This is the public landing page at `/`. Anyone can open it without signing in.",
    },
    {
      type: "image",
      src: "/docs/introduction/landing.png",
      alt: "VITALNEX landing page, signed out, with the Get started button and the language button marked",
      caption: "The landing page at http://localhost:3000/ (signed out).",
      markers: [
        { n: 1, text: "**Language button.** Choose English, Hindi or Marathi. The whole page changes at once." },
        { n: 2, text: "**Open VITALNEX.** Goes to your dashboard (patients) or your role's home page (clinicians and admins). If you are not signed in you are sent to the sign-in page first." },
        { n: 3, text: "**Get started.** The main button. It opens the welcome (onboarding) page. If you are not signed in, you go to the sign-in page first, which has a link to create an account." },
        { n: 4, text: "**What VITALNEX is / What it is not.** A short box with the main promises and the 108 / 112 emergency line." },
      ],
    },
    {
      type: "p",
      text: "After a patient signs in they land on the **dashboard** at `/dashboard`. The menu on the left is the way to every patient feature.",
    },
    {
      type: "image",
      src: "/docs/introduction/dashboard.png",
      alt: "Patient dashboard for patient1 with the two sidebar menu sections marked",
      caption: "The patient dashboard, signed in as patient1@vitalnex.demo.",
      markers: [
        { n: 1, text: "**Screening** menu: Overview, My Health, Risk Assessment, AI Trust Passport, Care Connect, AI Health Assistant." },
        { n: 2, text: "**Care and records** menu: Appointments, Health History, Reports, Settings." },
        { n: 3, text: "**Demo environment** badge. A reminder that every account and every record here is synthetic." },
      ],
    },
    {
      type: "p",
      text: "Clinicians see a **Clinician portal** menu instead (Clinician dashboard, Patients & reviews, Appointments, AI Trust Passport, Settings). Admins see a **Governance** menu (Admin overview, Governance & audit, Documentation, AI Trust Passport, Settings). See [Clinician workspace](/admin/docs/clinician-workspace) and [Admin console and governance](/admin/docs/admin-console).",
    },

    { type: "h2", id: "the-main-journey", text: "The main journey, step by step" },
    {
      type: "p",
      text: "This is the path a patient follows from first visit to sharing a result. Each step links to the page that explains it fully.",
    },
    {
      type: "steps",
      items: [
        {
          title: "Sign up or sign in",
          text: "Open the landing page and press **Get started**. If you are not signed in, the sign-in page opens; use its link to create an account, or sign in with a demo account. New accounts are patient accounts. See [Accounts, sign-in and settings](/admin/docs/accounts-and-login).",
        },
        {
          title: "Read the welcome page and choose what you agree to",
          text: "The welcome page (`/onboarding`) explains what VITALNEX is and is not, lets you pick a language, and links to **My data** where you turn each consent on or off. Processing your answers is required for a screening. Keeping history, clinician review and anonymous statistics are optional.",
        },
        {
          title: "Fill in your health profile",
          text: "Go to **My Health** (`/health-profile`). Questions you skip stay empty; VITALNEX never fills in a \"normal\" value for you. See [Patient dashboard and health profile](/admin/docs/patient-dashboard).",
        },
        {
          title: "Run a risk assessment",
          text: "Open **Risk Assessment** and answer the form. People under 18 are stopped with an explanation. See [Risk assessment](/admin/docs/risk-assessment).",
        },
        {
          title: "Read your results",
          text: "You see the three conditions side by side, the main factors, what you could change, how sure VITALNEX is, and one next step. See [Understanding your results](/admin/docs/understanding-results).",
        },
        {
          title: "Get care advice or book a clinician",
          text: "Ask the **AI Health Assistant** a question, or use **Care Connect** to book a time slot with a demo doctor. If your result is High or \"not confident\" and you agreed to share, a clinician also reviews it. See [AI assistant](/admin/docs/ai-assistant) and [Care Connect and appointments](/admin/docs/care-connect).",
        },
        {
          title: "Keep and share your record",
          text: "Look at past results in **Health History**, download a PDF from **Reports**, or make a QR share link that expires (1 hour, 24 hours or 7 days) and can be cancelled. The public **AI Trust Passport** explains how the AI works. See [History and PDF reports](/admin/docs/history-and-reports) and [AI Trust Passport, consent and sharing](/admin/docs/trust-passport).",
        },
      ],
    },
    {
      type: "callout",
      kind: "warning",
      title: "The next step is decided by fixed rules, not by the model",
      text: "The models only give a level per condition. The next step is chosen by fixed rules, checked in this order: emergency signs → impossible answers (please correct them) → not confident → any High (see a doctor soon, within 2 weeks) → any Moderate (discuss at your next check-up) → all Low (keep up regular check-ups). Source: `docs/SPEC.md` §1.4.",
    },

    { type: "h2", id: "documentation-map", text: "Map of the documentation" },
    {
      type: "p",
      text: "Every page of this documentation is listed below. Use the left menu or the search box to move between them.",
    },
    {
      type: "table",
      head: ["Page", "Read it if you want to know…", "Best for"],
      rows: [
        ["[Getting started](/admin/docs/getting-started)", "How to install and run VITALNEX on a laptop and sign in with demo accounts.", "Everyone"],
        ["[How VITALNEX is built](/admin/docs/architecture)", "How the web app, the server, the models and the database fit together.", "Developers"],
        ["[Accounts, sign-in and settings](/admin/docs/accounts-and-login)", "Signing up, signing in for each role, password reset, language and My data.", "Patients, clinicians"],
        ["[Patient dashboard and health profile](/admin/docs/patient-dashboard)", "What the dashboard shows and how to fill in the health profile.", "Patients"],
        ["[Risk assessment](/admin/docs/risk-assessment)", "The question form, symptom ticks and what happens when you submit.", "Patients"],
        ["[Understanding your results](/admin/docs/understanding-results)", "Levels, main factors, \"what could change\", \"not confident\" and next steps.", "Patients, clinicians"],
        ["[History and PDF reports](/admin/docs/history-and-reports)", "Past results, the trend chart and the downloadable PDF.", "Patients"],
        ["[AI assistant](/admin/docs/ai-assistant)", "What the assistant can answer, emergency handling and medicine refusal.", "Patients"],
        ["[Care Connect and appointments](/admin/docs/care-connect)", "Finding a demo doctor and booking a time slot.", "Patients, clinicians"],
        ["[AI Trust Passport, consent and sharing](/admin/docs/trust-passport)", "The public Trust Passport, consent choices and QR share links.", "Everyone"],
        ["[Clinician workspace](/admin/docs/clinician-workspace)", "The review queue, agreeing or overriding a result, and appointments.", "Clinicians"],
        ["[Admin console and governance](/admin/docs/admin-console)", "Model cards, fairness tables, override numbers and the audit log.", "Admins"],
        ["[Responsible AI (NITI Aayog)](/admin/docs/responsible-ai)", "How each of the 7 NITI Aayog principles is built into the app, with evidence.", "Everyone"],
        ["[Models and data](/admin/docs/models-and-data)", "The training data, the three models, their accuracy and their limits.", "Reviewers, developers"],
        ["[Testing on your local machine](/admin/docs/testing)", "How to run the automated tests and checks.", "Developers"],
        ["[API reference](/admin/docs/api-reference)", "The server's endpoints (addresses the web app calls) and their inputs and outputs.", "Developers"],
        ["[FAQ, troubleshooting and glossary](/admin/docs/faq)", "Common problems, quick answers and the meaning of technical words.", "Everyone"],
      ],
    },

    { type: "h2", id: "safety-promises", text: "Key safety promises" },
    {
      type: "p",
      text: "These are the hard rules from the project's `CLAUDE.md`, in simple words. Every feature in this documentation follows them.",
    },
    {
      type: "list",
      ordered: true,
      items: [
        "**No diagnosis.** VITALNEX only says your answers are similar to people who have been told they have a condition.",
        "**No medicines.** It never recommends, names or doses a medicine.",
        "**No made-up answers.** If you skip a question, it stays empty. VITALNEX never quietly fills in a \"normal\" value.",
        "**No made-up numbers.** Every number on screen comes from a saved model file (`ml/artifacts/<disease>/model_meta.json`) or from the database. If a number is not available, the screen says \"not available\".",
        "**No fake patient data.** A synthetic (made-up) Pune dataset is used only for demo profiles and stress tests. It is never used to train or measure the models.",
        "**Your health data stays here.** All models and language processing run on the VITALNEX server. Nothing is sent to an outside AI service.",
        "**People stay in charge.** Safety rules run before the model. High and uncertain results go to a clinician for review (if the patient agreed to share).",
        "**Emergencies come first.** Emergency signs always override everything and show **108 / 112** straight away.",
        "**No automatic retraining.** Clinician overrides and user data are never used to retrain the models automatically.",
        "**Only the data that is needed.** Income, education and access to healthcare are **not** asked in the app (data minimisation under India's DPDP Act).",
      ],
    },

    { type: "h2", id: "mvp-scope", text: "MVP scope: what is switched on and off" },
    {
      type: "p",
      text: "VITALNEX is an MVP. This means a few things you should know before a demo:",
    },
    {
      type: "list",
      items: [
        "**Dummy accounts only.** 1 admin, 3 doctors and 6 patients are seeded. Please never enter real personal health data.",
        "**Demo history.** Past results shown for demo patients were made by running the real models on invented answers (`assessment_mode = 'demo'`). patient1's latest visit is a High case, so the clinician review demo works.",
        "**Demo doctors and time slots.** All doctors in Care Connect are synthetic. Booking does not contact anyone.",
        "**Frozen pages.** Some older pages are kept on disk but are switched off and not in any menu: `/admin/datasets`, `/admin/model-lab`, `/consultation/*`, `/health-insights` and `/voice`. They are not part of the MVP and are not documented as working features.",
      ],
    },
    {
      type: "callout",
      kind: "warning",
      title: "Known limits in plain words",
      text: "The models often say \"not confident\": on the test data this happened for 36.8% of people for diabetes, 38.5% for heart disease and 44.4% for stroke (`conformal_test.abstention_rate_total` in each `model_meta.json`). Results are much less reliable for people under 40. Hindi and Marathi medical wording has not yet been checked by a human. Full list: `docs/ERAI_REPORT.md` §5 and §7.",
    },

    { type: "h2", id: "niti-principles", text: "Which NITI Aayog principles this follows" },
    {
      type: "p",
      text: "VITALNEX is designed around the seven principles in NITI Aayog's *Responsible AI for All* (Part 1, 2021). The map from each principle to the features that follow it is stored in `apps/api/content/principle_map.json` and shown live in the AI Trust Passport. Full detail and evidence: [Responsible AI (NITI Aayog)](/admin/docs/responsible-ai).",
    },
    {
      type: "niti",
      items: [
        {
          id: "safety_reliability",
          how: [
            "Emergency signs are checked first; if found, no model runs and only the 108 / 112 card is shown.",
            "A data-quality check stops impossible answers before any model runs.",
            "When the model is not confident (conformal check or unusual input), it shows no level and asks the person to see a doctor.",
          ],
        },
        {
          id: "equality",
          how: [
            "Each model's results are checked across groups such as sex, age band and income (fairlearn, on the test data).",
            "Gaps are reported openly in the Trust Passport and admin governance; the large age gap is disclosed, not hidden (D-24).",
          ],
        },
        {
          id: "inclusivity_non_discrimination",
          how: [
            "The full app works in English, Hindi and Marathi.",
            "Explanations use plain, pre-written sentences.",
            "Income, education and healthcare access are never asked; they are used only to audit fairness on the survey data.",
          ],
        },
        {
          id: "privacy_security",
          how: [
            "Four separate consent choices, each can be turned off at any time in My data.",
            "Row Level Security in the database: patients see only their own rows; clinicians see only patients who agreed to share.",
            "No health data goes to outside AI services, and assistant message text is not stored.",
            "QR share links expire, can be cancelled, and only a hash (a scrambled fingerprint) of the link is stored.",
          ],
        },
        {
          id: "transparency",
          how: [
            "Every result has \"Why this result?\" and \"How sure is VITALNEX?\" sections.",
            "The public AI Trust Passport shows how the models were built, how well they work and where they fail.",
            "Each model has a model card with its version and data hash.",
          ],
        },
        {
          id: "accountability",
          how: [
            "High and not-confident results of sharing patients go to a clinician review queue.",
            "A clinician who overrides a result must give a reason; every override is logged with the clinician, model version and time.",
            "Sensitive actions are written to an audit log that admins can read.",
          ],
        },
        {
          id: "positive_human_values",
          how: [
            "Results never claim a diagnosis and never mention medicines.",
            "\"What could change it\" shows only things a person can change.",
            "The patient keeps their own record (PDF and QR share) and controls who sees it.",
          ],
        },
      ],
    },

    { type: "h2", id: "common-questions", text: "Common questions" },
    {
      type: "faq",
      items: [
        {
          q: "Does VITALNEX tell me if I have diabetes, heart disease or stroke?",
          a: "No. It only says how similar your answers are to people who have been told they have these conditions, and what kind of care to seek. Only a doctor can diagnose.",
        },
        {
          q: "Will VITALNEX suggest a medicine?",
          a: "No. It never names, suggests or doses a medicine. If you ask the assistant about medicines, it refuses and tells you to speak to a doctor or pharmacist.",
        },
        {
          q: "Is my data sent to ChatGPT or another AI company?",
          a: "No. All the models and the assistant run on the VITALNEX server. Accounts and results are stored in the project's own Supabase database (Mumbai region).",
        },
        {
          q: "Why does it sometimes say \"Not confident — please see a doctor\"?",
          a: "Because the model could not tell clearly for your answers. Instead of guessing, it shows no level and asks you to see a doctor. On the test data this happened for about 37–44% of people, depending on the condition.",
        },
        {
          q: "Are the patients and doctors real?",
          a: "No. Every account, doctor and time slot is a dummy demo record. Please do not enter real personal health data.",
        },
        {
          q: "Can I use VITALNEX in Hindi or Marathi?",
          a: "Yes. Use the language button at the top of any page. Note that the Hindi and Marathi medical wording is still waiting for a human review.",
        },
        {
          q: "How do I try it quickly?",
          a: "Follow [Getting started](/admin/docs/getting-started), then sign in as `patient1@vitalnex.demo` (a patient with history) or `admin@vitalnex.demo`.",
        },
        {
          q: "What should someone do in an emergency?",
          a: "Call 108 or 112 immediately. Do not wait for VITALNEX or any app.",
        },
      ],
    },
  ],
};

export default page;
