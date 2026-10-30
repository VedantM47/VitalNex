import type { DocPage } from "../types";

// Sources: apps/web/src/app/history/page.tsx, components/assessment/{BandTrendChart,AssessmentRow}.tsx,
// apps/web/src/app/reports/page.tsx, apps/api/routers/v1/{assessment,reports}.py,
// apps/api/services/report_service.py, apps/api/content/report.en.json, ml/artifacts/*/model_meta.json.

const page: DocPage = {
  slug: "history-and-reports",
  title: "History and PDF reports",
  summary:
    "See every screening you saved, how your levels changed over time, and download a printable PDF report of any saved screening in English, Hindi or Marathi.",
  audience: "Patients",
  blocks: [
    { type: "h2", id: "what-it-is", text: "What this feature is" },
    {
      type: "p",
      text: "This feature has two pages. **Health History** (`/history`) shows all the screenings you have saved, with a chart of your levels over time. **Reports** (`/reports`) lets you download a **PDF** (a file you can print or send) of any saved screening.",
    },
    {
      type: "p",
      text: "A screening gives one level for each of three conditions: **diabetes or prediabetes**, **heart disease or heart attack**, and **stroke**. The level is **Low**, **Moderate** or **High**. It shows how similar your answers are to people who have been told they have that condition. It is not a diagnosis. To learn what the levels mean, read [Understanding your results](/admin/docs/understanding-results).",
    },
    { type: "p", text: "Why it exists:" },
    {
      type: "list",
      items: [
        "So you can see whether your levels went up, went down or stayed the same across visits.",
        "So you can see if a clinician (a doctor using VITALNEX) has looked at a result, and read their note.",
        "So you can take a clear, printed summary to your own doctor, in the language you read best.",
      ],
    },
    {
      type: "callout",
      kind: "info",
      title: "Only saved screenings appear here",
      text: "A screening is saved only if you gave the **store history** consent (permission to keep your screening history). If that consent is off, the screening still runs, but nothing is saved, so it never shows up in History or Reports.",
    },

    { type: "h2", id: "where-to-find-it", text: "Where to find it" },
    {
      type: "table",
      head: ["Page", "Menu item (left side)", "Address", "Who can open it"],
      rows: [
        ["Health History", "Health History", "`/history`", "Signed-in patients only"],
        ["Reports", "Reports", "`/reports`", "Signed-in patients only"],
      ],
    },
    {
      type: "p",
      text: "Both pages show only **your own** screenings. The server checks that you are signed in as a patient. Clinicians do not use these pages; they see shared patients' results in the [Clinician workspace](/admin/docs/clinician-workspace). The Reports page also has a link **Open my history** that takes you to Health History.",
    },

    { type: "h2", id: "screenshots", text: "What the pages look like" },
    { type: "h3", text: "Health History" },
    {
      type: "image",
      src: "/docs/history-and-reports/history-overview.png",
      alt: "Health History page for a demo patient, with the levels-over-time chart and the list of all screenings",
      caption: "Health History for the demo account patient1 (synthetic data).",
      markers: [
        { n: 1, text: "**Health History** in the left menu opens this page." },
        { n: 2, text: "**Try again** loads your history again from the server (useful if it failed to load)." },
        { n: 3, text: "**Levels over time** chart: one line per condition, oldest screening on the left." },
        { n: 4, text: "**All screenings**: every saved screening, newest first." },
      ],
    },
    {
      type: "image",
      src: "/docs/history-and-reports/history-chart.png",
      alt: "Close-up of the levels-over-time chart showing the legend, the level axis and the date axis",
      caption: "The chart up close.",
      markers: [
        { n: 1, text: "**Legend**: which line is which condition. Each line also has its own dot shape and dash style, so you do not need colour to tell them apart." },
        { n: 2, text: "**Level axis**: Low, Moderate, High." },
        { n: 3, text: "**Date axis**: the date of each saved screening." },
      ],
    },
    {
      type: "image",
      src: "/docs/history-and-reports/history-row.png",
      alt: "One screening row in the history list with its date, Demo badge, review status, next step and a level for each condition",
      caption: "One row of the list. This one is waiting for a clinician to review it.",
      markers: [
        { n: 1, text: "**Date** of the screening and, for seeded demo records, a **Demo** badge." },
        { n: 2, text: "**Review status**: \"Waiting for clinician review\" or \"Reviewed by a clinician\"." },
        { n: 3, text: "**Next step**: the advice that screening gave, for example \"See a doctor soon (within 2 weeks)\"." },
        { n: 4, text: "**Level for each condition** (Low, Moderate, High, or \"Not confident — see a doctor\")." },
      ],
    },
    { type: "h3", text: "Reports" },
    {
      type: "image",
      src: "/docs/history-and-reports/reports-overview.png",
      alt: "Reports page with the Share my record (QR) card at the top and the Printable report (PDF) card below",
      caption: "The Reports page has two cards.",
      markers: [
        { n: 1, text: "**Reports** in the left menu opens this page." },
        { n: 2, text: "**Share my record (QR)**: make a short-lived link and QR code for a doctor. This is explained on [Trust Passport, consent and sharing](/admin/docs/trust-passport)." },
        { n: 3, text: "**Printable report (PDF)**: download a PDF of a saved screening." },
      ],
    },
    {
      type: "image",
      src: "/docs/history-and-reports/reports-pdf.png",
      alt: "Printable report card with the report language picker, the number of saved screenings and a Download PDF button on each row",
      caption: "The Printable report (PDF) card.",
      markers: [
        { n: 1, text: "**Report language**: English, हिंदी (Hindi) or मराठी (Marathi)." },
        { n: 2, text: "How many screenings you have saved." },
        { n: 3, text: "Each row shows the next step and the date. **Download PDF** makes the PDF for that screening." },
        { n: 4, text: "**Open my history** goes to the Health History page." },
      ],
    },

    { type: "h2", id: "how-to-use-it", text: "How to use it" },
    { type: "h3", text: "See your history" },
    {
      type: "steps",
      items: [
        { title: "Sign in as a patient", text: "Use your patient account. For the demo, use `patient1@vitalnex.demo` (a dummy account)." },
        { title: "Open Health History", text: "Click **Health History** in the left menu, or go to `/history`. While it loads you see \"Loading…\"." },
        {
          title: "Read the chart",
          text: "The **Levels over time** chart has one line per condition. Each point is one saved screening. Hover over (or tap) a point to see the level name for each condition on that date.",
        },
        {
          title: "Read the list",
          text: "Scroll to **All screenings**. The newest screening is at the top. Each row shows the date, any badges, the next step, and the level for each condition.",
        },
        {
          title: "Check for a clinician review",
          text: "If a clinician reviewed a result, the row shows **Reviewed by a clinician**. If they set their own level, you see **Clinician's level** next to the VITALNEX level. If they wrote a note, it shows in a box called **Clinician note**.",
        },
        {
          title: "If something looks wrong, reload",
          text: "Click **Try again** at the top right to load the list again from the server.",
        },
      ],
    },
    { type: "h3", text: "Download a PDF report" },
    {
      type: "steps",
      items: [
        { title: "Open Reports", text: "Click **Reports** in the left menu, or go to `/reports`." },
        { title: "Scroll to the PDF card", text: "Below the QR sharing card is **Printable report (PDF)**. It says how many screenings you have saved, for example \"4 saved screenings\"." },
        {
          title: "Pick the report language",
          text: "Use **Report language** to choose English, हिंदी or मराठी. It starts on the language the app is using now. Changing it here changes only the PDF, not the app.",
        },
        {
          title: "Find the screening",
          text: "Each row shows the next step of that screening (for example \"Keep up regular check-ups\") and its date and time. The newest is at the top. Up to 20 screenings are listed.",
        },
        {
          title: "Click Download PDF",
          text: "The button shows a spinner while the server builds the file. Then your browser saves it. The file name looks like `vitalnex-report-20261029-en.pdf` (the screening date, then the language).",
        },
        {
          title: "Open, print or send it yourself",
          text: "Open the file with any PDF reader. You can print it, or attach it to a message to your own doctor. VITALNEX does not send the PDF anywhere for you.",
        },
      ],
    },
    {
      type: "callout",
      kind: "tip",
      title: "If you see \"Could not create the PDF.\"",
      text: "The download failed. Check that the server is running and try again. On a server that cannot shape Hindi or Marathi letters (see below), Hindi and Marathi PDFs always fail with this message; English still works.",
    },

    { type: "h2", id: "what-each-part-means", text: "What each part of the history means" },
    {
      type: "table",
      head: ["You see", "What it means"],
      rows: [
        ["Date (for example \"22 Sept 2026\")", "When the screening was done."],
        ["**Demo** badge", "The record was added by the demo seeding script (made with the real models, for dummy accounts). It is not a live screening."],
        ["**Waiting for clinician review**", "The result was sent to a clinician's review list and nobody has reviewed it yet. This happens for high-risk or uncertain results, and only if you allowed sharing with clinicians."],
        ["**Reviewed by a clinician**", "A clinician looked at it and either agreed or changed the level."],
        ["**Next step: …**", "The care advice from that screening, for example \"See a doctor soon (within 2 weeks)\" or \"Keep up regular check-ups\"."],
        ["Low / Moderate / High", "How similar your answers were to people who have been told they have that condition."],
        ["**Not confident — see a doctor**", "The model was not sure enough for this condition, so no level is shown. On the chart this leaves a gap in that line."],
        ["**Clinician's level**", "The level the reviewing clinician chose. It is shown next to the VITALNEX level, not instead of it."],
        ["**Clinician note**", "Text the clinician wrote for you."],
        ["**Emergency symptoms reported — no levels shown**", "You reported emergency symptoms that time, so no levels were made. These screenings are left out of the chart."],
      ],
    },
    {
      type: "p",
      text: "The chart uses three line styles: diabetes is a solid blue line with round dots, heart is a dashed orange line with square dots, and stroke is a dotted green line with diamond dots. The lines move in steps, because a level is one of three values, not a smooth number.",
    },
    {
      type: "callout",
      kind: "info",
      title: "No filters and no detail page",
      text: "The history page has no filters, no search and no \"open\" button. Rows cannot be clicked. Each row already shows everything that is kept for the patient view. To see the full results screen again (factors, what-if), run a new screening.",
    },
    { type: "h3", text: "Messages you may see instead of the list" },
    {
      type: "table",
      head: ["Message", "Why"],
      rows: [
        ["**No screenings yet**", "You have not saved any screening. Click **Start Screening Assessment** to do one."],
        ["**History is hidden**", "You withdrew the store-history consent. Your history is hidden at once. Turn the consent on again under My data → Consent."],
        ["**History is not available**", "The server could not be reached or gave an error. Click **Try again**."],
        ["**No levels to show over time yet.**", "(Inside the chart.) All your saved screenings were emergencies or had no levels, so there is nothing to draw."],
      ],
    },

    { type: "h2", id: "whats-in-the-pdf", text: "What is inside the PDF" },
    {
      type: "p",
      text: "The PDF is an A4 document, usually one or two pages. Every page has \"VITALNEX\" at the bottom left and the page number at the bottom right. It has these parts, in this order:",
    },
    {
      type: "table",
      head: ["Part", "What it contains"],
      rows: [
        ["Title", "\"VITALNEX screening report\" and the line \"screening summary, not a diagnosis\"."],
        ["Details table", "Your **name** (or \"Not given\"), **Date of screening**, **Report created** (both in Indian time, IST), and a **Reference** (the screening's ID number). Demo records also say \"Demo record (dummy account, not a real patient)\"."],
        ["Next step", "Shown first, because it is what you should do. For an emergency record it says to call 108 / 112 and that no levels are shown."],
        ["Results by condition", "For each condition: the level (coloured green, amber or red), a sentence like \"Your answers are less similar to people who have been told they have …\", and the **Main factors** as plain sentences. If the model was not confident, it says \"Not confident — see a doctor\" and shows no level and no factors."],
        ["Notes", "Only when they apply: results are less reliable for people under 40; or, if you chose not to say your sex, that the higher level was used."],
        ["Clinician review", "\"Reviewed by a clinician\" (with the clinician's note and level, if any), \"Waiting for clinician review\", or \"This result was not sent for clinician review.\""],
        ["Limitations", "The screening uses only your answers (no blood test, ECG or examination); the models learned from a US survey (BRFSS) and may work less well in India; and \"Low does not mean no risk\" with a miss rate for each condition (see below)."],
        ["Model versions", "Which model made each result, for example `diabetes-v1.0.0 (lightgbm, data 2f3939868b6b)`. The last part is the start of the training-data fingerprint."],
        ["This is not a diagnosis", "The notice: VITALNEX does not diagnose, does not recommend medicines, does not replace a health professional, and says to call 108 / 112 for chest pain, signs of stroke or severe breathlessness."],
        ["Trust Passport link", "A web address of the AI Trust Passport page (`/ai-trust`), which explains how VITALNEX works and how accurate it is. It is printed as text; there is no QR code in the PDF."],
      ],
    },
    { type: "h3", text: "The \"Low does not mean no risk\" numbers" },
    {
      type: "p",
      text: "These numbers come from the test results saved in `ml/artifacts/<disease>/model_meta.json` (the value `recall_at_t_mod`, which is the share of people with the condition that the model put above Low). The PDF shows 100 minus that share, rounded. With the current models (version v1.0.0):",
    },
    {
      type: "table",
      head: ["Condition", "recall_at_t_mod in model_meta.json", "Printed in the PDF"],
      rows: [
        ["Diabetes or prediabetes", "0.855", "about 15 in every 100 shown as Low"],
        ["Heart disease or heart attack", "0.838", "about 16 in every 100 shown as Low"],
        ["Stroke", "0.792", "about 21 in every 100 shown as Low"],
      ],
    },
    {
      type: "p",
      text: "The line is printed only if the saved screening was made by the same model version that is loaded on the server now. If the model was changed later, the old number would not match, so the line is left out.",
    },
    { type: "h3", text: "Hindi and Marathi PDFs" },
    {
      type: "p",
      text: "All three languages use the font **Noto Sans Devanagari** (free licence, SIL OFL 1.1), which also covers English letters. Hindi and Marathi letters join together (for example in conjuncts like \"स्ट्रो\"). To draw them correctly, the server uses a text **shaping** tool (`uharfbuzz`, which works out how the letters join). If that tool is not installed, the server **refuses** to make a Hindi or Marathi PDF, rather than print broken words. English PDFs do not need it.",
    },
    {
      type: "p",
      text: "The PDF wording comes from `apps/api/content/report.en.json`, `report.hi.json` and `report.mr.json`. The factor sentences use the same templates as the results page, in the chosen language.",
    },
    { type: "h3", text: "What is never in the PDF" },
    {
      type: "list",
      items: [
        "No percentages or probabilities (raw model scores). Levels and text only.",
        "No diagnosis. The words used are \"similar to people who have been told they have…\".",
        "No medicine names or doses.",
        "None of your raw answers (age, weight, smoking and so on). They are only used on the server to decide whether the \"under 40\" or \"sex not stated\" note applies.",
        "No email address, phone number or other account details. Only your name.",
        "No clinician note or clinician level unless a clinician actually reviewed the result.",
        "No levels at all for an emergency record or a \"please correct your answers\" record.",
      ],
    },

    { type: "h2", id: "what-happens-behind-the-scenes", text: "What happens behind the scenes" },
    { type: "h3", text: "Health History" },
    {
      type: "list",
      ordered: true,
      items: [
        "The page asks the **API** (the VITALNEX server program) for `GET /api/v1/assessment/history`.",
        "The server checks that you are a signed-in patient, then checks your consents. If store history is withdrawn, it sends back an empty list marked as hidden.",
        "Otherwise it reads your saved screenings from the database. The database only lets you read your own rows (row-level security).",
        "Before sending, it removes the probabilities from each result, so the browser only gets levels, factors and text.",
        "It adds any clinician review (status, the clinician's levels, the note) to each screening.",
        "The browser draws the chart (with the Recharts library) and the list. The chart sorts screenings oldest to newest and skips emergency records.",
      ],
    },
    { type: "h3", text: "Reports and the PDF" },
    {
      type: "list",
      ordered: true,
      items: [
        "The Reports page asks for `GET /api/v1/reports`, a short list of your saved screenings (again empty if store history is withdrawn).",
        "When you click **Download PDF**, the browser calls `GET /api/v1/reports/<id>/pdf?lang=en|hi|mr`.",
        "The server loads that one screening. If it is not yours, or store history is withdrawn, it answers \"not found\".",
        "If no language is sent, it uses the language saved in your profile, or English.",
        "It builds the PDF on the server with **reportlab** (a Python PDF library), using only the saved screening, the clinician review and `model_meta.json`. Nothing is sent to any outside service.",
        "It writes an audit entry `REPORT_DOWNLOADED` with the screening ID and the language.",
        "It sends the file back with a \"do not store\" cache rule, and your browser saves it.",
      ],
    },
    {
      type: "code",
      lang: "text",
      code: "GET /api/v1/assessment/history          -> your screenings (levels only) + clinician reviews\nGET /api/v1/reports                     -> list: assessment_id, created_at, next_step, ...\nGET /api/v1/reports/{id}/pdf?lang=hi    -> the PDF file (or 404 / 503)",
    },
    { type: "p", text: "More detail on these calls is in the [API reference](/admin/docs/api-reference)." },

    { type: "h2", id: "safety-and-limits", text: "Safety and limits" },
    {
      type: "callout",
      kind: "danger",
      title: "Emergencies",
      text: "History and reports are about past screenings. If you have chest pain, signs of stroke or severe breathlessness now, do not look at reports. Call **108 / 112** at once.",
    },
    {
      type: "callout",
      kind: "warning",
      title: "Not a diagnosis",
      text: "A level in your history or PDF does not mean you have, or do not have, a disease. It only shows how similar your answers are to people who have been told they have it. Low does not mean no risk. Take the PDF to a doctor; do not use it to decide on treatment.",
    },
    {
      type: "callout",
      kind: "info",
      title: "Old screenings use old answers",
      text: "Each row and each PDF shows the result from that day. It is not updated if your health changes. Do a new screening to get a current level.",
    },
    {
      type: "callout",
      kind: "info",
      title: "What these pages do not do",
      text: "They do not let you edit or delete a screening, filter or search the list, or open a detail view. The PDF is not emailed or uploaded anywhere. Withdrawing store history hides everything here at once; it does not by itself delete the rows (data rights are on the **Settings** page; see [Trust Passport, consent and sharing](/admin/docs/trust-passport) for your data rights).",
    },
    {
      type: "callout",
      kind: "tip",
      title: "Demo data",
      text: "Demo accounts are dummy accounts. Their older screenings were made by a seeding script with the real models and carry the **Demo** badge. They are not real patients.",
    },

    { type: "h2", id: "niti-principles", text: "Which NITI Aayog principles this follows" },
    {
      type: "niti",
      items: [
        {
          id: "transparency",
          how: [
            "Every PDF lists the model version, model type and training-data fingerprint that made each result.",
            "The \"Low does not mean no risk\" miss rates are read from `model_meta.json` at download time, and left out if the model has changed since the screening.",
            "The PDF prints the Trust Passport address so the reader can check how the models work and how accurate they are.",
            "The history chart shows a gap, not a guess, when the model was not confident.",
          ],
        },
        {
          id: "inclusivity_non_discrimination",
          how: [
            "The PDF can be made in English, Hindi or Marathi, chosen separately from the app language.",
            "Hindi and Marathi PDFs use a Devanagari font with proper letter shaping; the server refuses to make a PDF with broken letters.",
            "The chart tells conditions apart by line style and dot shape as well as colour, so it works for people who cannot tell colours apart.",
          ],
        },
        {
          id: "privacy_security",
          how: [
            "Only a signed-in patient can open these pages, and only their own screenings are returned (database row-level security; anyone else's ID gives \"not found\").",
            "Withdrawing the store-history consent hides history, the report list and PDF downloads at once.",
            "The PDF holds only your name and the results: no raw answers, contact details or probabilities. It is built on the server with no outside service and sent with a \"do not store\" cache rule.",
          ],
        },
        {
          id: "accountability",
          how: [
            "Every PDF download is written to the audit log as `REPORT_DOWNLOADED` with the screening ID and language.",
            "Each PDF carries a Reference ID that links it to one saved screening row.",
            "Clinician reviews are shown with their status, and the clinician's level is shown next to the model's level, so it is clear who decided what.",
          ],
        },
        {
          id: "safety_reliability",
          how: [
            "Emergency records show no levels in the list, are left out of the chart, and the PDF says to call 108 / 112.",
            "When the model was not confident, both the list and the PDF say \"Not confident — see a doctor\" instead of a level.",
            "Every PDF ends with the \"This is not a diagnosis\" notice.",
          ],
        },
      ],
    },

    { type: "h2", id: "common-questions", text: "Common questions" },
    {
      type: "faq",
      items: [
        {
          q: "I did a screening but it is not in my history. Why?",
          a: "It was saved only if your store-history consent was on at that time. If it was off, the screening ran but nothing was kept. Also, a screening that stopped at \"Please correct your answers\" is never saved.",
        },
        {
          q: "Why does my history say \"History is hidden\"?",
          a: "You withdrew the store-history consent. History, the report list and PDF downloads are hidden straight away. Turn the consent on again under My data → Consent to see them.",
        },
        {
          q: "Can I get the exact percentage behind a level?",
          a: "No. VITALNEX shows only Low, Moderate or High, on screen and in the PDF. The server removes the probabilities before sending a result to a patient.",
        },
        {
          q: "Why is there a gap in one line of the chart?",
          a: "That time the model was not confident for that condition, so no level was given. The gap is honest; nothing is filled in.",
        },
        {
          q: "Can I choose a different language for the PDF than the app?",
          a: "Yes. The **Report language** picker on the Reports page changes only the PDF. It starts on your current app language.",
        },
        {
          q: "The Hindi or Marathi PDF fails but English works. Why?",
          a: "The server needs the `uharfbuzz` shaping tool to join Devanagari letters correctly. Without it, the server refuses to make Hindi or Marathi PDFs instead of printing broken words. Ask whoever runs the server to install it.",
        },
        {
          q: "Is there a QR code in the PDF?",
          a: "No. The PDF prints the Trust Passport web address as text. QR codes are made in the separate **Share my record (QR)** card on the Reports page.",
        },
        {
          q: "How do I share the PDF with my doctor?",
          a: "Download it and print it, or attach the file to a message yourself. VITALNEX does not send it for you. To give a doctor a live, time-limited view instead, use **Share my record (QR)**.",
        },
        {
          q: "Why does the PDF show my clinician's level next to the VITALNEX level?",
          a: "A clinician may agree with the model or choose a different level. Both are shown so you can see what the model said and what the clinician decided.",
        },
        {
          q: "Can I delete a screening from my history?",
          a: "Not from these pages. Your data rights (download or delete your data) are on the **Settings** page; see [Trust Passport, consent and sharing](/admin/docs/trust-passport).",
        },
      ],
    },
  ],
};

export default page;
