import type { DocPage } from "../types";

// Sources: apps/web/src/app/ai-trust/page.tsx, apps/web/src/app/settings/page.tsx (ConsentCentre),
// apps/web/src/components/share/ShareManager.tsx, apps/web/src/app/share/[token]/page.tsx,
// apps/api/services/{trust_service,share_service,prediction_service,aggregates}.py,
// apps/api/routers/v1/{trust,shares,me}.py, apps/api/content/{principle_map,consent_notices}.json,
// supabase/migrations/20261026000001_p1_auth_persistence.sql, docs/ERAI_REPORT.md, docs/DECISIONS.md.

const page: DocPage = {
  slug: "trust-passport",
  title: "AI Trust Passport, consent and sharing",
  summary:
    "Three features that let people see and control how VITALNEX works: the AI Trust Passport (how the models were built and where they fail), the consent switches in My data, and read-only share links with a QR code.",
  audience: "Patients and reviewers",
  blocks: [
    // ── 1. What it is ──
    { type: "h2", id: "what-it-is", text: "What this feature is" },
    {
      type: "p",
      text: "This page covers three linked features. Together they answer three questions a patient or a reviewer may ask: **How does this AI work, and where does it go wrong?** **What am I allowing VITALNEX to do with my data?** **How do I show my results to a doctor, and only for as long as I want?**",
    },
    { type: "h3", text: "1. The AI Trust Passport" },
    {
      type: "p",
      text: "The Trust Passport is one long public page at `/ai-trust`. It shows the facts about the three screening models (diabetes or prediabetes, heart disease, stroke): which data they learned from, how well they did on test data, where they are less fair, how often they say \"not confident\", known problems, versions, and how to report a problem. At the end there is a **NITI Aayog principle map**: for each Responsible AI principle it lists the features that follow it and shows live evidence.",
    },
    {
      type: "p",
      text: "Nothing on this page is typed in by hand. Every number is read live by the server (the API, the part of VITALNEX that runs on the server and answers the web app) from the model files `ml/artifacts/<disease>/model_meta.json`, from `ml/data/stats.json`, from `docs/data_card.md`, from `docs/DECISIONS.md`, or from counts in the database. If a value cannot be read or worked out, the page says **not available**. It never shows a made-up or placeholder number.",
    },
    { type: "h3", text: "2. Consent (in My data)" },
    {
      type: "p",
      text: "Consent means the patient's permission. VITALNEX asks for permission separately for each purpose (each reason it uses data). There are **four purposes**. The patient can turn each one on or off at any time on the **Settings** page, in the **My data** part. A change applies at once.",
    },
    { type: "h3", text: "3. Sharing with a link and QR code" },
    {
      type: "p",
      text: "On the **Reports** page a patient can make a read-only link to a short summary of their screening results, plus a QR code (a square barcode a phone camera can open) for the same link. The patient chooses what goes into the summary and how long the link works (1 hour, 24 hours or 7 days). They can stop the link at any time. Anyone who opens the link sees only the parts the patient chose, and only levels (Low, Moderate, High), never percentages.",
    },
    {
      type: "callout",
      kind: "info",
      title: "Who uses these features",
      text: "Patients use all three. Clinicians and admins can open the Trust Passport too (it is in their menu), and so can anyone who is not signed in. Consent switches and share links exist only for patient accounts. Reviewers (for example, someone checking the project against NITI Aayog principles) mostly use the Trust Passport and its principle map.",
    },

    // ── 2. Where to find it ──
    { type: "h2", id: "where-to-find-it", text: "Where to find it" },
    {
      type: "table",
      head: ["Feature", "Menu item", "Web address", "Who can open it"],
      rows: [
        ["AI Trust Passport", "**AI Trust Passport** (patients: under Screening; clinicians and admins: in their own menu). Also linked in the page footer.", "`/ai-trust`", "Everyone, even without signing in"],
        ["Consent switches", "**Settings** (under Care and records), then the **My data** part, card **Consents**", "`/settings`", "Patients only. Clinicians and admins see a note that consent applies to patient accounts."],
        ["Create and manage share links", "**Reports** (under Care and records), card **Share my record (QR)**. Settings also has a button **Share my record with a QR code** that goes there.", "`/reports`", "Patients only"],
        ["Open a share link", "No menu. The person receives the link or scans the QR code.", "`/share/<token>`", "Anyone who has the link, signed in or not"],
      ],
    },
    {
      type: "p",
      text: "The `<token>` in a share address is a long random code made by the server. It is what makes the link work, so the link must be kept private like a password.",
    },

    // ── 3. Screenshots ──
    { type: "h2", id: "screenshots", text: "What the screens look like" },
    { type: "h3", text: "The Trust Passport: top of the page" },
    {
      type: "image",
      src: "/docs/trust-passport/trust-top.png",
      alt: "Top of the AI Trust Passport page with the title, a row of section buttons, and the 'What VITALNEX is, and is not' card.",
      caption: "The top of /ai-trust, signed in as the demo patient patient1.",
      markers: [
        { n: 1, text: "Page title and subtitle. The subtitle says every number is read live from the model files and the database." },
        { n: 2, text: "Section buttons (\"On this page\"). Click one to jump to that section: What VITALNEX is, Data, Models, Fairness, Abstention and coverage, Accepted trade-offs, Limitations, Versions, Report a problem, NITI Aayog principle map." },
        { n: 3, text: "\"What VITALNEX is, and is not\": it is a screening tool and care navigation; it is not a diagnosis, not medicine advice, not a replacement for a doctor, and not validated on Indian patients." },
      ],
    },
    { type: "h3", text: "The Trust Passport: model facts" },
    {
      type: "image",
      src: "/docs/trust-passport/trust-models.png",
      alt: "The 'Models, per condition' section showing the diabetes model's chosen model, test results and levels table.",
      caption: "Each condition has its own block in \"Models, per condition\". The numbers come from that condition's model_meta.json.",
      markers: [
        { n: 1, text: "Condition name and model version." },
        { n: 2, text: "Chosen model, with the reason it was chosen written under it." },
        { n: 3, text: "AUROC with its 95% confidence interval (how well the model ranks people with the condition above people without it)." },
        { n: 4, text: "Miss rate in the Low band: the share of people with the condition who were still put in Low." },
        { n: 5, text: "\"Levels on the test set\": for each level, the share of people placed there and the share of them who had the condition." },
      ],
    },
    { type: "h3", text: "The Trust Passport: fairness" },
    {
      type: "image",
      src: "/docs/trust-passport/trust-fairness.png",
      alt: "The Fairness section with yellow age-gap notices for each condition and a closed fold-out table per condition.",
      caption: "Fairness: the age gap is shown openly, and each condition has a fold-out table per group.",
      markers: [
        { n: 1, text: "Age-gap notice: recall for the youngest age group compared with the oldest." },
        { n: 2, text: "Click a condition name to open its tables of recall, false-positive rate and number of people per group." },
      ],
    },
    { type: "h3", text: "The Trust Passport: NITI Aayog principle map" },
    {
      type: "image",
      src: "/docs/trust-passport/trust-principles.png",
      alt: "The NITI Aayog principle map, with the Privacy and Security card opened to show its live evidence.",
      caption: "The principle map. Here the Privacy and Security card has \"Show evidence\" opened.",
      markers: [
        { n: 1, text: "One card per principle." },
        { n: 2, text: "\"Implemented by\": the features that follow this principle. Each one is a link to the page where you can see it." },
        { n: 3, text: "\"Live evidence: x/y\": how many evidence items could be worked out right now. Green when all are available, yellow when some are not." },
        { n: 4, text: "The evidence list: each item has a tick (available) or a cross (not available), says where it comes from (\"Source: …\"), and shows the live value." },
      ],
    },
    { type: "h3", text: "Consent switches in My data" },
    {
      type: "image",
      src: "/docs/trust-passport/consent-centre.png",
      alt: "The Consents card in Settings, My data, with four consent purposes, each with an On/Off badge and a Withdraw or Turn on button.",
      caption: "Settings → My data → Consents, signed in as patient1.",
      markers: [
        { n: 1, text: "The first purpose has a \"Required for screening\" badge: without it, a screening cannot run." },
        { n: 2, text: "Each purpose shows an On or Off badge." },
        { n: 3, text: "The button. It says \"Withdraw\" when the purpose is on and \"Turn on\" when it is off. One click changes it." },
        { n: 4, text: "\"If off: …\" tells you exactly what changes when this purpose is off. Under it: the notice version and the date it was turned on or withdrawn." },
      ],
    },
    { type: "h3", text: "Creating a share link" },
    {
      type: "image",
      src: "/docs/trust-passport/share-form.png",
      alt: "The 'Share my record (QR)' card on the Reports page with section checkboxes, expiry choices, a create button and the list of existing links.",
      caption: "Reports → Share my record (QR).",
      markers: [
        { n: 1, text: "\"What to include\": tick one or more parts. Latest screening levels is ticked at the start." },
        { n: 2, text: "\"Link works for\": 1 hour, 24 hours (chosen at the start) or 7 days." },
        { n: 3, text: "\"Create link and QR\" makes the link." },
        { n: 4, text: "\"Your share links\": every link you made, with its status and how many times it was opened." },
      ],
    },
    {
      type: "image",
      src: "/docs/trust-passport/share-created.png",
      alt: "A newly created share link with its QR code, the link in a box, the expiry time and a Copy link button; below, the list with a Revoke button.",
      caption: "Right after pressing \"Create link and QR\". This box is shown only once.",
      markers: [
        { n: 1, text: "The QR code. A doctor can scan it with a phone camera." },
        { n: 2, text: "The full link. Click inside it to select it." },
        { n: 3, text: "\"Copy link\" copies it to the clipboard." },
        { n: 4, text: "\"Revoke\" stops the link at once. It is shown only for active links." },
      ],
    },
    { type: "h3", text: "What the person opening the link sees" },
    {
      type: "image",
      src: "/docs/trust-passport/share-public.png",
      alt: "The public 'Shared screening summary' page, opened without signing in, showing who shared it, when it expires, a not-a-diagnosis notice and the latest screening levels.",
      caption: "The page at /share/<token>, opened by someone who is not signed in.",
      markers: [
        { n: 1, text: "\"Shared by the patient. Expires at …\" and \"Read-only. Nothing on this page can be changed.\"" },
        { n: 2, text: "Notice: this is a screening summary, not a diagnosis; in an emergency call 108 / 112." },
        { n: 3, text: "The parts the patient chose, for example \"Latest screening\" with one level per condition and the suggested next step." },
      ],
    },

    // ── 4. How to use it ──
    { type: "h2", id: "how-to-use-it", text: "How to use it" },
    { type: "h3", text: "Read the Trust Passport" },
    {
      type: "steps",
      items: [
        { title: "Open the page", text: "Click **AI Trust Passport** in the left menu, or go to `/ai-trust`. You do not need to sign in. While the data loads you see \"Loading\". If the server cannot be reached, you see \"The Trust Passport could not be loaded. No numbers are shown rather than old or invented ones.\"" },
        { title: "Jump to a section", text: "Use the row of round buttons under the title. Each one scrolls to a section." },
        { title: "Read \"What VITALNEX is, and is not\"", text: "Green ticks list what it is (screening, care navigation). Red crosses list what it is not (diagnosis, prescription, a replacement for a doctor, validated on Indian patients)." },
        { title: "Read \"Data\"", text: "Shows the dataset name, the survey it came from, its DOI (a permanent link to the dataset), licence, number of rows, number of exact duplicate rows, the share of people with each condition, the data hash (a fingerprint that proves which exact file was used) and a note about other data. The data card file is named at the bottom." },
        { title: "Read \"Models, per condition\"", text: "One block per condition. See the table in [What happens behind the scenes](/admin/docs/trust-passport#what-happens-behind-the-scenes) for what each number means. Under the numbers there are two pictures: a **reliability plot** (do predicted chances match what really happened?) and a **global SHAP plot** (SHAP is a method that measures how much each answer moves the model overall). Click **Read the full model card** to open the long model description." },
        { title: "Read \"Fairness\"", text: "Yellow notices show the age gap for each condition. Click a condition name to open tables with recall and false-positive rate for each group (for example by sex, age, income, education, healthcare access). Income, education and healthcare access are used **only** for this check; the app never asks for them." },
        { title: "Read \"Abstention and coverage\"", text: "Abstention means the model says \"not confident\" instead of giving a level. The table gives the target error rate (α), the coverage, the abstention rate and the out-of-distribution rate (answers unlike the training data) on test data. Under **Live counts** you see real totals from the database: screenings, how many were not confident for at least one condition, emergency triggers, and clinician reviews with how often the clinician agreed." },
        { title: "Read the rest", text: "**Accepted trade-offs** shows decisions D-22, D-23 and D-24 from `docs/DECISIONS.md`. **Limitations** lists the data limits and the known issues flagged during training. **Versions** gives the API version and each model's version and training date. **Report a problem** gives a contact (or \"not available\" if none is set) and says to call 108 / 112 in an emergency." },
        { title: "Check the principle map", text: "At the bottom, each NITI Aayog principle has a card. Click **Show evidence** to see each evidence item, its source and its live value. Click **Hide evidence** to close it." },
      ],
    },
    { type: "h3", text: "Give or withdraw consent" },
    {
      type: "steps",
      items: [
        { title: "Sign in as a patient", text: "Consent applies to patient accounts only." },
        { title: "Open Settings", text: "Click **Settings** in the left menu. Scroll to **My data**, card **Consents**." },
        { title: "Read the purpose", text: "Each purpose has a title, an On or Off badge, a notice (what VITALNEX does with your data for this purpose) and a line starting with **If off:** (what changes when it is off)." },
        { title: "Change it", text: "Click **Withdraw** to turn a purpose off, or **Turn on** to turn it on. There is no extra confirm step. A green \"Saved.\" message appears. If saving fails you see \"The change was not saved. Your consent is unchanged.\"" },
        { title: "Check the date", text: "Under the notice you see the notice version (now `v1`) and either \"On since <date>\" or \"Withdrawn on <date>\"." },
      ],
    },
    { type: "h3", text: "Create, share and revoke a link" },
    {
      type: "steps",
      items: [
        { title: "Open Reports", text: "Sign in as a patient and click **Reports**. The first card is **Share my record (QR)**." },
        { title: "Choose what to include", text: "Under **What to include**, tick any of: **Latest screening levels**, **Main factors**, **History**, **Clinician notes**. You must tick at least one, or you see \"Choose at least one section.\"" },
        { title: "Choose how long it works", text: "Under **Link works for**, pick **1 hour**, **24 hours** or **7 days**." },
        { title: "Create it", text: "Click **Create link and QR**. A box called **Your share link** appears with the QR code, the link and the exact expiry time." },
        { title: "Copy it now", text: "Click **Copy link**, or let the doctor scan the QR code. This box is shown **only once**. If you leave the page, the link cannot be shown again, because VITALNEX does not keep it. You can always make a new one." },
        { title: "Watch who opened it", text: "In **Your share links**, click \"Opened n times\" under a link to see each open: the date and time and who opened it (\"Someone not signed in\", \"A signed-in patient\", \"A signed-in clinician\" or \"A signed-in admin\"). Names are not recorded, only the type of viewer." },
        { title: "Revoke it", text: "Click **Revoke** next to an active link. Its status changes to **Revoked** at once. Anyone who opens it afterwards sees \"This link was revoked\". Links whose time has run out show **Expired**." },
      ],
    },
    {
      type: "callout",
      kind: "tip",
      title: "History consent and sharing",
      text: "If **Save my results so I can see my history** is off, the Reports page shows a yellow note: \"Your history consent is off, so a share shows no results until you turn it back on.\" You can still create a link, but the person opening it sees only \"The patient's saved history is hidden because they turned off saving their history.\"",
    },

    // ── 5. Behind the scenes ──
    { type: "h2", id: "what-happens-behind-the-scenes", text: "What happens behind the scenes" },
    { type: "h3", text: "Trust Passport" },
    {
      type: "p",
      text: "The page calls two API addresses that need no sign-in: `GET /api/v1/trust-passport` and `GET /api/v1/trust-passport/principles`. The server code is `apps/api/services/trust_service.py`. It reads the files again on each request and asks the database for totals. Nothing about a single patient is ever returned; only totals.",
    },
    {
      type: "table",
      head: ["What you see", "Where it comes from"],
      rows: [
        ["What it is / is not", "Fixed list in `trust_service.py`, text from the language files"],
        ["Dataset name, survey, DOI, licence, limitations, other data", "`docs/data_card.md`"],
        ["Rows, duplicate rows, share with each condition, data hash", "`ml/data/stats.json`"],
        ["Chosen model and reason, version, training date", "`model_meta.json`: `chosen_model`, `chosen_reason`, `version`, `created_at`"],
        ["Test set size, AUROC, Brier score, recall at the Moderate threshold (with 95% CI)", "`model_meta.json`: `test_metrics` and `test_metrics.ci95`"],
        ["Miss rate in the Low band", "`model_meta.json`: `bands_test.low.share_of_true_cases`"],
        ["Levels on the test set", "`model_meta.json`: `bands_test` (share and observed rate)"],
        ["AUROC after removing duplicate rows", "`model_meta.json`: `test_metrics_deduplicated.auroc`"],
        ["Calibration error before → after", "`model_meta.json`: `calibration.before.ece_10` and `calibration.after.ece_10`"],
        ["Top factors and SHAP plot, reliability plot", "`model_meta.json`: `shap.global_mean_abs`; pictures `ml/artifacts/<disease>/shap_global.png` and `reliability.png`"],
        ["Fairness tables and age gap", "`model_meta.json`: `fairness` (via `governance_service.fairness_tables`)"],
        ["Abstention table", "`model_meta.json`: `conformal.alpha` and `conformal_test`"],
        ["Live counts", "Database totals, counting only patients who allowed anonymous safety statistics (`aggregate_audit`)"],
        ["Accepted trade-offs", "Rows D-22, D-23, D-24 of `docs/DECISIONS.md`"],
        ["Known issues", "`model_meta.json`: `flags`"],
        ["API version, problem contact", "Server settings (`VERSION`, `PROBLEM_REPORT_CONTACT`)"],
        ["Principle map", "`apps/api/content/principle_map.json`; each evidence item is worked out live by a named resolver in `trust_service.py`"],
      ],
    },
    {
      type: "p",
      text: "Some terms used in the Models section, in plain words: **AUROC** — how well the model puts people with the condition above people without it (0.5 is a coin toss, 1 is perfect). **Brier score** — the average error of the predicted chances (lower is better). **Recall** — of the people who had the condition, the share the model put in Moderate or High. **95% CI** (confidence interval) — the range the true value is likely to be in. **Calibration** — adjusting the model so that its predicted chances match what really happens; **ECE** measures how far off it is.",
    },
    {
      type: "p",
      text: "If a file is missing or a database count fails, that value is returned as the text \"not available\" and the page shows **not available** in brown. One evidence item is always \"not available\" on purpose: **Recourse usage**, because the what-if tool stores nothing, so there is nothing to count. The language parity table is filled only if the assistant's `nlp_meta.json` file exists.",
    },
    { type: "h3", text: "Consent" },
    {
      type: "p",
      text: "The four purposes and their wording are in `apps/api/content/consent_notices.json` (notice version `v1`). The Settings page reads them with `GET /api/v1/consents` and changes one with `PUT /api/v1/consents/<purpose>`. Each patient has one row per purpose in the `consents` table. Turning a purpose on stores the time in `granted_at`; withdrawing stores the time in `withdrawn_at`. The database only lets a patient write their own rows (Row Level Security, or RLS: rules inside the database that decide who may read or change each row), and a database trigger writes every change to the audit log.",
    },
    {
      type: "table",
      head: ["Purpose", "What it allows", "What happens when it is off"],
      rows: [
        ["**Process my answers to give me a screening result** (`assessment_processing`, required)", "The server uses your form answers to work out your screening result. Answers are not sent to any other company.", "You cannot run a screening. The server refuses before the models run."],
        ["**Save my results so I can see my history** (`store_history`)", "Answers and results are saved so you can see history and trend, download a PDF report and share a link.", "Each result is shown once and not saved (the server logs only that an unsaved screening happened, with the next step and model versions). Saved history, reports and the contents of share links are hidden while it is off."],
        ["**Let VITALNEX clinicians review my results** (`share_with_clinician`)", "High, uncertain or emergency results go to a review list for VITALNEX clinicians. A clinician can see your answers, results and history.", "No clinician review. If a result is high or uncertain you are told to see a doctor directly. Clinicians lose access at once, because the database rules only show them patients with this consent on."],
        ["**Count my results in anonymous safety statistics** (`aggregate_audit`)", "Your results are counted, without your name, in totals used by admins and shown in the Trust Passport live counts.", "Your results are left out of those totals."],
      ],
    },
    {
      type: "p",
      text: "Note that a result only goes to the clinician review list if **both** \"save my results\" and \"let clinicians review\" are on, because there must be a saved result to review.",
    },
    { type: "h3", text: "Share links" },
    {
      type: "list",
      items: [
        "**Creating**: `POST /api/v1/shares` (patients only). The server makes a random 256-bit token (a code so long it cannot be guessed) and stores only its SHA-256 hash (a scrambled fingerprint that cannot be turned back into the token) in the `share_tokens` table, with the chosen sections and the expiry time. The full link and a QR picture are sent back **once** and never stored.",
        "**Listing**: `GET /api/v1/shares` returns your links and every open from `share_access_log`. Database rules let only the owner read them. The hash is never sent to the browser.",
        "**Revoking**: `POST /api/v1/shares/<id>/revoke` sets `revoked_at`. The database only lets the owner set this once; it cannot be undone.",
        "**Opening**: `GET /api/v1/share/<token>` needs no sign-in. A database function (`resolve_share_token`, which only the server may call) hashes the token, finds the row, and checks revoked and expiry. Only if the link is valid does it write a row to `share_access_log` (time and viewer type) and return the chosen sections.",
        "**Viewer type**: if the person opening the link is signed in, the server records their role (patient, doctor or admin). Otherwise it records \"public\". A bad sign-in never blocks the page.",
        "**Content**: the summary is built from the newest saved screenings (up to 20). Results are shaped the same way as for the patient: levels and plain text only, never probabilities. \"Clinician notes\" includes only reviews the clinician finished (agreed or changed the level).",
        "**Caching**: the response tells browsers not to store it (`Cache-Control: no-store`) and not to pass the address on to other sites (`Referrer-Policy: no-referrer`).",
      ],
    },
    {
      type: "table",
      head: ["Section the patient ticks", "What the viewer sees"],
      rows: [
        ["Latest screening levels", "Date of the newest screening, a level per condition (or \"Not confident — see a doctor\"), and the suggested next step. If that screening was an emergency, a red emergency line is shown instead of levels."],
        ["Main factors", "For the newest screening, the main factors per condition and whether each one raises or lowers the result."],
        ["History", "A table of up to 20 saved screenings: date and a level per condition (emergency rows say so)."],
        ["Clinician notes", "For finished reviews: review date, screening date, any level the clinician set, and the clinician's note."],
      ],
    },

    // ── 6. Safety and limits ──
    { type: "h2", id: "safety-and-limits", text: "Safety and limits" },
    {
      type: "callout",
      kind: "danger",
      title: "Emergencies",
      text: "None of these pages is for emergencies. The Trust Passport and every shared summary say: in an emergency call **108 / 112**.",
    },
    {
      type: "callout",
      kind: "warning",
      title: "Not a diagnosis",
      text: "A shared summary is a screening summary, not a diagnosis. Levels show how similar the patient's answers are to people who have been told they have each condition. The Trust Passport also says the models are **not validated on Indian patients**: they were trained on US survey data (BRFSS).",
    },
    {
      type: "callout",
      kind: "warning",
      title: "Low does not mean no risk",
      text: "The Trust Passport states openly that some people with a condition still land in the Low level. `docs/ERAI_REPORT.md` gives the test values from `bands_test.low.share_of_true_cases`: diabetes 0.145, heart 0.162, stroke 0.208. It also shows that recall is much lower for people under 40 (decision D-24); people under 40 see a note that results are less reliable for their age.",
    },
    {
      type: "callout",
      kind: "info",
      title: "What is never shared in a link",
      text: "A share link never shows the patient's name, email, phone, the answers they typed, or any percentage or probability. It shows only the sections the patient ticked. It cannot be edited from the share page. It does not give access to anything else in the account.",
    },
    {
      type: "callout",
      kind: "warning",
      title: "Anyone with the link can open it",
      text: "A share link works for whoever has it until it expires or is revoked. VITALNEX records each open, but it cannot stop a person from taking a photo of the screen. Share only with people you trust, choose the shortest time that works, and revoke the link when you are done.",
    },
    {
      type: "callout",
      kind: "info",
      title: "Other limits",
      text: "The share link is shown only once and cannot be recovered; make a new one if you lose it. A revoked link cannot be turned back on. Withdrawing a consent does not delete data: saved results stay in the database but are hidden; to remove them, use **Delete my data** in Settings, which also removes your shares. The Trust Passport live counts include only patients who allowed anonymous safety statistics, so they are not the full total. Consent wording in Hindi and Marathi is still waiting for human review.",
    },
    {
      type: "callout",
      kind: "info",
      title: "A known gap",
      text: "`docs/ERAI_REPORT.md` lists one open privacy gap: a patient can read their own stored probabilities directly through Supabase (the database service), even though the app itself shows only levels. This does not affect share links, which never return probabilities.",
    },

    // ── 7. NITI principles ──
    { type: "h2", id: "niti-principles", text: "Which NITI Aayog principles this follows" },
    {
      type: "niti",
      items: [
        {
          id: "transparency",
          how: [
            "The Trust Passport is public and reads every number live from `model_meta.json`, `ml/data/stats.json`, `docs/data_card.md`, `docs/DECISIONS.md` or the database. Missing values are shown as \"not available\", never filled in.",
            "It shows weaknesses, not only strengths: the miss rate in the Low band, the age gap in recall, the abstention rate, the known issues flagged in training, and the accepted trade-offs D-22 to D-24.",
            "Each model has a version, training date and data hash, so a reviewer can check exactly which model and which data produced a result. The full model card opens from the page.",
            "The principle map links every principle to the features that follow it, and shows the source of each piece of evidence.",
          ],
        },
        {
          id: "privacy_security",
          how: [
            "Consent is asked separately for four purposes. Only screening itself is required; the other three can be turned off with one click, and the change applies at once (clinicians lose access immediately).",
            "Share links use a random 256-bit token. Only its SHA-256 hash is stored, the link expires after 1 hour, 24 hours or 7 days, and the patient can revoke it at any time.",
            "A shared summary contains only the ticked sections, levels and plain text: no name, no typed answers, no probabilities.",
            "Database rules (RLS) let only the owner see or revoke their links and consents. The Trust Passport API returns totals only, never one patient's data.",
          ],
        },
        {
          id: "accountability",
          how: [
            "Every consent change and every share creation or revoke is written to the audit log by a database trigger.",
            "Every open of a share link is recorded in `share_access_log` with the time and viewer type, and the patient can see this list.",
            "The Trust Passport shows live clinician-review totals (how often clinicians agreed) and has a \"Report a problem\" section with a contact.",
            "The principle map shows live evidence such as the override rate by disease and the number of audit entries.",
          ],
        },
        {
          id: "safety_reliability",
          how: [
            "The Trust Passport shows the abstention table and live counts, so it is clear how often the model says \"not confident\" instead of guessing.",
            "If the Trust Passport cannot load, no numbers are shown at all, rather than old or invented ones.",
            "Expired, revoked and invalid share links show a clear message and nothing else.",
          ],
        },
        {
          id: "equality",
          how: [
            "The Fairness section shows recall and false-positive rate for every group, from `model_meta.json`.",
            "The age gap is shown for each condition, and users under 40 are told their results are less reliable (D-24).",
          ],
        },
        {
          id: "positive_human_values",
          how: [
            "The patient holds and controls their own record: they choose what to share, with whom, and for how long (patient-held record).",
            "Every page says it is not a diagnosis and not medicine advice, and gives 108 / 112 for emergencies.",
            "Turning off clinician review does not leave the patient alone: high or uncertain results tell them to see a doctor directly.",
          ],
        },
      ],
    },

    // ── 8. FAQ ──
    { type: "h2", id: "common-questions", text: "Common questions" },
    {
      type: "faq",
      items: [
        {
          q: "Do I need an account to read the Trust Passport?",
          a: "No. `/ai-trust` is public, and its API needs no sign-in. It shows only facts about the models and totals, never one person's data.",
        },
        {
          q: "Why does the Trust Passport say \"not available\" for some values?",
          a: "Because the server could not read or work out that value right now (for example a file is missing, the database did not answer, or the thing is not recorded at all). VITALNEX shows \"not available\" instead of a guessed number. \"Recourse usage\" is always not available, because the what-if tool stores nothing.",
        },
        {
          q: "Where do the Trust Passport numbers come from?",
          a: "Model numbers come from `ml/artifacts/<disease>/model_meta.json`, written when the models were trained. Data numbers come from `ml/data/stats.json` and `docs/data_card.md`. Trade-offs come from `docs/DECISIONS.md`. Live counts come from the database. See the table in [What happens behind the scenes](/admin/docs/trust-passport#what-happens-behind-the-scenes).",
        },
        {
          q: "What happens if I withdraw \"Save my results\"?",
          a: "New screenings are shown once and not saved. Your saved history, your PDF reports and the content of your share links are hidden while it is off. Nothing is deleted; turning it back on shows them again.",
        },
        {
          q: "What happens if I withdraw \"Let VITALNEX clinicians review my results\"?",
          a: "Clinicians lose access to your answers, results and history at once, and new results are not put in the review list. If a result is high or uncertain, you are told to see a doctor directly.",
        },
        {
          q: "Can I turn off \"Process my answers\"?",
          a: "Yes, but then you cannot run a screening. It is marked \"Required for screening\" for this reason.",
        },
        {
          q: "I closed the page and lost my share link. Can I get it back?",
          a: "No. VITALNEX stores only a scrambled fingerprint of the link, not the link itself, so it cannot show it again. Create a new link, and revoke the old one if you are unsure who has it.",
        },
        {
          q: "Can I see who opened my link?",
          a: "You can see when it was opened and what type of viewer opened it (not signed in, a signed-in patient, clinician or admin). Names are not recorded.",
        },
        {
          q: "Does a shared link show my percentages or my answers?",
          a: "No. It shows only levels (Low, Moderate, High, or \"Not confident — see a doctor\"), the suggested next step, and the other sections you ticked. Your name, contact details and typed answers are never included.",
        },
        {
          q: "What does the doctor see after the link expires or is revoked?",
          a: "A page that says \"This link has expired\" (ask the patient for a new one) or \"This link was revoked\" (the patient has stopped sharing). No results are shown.",
        },
      ],
    },
  ],
};

export default page;
