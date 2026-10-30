import type { DocPage } from "../types";

// Sources: apps/web/src/app/dashboard/page.tsx, apps/web/src/app/health-profile/page.tsx,
// components/assessment/{AssessmentRow,BandTrendChart,AnswerFields,Questions}.tsx, lib/assessment.ts,
// lib/patient-data.ts, apps/api/routers/v1/{profile,assessment,doctors}.py,
// apps/api/schemas/health_profile.py, supabase/migrations/20261026000001_p1_auth_persistence.sql.

const page: DocPage = {
  slug: "patient-dashboard",
  title: "Patient dashboard and health profile",
  summary:
    "The dashboard is the patient's home page: it shows the latest screening, how the levels changed over time, the next appointment and quick links. The health profile is where a patient can save their screening answers once, so they do not have to type them again.",
  audience: "Patients",
  blocks: [
    // ── 1. What it is ────────────────────────────────────────────────────────────────
    { type: "h2", id: "what-it-is", text: "What this feature is" },
    {
      type: "p",
      text: "This page covers two screens that every patient uses: the **dashboard** (called **Overview** in the menu) and the **health profile** (called **My Health** in the menu).",
    },
    {
      type: "p",
      text: "The **dashboard** is the first screen a patient sees after signing in. It is a short summary. It shows the result of the patient's most recent screening, a small chart of how their levels changed over time, their next appointment (if they booked one), and buttons to the most used parts of the app.",
    },
    {
      type: "p",
      text: "The **health profile** is a form with the same questions as the screening (the risk assessment). A patient can fill in the answers they know and save them. The next time they start a screening, the saved answers are filled in for them and clearly marked. Every question on the health profile is optional.",
    },
    {
      type: "callout",
      kind: "info",
      title: "Not a diagnosis",
      text: "Nothing on the dashboard says that a person has a disease. It shows **levels** (Low, Moderate, High) that mean \"your answers are similar to people who have been told they have diabetes, heart disease or stroke\". The card itself says \"This is not a diagnosis.\"",
    },
    {
      type: "p",
      text: "Both screens are only for the **patient** role. Clinicians and admins have their own home pages (see [Clinician workspace](/admin/docs/clinician-workspace) and [Admin console](/admin/docs/admin-console)).",
    },

    // ── 2. Where to find it ──────────────────────────────────────────────────────────
    { type: "h2", id: "where-to-find-it", text: "Where to find it" },
    {
      type: "table",
      head: ["Screen", "Menu item (left side)", "Address (URL)", "Who can open it"],
      rows: [
        ["Dashboard", "Overview", "`/dashboard`", "Patients only"],
        ["Health profile", "My Health", "`/health-profile`", "Patients only"],
      ],
    },
    {
      type: "list",
      items: [
        "After a patient signs in, the app sends them straight to `/dashboard`. This is set in `apps/web/src/lib/roles.ts` (`ROLE_HOME.patient`).",
        "If a clinician or admin types `/dashboard` or `/health-profile`, the app sends them to their own home page instead. If nobody is signed in, the app sends them to the sign-in page. This check runs in `apps/web/src/proxy.ts` before the page loads.",
        "The dashboard also has a **Health profile** quick-action tile that opens `/health-profile`.",
      ],
    },

    // ── 3. Screenshots ───────────────────────────────────────────────────────────────
    { type: "h2", id: "screenshots", text: "What the screens look like" },
    { type: "h3", text: "The dashboard" },
    {
      type: "image",
      src: "/docs/patient-dashboard/dashboard-overview.png",
      alt: "The patient dashboard for the demo account patient1, with numbered boxes on each card",
      caption: "The dashboard for the demo patient patient1@vitalnex.demo. All data is synthetic.",
      markers: [
        { n: 1, text: "**Welcome line.** Shows \"Welcome\" and the patient's name. A dark **Demo account** badge appears because all MVP accounts are demo (dummy) accounts." },
        { n: 2, text: "**Start Screening Assessment** button. Opens the risk assessment at `/risk-assessment`." },
        { n: 3, text: "**Latest screening** card. The most recent saved screening: date, next step, and one level per condition. The **Full history** button opens `/history`." },
        { n: 4, text: "**Levels over time** chart. One line per condition. It only appears when the patient has two or more saved screenings." },
        { n: 5, text: "**Quick actions.** Four tiles: Start screening, History, Health profile, Find a clinician." },
        { n: 6, text: "**Upcoming appointment** card (if the patient has a booking) or the dark **Care Connect** card (if not)." },
        { n: 7, text: "**AI Trust Passport** card. A short note and a link to the Trust Passport page (`/ai-trust`)." },
      ],
    },
    {
      type: "image",
      src: "/docs/patient-dashboard/dashboard-latest.png",
      alt: "Close-up of the Latest screening card on the dashboard",
      caption: "Close-up of the Latest screening card.",
      markers: [
        { n: 1, text: "**Date and status badges.** The date of the screening. Small badges may show **Demo** (a demo-mode screening), **Reviewed by a clinician**, or **Waiting for clinician review**." },
        { n: 2, text: "**Next step.** The care advice for this screening, for example \"Keep up regular check-ups\" or \"See a doctor soon (within 2 weeks)\"." },
        { n: 3, text: "**One level per condition.** Diabetes, heart disease and stroke, each with a coloured badge: Low, Moderate or High, or **Not confident – see a doctor**. If a clinician changed the level, a second badge shows **Clinician's level**." },
      ],
    },
    { type: "h3", text: "The health profile" },
    {
      type: "image",
      src: "/docs/patient-dashboard/profile-top.png",
      alt: "Top of the health profile page with the language box and the About you group",
      caption: "The top of the health profile (My Health).",
      markers: [
        { n: 1, text: "**My Health** in the left menu opens this page." },
        { n: 2, text: "**Language** box. Choose English, हिन्दी (Hindi) or मराठी (Marathi). It changes the whole app at once." },
        { n: 3, text: "**Note** explaining that saved answers are filled in on the screening form and marked \"From your profile\", and that empty questions stay empty." },
        { n: 4, text: "**About you** group: age, sex assigned at birth, height and weight." },
        { n: 5, text: "**Your BMI** box. Appears when both height and weight are filled in. It is worked out on your screen; it is not a separate answer." },
      ],
    },
    {
      type: "image",
      src: "/docs/patient-dashboard/profile-bottom.png",
      alt: "Bottom of the health profile page with the How you feel group, Clear buttons and the Save Changes button",
      caption: "The bottom of the health profile, with the save button.",
      markers: [
        { n: 1, text: "**How you feel** group: general health and the two \"days not good\" questions." },
        { n: 2, text: "**Clear** buttons. One for each answered question in the group, for example \"Clear: General health\". It empties that answer again." },
        { n: 3, text: "**Save Changes** button. Sends the answers to the server and stores them." },
        { n: 4, text: "**Start Screening Assessment** button. Opens the screening form, which is pre-filled with your saved answers." },
      ],
    },

    // ── 4. How to use it ─────────────────────────────────────────────────────────────
    { type: "h2", id: "how-to-use-it", text: "How to use it" },
    { type: "h3", text: "Reading the dashboard" },
    {
      type: "steps",
      items: [
        {
          title: "Sign in as a patient",
          text: "Go to the sign-in page and use a patient account, for example `patient1@vitalnex.demo` (see [Accounts and login](/admin/docs/accounts-and-login)). The app opens the dashboard by itself.",
        },
        {
          title: "Wait for the cards to load",
          text: "For a moment the Latest screening card says \"Loading…\". The app is asking the server for your screenings and appointments at the same time.",
        },
        {
          title: "Read the Latest screening card",
          text: "Look at the **date** first, so you know how old the result is. Then read the **Next step** line: it tells you what kind of care to seek and how soon. Then look at the three level badges.",
        },
        {
          title: "Look at the trend (if shown)",
          text: "If you have two or more screenings, the **Levels over time** chart shows each condition as a line. Low is at the bottom, High at the top. A gap in a line means VITALNEX was not confident that time. Move the mouse over a point to see the level and the condition name.",
        },
        {
          title: "Check your next appointment",
          text: "On the right, the **Upcoming appointment** card shows the clinician's name, the type of visit, the time and the place. Press **Appointments** to see all bookings. If you have no bookings, you see the **Care Connect** card instead; press **Find a demo clinician** to book one.",
        },
        {
          title: "Use a quick action",
          text: "Press a tile to go straight to that part of the app: **Start screening** (`/risk-assessment`), **History** (`/history`), **Health profile** (`/health-profile`) or **Find a clinician** (`/care-connect`).",
        },
        {
          title: "Learn how the AI works",
          text: "Press **See the Trust Passport** on the AI Trust Passport card to read how VITALNEX works, how well it was tested and where it can be wrong (see [Trust Passport](/admin/docs/trust-passport)).",
        },
      ],
    },
    { type: "h3", text: "What you see when there is no data yet" },
    {
      type: "list",
      items: [
        "**No screenings yet:** the Latest screening card shows \"No screenings yet\" and \"Your screening results will appear here after you complete a screening with saving turned on.\" The trend chart is hidden.",
        "**Only one screening:** the Latest screening card shows it, but the trend chart is hidden (a trend needs at least two points).",
        "**No appointments:** the Care Connect card is shown instead of Upcoming appointment.",
        "**Server problem:** if the screenings cannot be loaded, the card shows a plain message, for example \"The screening service is not available right now…\" or \"Please sign in again to use the screening.\" The page does not invent a result.",
      ],
    },
    { type: "h3", text: "Filling in and saving the health profile" },
    {
      type: "steps",
      items: [
        {
          title: "Open My Health",
          text: "Press **My Health** in the left menu, or the **Health profile** tile on the dashboard. The page loads any answers you saved before. Questions you never answered are empty.",
        },
        {
          title: "Choose your language (optional)",
          text: "In the **Language** box, pick English, हिन्दी or मराठी. The app switches at once. The choice is also saved to your account (the `preferred_language` field of your profile). If saving to the account fails, you see: \"The language was changed on this device but could not be saved to your account.\"",
        },
        {
          title: "Answer the questions you know",
          text: "The questions are in four groups: **About you**, **Health history**, **Lifestyle** and **How you feel**. Type numbers into the number boxes and pick one option for the choice questions. Skip any question you do not want to answer.",
        },
        {
          title: "Check your BMI",
          text: "When both height and weight are filled in, a **Your BMI** box appears under weight. It uses Asian-Indian cut-offs: overweight from 23, obese from 27.5.",
        },
        {
          title: "Remove an answer you no longer want saved",
          text: "Under each group there is a **Clear** button for every answered question, for example \"Clear: Weight\". Press it to make that question empty again.",
        },
        {
          title: "Press Save Changes",
          text: "The app first checks your numbers. If something is out of range, a red message appears under that question and nothing is saved. If all is fine, the answers are sent to the server and you see a green message: \"Your health profile was saved.\"",
        },
        {
          title: "Start a screening",
          text: "Press **Start Screening Assessment**. Your saved answers are already filled in on the screening form, each marked **From your profile**. Check each one before you continue. See [Risk assessment](/admin/docs/risk-assessment).",
        },
      ],
    },
    {
      type: "image",
      src: "/docs/patient-dashboard/profile-validation.png",
      alt: "The height question with a red error message after an out-of-range value",
      caption: "An out-of-range height (300 cm) is refused. The red message tells you the allowed range. Nothing is saved.",
      markers: [
        { n: 1, text: "The **Height (cm)** box with a value outside 120–220." },
        { n: 2, text: "The red error message: \"Enter a number from 120 to 220.\"" },
      ],
    },
    { type: "h3", text: "Every question on the health profile" },
    {
      type: "p",
      text: "These are all the questions. There are no others. The limits are the same in the web form (`LIMITS` in `apps/web/src/lib/assessment.ts`) and on the server (`apps/api/schemas/health_profile.py`). Every question is optional here.",
    },
    {
      type: "table",
      head: ["Group", "Question (as shown)", "Type of answer and unit", "Allowed values"],
      rows: [
        ["About you", "Your age (years)", "Number, in years", "18 to 120. Under 18 shows \"The screening is only for adults (18 or older)\" and is not saved."],
        ["About you", "Sex assigned at birth", "One choice", "Female, Male, Prefer not to say. Help text: \"Used only for the risk calculation.\""],
        ["About you", "Height (cm)", "Number, in centimetres (steps of 0.5)", "120 to 220"],
        ["About you", "Weight (kg)", "Number, in kilograms (steps of 0.5)", "30 to 250. Height and weight together must give a BMI between 12 and 70."],
        ["Health history", "Has a doctor or nurse ever told you that you have high blood pressure?", "Yes / No", "Yes or No"],
        ["Health history", "Has a doctor or nurse ever told you that your cholesterol is high?", "Yes / No", "Yes or No"],
        ["Health history", "Do you have serious difficulty walking or climbing stairs?", "Yes / No", "Yes or No"],
        ["Lifestyle", "Have you smoked at least 100 cigarettes (5 packs) in your life?", "Yes / No", "Yes or No. Help: \"Answer yes even if you have stopped smoking.\""],
        ["Lifestyle", "In the past 30 days, did you do any physical activity or exercise other than your regular job?", "Yes / No", "Yes or No"],
        ["Lifestyle", "Do you eat fruit at least once a day?", "Yes / No", "Yes or No"],
        ["Lifestyle", "Do you eat vegetables at least once a day?", "Yes / No", "Yes or No"],
        ["Lifestyle", "Do you drink more than 14 drinks a week (men) / 7 a week (women)?", "Yes / No", "Yes or No"],
        ["How you feel", "In general, how is your health?", "One choice", "Excellent, Very good, Good, Fair, Poor (stored as 1 to 5)"],
        ["How you feel", "In the past 30 days, how many days was your mental health not good?", "Number, in days", "0 to 30"],
        ["How you feel", "In the past 30 days, how many days was your physical health not good?", "Number, in days", "0 to 30"],
      ],
    },
    {
      type: "p",
      text: "Height and weight are two boxes, but the screening models use them as one value, BMI (body-mass index). That is why the code comments talk about a \"14-question contract\" while the form shows 15 boxes.",
    },
    { type: "h3", text: "What is NOT asked, and why" },
    {
      type: "list",
      items: [
        "**Income, education and access to healthcare** (for example \"could not afford a doctor\") are never asked. Decision D-6 in `docs/DECISIONS.md` says they are not model inputs and are not asked in the app. They are only used on the public research dataset to check that the models are fair to different groups.",
        "This follows India's data protection law (the DPDP Act): collect only what the product really needs (\"data minimisation\").",
        "Clinical fields from an earlier version of the app are no longer asked. If an old saved row still has them, the server drops them when it reads the profile (`_clean_answers` in `apps/api/routers/v1/profile.py`). It never converts or fills them in.",
        "Symptom questions (chest pain, signs of stroke and so on) are **not** part of the health profile. They are asked fresh on every screening, because they are about how you feel right now.",
      ],
    },

    // ── 5. Behind the scenes ─────────────────────────────────────────────────────────
    { type: "h2", id: "what-happens-behind-the-scenes", text: "What happens behind the scenes" },
    { type: "h3", text: "Where each number on the dashboard comes from" },
    {
      type: "table",
      head: ["What you see", "Where it comes from"],
      rows: [
        ["Your name and the Demo account badge", "Your row in the `profiles` table (`full_name`, `is_demo`), loaded when you sign in."],
        ["Latest screening: date, next step, levels, review badges", "The newest row from `GET /api/v1/assessment/history` (API = the server's web address that the app asks for data). The rows live in the `risk_assessments` table. Review status and the clinician's note come from the review tables."],
        ["Levels over time chart", "All rows from the same history call, oldest first. Each level is drawn as 1 (Low), 2 (Moderate) or 3 (High). Emergency screenings and \"not confident\" results are left out, so they show as gaps."],
        ["Upcoming appointment", "`GET /api/v1/appointments`, which reads the `appointments` table, sorted by time. The card shows the first booking with status \"confirmed\" or \"scheduled\"; if there is none, the first booking in the list."],
        ["Care Connect and AI Trust Passport cards", "Fixed text from the translation files (`apps/web/src/messages/en.json`, `hi.json`, `mr.json`). No data."],
      ],
    },
    {
      type: "p",
      text: "The levels themselves were worked out by the screening models when the screening was submitted. The dashboard does not run any model. It only shows what was saved. How the levels are made is explained in [Understanding results](/admin/docs/understanding-results) and [Models and data](/admin/docs/models-and-data).",
    },
    {
      type: "callout",
      kind: "info",
      title: "No percentages on the dashboard",
      text: "The dashboard shows only the level names (Low, Moderate, High) and never a probability (a percentage chance). Where a model was not confident (it \"abstained\"), it shows **Not confident – see a doctor** and no level at all. This follows decision D-10 in `docs/DECISIONS.md`.",
    },
    { type: "h3", text: "When history is hidden" },
    {
      type: "p",
      text: "Saving screenings needs the consent \"store history\". If the patient turned that consent off in **Settings**, the server returns an empty list (with the note `store_history_withdrawn`). The dashboard then shows \"No screenings yet\", even if old screenings exist in the database. They are hidden right away, not deleted.",
    },
    { type: "h3", text: "Saving the health profile" },
    {
      type: "steps",
      items: [
        {
          title: "Load",
          text: "The page calls `GET /api/v1/health-profile`. The server reads your row in the `health_profiles` table and returns only the answers that still fit today's question list. If you never saved, it returns an empty set of answers.",
        },
        {
          title: "Check in the browser",
          text: "When you press Save Changes, the browser checks every number against the limits. Empty answers are allowed. Age under 18 is refused.",
        },
        {
          title: "Send only answered questions",
          text: "The browser builds a list of only the questions you answered. Empty questions are left out completely. Then it calls `PUT /api/v1/health-profile`.",
        },
        {
          title: "Check again on the server",
          text: "The server checks the same limits again (Pydantic v2 schema `HealthProfileAnswers`). Any unknown field is refused. This means nobody can sneak in extra data, such as income, by calling the API directly.",
        },
        {
          title: "Store",
          text: "The server writes the answers into the `answers` column (JSON) of your `health_profiles` row, plus copies of height and weight. Saving **replaces** the old answers: a question you cleared is removed.",
        },
      ],
    },
    { type: "h3", text: "How the health profile feeds the risk assessment" },
    {
      type: "list",
      items: [
        "When you open the screening form, it loads your saved answers and fills in only the questions that are still empty.",
        "Every filled-in question shows the tag **From your profile**, and a note at the top says: \"Some answers were filled in from your saved health profile… Please check each one before you continue.\"",
        "The screening still needs every question answered before it can be sent. If your profile is missing an answer, the form asks you for it. It never guesses.",
        "The server that runs the models does **not** read the health profile table. It only uses the answers sent with the screening. So the profile is a typing shortcut, nothing more.",
        "If the profile cannot be loaded, the screening form simply starts empty.",
      ],
    },
    { type: "h3", text: "Who can see this data (Row Level Security)" },
    {
      type: "p",
      text: "The database uses **Row Level Security** (RLS: rules inside the database that decide which rows each signed-in person may read or change). The rules are in `supabase/migrations/20261026000001_p1_auth_persistence.sql`.",
    },
    {
      type: "table",
      head: ["Table", "Rule", "What it means"],
      rows: [
        ["`health_profiles`", "\"health_profiles: own\"", "A patient can read and change only their own profile."],
        ["`health_profiles`", "\"health_profiles: clinician reads consented\"", "A clinician can **read** it only while the patient's consent \"share with clinician\" is on."],
        ["`risk_assessments`", "\"risk_assessments: read own\"", "A patient can read only their own screenings. Nobody can write a screening directly; only the API creates them after running the models."],
        ["`risk_assessments`", "\"risk_assessments: clinician reads consented\"", "A clinician can read them only with the patient's sharing consent."],
        ["`appointments`", "\"appointments: patient reads own\" / \"doctor reads own\"", "A patient sees their own bookings; a doctor sees bookings made with them."],
      ],
    },
    {
      type: "p",
      text: "The API also calls the database as the signed-in user (not as a super-user), so these rules always apply. The health profile is included when a patient exports or deletes their data from **Settings** (`apps/api/services/data_rights_service.py`).",
    },

    // ── 6. Safety and limits ─────────────────────────────────────────────────────────
    { type: "h2", id: "safety-and-limits", text: "Safety and limits" },
    {
      type: "callout",
      kind: "danger",
      title: "Emergency",
      text: "The dashboard and health profile do not check for emergencies. If you have chest pain, signs of a stroke, severe breathlessness or fainting, call **108 / 112** now. If a saved screening reported emergency symptoms, the dashboard shows \"Emergency symptoms reported – no levels shown\" instead of levels.",
    },
    {
      type: "callout",
      kind: "warning",
      title: "No made-up answers (hard rule 3)",
      text: "An empty question stays empty. The app never fills in a \"normal\" value for you, not in the browser, not on the server and not in the database. An earlier version filled in fixed clinical values; that was removed because it was wrong.",
    },
    {
      type: "callout",
      kind: "warning",
      title: "The dashboard is a summary, not a diagnosis",
      text: "Levels show how similar your answers are to people who have been told they have a condition. They do not say you have it. The dashboard never names or doses any medicine.",
    },
    {
      type: "list",
      items: [
        "The dashboard shows only the **latest** screening in full. To see every screening, the clinician notes and the PDF report, use **History** and **Reports** (see [History and reports](/admin/docs/history-and-reports)).",
        "All accounts, doctors and appointments are demo (synthetic) data. The Care Connect card says so: \"All doctors in the MVP are synthetic.\"",
        "The health profile does not ask about symptoms, medicines, test results, income, education or healthcare access.",
        "If appointments cannot be loaded, the dashboard quietly shows the Care Connect card; it does not show an error for that.",
        "Several older screens are switched off in the MVP and are not linked from the dashboard: `/health-insights`, `/voice` and `/consultation/*`.",
      ],
    },

    // ── 7. NITI principles ───────────────────────────────────────────────────────────
    { type: "h2", id: "niti-principles", text: "Which NITI Aayog principles this follows" },
    {
      type: "niti",
      items: [
        {
          id: "safety_reliability",
          how: [
            "Missing answers are never filled in with default values, in the form (`EMPTY_DRAFT` starts every answer as empty) or on the server (`HealthProfileAnswers` has no defaults).",
            "Numbers are checked twice, in the browser and on the server, with the same limits; impossible BMI (outside 12–70) is refused.",
            "Results the model was not confident about show \"Not confident – see a doctor\" instead of a level.",
          ],
        },
        {
          id: "inclusivity_non_discrimination",
          how: [
            "The language box on the health profile switches the whole app between English, Hindi and Marathi and saves the choice to the account.",
            "The trend chart does not rely on colour alone: each condition also has its own marker shape and line style, plus a legend.",
            "\"Prefer not to say\" is an allowed answer for sex, and every profile question can be skipped.",
          ],
        },
        {
          id: "equality",
          how: [
            "Income, education and healthcare access are never asked, so they cannot push anyone's levels up or down (decision D-6).",
          ],
        },
        {
          id: "privacy_security",
          how: [
            "Only the screening questions are stored; the server refuses any extra field (`extra=\"forbid\"`).",
            "Row Level Security lets a patient see only their own profile, screenings and bookings; clinicians see them only with the \"share with clinician\" consent.",
            "Turning off \"store history\" hides saved screenings from the dashboard at once.",
            "The health profile is included in the patient's data export and delete in Settings.",
          ],
        },
        {
          id: "transparency",
          how: [
            "Saved answers that are reused on the screening form are marked \"From your profile\", so the patient knows where they came from.",
            "The dashboard links to the AI Trust Passport, which explains how the models work and where they can be wrong.",
            "Every value on the dashboard comes from a database row; nothing is computed or guessed on the page.",
          ],
        },
        {
          id: "accountability",
          how: [
            "The Latest screening card shows whether a clinician has reviewed the result, the clinician's own level if they changed it, and their note.",
            "Screenings can only be created by the API after the models run; a patient cannot write or change a result in the database.",
          ],
        },
        {
          id: "positive_human_values",
          how: [
            "Wording never says \"you have\" a disease; the card says \"This is not a diagnosis.\"",
            "The Next step line turns the result into plain care advice (for example \"Discuss this at your next check-up\") instead of a frightening score.",
            "No medicine is named or suggested anywhere on these screens.",
          ],
        },
      ],
    },

    // ── 8. FAQ ───────────────────────────────────────────────────────────────────────
    { type: "h2", id: "common-questions", text: "Common questions" },
    {
      type: "faq",
      items: [
        {
          q: "Why does my dashboard say \"No screenings yet\" when I did a screening?",
          a: "Either the screening was done with saving turned off, or the \"store history\" consent is off in Settings. When that consent is off, the server returns no history and the dashboard shows the empty message.",
        },
        {
          q: "Why can I not see the Levels over time chart?",
          a: "The chart needs at least two saved screenings. With one screening, only the Latest screening card is shown.",
        },
        {
          q: "What does a gap in the trend line mean?",
          a: "VITALNEX was not confident for that condition at that time, or emergency symptoms were reported, so no level was saved for that point.",
        },
        {
          q: "Do I have to fill in the whole health profile?",
          a: "No. Every question is optional. Questions you skip stay empty and are not saved. The screening form will ask you for them later.",
        },
        {
          q: "If I leave a question empty, will VITALNEX assume a normal value?",
          a: "No, never. An empty answer is stored as \"not answered\". This is a hard rule of the project (rule 3 in `CLAUDE.md`).",
        },
        {
          q: "Does changing my health profile change my old results?",
          a: "No. Old screenings are saved as they were. The profile only fills in the form for your next screening.",
        },
        {
          q: "How do I delete one saved answer?",
          a: "Press the **Clear** button for that question under its group, then press **Save Changes**. Saving replaces the old answers, so the cleared one is removed.",
        },
        {
          q: "Why is income or education not asked?",
          a: "The product does not need them. They are not model inputs and are kept out of the app on purpose (decision D-6, DPDP data minimisation).",
        },
        {
          q: "Can my doctor see my health profile?",
          a: "Only a clinician, and only while your \"share with clinician\" consent is on. You can turn it off in Settings.",
        },
        {
          q: "Why do I see a \"Demo account\" badge?",
          a: "VITALNEX is an MVP. All accounts are dummy demo accounts, and the badge makes that clear.",
        },
      ],
    },
  ],
};

export default page;
