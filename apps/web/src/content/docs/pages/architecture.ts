import type { DocPage } from "../types";

const page: DocPage = {
  slug: "architecture",
  title: "How VITALNEX is built",
  summary:
    "A plain-language tour of the parts of VITALNEX, how a request travels through them, where the data lives, who can see what, and where the safety rules sit next to the AI models.",
  audience: "Developers and reviewers",
  blocks: [
    // ------------------------------------------------------------------ overview
    { type: "h2", id: "overview", text: "The big picture" },
    {
      type: "p",
      text: "VITALNEX has three main parts. A **web app** that people use in the browser. A **server** (a program that answers requests from the web app) that runs the rules and the AI models. And a **database** (an organised store of records) that keeps accounts, consents and saved results.",
    },
    {
      type: "p",
      text: "The most important idea is this: **all the AI runs on the VITALNEX server itself**. The three screening models and the language model behind the assistant are files on the server's disk. They are loaded once when the server starts. No answer a user types is sent to an outside AI or analytics service.",
    },
    {
      type: "callout",
      kind: "info",
      title: "Where the diagrams live",
      text: "The full technical diagrams (system, training pipeline, request flow, decision rules, database and NITI map) are in `docs/ARCHITECTURE_DIAGRAMS.md` in the repository. This page explains the same things in plain words.",
    },

    // ------------------------------------------------------------------ parts
    { type: "h2", id: "the-parts", text: "The parts and what each one does" },
    {
      type: "table",
      head: ["Part", "Built with", "What it does", "Where the code is"],
      rows: [
        [
          "Web app",
          "Next.js 16, React 19, Tailwind CSS, Recharts",
          "Every screen people see: sign in, the risk form, results, history, assistant, booking, Trust Passport, the clinician and admin workspaces. It shows text in English, Hindi or Marathi.",
          "`apps/web`",
        ],
        [
          "API server",
          "FastAPI with Pydantic v2 (Python)",
          "Checks who is asking, checks the answers, runs the safety rules and the models, saves results and writes the audit log. API means Application Programming Interface: a fixed list of web addresses the app can call.",
          "`apps/api`",
        ],
        [
          "Database, login and access rules",
          "Supabase: Postgres + Supabase Auth + Row Level Security",
          "Stores accounts, consents, assessments, the review queue, bookings and the audit log. Handles sign-in. Decides, row by row, who may read what.",
          "`supabase/migrations`, `supabase/seed`",
        ],
        [
          "Screening models",
          "scikit-learn, LightGBM, PyTorch (CPU), SHAP",
          "Three models (diabetes/prediabetes, heart disease or heart attack, stroke). Each gives a calibrated score, a band, a 'how sure' check and the top reasons.",
          "Training: `ml/training`. Saved models: `ml/artifacts/<disease>/`",
        ],
        [
          "Assistant language model",
          "sentence-transformers with `l3cube-pune/indic-sentence-bert-nli` (CC-BY-4.0)",
          "Turns a chat message into numbers so a small classifier can pick the intent (for example 'explain my result' or 'book a doctor') and find a matching FAQ answer. It never writes new sentences.",
          "`ml/nlp`, `apps/api/services/assistant_service.py`",
        ],
        [
          "Fixed safety rules",
          "Plain Python",
          "Emergency red flags (108 / 112), the medicine-question refusal, the data-quality check and the next-step rules. These are not AI: the same input always gives the same output.",
          "`apps/api/core/emergency.py`, `apps/api/services/screening.py`, `ml/nlp/rules.py`",
        ],
        [
          "PDF reports and QR codes",
          "reportlab (PDF), `qrcode` (Python)",
          "Builds the downloadable PDF report, with an embedded Noto Sans Devanagari font so Hindi and Marathi print correctly. Draws the QR code for a share link.",
          "`apps/api/services/report_service.py`, `apps/api/services/share_service.py`",
        ],
      ],
    },
    {
      type: "p",
      text: "Everything is built to run on a normal laptop with no graphics card (CPU only). There are no paid APIs.",
    },

    // ------------------------------------------------------------------ request flow
    { type: "h2", id: "how-a-request-flows", text: "How a request flows, step by step" },
    {
      type: "p",
      text: "Here is what happens when a patient presses submit on the risk form. This is `POST /api/v1/assessment`, and the order below is the order in the code (`apps/api/services/prediction_service.py` and `apps/api/services/screening.py`).",
    },
    {
      type: "steps",
      items: [
        {
          title: "The browser signs in with Supabase",
          text: "When the person signs in, Supabase Auth gives the browser a **JWT** (a signed digital pass that proves who you are). The web app keeps it in the session.",
        },
        {
          title: "The web app calls the API with that pass",
          text: "`apps/web/src/lib/api-client.ts` sends the form answers as JSON and puts the pass in the `Authorization: Bearer ...` header. The browser never sends a user id; the server works it out from the pass.",
        },
        {
          title: "The API checks the pass and the role",
          text: "`apps/api/core/auth.py` checks the pass's signature and expiry against Supabase's public keys. Then it reads the person's role from the `profiles` table. Only the `patient` role may submit an assessment; anyone else gets 403 (not allowed).",
        },
        {
          title: "The answers are checked",
          text: "Pydantic (a checking library) makes sure every answer is present and in range. Nothing is filled in with a 'normal' value. A missing or wrong answer returns 422 with the field names.",
        },
        {
          title: "Consent is checked",
          text: "The API reads the person's consents. Without the `assessment_processing` consent, it stops with 403 and tells the person how to turn it on in My data.",
        },
        {
          title: "Emergency rule runs first",
          text: "If any emergency symptom is ticked, or the free-text box contains a red-flag word, the result is 'emergency': call 108 / 112. **The models do not run at all** in this case, and no scores are shown.",
        },
        {
          title: "Data-quality check",
          text: "If the answers are impossible (for example a body-mass index outside the allowed range), the result is 'please correct your answers' and the models do not run.",
        },
        {
          title: "The three models run on the server",
          text: "Each model gives a calibrated score, a band (Low, Moderate or High), a 'how sure' check (conformal set and an unusual-profile check) and the top three reasons (SHAP). If a model is not sure, it gives no band for that condition.",
        },
        {
          title: "Next-step rules decide the advice",
          text: "Fixed rules turn the bands into one next step: emergency, correct inputs, not confident (see a doctor), see a doctor soon, discuss at next check-up, or routine check-up. The first rule that matches wins.",
        },
        {
          title: "Save, queue and audit",
          text: "With the `store_history` consent the result is saved in `risk_assessments` with the model versions. If the case needs a clinician and the person gave `share_with_clinician`, a row goes into `review_queue`. Without `store_history`, only an audit entry with no health data is written. The free-text box is never saved.",
        },
        {
          title: "The answer is shaped for the patient",
          text: "Before the reply leaves the server, raw probabilities, conformal sets and SHAP numbers are removed. A patient sees bands and plain text only. A clinician reading a stored case later sees the full numbers.",
        },
        {
          title: "The web app shows the result",
          text: "The browser shows three condition cards, the next step, why, what can change, and how sure the result is. See [Understanding results](/admin/docs/understanding-results).",
        },
      ],
    },
    { type: "h3", text: "The same flow as a table" },
    {
      type: "table",
      head: ["#", "Where it happens", "What is checked or done", "If it fails"],
      rows: [
        ["1", "Browser + Supabase Auth", "Sign in, get the JWT pass", "Stays on the login page"],
        ["2", "Web app proxy (`apps/web/src/proxy.ts`)", "Is there a session? Is the role allowed on this page?", "Redirect to login or to the role's home page"],
        ["3", "API `core/auth.py`", "Pass signature, expiry, role from `profiles`", "401 (not signed in) or 403 (wrong role)"],
        ["4", "API schemas (Pydantic)", "All answers present and in range", "422 with field names"],
        ["5", "API `prediction_service.py`", "`assessment_processing` consent", "403 consent required"],
        ["6", "API rules", "Emergency red flags", "Emergency next step, models skipped"],
        ["7", "API rules", "Data-quality gate", "'Correct your answers', models skipped"],
        ["8", "Local models", "Score, band, how sure, top reasons", "Not sure → no band, 'see a doctor'"],
        ["9", "API rules", "Next step (first match wins)", "—"],
        ["10", "Supabase (service role)", "Save result, add to review queue, audit", "Not saved if no `store_history` consent"],
        ["11", "API `shape_for_role`", "Remove numbers patients should not see", "—"],
      ],
    },
    {
      type: "callout",
      kind: "tip",
      title: "Other requests follow the same pattern",
      text: "Every other API call (history, PDF, assistant, booking, Trust Passport, admin governance) goes through the same first three checks: valid pass, role from the database, then the service. The full list of addresses is on [API reference](/admin/docs/api-reference).",
    },

    // ------------------------------------------------------------------ API groups (screenshot)
    { type: "h2", id: "api-route-groups", text: "The API's route groups" },
    {
      type: "p",
      text: "The API publishes an interactive list of all its addresses at `http://localhost:8000/docs` (made automatically by FastAPI, called Swagger UI). The addresses are grouped by feature. All of them start with `/api/v1`.",
    },
    {
      type: "image",
      src: "/docs/architecture/api-docs.png",
      alt: "The FastAPI interactive documentation page listing the API route groups",
      caption: "The API's own documentation page at http://localhost:8000/docs.",
      markers: [
        { n: 1, text: "**Session & Consent**: who am I, login and logout events, consents, data export and deletion." },
        { n: 2, text: "**Screening**: submit an assessment, what-if, recourse, and assessment history." },
        { n: 3, text: "**AI Assistant & Voice**: the assistant message. The two voice addresses answer 'Not in MVP'." },
        { n: 4, text: "**Clinical Reports & Documentation**: list of reports and the PDF download." },
        { n: 5, text: "**Admin Governance**: model, fairness, override, activity, consent and audit summaries for admins." },
      ],
    },
    {
      type: "table",
      head: ["Group (file in `apps/api/routers/v1`)", "Who can use it", "What it is for"],
      rows: [
        ["Health (`health.py`)", "Anyone", "Is the server up?"],
        ["Session & Consent (`me.py`)", "Signed-in users; consents, export and deletion are patients only", "Current profile, login/logout audit events, consents, data export and deletion requests"],
        ["User & Health Profiles (`profile.py`)", "Signed-in users; saved form answers are patients only", "Name and language; saved form answers"],
        ["Screening (`assessment.py`)", "Patients (what-if and recourse also clinicians)", "Run an assessment, try changes, read history"],
        ["Care Connect & Appointments (`doctors.py`)", "Doctor list: anyone. Booking: patients (clinicians can read theirs). Review queue and cases: clinicians", "Demo doctor list, slots, bookings; clinician review queue and cases"],
        ["AI Assistant & Voice (`assistant.py`)", "Signed-in users", "Assistant chat. Voice is switched off (answers 503 'Not in MVP')"],
        ["Model Registry & Governance (`models.py`)", "Model facts: anyone. Governance summary: admins", "Model facts and model cards from `model_meta.json`; a governance summary"],
        ["Clinical Reports & Documentation (`reports.py`)", "Patients", "Report list and PDF download"],
        ["Admin Governance (`admin.py`)", "Admins", "Totals and logs for the admin console; never single patient records"],
        ["Trust Passport (`trust.py`)", "Anyone", "The public Trust Passport data and its images"],
        ["QR Patient-held Record (`shares.py`)", "Patients create; anyone with the link opens", "Make, list and revoke share links; open a shared summary"],
      ],
    },

    // ------------------------------------------------------------------ folders
    { type: "h2", id: "folder-layout", text: "Folder layout" },
    { type: "p", text: "These are the top-level folders of the repository and what each holds." },
    {
      type: "table",
      head: ["Folder", "What is inside"],
      rows: [
        ["`apps/web`", "The Next.js web app. Pages are in `src/app`, shared parts in `src/components`, helpers in `src/lib`, screen text in `src/messages/{en,hi,mr}.json`, and these docs in `src/content/docs`."],
        ["`apps/api`", "The FastAPI server. `routers/v1` (the addresses), `services` (the work), `schemas` (the shape of each request and reply), `core` (sign-in checks, database clients, emergency rule, settings), `content` (all fixed wording in three languages, including the NITI principle map), `assets/fonts` (PDF fonts)."],
        ["`ml`", "Machine learning. `data` (download and prepare the training data), `training` (train, calibrate, conformal, out-of-range check, fairness, explanations, model cards), `artifacts/<disease>` (the saved models and `model_meta.json`), `nlp` (assistant encoder, intent model, FAQ, emergency and medicine rules), `predictor.py` (loads a saved model)."],
        ["`data`", "`raw` and `processed` hold the real public training data (CDC BRFSS 2015) and are not committed. `synthetic` holds the team-made Pune synthetic dataset, used only for demo profiles and stress tests, never for training or metrics."],
        ["`supabase`", "`migrations` (the database tables and access rules, in order), `seed` (scripts that create the demo accounts, doctors, slots and demo history), `tests` (SQL checks for the access rules)."],
        ["`tests`", "Python tests (pytest) for the API, the models (`tests/ml`) and the assistant (`tests/nlp`), plus `test_live_supabase.py` which talks to the real database."],
        ["`docs`", "Project documents: SPEC, DECISIONS, PROGRESS, architecture diagrams, ERAI report, data card, model cards, red-team report, claims audit, translation review lists."],
        ["`scripts`", "Helper scripts. `scripts/docs` makes the annotated screenshots used on these pages."],
      ],
    },
    {
      type: "callout",
      kind: "info",
      text: "The root also has `docker-compose.yml` (starts the API and web app in containers) and `CLAUDE.md` (the project's hard rules).",
    },

    // ------------------------------------------------------------------ database
    { type: "h2", id: "database-tables", text: "The database tables" },
    {
      type: "p",
      text: "The tables are created by three migration files (scripts that change the database step by step) in `supabase/migrations`. The first one made the original tables. The second (`..._p1_auth_persistence.sql`) reshaped them for the MVP and added the new ones. The third (`..._p7_share_revoke_guard.sql`) added one extra protection for share links. These are the main tables:",
    },
    {
      type: "table",
      head: ["Table", "What one row stores", "Who can read it (RLS)"],
      rows: [
        ["`profiles`", "One person: name, email, role (patient, doctor or admin), preferred language, whether it is a demo account", "The person; a clinician for patients who share with clinicians"],
        ["`consents`", "One permission and whether it is on: `assessment_processing`, `store_history`, `share_with_clinician` or `aggregate_audit`, plus the notice version and when it was withdrawn", "The person only"],
        ["`health_profiles`", "The saved form answers. A missing answer stays missing; it is never filled in", "The person; a consented clinician"],
        ["`risk_assessments`", "One submitted form: the answers, the results for all three conditions, the next step, the emergency flag, review status and the model versions used", "The person; a consented clinician. Only the server can write it"],
        ["`review_queue`", "A case waiting for a clinician, with the reasons (`high_band`, `abstained`, `data_quality`, `emergency`) and the status (pending, agreed, overridden)", "The patient; a consented clinician"],
        ["`clinician_overrides`", "A clinician's different opinion on one condition: the model's band, the clinician's band, a reason code and note. Never used to retrain the models", "The patient; a consented clinician"],
        ["`share_tokens`", "A QR share link: only a SHA-256 hash (a one-way fingerprint) of the secret link, what it covers, when it expires, when it was revoked", "The owner (who may only revoke it)"],
        ["`share_access_log`", "Each time a share link was opened, and by which kind of user", "The owner of the link"],
        ["`data_requests`", "A request to export or delete one's data, and its status", "The person"],
        ["`assistant_logs`", "One assistant message's intent, confidence and emergency flag. **There is no column for the message text**", "The person"],
        ["`audit_logs`", "One important action (consent change, assessment saved, review, override, share made or opened, data request, login)", "Admins; a person sees the entries they made"],
        ["`doctors`, `doctor_slots`, `appointments`", "Synthetic demo doctors, their bookable time slots, and bookings. Only one active booking per slot", "Doctors and slots are public; a booking is seen by its patient and its doctor"],
        ["`model_registry`, `model_versions`, `model_experiments`, `governance_events`", "Older model and governance tables from the first migration", "Registry and versions public (no personal data); the rest admins only"],
      ],
    },
    {
      type: "p",
      text: "Some older tables from the first migration (for example `health_lifestyle`, `health_conditions`, `trust_passports`) still exist with access rules turned on. The current MVP code saves answers in `health_profiles.answers` and results in `risk_assessments` instead.",
    },
    {
      type: "p",
      text: "Database **triggers** (small actions the database runs on its own when a row changes) write the audit log for consents, assessments, overrides, review decisions, share links, share openings and data requests. So the audit log is written no matter which path made the change.",
    },

    { type: "h3", text: "Row Level Security, in simple words" },
    {
      type: "p",
      text: "**Row Level Security (RLS)** is a Postgres feature. Each table has rules that say which rows a signed-in person may see or change. The database itself checks these rules on every request, so even a bug in the web app cannot show someone else's rows.",
    },
    {
      type: "list",
      items: [
        "**A patient** sees only their own rows.",
        "**A clinician** (role `doctor`) sees a patient's profile, answers, assessments, review items and overrides only while that patient's `share_with_clinician` consent is on. This is the `clinician_can_view` check in the migration. If the patient turns the consent off, the rows disappear for the clinician at once.",
        "**An admin** reads the audit log and governance tables. Admins never read patient records row by row; the admin console shows totals that the server works out.",
        "**Tables with RLS turned on but no rule** can only be used by the server.",
      ],
    },
    {
      type: "p",
      text: "The API uses two kinds of database connection (`apps/api/core/db.py`). The **user connection** carries the person's own pass, so RLS applies, and is used for reads. The **service connection** skips RLS and is used only for writes a person must not be able to fake: saving an assessment, the review queue, bookings, overrides and audit entries.",
    },
    {
      type: "callout",
      kind: "warning",
      title: "Protected columns",
      text: "Nobody can choose their own role. New sign-ups always get `patient`. A database trigger blocks a user from changing their own role, email, demo flag or id. Another trigger lets a user only revoke a share link, never extend it or change what it covers. Only the server's service connection (used by the seed script) can change a role.",
    },
    {
      type: "p",
      text: "The SQL file `supabase/tests/rls.sql` and the Python test `tests/test_live_supabase.py` check these rules against the database.",
    },

    // ------------------------------------------------------------------ roles
    { type: "h2", id: "roles-and-route-protection", text: "Roles and how pages are protected" },
    {
      type: "p",
      text: "There are three roles: `patient`, `doctor` (the clinician role) and `admin`. Each has a home page, set in `apps/web/src/lib/roles.ts`:",
    },
    {
      type: "table",
      head: ["Role", "Home page", "Pages it may open"],
      rows: [
        ["patient", "`/dashboard`", "`/dashboard`, `/onboarding`, `/health-profile`, `/risk-assessment`, `/history`, `/reports`, `/appointments`, `/care-connect`, plus the shared pages below"],
        ["doctor", "`/doctor/dashboard`", "Everything under `/doctor`, plus the shared pages below"],
        ["admin", "`/admin/dashboard`", "Everything under `/admin` (including these docs), plus the shared pages below"],
        ["all three", "—", "`/ai-assistant` and `/settings`"],
        ["anyone, signed in or not", "—", "Pages not in the list, such as the home page, `/auth/*` (login, sign-up, password reset), `/ai-trust` (Trust Passport) and `/share/<token>` (a shared QR summary)"],
      ],
    },
    { type: "p", text: "Page protection happens in three layers:" },
    {
      type: "steps",
      items: [
        {
          title: "Layer 1: the web app's proxy (a fast first check)",
          text: "`apps/web/src/proxy.ts` runs before every page loads. It refreshes the login cookie and checks the pass. If a protected page is opened with no session, it sends the person to `/auth/login`. If the role is not allowed, it sends them to their own home page. The role here comes from a copy kept inside the pass, which the database fills from `profiles.role` and users cannot write.",
        },
        {
          title: "Layer 2: the API",
          text: "Every API address checks the pass again and reads the role fresh from the `profiles` table (`require_role` in `apps/api/core/auth.py`). This is the real check; the proxy is only for a smooth experience.",
        },
        {
          title: "Layer 3: the database (RLS)",
          text: "Even when the API reads data, it reads with the person's own pass where possible, so the RLS rules above still apply.",
        },
      ],
    },
    {
      type: "callout",
      kind: "info",
      title: "Switched-off pages",
      text: "Some routes are kept on disk from an earlier version but are switched off for the MVP and not shown in the menu: `/admin/datasets`, `/admin/model-lab`, `/consultation/*`, `/health-insights` and `/voice`. Their API addresses (voice and video) answer 503 'Not in MVP' (`apps/api/core/frozen.py`).",
    },

    // ------------------------------------------------------------------ safety order
    { type: "h2", id: "where-safety-rules-run", text: "Where the safety rules run compared with the models" },
    {
      type: "p",
      text: "The models never decide on their own. Fixed rules sit **before** and **after** them:",
    },
    {
      type: "list",
      ordered: true,
      items: [
        "**Before the models: emergency rule.** Ticked emergency symptoms or red-flag words (one shared phrase list in English, Hindi, Marathi and romanised forms, `ml/nlp/data/emergency_phrases.json`) give 'call 108 / 112' at once. The models are skipped.",
        "**Before the models: data-quality gate.** Impossible answers stop the run and ask the person to correct them.",
        "**Inside the model step: 'how sure' check.** If the conformal check cannot pick one answer, or the profile is unlike the training data (out-of-range check), that condition gets no band and the advice is to see a doctor.",
        "**After the models: next-step rules.** Fixed rules, first match wins, turn bands into advice.",
        "**After the models: human review.** Emergency, not-sure and High cases go to the clinician review queue when the patient allows sharing. A clinician can agree or override, with a reason that is logged.",
        "**After the models: patient shaping.** Raw numbers are removed before the reply is sent to a patient.",
      ],
    },
    {
      type: "p",
      text: "The assistant follows the same idea (`apps/api/services/assistant_service.py`): emergency rule first, then the medicine-question refusal, and only then the language model. If the intent classifier is not sure enough, it says it cannot answer instead of guessing.",
    },
    {
      type: "callout",
      kind: "danger",
      title: "Emergency always wins",
      text: "In both the risk form and the assistant, an emergency red flag overrides everything else and shows 108 / 112 straight away.",
    },

    // ------------------------------------------------------------------ local vs third parties
    { type: "h2", id: "what-runs-locally", text: "What runs locally, and what is never sent to anyone" },
    {
      type: "table",
      head: ["Thing", "Where it runs", "Notes"],
      rows: [
        ["Three screening models", "On the VITALNEX API server", "Loaded once at start-up from `ml/artifacts/<disease>/`"],
        ["Assistant encoder and intent model", "On the VITALNEX API server", "The encoder weights are downloaded once into the local cache when training (`python -m ml.nlp.train_intents`). At run time the server loads them in offline mode, so it makes no outside call"],
        ["Safety and next-step rules", "On the VITALNEX API server", "Plain code, no AI"],
        ["PDF reports and QR codes", "On the VITALNEX API server", "reportlab and `qrcode`, fonts bundled in `apps/api/assets/fonts`"],
        ["Accounts, sign-in and stored records", "Supabase (hosted Postgres and Auth)", "This is the project's own database. `docs/ARCHITECTURE_DIAGRAMS.md` records the region as ap-south-1 (Mumbai)"],
      ],
    },
    {
      type: "list",
      items: [
        "No health answer, chat message or result is sent to an outside AI, translation or analytics service.",
        "Chat messages are not stored anywhere. Only the intent, confidence and emergency flag are logged.",
        "The free-text box on the risk form is only checked for red flags; it is never saved.",
        "The app does not ask for income, education or healthcare access (data minimisation under India's DPDP Act).",
        "Secrets (database keys) live in a `.env` file that is never committed.",
      ],
    },

    // ------------------------------------------------------------------ NITI
    { type: "h2", id: "niti-principles", text: "Which NITI Aayog principles this follows" },
    {
      type: "p",
      text: "The way VITALNEX is put together supports these principles from NITI Aayog's 'Responsible AI for All'. The full mapping is in `apps/api/content/principle_map.json` and [Responsible AI](/admin/docs/responsible-ai).",
    },
    {
      type: "niti",
      items: [
        {
          id: "privacy_security",
          how: [
            "Row Level Security on every main table: patients see only their own rows, clinicians only consented patients, admins only totals and the audit log.",
            "All models and the assistant run on the VITALNEX server; the assistant loads its model in offline mode and chat text is never stored.",
            "Share links store only a SHA-256 hash of the secret, expire, can be revoked, and every opening is logged.",
            "Roles cannot be self-chosen: sign-up always creates a patient, and a database trigger blocks role changes from users.",
          ],
        },
        {
          id: "accountability",
          how: [
            "Database triggers write `audit_logs` for consent changes, saved assessments, reviews, overrides, shares and data requests, whichever path made the change.",
            "Each saved assessment records the model versions and data hash used (`risk_assessments.model_versions`).",
            "High, not-sure and emergency cases go to a clinician review queue; overrides need a reason code and are kept append-only in `clinician_overrides`.",
          ],
        },
        {
          id: "transparency",
          how: [
            "Every model number shown in the app comes from `ml/artifacts/<disease>/model_meta.json`, which the API serves through the model and Trust Passport routes.",
            "The API publishes its own list of addresses at `/docs`, and the architecture is written down in `docs/ARCHITECTURE_DIAGRAMS.md` and on this page.",
            "Each result carries its top reasons and a 'how sure' message, so a person can see why they got it.",
          ],
        },
        {
          id: "safety_reliability",
          how: [
            "The emergency rule runs before any model and before the assistant's language model; it shows 108 / 112 and skips scoring.",
            "A data-quality gate stops impossible answers, and conformal and out-of-range checks make a model say 'not sure' instead of guessing.",
            "Next steps come from fixed rules, not from the model alone, and risky cases go to a human.",
            "The page is protected three times: web proxy, API role check, and database RLS.",
          ],
        },
      ],
    },

    // ------------------------------------------------------------------ FAQ
    { type: "h2", id: "common-questions", text: "Common questions" },
    {
      type: "faq",
      items: [
        {
          q: "Does the browser talk to the database directly?",
          a: "Only for sign-in and the person's own `profiles` row (reading it, and updating name or language). RLS limits that to their own row. Everything else goes through the API.",
        },
        {
          q: "Why does the web app check roles if the API does too?",
          a: "The proxy check is a quick first check so people are sent to the right page. The API check, using the role stored in the database, is the real one. RLS in the database is a third layer.",
        },
        {
          q: "Is the assistant a chatbot like the big online ones?",
          a: "No. It does not write new text. A local model picks the intent and finds a matching FAQ answer; every sentence comes from fixed content files in `apps/api/content` and `ml/nlp`. See [AI assistant](/admin/docs/ai-assistant).",
        },
        {
          q: "What happens to results if a patient turns off 'store history'?",
          a: "The screening still runs and the result is shown, but nothing is saved except an audit entry with no health data. Nothing goes to the clinician queue either.",
        },
        {
          q: "Can clinician overrides change the models?",
          a: "No. Overrides are stored in `clinician_overrides` and are never read by any training code. Models only change when someone retrains them by hand with `python -m ml.training.train_all`.",
        },
        {
          q: "Is the Pune synthetic dataset used by the models?",
          a: "No. It is made-up data used only for demo profiles and stress tests. The models are trained and tested on the public CDC BRFSS 2015 survey data. See [Models and data](/admin/docs/models-and-data).",
        },
        {
          q: "How do I run everything on my own laptop?",
          a: "Start the API with `uvicorn apps.api.main:app --reload --port 8000` and the web app with `npm --prefix apps/web run dev`. Full steps are on [Getting started](/admin/docs/getting-started).",
        },
      ],
    },
  ],
};

export default page;
