import type { DocPage } from "../types";

const page: DocPage = {
  slug: "getting-started",
  title: "Getting started",
  summary:
    "How to set up VITALNEX on your own laptop, start it, sign in with a demo account and take a first short tour. Written for Windows, with notes for macOS and Linux.",
  audience: "Developers and demo users",
  blocks: [
    { type: "h2", id: "before-you-begin", text: "Before you begin" },
    {
      type: "p",
      text: "VITALNEX has three parts that must all work together: a **web app** (the screens you see, built with Next.js), an **API** (the server program, built with FastAPI, that runs the screening models and the assistant) and a **Supabase project** (an online database plus sign-in service). This page walks you through setting up all three on one laptop.",
    },
    {
      type: "callout",
      kind: "warning",
      title: "Demo only",
      text: "VITALNEX is an MVP (a first, minimal version). It is a screening and care-navigation prototype, **not a diagnostic tool**. Every account is a dummy demo account. Do not type real personal health information. In an emergency, call **108 / 112**.",
    },
    {
      type: "p",
      text: "Everything runs on a normal laptop with no graphics card (CPU only). No paid services are needed. The screening models and the assistant language model run on your own machine, so no health answers are sent to any outside AI service.",
    },
    {
      type: "p",
      text: "If you only want to understand what VITALNEX is, read the [Introduction](/admin/docs/introduction) first. For how the parts talk to each other, see [Architecture](/admin/docs/architecture).",
    },

    { type: "h2", id: "prerequisites", text: "What you need (prerequisites)" },
    {
      type: "table",
      head: ["Tool", "Version", "Why it is needed"],
      rows: [
        ["Python", "3.11 or newer (the project is built and tested on **3.13**)", "Runs the API, the screening models, the seed scripts and the tests."],
        ["Node.js (with npm)", "20 or newer", "Runs the Next.js web app. npm is the package installer that comes with Node."],
        ["Git", "any recent version", "To clone (download) the repository."],
        ["A Supabase project", "free plan is enough", "Gives the database (Postgres) and the sign-in service. Our project is in the Mumbai region; any region works."],
        ["Disk space", "about 3 GB", "Python packages plus the local assistant language model."],
        ["Internet", "during setup", "To install packages, reach Supabase and download the assistant language model once."],
      ],
    },
    {
      type: "callout",
      kind: "info",
      title: "Windows commands on this page",
      text: "Commands are shown for **Windows PowerShell** unless they say otherwise. Most commands are the same in Git Bash, macOS and Linux. Where they differ, both versions are shown.",
    },

    { type: "h2", id: "get-the-code", text: "Step 1: Get the code" },
    {
      type: "steps",
      items: [
        { title: "Open a terminal", text: "On Windows open PowerShell (or Git Bash). On macOS open Terminal. On Linux open your usual shell." },
        { title: "Clone the repository", text: "Run `git clone` with the repository address you were given, then move into the new folder with `cd`." },
        { title: "Use the right branch", text: "The MVP work lives on the branch `renovate/mvp`. Run `git checkout renovate/mvp` if you are not on it already." },
      ],
    },
    {
      type: "p",
      text: "All later commands are run from the **repository root** (the top folder that holds `apps/`, `ml/`, `supabase/` and `docs/`). The API is started as a Python module (`apps.api.main`), so it must be started from this folder.",
    },

    { type: "h2", id: "install-python-packages", text: "Step 2: Install the Python packages" },
    {
      type: "p",
      text: "There are two requirement files. `apps/api/requirements.txt` holds what the API needs (FastAPI, Supabase client, PDF tools and so on). `ml/requirements.txt` holds what the models need (scikit-learn, LightGBM, PyTorch for CPU, SHAP, sentence-transformers and so on). Install both.",
    },
    { type: "h3", text: "Option A: a virtual environment (recommended for a fresh machine)" },
    {
      type: "p",
      text: "A virtual environment (a private folder of Python packages just for this project) keeps these packages apart from the rest of your computer.",
    },
    {
      type: "code",
      lang: "powershell",
      code: "# Windows PowerShell\npython -m venv .venv\n.venv\\Scripts\\Activate.ps1\npip install -r apps/api/requirements.txt -r ml/requirements.txt",
    },
    {
      type: "code",
      lang: "bash",
      code: "# Git Bash on Windows\npython -m venv .venv\nsource .venv/Scripts/activate\npip install -r apps/api/requirements.txt -r ml/requirements.txt\n\n# macOS / Linux\npython3 -m venv .venv\nsource .venv/bin/activate\npip install -r apps/api/requirements.txt -r ml/requirements.txt",
    },
    {
      type: "callout",
      kind: "tip",
      title: "PowerShell blocks the activate script?",
      text: "If PowerShell says running scripts is disabled, run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` once, then try `.venv\\Scripts\\Activate.ps1` again.",
    },
    { type: "h3", text: "Option B: the global Python" },
    {
      type: "p",
      text: "On the main development laptop all packages are installed into the **global** Python 3.13 (no virtual environment). That also works: run the same `pip install` line without creating `.venv`. See the troubleshooting section if a `.venv` exists but is missing packages.",
    },
    {
      type: "p",
      text: "On macOS and Linux, use `python3` and `pip3` if plain `python` points to an old Python 2 or is not found.",
    },

    { type: "h2", id: "install-web-packages", text: "Step 3: Install the web packages" },
    {
      type: "code",
      lang: "bash",
      code: "npm install                    # repo root: installs \"concurrently\" (runs API + web together)\nnpm --prefix apps/web install  # the Next.js web app",
    },
    {
      type: "p",
      text: "The first command is only needed if you want to start both servers with one command (`npm run dev` from the root). The second one is always needed. The web app uses **Next.js 16** and **React 19**.",
    },

    { type: "h2", id: "create-supabase-project", text: "Step 4: Create the Supabase project" },
    {
      type: "steps",
      items: [
        { title: "Create a project", text: "Go to supabase.com, sign in and create a new project. Any region works. Wait until it says the project is ready." },
        { title: "Find the project URL", text: "In the project settings (API section) copy the **Project URL**. It looks like `https://<project-ref>.supabase.co`." },
        { title: "Find the two keys", text: "Copy the **publishable** key (also called the anon key; safe for the browser) and the **secret** key (also called the service-role key; server only, never put it in the browser or in git)." },
        { title: "Optional: a personal access token", text: "Under Account, Access Tokens you can create a token. It is only needed if you want to apply the database migrations from the command line instead of the SQL editor." },
      ],
    },

    { type: "h2", id: "environment-variables", text: "Step 5: Set the environment variables" },
    {
      type: "p",
      text: "Environment variables are settings (like addresses and keys) that the programs read when they start. VITALNEX keeps them in a file called `.env` at the repository root. The template `.env.example` lists every variable with a placeholder value.",
    },
    {
      type: "code",
      lang: "powershell",
      code: "# Windows PowerShell\nCopy-Item .env.example .env\n\n# Git Bash / macOS / Linux\ncp .env.example .env",
    },
    {
      type: "p",
      text: "Then open `.env` in an editor and fill in your own values. **One `.env` file serves both the API and the web app**: `apps/web/next.config.ts` loads the root `.env` before Next.js reads its settings. If a file `apps/web/.env.local` exists, its values win over the root `.env` for the web app.",
    },
    {
      type: "table",
      head: ["Variable", "Used by", "What to put in it"],
      rows: [
        ["`NEXT_PUBLIC_SUPABASE_URL`", "web", "Your Supabase project URL. Needed for sign-in in the browser."],
        ["`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`", "web and API", "The publishable (anon) key. The API also reuses it when it talks to the database on behalf of a signed-in user, so database security rules apply."],
        ["`NEXT_PUBLIC_API_URL`", "web", "Where the API runs. Default `http://localhost:8000`."],
        ["`NEXT_PUBLIC_SITE_URL`", "API", "Where the web app runs. Default `http://localhost:3000`. QR share links are built from it (or from `PUBLIC_WEB_URL` if that is set)."],
        ["`NEXT_PUBLIC_DEMO_MODE`", "template", "Set to `true` in the template."],
        ["`SUPABASE_URL`", "API", "The same Supabase project URL as above."],
        ["`SUPABASE_SECRET_KEY`", "API and seed scripts", "The secret (service-role) key. **Server only.** Never share it, never commit it."],
        ["`SUPABASE_JWT_SECRET`", "API", "Leave empty. Only needed for old projects that still use the shared JWT secret (HS256). New projects are checked with public keys."],
        ["`SUPABASE_ACCESS_TOKEN`", "you (optional)", "Personal access token, only for applying migrations through the Supabase Management API."],
        ["`DEMO_PASSWORD`", "seed script", "The password you choose for **all** demo accounts. Required before seeding."],
        ["`PROBLEM_REPORT_CONTACT`", "API", "Optional email or URL shown in the Trust Passport as the place to report a problem. Empty shows \"not available\"."],
        ["`ENVIRONMENT`", "API", "`development` for local work."],
        ["`API_BASE_URL`, `API_V1_PREFIX`", "API", "Defaults `http://localhost:8000` and `/api/v1`. Leave as they are."],
        ["`CORS_ORIGINS`", "API", "Which web addresses may call the API. Default allows `http://localhost:3000` and `http://127.0.0.1:3000`."],
      ],
    },
    {
      type: "callout",
      kind: "info",
      title: "Variables that do nothing",
      text: "At the bottom of `.env.example` there is a block marked **NOT USED in the MVP**: `OPENAI_API_KEY`, `OPENAI_MODEL`, `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `VOICE_PROVIDER_API_KEY`, `MAPS_PROVIDER_API_KEY`. No code reads them. Video, voice and outside AI providers are switched off, and health data must never go to a third-party API. Leave them as placeholders.",
    },
    {
      type: "callout",
      kind: "danger",
      title: "Keep secrets secret",
      text: "`.env` and `apps/web/.env.local` are listed in `.gitignore`. Never commit them, never paste their values into chats, tickets or screenshots. Only `.env.example` (placeholders) is in git. When you add a new variable to the code, add its name to `.env.example` too.",
    },

    { type: "h2", id: "apply-migrations", text: "Step 6: Create the database tables (migrations)" },
    {
      type: "p",
      text: "A migration is a SQL file that creates or changes database tables. VITALNEX has three, in `supabase/migrations/`. Apply them **in filename order**:",
    },
    {
      type: "list",
      ordered: true,
      items: [
        "`20260927000001_initial_schema.sql` — the main tables and Row Level Security (database rules that decide who can read which row).",
        "`20261026000001_p1_auth_persistence.sql` — sign-in profiles and saved data.",
        "`20261028000001_p7_share_revoke_guard.sql` — a guard for revoking shared records.",
      ],
    },
    { type: "h3", text: "Way 1: the SQL editor (easiest)" },
    {
      type: "steps",
      items: [
        { title: "Open the SQL editor", text: "In your Supabase project, open **SQL Editor** and start a new query." },
        { title: "Run each file", text: "Open the first migration file, copy all of it, paste it into the editor and run it. Repeat for the second and third file, in order." },
        { title: "Check the security rules", text: "Paste and run `supabase/tests/rls.sql`. It should end with **\"all RLS checks passed\"**." },
      ],
    },
    { type: "h3", text: "Way 2: the Management API (needs SUPABASE_ACCESS_TOKEN)" },
    {
      type: "code",
      lang: "bash",
      code: "# Git Bash / Linux / macOS; needs jq. <ref> is your project ref.\nfor f in supabase/migrations/*.sql; do\n  jq -Rs '{query: .}' \"$f\" | curl -sS -X POST \\\n    \"https://api.supabase.com/v1/projects/<ref>/database/query\" \\\n    -H \"Authorization: Bearer $SUPABASE_ACCESS_TOKEN\" -H \"Content-Type: application/json\" -d @-\ndone",
    },
    {
      type: "callout",
      kind: "warning",
      title: "Never edit an applied migration",
      text: "Once a migration has run on a project, do not change that file. Put new schema changes in a new migration file with a later date in its name.",
    },

    { type: "h2", id: "models-and-artifacts", text: "Step 7: Check the trained models (artifacts)" },
    {
      type: "p",
      text: "Artifacts are the saved, already-trained model files. They are **committed to git**, so normally you do not need to train anything. Check that these folders exist and are not empty:",
    },
    {
      type: "list",
      items: [
        "`ml/artifacts/diabetes/`, `ml/artifacts/heart/`, `ml/artifacts/stroke/` — each holds `model.joblib`, `calibrator.joblib`, `conformal.json`, `ood.joblib`, `model_meta.json`, `model_card.md` and a few charts.",
        "`ml/nlp/artifacts/` — `intent_model.pt` and `nlp_meta.json` for the assistant.",
      ],
    },
    {
      type: "p",
      text: "The API loads the three disease models once when it starts. If they are missing, rebuild them with the commands below. This downloads the US CDC BRFSS 2015 survey (253,680 rows) into `data/raw/` (not committed) and trains everything on the CPU. It takes a while and **overwrites** the committed artifacts, so the numbers in the model cards can change.",
    },
    {
      type: "code",
      lang: "bash",
      code: "python -m ml.data.download        # CDC BRFSS 2015 -> data/raw/\npython -m ml.data.prepare         # checks, stats.json, splits\npython -m ml.data.data_card       # regenerates docs/data_card.md\npython -m ml.training.train_all   # trains diabetes, heart and stroke models + model cards\npython -m ml.nlp.train_intents    # assistant intent model -> ml/nlp/artifacts/",
    },
    {
      type: "p",
      text: "If the automatic download fails, the download script prints manual instructions. For details on the data and models see [Models and data](/admin/docs/models-and-data).",
    },
    {
      type: "callout",
      kind: "info",
      title: "The assistant language model",
      text: "The assistant uses the open model `l3cube-pune/indic-sentence-bert-nli` (licence CC-BY-4.0). It is downloaded from Hugging Face **once**, the first time it is needed, and after that runs fully on your laptop. Only the model file is downloaded; no user text is sent anywhere. If it cannot be loaded, the assistant still applies its emergency and medicine-refusal rules and says that it is limited.",
    },

    { type: "h2", id: "seed-demo-data", text: "Step 8: Add the demo accounts and data (seeding)" },
    {
      type: "p",
      text: "Seeding means filling the empty database with demo data. Make sure `DEMO_PASSWORD` is set in `.env` first; the seed script stops with an error if it is empty.",
    },
    {
      type: "code",
      lang: "bash",
      code: "python supabase/seed/seed_demo.py      # accounts, doctors, appointment slots, consents\npython supabase/seed/seed_history.py   # demo assessment history, made by the real models",
    },
    {
      type: "list",
      items: [
        "`seed_demo.py` creates the admin, three clinician and six patient accounts, the doctor profiles, appointment slots and consents. It is safe to run again (idempotent: running it twice gives the same result). It creates **no** assessments.",
        "`seed_history.py` runs the **real** screening models on fixed, invented demo answers and saves the results as demo history. It replaces earlier demo assessments. It prints the next step for each visit. You should see patient1's last visit as `see_doctor_soon (queued)` (a High case for the clinician review demo), and patient2 and patient4 as `not_confident (queued)`.",
      ],
    },
    {
      type: "callout",
      kind: "warning",
      title: "Re-running the seed resets passwords",
      text: "Every time `seed_demo.py` runs, it sets the password of **every** demo account back to the current `DEMO_PASSWORD`. If someone changed a demo password, it is reset. This is also the fix when sign-in for demo accounts suddenly fails.",
    },
    {
      type: "p",
      text: "The Pune synthetic dataset in `data/synthetic/` is invented data. It is used only to give demo patients an age and sex and for stress tests. It is **not** real patient data and is never used to train or test the models.",
    },

    { type: "h2", id: "start-the-api", text: "Step 9: Start the API" },
    {
      type: "p",
      text: "Open a terminal in the repository root (activate the virtual environment first if you made one) and run:",
    },
    { type: "code", lang: "bash", code: "python -m uvicorn apps.api.main:app --port 8000" },
    {
      type: "list",
      items: [
        "Startup takes about **30 seconds**. The API first loads the three disease models and then the assistant language model. Wait until uvicorn prints that the application startup is complete.",
        "Check it: open `http://localhost:8000/health` in a browser. It returns `\"status\": \"healthy\"`.",
        "The interactive API documentation is at `http://localhost:8000/docs`. See also [API reference](/admin/docs/api-reference).",
        "Add `--reload` while you are changing Python code, so the server restarts by itself after each save (each restart loads the models again).",
        "Using `python -m uvicorn` instead of plain `uvicorn` makes sure the server runs with the same Python that has the packages.",
      ],
    },

    { type: "h2", id: "start-the-web-app", text: "Step 10: Start the web app" },
    { type: "p", text: "Open a **second** terminal in the repository root and run:" },
    { type: "code", lang: "bash", code: "npm --prefix apps/web run dev" },
    {
      type: "p",
      text: "When it says it is ready, open **http://localhost:3000** in your browser. The first page load can be slow because Next.js builds each page the first time it is opened.",
    },
    {
      type: "callout",
      kind: "tip",
      title: "Both at once",
      text: "From the repository root, `npm run dev` starts the API (with `--reload`) and the web app together in one terminal, with coloured `api` and `web` labels. This needs the root `npm install` from Step 3.",
    },

    { type: "h2", id: "sign-in", text: "Step 11: Sign in" },
    {
      type: "p",
      text: "Click **Sign In** on the landing page, or go straight to `http://localhost:3000/auth/login`. There are also portal addresses: `/login/patient`, `/login/doctor` and `/login/admin`. They only open the same sign-in page with a different heading (Patient portal, Clinician portal, Governance portal).",
    },
    {
      type: "image",
      src: "/docs/getting-started/login.png",
      alt: "The VITALNEX sign-in page with email and password fields and a Sign in button",
      caption: "The sign-in page at /auth/login (signed out).",
      markers: [
        { n: 1, text: "**Email** — type the demo account email, for example `patient1@vitalnex.demo`." },
        { n: 2, text: "**Password** — the demo password (`DEMO_PASSWORD` from `.env`)." },
        { n: 3, text: "**Forgot password?** — opens the reset page, which emails a reset link. Demo addresses are not real inboxes, so for demo accounts re-run the seed script instead." },
        { n: 4, text: "**Sign in** — signs you in and opens the home page for your role." },
        { n: 5, text: "**Language switch** — choose English, Hindi or Marathi for the screens." },
      ],
    },
    {
      type: "image",
      src: "/docs/getting-started/login-clinician-portal.png",
      alt: "The same sign-in page with the heading Clinician portal",
      caption: "Opening /login/doctor leads to the same form with the heading \"Clinician portal\".",
      markers: [
        { n: 1, text: "The portal name. It changes only this heading." },
        { n: 2, text: "The notice \"Your access depends on your account, not on the portal you choose.\"" },
      ],
    },
    {
      type: "p",
      text: "After sign-in, the app reads your **role** from your profile in the database, not from the portal you picked. Patients go to `/dashboard`, clinicians to `/doctor/dashboard` and admins to `/admin/dashboard`. If you try to open a page your role is not allowed to see, you are sent to your own home page (or to the sign-in page if you are signed out). More detail: [Accounts and login](/admin/docs/accounts-and-login).",
    },

    { type: "h2", id: "demo-accounts", text: "Demo accounts" },
    {
      type: "p",
      text: "These accounts are created by `supabase/seed/seed_demo.py`. All are synthetic. They all share one password: the `DEMO_PASSWORD` value in `.env`. You choose it yourself in your own `.env`. It is a **demo-only password**; never use a real password for it.",
    },
    {
      type: "table",
      head: ["Email", "Role", "Notes"],
      rows: [
        ["`admin@vitalnex.demo`", "Admin", "Governance, fairness, override log, audit log, this documentation."],
        ["`dr.joshi@vitalnex.demo`", "Clinician", "Cardiology. Speaks English, Marathi, Hindi."],
        ["`dr.khan@vitalnex.demo`", "Clinician", "Endocrinology. Speaks English, Hindi."],
        ["`dr.patil@vitalnex.demo`", "Clinician", "Neurology. Speaks English, Marathi."],
        ["`patient1@vitalnex.demo`", "Patient", "English. Shares with clinicians. Latest demo visit is a High result (\"See a doctor soon\")."],
        ["`patient2@vitalnex.demo`", "Patient", "Hindi. Shares. Demo visits are \"not confident\"."],
        ["`patient3@vitalnex.demo`", "Patient", "Marathi. Shares."],
        ["`patient4@vitalnex.demo`", "Patient", "English. Shares. Demo visits are \"not confident\"."],
        ["`patient5@vitalnex.demo`", "Patient", "Hindi. Does **not** share with clinicians."],
        ["`patient6@vitalnex.demo`", "Patient", "Marathi. Does **not** share with clinicians."],
      ],
    },
    {
      type: "callout",
      kind: "info",
      title: "Language is not switched for you",
      text: "Each demo patient has a stored preferred language, but the app does not apply it at sign-in. Use the EN / HI / MR switch by hand.",
    },
    {
      type: "p",
      text: "Clinicians only see patients who agreed to share (patients 1 to 4). The database enforces this with Row Level Security, not only the page.",
    },

    { type: "h2", id: "first-tour", text: "A first 5-minute tour" },
    {
      type: "p",
      text: "Use two browser windows (one normal, one private) so you can be signed in as a patient and a clinician at the same time. For a longer, timed walk-through see `docs/DEMO_SCRIPT.md`.",
    },
    { type: "h3", text: "As a patient (patient1)" },
    {
      type: "steps",
      items: [
        { title: "Overview", text: "After sign-in you land on **Overview** (`/dashboard`). The left menu holds all patient pages. See [Patient dashboard](/admin/docs/patient-dashboard)." },
        { title: "Health History", text: "Open **Health History** (`/history`). The latest demo visit shows \"See a doctor soon\" and that a clinician will review it. See [History and reports](/admin/docs/history-and-reports)." },
        { title: "Risk Assessment", text: "Open **Risk Assessment** (`/risk-assessment`), answer the questions and submit. Unanswered questions stay unanswered; nothing is filled in for you. Each condition gets a level (Low, Moderate, High or \"not confident\"), the main factors and a next step. See [Risk assessment](/admin/docs/risk-assessment) and [Understanding results](/admin/docs/understanding-results). Submitting saves a new assessment." },
        { title: "AI Health Assistant", text: "Open **AI Health Assistant** (`/ai-assistant`) and ask a question. Emergency words (for example chest pain) bring up the 108 / 112 emergency card at once. See [AI assistant](/admin/docs/ai-assistant)." },
        { title: "Other pages", text: "Look at **Reports** (PDF and QR share), **Care Connect** and **Appointments** (book a demo slot), **AI Trust Passport** (how the AI works) and **Settings** (consents and your data)." },
      ],
    },
    { type: "h3", text: "As a clinician (dr.joshi)" },
    {
      type: "steps",
      items: [
        { title: "Clinician dashboard", text: "Sign in at `/login/doctor`. You land on the **Clinician dashboard** (`/doctor/dashboard`)." },
        { title: "Patients & reviews", text: "Open **Patients & reviews** (`/doctor/patients`). The review queue lists High and \"not confident\" cases of patients who share, with the reason. patient1 appears with reason High band." },
        { title: "Open a case", text: "Open a case to see the answers, probabilities, the confidence check and the top factors. You can agree, or override with a required reason. Every override is logged. See [Clinician workspace](/admin/docs/clinician-workspace)." },
        { title: "Appointments", text: "**Appointments** (`/doctor/appointments`) lists bookings made by patients." },
      ],
    },
    { type: "h3", text: "As an admin" },
    {
      type: "steps",
      items: [
        { title: "Admin overview", text: "Sign in at `/login/admin`. You land on **Admin overview** (`/admin/dashboard`)." },
        { title: "Governance & audit", text: "Open **Governance & audit** (`/admin/governance`) for model cards, fairness tables, override rates and the audit log. See [Admin console](/admin/docs/admin-console)." },
        { title: "Documentation", text: "Open **Documentation** (`/admin/docs`) — the pages you are reading now." },
      ],
    },
    {
      type: "callout",
      kind: "info",
      title: "Switched-off pages",
      text: "Some old pages are kept on disk but are not part of the MVP and are not shown in the menus: `/admin/datasets`, `/admin/model-lab`, `/consultation/*`, `/health-insights` and `/voice`. Do not use them in a demo.",
    },
    {
      type: "p",
      text: "If you changed demo data during the tour (for example withdrew a consent or overrode a result), restore it by running `seed_demo.py` and then `seed_history.py` again.",
    },

    { type: "h2", id: "run-the-tests", text: "Running the tests" },
    {
      type: "code",
      lang: "bash",
      code: "python -m pytest tests -v                                        # all tests (live Supabase tests need .env)\npython -m pytest tests -q --deselect tests/test_live_supabase.py   # offline tests only\nnpm --prefix apps/web run lint\nnpm --prefix apps/web run i18n:check                             # English / Hindi / Marathi keys match",
    },
    {
      type: "p",
      text: "Live database tests can be slow on a weak network and may need a retry. More: [Testing](/admin/docs/testing).",
    },

    { type: "h2", id: "troubleshooting", text: "Troubleshooting" },
    {
      type: "faq",
      items: [
        {
          q: "Login says \"Email or password is incorrect\" even with the right password.",
          a: "The sign-in page shows this message for **any** sign-in error, so the password may not be the problem. Check, in order: (1) the web app points to the **same Supabase project** as the API — if `apps/web/.env.local` exists, its `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` override the root `.env`, and a URL for a different project makes every demo login fail with this message; (2) the seed has been run on that project; (3) `DEMO_PASSWORD` is what you think it is — re-run `python supabase/seed/seed_demo.py` to reset every demo password to it.",
        },
        {
          q: "I changed a NEXT_PUBLIC_ variable but nothing changed.",
          a: "Variables that start with `NEXT_PUBLIC_` are baked into the web app when the dev server starts. Stop the web dev server (Ctrl+C) and start it again with `npm --prefix apps/web run dev`. A browser refresh alone is not enough.",
        },
        {
          q: "Sign-in says \"Sign-in is not available: Supabase is not configured for this app.\"",
          a: "The web app cannot find `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Fill them in the root `.env` (or `apps/web/.env.local`) and restart the web dev server.",
        },
        {
          q: "Sign-in says \"This account has no VITALNEX profile.\"",
          a: "The sign-in worked in Supabase but there is no matching row in the profiles table. For demo accounts, run `seed_demo.py` again. Check that all three migrations were applied.",
        },
        {
          q: "The API fails with ModuleNotFoundError (for example lightgbm, torch or sentence_transformers).",
          a: "The Python that runs uvicorn does not have the packages. A project `.venv` may exist but be incomplete. Either install both requirement files into that `.venv`, or deactivate it (`deactivate`) and use the global Python where the packages are installed — that is how the main development laptop runs. Starting with `python -m uvicorn` guarantees uvicorn uses the same Python as `python`.",
        },
        {
          q: "The web app loads but every page shows errors or empty data.",
          a: "The API is probably not running yet, or is still starting. Wait about 30 seconds after starting it, then check `http://localhost:8000/health`. Also check that `NEXT_PUBLIC_API_URL` is `http://localhost:8000` and that `CORS_ORIGINS` includes the address you open the web app on.",
        },
        {
          q: "The seed script stops with \"DEMO_PASSWORD must be set in .env\".",
          a: "Add a `DEMO_PASSWORD=` value of your choice to the root `.env` and run the script again.",
        },
        {
          q: "The seed script cannot import `supabase`.",
          a: "The repository has a folder named `supabase/`, which has the same name as the Python package `supabase`. Run the seed scripts exactly as shown, from the repository root, with `python supabase/seed/seed_demo.py` (a file path, not `-m`). The scripts load their neighbours by path for this reason.",
        },
        {
          q: "Port 8000 or 3000 is already in use.",
          a: "A server from an earlier session is still running. Use it as it is, or stop it first. On Windows, `netstat -ano | findstr :8000` shows the process id; stop it in Task Manager. On macOS/Linux use `lsof -i :8000`.",
        },
        {
          q: "The assistant says it is limited or only handles emergencies.",
          a: "The local language model could not be loaded, usually because the one-time download from Hugging Face failed. Check the internet connection and restart the API. Emergency and medicine-refusal rules still work without it.",
        },
        {
          q: "Live tests fail with \"Invalid login credentials\".",
          a: "The demo passwords no longer match `DEMO_PASSWORD`. Run `seed_demo.py` and `seed_history.py` again, then re-run the tests.",
        },
      ],
    },

    { type: "h2", id: "next-steps", text: "Where to go next" },
    {
      type: "list",
      items: [
        "[Introduction](/admin/docs/introduction) — what VITALNEX is and is not.",
        "[Architecture](/admin/docs/architecture) — how the web app, API, models and Supabase fit together.",
        "[Responsible AI](/admin/docs/responsible-ai) — the NITI Aayog principles and how the app follows them.",
        "[FAQ](/admin/docs/faq) — more questions and answers.",
      ],
    },
  ],
};

export default page;
