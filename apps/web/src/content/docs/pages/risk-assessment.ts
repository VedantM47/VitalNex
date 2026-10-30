import type { DocPage } from "../types";

// Sources: apps/web/src/app/risk-assessment/page.tsx, components/assessment/{AnswerFields,Questions,EmergencyScreen}.tsx,
// lib/assessment.ts, apps/api/routers/v1/assessment.py, apps/api/services/{prediction_service,screening}.py,
// apps/api/core/emergency.py, ml/nlp/rules.py, ml/predictor.py, docs/SPEC.md §1.4 / §2.2, docs/DECISIONS.md.

const page: DocPage = {
  slug: "risk-assessment",
  title: "Risk assessment",
  summary:
    "A short form in six steps. It checks for emergency signs first, then compares your answers with three screening models for diabetes, heart disease and stroke, and tells you what kind of care to seek and how soon.",
  audience: "Patients",
  blocks: [
    // ------------------------------------------------------------------------------------------
    { type: "h2", id: "what-it-is", text: "What this feature is" },
    {
      type: "p",
      text: "The risk assessment (also called the **screening**) is the main feature of VITALNEX. You answer 15 short questions about yourself, your health history, your lifestyle and how you feel. VITALNEX then tells you, for each of three conditions, whether your answers are similar to people who have been told they have that condition.",
    },
    {
      type: "list",
      items: [
        "**Diabetes or prediabetes**",
        "**Heart disease** (coronary heart disease or a heart attack)",
        "**Stroke**",
      ],
    },
    {
      type: "p",
      text: "For each condition you get a level: **Low**, **Moderate** or **High**, or the message that VITALNEX is **not confident** for you. You also get the main factors behind the level and a clear next step, such as \"see a doctor soon\" or \"keep up regular check-ups\". The result screen is explained on its own page: [Understanding your results](/admin/docs/understanding-results).",
    },
    {
      type: "callout",
      kind: "warning",
      title: "This is not a diagnosis",
      text: "The screening never says you have a disease. It only says your answers are **similar to people who have been told they have** a condition. It never names or suggests a medicine. Only a doctor can diagnose you.",
    },
    {
      type: "p",
      text: "**Who uses it:** patients (people with a patient account). **Why it exists:** many people do not know they are at higher risk until late. A short screening can help a person decide to get a proper check-up sooner, and it can send worrying results to a clinician (doctor) for review.",
    },

    // ------------------------------------------------------------------------------------------
    { type: "h2", id: "where-to-find-it", text: "Where to find it" },
    {
      type: "table",
      head: ["Item", "Detail"],
      rows: [
        ["Address (URL)", "`/risk-assessment`"],
        ["Menu item", "**Risk Assessment** in the left side menu"],
        ["Other ways in", "The **Start Screening Assessment** button on the patient dashboard, and links on the Health profile and History pages"],
        ["Who can open it", "Only **patient** accounts. Clinicians and admins are sent away from this page (`apps/web/src/lib/roles.ts`), and the server only accepts an assessment from a patient (`require_role(\"patient\")`)."],
        ["Page title on screen", "\"Clinical Risk Screening\" with the line \"Screening for diabetes, heart disease and stroke. This is not a diagnosis.\""],
      ],
    },
    {
      type: "callout",
      kind: "info",
      title: "You must allow processing first",
      text: "The server only runs a screening if you have turned on the consent **\"Process my answers to give me a screening result\"** (purpose `assessment_processing`) in Settings. Without it you see an error with a link: **Open consent settings**.",
    },

    // ------------------------------------------------------------------------------------------
    { type: "h2", id: "screenshots", text: "What the screen looks like" },
    {
      type: "image",
      src: "/docs/risk-assessment/step1-about.png",
      alt: "Step 1 of the risk assessment form, 'About you', with age, sex, height and weight questions and the BMI box.",
      caption: "Step 1 of 6: About you. Height and weight are already filled here, so the BMI box is showing.",
      markers: [
        { n: 1, text: "The step bar. It shows all six steps. The current step is dark blue. Steps you have finished get a tick, and you can click them to go back. Steps you have not reached yet are greyed out and cannot be clicked." },
        { n: 2, text: "\"Step 1 of 6\" and the name of the step, so you always know where you are." },
        { n: 3, text: "The age box. You must be 18 or older. The note under the label says so." },
        { n: 4, text: "Sex assigned at birth: Female, Male or Prefer not to say." },
        { n: 5, text: "Your BMI (body mass index, a number made from height and weight). It appears as soon as both height and weight are filled in, with its range for South Asian adults." },
        { n: 6, text: "The Next button. It checks the answers on this step before letting you move on." },
      ],
    },

    // ------------------------------------------------------------------------------------------
    { type: "h2", id: "how-to-use-it", text: "How to use it, step by step" },
    {
      type: "steps",
      items: [
        {
          title: "Open the screening",
          text: "Sign in as a patient. Click **Risk Assessment** in the left menu, or **Start Screening Assessment** on your dashboard.",
        },
        {
          title: "Check any answers taken from your profile",
          text: "If you saved answers on your Health profile page, they are copied into the form. Each one has a small **From your profile** tag, and a blue note at the top of the step asks you to check them. Change any that are no longer true. Nothing else is ever filled in for you.",
        },
        {
          title: "Step 1 – About you",
          text: "Enter your age, choose your sex, and enter your height in centimetres and weight in kilograms. When both height and weight are filled, your BMI appears. Click **Next**.",
        },
        {
          title: "Step 2 – Health history",
          text: "Answer Yes or No to three questions: high blood pressure, high cholesterol and difficulty walking. Click **Next**.",
        },
        {
          title: "Step 3 – Lifestyle",
          text: "Answer Yes or No to five questions about smoking, exercise, fruit, vegetables and alcohol. Click **Next**.",
        },
        {
          title: "Step 4 – How you feel",
          text: "Pick how your health is in general (Excellent to Poor). Then enter how many days in the past 30 your mental health and your physical health were not good (0 to 30). Click **Next**.",
        },
        {
          title: "Step 5 – Symptoms check",
          text: "Tick any emergency symptom you have **right now**. If you tick one, a red box appears at once with **Call 108** and **Call 112** buttons. You can also type anything else you want to tell us in the free-text box (optional, up to 500 characters). Click **Next**.",
        },
        {
          title: "Step 6 – Review",
          text: "Read all your answers. Each section has an **Edit** button that takes you back to that step. When everything is right, click **See my results**.",
        },
        {
          title: "Read your result",
          text: "You see either the emergency screen, a request to correct your answers, or your full result. The result screen is explained in [Understanding your results](/admin/docs/understanding-results).",
        },
      ],
    },
    {
      type: "image",
      src: "/docs/risk-assessment/step3-lifestyle.png",
      alt: "Step 3 of the form, 'Lifestyle', with five Yes/No questions.",
      caption: "A middle step (Step 3 of 6: Lifestyle). Finished steps have a tick in the step bar.",
      markers: [
        { n: 1, text: "Finished steps show a tick. Click one to go back to it." },
        { n: 2, text: "A Yes/No question. Click the whole box, not only the small circle. You can also use the arrow keys." },
        { n: 3, text: "Some questions have a short help line. Here it says to answer Yes even if you have stopped smoking." },
        { n: 4, text: "Back takes you to the step before without losing your answers." },
      ],
    },

    { type: "h3", text: "Every question, step by step" },
    {
      type: "p",
      text: "All 15 answers on steps 1 to 4 are **required**. You cannot move to the next step, or send the form, until each one is answered. The wording below is the exact English text on screen (`apps/web/src/messages/en.json`). The allowed ranges come from `apps/web/src/lib/assessment.ts` and are checked again by the server (`apps/api/schemas/assessment.py`).",
    },
    { type: "h3", text: "Step 1 – About you" },
    {
      type: "table",
      head: ["Question", "Allowed answers", "Optional?"],
      rows: [
        ["Your age (years)", "Whole number from 18 to 120. Help text: \"You must be 18 or older to use the screening.\"", "Required"],
        ["Sex assigned at birth", "Female / Male / Prefer not to say. Help text: \"Used only for the risk calculation.\"", "Required"],
        ["Height (cm)", "120 to 220 cm (steps of 0.5)", "Required"],
        ["Weight (kg)", "30 to 250 kg (steps of 0.5). Height and weight together must give a BMI between 12 and 70.", "Required"],
      ],
    },
    { type: "h3", text: "Step 2 – Health history" },
    {
      type: "table",
      head: ["Question", "Allowed answers", "Optional?"],
      rows: [
        ["Has a doctor or nurse ever told you that you have high blood pressure?", "Yes / No", "Required"],
        ["Has a doctor or nurse ever told you that your cholesterol is high?", "Yes / No", "Required"],
        ["Do you have serious difficulty walking or climbing stairs?", "Yes / No", "Required"],
      ],
    },
    { type: "h3", text: "Step 3 – Lifestyle" },
    {
      type: "table",
      head: ["Question", "Allowed answers", "Optional?"],
      rows: [
        ["Have you smoked at least 100 cigarettes (5 packs) in your life?", "Yes / No. Help text: \"Answer yes even if you have stopped smoking.\"", "Required"],
        ["In the past 30 days, did you do any physical activity or exercise other than your regular job?", "Yes / No", "Required"],
        ["Do you eat fruit at least once a day?", "Yes / No", "Required"],
        ["Do you eat vegetables at least once a day?", "Yes / No", "Required"],
        ["Do you drink more than 14 drinks a week (men) / 7 a week (women)?", "Yes / No", "Required"],
      ],
    },
    { type: "h3", text: "Step 4 – How you feel" },
    {
      type: "table",
      head: ["Question", "Allowed answers", "Optional?"],
      rows: [
        ["In general, how is your health?", "Excellent / Very good / Good / Fair / Poor", "Required"],
        ["In the past 30 days, how many days was your mental health not good?", "Whole number from 0 to 30", "Required"],
        ["In the past 30 days, how many days was your physical health not good?", "Whole number from 0 to 30", "Required"],
      ],
    },
    { type: "h3", text: "Step 5 – Symptoms check" },
    {
      type: "table",
      head: ["Question", "Allowed answers", "Optional?"],
      rows: [
        ["Do you have any of these right now? Tick all that apply.", "Four tick-boxes: **Chest pain or pressure now**; **Sudden face drooping, arm weakness or difficulty speaking**; **Severe breathlessness**; **Fainting**. All start unticked.", "Optional (leave all unticked if none apply)"],
        ["Anything else you want to tell us?", "Free text, up to 500 characters. Help text: \"Only checked for emergency warning signs. It is not saved.\"", "Optional"],
      ],
    },
    {
      type: "callout",
      kind: "info",
      title: "Why these questions?",
      text: "The questions match the 14 inputs of the screening models, which were trained on the US CDC BRFSS health survey (docs/DECISIONS.md D-3). Height and weight are turned into one input, BMI, so 15 answers make 14 model inputs. Income, education and access to healthcare are **not** asked (D-6), because the product does not need them.",
    },

    { type: "h3", text: "Step 6 – Review" },
    {
      type: "p",
      text: "The review step lists every answer under its step name, with an **Edit** button for each section. Your BMI is shown again under \"About you\". The symptoms section lists the boxes you ticked, or says \"None ticked\". The free text is not shown here. Below the list is a reminder: your answers are processed only if you allowed it, and saved to your history only if you turned on saving.",
    },
    {
      type: "image",
      src: "/docs/risk-assessment/review.png",
      alt: "The Review step with all answers listed, Edit buttons and the See my results button.",
      caption: "Step 6 of 6: Review. Check everything before you send it.",
      markers: [
        { n: 1, text: "Each section of your answers, with its own Edit button to jump back." },
        { n: 2, text: "Your BMI, worked out from your height and weight." },
        { n: 3, text: "The consent reminder: what happens to your answers depends on your consent settings." },
        { n: 4, text: "See my results sends the form to the server. The button shows a loading state while it waits." },
      ],
    },

    { type: "h3", text: "The free-text box" },
    {
      type: "p",
      text: "The box \"Anything else you want to tell us?\" is **only** used to look for emergency warning signs. It is not read by the screening models and it is **never saved** (`stored_inputs` in `apps/api/services/prediction_service.py` leaves it out). It is checked on the server when you click **See my results**, not while you type.",
    },
    {
      type: "image",
      src: "/docs/risk-assessment/free-text.png",
      alt: "Step 5, Symptoms check, with the four symptom tick-boxes and the free-text box containing text.",
      caption: "Step 5 of 6: Symptoms check, with the optional free-text box filled in.",
      markers: [
        { n: 1, text: "The four emergency symptom tick-boxes. Tick only what is happening right now." },
        { n: 2, text: "The free-text box (optional). Up to 500 characters." },
        { n: 3, text: "The help line: the text is only checked for emergency warning signs and is not saved." },
      ],
    },

    { type: "h3", text: "The emergency red-flag check" },
    {
      type: "p",
      text: "Emergency signs **override everything else**. There are two ways they can be found:",
    },
    {
      type: "list",
      items: [
        "**A ticked symptom box.** As soon as you tick any of the four boxes, a red box appears on the same step: \"These can be signs of an emergency. Call 108 / 112 now. Do not wait for a screening result.\" It has **Call 108** and **Call 112** buttons (on a phone they start a call). When you send the form, the server treats it as an emergency.",
        "**Warning words in the free text.** The server checks the text against a fixed list of warning phrases in English, Hindi, Marathi and romanised Hindi/Marathi (`ml/nlp/data/emergency_phrases.json`), for example \"chest pain\", \"pressure in my chest\" or \"having a stroke\". It also catches a chest word and a pain word close together, such as \"pain and pressure on my chest\".",
      ],
    },
    {
      type: "callout",
      kind: "danger",
      title: "Bare red-flag words always count (D-26)",
      text: "In the free-text box, even a bare warning word on its own, such as **stroke**, **heart attack**, **chest pain**, **paralysis** or **लकवा**, is treated as a full emergency. This was decided on purpose: a few extra false alarms are better than one missed emergency (docs/DECISIONS.md D-26).",
    },
    {
      type: "p",
      text: "When an emergency is found, the whole screen turns dark red. It says **\"Call for emergency help now\"** and \"The symptoms you reported can be signs of a heart attack or stroke. Call an ambulance now. Do not drive yourself.\" There are two large buttons, **Call 108** and **Call 112**. **No screening levels are shown**, and the screen says why. A small link, **Back to my answers**, returns you to the form.",
    },
    {
      type: "image",
      src: "/docs/risk-assessment/emergency.png",
      alt: "The full-screen red emergency screen with Call 108 and Call 112 buttons.",
      caption: "The emergency screen. It covers the whole page and hides all screening levels.",
      markers: [
        { n: 1, text: "The emergency heading: call for help now." },
        { n: 2, text: "Call 108 (ambulance). On a phone this starts the call." },
        { n: 3, text: "Call 112 (national emergency number)." },
        { n: 4, text: "The note that no screening levels are shown, because these symptoms need urgent care." },
        { n: 5, text: "Back to my answers, if you made a mistake." },
      ],
    },
    {
      type: "callout",
      kind: "warning",
      title: "Even when the server is down",
      text: "If you ticked any symptom box and the server cannot be reached or returns an error, the page still shows the emergency screen (`page.tsx`, the error branch of `submit`). Warning words typed in the free text are only checked on the server, so they cannot trigger this if the server is down; the error message in that case still says \"If you have symptoms such as chest pain, call 108 / 112.\"",
    },

    { type: "h3", text: "Missing answers are never filled in" },
    {
      type: "list",
      items: [
        "Every answer starts **empty** (`EMPTY_DRAFT` in `apps/web/src/lib/assessment.ts`). The app never puts in a \"normal\" value for you.",
        "The only answers copied in are ones **you** saved on your Health profile, and each one is marked **From your profile**. If you change it, the tag goes away.",
        "You cannot skip a question. If you click **Next** with an empty answer, you see \"Please answer this question.\"",
        "The server also refuses any request with a missing answer: every medical input is required and has no default (`apps/api/schemas/assessment.py`). Unknown extra fields are refused too.",
        "The model code refuses missing values as well. `ml/predictor.py` stops with an error if any of the 14 inputs is missing, instead of guessing one.",
        "If you choose **Prefer not to say** for sex, nothing is guessed. The models are run twice, once as female and once as male, and the **higher** level is kept. A note on the result tells you this (D-9).",
      ],
    },

    { type: "h3", text: "Validation messages you may see" },
    {
      type: "table",
      head: ["Message on screen", "When it appears"],
      rows: [
        ["Please answer this question.", "You clicked Next (or See my results) with an empty answer."],
        ["Enter a number from {min} to {max}.", "A number is outside its range, e.g. height 100 gives \"Enter a number from 120 to 220.\""],
        ["This height and weight give a BMI of {bmi}, which is outside 12–70. Please check them.", "Height and weight are each allowed, but together give an impossible BMI."],
        ["The screening is only for adults (18 or older)", "You entered an age from 1 to 17. A full block screen appears with **I entered my age wrongly** (back to the form) and **Find a doctor** (opens Care Connect). In an emergency it says to call 108 / 112."],
        ["Please check your answers – Some answers do not look possible, so no result was made.", "The server's data-quality check failed (for example a BMI outside 12–70). The form normally catches this first. Button: **Go back to my answers**."],
        ["To run a screening, please turn on \"Process my answers to give me a screening result\" in your consent settings.", "You have not given the `assessment_processing` consent. Link: **Open consent settings**."],
        ["Please sign in again to use the screening.", "Your sign-in has expired."],
        ["Some answers were not accepted. Please check them and try again.", "The server refused the answers (with the server's detail shown below)."],
        ["The screening service is not available right now. Nothing was saved and no result was made. If you have symptoms such as chest pain, call 108 / 112.", "The server could not be reached."],
      ],
    },

    { type: "h3", text: "How long it takes" },
    {
      type: "p",
      text: "There are 15 short answers over four question steps, one optional symptoms step and one review step. There is no time limit and nothing is sent until you click **See my results**. Your answers stay in the page while you move between steps, but they are **not** kept if you close or reload the page.",
    },

    // ------------------------------------------------------------------------------------------
    { type: "h2", id: "what-happens-behind-the-scenes", text: "What happens behind the scenes" },
    {
      type: "p",
      text: "When you click **See my results**, the page first checks every step again and jumps to the first step with a problem. Then it sends your answers to the server (the **API**, the program that does the work) at `POST /api/v1/assessment`. All the work below runs on the VITALNEX server itself. No health data is sent to any outside service.",
    },
    {
      type: "steps",
      items: [
        {
          title: "1. Consent check",
          text: "The server checks that you allowed `assessment_processing`. If not, it stops and nothing is run.",
        },
        {
          title: "2. Emergency check (always first)",
          text: "If any symptom box is ticked, or the free text contains a warning word or phrase, the result is **Emergency**. The models are **not run at all** and no scores are made (`screening.assess`).",
        },
        {
          title: "3. Data-quality check",
          text: "If height and weight give a BMI outside 12–70, the result is **Please correct your answers**. No models are run and nothing is saved. Some odd-but-possible answers (for example \"Excellent\" health with 20+ unwell days, or \"Excellent\" health with difficulty walking) are kept as warnings for the clinician.",
        },
        {
          title: "4. The three models",
          text: "Your answers are turned into the 14 model inputs. The diabetes, heart and stroke **models** (computer programs that learned patterns from survey data) each give a score. The score is **calibrated** (adjusted so it matches how often the condition really appeared in the data) and turned into a level: Low, Moderate or High.",
        },
        {
          title: "5. Is the model sure? (abstention)",
          text: "Two checks can make a model **abstain** (refuse to give a level). The **conformal** check says the model cannot tell the two outcomes apart for you. The **out-of-distribution** check says your answers look unlike the training data. If a model abstains, you see no level for that condition, only \"not confident, please see a doctor\" (D-10).",
        },
        {
          title: "6. Next-step rules",
          text: "Fixed rules (not the model) pick one next step. The first rule that matches wins (docs/SPEC.md §1.4).",
        },
        {
          title: "7. Factors and guidance",
          text: "For each condition the top 3 factors are found with **SHAP** (a method that shows how much each answer pushed the score up or down). General lifestyle tips are picked from a fixed, sourced list (WHO / ICMR material) based on your answers.",
        },
        {
          title: "8. Saving and clinician review",
          text: "If you allowed **saving history**, the result is saved with the model versions used. If the next step needs review and you allowed **sharing with a clinician**, it is also added to the clinician review list. Without saving, only an audit entry with no health data is written.",
        },
      ],
    },
    {
      type: "table",
      head: ["Order", "Condition", "Next step shown", "Sent for clinician review?"],
      rows: [
        ["1", "Emergency symptom ticked, or warning words in the free text", "Emergency: call 108 / 112 now (no levels shown)", "Yes (reason: emergency)"],
        ["2", "Impossible answers (BMI outside 12–70)", "Please correct your answers", "No (nothing is saved)"],
        ["3", "Any condition abstained (model not confident)", "VITALNEX is not confident for you. Please see a doctor.", "Yes (reason: abstained)"],
        ["4", "Any condition High", "See a doctor soon (within 2 weeks)", "Yes (reason: high level)"],
        ["5", "Any condition Moderate", "Discuss at your next check-up", "No"],
        ["6", "All Low", "Keep up regular check-ups", "No"],
      ],
    },
    {
      type: "callout",
      kind: "info",
      title: "Review needs two consents",
      text: "A result is only sent to a clinician if it is saved (`store_history`) **and** you allowed `share_with_clinician`. If review was needed but you did not allow sharing, the result includes a note saying no clinician will review it, so you should see a doctor yourself.",
    },
    {
      type: "p",
      text: "**What patients see and what clinicians see.** Patients see levels and plain text only, never the raw probability numbers. For a condition where the model abstained, the patient sees no level and no factors. Clinicians reviewing a shared result can see the probabilities, the conformal sets and the SHAP values (D-10, `shape_results` in `apps/api/services/screening.py`).",
    },
    {
      type: "table",
      head: ["Model", "Model type", "Share of test cases where it abstained"],
      rows: [
        ["Diabetes (diabetes-v1.0.0)", "LightGBM", "36.8%"],
        ["Heart (heart-v1.0.0)", "LightGBM", "38.5%"],
        ["Stroke (stroke-v1.0.0)", "Logistic regression", "44.4%"],
      ],
    },
    {
      type: "p",
      text: "Source: `ml/artifacts/<disease>/model_meta.json`, field `conformal_test.abstention_rate_total`. These rates are high on purpose: the team accepted them so that no level is shown when the model is unsure (D-22). More about the models: [Models and data](/admin/docs/models-and-data).",
    },

    // ------------------------------------------------------------------------------------------
    { type: "h2", id: "safety-and-limits", text: "Safety and limits" },
    {
      type: "callout",
      kind: "danger",
      title: "Emergencies come first",
      text: "If you have chest pain, signs of stroke (face drooping, arm weakness, speech trouble), severe breathlessness or fainting **now**, call **108** or **112**. Do not wait for a screening result. The app shows this before anything else.",
    },
    {
      type: "callout",
      kind: "warning",
      title: "Not a diagnosis, no medicines",
      text: "The screening only compares your answers with survey data. It does not diagnose, does not name or dose any medicine, and does not replace a doctor.",
    },
    {
      type: "callout",
      kind: "warning",
      title: "It can miss people",
      text: "The Moderate cut-off was set to catch about 8 in 10 people who have the condition (recall target 0.80, `thresholds.recall_target` in model_meta.json). On the test data the models reached a recall (share of real cases caught) of 0.85 for diabetes, 0.84 for heart and 0.79 for stroke (`test_metrics.recall_at_t_mod`). So roughly 1.5 to 2 in 10 people with the condition can still get Low. A Low level does not mean you are safe (D-23).",
    },
    {
      type: "callout",
      kind: "warning",
      title: "Less reliable under 40",
      text: "The models catch far fewer cases in people aged 18–39 than in older people. If you are under 40, the result carries a note saying it is less reliable for your age group (D-24).",
    },
    {
      type: "callout",
      kind: "info",
      title: "Other limits",
      text: "Adults only (18+). The models learned from a US survey (CDC BRFSS), not from Indian patients. The answers are self-reported, with no lab tests. The free-text box is only checked for warning signs; nothing else you write there is used. Hindi and Marathi medical wording is still waiting for human review (D-15).",
    },
    {
      type: "callout",
      kind: "tip",
      title: "What it does not do",
      text: "It does not take blood test values or ECG readings. It does not retrain itself on your answers. It does not make any final decision: high-risk and unsure results go to a clinician.",
    },

    // ------------------------------------------------------------------------------------------
    { type: "h2", id: "niti-principles", text: "Which NITI Aayog principles this follows" },
    {
      type: "niti",
      items: [
        {
          id: "safety_reliability",
          how: [
            "The emergency check runs before any model. A ticked symptom or a red-flag word in the free text shows 108 / 112 and stops all scoring (`screening.assess`, D-26).",
            "A data-quality check stops impossible answers (BMI outside 12–70) before the models run.",
            "Each model abstains when it is unsure (conformal check) or when the answers look unlike its training data (out-of-distribution check); no level is shown then.",
            "Abstained, High and emergency results go to clinician review when the patient has allowed sharing.",
          ],
        },
        {
          id: "transparency",
          how: [
            "Each condition shows its top 3 factors, worked out with SHAP, in plain words.",
            "Every saved result records the model version and data hash used (`model_versions`), so it can be traced to its model card.",
            "The next step comes from a fixed, written rule table (docs/SPEC.md §1.4), not from the model.",
          ],
        },
        {
          id: "positive_human_values",
          how: [
            "The wording never says \"you have\" a disease and never names a medicine.",
            "Patients see levels and plain text, not raw probabilities that could scare or mislead (D-10).",
            "The model never decides alone: high-risk and unsure results are sent to a human clinician.",
          ],
        },
        {
          id: "privacy_security",
          how: [
            "The screening only runs with the `assessment_processing` consent; saving needs `store_history`; review needs `share_with_clinician`.",
            "Free text is checked for warning signs and then thrown away; it is never stored.",
            "All models and the red-flag check run on the VITALNEX server; no health data goes to an outside service.",
            "Income, education and healthcare access are not asked at all (D-6).",
          ],
        },
        {
          id: "equality",
          how: [
            "Fairness gaps by sex and age group are measured and stored in model_meta.json (`fairness.groups`) and shown on the Trust Passport.",
            "The known age gap was not hidden: users under 40 get a note that results are less reliable for them (D-24).",
          ],
        },
        {
          id: "inclusivity_non_discrimination",
          how: [
            "The whole form is available in English, Hindi and Marathi, and the red-flag list covers all three plus romanised Hindi/Marathi.",
            "\"Prefer not to say\" is allowed for sex; the app then uses the higher of the two levels rather than guessing (D-9).",
            "Answer boxes are large (at least 44 px), work with the keyboard, and focus moves to each new step heading for screen-reader users.",
          ],
        },
      ],
    },

    // ------------------------------------------------------------------------------------------
    { type: "h2", id: "common-questions", text: "Common questions" },
    {
      type: "faq",
      items: [
        {
          q: "Can I skip a question I am not sure about?",
          a: "No. Every one of the 15 answers is required. The app never fills in a value for you, so the models only run on what you really answered. Give your best answer; you can change it later and run the screening again.",
        },
        {
          q: "Why did the emergency screen appear when I only typed a word?",
          a: "In the free-text box even a bare warning word such as \"stroke\" or \"chest pain\" counts as an emergency (D-26). It is safer to show 108 / 112 too often than to miss one real emergency. If it was a mistake, click **Back to my answers** and remove the word.",
        },
        {
          q: "Is what I type in the free-text box saved?",
          a: "No. It is only checked for emergency warning signs and is never stored in the database.",
        },
        {
          q: "Why do I see \"From your profile\" next to some answers?",
          a: "Those answers were copied from your saved Health profile. Please check them. If you change one, the tag disappears.",
        },
        {
          q: "I am 17. Why can I not use it?",
          a: "The models were built from data about adults, so they cannot give a result for people under 18. The app shows a block screen and suggests talking to a doctor or a trusted adult. In an emergency, call 108 / 112.",
        },
        {
          q: "What does \"not confident\" mean?",
          a: "The model for that condition could not give a reliable level for your answers, so it shows no level. Please see a doctor. If you allowed sharing, a clinician will also review it.",
        },
        {
          q: "Will a doctor see my result?",
          a: "Only if the result needs review (emergency, not confident, or High) **and** you allowed both saving history and sharing with a clinician. Otherwise no clinician sees it.",
        },
        {
          q: "Why am I asked my sex, and what if I prefer not to say?",
          a: "The models use it in the calculation. If you choose Prefer not to say, the models run with both values and the higher level is shown, with a note explaining why.",
        },
        {
          q: "I got an error that says to turn on consent. What do I do?",
          a: "Click **Open consent settings** and turn on \"Process my answers to give me a screening result\". Then run the screening again.",
        },
      ],
    },
  ],
};

export default page;
