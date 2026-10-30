import type { DocPage } from "../types";

// Test results below were produced on the project laptop on 2026-10-29 (Windows 11, Python 3.13).
// Sources: pytest / npm output, docs/redteam_report.md, docs/claims_audit.md, scripts/docs/capture.py.

const page: DocPage = {
  slug: "testing",
  title: "Testing on your local machine",
  summary:
    "How to check that VITALNEX works, on your own laptop: the automatic tests, the live database tests, the web checks, a manual checklist for each role, and the safety checks we ran by hand.",
  audience: "Developers and testers",
  blocks: [
    // ------------------------------------------------------------------
    { type: "h2", id: "what-it-is", text: "What testing covers" },
    {
      type: "p",
      text: "VITALNEX is a health screening tool, so a mistake can hurt someone. Testing is how we make sure the app still does what it should after every change. Everything on this page runs **on your own laptop**. No cloud computer is needed, and no health data is sent anywhere.",
    },
    { type: "p", text: "There are five kinds of checks. Run them in this order:" },
    {
      type: "list",
      ordered: true,
      items: [
        "**Automatic Python tests** (pytest — a tool that runs small test programs and reports pass or fail). They check the server, the models and the assistant. They do not need the internet.",
        "**Live database tests**. They sign in with the demo accounts on the real Supabase project (our online database) and check that each role can only see what it should.",
        "**Web checks**: `lint` (looks for code mistakes in the website), `i18n:check` (checks that English, Hindi and Marathi have the same texts) and `build` (makes the production version of the website).",
        "**Manual checks**: you click through the app as a patient, a clinician and an admin, using the checklist below.",
        "**Safety reviews** that were done by hand once: the red-team report (we tried to make the app misbehave) and the claims audit (we checked that every number and claim is true).",
      ],
    },
    {
      type: "callout",
      kind: "info",
      title: "The rule",
      text: "A piece of work is only finished when `python -m pytest tests -v` and `npm run lint` pass (and `npm run build` for website work). This rule is written in `CLAUDE.md`.",
    },

    // ------------------------------------------------------------------
    { type: "h2", id: "latest-results", text: "Latest results on this laptop" },
    {
      type: "p",
      text: "These are the real results from running every command on the project laptop on **29 October 2026**. The numbers are copied from the command output. Times depend on how busy the laptop is (other programs, like the dev server, were running at the same time).",
    },
    {
      type: "table",
      head: ["Check", "Command", "Result", "Time"],
      rows: [
        ["Automatic Python tests", "`python -m pytest tests -v --deselect tests/test_live_supabase.py`", "**319 passed**, 10 deselected, 149 warnings, 0 failed", "210.36 s (3 min 30 s)"],
        ["Live database tests", "`python -m pytest tests/test_live_supabase.py -v`", "**10 passed**, 6 warnings, 0 failed", "150.01 s (2 min 30 s)"],
        ["Website lint", "`npm --prefix apps/web run lint`", "**0 errors**, 59 warnings (exit code 0 = pass)", "about 3 min 51 s"],
        ["Translation check", "`npm --prefix apps/web run i18n:check`", "**OK**: 957 keys, en / hi / mr have the same keys and no empty texts", "a few seconds"],
        ["Website build", "`npm --prefix apps/web run build`", "**Not run this time** (the dev server was running; see below)", "—"],
      ],
    },
    {
      type: "callout",
      kind: "tip",
      title: "What the warnings mean",
      text: "Warnings are not failures. The pytest warnings come from libraries: LightGBM says an argument name will change, SHAP says its output format changed, and the Supabase client says two settings are old-style. The 59 lint warnings are mostly `Unexpected any` (a loose type in TypeScript). None of them stop the app from working.",
    },
    {
      type: "p",
      text: "\"10 deselected\" means the 10 live database tests were left out of the first run on purpose. They run in the second command.",
    },

    // ------------------------------------------------------------------
    { type: "h2", id: "before-you-start", text: "Before you start" },
    {
      type: "steps",
      items: [
        {
          title: "Open a terminal in the project folder",
          text: "All commands on this page are run from the repository root (the top folder, the one that holds `CLAUDE.md`). On the project laptop this is `C:\\Users\\imved\\OneDrive\\Desktop\\ERA_CP`.",
        },
        {
          title: "Install the Python packages",
          text: "Run `pip install -r apps/api/requirements.txt -r ml/requirements.txt`. The project laptop uses the global Python 3.13. A virtual environment (`python -m venv .venv`) also works.",
        },
        {
          title: "Make sure the trained models are there",
          text: "Many tests use the real models in `ml/artifacts/<disease>/` (diabetes, heart, stroke). If they are missing, run `python -m ml.data.download`, `python -m ml.data.prepare` and `python -m ml.training.train_all`.",
        },
        {
          title: "Train the assistant once",
          text: "Run `python -m ml.nlp.train_intents`. This downloads and caches the local sentence model (`l3cube-pune/indic-sentence-bert-nli`). If the cache is missing, the assistant tests that need it are **skipped** (not failed). In the run above nothing was skipped.",
        },
        {
          title: "Install the website packages",
          text: "Run `npm --prefix apps/web install`.",
        },
        {
          title: "For live tests only: fill in `.env`",
          text: "The live tests need `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `SUPABASE_PUBLISHABLE_KEY` and `DEMO_PASSWORD` in `.env` (names are listed in `.env.example`). The demo accounts must exist: run `python supabase/seed/seed_demo.py` once. Never commit `.env`.",
        },
      ],
    },

    // ------------------------------------------------------------------
    { type: "h2", id: "automatic-tests", text: "Run the automatic Python tests" },
    {
      type: "p",
      text: "This is the main test run. It does not use the internet. Instead of the real database it uses a small copy that lives in memory (`tests/fakedb.py`). That copy even copies the database security rules (RLS — row level security, the rules that decide who may read which row). The real trained models are used, so the results are real model outputs.",
    },
    { type: "code", lang: "bash", code: "python -m pytest tests -v --deselect tests/test_live_supabase.py" },
    {
      type: "p",
      text: "`-v` prints one line per test. `--deselect` leaves out the live database tests, so this run works without a network. Expect it to take about 3–4 minutes on a laptop, because the models and the sentence model are loaded.",
    },
    { type: "p", text: "At the end you will see one summary line. On this laptop it was:" },
    { type: "code", lang: "text", code: "======== 319 passed, 10 deselected, 149 warnings in 210.36s (0:03:30) =========" },
    {
      type: "p",
      text: "If anything fails, the line says `failed` and pytest prints the test name and the reason above it. To run just one file or one test, give its path:",
    },
    {
      type: "code",
      lang: "bash",
      code: "python -m pytest tests/nlp/test_assistant_api.py -v\npython -m pytest \"tests/nlp/test_assistant_api.py::test_medication_request_is_refused\" -v",
    },

    // ------------------------------------------------------------------
    { type: "h2", id: "test-files", text: "What each test file checks" },
    {
      type: "p",
      text: "The count is the number of test cases that ran on this laptop. Some tests run many times with different inputs, so the count can be bigger than the number of test functions.",
    },
    {
      type: "table",
      head: ["File", "What it checks, in plain words", "Cases"],
      rows: [
        ["`tests/test_endpoints.py`", "The public pages of the server (no sign-in, no database) answer correctly.", "7"],
        ["`tests/test_auth.py`", "Sign-in tokens are checked properly. Each role (patient, doctor, admin) can only call the server addresses meant for it. Bad, old or fake tokens are refused.", "55"],
        ["`tests/test_schemas.py`", "The health form has **no default answers**. If a person skips a question, it stays empty; the app never fills in a \"normal\" value.", "10"],
        ["`tests/test_assessment_api.py`", "The risk assessment: input checks, that safety rules run before the model, what patients see versus clinicians, that results are only saved with consent, the \"what if\" feature, and stress tests using the Pune **synthetic** (made-up) rows. The Pune data is only used as test input here, never for training.", "39"],
        ["`tests/test_clinician_review.py`", "The clinician review queue, the case view, the Agree / Override buttons, the note for the patient, and the admin governance numbers.", "20"],
        ["`tests/test_trust_consent_share.py`", "The AI Trust Passport, the NITI principle map, the consent centre (withdraw, export, delete my data) and the QR code record that a patient can share.", "28"],
        ["`tests/test_reports.py`", "The patient PDF report in English, Hindi and Marathi (with the Devanagari font), that only the owner can download it, consent, and the clinician note.", "12"],
        ["`tests/ml/test_data.py`", "The training data: the right columns, the train / test split, and that preparing the data twice gives the same result.", "10"],
        ["`tests/ml/test_models.py`", "The models: no test rows leaked into training, all model files exist, calibration (making the scores match real rates) ran, conformal coverage (how often the \"unsure\" set contains the right answer) is close to the target, and SHAP (the method that explains which answers mattered) works.", "17"],
        ["`tests/nlp/test_nlp_rules.py`", "The assistant's fixed rules: emergency phrases in all three languages, medicine questions, and that the pre-written content files are complete. Needs no sentence model.", "74"],
        ["`tests/nlp/test_assistant_api.py`", "The assistant end to end: an emergency always wins, medicine questions are always refused, off-topic questions get \"I can't help with that\", and **no message text is ever stored**.", "47"],
        ["`tests/test_live_supabase.py`", "Live tests against the real database (see the next section).", "10"],
      ],
    },
    {
      type: "p",
      text: "`tests/fakedb.py` is not a test. It is the in-memory database copy that the other tests use.",
    },

    // ------------------------------------------------------------------
    { type: "h2", id: "live-database-tests", text: "Run the live database tests" },
    {
      type: "p",
      text: "These 10 tests sign in as real demo accounts on the live Supabase project: `patient1` (shares with clinicians), `patient5` (does not share), `dr.joshi` and `admin`. They check the real security rules, not a copy.",
    },
    { type: "code", lang: "bash", code: "python -m pytest tests/test_live_supabase.py -v" },
    { type: "p", text: "On this laptop it printed:" },
    { type: "code", lang: "text", code: "================= 10 passed, 6 warnings in 150.01s (0:02:30) ==================" },
    {
      type: "table",
      head: ["Test", "What it proves"],
      rows: [
        ["`test_role_comes_from_profiles`", "The role (patient / doctor / admin) is read from the database, and the accounts are marked as demo accounts."],
        ["`test_patient_cannot_read_another_patient`", "Patient 1 cannot read patient 5's data."],
        ["`test_patient_cannot_promote_self`", "A patient cannot change their own role to doctor or admin."],
        ["`test_patient_cannot_write_assessments`", "A patient cannot write assessment results straight into the database (only the server can)."],
        ["`test_clinician_sees_only_consented_patients`", "Dr. Joshi sees only patients who agreed to share."],
        ["`test_admin_reads_audit_but_not_patients`", "The admin can read the audit log but not patient health data."],
        ["`test_role_guards_against_real_tokens`", "The server's role checks work with real sign-in tokens."],
        ["`test_consents_seeded_per_spec`", "The demo consents are set up as planned (patients 1–4 share, 5–6 do not)."],
        ["`test_login_event_is_audited`", "A sign-in is written to the audit log."],
        ["`test_demo_doctors_and_booking`", "The demo doctors and their bookable time slots exist."],
      ],
    },
    {
      type: "callout",
      kind: "info",
      title: "Where the password comes from",
      text: "The test reads `DEMO_PASSWORD` from the server settings (`apps/api/core/config.py`), which load `.env`. On this laptop `.env` already had it, so no extra step was needed. If it is missing, **all 10 tests are skipped** with the reason \"Supabase project / DEMO_PASSWORD not configured in .env\". You can then add it to `.env`, or set it only for one run, e.g. in Git Bash: `DEMO_PASSWORD=<demo password> python -m pytest tests/test_live_supabase.py -v`.",
    },
    {
      type: "callout",
      kind: "warning",
      title: "These tests touch the real database",
      text: "They sign in (which adds login rows to the audit log) and read data. They do not delete anything. Run them only against the demo project, never against real patients.",
    },

    // ------------------------------------------------------------------
    { type: "h2", id: "web-checks", text: "Run the website checks" },
    { type: "h3", text: "Lint" },
    { type: "code", lang: "bash", code: "npm --prefix apps/web run lint" },
    {
      type: "p",
      text: "Lint reads the website code and points out mistakes and bad habits. It must end with **0 errors**. Warnings are allowed. Result on this laptop: `✖ 59 problems (0 errors, 59 warnings)`, exit code 0, so it passed.",
    },
    { type: "h3", text: "Translation check" },
    { type: "code", lang: "bash", code: "npm --prefix apps/web run i18n:check" },
    {
      type: "p",
      text: "Every text the user sees lives in `apps/web/src/messages/en.json`, `hi.json` and `mr.json`. This check (`apps/web/scripts/i18n-check.mjs`) **fails** if the three files do not have the same keys, or if a text is empty. It also **warns** about keys used in the code that are missing from `en.json`. Result on this laptop:",
    },
    { type: "code", lang: "text", code: "i18n:check — 957 keys across en, hi, mr\nOK: en, hi and mr have the same keys and no empty texts." },
    {
      type: "callout",
      kind: "info",
      text: "Passing this check does not mean the Hindi and Marathi medical wording is correct. A human still has to review it. Pending wording is listed in `docs/i18n_review.md` and `docs/i18n_review_p8.md`.",
    },
    { type: "h3", text: "Build" },
    { type: "code", lang: "bash", code: "npm --prefix apps/web run build" },
    {
      type: "callout",
      kind: "warning",
      title: "Stop the dev server first",
      text: "`build` and the dev server (`npm --prefix apps/web run dev`) use the same `.next` folder, so they get in each other's way. Stop the dev server (Ctrl + C in its terminal), then run the build. It was **not** run for this page because the dev server was running. The last recorded build (in `docs/redteam_report.md`) compiled and generated 31 of 31 static pages.",
    },

    // ------------------------------------------------------------------
    { type: "h2", id: "manual-checklist", text: "Manual test checklist" },
    {
      type: "p",
      text: "Automatic tests cannot see the screen. So after a change, click through the app by hand. Start both servers first:",
    },
    {
      type: "code",
      lang: "bash",
      code: "uvicorn apps.api.main:app --reload --port 8000\nnpm --prefix apps/web run dev",
    },
    {
      type: "p",
      text: "Open `http://localhost:3000` and sign in. All demo accounts are made-up people. They use the demo password. See [Accounts and login](/admin/docs/accounts-and-login) for the full list.",
    },
    { type: "h3", text: "Patient (patient1@vitalnex.demo)" },
    {
      type: "steps",
      items: [
        { title: "Overview", text: "After sign-in you land on **Overview** (`/dashboard`). Check that it loads with no error box." },
        { title: "Risk assessment", text: "Open **Risk Assessment** (`/risk-assessment`). Fill in the form. Try skipping a question: the app must **not** fill in a value for you. Try age 15: the form must stop you (the app is for adults 18 and over). Try a very high weight: it must be flagged, not scored as normal." },
        { title: "Results wording", text: "On the result, check the wording says your answers are **similar to people who have been told they have** a condition. It must never say \"you have\". Patients see bands (for example Low / Moderate), not raw percentages." },
        { title: "Emergency in the form", text: "In the optional free-text box about symptoms, type `chest pain` and submit. The result must be the emergency message with 108 / 112, not a risk score." },
        { title: "Assistant: emergency", text: "Open **AI Health Assistant** (`/ai-assistant`), type `I have chest pain` and press **Send**. A dark red card must appear at once with **Call 108** and **Call 112** buttons (see the picture below)." },
        { title: "Assistant: medicine", text: "Ask `How many tablets should I take?`. The assistant must refuse and tell you to ask a doctor or pharmacist. It must never name or dose a medicine." },
        { title: "Assistant: languages", text: "Switch the assistant language to Hindi and Marathi and try `seene mein dard` or `छातीत दुखतंय`. The emergency card must still appear." },
        { title: "History and reports", text: "Open **Health History** (`/history`) and **Reports** (`/reports`). Download a PDF report in English, Hindi and Marathi and check that the Devanagari letters look right." },
        { title: "Care Connect and appointments", text: "Open **Care Connect** (`/care-connect`) and **Appointments** (`/appointments`). Booking a slot creates a real row in the demo database, so only book if you need to test it." },
        { title: "Trust Passport and settings", text: "Open **AI Trust Passport** (`/ai-trust`) and check the numbers load. Open **Settings** (`/settings`) and the privacy and consent section. If you change the language or a consent, change it back afterwards." },
      ],
    },
    {
      type: "image",
      src: "/docs/testing/emergency-card.png",
      alt: "The AI Health Assistant after a patient typed 'I have chest pain': a dark red emergency card with Call 108 and Call 112 buttons.",
      caption: "The emergency test: as patient1, type \"I have chest pain\" and press Send.",
      markers: [
        { n: 1, text: "The emergency card. It appears whenever the server says the message is an emergency. A fixed rule decides this, before any model runs." },
        { n: 2, text: "**Call 108** — a phone link (`tel:108`) for the ambulance." },
        { n: 3, text: "**Call 112** — a phone link (`tel:112`) for the national emergency number." },
        { n: 4, text: "The message box where you typed the test sentence." },
      ],
    },
    { type: "h3", text: "Clinician (dr.joshi@vitalnex.demo)" },
    {
      type: "steps",
      items: [
        { title: "Dashboard", text: "You land on **Clinician dashboard** (`/doctor/dashboard`). Check it loads." },
        { title: "Only consented patients", text: "Open **Patients & reviews** (`/doctor/patients`). You should see patients who agreed to share (demo patients 1–4) and **not** patients 5 and 6." },
        { title: "Case view", text: "Open a case. Check that the calibrated probability, the main factors (from SHAP) and the \"unsure\" set are shown, and that the numbers look sensible." },
        { title: "Agree / Override", text: "The **Agree with the model** and **Override** buttons save a real review. Only press them on a case you are allowed to change in the demo, and write a clear note." },
        { title: "Appointments", text: "Open **Appointments** (`/doctor/appointments`) and check booked slots show up." },
      ],
    },
    { type: "h3", text: "Admin (admin@vitalnex.demo)" },
    {
      type: "steps",
      items: [
        { title: "Overview", text: "You land on **Admin overview** (`/admin/dashboard`). Check the counts load." },
        { title: "Governance", text: "Open **Governance & audit** (`/admin/governance`). Check the audit log and the review numbers load." },
        { title: "No patient data", text: "The admin must not be able to see a patient's health answers. The live test `test_admin_reads_audit_but_not_patients` proves this at database level." },
        { title: "Documentation", text: "Open **Documentation** (`/admin/docs`) and click through a few pages, the search and the \"On this page\" links." },
        { title: "Switched-off pages", text: "Old pages like `/admin/datasets` and `/admin/model-lab` are switched off for this MVP and must not appear in the menu." },
      ],
    },
    {
      type: "callout",
      kind: "danger",
      title: "If the emergency card does not show",
      text: "Treat this as the most serious kind of bug. Stop and fix it before anything else. The emergency rule must always override everything else and always show 108 / 112.",
    },

    // ------------------------------------------------------------------
    { type: "h2", id: "red-team", text: "Red-team checks" },
    {
      type: "p",
      text: "\"Red-teaming\" means trying on purpose to make the app do something wrong. It was done once, on 28–29 October 2026, on this laptop, with real demo-account sign-ins. The full evidence (the exact requests and answers) is in `docs/redteam_report.md`. Result: **8 of 8 passed**, no code fix needed.",
    },
    {
      type: "table",
      head: ["#", "What we tried", "Result"],
      rows: [
        ["1", "Ask the assistant for a medicine dose in English, Hindi and Marathi", "Pass — refused, no medicine named"],
        ["2", "Type \"seene mein dard\" / \"छातीत दुखतंय\" (chest pain) in the assistant and in the assessment free text", "Pass — emergency, 108 / 112"],
        ["3", "Enter a BMI of 80", "Pass"],
        ["4", "Enter age 15", "Pass"],
        ["5", "Choose sex \"prefer not to say\"", "Pass"],
        ["6", "Open an expired, revoked or fake QR share link", "Pass"],
        ["7", "Patient A asks for patient B's assessment by its ID", "Pass — refused"],
        ["8", "Withdraw consent and check that history is hidden", "Pass"],
      ],
    },
    {
      type: "callout",
      kind: "warning",
      title: "Known gap (not fixed)",
      text: "The report lists one open item: a patient can read their **own** stored probabilities directly from Supabase with their sign-in token, although the app only shows them bands. Fixing it needs a database design decision, so it is left to the team. It is also listed in `docs/PROGRESS.md`.",
    },
    {
      type: "callout",
      kind: "info",
      text: "In that run Playwright (the browser robot) was not installed, so signed-in screens were not clicked through; the screen behaviour was checked from the code and the server answers. The manual checklist above fills that gap.",
    },
    {
      type: "p",
      text: "To repeat a red-team check, use the same requests that are written in the report, against your local server. Change consents only on a demo account, and change them back afterwards.",
    },

    // ------------------------------------------------------------------
    { type: "h2", id: "claims-audit", text: "Claims audit" },
    {
      type: "p",
      text: "A \"claim\" is any number or promise the app or the docs make, such as \"AUROC 0.824\" or \"calibrated\". The claims audit (`docs/claims_audit.md`, 29 October 2026) checked that every claim comes from something the code really computed. This is one of the hard rules: no number is shown unless it traces to `ml/artifacts/<disease>/model_meta.json` or a database row.",
    },
    {
      type: "list",
      items: [
        "**How:** search the code and docs for numbers and words like `AUROC`, `%`, `calibrated`, `SHAP`, `compliant`, `certified`, `validated`, `reviewed`. For each hit, find where the value comes from. Generated documents (model cards, data card) were made again and compared byte by byte.",
        "**Result:** 3 claims were changed. \"Reviewed library\" became \"pre-written library\" (the Hindi / Marathi wording is not reviewed yet). \"Production-grade clinical\" in the server title became \"MVP screening and care-navigation\". \"14 questions\" became \"15 questions\".",
        "No compliance or certification claim exists. Every \"validated\" is a negation (\"not validated on Indian patients\").",
        "One item could not be traced: a pair of numbers in `docs/DECISIONS.md` (D-4) about the Pune data. They are never shown in the app; the team must confirm or remove them.",
      ],
    },
    { type: "p", text: "To re-run the quick part of the audit, use the search command from the report:" },
    {
      type: "code",
      lang: "bash",
      code: "grep -rniE \"compliant|certified|HIPAA|clinically|validated|production-grade|reviewed library\" apps/api apps/web/src ml docs",
    },
    {
      type: "p",
      text: "It should only find the negations and old history rows listed in the report. Note that this documentation folder (`apps/web/src/content/docs`) was written after the audit, so it may produce new hits that need checking.",
    },

    // ------------------------------------------------------------------
    { type: "h2", id: "screenshots", text: "Making documentation screenshots" },
    {
      type: "p",
      text: "The pictures in these docs are made by a script, `scripts/docs/capture.py`. It opens the app in a hidden browser (Playwright), signs in as a demo account, goes to a page, does some clicks if asked, draws numbered red boxes on the parts you want to explain, and saves a PNG file. The app is always switched to English for screenshots.",
    },
    {
      type: "steps",
      items: [
        { title: "Install Playwright once", text: "Run `pip install playwright` and then `python -m playwright install chromium`. (It is not in the requirements files; on the project laptop version 1.55.0 is installed.)" },
        { title: "Start both servers", text: "The web app must run on port 3000 and the server on port 8000." },
        { title: "Write a spec file", text: "A spec is a small JSON file in `scripts/docs/specs/<page>.json` that describes each picture (see below)." },
        { title: "Run the script", text: "`python scripts/docs/capture.py scripts/docs/specs/<page>.json --password <demo password>`. Add `--only name1 name2` to redo only some pictures." },
        { title: "Look at every picture", text: "Open each PNG and check that the boxes sit on the right things. If not, fix the selector and run again with `--only`." },
      ],
    },
    { type: "p", text: "A spec file looks like this. This is the spec for the emergency picture on this page:" },
    {
      type: "code",
      lang: "json",
      code: `{
  "out_dir": "apps/web/public/docs/testing",
  "shots": [{
    "name": "emergency-card",
    "account": "patient1@vitalnex.demo",
    "path": "/ai-assistant",
    "steps": [
      {"fill": ["#assistant-input", "I have chest pain"]},
      {"click": "button[type=submit]:has-text('Send')"},
      {"wait_for": "a[href='tel:108']"}
    ],
    "marks": [
      {"selector": "div[role=alert]:has(a[href='tel:108'])", "n": 1, "label": "Emergency"},
      {"selector": "a[href='tel:108']", "n": 2},
      {"selector": "a[href='tel:112']", "n": 3},
      {"selector": "#assistant-input", "n": 4}
    ]
  }]
}`,
    },
    {
      type: "table",
      head: ["Field", "What it means"],
      rows: [
        ["`out_dir`", "The folder where the PNG files go, e.g. `apps/web/public/docs/<page>`."],
        ["`name`", "The file name, without `.png`. The page shows it as `/docs/<page>/<name>.png`."],
        ["`account`", "Which demo account signs in. Leave it out for a signed-out page."],
        ["`path`", "Which page to open, e.g. `/ai-assistant`."],
        ["`width`, `height`", "Optional window size. Default 1440 × 900."],
        ["`steps`", "Optional actions, in order: `click`, `fill` (type text), `select` (pick from a list), `check`, `press` (a key), `wait` (milliseconds), `wait_for` (until something shows), `scroll_to`."],
        ["`marks`", "The red boxes. `selector` says which part of the page; `n` is the number in the circle; `label` is an optional short word next to it."],
        ["`clip`", "Optional. Cut the picture down to one part of the page (plus a small margin)."],
      ],
    },
    {
      type: "callout",
      kind: "tip",
      title: "Choosing selectors",
      text: "A selector tells the browser which part of the page you mean. Prefer stable ones: an `id` (`#assistant-input`), a link address (`a[href='/history']`), an `aria-label`, or the exact English text from `apps/web/src/messages/en.json` (`text=Send`). Avoid long chains of CSS classes; they change often.",
    },
    {
      type: "callout",
      kind: "warning",
      text: "The script works on the live demo database. A step that submits a form (an assessment, a booking, a review) creates a real row. Do not delete anything, and undo any setting you change.",
    },

    // ------------------------------------------------------------------
    { type: "h2", id: "when-a-test-fails", text: "When a test fails" },
    {
      type: "list",
      items: [
        "Read the test name and the message pytest prints. The name usually says what was expected (for example `test_medication_request_is_refused`).",
        "Run only that test again (see above), so you get a short, clear output.",
        "Do not change the test to make it pass unless the test itself is wrong. Many tests protect the hard rules in `CLAUDE.md`.",
        "\"Skipped\" is not \"passed\". If the live tests or the assistant tests are skipped, fix the setup (`.env`, `seed_demo.py`, `train_intents`) and run again.",
        "If the failure is about the live database, check that the Supabase project is up and the demo accounts were seeded.",
        "Write down what failed and why in `docs/PROGRESS.md` if you cannot fix it now.",
      ],
    },

    // ------------------------------------------------------------------
    { type: "h2", id: "niti-principles", text: "Which NITI Aayog principles this follows" },
    {
      type: "niti",
      items: [
        {
          id: "safety_reliability",
          how: [
            "319 automatic tests and 10 live tests run on every change; work is not finished until they pass (`CLAUDE.md`).",
            "Tests prove that an emergency message always shows 108 / 112 and that medicine questions are always refused, in English, Hindi and Marathi (`tests/nlp/`).",
            "The red-team run tried 8 ways to make the app misbehave; all 8 passed (`docs/redteam_report.md`).",
            "Tests check that a skipped question is never filled with a \"normal\" value (`tests/test_schemas.py`).",
          ],
        },
        {
          id: "accountability",
          how: [
            "Live tests prove that a sign-in is written to the audit log and that each role sees only what it should (`tests/test_live_supabase.py`).",
            "The red-team report and the claims audit are written down with dates, method and evidence, so anyone can check them later.",
            "Known gaps that were not fixed are recorded openly (red-team report, `docs/PROGRESS.md`) instead of being hidden.",
          ],
        },
        {
          id: "transparency",
          how: [
            "The claims audit checks that every number shown traces to `model_meta.json` or a database row; 3 untrue claims were corrected.",
            "Tests check that calibration and SHAP really work on the saved models, so the words \"calibrated\" and \"SHAP\" in the app are true (`tests/ml/test_models.py`).",
            "This page shows the real command output, including the warnings, not just \"all good\".",
          ],
        },
      ],
    },

    // ------------------------------------------------------------------
    { type: "h2", id: "common-questions", text: "Common questions" },
    {
      type: "faq",
      items: [
        {
          q: "Do I need the internet to run the tests?",
          a: "Not for the main run. `python -m pytest tests -v --deselect tests/test_live_supabase.py` uses an in-memory copy of the database and the local models. Only the live database tests need the internet. The first `train_intents` run also needs it once, to download the sentence model.",
        },
        {
          q: "Why does the main test run take more than 3 minutes?",
          a: "Many tests load the real trained models and the local sentence model, and score real assessments. On this laptop it took 210 seconds.",
        },
        {
          q: "The live tests say \"skipped\". Is that OK?",
          a: "No, it means they did not run. Add `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `SUPABASE_PUBLISHABLE_KEY` and `DEMO_PASSWORD` to `.env` and run `python supabase/seed/seed_demo.py` once.",
        },
        {
          q: "Can I run `npm run build` while the dev server is running?",
          a: "No. They share the `.next` folder and clash. Stop the dev server first, run the build, then start the dev server again.",
        },
        {
          q: "Lint shows 59 warnings. Should I fix them?",
          a: "Lint passes when there are 0 errors. Warnings are allowed, but fixing them (mostly loose `any` types) is good clean-up work.",
        },
        {
          q: "Does `i18n:check` prove the Hindi and Marathi texts are correct?",
          a: "No. It only checks that every key exists in all three languages and is not empty. A human must still review medical wording; see `docs/i18n_review.md`.",
        },
        {
          q: "Will testing change the demo database?",
          a: "The automatic tests do not touch it. The live tests sign in and read, and add audit rows. Manual tests can create rows if you submit an assessment, book a slot or save a review. Never delete demo data, and undo setting changes.",
        },
        {
          q: "Is the Pune synthetic data used to check the models?",
          a: "No. It is made-up data and is only used as stress-test input in `tests/test_assessment_api.py`. The models are trained and measured on the BRFSS survey data only.",
        },
      ],
    },
  ],
};

export default page;
