import type { DocPage } from "../types";

// Sources: apps/web/src/app/doctor/{dashboard,patients,cases/[id],appointments}/page.tsx,
// apps/api/routers/v1/doctors.py, apps/api/services/{review_service,prediction_service,screening,doctor_service}.py,
// apps/api/schemas/review.py, supabase/migrations/20261026000001_p1_auth_persistence.sql (RLS),
// tests/test_clinician_review.py, docs/ERAI_REPORT.md.

const page: DocPage = {
  slug: "clinician-workspace",
  title: "Clinician workspace",
  summary:
    "The screens a clinician (doctor) uses to check screening results that need a human look, record Agree or Override with a reason, and manage bookings. The model never decides alone: a person reviews high, uncertain and emergency results.",
  audience: "Clinicians",
  blocks: [
    // 1. What it is
    { type: "h2", id: "what-it-is", text: "What this feature is" },
    {
      type: "p",
      text: "The clinician workspace is the part of VITALNEX for doctors. In the app the doctor role is called **clinician**. It has four screens: a **dashboard**, a **patients and review queue** screen, a **case review** screen for one screening, and an **appointments** screen.",
    },
    {
      type: "p",
      text: "A patient answers a short health form. VITALNEX then runs three **models** (computer programs that learned patterns from survey data) for diabetes or prediabetes, heart disease and stroke. Each model says how similar the answers are to people who have been told they have that condition, and puts the result in a level: Low, Moderate or High. See [Understanding results](/admin/docs/understanding-results).",
    },
    {
      type: "p",
      text: "Some results should not be left to a computer alone. When a result is **High**, when VITALNEX is **not confident**, or when the patient reported **emergency symptoms**, the screening goes into a **review queue** (a to-do list) for clinicians. A clinician opens the case, looks at the answers and the model's reasons, and then either **agrees** with the model or **overrides** it (sets a different level) with a required reason. The clinician can also write a short note that the patient sees.",
    },
    {
      type: "callout",
      kind: "info",
      title: "Why it exists",
      text: "VITALNEX is a screening and care-navigation tool, not a diagnosis tool. The project rule is that the model output alone never decides anything that matters: safety rules run first, and high-risk and uncertain results go to a human. The clinician workspace is where that human check happens.",
    },
    {
      type: "p",
      text: "All clinician accounts in this MVP are **demo accounts** with synthetic (made-up) data: `dr.joshi@vitalnex.demo`, `dr.khan@vitalnex.demo` and `dr.patil@vitalnex.demo`. No real clinician has used the workspace yet.",
    },

    // 2. Where to find it
    { type: "h2", id: "where-to-find-it", text: "Where to find it" },
    {
      type: "p",
      text: "Sign in with a clinician account (see [Accounts and login](/admin/docs/accounts-and-login)). After sign-in a clinician is sent straight to `/doctor/dashboard`. The left menu shows a section called **Clinician portal** with these links:",
    },
    {
      type: "table",
      head: ["Menu item", "URL", "What it is for"],
      rows: [
        ["Clinician dashboard", "`/doctor/dashboard`", "Counts of waiting cases and today's bookings, plus the five newest waiting cases."],
        ["Patients & reviews", "`/doctor/patients`", "The full review queue (with a status filter) and a list of patients who agreed to share."],
        ["(opened from a queue item)", "`/doctor/cases/<id>`", "The case review for one screening. There is no menu item; you reach it with **Open case**."],
        ["Appointments", "`/doctor/appointments`", "Bookings patients made with you through Care Connect."],
        ["AI Trust Passport", "`/ai-trust`", "How the models were built and checked. See [Trust Passport](/admin/docs/trust-passport)."],
        ["Settings", "`/settings`", "Language and account settings."],
      ],
    },
    {
      type: "callout",
      kind: "warning",
      title: "Only the clinician role can open these pages",
      text: "Every page under `/doctor` is limited to the `doctor` role (`apps/web/src/lib/roles.ts`). The server checks this again: every `/api/v1/doctor/...` endpoint uses `require_role(\"doctor\")`. A patient or admin who calls these endpoints is refused.",
    },

    // 3. Screenshots
    { type: "h2", id: "screens", text: "The screens at a glance" },
    { type: "h3", text: "Clinician dashboard" },
    {
      type: "image",
      src: "/docs/clinician-workspace/dashboard.png",
      alt: "Clinician dashboard with two count cards, the most recent pending cases and two buttons.",
      caption: "The clinician dashboard (`/doctor/dashboard`), signed in as dr.joshi.",
      markers: [
        { n: 1, text: "**Pending reviews**: how many cases are waiting for a clinician. The number comes straight from the review queue in the database." },
        { n: 2, text: "**Today's appointments**: your bookings for today that are not cancelled." },
        { n: 3, text: "**Most recent pending cases**: the five newest waiting cases, with patient name, date and why each one is in the queue. **Open case** opens the case review." },
        { n: 4, text: "**Open review queue** goes to the full queue on the Patients & reviews screen." },
        { n: 5, text: "The **Clinician portal** menu on the left." },
      ],
    },
    { type: "h3", text: "Review queue" },
    {
      type: "image",
      src: "/docs/clinician-workspace/queue.png",
      alt: "Patients and review queue screen showing the Review queue tab, the status filter and queue cards.",
      caption: "The **Review queue** tab of `/doctor/patients`.",
      markers: [
        { n: 1, text: "Two tabs: **Review queue** and **Patients**." },
        { n: 2, text: "**Status** filter: All, Pending, Agreed or Overridden. It starts on **Pending**." },
        { n: 3, text: "One queue card: patient name, screening date and time, and the status badge." },
        { n: 4, text: "**Why it is here**: the reasons the screening entered the queue." },
        { n: 5, text: "**Open case** opens the case review for this screening." },
        { n: 6, text: "**Refresh** reloads the list from the server." },
      ],
    },
    { type: "h3", text: "Patients list" },
    {
      type: "image",
      src: "/docs/clinician-workspace/patients.png",
      alt: "Patients tab with a table of consenting patients, their number of screenings, latest screening, latest next step and pending reviews.",
      caption: "The **Patients** tab. Only patients who turned on clinician sharing appear.",
      markers: [
        { n: 1, text: "The **Patients** tab." },
        { n: 2, text: "The note under the title: only patients who agreed to share are shown, and withdrawn consent removes access at once." },
        { n: 3, text: "The table: patient name, number of stored screenings, date of the latest screening, the latest next step shown to the patient, and how many reviews are pending." },
      ],
    },
    { type: "h3", text: "Case review: model output" },
    {
      type: "image",
      src: "/docs/clinician-workspace/case-model-output.png",
      alt: "Case review page with the next step shown to the patient, an ordering note, and one card per condition with main factors, uncertainty and the model's level.",
      caption: "Top of the case review (`/doctor/cases/<id>`). Each condition card shows factors first, then uncertainty, then the model's level.",
      markers: [
        { n: 1, text: "Case title with the patient's name, the screening date, the review status and the queue reasons." },
        { n: 2, text: "**Next step shown to the patient**: the care advice the patient already saw." },
        { n: 3, text: "The ordering note: factors and uncertainty come first and the model's level last, so the level does not steer your judgement." },
        { n: 4, text: "**1. Main factors (SHAP)**: up to three answers that pushed this result up (raises) or down (lowers), with their SHAP number." },
        { n: 5, text: "**2. Uncertainty**: calibrated probability, conformal set, whether the model was confident, and the level thresholds." },
        { n: 6, text: "**3. Model's level**: Low, Moderate, High or Not confident, and the model version." },
      ],
    },
    { type: "h3", text: "Case review: your review form" },
    {
      type: "image",
      src: "/docs/clinician-workspace/case-review-form.png",
      alt: "The Your review card with the Decision radio buttons, the note for the patient and the Save review button.",
      caption: "The **Your review** card at the bottom of a pending case.",
      markers: [
        { n: 1, text: "**Your review**, with the reminder: overrides are logged for accountability and never used to retrain the models." },
        { n: 2, text: "**Decision**: Agree with the model, or Override." },
        { n: 3, text: "**Note for the patient (optional)**: the patient sees this with their result. Do not name or dose medicines." },
        { n: 4, text: "**Save review** sends your decision. It can only be saved once per case." },
      ],
    },
    {
      type: "image",
      src: "/docs/clinician-workspace/case-override.png",
      alt: "The review form with Override chosen, showing a box per condition with an Override this condition checkbox, a New level list, a Reason list and a Reason note field.",
      caption: "After choosing **Override** and ticking one condition. (Nothing is saved until you press Save review.)",
      markers: [
        { n: 1, text: "**Override** is selected." },
        { n: 2, text: "One box per condition, showing the model's level. Tick **Override this condition** to change it." },
        { n: 3, text: "**New level**: only levels different from the model's level are offered." },
        { n: 4, text: "**Reason (required)**: one of six fixed reasons." },
        { n: 5, text: "**Reason note**: required when the reason is Other." },
      ],
    },
    { type: "h3", text: "Appointments" },
    {
      type: "image",
      src: "/docs/clinician-workspace/appointments.png",
      alt: "Appointments page listing bookings with patient name, time, mode, status, reason and action buttons, or an empty state if nobody has booked.",
      caption: "The appointments screen (`/doctor/appointments`). If no patient has booked with this clinician, it shows \"No appointments\".",
      markers: [
        { n: 1, text: "Title and **Refresh** button." },
        { n: 2, text: "The first booking in the list: patient name, time, mode and status (or the empty message when there are none)." },
      ],
    },

    // 4. How to use it
    { type: "h2", id: "how-to-use-it", text: "How to use it" },
    { type: "h3", text: "Review a case" },
    {
      type: "steps",
      items: [
        { title: "Sign in as a clinician", text: "Use a clinician account, for example `dr.joshi@vitalnex.demo`. You land on the **Clinician dashboard**." },
        { title: "See what is waiting", text: "Look at **Pending reviews**. The **Most recent pending cases** card lists the five newest. If the list is empty you see \"No cases are waiting for review.\"" },
        { title: "Open the queue", text: "Press **Open review queue** (or the **Patients & reviews** menu item). The **Review queue** tab shows pending cases, newest first. Use the **Status** filter to see Agreed, Overridden or All cases." },
        { title: "Read why the case is here", text: "Each card shows **Why it is here**. The possible reasons are: High screening level, VITALNEX not confident, Data-quality flag, and Emergency symptoms reported." },
        { title: "Open the case", text: "Press **Open case**. The case review opens at `/doctor/cases/<id>`." },
        { title: "Check for an emergency banner", text: "If the patient ticked an emergency symptom, a red banner says \"Emergency symptoms were reported in this screening.\" In that case no model ran, so there are no condition cards. The patient was already told to call 108 / 112." },
        { title: "Read each condition card from top to bottom", text: "First **1. Main factors (SHAP)**, then **2. Uncertainty**, then **3. Model's level**. Form your own view from the factors and the answers before you look at the level." },
        { title: "Check the answers and data quality", text: "The **Answers** card lists every answer the patient gave. A dash (—) means the patient did not answer; VITALNEX never fills in a value. The **Data-quality notes** card lists problems or things to check." },
        { title: "Look at the history", text: "The **Screening history** chart shows the calibrated probability for each of the patient's stored screenings, one line per condition. A gap means the model was not confident or did not run that time." },
        { title: "Choose Agree or Override", text: "In **Your review**, keep **Agree with the model**, or choose **Override** (see the next steps)." },
        { title: "Write a note for the patient (optional)", text: "Type in **Note for the patient (optional)**. Up to 2000 characters. The patient sees it with their result. Never name or dose a medicine." },
        { title: "Save", text: "Press **Save review**. A green message says \"Review saved. The patient will see that a clinician reviewed this result.\" The case now shows \"This case has been reviewed (Agreed)\" or \"(Overridden)\" and cannot be changed again." },
      ],
    },
    { type: "h3", text: "Override one or more conditions" },
    {
      type: "steps",
      items: [
        { title: "Choose Override", text: "Under **Decision**, choose **Override**. One box appears per condition that has a model result. Each box title shows the model's level, for example \"Heart disease or heart attack — Model's level: High\"." },
        { title: "Tick the condition", text: "Tick **Override this condition** in each box you want to change. You can change one, two or all three." },
        { title: "Pick a new level", text: "In **New level** choose Low, Moderate or High. The model's own level is not offered, because an override must be different." },
        { title: "Pick a reason", text: "In **Reason (required)** choose one of: Clinical history not captured, Symptoms present, Input likely wrong, Model overestimates, Model underestimates, Other." },
        { title: "Add a reason note if needed", text: "**Reason note** (up to 1000 characters) is optional, but required when the reason is **Other**." },
        { title: "Save", text: "Press **Save review**. If something is missing, a red message explains it, for example \"A reason is required for every override.\" or \"Choose at least one condition to override, or choose Agree.\"" },
      ],
    },
    {
      type: "callout",
      kind: "tip",
      title: "Emergency cases",
      text: "An emergency screening has no model results, so there is nothing to override. Choose **Agree with the model** and use the note for the patient. The server also refuses a per-condition override when no model ran for that condition.",
    },
    { type: "h3", text: "Manage appointments" },
    {
      type: "steps",
      items: [
        { title: "Open Appointments", text: "Use the **Appointments** menu item or the button on the dashboard. Bookings are sorted by time, earliest first." },
        { title: "Read a booking", text: "Each card shows the patient's name, date and time, the mode (In person, Audio call or Video), the status, and the patient's **Reason for visit** if they gave one." },
        { title: "Open the linked screening", text: "If the patient attached a screening when booking, a link **Linked screening: Open case** opens that case review." },
        { title: "Confirm, complete or cancel", text: "A **Scheduled** booking shows **Confirm**. A Scheduled or Confirmed booking shows **Mark completed** and **Cancel booking**. A completed or cancelled booking cannot be changed again." },
      ],
    },
    {
      type: "p",
      text: "Bookings are made by patients in Care Connect from demo time slots. See [Care Connect](/admin/docs/care-connect). Video consultations are switched off in this MVP, so no video link is offered, even if a booking says Video.",
    },

    // 5. Behind the scenes
    { type: "h2", id: "what-happens-behind-the-scenes", text: "What happens behind the scenes" },
    { type: "h3", text: "How a screening gets into the queue" },
    {
      type: "list",
      ordered: true,
      items: [
        "A patient submits a screening. The server (`apps/api/services/screening.py`) runs the safety rules first: emergency symptoms, then a data-quality check, then the three models.",
        "The server picks the **next step** for the patient. Three next steps put a case in the queue: **Emergency**, **Not confident** and **See a doctor soon** (when any condition is High).",
        "The queue reasons are worked out: `emergency`, `abstained` (not confident), `high_band` (a confident High), and `data_quality` (data-quality warnings). The data-quality reason is only added to a case that is already queued for one of the other reasons; warnings alone do not queue a case.",
        "The case is only saved and queued if the patient has turned on **both** \"Save my results so I can see my history\" and \"Let VITALNEX clinicians review my results\" (`apps/api/services/prediction_service.py`). Without sharing consent, the patient is told to see a doctor directly and no clinician sees the result.",
      ],
    },
    { type: "h3", text: "Who can see what" },
    {
      type: "p",
      text: "The database uses **Row Level Security** (RLS: rules inside the database that decide which rows each signed-in user may read). A clinician can read a patient's profile, health profile, screenings, queue items and overrides **only while** that patient has an active `share_with_clinician` consent (function `clinician_can_view` in `supabase/migrations/20261026000001_p1_auth_persistence.sql`). When the patient withdraws consent, access stops at once and the case page shows \"This case is not available. The patient may have withdrawn clinician sharing.\"",
    },
    {
      type: "p",
      text: "In this MVP there is no case assignment: every clinician account sees the same queue of consenting patients. Appointments are different: a clinician sees only bookings made with them.",
    },
    { type: "h3", text: "What the case review shows and where the numbers come from" },
    {
      type: "table",
      head: ["Item", "Where it comes from"],
      rows: [
        ["Main factors (SHAP)", "Stored with the screening. **SHAP** is a method that measures how much each answer pushed the result up or down. The top three answers with a non-zero effect are kept (`TOP_K = 3` in `screening.py`)."],
        ["Calibrated probability", "Stored with the screening. **Calibration** is a step that makes the model's number match how often the condition really appears in the data."],
        ["Conformal set", "Stored with the screening. **Conformal prediction** gives the set of answers the model cannot rule out: `{0}` (no condition), `{1}` (condition) or `{0, 1}` (could be either)."],
        ["Not confident and its reason", "Stored with the screening. Two reasons exist: the conformal set contains both outcomes, or the answers are outside the training data (out of distribution)."],
        ["Band thresholds", "From `ml/artifacts/<disease>/model_meta.json` (`thresholds.t_mod`, `thresholds.t_high`). Shown only if the screening was made with the model version loaded now; otherwise the page says the thresholds are not available."],
        ["Model version", "Stored with the screening (`model_versions`), for example `heart-v1.0.0`."],
        ["Data-quality notes", "Worked out again from the stored answers with the same rules as the screening."],
        ["Screening history", "All of this patient's stored screenings, oldest first."],
      ],
    },
    {
      type: "p",
      text: "Patients do not see the SHAP numbers, the probability or the conformal set; the server removes them before answering a patient (`shape_for_role` in `screening.py`). Clinicians see the full result.",
    },
    { type: "h3", text: "What happens when you press Save review" },
    {
      type: "list",
      ordered: true,
      items: [
        "The browser sends `PATCH /api/v1/doctor/reviews/<assessment id>` with the decision, the note and any overrides.",
        "The server first reads the queue item **through your RLS rules**. If you are not allowed to see the patient, it answers \"not found\".",
        "If the case is no longer pending, it refuses (\"already reviewed\"). The status is changed only while it is still pending, so two clinicians cannot both decide the same case.",
        "Every override is checked before anything is written: the condition must have a model result, the new level must differ from the model's level, a reason is required, and \"Other\" needs a note. Bad requests are refused with a clear message.",
        "The review status becomes **agreed** or **overridden**, with your id, the time and your note.",
        "Each override is added to the `clinician_overrides` table with the model's level, your level, the reason, the note, your id and the model version. This table is **append-only**: browsers cannot write to it; only the server can add rows, and rows are not edited.",
        "Two audit entries are written: `OVERRIDE_CREATED` for each override (a database trigger) and `REVIEW_DECISION` for the decision.",
      ],
    },
    { type: "h3", text: "What the patient sees afterwards" },
    {
      type: "p",
      text: "The patient sees that a clinician reviewed the result, your note, and any new level you set. The patient does **not** see the reason code or which clinician reviewed it (`review_info_for` in `review_service.py`). See [History and reports](/admin/docs/history-and-reports).",
    },

    // 6. Safety and limits
    { type: "h2", id: "safety-and-limits", text: "Safety and limits" },
    {
      type: "callout",
      kind: "danger",
      title: "Overrides are never used to retrain the models",
      text: "The override log exists so people can check decisions later (accountability). It is never read by any training, calibration or evaluation code. The test `test_no_ml_code_reads_clinician_overrides` in `tests/test_clinician_review.py` fails if any file under `ml/` mentions the table. The page also tells you this under **Your review**.",
    },
    {
      type: "callout",
      kind: "danger",
      title: "Emergencies come first",
      text: "If emergency symptoms are reported, the patient is told to call **108 / 112** immediately, before any clinician sees the case. Clinician review is never a reason to delay emergency care.",
    },
    {
      type: "callout",
      kind: "warning",
      title: "Not a diagnosis",
      text: "A result means the patient's answers are similar to people who have been told they have the condition. It is not a diagnosis. Your note must not say the patient has a disease, and must not name or dose a medicine.",
    },
    {
      type: "callout",
      kind: "warning",
      title: "The patient sees a High result before review",
      text: "Patients see their result straight away, with a message that a clinician will review it. So the review happens after the patient has seen the level, not before (`docs/ERAI_REPORT.md`, risk table).",
    },
    { type: "h3", text: "What clinicians cannot see or do" },
    {
      type: "list",
      items: [
        "Patients who have not turned on \"Let VITALNEX clinicians review my results\", or who have withdrawn it.",
        "Screenings a patient ran without \"Save my results so I can see my history\": these are never saved, so nobody can see them.",
        "Free text the patient typed: it is only checked for emergency words and is never stored.",
        "The patient's AI assistant chats: chat logs can be read only by their owner.",
        "The patient's consent records, share links, data requests and the audit log.",
        "Other clinicians' appointments.",
        "Clinicians cannot change a screening result itself, edit or delete an override, or change a review once it is saved.",
        "Clinicians cannot retrain or change the models.",
      ],
    },
    { type: "h3", text: "Other limits" },
    {
      type: "list",
      items: [
        "There is no case assignment or hand-over between clinicians; the first clinician to save decides the case.",
        "Video consultations are switched off in the MVP (`/consultation/*` is frozen).",
        "Appointment notes can be sent by the API but this screen has no field for them; it only changes the status.",
        "All accounts and data are synthetic. The workspace has not been tested with real clinicians (`docs/ERAI_REPORT.md`, \"No real users, no real clinicians\").",
      ],
    },

    // 7. NITI
    { type: "h2", id: "niti-principles", text: "Which NITI Aayog principles this follows" },
    {
      type: "niti",
      items: [
        {
          id: "accountability",
          how: [
            "Every Agree or Override saves who decided and when (`reviewed_by`, `reviewed_at`) and writes a `REVIEW_DECISION` audit entry.",
            "Each override is stored in the append-only `clinician_overrides` table with the model's level, the clinician's level, a required reason code and the model version; a database trigger adds an `OVERRIDE_CREATED` audit entry.",
            "The API refuses an override without a reason, an override to the same level, and \"Other\" without a note (tests in `tests/test_clinician_review.py`).",
            "Override and agree rates are shown to admins in governance and the Trust Passport.",
          ],
        },
        {
          id: "safety_reliability",
          how: [
            "High, not-confident and emergency results of consenting patients go to a human review queue; the model never decides alone.",
            "Emergency symptoms skip the models and send the patient to 108 / 112 first.",
            "A case can be decided only once; the status change is guarded so two clinicians cannot both decide it.",
            "Thresholds are shown only when they match the model version that made the result, so a clinician is never shown numbers from a different model.",
          ],
        },
        {
          id: "positive_human_values",
          how: [
            "The case page shows factors and uncertainty before the model's level, so the clinician judges for themself instead of rubber-stamping the model.",
            "Clinicians can override the model; the human decision is what the patient sees.",
            "The note field reminds clinicians not to name or dose medicines.",
          ],
        },
        {
          id: "privacy_security",
          how: [
            "Row Level Security lets a clinician read a patient's data only while that patient's `share_with_clinician` consent is active; withdrawing it removes access at once.",
            "Clinicians never see free text, assistant chats, consents, share links or other clinicians' bookings.",
            "Patients do not see the reason code or the reviewing clinician's identity.",
          ],
        },
        {
          id: "transparency",
          how: [
            "The case shows the model's SHAP factors, calibrated probability, conformal set, abstain reason, thresholds and model version.",
            "The patient is told that a clinician reviewed the result and sees the clinician's note and any new level.",
            "The page states plainly that overrides are logged and never used to retrain the models.",
          ],
        },
      ],
    },

    // 8. FAQ
    { type: "h2", id: "common-questions", text: "Common questions" },
    {
      type: "faq",
      items: [
        {
          q: "Why is a patient missing from my list?",
          a: "Only patients with an active \"Let VITALNEX clinicians review my results\" consent appear. If the patient never turned it on, or turned it off, you cannot see them. A patient also needs \"Save my results so I can see my history\" on for any screening to be saved.",
        },
        {
          q: "Why is the queue empty although a patient got a High result?",
          a: "A case is queued only if the patient shares with clinicians and stores history. Without sharing, the patient is told to see a doctor directly. Also check the **Status** filter: it starts on Pending, so reviewed cases are hidden until you choose All, Agreed or Overridden.",
        },
        {
          q: "Can I change my review after saving?",
          a: "No. Once a case is Agreed or Overridden it cannot be changed. The server refuses a second decision on the same case.",
        },
        {
          q: "Do my overrides teach the model?",
          a: "No. Overrides are stored only so decisions can be checked later. No training code reads them, and a test enforces this. Any future model update is a separate, human-led step.",
        },
        {
          q: "Why does the case show the model's level last?",
          a: "To reduce automation bias (trusting the computer too much). You see the main factors and how sure the model is before you see its level.",
        },
        {
          q: "What does \"Not confident\" mean?",
          a: "The model did not give a level it can stand behind. Either its conformal set contains both outcomes, or the answers are outside the data it was trained on. The patient is told to see a doctor.",
        },
        {
          q: "Why does the case say \"Thresholds not available\"?",
          a: "The screening was made by a model version that is not loaded now, so the current thresholds might not match. The page does not show numbers that may be wrong.",
        },
        {
          q: "Can I override an emergency case?",
          a: "There is nothing to override, because no model runs when emergency symptoms are reported. Choose Agree and add a note if useful.",
        },
        {
          q: "Do other clinicians see the same queue?",
          a: "Yes. In this MVP every clinician sees all consenting patients' cases. The first clinician to save a decision closes the case. Appointments are private to each clinician.",
        },
        {
          q: "Can I start a video call from an appointment?",
          a: "No. Video consultations are switched off in this MVP.",
        },
      ],
    },
  ],
};

export default page;
