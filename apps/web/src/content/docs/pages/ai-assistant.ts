import type { DocPage } from "../types";

const page: DocPage = {
  slug: "ai-assistant",
  title: "AI assistant",
  summary:
    "A chat page where you can ask about your latest screening, diabetes, heart disease and stroke, finding a doctor, or your data. Every answer is a fixed, pre-written reply. Nothing is generated and your messages are not stored.",
  audience: "Patients, clinicians and admins",
  blocks: [
    // ------------------------------------------------------------------ what it is
    { type: "h2", id: "what-it-is", text: "What this feature is" },
    {
      type: "p",
      text: "The AI assistant is a chat page. You type a short question in English, Hindi or Marathi and the assistant answers. It can explain your latest screening result, list general steps you could take, answer common questions about diabetes, heart disease and stroke, and send you to the right page to find a doctor, book an appointment or manage your data.",
    },
    {
      type: "callout",
      kind: "info",
      title: "It does not write its own answers",
      text: "The assistant is **not** a chatbot like ChatGPT. It does not make up text. A small local model (a program that learned from examples) only decides **what kind of question** you asked. The app then shows a **fixed reply** that a person wrote in advance, or a stored answer from a curated question list with a named source (WHO, NHS, ICMR, NITI Aayog and others). This is written down as decision D-13 in `docs/DECISIONS.md`.",
    },
    {
      type: "p",
      text: "Everything runs on the VITALNEX server. Your message is **never sent to any outside AI service** or any third-party API (a way for one program to talk to another over the internet).",
    },
    { type: "h3", text: "Who uses it" },
    {
      type: "list",
      items: [
        "**Patients** — the main users. The link is in the patient menu.",
        "**Clinicians and admins** — the server allows them to use it too, but there is no menu link for them. They can open it by typing the address `/ai-assistant`. For them, \"Explain my result\" only works if their own account has a saved screening.",
      ],
    },
    { type: "h3", text: "Why it exists" },
    {
      type: "p",
      text: "Many people find a results page hard to read, or do not know where to click next. The assistant gives a simple, safe way to ask \"what does my result mean?\" or \"how do I find a doctor?\" in your own language, without ever giving a diagnosis or naming a medicine.",
    },

    // ------------------------------------------------------------------ where to find it
    { type: "h2", id: "where-to-find-it", text: "Where to find it" },
    {
      type: "table",
      head: ["", "Details"],
      rows: [
        ["Menu item", "**AI Health Assistant** in the left menu, under the patient section (patients only)."],
        ["Address (URL)", "`/ai-assistant`"],
        ["Who can open it", "Signed-in patients, doctors and admins (`apps/web/src/lib/roles.ts`). Signed-out visitors are sent to the login page."],
        ["Server endpoint", "`POST /api/v1/assistant/message` (`apps/api/routers/v1/assistant.py`)"],
      ],
    },
    {
      type: "image",
      src: "/docs/ai-assistant/empty-chat.png",
      alt: "The AI assistant page before any question is asked, with the welcome message, suggested questions and the message box.",
      caption: "The assistant page as patient1 sees it before asking anything.",
      markers: [
        { n: 1, text: "**AI Health Assistant** link in the patient menu." },
        { n: 2, text: "**Answer language** buttons: English, हिंदी (Hindi), मराठी (Marathi). This also switches the language of the whole app." },
        { n: 3, text: "**Clear chat** — removes all messages on screen and shows the welcome message again." },
        { n: 4, text: "Notice: answers come from a fixed, pre-written library; it does not diagnose, does not recommend medicines, and chat messages are not stored." },
        { n: 5, text: "Standing emergency line: chest pain, trouble breathing, a drooping face or sudden weakness — call **108** or **112** now. The numbers are tap-to-call links." },
        { n: 6, text: "**Try asking** — six suggested questions. Click one to send it." },
        { n: 7, text: "Message box: type your question here (up to 2,000 characters)." },
        { n: 8, text: "**Send** button. It stays greyed out while the box is empty or an answer is loading. Pressing Enter also sends." },
      ],
    },

    // ------------------------------------------------------------------ what it can answer
    { type: "h2", id: "what-it-can-answer", text: "What the assistant can answer" },
    {
      type: "p",
      text: "The model sorts every message into one of **11 intents** (an intent is the kind of question, such as \"explain my result\"). The list comes from `ml/nlp/artifacts/nlp_meta.json` → `labels`. What you see depends on the intent:",
    },
    {
      type: "table",
      head: ["Intent", "Example question", "What the assistant does"],
      rows: [
        ["EXPLAIN_RESULT", "\"Explain my result\"", "Reads **your own latest saved screening** and lists, for each disease, the band (low / moderate / high) or \"not confident\", up to three main factors, and the next step. It never shows a percentage. Buttons: **My results**, **Find a doctor**."],
        ["WHAT_CAN_I_CHANGE", "\"What can I change?\"", "Lists the same general, sourced guidance steps as the results page, based on your latest saved answers, with source links. Reminds you that age, sex and past diagnoses cannot be changed. Button: **My results**."],
        ["DISEASE_INFO", "\"What is prediabetes?\"", "Finds the closest question in the curated FAQ about diabetes, heart disease or stroke and shows its stored answer with a **Source** link. Buttons: **Start a screening**, **Find a doctor**."],
        ["HOW_AI_WORKS", "\"How does VITALNEX work?\"", "Same as above, but only from the VITALNEX questions in the FAQ (data, accuracy, fairness, privacy, human review…). Button: **AI Trust Passport**."],
        ["BOOK_APPOINTMENT", "\"I want to book an appointment\"", "Short fixed reply. Buttons: **Appointments**, **Find a doctor**."],
        ["FIND_DOCTOR", "\"Find a doctor\"", "Short fixed reply. Buttons: **Find a doctor** (Care Connect), **Appointments**."],
        ["MY_DATA", "\"What happens to my data?\"", "Explains you can see, download or delete your data in Settings → My data, and that chat messages are never stored. Button: **My data & consent**."],
        ["EMERGENCY", "\"I have chest pain right now\"", "Shows only the red emergency card with **Call 108** and **Call 112**, plus a **Find a doctor** button. No other answer."],
        ["MEDICATION_REQUEST", "\"What dose should I take?\"", "Politely refuses: it cannot advise on medicines or doses; ask your doctor or pharmacist. Buttons: **Find a doctor**, **Appointments**."],
        ["GREETING", "\"Hello\"", "A fixed hello that lists what it can do, plus suggestion buttons."],
        ["OUT_OF_SCOPE", "\"What is the weather today?\"", "Says it can only help with VITALNEX topics and shows suggestion buttons."],
      ],
    },
    { type: "h3", text: "Topics in the curated FAQ" },
    {
      type: "p",
      text: "The FAQ files are `ml/nlp/faq.en.json`, `faq.hi.json` and `faq.mr.json`. Each has **59 entries** with the same ids in all three languages: 16 on diabetes, 16 on heart disease, 16 on stroke and 11 on VITALNEX itself (counts from `docs/model_cards/assistant.md`). Every entry has a source title and link.",
    },
    {
      type: "list",
      items: [
        "**Diabetes** — what diabetes and prediabetes are, symptoms, causes, family history, lifestyle, how it is diagnosed, type 1 vs type 2, complications, whether it is curable, food, how common it is in India, high blood sugar, weight, who should get tested.",
        "**Heart** — coronary heart disease, symptoms, warning signs of a heart attack, heart attack vs cardiac arrest, angina, risk factors, blood pressure, cholesterol, smoking, prevention, atrial fibrillation, heart disease in India, cardiovascular disease, salt, exercise, alcohol.",
        "**Stroke** — what a stroke is, FAST signs, other symptoms, mini stroke (TIA), types, who is at risk, blood pressure, diabetes, prevention, why acting fast matters, diagnosis, treatment, recovery, how common it is, irregular heartbeat, lifestyle.",
        "**VITALNEX** — what VITALNEX is, what data the models were trained on, whether the result is a diagnosis, accuracy, why it sometimes says \"not confident\", fairness, how the assistant works, whether health data is sent anywhere, whether a human checks results, whether it works for people in India, what the bands mean.",
      ],
    },
    {
      type: "callout",
      kind: "tip",
      title: "Ask short, clear questions",
      text: "The FAQ is small. A short question close to one of the topics above works best. If nothing in the FAQ is close enough, the assistant says it has no reliable answer instead of guessing (see [When the assistant is unsure](/admin/docs/ai-assistant#when-it-is-unsure)).",
    },

    // ------------------------------------------------------------------ how to use
    { type: "h2", id: "how-to-use-it", text: "How to use it" },
    {
      type: "steps",
      items: [
        { title: "Sign in", text: "Sign in with your account (for the demo, for example `patient1@vitalnex.demo`). See [Accounts and login](/admin/docs/accounts-and-login)." },
        { title: "Open the assistant", text: "Click **AI Health Assistant** in the left menu, or go to `/ai-assistant`." },
        { title: "Pick your language", text: "Click **English**, **हिंदी** or **मराठी** next to \"Answer language\". The reply comes in the language you pick here. This button changes the language of the whole app, and the choice is kept in your browser." },
        { title: "Ask a question", text: "Click one of the **Try asking** questions, or type your own in the box and press **Send** (or Enter). While the server works you see \"Looking up the answer…\"." },
        { title: "Read the answer", text: "The answer appears in a white bubble. If it came from the FAQ, a **Source** line below it links to the original page (opens in a new tab)." },
        { title: "Use the buttons under the answer", text: "Teal buttons with an arrow open another page (for example **Find a doctor** or **My results**). White buttons send that question for you." },
        { title: "Start again if you want", text: "Click **Clear chat** to remove the conversation. Leaving the page also clears it — nothing is saved." },
      ],
    },
    {
      type: "callout",
      kind: "info",
      title: "\"Explain my result\" needs a saved screening",
      text: "The assistant reads your newest screening from the database, using your own sign-in, so it can only ever see your own data. If you have none saved (for example you did not allow \"store history\"), it says it could not find a saved screening and offers a **Start a screening** button. See [Risk assessment](/admin/docs/risk-assessment) and [Understanding results](/admin/docs/understanding-results).",
    },
    {
      type: "image",
      src: "/docs/ai-assistant/answer-prediabetes.png",
      alt: "The assistant answering the question What is prediabetes with a stored FAQ answer, a source link and two buttons.",
      caption: "Asking \"What is prediabetes?\" (one of the suggested questions).",
      markers: [
        { n: 1, text: "Your question, shown on the right in a dark bubble." },
        { n: 2, text: "The answer: a stored FAQ answer, word for word. Nothing was generated." },
        { n: 3, text: "**Source** link to the page the answer is based on." },
        { n: 4, text: "Next-step buttons, here **Start a screening** (and **Find a doctor** beside it)." },
      ],
    },
    { type: "h3", text: "Asking in Hindi or Marathi" },
    {
      type: "p",
      text: "Switch the answer language first, then type. You can type in Devanagari script (डायबिटीज़ क्या है?) or in Roman letters (\"prediabetes kya hai\"). The intent model was trained and tested on both: 220 of the 1,320 training sentences are Hindi or Marathi written in Roman letters (`docs/model_cards/assistant.md`).",
    },
    {
      type: "image",
      src: "/docs/ai-assistant/hindi-question.png",
      alt: "The assistant page in Hindi with a Hindi question about diabetes and a Hindi answer from the FAQ.",
      caption: "A Hindi question after clicking हिंदी. The whole page, the question and the answer are in Hindi.",
      markers: [
        { n: 1, text: "हिंदी is selected as the answer language." },
        { n: 2, text: "The question typed in Hindi." },
        { n: 3, text: "The stored Hindi answer from `faq.hi.json`." },
      ],
    },
    {
      type: "callout",
      kind: "warning",
      title: "Reply language follows the button, not your message",
      text: "The server answers in the language chosen with the **Answer language** buttons. If the buttons say English and you type in Hindi, the model still understands the question, but the reply (and the FAQ search) is in English. Choose the language first.",
    },
    {
      type: "callout",
      kind: "warning",
      title: "Hindi and Marathi wording is not yet reviewed",
      text: "All Hindi and Marathi replies and FAQ answers were written by Claude Code and are marked **pending** review by a native-speaking clinician in `docs/i18n_review_p8.md`.",
    },

    // ------------------------------------------------------------------ emergency
    { type: "h2", id: "emergency-rules", text: "Emergency rules (108 / 112)" },
    {
      type: "p",
      text: "Emergencies always come first. Before the model even looks at your message, fixed word lists in `ml/nlp/data/emergency_phrases.json` are checked. The same lists are used by the free-text box in the risk assessment. There are two kinds of match:",
    },
    {
      type: "table",
      head: ["Match", "Example", "What you see"],
      rows: [
        ["**Full emergency** — a symptom that seems to be happening now", "\"I have chest pain\", \"my face is drooping\", Hindi/Marathi and Roman-letter versions", "**Only** the red emergency card: \"This may be a medical emergency. Call 108 (ambulance) or 112 now…\" with **Call 108** and **Call 112** buttons. No other answer."],
        ["**Bare red-flag word** (decision D-26) — a serious word in a normal question", "\"What is a stroke?\", \"heart attack\", \"paralysis\", लकवा, दिल का दौरा, \"lakwa\"", "The red card **first**, with the line \"The answer to your question is below.\", and then the **normal answer** under it."],
      ],
    },
    {
      type: "image",
      src: "/docs/ai-assistant/emergency-card.png",
      alt: "The red emergency card with Call 108 and Call 112 buttons above the normal answer to the question What is a stroke.",
      caption: "\"What is a stroke?\" contains the red-flag word \"stroke\", so the 108 / 112 card is shown above the normal answer (D-26).",
      markers: [
        { n: 1, text: "The red emergency card. It is always placed above the answer." },
        { n: 2, text: "**Call 108** (ambulance). **Call 112** is next to it. Both are tap-to-call links on a phone." },
        { n: 3, text: "\"The answer to your question is below.\" — shown only for a bare red-flag word, not for a full emergency." },
        { n: 4, text: "The normal FAQ answer, still shown under the card." },
      ],
    },
    {
      type: "callout",
      kind: "danger",
      title: "Safety over convenience",
      text: "D-26 means a calm question such as \"what is a stroke?\" also shows the emergency card. This is on purpose (hard rule 8): a few extra alarms are better than one missed emergency. On the test set, the card appeared on 6% of non-emergency messages (18 of 300); 13 of those still got their normal answer below the card (`nlp_meta.json` → `emergency_card_d26`).",
    },
    {
      type: "p",
      text: "There is also a second safety net. If the word lists miss an emergency, the model checks again: when its probability for EMERGENCY is 0.05 or more, the message is still treated as an emergency. That very low threshold was chosen so the model caught every emergency in the validation data (model card, \"Thresholds\").",
    },

    // ------------------------------------------------------------------ medicines
    { type: "h2", id: "medicine-questions", text: "Questions about medicines" },
    {
      type: "p",
      text: "VITALNEX never names or doses a medicine (hard rule 2). Words such as \"medicine\", \"tablet\", \"dose\" and their Hindi and Marathi versions (`ml/nlp/data/medication_phrases.json`) trigger a polite refusal before the model runs. The model is a backup here too (threshold 0.45).",
    },
    {
      type: "image",
      src: "/docs/ai-assistant/medicine-refusal.png",
      alt: "The assistant refusing to give medicine advice and offering Find a doctor and Appointments buttons.",
      caption: "A medicine question gets a fixed refusal and buttons to reach a doctor.",
      markers: [
        { n: 1, text: "The refusal: \"I can't advise on medicines or doses. Please ask your doctor or pharmacist…\"" },
        { n: 2, text: "**Find a doctor** button, which opens Care Connect. **Appointments** is next to it." },
      ],
    },
    {
      type: "callout",
      kind: "info",
      text: "Because the medicine rule matches single words, a harmless question that uses the word \"medicine\" also gets the refusal. This is a known side effect of keeping the rule strict.",
    },

    // ------------------------------------------------------------------ unsure
    { type: "h2", id: "when-it-is-unsure", text: "When the assistant is unsure" },
    {
      type: "p",
      text: "The assistant would rather say \"I don't know\" than give a wrong answer. There are three places where it stops:",
    },
    {
      type: "list",
      items: [
        "**Unclear question** — if the model's best guess has a probability below **0.45**, the message is treated as OUT_OF_SCOPE: \"Sorry, I can only help with VITALNEX screening, diabetes, heart disease, stroke, doctors and appointments, and your data.\" plus suggestion buttons.",
        "**No close FAQ entry** — for disease and VITALNEX questions, if the best FAQ match has a similarity below **0.591** (a score of how close two sentences are in meaning), it says: \"I don't have a reliable answer to that in my pre-written library. Please ask a doctor…\".",
        "**Model not available** — if the language model files cannot be loaded, it says the language model is not available and it can only help with emergencies and navigation. The emergency and medicine word rules still work, because they do not need the model.",
      ],
    },
    {
      type: "p",
      text: "If the server cannot be reached at all, the page shows: \"The assistant could not be reached, so no answer is shown. If you feel unwell, call 108 / 112.\" If your sign-in has expired it asks you to sign in again.",
    },
    {
      type: "callout",
      kind: "warning",
      title: "The FAQ often says \"no reliable answer\"",
      text: "On the test questions about diseases and VITALNEX, only about 60% (English and Hindi) and 55% (Marathi) found an FAQ entry above the threshold (model card, \"FAQ retrieval\"). Whether the chosen entry is the right one was **not** measured with labels.",
    },

    // ------------------------------------------------------------------ behind the scenes
    { type: "h2", id: "what-happens-behind-the-scenes", text: "What happens behind the scenes" },
    {
      type: "p",
      text: "When you press Send, the page sends your message and the chosen language to `POST /api/v1/assistant/message`. The server (`apps/api/services/assistant_service.py`) then runs these steps in order:",
    },
    {
      type: "steps",
      items: [
        { title: "1. Emergency word check", text: "Fixed word lists and \"near each other\" rules (for example a chest word close to a pain word) in English, Hindi, Marathi and Roman-letter Hindi/Marathi. The text is cleaned first (lower case, punctuation removed, Devanagari dots normalised). A full match → emergency card only. A bare red-flag word → card is added on top of the normal answer." },
        { title: "2. Medicine word check", text: "If the message asks about medicines or doses → fixed refusal." },
        { title: "3. Turn the message into numbers", text: "The local encoder `l3cube-pune/indic-sentence-bert-nli` (a sentence model built by L3Cube Pune for Indian languages) turns the message into a list of 768 numbers that capture its meaning. It runs on the server's CPU, about 40 ms per message." },
        { title: "4. Pick the intent", text: "A small neural network (an MLP, a simple layered model with one hidden layer of 256 units) reads those numbers and gives a probability for each of the 11 intents. The emergency (0.05) and medicine (0.45) safety checks run first, then the \"unsure\" check (0.45)." },
        { title: "5. Choose the reply", text: "Based on the intent: a fixed reply from `apps/api/content/assistant.{en,hi,mr}.json`, the closest FAQ answer, a reply built from your latest saved screening using the same explanation text as the results page, or a navigation button." },
        { title: "6. Write a log line", text: "Only three things are saved in the `assistant_logs` table: the intent, the confidence number and whether the emergency card was shown. There is no column for your message." },
      ],
    },
    { type: "h3", text: "The model in numbers" },
    {
      type: "p",
      text: "All figures below come from `docs/model_cards/assistant.md`, which is generated from `ml/nlp/artifacts/nlp_meta.json` (version `assistant-v1.0.0`).",
    },
    {
      type: "table",
      head: ["Item", "Value"],
      rows: [
        ["Encoder", "`l3cube-pune/indic-sentence-bert-nli`, frozen (not retrained), CPU, licence CC-BY-4.0"],
        ["Intent head", "MLP, 256 hidden units, 120 training rounds (`enc_mlp`)"],
        ["Generative model", "None"],
        ["Training data", "1,320 sentences (440 per language), all synthetic, written by Claude Code"],
        ["Test data", "330 sentences (110 per language), written separately, used once"],
        ["Test accuracy — English", "0.882 (macro-F1 0.882)"],
        ["Test accuracy — Hindi", "0.927 (macro-F1 0.926)"],
        ["Test accuracy — Marathi", "0.891 (macro-F1 0.891)"],
        ["Emergency recall, full pipeline, test set", "1.000 (but the word lists were tuned after seeing test misses, so this is optimistic)"],
        ["Emergency recall, untouched hold-out (honest figure, D-25)", "**29 of 30** (0.967)"],
        ["Medicine requests refused", "1.000 on the test set"],
      ],
    },
    {
      type: "p",
      text: "Macro-F1 is an average score across all intents, so a weak intent pulls it down. Three approaches were compared on validation data before the test set was opened; the MLP had the best validation macro-F1 (0.939). On the test set a simpler logistic-regression head scored slightly higher (0.909 vs 0.903 overall), but the rule fixed in advance was to choose on validation. For more on all models, see [Models and data](/admin/docs/models-and-data).",
    },
    {
      type: "callout",
      kind: "info",
      title: "About the 29 of 30",
      text: "After the P8 sign-off, the one missed hold-out phrase (Roman-letter Marathi for \"feels like someone is sitting on my chest\") and similar \"chest heavy / pressure\" wordings were added to the rules (D-25). So the hold-out is no longer untouched; a new hold-out is needed for a fresh honest measurement.",
    },
    { type: "h3", text: "Where the numbers appear elsewhere" },
    {
      type: "p",
      text: "The per-language accuracy table and live counts of emergency cards and medicine refusals (from `assistant_logs`, only for users who agreed to aggregate statistics) appear in the [AI Trust Passport](/admin/docs/trust-passport).",
    },

    // ------------------------------------------------------------------ safety and limits
    { type: "h2", id: "safety-and-limits", text: "Safety and limits" },
    {
      type: "callout",
      kind: "danger",
      title: "Not a doctor, not a diagnosis",
      text: "The assistant never says you have a disease. When it explains a result it says the bands show \"how similar your answers are to people who have been told they have the condition. They are not a diagnosis.\" It is not a symptom checker. If you feel unwell, call **108** or **112**.",
    },
    {
      type: "callout",
      kind: "warning",
      title: "What it does not do",
      text: "It does not name, suggest or dose medicines. It does not remember earlier messages (each message is handled on its own). It does not book appointments itself — it only links to the Appointments and Care Connect pages. It does not read your health profile — only your newest saved screening. It does not accept voice (the voice feature is switched off for the MVP).",
    },
    {
      type: "callout",
      kind: "warning",
      title: "Synthetic training data",
      text: "Every training and test sentence was written by Claude Code, not by real users. Real-world accuracy will likely be lower than the numbers above (model card, \"Intended use and limits\").",
    },
    {
      type: "callout",
      kind: "info",
      title: "Your messages are not stored",
      text: "The message text is not saved in the database, not written to server logs and not kept in the browser after you leave the page. Only intent, confidence and the emergency flag are logged. These log rows are included when you download your data and are deleted when you delete your account (`apps/api/services/data_rights_service.py`).",
    },
    {
      type: "callout",
      kind: "info",
      title: "No automatic learning",
      text: "The assistant does not learn from your messages. The model only changes when a developer re-runs `python -m ml.nlp.train_intents` by hand.",
    },

    // ------------------------------------------------------------------ NITI
    { type: "h2", id: "niti-principles", text: "Which NITI Aayog principles this follows" },
    {
      type: "niti",
      items: [
        {
          id: "safety_reliability",
          how: [
            "Fixed emergency word lists run before the model, and a very low model threshold (0.05) acts as a second net; on the untouched hold-out the full pipeline caught 29 of 30 emergencies.",
            "Bare red-flag words such as \"stroke\" always show the 108 / 112 card, even in a calm question (D-26).",
            "When the model is unsure (below 0.45) or no FAQ entry is close enough (below 0.591), it says so instead of guessing.",
            "If the model cannot load, emergency and medicine rules still work and the reply says plainly that the model is unavailable.",
          ],
        },
        {
          id: "inclusivity_non_discrimination",
          how: [
            "Works in English, Hindi and Marathi, typed in Devanagari or Roman letters, with the same 59 FAQ entries in each language.",
            "Accuracy is reported for each language separately (English 0.882, Hindi 0.927, Marathi 0.891) so a weaker language is visible.",
            "Emergency phrases are listed for all five forms (EN, HI, MR, Roman HI, Roman MR) and are checked whatever answer language is chosen.",
          ],
        },
        {
          id: "privacy_security",
          how: [
            "The encoder runs on the VITALNEX server in offline mode; no message is sent to any third-party API.",
            "The `assistant_logs` table has no message column — only intent, confidence and the emergency flag.",
            "\"Explain my result\" reads your screening with your own sign-in, so database security rules allow only your own data.",
          ],
        },
        {
          id: "transparency",
          how: [
            "The page says up front that answers come from a fixed, pre-written library.",
            "FAQ answers show a **Source** link (WHO, NHS, ICMR, NITI Aayog and others).",
            "The model card reports the honest untuned emergency figure (29 of 30) and explains that the test-set figure is optimistic.",
          ],
        },
        {
          id: "accountability",
          how: [
            "Every message writes an audit row (intent, confidence, emergency flag); for users who agreed to aggregate statistics these rows feed the emergency and medicine-refusal counts in the Trust Passport.",
            "Decisions D-13, D-25 and D-26 in `docs/DECISIONS.md` record who approved the design and the emergency rules.",
            "Hindi and Marathi wording is tracked as pending review in `docs/i18n_review_p8.md` until a person confirms it.",
          ],
        },
        {
          id: "positive_human_values",
          how: [
            "Medicine and dose questions get a polite refusal that points to a doctor or pharmacist.",
            "Results are described as similarity to other people, never as a diagnosis.",
            "Next-step buttons send people to real clinicians (Care Connect, Appointments) rather than replacing them.",
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
          q: "Is this like ChatGPT?",
          a: "No. It does not write new text. A local model only picks the type of question, and the app shows a reply that was written in advance or a stored FAQ answer with a source.",
        },
        {
          q: "Are my chat messages saved?",
          a: "No. The text is not stored anywhere. Only the intent, a confidence number and whether the emergency card was shown are logged. Leaving the page or clicking **Clear chat** removes the conversation from the screen.",
        },
        {
          q: "Why did I get the emergency card when I only asked \"what is a stroke?\"",
          a: "Words such as \"stroke\", \"heart attack\" and \"paralysis\" always show the 108 / 112 card (decision D-26). Your normal answer is still shown below the card.",
        },
        {
          q: "Why did it say \"I could not find a saved screening\"?",
          a: "\"Explain my result\" and \"What can I change?\" need a screening saved in your history. Run a screening and allow history to be stored, then ask again.",
        },
        {
          q: "I typed in Hindi but got an English answer. Why?",
          a: "The reply language follows the **Answer language** buttons at the top. Click हिंदी (or मराठी) first, then ask.",
        },
        {
          q: "Can it tell me which medicine to take?",
          a: "No. VITALNEX never names or doses medicines. Ask your doctor or pharmacist. Use **Find a doctor** to reach a clinician.",
        },
        {
          q: "Can a doctor or admin use it?",
          a: "Yes, the server allows it, but there is no menu link for them; they open `/ai-assistant` directly. \"Explain my result\" uses their own account's screenings, not a patient's.",
        },
        {
          q: "Does it remember what I asked before?",
          a: "No. Each message is handled on its own, so ask a complete question each time.",
        },
      ],
    },
  ],
};

export default page;
