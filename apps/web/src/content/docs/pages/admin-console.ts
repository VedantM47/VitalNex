import type { DocPage } from "../types";

const page: DocPage = {
  slug: "admin-console",
  title: "Admin console and governance",
  summary:
    "The admin console is where an admin checks how VITALNEX is doing as a whole: which models are running, how fair they are, how often clinicians disagree with them, and who did what. It only ever shows totals, never a patient's identity.",
  audience: "Admins and auditors",
  blocks: [
    // ── 1. What it is ──
    { type: "h2", id: "what-it-is", text: "What this feature is" },
    {
      type: "p",
      text: "VITALNEX uses three **models** (computer programs that learned patterns from survey data) to compare a person's answers with people who have been told they have diabetes or prediabetes, heart disease, or stroke. Someone must keep watch over these models. The admin console is that place.",
    },
    {
      type: "p",
      text: "It has three parts. Each part is a separate page in the admin menu:",
    },
    {
      type: "list",
      items: [
        "**Admin overview** (`/admin/dashboard`) — four headline numbers on one screen.",
        "**Governance & audit** (`/admin/governance`) — six detailed sections: model registry, fairness, clinician overrides, activity, consent and data rights, and the audit log. (**Governance** means the rules and checks that keep the system safe and honest.)",
        "**Documentation** (`/admin/docs`) — this help site. You are reading it now.",
      ],
    },
    {
      type: "p",
      text: "It is used by **admins** (people who run the platform) and **auditors** (people who check that it follows its rules). Patients and clinicians cannot open it.",
    },
    {
      type: "callout",
      kind: "info",
      title: "Totals only, never people",
      text: "Every number in the admin console is a count or a rate. The server never sends a patient's name, email, user id, answers or assessment id to these pages. Clinician and admin ids can appear in the audit log, because staff must be accountable for what they do.",
    },
    {
      type: "p",
      text: "The console exists because of the NITI Aayog principle of **accountability**: a person must be able to check, after the fact, what the AI did and what people did with it. See [Responsible AI](/admin/docs/responsible-ai) for the full picture.",
    },

    // ── 2. Where to find it ──
    { type: "h2", id: "where-to-find-it", text: "Where to find it" },
    {
      type: "p",
      text: "Sign in with an admin account (the demo admin is `admin@vitalnex.demo`). After sign-in you land on **Admin overview**. The left menu has an **Admin** section with three links:",
    },
    {
      type: "table",
      head: ["Menu item", "Address (URL)", "What it shows"],
      rows: [
        ["Admin overview", "`/admin/dashboard`", "Four stat cards and a button to the governance page"],
        ["Governance & audit", "`/admin/governance`", "Model registry, fairness, overrides, activity, consents, audit log"],
        ["Documentation", "`/admin/docs`", "This documentation site"],
      ],
    },
    {
      type: "p",
      text: "Only the **admin** role can open any page that starts with `/admin`. If a patient or clinician types the address, the app sends them back to their own home page. If nobody is signed in, the app sends them to the sign-in page. The server checks the role a second time on every request, so hiding the menu is not the only lock. See [Accounts and login](/admin/docs/accounts-and-login).",
    },
    {
      type: "callout",
      kind: "warning",
      title: "Two admin pages are switched off",
      text: "`/admin/datasets` and `/admin/model-lab` still exist in the code, but they are **frozen** for this version (the MVP, or first simple version). If you open them you only see a \"Not in MVP\" notice. They do not load data, do not train models and are not in the menu. Do not treat them as working features.",
    },

    // ── 3. Screenshots: Admin overview ──
    { type: "h2", id: "admin-overview", text: "Admin overview (the four stat cards)" },
    {
      type: "image",
      src: "/docs/admin-console/admin-dashboard.png",
      alt: "Admin overview page with four stat cards and a button to open governance and audit",
      caption: "Admin overview, signed in as the demo admin.",
      markers: [
        { n: 1, text: "**Models loaded** — how many screening models the server has loaded." },
        { n: 2, text: "**Screenings counted** — how many screenings are stored for people who allow anonymous statistics." },
        { n: 3, text: "**Pending clinician reviews** — how many cases are waiting for a clinician." },
        { n: 4, text: "**Clinician agree rate** — how often clinicians agreed with the model, with the number of reviewed cases below it." },
        { n: 5, text: "**Open governance & audit** — goes to the detailed governance page." },
      ],
    },
    { type: "p", text: "Here is where each number comes from. Nothing on this page is typed in by hand." },
    {
      type: "table",
      head: ["Card", "Where the number comes from", "What to keep in mind"],
      rows: [
        [
          "Models loaded",
          "The length of the list from `GET /api/v1/admin/governance/models`. That list is built from `ml/artifacts/<disease>/model_meta.json`, one entry per model the server could load.",
          "Normally **3** (diabetes, heart, stroke). A lower number means a model file is missing on the server.",
        ],
        [
          "Screenings counted",
          "`total_assessments` from `GET /api/v1/governance/summary`. It counts rows in the `risk_assessments` table.",
          "Only people who switched on the consent \"Count my results in anonymous safety statistics\" (`aggregate_audit`) are counted. The real total can be higher.",
        ],
        [
          "Pending clinician reviews",
          "`human_reviews_pending` from `GET /api/v1/governance/summary`. It counts rows in `review_queue` with status `pending`.",
          "This count includes **all** patients. The \"Pending\" tile in the Clinician overrides section counts only consenting patients, so the two can differ.",
        ],
        [
          "Clinician agree rate",
          "`agree_rate` from `GET /api/v1/admin/governance/overrides`: cases marked \"agreed\" divided by all reviewed cases. The small line under it shows how many were reviewed.",
          "Shows \"not available\" when no case has been reviewed yet, because a rate of nothing cannot be worked out.",
        ],
      ],
    },
    {
      type: "callout",
      kind: "info",
      title: "A dash means \"not computed\"",
      text: "While a number is loading, or if the server did not send it, the card shows **—**. If the server cannot be reached, a red message says so. The page never fills a gap with a made-up or default value.",
    },

    // ── 4. Governance page, section by section ──
    { type: "h2", id: "governance-page", text: "Governance & audit, section by section" },
    {
      type: "p",
      text: "The governance page is one long page with six sections. A row of buttons at the top jumps straight to each section. Each section loads on its own. If one fails, only that section shows \"This section could not be loaded.\" and the others still work.",
    },

    { type: "h3", text: "1. Model registry" },
    {
      type: "image",
      src: "/docs/admin-console/gov-registry.png",
      alt: "Model registry table with one row per model and a link to each model card",
      caption: "Model registry: one row for each of the three models.",
      markers: [
        { n: 1, text: "Jump buttons for the six sections." },
        { n: 2, text: "Column headings of the registry table." },
        { n: 3, text: "**Model card** link — opens the full model card for that model." },
        { n: 4, text: "**Flags** — known limits written down for each model. Click to open the list." },
      ],
    },
    {
      type: "p",
      text: "The **registry** is the list of models that are running. Every value comes from `ml/artifacts/<disease>/model_meta.json`, the file written when the model was trained. Nothing comes from the database.",
    },
    {
      type: "table",
      head: ["Column", "What it means"],
      rows: [
        ["Condition", "Which condition the model screens for: diabetes, heart disease or stroke."],
        ["Version", "The model's version name, for example `diabetes-v1.0.0`. It is also stored with every screening result."],
        ["Model", "The kind of model chosen in training: `lightgbm` (a tree-based model) or `logreg` (logistic regression, a simpler formula-based model)."],
        ["Trained", "When the model was trained (`created_at`)."],
        ["Data hash", "The first 12 characters of a fingerprint of the training data. Hover to see the full value. If the data changed, the fingerprint would change too."],
        ["Test AUROC (95% CI)", "How well the model ranks people with the condition above people without it, on data it never saw during training. 0.5 is a coin toss, 1.0 is perfect. The range in brackets is the 95% confidence interval (the likely range of the true value)."],
        ["Brier", "How close the predicted chances were to what really happened. Lower is better."],
        ["Recall at Moderate threshold", "Of the people in the test data who had the condition, the share the model placed at Moderate or High."],
        ["Abstention (test)", "How often the model said \"not confident\" on the test data instead of giving a level."],
        ["Model card", "A link that opens the model card text (`GET /api/v1/models/<disease>/card`) in a new tab."],
      ],
    },
    {
      type: "p",
      text: "Today the files say: diabetes `lightgbm`, test AUROC about 0.824, abstention about 36.8%; heart `lightgbm`, AUROC about 0.842, abstention about 38.5%; stroke `logreg`, AUROC about 0.810, abstention about 44.4%. All three were trained on the same data file (same data hash). Always trust the live table over this page: if the models are retrained, the table changes and this text does not. Details are in [Models and data](/admin/docs/models-and-data).",
    },

    { type: "h3", text: "2. Fairness" },
    {
      type: "image",
      src: "/docs/admin-console/gov-fairness.png",
      alt: "Fairness section showing a group table with recall and false-positive rate per group",
      caption: "Fairness: one table per group type, for each model.",
      markers: [
        { n: 1, text: "Condition name and model version." },
        { n: 2, text: "Group type (for example Sex) with a plain-language reading of the numbers." },
        { n: 3, text: "Column headings: People, Recall, False-positive rate, Precision, Observed rate, Abstention." },
        { n: 4, text: "**Largest gap** — the biggest difference between groups." },
      ],
    },
    {
      type: "p",
      text: "**Fairness** here means: does the model work about as well for one group of people as for another? The numbers come from `model_meta.json` and were measured on the test data during training. They do not change when people use the app.",
    },
    {
      type: "list",
      items: [
        "**Definition** — what \"flagged\" means: the model's checked (calibrated) chance is at or above the Moderate threshold. **Calibrated** means the chances were adjusted so that, for example, 20% really means about 20 in 100.",
        "**Used only for the fairness audit** — columns from the survey data that are used only to check fairness and are never model inputs: Income, Education, AnyHealthcare, NoDocbcCost and CholCheck. The app never asks users about these.",
        "One table per **group type**: Sex, AgeGroup, Income, Education, AnyHealthcare and NoDocbcCost.",
      ],
    },
    {
      type: "table",
      head: ["Column", "What it means"],
      rows: [
        ["Group", "One group inside the group type, for example one age band."],
        ["People", "How many people from that group were in the test data."],
        ["Recall", "Of the people in this group who had the condition, the share the model flagged. Higher means fewer missed cases."],
        ["False-positive rate", "Of the people in this group who did not have the condition, the share flagged anyway."],
        ["Precision", "Of the people flagged in this group, the share who really had the condition."],
        ["Observed rate", "How common the condition was in this group in the test data."],
        ["Abstention", "How often the model said \"not confident\" for this group."],
      ],
    },
    {
      type: "p",
      text: "Under each table, **Largest gap** gives the biggest difference in recall and in false-positive rate between any two groups. The sentence under the group name is written by the server only from these same numbers. Orange bullet points at the end list any fairness flags saved in the file.",
    },
    {
      type: "callout",
      kind: "warning",
      title: "Known gap: younger people",
      text: "Recall is much lower for people under 40 than for older people. This is written down, not hidden (decision D-24 in `docs/DECISIONS.md`, and `docs/ERAI_REPORT.md`). A fix with separate thresholds per age group was tried and not adopted. VITALNEX reports gaps; it does not claim to pass any fairness rule.",
    },

    { type: "h3", text: "3. Clinician overrides" },
    {
      type: "image",
      src: "/docs/admin-console/gov-overrides.png",
      alt: "Clinician overrides section with six count tiles, a per-condition table and three count lists",
      caption: "Clinician overrides: what clinicians did with the cases sent to them.",
      markers: [
        { n: 1, text: "Six tiles: queue items, pending, reviewed, agreed, overridden, agree rate." },
        { n: 2, text: "Override rate per condition." },
        { n: 3, text: "Overrides per reason." },
        { n: 4, text: "Direction: level raised, lowered, or set where the model was not confident." },
        { n: 5, text: "Why cases entered the review queue." },
      ],
    },
    {
      type: "p",
      text: "When a screening result is High, \"not confident\", has a data-quality problem or reports emergency symptoms, and the patient allows clinician review and saving of history, it goes into the clinician **review queue**. A clinician then either agrees with the model or **overrides** it (sets a different level and picks a reason). See [Clinician workspace](/admin/docs/clinician-workspace). This section counts what happened. It reads the `review_queue`, `risk_assessments` and `clinician_overrides` tables, and only for patients who allow anonymous statistics.",
    },
    {
      type: "table",
      head: ["Item", "What it means"],
      rows: [
        ["Queue items", "All cases ever placed in the review queue."],
        ["Pending", "Cases still waiting for a clinician."],
        ["Reviewed", "Cases a clinician has finished (agreed or overridden)."],
        ["Agreed", "Cases where the clinician agreed with the model."],
        ["Overridden", "Cases where the clinician changed at least one level."],
        ["Agree rate", "Agreed divided by Reviewed. \"not available\" if nothing is reviewed yet."],
        ["Override rate per condition", "For each condition: reviewed cases that had a result for it, how many were overridden, and the rate."],
        ["Overrides per reason", "How often each reason was picked, for example \"Clinical history not captured\" or \"Model overestimates\"."],
        ["Direction", "\"Level raised\" (clinician chose a higher level), \"Level lowered\", or \"Level set where the model was not confident\"."],
        ["Why cases entered the queue", "Counts of queue reasons: High screening level, VITALNEX not confident, Data-quality flag, Emergency symptoms reported."],
      ],
    },
    {
      type: "callout",
      kind: "info",
      title: "Overrides are never used to retrain",
      text: "The override log is only for checking. VITALNEX never retrains a model on clinician overrides or on user data by itself (hard rule 9 in `CLAUDE.md`).",
    },

    { type: "h3", text: "4. Activity" },
    {
      type: "image",
      src: "/docs/admin-console/gov-activity.png",
      alt: "Activity section with a period selector and a line chart of daily counts",
      caption: "Activity: daily counts over the chosen period.",
      markers: [
        { n: 1, text: "**Period** — last 7, 30, 90 or 365 days." },
        { n: 2, text: "Line chart: one line per count." },
        { n: 3, text: "**Show as table** — the same numbers as a table." },
      ],
    },
    {
      type: "p",
      text: "The chart shows four counts per day, for patients who allow anonymous statistics:",
    },
    {
      type: "list",
      items: [
        "**Screenings** — screenings stored that day.",
        "**Not confident (any condition)** — screenings where at least one model said \"not confident\".",
        "**Emergency (screening form)** — screenings where the person reported emergency symptoms. These people were shown 108 / 112 right away.",
        "**Emergency (assistant)** — assistant messages that triggered the emergency rule.",
      ],
    },
    {
      type: "p",
      text: "Days with nothing to count are left out of the chart. If the whole period is empty, you see \"No screenings in this period.\" Changing the period only changes what you see; it does not change any data.",
    },

    { type: "h3", text: "5. Consent & data rights" },
    {
      type: "image",
      src: "/docs/admin-console/gov-consents.png",
      alt: "Consent and data rights section with a consent table, QR share counts and data request counts",
      caption: "Consent & data rights: how patients use their privacy choices.",
      markers: [
        { n: 1, text: "Number of patient accounts." },
        { n: 2, text: "Consent table, one row per purpose." },
        { n: 3, text: "QR shares: created, revoked, expired, opens." },
        { n: 4, text: "Data requests: export and deletion, by status." },
      ],
    },
    {
      type: "p",
      text: "Patients choose separately for each **purpose** whether VITALNEX may use their data for it. This section shows how those choices add up. Unlike the sections above, it counts **all** patients, because it describes consent itself.",
    },
    {
      type: "table",
      head: ["Column", "What it means"],
      rows: [
        ["Purpose", "The four purposes: process my answers, save my history, let clinicians review my results, count my results in anonymous safety statistics."],
        ["On", "How many consents for this purpose are switched on right now."],
        ["Withdrawn", "How many consents for this purpose were switched off later."],
        ["Share of patients", "\"On\" divided by the number of patient accounts."],
        ["Notice versions", "Which version of the privacy notice people agreed to, with counts (for example `v1: 6`)."],
      ],
    },
    {
      type: "list",
      items: [
        "**QR shares** — share links patients made for their report: how many were **Created**, **Revoked** by the patient, **Expired** (past their end time and not revoked), and **Opens** (how many times a share link was opened).",
        "**Data requests** — requests to **Export** (download my data) or for **Deletion** (delete my data), counted by status. \"None\" means there were no requests.",
      ],
    },

    { type: "h3", text: "6. Audit log" },
    {
      type: "image",
      src: "/docs/admin-console/gov-audit.png",
      alt: "Audit log section with filters, a table of entries and paging buttons",
      caption: "Audit log: a record of sensitive actions, newest first.",
      markers: [
        { n: 1, text: "Filters: action, resource type, actor role, from and to dates, Apply and Reset." },
        { n: 2, text: "Table columns: time, action, resource type, actor role, staff id, details." },
        { n: 3, text: "\"Showing x–y of z\" and the Previous / Next buttons." },
      ],
    },
    {
      type: "p",
      text: "The **audit log** is a list of important actions, newest first, 25 per page. Most entries are written by the database itself (by **triggers**, small rules that run on every change), so an action is logged whichever way it was made. Sign-in, sign-out, report downloads, review decisions and some others are written by the server.",
    },
    {
      type: "table",
      head: ["Column", "What it means"],
      rows: [
        ["Time", "When it happened, in your browser's local time."],
        ["Action", "What happened, for example `LOGIN`, `ASSESSMENT_CREATED`, `CONSENT_GRANTED`, `OVERRIDE_CREATED`, `SHARE_OPENED`."],
        ["Resource type", "What kind of thing it was about, for example `session`, `consent`, `risk_assessment`, `review_queue`, `share_token`, `data_request`."],
        ["Actor role", "Who did it, as a role only: Patient, Clinician, Admin, System (no user, for example an automatic job) or Unknown (the account no longer exists)."],
        ["Staff id", "For clinicians and admins: the first 8 characters of their user id. For patients and the system: \"—\"."],
        ["Details", "Safe extra facts, such as purpose, notice version, condition, model level, clinician level, reason code or model version. \"—\" if there are none."],
      ],
    },
    {
      type: "p",
      text: "Actions you will often see:",
    },
    {
      type: "table",
      head: ["Action", "When it is written"],
      rows: [
        ["`LOGIN` / `LOGOUT`", "Someone signed in or out."],
        ["`ASSESSMENT_CREATED`", "A screening was saved."],
        ["`ASSESSMENT_NOT_STORED`", "A screening ran but was not saved (for example, the person did not allow history)."],
        ["`CONSENT_GRANTED` / `CONSENT_WITHDRAWN`", "A consent was switched on or off."],
        ["`REVIEW_DECISION`, `REVIEW_AGREED`, `REVIEW_OVERRIDDEN`", "A clinician finished a review."],
        ["`OVERRIDE_CREATED`", "A clinician set a different level for one condition."],
        ["`SHARE_CREATED` / `SHARE_REVOKED` / `SHARE_OPENED`", "A QR share link was made, cancelled or opened."],
        ["`DATA_REQUEST_CREATED` and `DATA_REQUEST_<STATUS>`", "An export or deletion request was made or changed status."],
        ["`REPORT_DOWNLOADED`", "A PDF report was downloaded."],
        ["`USER_DATA_DELETED`", "A deletion request was carried out."],
      ],
    },
    {
      type: "callout",
      kind: "tip",
      title: "Filters match exactly",
      text: "The Action and Resource type boxes match the whole word exactly, in capitals as shown in the table (type `LOGIN`, not `log`). Leave a box empty to not filter on it.",
    },

    // ── 5. Documentation section ──
    { type: "h2", id: "documentation-section", text: "The Documentation section" },
    {
      type: "image",
      src: "/docs/admin-console/docs-page.png",
      alt: "Documentation page with the page list and search on the left and On this page on the right",
      caption: "The documentation site, open on this page.",
      markers: [
        { n: 1, text: "Page list, grouped by topic. The open page is dark." },
        { n: 2, text: "**Search the docs** box." },
        { n: 3, text: "**On this page** — links to each section of the open page." },
      ],
    },
    {
      type: "list",
      items: [
        "**Page list (left)** — all pages in five groups: Get started; Features for patients; Features for clinicians and admins; Responsible AI; For developers.",
        "**Middle** — the page: who it is for, title, short summary, then the content. At the bottom, **Previous** and **Next** take you through all pages in list order.",
        "**On this page (right)** — one link per main section. Click to jump there.",
        "On a narrow screen the left list becomes a drop-down called \"Documentation pages\". \"On this page\" only shows on wide screens.",
        "The docs content is in **English only** (decision D-27). The menu labels around it follow the app language.",
      ],
    },
    {
      type: "image",
      src: "/docs/admin-console/docs-search.png",
      alt: "Documentation page list filtered by a search word",
      caption: "Searching the docs for the word \"override\".",
      markers: [
        { n: 1, text: "The search word typed in the box." },
        { n: 2, text: "The page list now shows only pages that contain the word." },
      ],
    },
    {
      type: "p",
      text: "Search works as you type. It keeps only pages whose title, summary or content contains your word (capital letters do not matter). If nothing matches, it says \"No page matches your search.\" Clear the box to see all pages again. Search runs in your browser; nothing is sent to the server.",
    },
    { type: "h3", text: "How to add or update a documentation page" },
    {
      type: "steps",
      items: [
        {
          title: "Open or create the page file",
          text: "Each page is a TypeScript file in `apps/web/src/content/docs/pages/`, for example `admin-console.ts`. It exports one object with `slug` (the last part of the address), `title`, `summary`, optional `audience`, and a list of `blocks`.",
        },
        {
          title: "Write the content as blocks",
          text: "Block types are listed in `apps/web/src/content/docs/types.ts`: `h2` (main section, shown in \"On this page\"), `h3`, `p`, `list`, `steps`, `callout`, `image`, `niti`, `code`, `table` and `faq`. Inside text you may use `**bold**`, backticks for code, and `[label](/admin/docs/<slug>)` for links.",
        },
        {
          title: "Register a new page",
          text: "For a new page only: import it in `apps/web/src/content/docs/index.ts` and add it to one of the groups in `DOC_GROUPS`. The order there is the order in the page list and for Previous / Next. The address `/admin/docs/<slug>` then works by itself.",
        },
        {
          title: "Make screenshots",
          text: "Write a spec file in `scripts/docs/specs/<slug>.json` (format is at the top of `scripts/docs/capture.py`). With the web and API servers running locally, run `python scripts/docs/capture.py scripts/docs/specs/<slug>.json --password <demo password>`. It signs in as a demo account, draws numbered red boxes and saves PNGs in `apps/web/public/docs/<slug>/`. Use them in an `image` block as `/docs/<slug>/<name>.png`, with one marker per numbered box.",
        },
        {
          title: "Check it",
          text: "Run `npx eslint` on the file from `apps/web`, then open the page in the browser and look at it.",
        },
      ],
    },
    {
      type: "callout",
      kind: "warning",
      title: "Only write what the code does",
      text: "Every number in a doc page must come from `model_meta.json`, `docs/*.md` or the code. Never describe a feature that does not exist, and never call the Pune synthetic data real patient data.",
    },

    // ── 6. How to use it ──
    { type: "h2", id: "how-to-use-it", text: "How to use it" },
    {
      type: "steps",
      items: [
        { title: "Sign in as an admin", text: "Go to the sign-in page and use an admin account. You land on Admin overview." },
        { title: "Read the four cards", text: "Check that **Models loaded** is 3. Look at **Pending clinician reviews**: a high number means clinicians are behind." },
        { title: "Open governance", text: "Click **Open governance & audit**, or **Governance & audit** in the menu." },
        { title: "Check the models", text: "In **Model registry**, check the version and data hash. Open the **Flags** list and the **Model card** for each model." },
        { title: "Check fairness", text: "In **Fairness**, look at the **Largest gap** line under each table. Big gaps in recall mean one group gets more missed cases." },
        { title: "Check overrides", text: "In **Clinician overrides**, look at the agree rate and the override rate per condition. A rising override rate can mean a model does not fit the people using it." },
        { title: "Watch activity", text: "In **Activity**, pick a period. Look for spikes in \"not confident\" or emergency counts." },
        { title: "Check consent", text: "In **Consent & data rights**, see how many people allow each purpose, and whether export or deletion requests are being completed." },
        { title: "Search the audit log", text: "In **Audit log**, type an action such as `OVERRIDE_CREATED`, or choose an actor role and dates, then click **Apply**. Use **Previous** / **Next** to page. Click **Reset** to clear the filters." },
      ],
    },

    // ── 7. Behind the scenes ──
    { type: "h2", id: "what-happens-behind-the-scenes", text: "What happens behind the scenes" },
    {
      type: "p",
      text: "The pages call the VITALNEX **API** (the server program the web app talks to). Every call checks that the signed-in user's role is `admin`; anyone else gets an error.",
    },
    {
      type: "table",
      head: ["API call", "Used by", "Source of the numbers"],
      rows: [
        ["`GET /api/v1/governance/summary`", "Overview cards 2 and 3", "Database: `risk_assessments`, `review_queue`"],
        ["`GET /api/v1/admin/governance/models`", "Overview card 1, Model registry", "`ml/artifacts/<disease>/model_meta.json`"],
        ["`GET /api/v1/admin/governance/fairness`", "Fairness", "`model_meta.json` (`fairness` part)"],
        ["`GET /api/v1/admin/governance/overrides`", "Overview card 4, Clinician overrides", "Database: `review_queue`, `risk_assessments`, `clinician_overrides`"],
        ["`GET /api/v1/admin/governance/activity?days=N`", "Activity", "Database: `risk_assessments`, `assistant_logs`"],
        ["`GET /api/v1/admin/governance/consents`", "Consent & data rights", "Database: `profiles`, `consents`, `share_tokens`, `share_access_log`, `data_requests`"],
        ["`GET /api/v1/admin/governance/audit-logs`", "Audit log", "Database: `audit_logs`, `profiles` (role only)"],
      ],
    },
    {
      type: "p",
      text: "The code is in `apps/api/routers/v1/admin.py`, `apps/api/services/governance_service.py` and `apps/api/services/aggregates.py`. The server reads the tables with a special service key, adds them up, and sends back only totals and rates. Row-level data never leaves the server.",
    },
    { type: "h3", text: "Who is counted" },
    {
      type: "list",
      items: [
        "Screenings, overrides and activity count only patients with the active consent `aggregate_audit` (\"Count my results in anonymous safety statistics\").",
        "Consent, QR share and data request counts include everyone, because they describe consent itself.",
        "Pending clinician reviews on the overview card counts every pending case.",
      ],
    },
    { type: "h3", text: "The audit log table" },
    {
      type: "p",
      text: "The database table `audit_logs` stores: an id, the user id of the person who acted (empty for the system), the action, the resource type and id, the IP address and browser name (for some server-written entries), extra details (`metadata`) and the time.",
    },
    {
      type: "list",
      items: [
        "Database triggers write entries for consent changes, saved screenings, clinician overrides, review status changes, QR shares (created, revoked, opened) and data requests.",
        "The server writes `LOGIN`, `LOGOUT`, `REPORT_DOWNLOADED`, `REVIEW_DECISION`, `ASSESSMENT_NOT_STORED` and `USER_DATA_DELETED`.",
        "Database security rules (**RLS**, row-level security) let only admins read all entries; any other user can read only entries where they are the actor.",
        "Before an entry reaches the admin page, the server: turns the user id into a role; keeps the id only for clinicians and admins; never sends the resource id, IP address or browser name; and keeps only allowed detail fields. A patient's id inside the details (`subject_user_id`) is always removed.",
      ],
    },
    {
      type: "code",
      lang: "text",
      code: "Allowed detail fields (AUDIT_METADATA_ALLOWED in governance_service.py):\npurpose, notice_version, mode, next_step, emergency_flag, disease, model_band,\nclinician_band, reason_code, model_version, model_versions, type, accessor_role,\nrole, decision, diseases, reason_codes, tables_cleared, auth_account_deleted",
    },

    // ── 8. Safety and limits ──
    { type: "h2", id: "safety-and-limits", text: "Safety and limits" },
    {
      type: "callout",
      kind: "danger",
      title: "The console cannot change anything",
      text: "The admin console is read-only. You cannot edit a screening, change a model, approve a model, change a threshold, delete a user or edit the audit log from it. Model changes need new training and human sign-off outside the app.",
    },
    {
      type: "callout",
      kind: "info",
      title: "No patient identities",
      text: "You cannot look up a single patient from the admin console. If you need to look at one case, that is a clinician's job in the [Clinician workspace](/admin/docs/clinician-workspace), and only when the patient allowed clinician review.",
    },
    {
      type: "callout",
      kind: "warning",
      title: "Model numbers are from training, not from real use",
      text: "Registry and fairness numbers were measured once, on held-back test data from the US BRFSS survey. They are not live accuracy on VITALNEX users. VITALNEX has no follow-up data to check real-world accuracy.",
    },
    {
      type: "callout",
      kind: "warning",
      title: "Counts are smaller than real use",
      text: "Screening, override and activity counts leave out people who did not allow anonymous statistics. Do not read them as the full total.",
    },
    {
      type: "callout",
      kind: "info",
      title: "Frozen pages",
      text: "`/admin/datasets` and `/admin/model-lab` show a \"Not in MVP\" notice and do nothing else. There is no dataset browser or model training screen in this version.",
    },

    // ── 9. NITI principles ──
    { type: "h2", id: "niti-principles", text: "Which NITI Aayog principles this follows" },
    {
      type: "niti",
      items: [
        {
          id: "accountability",
          how: [
            "Every sensitive action (screenings, consent changes, overrides, reviews, shares, data requests, sign-ins) is written to the `audit_logs` table, mostly by database triggers, and admins can filter and page through it.",
            "Clinician overrides are counted per condition, per reason and per direction, so admins can see when clinicians often disagree with a model.",
            "Clinician and admin ids are kept in the audit log, so staff actions can be traced to a person.",
            "Each model has a version, a training date and a data hash in the registry, and every screening stores the model version it used.",
          ],
        },
        {
          id: "transparency",
          how: [
            "The model registry shows the real test metrics, abstention rate and flags straight from `model_meta.json`, with a link to each model card.",
            "Values that were not computed are shown as \"not available\" or \"—\", never filled in.",
            "Fairness tables come with a plain-language sentence built only from the same numbers.",
          ],
        },
        {
          id: "privacy_security",
          how: [
            "The admin API returns totals and rates only; patient ids, names, answers and assessment ids are never sent.",
            "Audit entries are cleaned on the server: patient ids, resource ids, IP addresses and browser names are removed, and only allowed detail fields are kept.",
            "Screening-based counts include only patients who switched on the `aggregate_audit` consent.",
            "Only the admin role can open `/admin` pages and call the admin API; RLS limits who can read `audit_logs`.",
          ],
        },
        {
          id: "equality",
          how: [
            "The fairness section shows recall, false-positive rate, precision and abstention for each group of sex, age, income, education and healthcare access, with the largest gap.",
            "The lower recall for people under 40 is shown and recorded (D-24), not hidden.",
            "Income, education and healthcare-access columns are used only for this audit and never as model inputs.",
          ],
        },
      ],
    },

    // ── 10. FAQ ──
    { type: "h2", id: "common-questions", text: "Common questions" },
    {
      type: "faq",
      items: [
        {
          q: "Why can I not see which patient a number belongs to?",
          a: "On purpose. The admin console is for checking the system as a whole. The server only sends totals. Looking at a single case is a clinician's job, and only with the patient's consent.",
        },
        {
          q: "Why is \"Pending clinician reviews\" different from \"Pending\" in the overrides section?",
          a: "The overview card counts every pending case. The overrides section counts only patients who allow anonymous statistics. So the overview card can be higher.",
        },
        {
          q: "Why does the agree rate say \"not available\"?",
          a: "No case has been reviewed yet (or none from patients who allow statistics). A rate cannot be worked out from zero cases, so the app does not show one.",
        },
        {
          q: "Do the AUROC and recall numbers update as people use the app?",
          a: "No. They were measured once on test data when the model was trained, and are read from `model_meta.json`. They change only when the models are retrained and the files are replaced.",
        },
        {
          q: "Can I retrain or switch off a model from here?",
          a: "No. The console is read-only and the Model Lab page is frozen. VITALNEX never retrains itself on user data or clinician overrides.",
        },
        {
          q: "My audit log search shows nothing. Why?",
          a: "The Action and Resource type boxes need the exact word in capitals, such as `LOGIN` or `risk_assessment`. Also check the From and To dates, or click **Reset**.",
        },
        {
          q: "What does \"Unknown\" mean as an actor role?",
          a: "The entry has a user id, but no matching account profile exists any more, for example after an account was deleted.",
        },
        {
          q: "Is the data shown here real patient data?",
          a: "No. All accounts in this MVP are demo accounts, and the models were trained on the public US BRFSS survey. The Pune synthetic dataset is never used to train or test the models.",
        },
      ],
    },
  ],
};

export default page;
