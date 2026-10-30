import type { DocPage } from "../types";

// Sources: apps/web/src/components/assessment/ResultsView.tsx, BandBadge.tsx, AssessmentRow.tsx,
// apps/api/services/screening.py, prediction_service.py, ml/predictor.py, ml/training/bands.py,
// ml/artifacts/<disease>/model_meta.json, docs/DECISIONS.md (D-9, D-10, D-22, D-24).

const page: DocPage = {
  slug: "understanding-results",
  title: "Understanding your results",
  summary:
    "What every part of the result screen means after a screening: the levels, the \"not confident\" state, the reasons, the next step and how soon to get care. It also explains where each number comes from.",
  audience: "Patients and clinicians",
  blocks: [
    // 1. What it is
    { type: "h2", id: "what-it-is", text: "What this feature is" },
    {
      type: "p",
      text: "After a person finishes a screening on the [Risk assessment](/admin/docs/risk-assessment) page and presses **See my results**, VITALNEX shows the **result screen**. Its title is **Your screening results**.",
    },
    {
      type: "p",
      text: "The result screen answers three simple questions for each of three conditions: **diabetes or prediabetes**, **heart disease or heart attack**, and **stroke**.",
    },
    {
      type: "list",
      items: [
        "**How similar are my answers?** Each condition gets a level: **Low**, **Moderate** or **High**, or **Not confident — see a doctor**.",
        "**Why?** The answers that mattered most for each level.",
        "**What should I do, and how soon?** One clear next step, such as \"See a doctor soon (within 2 weeks)\".",
      ],
    },
    {
      type: "callout",
      kind: "warning",
      title: "This is not a diagnosis",
      text: "VITALNEX never says \"you have diabetes\". It says \"Your answers are similar to people who have been told they have diabetes or prediabetes\". The words **This is not a diagnosis.** appear at the top of the screen and on every condition card.",
    },
    {
      type: "p",
      text: "**Who uses it:** patients read it right after their screening. Clinicians use this page to understand what the patient was shown, because the patient often brings these words to the appointment. Clinicians see more detail (numbers) in the [Clinician workspace](/admin/docs/clinician-workspace).",
    },

    // 2. Where to find it
    { type: "h2", id: "where-to-find-it", text: "Where to find it" },
    {
      type: "list",
      items: [
        "**Menu:** Risk assessment in the left menu. **URL:** `/risk-assessment`.",
        "**Role:** a signed-in **patient** account. The patient must have given the consent called `assessment_processing` (in My data → Consent), or the screening will not run.",
        "The result screen appears **only straight after pressing See my results**. It is not a separate page with its own address. If you reload the page, the form starts again.",
        "Saved results can be seen again later, in a shorter form, on the **History** page (`/history`). See [History and reports](/admin/docs/history-and-reports).",
      ],
    },
    {
      type: "callout",
      kind: "info",
      title: "Two other screens can appear instead",
      text: "If the person ticked an emergency symptom (or typed a red-flag word), the **emergency screen** appears with **108 / 112** and no levels at all. If the height and weight give a BMI outside 12–70, a **Please check your answers** screen appears instead, and no result is made. These are explained in [Risk assessment](/admin/docs/risk-assessment).",
    },

    // 3. Screenshots
    { type: "h2", id: "screen-tour", text: "A tour of the result screen" },
    {
      type: "p",
      text: "The screenshots below come from real screenings made by the demo patient **patient1** (a synthetic test account) with made-up answers. Your own result will show different levels. Numbers in red circles match the list under each picture.",
    },
    {
      type: "image",
      src: "/docs/understanding-results/top.png",
      alt: "Top of the result screen: title, next-step banner, clinician review note and the three condition cards",
      caption: "Top of the result screen. Here two conditions are High and stroke is \"Not confident\", so the next step is \"not confident\".",
      markers: [
        { n: 1, text: "**Title.** \"Your screening results\", with \"This is not a diagnosis.\" underneath." },
        { n: 2, text: "**Next step banner.** One next step for the whole screening and how soon to act. Its colour and icon change with the step." },
        { n: 3, text: "**Clinician review note.** \"A clinician will review this result.\" Shown only when the result was sent to the review queue." },
        { n: 4, text: "**A condition card with a level** (here Diabetes or prediabetes, High) and the plain sentence \"Your answers are similar to people who have been told they have…\"." },
        { n: 5, text: "**A \"Not confident — see a doctor\" card** (here Stroke). No level is shown, and the small text gives the reason." },
      ],
    },
    {
      type: "image",
      src: "/docs/understanding-results/care.png",
      alt: "Next step banner saying see a doctor soon, with the book a doctor box",
      caption: "A different screening where all three conditions are High: the next step is \"See a doctor soon (within 2 weeks)\".",
      markers: [
        { n: 1, text: "**See a doctor soon (within 2 weeks)** banner (red)." },
        { n: 2, text: "**Book a demo … doctor** button. It opens Care Connect with the matching specialty already chosen." },
      ],
    },
    {
      type: "image",
      src: "/docs/understanding-results/why.png",
      alt: "Why this result, Shared factors, What you can change and How sure is VITALNEX cards",
      caption: "The explanation cards under the condition cards.",
      markers: [
        { n: 1, text: "**Why this result?** Up to three answers that mattered most for each condition." },
        { n: 2, text: "**Shared factors.** Answers that mattered for more than one condition." },
        { n: 3, text: "**What you can change.** The smallest realistic change that would lower a level." },
        { n: 4, text: "**How sure is VITALNEX?** Confident or not confident for each condition, and how often the model missed people in testing." },
      ],
    },
    {
      type: "image",
      src: "/docs/understanding-results/bottom.png",
      alt: "Bottom of the result screen: what-if panel, general guidance, disclaimer and buttons",
      caption: "Bottom of the result screen.",
      markers: [
        { n: 1, text: "**What if…?** Try changing answers you can change and see how the levels would move. Nothing is saved." },
        { n: 2, text: "**General guidance.** Short public-health advice from WHO and ICMR, with a link to each source." },
        { n: 3, text: "**Disclaimer.** What VITALNEX is and is not, with 108 / 112 for emergencies." },
        { n: 4, text: "**Buttons.** Start a new screening, See my history, Find a doctor." },
      ],
    },

    // Reading each part
    { type: "h2", id: "the-levels", text: "The levels: Low, Moderate, High" },
    {
      type: "p",
      text: "Each condition gets one level. The level is shown with **colour, an icon and a word** together, never colour alone, so it also works for people who cannot see colours well.",
    },
    {
      type: "table",
      head: ["Level", "Look", "Sentence shown on the card"],
      rows: [
        ["Low", "Green, shield icon", "Your answers are **less similar** to people who have been told they have …"],
        ["Moderate", "Amber, warning triangle", "Your answers are **somewhat similar** to people who have been told they have …"],
        ["High", "Red, octagon icon", "Your answers are **similar** to people who have been told they have …"],
        ["Not confident — see a doctor", "Grey, question-mark icon", "VITALNEX is not confident about your answers for this condition, so no level is shown. Please see a doctor."],
      ],
    },
    { type: "h3", text: "How a level is chosen" },
    {
      type: "steps",
      items: [
        {
          title: "The model gives a score",
          text: "A model (a computer program trained on past survey answers) turns the answers into a score between 0 and 1. The score then goes through **calibration** (a correction step, so that a score of 0.10 means about 10 in 100 similar people had been told they have the condition).",
        },
        {
          title: "The score is compared with two cut-offs",
          text: "If the score is at or above the **High cut-off**, the level is High. If it is at or above the **Moderate cut-off**, the level is Moderate. Otherwise it is Low. The code is `ml/training/bands.py` (`assign`).",
        },
        {
          title: "The cut-offs are set to miss as few people as possible",
          text: "The **Moderate cut-off** is set so that at least 80 in 100 people who had been told they have the condition reach Moderate or High in the data used to set the cut-offs (on new test data this came out at about 79–85 in 100). The **High cut-off** is the lowest score where people in that group are at least 3 times as likely to have the condition as the average person. Both come from `model_meta.json` → `thresholds`.",
        },
      ],
    },
    {
      type: "table",
      head: ["Condition", "Model", "Moderate from", "High from", "Average rate in test data"],
      rows: [
        ["Diabetes or prediabetes", "LightGBM", "0.125", "0.277", "13.9%"],
        ["Heart disease or heart attack", "LightGBM", "0.103", "0.161", "9.4%"],
        ["Stroke", "Logistic regression", "0.034", "0.088", "4.1%"],
      ],
    },
    {
      type: "p",
      text: "Source: `ml/artifacts/<disease>/model_meta.json` → `chosen_model`, `thresholds.t_mod`, `thresholds.t_high`, `test_metrics.prevalence` (rounded). Version 1.0.0 of each model.",
    },
    { type: "h3", text: "What each level meant in testing" },
    {
      type: "p",
      text: "The table shows, for each level, **how many people in that level really had been told they have the condition** in the held-back test data (about 50,700 people per condition). This is what a level means in practice.",
    },
    {
      type: "table",
      head: ["Condition", "Low", "Moderate", "High"],
      rows: [
        ["Diabetes or prediabetes", "about 4 in 100", "about 19 in 100", "about 43 in 100"],
        ["Heart disease or heart attack", "about 2 in 100", "about 13 in 100", "about 30 in 100"],
        ["Stroke", "about 1 in 100", "about 6 in 100", "about 14 in 100"],
      ],
    },
    {
      type: "p",
      text: "Source: `model_meta.json` → `bands_test.<level>.observed_rate`, rounded to whole numbers. Notice that **High does not mean \"certain\"**: even in the High group for stroke, most people had not been told they had a stroke. And **Low does not mean \"no risk\"**.",
    },

    { type: "h2", id: "not-confident", text: "The \"Not confident — see a doctor\" state" },
    {
      type: "p",
      text: "Sometimes VITALNEX **refuses to give a level** for a condition. This is called **abstaining** (choosing not to answer). The card then shows a grey **Not confident — see a doctor** badge and no level. This is on purpose (decision D-10 and D-22): showing a level the model is not sure about would be false comfort or false alarm.",
    },
    { type: "p", text: "There are two reasons, and the card shows which one in small text:" },
    {
      type: "table",
      head: ["Reason shown", "What it means", "How it is checked"],
      rows: [
        [
          "Your answers fall where the model could go either way.",
          "The answers sit in a grey zone between \"similar\" and \"not similar\".",
          "**Conformal prediction** (a method that builds a set of likely answers with a known error rate). Here the set holds both \"yes\" and \"no\" (or neither), so the model abstains. Error rate α = 0.10.",
        ],
        [
          "Your answers are unlike most of the people the model learned from.",
          "The combination of answers is unusual compared with the training data.",
          "An **out-of-distribution check** (an Isolation Forest, a method that spots unusual rows), set at the 99th percentile of the training data.",
        ],
      ],
    },
    {
      type: "callout",
      kind: "info",
      title: "Not confident happens often — and that is expected",
      text: "In testing, the model abstained for about **37% (diabetes), 39% (heart) and 44% (stroke)** of people (`model_meta.json` → `conformal_test.abstention_rate_total`). This was accepted at the P3 sign-off (D-22) because it is safer than guessing. When the model did give a level, the set contained the true answer for about 90% (diabetes), 93% (heart) and 91% (stroke) of people (`conformal_test.coverage.overall`).",
    },
    {
      type: "list",
      items: [
        "When a condition is \"not confident\", **no reasons** are shown for it in \"Why this result?\", and no suggestion is given in \"What you can change\".",
        "If even one condition is \"not confident\", the next step for the whole screening becomes **VITALNEX is not confident for you. Please see a doctor.**",
        "If the person chose **Prefer not to say** for sex, VITALNEX runs the model twice (as female and as male). If either run is not confident, the condition is shown as not confident (D-9).",
      ],
    },

    { type: "h2", id: "next-step", text: "The next step: what care to seek and how soon" },
    {
      type: "p",
      text: "The banner near the top gives **one next step** for the whole screening. The server checks the rules below **in this order**, and the first one that matches wins (`apps/api/services/screening.py` → `next_step`).",
    },
    {
      type: "table",
      head: ["Order", "When", "What the person sees"],
      rows: [
        ["1", "An emergency symptom was ticked or a red-flag word was typed", "Emergency screen: **call 108 / 112 now**. No levels."],
        ["2", "BMI outside 12–70", "**Please check your answers.** No result."],
        ["3", "Any condition is not confident", "**VITALNEX is not confident for you. Please see a doctor.** (grey banner)"],
        ["4", "Any condition is High", "**See a doctor soon (within 2 weeks)** (red banner)"],
        ["5", "Any condition is Moderate", "**Discuss this at your next check-up** (amber banner)"],
        ["6", "All three are Low", "**Keep up regular check-ups.** \"Low does not mean no risk.\" (green banner)"],
      ],
    },
    { type: "h3", text: "Booking a clinician from the result" },
    {
      type: "list",
      items: [
        "When the next step is **See a doctor soon**, an extra box appears under the banner with a button **Book a demo … doctor**. It opens [Care Connect](/admin/docs/care-connect) with a specialty already chosen.",
        "The specialty follows the condition with the **highest confident level**: diabetes → Endocrinology, heart → Cardiology, stroke → Neurology. If two are equal, the order diabetes, heart, stroke decides (`apps/web/src/lib/care.ts`).",
        "The **Find a doctor** button at the bottom is always there. It opens Care Connect (with the same specialty when there is one).",
        "All doctors in Care Connect are **synthetic demo doctors**. No real appointment is made.",
      ],
    },

    { type: "h2", id: "notes", text: "Notes and messages that can appear" },
    {
      type: "p",
      text: "Between the banner and the cards, short notes can appear. Each one is a fixed message chosen by a rule in the server code:",
    },
    {
      type: "table",
      head: ["Message", "When it appears"],
      rows: [
        ["**A clinician will review this result.**", "The next step is emergency, not confident or see a doctor soon, AND the person allowed both saving history and sharing with clinicians."],
        ["Results are less reliable for people under 40 …", "The person's age is below 40 (D-24). See below."],
        ["You chose not to say your sex, so VITALNEX checked both and shows the higher level …", "Sex was \"Prefer not to say\" (D-9)."],
        ["This result would normally be sent for clinician review, but sharing with clinicians is turned off …", "The result needed review, but the share-with-clinician consent is off."],
        ["This result was not saved to your history …", "The save-history consent is off. The result is shown once and not stored."],
        ["You rated your health as excellent but reported many days of not feeling well …", "General health = Excellent and 20 or more unwell days (a data-quality warning)."],
        ["You rated your health as excellent but reported serious difficulty walking …", "General health = Excellent and difficulty walking = Yes (a data-quality warning)."],
      ],
    },
    { type: "h3", text: "The under-40 reliability note (D-24)" },
    {
      type: "callout",
      kind: "warning",
      title: "Results are less reliable for people under 40",
      text: "In testing, the models found far fewer of the younger people who had been told they have a condition. For ages 18–39 the share found was only about 12–40 in 100, against 86–91 in 100 for people aged 60 and over (docs/DECISIONS.md, D-24). Changing the cut-offs for young people was tried, but it caused too many false alarms, so it was not used. Instead, everyone under 40 sees this note, and the gap is shown on the Trust Passport.",
    },

    { type: "h2", id: "reasons", text: "Why this result? (the main factors)" },
    {
      type: "p",
      text: "For each confident condition, the card **Why this result?** lists **up to three answers** that pushed the result the most. Each line has an arrow:",
    },
    {
      type: "list",
      items: [
        "**Red arrow up:** this answer made your answers **more similar** to people who have been told they have this condition.",
        "**Green arrow down:** this answer made your answers **less similar**.",
      ],
    },
    {
      type: "p",
      text: "Example sentence (from `apps/api/content/explanations.en.json`): \"Told you have high blood pressure made your answers more similar to people who have been told they have this condition.\"",
    },
    { type: "h3", text: "How the factors are worked out" },
    {
      type: "list",
      items: [
        "VITALNEX uses **SHAP** (a method that splits a model's score into a share for each answer). SHAP really runs on the server for every screening: `TreeExplainer` for the diabetes and heart models and `LinearExplainer` for the stroke model (`model_meta.json` → `shap.explainer`).",
        "The three answers with the biggest share (positive or negative) are kept. An answer with a share of exactly zero is skipped (`screening.py` → `_explain`).",
        "Patients see only the sentence and the arrow. The raw SHAP number is removed before the result is sent to the patient. Clinicians see the number in the case review.",
        "SHAP explains **what the model did**, not what causes disease. A factor that \"lowers\" a level is not health advice.",
      ],
    },
    { type: "h3", text: "Shared factors" },
    {
      type: "p",
      text: "The **Shared factors** card lists answers that appear in the top three of **two or more** confident conditions, with \"more similar\" or \"less similar\" for each. If no answer is shared, it says so.",
    },

    { type: "h2", id: "what-you-can-change", text: "What you can change and What if…?" },
    {
      type: "list",
      items: [
        "**What you can change** looks for the **smallest realistic change** that would lower a Moderate or High level by trying single changes and pairs of changes. Limits: weight down by at most 10%, unwell days at most halved, general health one step better. Age, sex, blood pressure, cholesterol and difficulty walking are **never** changed.",
        "If a condition is already Low, it says so. If no small change helps, it says a doctor can help plan next steps.",
        "**What if…?** lets the person change answers by hand (weight, general health, unwell days, activity, fruit, vegetables, alcohol) and press **Show the new levels**. Before and after levels are shown. **Nothing is saved.**",
        "Smoking cannot be changed back to \"No\", because the question asks if the person has **ever** smoked 100 cigarettes. A note explains that quitting still lowers real-world risk.",
        "Both say: \"These are estimates from the model, not a promise. This is not a diagnosis.\"",
      ],
    },

    { type: "h2", id: "how-sure", text: "How to read the numbers" },
    {
      type: "callout",
      kind: "info",
      title: "Patients never see a percentage for their own result",
      text: "By design (D-10), the patient screen shows **levels only** — no probability, no score and no range. The PDF report also shows levels only. Only clinicians see the calibrated probability.",
    },
    {
      type: "p",
      text: "The one number a patient sees is in **How sure is VITALNEX?**. For each condition it says \"Confident\" or \"Not confident\", and a sentence like:",
    },
    {
      type: "p",
      text: "\"In testing, for every 100 people who had been told they have diabetes or prediabetes, about **15** were shown as Low.\"",
    },
    {
      type: "table",
      head: ["Condition", "Missed (shown as Low) per 100", "From"],
      rows: [
        ["Diabetes or prediabetes", "about 15", "1 − `test_metrics.recall_at_t_mod` (0.855)"],
        ["Heart disease or heart attack", "about 16", "1 − `test_metrics.recall_at_t_mod` (0.838)"],
        ["Stroke", "about 21", "1 − `test_metrics.recall_at_t_mod` (0.792)"],
      ],
    },
    {
      type: "p",
      text: "The page fetches these numbers live from the server (`GET /api/v1/models`), which reads them from `model_meta.json`. If the server cannot be reached, the sentence is simply not shown. The link **See the Trust Passport** opens [Trust Passport](/admin/docs/trust-passport) with more numbers.",
    },
    { type: "h3", text: "What clinicians see in addition" },
    {
      type: "list",
      items: [
        "**Calibrated probability:** the corrected score between 0 and 1 (for example 0.184 means about 18 in 100 similar people).",
        "**Conformal set:** `{0}` = \"no condition\", `{1}` = \"condition\", `{0, 1}` = could be either (so the model abstained).",
        "**Band cut-offs** used for that model, the SHAP number for each factor, and the model version.",
        "These are shown in the case review in the [Clinician workspace](/admin/docs/clinician-workspace), with factors and uncertainty first and the level last, so the level does not steer the clinician.",
      ],
    },

    { type: "h2", id: "clinician-review", text: "Clinician review status" },
    {
      type: "list",
      items: [
        "A result is sent to the clinician review queue when the next step is **emergency**, **not confident** or **see a doctor soon** — and only if the person allowed sharing with clinicians.",
        "On the result screen, the person then sees **A clinician will review this result.**",
        "On the History page, the screening shows **Waiting for clinician review** until a clinician acts, then **Reviewed by a clinician**.",
        "If the clinician changed a level, History shows **Clinician's level** next to the model's level. Any note from the clinician appears under **Clinician note**.",
        "Clinician changes are never used to retrain the models.",
      ],
    },

    { type: "h2", id: "pdf-and-sharing", text: "PDF report and sharing" },
    {
      type: "p",
      text: "There are **no PDF or share buttons on the result screen itself**. Once a result is saved, the person can:",
    },
    {
      type: "list",
      items: [
        "Open **Reports** (`/reports`), choose a report language and press **Download PDF** for any saved screening. The PDF shows levels only, never percentages.",
        "On the same page, create a QR / link share for a doctor, and cancel it at any time.",
        "See [History and reports](/admin/docs/history-and-reports) for the full steps.",
      ],
    },

    // 4. How to use it
    { type: "h2", id: "how-to-use-it", text: "How to use it" },
    {
      type: "steps",
      items: [
        { title: "Finish a screening", text: "Sign in as a patient, open **Risk assessment**, answer all questions, tick no emergency symptoms, and press **See my results** on the Review step." },
        { title: "Read the next step first", text: "The banner at the top tells you what to do and how soon. If it says **See a doctor soon (within 2 weeks)**, plan to see a doctor in that time." },
        { title: "Read each condition card", text: "Look at the level badge and the sentence. A grey **Not confident** badge means please see a doctor for that condition." },
        { title: "Read the notes", text: "Check any notes under the banner, for example the under-40 note or \"A clinician will review this result\"." },
        { title: "See why", text: "Scroll to **Why this result?** and **Shared factors** to see which answers mattered." },
        { title: "Look at what could change", text: "Read **What you can change**, and try **What if…?** if you like. Nothing you try there is saved." },
        { title: "Check how sure the result is", text: "Read **How sure is VITALNEX?** Use **See the Trust Passport** for more detail." },
        { title: "Act on it", text: "Press **Book a demo … doctor** (when shown) or **Find a doctor** to open Care Connect. Press **See my history** to see this and older results. Press **Start a new screening** to begin again." },
        { title: "Get a PDF if needed", text: "Go to **Reports** and press **Download PDF** for the saved screening." },
      ],
    },
    {
      type: "callout",
      kind: "danger",
      title: "Emergency",
      text: "If you have chest pain, signs of stroke (face drooping, arm weakness, trouble speaking) or severe breathlessness, **call 108 / 112 now**. Do not wait for a screening result.",
    },

    // 5. Behind the scenes
    { type: "h2", id: "what-happens-behind-the-scenes", text: "What happens behind the scenes" },
    {
      type: "steps",
      items: [
        { title: "Consent check", text: "The server (`POST /api/v1/assessment`) first checks that the person gave the `assessment_processing` consent. If not, it stops and asks them to turn it on." },
        { title: "Emergency check", text: "If any emergency symptom is ticked, or the free text contains a red-flag word, the server stops here. No model runs and no level is made." },
        { title: "Data-quality check", text: "BMI is worked out from height and weight. If it is outside 12–70, the server stops and asks the person to check. Odd but possible answers only create a warning." },
        { title: "Model, calibration, cut-offs", text: "The 14 answers are turned into the same format the models learned from. Each of the three models gives a score, calibration corrects it, and the two cut-offs turn it into a level." },
        { title: "Confidence checks", text: "The conformal check and the out-of-distribution check decide if the model should abstain for each condition." },
        { title: "Reasons and guidance", text: "SHAP finds the top three factors. General guidance items are picked from fixed WHO / ICMR text based on the answers (for example BMI 23 or more, no physical activity, smoking, or high blood pressure). \"Regular check-ups\" is always included." },
        { title: "Next step and review", text: "The next-step rules run in order. If review is needed and consent allows, the result is saved and added to the clinician review queue." },
        { title: "Shaped for the patient", text: "Before sending to the patient, the server removes the probability, conformal set and SHAP numbers, and removes the level and reasons for any condition that abstained." },
      ],
    },
    {
      type: "p",
      text: "Everything runs on the VITALNEX server. No answers are sent to any outside company or AI service.",
    },

    // 6. Safety and limits
    { type: "h2", id: "safety-and-limits", text: "Safety and limits" },
    {
      type: "callout",
      kind: "danger",
      title: "Emergency always wins",
      text: "Emergency symptoms override everything. The person sees 108 / 112 right away and no levels are made — even if the server is unreachable.",
    },
    {
      type: "callout",
      kind: "warning",
      title: "Not a diagnosis and no medicines",
      text: "VITALNEX never says a person has a disease and never names or doses a medicine. Clinicians are reminded of this when they write a note.",
    },
    {
      type: "callout",
      kind: "warning",
      title: "The models learned from US survey answers",
      text: "The models were trained on BRFSS (a large US telephone health survey). People in India may differ. The answers are self-reported, and \"been told they have\" depends on whether someone was ever tested. The Pune data in the app is **synthetic** (made up for testing) and is never used to train or test the models.",
    },
    {
      type: "callout",
      kind: "info",
      title: "Low does not mean safe",
      text: "In testing, about 15–21 in 100 people who had been told they have a condition were still shown as Low. Regular check-ups are always advised.",
    },
    {
      type: "list",
      items: [
        "Missing answers are never filled in: the form will not send until every question is answered.",
        "The result screen cannot be reopened later in full. History and the PDF show the levels, next step and review status, but not the factors or what-if.",
        "What-if and \"What you can change\" are model estimates, not promises.",
        "Results for people under 40 are less reliable (D-24).",
      ],
    },

    // 7. NITI
    { type: "h2", id: "niti-principles", text: "Which NITI Aayog principles this follows" },
    {
      type: "niti",
      items: [
        {
          id: "safety_reliability",
          how: [
            "Emergency and data-quality checks run before any model (`screening.py` → `assess`).",
            "Conformal and out-of-distribution checks make the model abstain instead of guessing; abstained conditions show no level.",
            "Cut-offs are set so that at least 80% of true cases reach Moderate or High (recall-first bands).",
            "High, not-confident and emergency results go to clinician review.",
          ],
        },
        {
          id: "equality",
          how: [
            "The age gap in how many cases are found is measured and not hidden (D-24).",
            "Everyone under 40 sees a note that results are less reliable for their age.",
            "The gap is also shown on the Trust Passport for anyone to check.",
          ],
        },
        {
          id: "inclusivity_non_discrimination",
          how: [
            "Every message on the result screen comes from the English, Hindi and Marathi language files.",
            "Levels use colour, icon and word together, not colour alone.",
            "\"Prefer not to say\" for sex is respected: both versions are checked and the higher level is shown (D-9).",
          ],
        },
        {
          id: "privacy_security",
          how: [
            "Results are saved only with the save-history consent, and sent for review only with the share-with-clinician consent.",
            "Free text is only checked for emergency words and is never saved.",
            "All models and explanations run on the VITALNEX server; no outside AI service is used.",
          ],
        },
        {
          id: "transparency",
          how: [
            "\"Why this result?\" shows the top factors from SHAP that really ran for this screening.",
            "\"How sure is VITALNEX?\" shows the real miss rate from `model_meta.json`, read live from the server.",
            "The reason for abstaining is shown on the card.",
          ],
        },
        {
          id: "accountability",
          how: [
            "Each saved result stores the model version and data hash used.",
            "Clinician agree/override decisions and notes are recorded and shown back on History.",
          ],
        },
        {
          id: "positive_human_values",
          how: [
            "Wording says \"similar to people who have been told they have…\", never \"you have\".",
            "Every result points to a human next step (a doctor or a check-up) rather than letting the model decide.",
            "No medicines are named; guidance comes only from public WHO and ICMR material.",
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
          q: "Does \"High\" mean I have the disease?",
          a: "No. It means your answers are similar to people who have been told they have it. In testing, about 43 in 100 people in the High group for diabetes had been told they have it — so many people in High did not. Please see a doctor, who can test properly.",
        },
        {
          q: "Does \"Low\" mean I am safe?",
          a: "No. Low means your answers are less similar. In testing, about 15–21 in 100 people who had been told they have a condition were still shown as Low. Keep up regular check-ups.",
        },
        {
          q: "Why does it say \"Not confident\" instead of a level?",
          a: "Your answers fell where the model could go either way, or were unlike most people it learned from. Rather than guess, VITALNEX shows no level and asks you to see a doctor. This happens for about 37–44 in 100 people.",
        },
        {
          q: "Why can't I see a percentage?",
          a: "Patients see levels only (decision D-10). A precise-looking number can mislead. Clinicians who review your result can see the calibrated probability.",
        },
        {
          q: "Why does my result say it is less reliable because I am under 40?",
          a: "In testing, the models found far fewer cases in people aged 18–39 than in older people. VITALNEX tells you this openly instead of hiding it.",
        },
        {
          q: "Will a doctor look at my result?",
          a: "If your next step is see a doctor soon, not confident or emergency, and you allowed sharing with clinicians, a demo clinician will review it. You will see \"A clinician will review this result\" and later \"Reviewed by a clinician\" on History.",
        },
        {
          q: "Can I get my result as a PDF?",
          a: "Yes, if the result was saved. Go to Reports and press Download PDF. It shows levels only.",
        },
        {
          q: "I closed the page. Can I see the full result screen again?",
          a: "No. The full screen (with reasons and what-if) appears only once. History and the PDF keep the levels, next step and review status. You can run a new screening at any time.",
        },
        {
          q: "Where do the reasons come from?",
          a: "From SHAP, a method that splits the model's score into a share for each answer. It runs on the VITALNEX server for every screening. It shows what the model used, not what causes disease.",
        },
      ],
    },
  ],
};

export default page;
