import type { DocPage } from "../types";

// Sources: apps/api/content/principle_map.json, apps/api/services/trust_service.py,
// docs/ERAI_REPORT.md, docs/DECISIONS.md, docs/claims_audit.md, docs/redteam_report.md,
// docs/fairness_mitigation.md, docs/SPEC.md §7. Every number below is copied from docs/ERAI_REPORT.md,
// which copies it from ml/artifacts/<disease>/model_meta.json or ml/nlp/artifacts/nlp_meta.json.

const page: DocPage = {
  slug: "responsible-ai",
  title: "Responsible AI (NITI Aayog)",
  summary:
    "How VITALNEX follows the seven principles in NITI Aayog's \"Responsible AI for All\" (2021). For each principle: the rule in plain words, what it means for a health screening app, what VITALNEX really does, where to see it, and what is still missing.",
  audience: "Everyone",
  blocks: [
    // ── Intro ──
    { type: "h2", id: "what-this-page-is", text: "What this page is about" },
    {
      type: "p",
      text: "VITALNEX uses AI (computer programs that learn patterns from past data) to say how similar a person's answers are to people who have been told they have diabetes or prediabetes, heart disease (coronary heart disease or a heart attack), or stroke. Because this touches people's health, the team built it to follow a set of rules for responsible AI written by NITI Aayog. This page explains those rules one by one and shows exactly how the app follows each of them.",
    },
    {
      type: "p",
      text: "Each principle section has the same five parts: **the rule in plain words**, **what it means for a health screening app**, **how VITALNEX does it**, **where to see it**, and **known gaps**. The gaps are written openly on purpose. A page that only listed good news would itself break the Transparency principle.",
    },
    {
      type: "callout",
      kind: "warning",
      title: "VITALNEX is not a diagnosis tool",
      text: "VITALNEX is an MVP (a first, small working version) with dummy demo accounts only. It does not diagnose, it never names or doses a medicine, and it has not been checked on Indian patients. In an emergency, call **108 / 112**.",
    },

    // ── NITI Aayog ──
    { type: "h2", id: "what-is-niti-aayog", text: "What NITI Aayog is and what the document says" },
    {
      type: "p",
      text: "**NITI Aayog** is the Government of India's policy think tank. It advises the government on plans and policy. It is not a court or a regulator, so its AI principles are guidance, not a law with penalties.",
    },
    {
      type: "p",
      text: "In 2021 NITI Aayog published **\"Responsible AI for All\"**. **Part 1 – Principles** lists seven principles that any AI system used in India should follow. In short: the AI must be safe, fair, open to everyone, private, understandable, have a person in charge, and support good human values.",
    },
    {
      type: "list",
      items: [
        "**Safety and Reliability** — it works as meant and has safeguards.",
        "**Equality** — people in the same situation are treated the same.",
        "**Inclusivity and Non-discrimination** — nobody is shut out because of who they are.",
        "**Privacy and Security** — personal data is safe and only used as needed.",
        "**Transparency** — people can understand how it works and why.",
        "**Accountability** — a person is responsible, and decisions are recorded.",
        "**Protection and Reinforcement of Positive Human Values** — it supports care, dignity and honesty.",
      ],
    },
    {
      type: "p",
      text: "VITALNEX also took into account (by name only, see `docs/SPEC.md` §7.2): ICMR's \"Ethical Guidelines for Application of AI in Biomedical Research and Healthcare\" (2023), the **Digital Personal Data Protection (DPDP) Act 2023** and DPDP Rules 2025, and WHO's \"Ethics and Governance of AI for Health\" (2021). VITALNEX does **not** claim to be certified or compliant with any of these. The claims audit (`docs/claims_audit.md`) checked that no such claim appears anywhere in the app.",
    },

    // ── How the map works ──
    { type: "h2", id: "how-the-map-works", text: "How VITALNEX connects principles to real features" },
    {
      type: "p",
      text: "The link between each principle and the app is not just written in a document. It is stored as data in `apps/api/content/principle_map.json`. For every principle the file lists: the **features** that put it into practice (each with the app page where you can see it) and the **evidence** (a number or count that proves it).",
    },
    {
      type: "p",
      text: "When someone opens the **Principles** part of the Trust Passport (`/ai-trust`), the API (the server program the web app talks to) runs `principle_map()` in `apps/api/services/trust_service.py`. It works out every evidence value at that moment, either from the model files (`ml/artifacts/<disease>/model_meta.json`) or by counting rows in the database. If a value cannot be worked out, it is shown as **\"not available\"**, never as a made-up number (hard rule 4).",
    },
    {
      type: "image",
      src: "/docs/responsible-ai/principle-map.png",
      alt: "The NITI Aayog principle map in the AI Trust Passport, with one principle card opened to show its live evidence.",
      caption: "AI Trust Passport (/ai-trust) as patient1, scrolled to the NITI Aayog principle map.",
      markers: [
        { n: 1, text: "The principle map section. One card per principle." },
        { n: 2, text: "\"Implemented by\": the features for this principle. Each is a link to the page where the feature lives." },
        { n: 3, text: "\"Live evidence\" badge: how many evidence items could be worked out (for example 3/3). It turns orange if any is missing." },
        { n: 4, text: "One evidence item after pressing \"Show evidence\": its name, its source file or table, and the value." },
      ],
    },
    {
      type: "steps",
      items: [
        { title: "Sign in", text: "Sign in with any account. The Trust Passport is open to patients, clinicians and admins." },
        { title: "Open the Trust Passport", text: "Choose **AI Trust Passport** in the left menu, or go to `/ai-trust`." },
        { title: "Go to the principle map", text: "Scroll to the bottom, or use the section links at the top, to reach **NITI Aayog principle map**." },
        { title: "Open the evidence", text: "On any principle card, press **Show evidence**. Each item shows a green tick if its value was worked out, or an orange cross if it is not available. Press **Hide evidence** to close it." },
      ],
    },
    {
      type: "callout",
      kind: "info",
      title: "Database numbers change, file numbers do not",
      text: "Numbers from the model files (coverage, abstention on the test set, model versions) stay the same until the models are retrained. Numbers from the database (consent rates, override rates, emergency counts) change as people use the app, so this page does not copy them. See them live in the Trust Passport. Database counts only include people who agreed to anonymous safety statistics (consent purpose `aggregate_audit`).",
    },

    // ── 1. Safety ──
    { type: "h2", id: "safety-and-reliability", text: "1. Safety and Reliability" },
    { type: "h3", text: "The rule in plain words" },
    {
      type: "p",
      text: "An AI system must work the way it is meant to, every time. There must be safeguards that stop it from harming people, and a way to raise a problem and get it fixed.",
    },
    { type: "h3", text: "What it means for a health screening app" },
    {
      type: "p",
      text: "The worst harm a screening app can cause is **false reassurance**: telling someone they look fine, so they skip care they need. Other harms: hiding an emergency behind a form, giving a confident answer from bad input, or giving a confident answer about someone very unlike the people the model learned from.",
    },
    { type: "h3", text: "How VITALNEX does it" },
    {
      type: "list",
      items: [
        "**Emergency override first.** Before any model runs, an emergency rule checks the symptom ticks and red-flag words in free text. If it fires, no model runs and only the **108 / 112** card is shown. Bare red-flag words like \"stroke\", \"heart attack\" or \"chest pain\" (and Hindi/Marathi versions) always show the card (D-26). The assistant runs the same kind of rule before its classifier.",
        "**Data-quality gate.** The form is checked (with Pydantic, a Python checking library) before the models run. Impossible values are rejected. Missing answers stay missing: they are never filled with a \"normal\" value (hard rule 3). The red-team test showed BMI 80 and age 15 are handled safely (`docs/redteam_report.md`, items 3 and 4).",
        "**Conformal abstention.** Conformal prediction (a method that measures how sure a model may be, with a set error level, here α = 0.10) plus an **out-of-distribution (OOD) check** (an IsolationForest that spots answers unlike the training data). If the model is not confident about a condition, **no level is shown** for it, only \"not confident — see a doctor\" (D-10, D-22).",
        "**Recall-first bands.** The Moderate threshold was set so the model catches about 80% of true cases on a separate calibration split (target recall 0.80, D-23). Missing a case is treated as worse than a false alarm.",
        "**Next steps come from fixed rules, not the model** (D-2): emergency → correct inputs → not confident → see a doctor soon (any High) → discuss at next check-up (any Moderate) → routine check-ups.",
        "**Report a problem.** The Trust Passport has a \"report a problem\" part with the contact and the emergency numbers 108 / 112.",
      ],
    },
    {
      type: "table",
      head: ["Evidence (test split, 50,736 rows per disease)", "Diabetes", "Heart", "Stroke"],
      rows: [
        ["Conformal coverage, people without the condition", "0.901", "0.926", "0.910"],
        ["Conformal coverage, people with the condition", "0.903", "0.926", "0.922"],
        ["Abstention rate (conformal + OOD)", "36.8%", "38.5%", "44.4%"],
        ["Recall at the Moderate threshold (95% CI)", "0.855 (0.847–0.862)", "0.838 (0.828–0.849)", "0.792 (0.774–0.809)"],
      ],
    },
    {
      type: "p",
      text: "Source: `docs/ERAI_REPORT.md` §2.1, copied from `model_meta.json` (`conformal_test.coverage`, `conformal_test.abstention_rate_total`, `test_metrics.recall_at_t_mod`). \"Coverage\" means how often the true answer was inside the model's set; the target was 0.90. For the assistant, on a separate 30-message emergency hold-out the untuned figure is **29 / 30** caught (D-25).",
    },
    { type: "h3", text: "Where to see it" },
    {
      type: "list",
      items: [
        "The emergency card and the \"not confident\" result: [Risk assessment](/admin/docs/risk-assessment) and [Understanding results](/admin/docs/understanding-results).",
        "The emergency rule in chat: [AI assistant](/admin/docs/ai-assistant).",
        "Coverage and abstention numbers: [Trust Passport](/admin/docs/trust-passport) and [Models and data](/admin/docs/models-and-data).",
      ],
    },
    { type: "h3", text: "Known gaps" },
    {
      type: "list",
      items: [
        "**The Low band still holds real cases.** On the test set, 14.5% (diabetes), 16.2% (heart) and 20.8% (stroke) of people who have the condition land in Low (`bands_test.low.share_of_true_cases`). Low holds 56–66% of all people. This was accepted and is told to users (D-23). Low does not mean no risk.",
        "**High abstention.** 37–44% of test people get no level for a condition (D-22). This is honest, but it limits how useful the app is.",
        "**Modest precision at High** (diabetes 0.429, heart 0.301, stroke 0.145), so many High results are false alarms.",
        "**The emergency rule lists were tuned after seeing test misses** (D-25), so only the 29 / 30 hold-out figure describes truly new wording.",
      ],
    },

    // ── 2. Equality ──
    { type: "h2", id: "equality", text: "2. Equality" },
    { type: "h3", text: "The rule in plain words" },
    {
      type: "p",
      text: "An AI system must treat people in the same situation in the same way. If it works better for some groups than others, that must be found and dealt with.",
    },
    { type: "h3", text: "What it means for a health screening app" },
    {
      type: "p",
      text: "A screening model can quietly work well for one group (for example older people) and badly for another (for example young adults). The app must measure this per group, tell people about it, and decide openly what to do.",
    },
    { type: "h3", text: "How VITALNEX does it" },
    {
      type: "list",
      items: [
        "**Fairness audit.** For each disease the training code uses fairlearn's `MetricFrame` (a tool that splits results by group) on the test split. It compares **recall** (share of true cases caught) and **false-positive rate** (share of people without the condition who were still flagged) across sex, age band, income, education, healthcare access and \"could not afford a doctor\". A recall gap above 0.10 is flagged (SPEC §4.7).",
        "**The gap tables are shown live.** The evidence item \"Recall & FPR gap tables\" reads `fairness.groups.*.gaps` from `model_meta.json`. They appear in the Trust Passport and in admin governance.",
        "**A fix was tried and openly rejected.** Per-age-group thresholds raised young-adult recall, but flagged 28–40% of young people, nearly all without the condition (`docs/fairness_mitigation.md`). The team chose to disclose instead (D-24).",
        "**Sex \"prefer not to say\".** The model is run with both values and the **higher** level is shown, with a note (D-9), so choosing not to say never gives a softer result.",
      ],
    },
    {
      type: "table",
      head: ["Age group recall (test)", "18–39", "40–59", "60+", "Recall gap"],
      rows: [
        ["Diabetes", "0.396", "0.792", "0.905", "0.509"],
        ["Heart", "0.118", "0.660", "0.901", "0.783"],
        ["Stroke", "0.170", "0.634", "0.862", "0.692"],
      ],
    },
    { type: "p", text: "Source: `docs/ERAI_REPORT.md` §4.1, from `model_meta.json: fairness.groups`." },
    { type: "h3", text: "Where to see it" },
    {
      type: "list",
      items: [
        "Fairness tables and the age gap: [Trust Passport](/admin/docs/trust-passport).",
        "Per-group tables for admins: [Admin console](/admin/docs/admin-console).",
        "How the numbers were made: [Models and data](/admin/docs/models-and-data).",
      ],
    },
    { type: "h3", text: "Known gaps" },
    {
      type: "list",
      items: [
        "**Young adults are poorly served (D-24).** The model misses most cases in people aged 18–39. The gap is disclosed, not fixed: every user under 40 sees \"Results are less reliable for people under 40.\"",
        "**Income gap** for all three diseases: the models miss more cases in higher-income people and give more false alarms to lower-income people (false-positive rate 0.48–0.55 for low income). Income is not an input; the gap comes through related inputs. Reported only.",
        "**Sex gap for heart** (recall female 0.779, male 0.882, gap 0.103). **Education gap for stroke** (0.110). Reported only.",
        "Older people more often get \"not confident\" instead of a level (heart: 5.1% of 18–39 vs 57.2% of 60+ abstained).",
      ],
    },

    // ── 3. Inclusivity ──
    { type: "h2", id: "inclusivity-and-non-discrimination", text: "3. Inclusivity and Non-discrimination" },
    { type: "h3", text: "The rule in plain words" },
    {
      type: "p",
      text: "An AI system must not shut anyone out or treat them unfairly because of who they are, such as their language, gender, age, religion or where they live. It should be usable by everyone it is meant for.",
    },
    { type: "h3", text: "What it means for a health screening app" },
    {
      type: "p",
      text: "In Pune and Maharashtra many people are more comfortable in Hindi or Marathi than in English. Medical words are hard for everyone. And the model must not use facts about a person's background (like income) to give them a different score.",
    },
    { type: "h3", text: "How VITALNEX does it" },
    {
      type: "list",
      items: [
        "**Three languages.** The whole interface is available in English, Hindi and Marathi (text in `apps/web/src/messages/{en,hi,mr}.json`). The language can be changed in Settings.",
        "**Plain-language explanations.** Results use fixed, pre-written sentences, not technical scores. The factor explanations come from SHAP (a method that shows which answers pushed the result up or down) and are mapped to these fixed sentences.",
        "**Sensitive attributes are not inputs.** Income, education, healthcare access, \"could not afford a doctor\" and cholesterol check are **not** model inputs and are **not asked** in the app (D-6). They are used only to audit fairness on the dataset (`model_meta.json: fairness_only_columns`).",
        "**The assistant is measured per language.** The local assistant model is tested separately in each language.",
      ],
    },
    {
      type: "table",
      head: ["Assistant evidence (test, 110 messages each)", "English", "Hindi", "Marathi"],
      rows: [
        ["Intent accuracy", "0.882", "0.927", "0.891"],
        ["Macro-F1", "0.882", "0.926", "0.891"],
        ["FAQ test questions answered", "12 / 20", "12 / 20", "11 / 20"],
      ],
    },
    {
      type: "p",
      text: "Source: `docs/ERAI_REPORT.md` §2.3, from `ml/nlp/artifacts/nlp_meta.json`. The assistant's training and test messages were written by Claude Code (synthetic, not from real users), so these numbers describe that test set, not real people.",
    },
    { type: "h3", text: "Where to see it" },
    {
      type: "list",
      items: [
        "Changing language: [Accounts and login](/admin/docs/accounts-and-login) and [Getting started](/admin/docs/getting-started).",
        "Plain-language factors: [Understanding results](/admin/docs/understanding-results).",
        "The per-language table and the excluded-features list: [Trust Passport](/admin/docs/trust-passport).",
        "The assistant: [AI assistant](/admin/docs/ai-assistant).",
      ],
    },
    { type: "h3", text: "Known gaps" },
    {
      type: "list",
      items: [
        "**Hindi and Marathi medical wording has not been checked by a human** (D-15). Every such text is listed as `\"_review\": \"pending\"` in `docs/i18n_review.md` and `docs/i18n_review_p8.md`. This is an accepted, recorded risk.",
        "The assistant answers only about 58% of FAQ test questions overall (`faq.test_coverage.all.rate` = 0.5833).",
        "This admin documentation itself is English only (D-27).",
      ],
    },

    // ── 4. Privacy ──
    { type: "h2", id: "privacy-and-security", text: "4. Privacy and Security" },
    { type: "h3", text: "The rule in plain words" },
    {
      type: "p",
      text: "Personal data must be kept safe. Only the right people may see it, only for the right reason, and only as much as is needed.",
    },
    { type: "h3", text: "What it means for a health screening app" },
    {
      type: "p",
      text: "Health answers are very sensitive. People must choose what is stored and who sees it, be able to change their mind, and be able to take their data out or have it deleted. The app must not send health data to outside companies.",
    },
    { type: "h3", text: "How VITALNEX does it" },
    {
      type: "list",
      items: [
        "**Purpose-specific consent.** There are four separate purposes, each turned on or off on its own: `assessment_processing`, `store_history`, `share_with_clinician` and `aggregate_audit`. Withdrawing is one click and takes effect at once (D-12). The red-team test confirmed that withdrawing `store_history` stops history being stored (`docs/redteam_report.md`, item 8).",
        "**Export and deletion.** On the My Data page a person can download everything as a JSON file and request deletion, with an in-page confirm step.",
        "**Row Level Security (RLS).** RLS is a database rule that checks, for every row, whether the signed-in person may see it. The red-team test showed patient A cannot fetch patient B's assessment (item 7).",
        "**No third-party APIs.** All ML and language processing runs on the VITALNEX server (hard rule 6). The assistant model runs locally (D-13).",
        "**Revocable QR shares.** A share link uses a random 256-bit token. Only its SHA-256 hash (a one-way fingerprint) is stored. Links expire after 1 hour, 24 hours or 7 days, can be revoked at any time, and every opening is logged in `share_access_log`. Expired, revoked and fake links are refused (red-team item 6).",
        "**No chat text stored.** For the assistant only the intent, confidence and emergency flag are saved in `assistant_logs`. The message text itself is never stored.",
      ],
    },
    { type: "h3", text: "Data minimisation and the DPDP Act" },
    {
      type: "p",
      text: "The DPDP Act 2023 asks that only the personal data needed for a stated purpose is collected. This is called **data minimisation**. VITALNEX applies it directly to the form:",
    },
    {
      type: "list",
      items: [
        "The training data (CDC BRFSS 2015) contains income, education, healthcare access, \"could not afford a doctor\" and cholesterol check. VITALNEX **does not ask any of these** in the app, and they are **not model inputs** (D-6, hard rule 10). They are used only on the dataset to check fairness.",
        "None of the three disease labels is used as an input, so users are never asked for diagnoses they may not know (D-19).",
        "The assistant does not keep what people type.",
        "Database counts in the Trust Passport only include people who agreed to `aggregate_audit`.",
      ],
    },
    {
      type: "callout",
      kind: "info",
      text: "VITALNEX does not claim DPDP compliance. A review by a qualified person (consent notices, retention, breach process, grievance contact, agreement with the database host) is listed as needed before any real use (`docs/ERAI_REPORT.md` §8).",
    },
    { type: "h3", text: "Where to see it" },
    {
      type: "list",
      items: [
        "Consent toggles, export and deletion: [Trust Passport, consent and sharing](/admin/docs/trust-passport).",
        "QR share links: [History and reports](/admin/docs/history-and-reports).",
        "What the assistant stores: [AI assistant](/admin/docs/ai-assistant).",
        "How RLS and the server fit together: [Architecture](/admin/docs/architecture).",
      ],
    },
    { type: "h3", text: "Known gaps" },
    {
      type: "list",
      items: [
        "**Patients can read their own stored probabilities.** The API removes the probability from patient responses (D-10), but RLS lets a patient read their own `risk_assessments` rows directly through Supabase, and those rows contain the probabilities. Fix (move them to a clinician-only place) is not done (`docs/ERAI_REPORT.md` §7).",
        "All demo accounts share one demo password. No security review or penetration test has been done.",
      ],
    },

    // ── 5. Transparency ──
    { type: "h2", id: "transparency", text: "5. Transparency" },
    { type: "h3", text: "The rule in plain words" },
    {
      type: "p",
      text: "People must be able to understand how the AI system works and why it gave a result. Its design and behaviour must be written down so others can check it.",
    },
    { type: "h3", text: "What it means for a health screening app" },
    {
      type: "p",
      text: "A person should know what data the model learned from, how good it is, where it is weak, why it gave their result and how sure it is. Every number shown must be real.",
    },
    { type: "h3", text: "How VITALNEX does it" },
    {
      type: "list",
      items: [
        "**AI Trust Passport** (`/ai-trust`): what the app is and is not, the data, each model's metrics and charts, fairness, abstention, accepted decisions, limitations, versions and the principle map.",
        "**Model cards** (`docs/model_cards/*.md`), made from `model_meta.json` by `python -m ml.training.model_card`.",
        "**Per-result \"why\" and \"how sure\".** Every result shows its main factors (from SHAP) and whether the model was confident.",
        "**Honest limitations** written in the Trust Passport and model cards, for example that the models were trained on US survey data.",
        "**No made-up numbers.** The claims audit found that the web app shows no hard-coded metric. Every number comes from the API, which reads `model_meta.json`, `nlp_meta.json` or the database. Three misleading claims were fixed (for example \"reviewed\" library and \"production-grade\") (D-16, `docs/claims_audit.md`).",
      ],
    },
    {
      type: "table",
      head: ["Evidence", "Diabetes", "Heart", "Stroke"],
      rows: [
        ["Model version", "diabetes-v1.0.0", "heart-v1.0.0", "stroke-v1.0.0"],
        ["Data hash (first 12 characters)", "2f3939868b6b", "2f3939868b6b", "2f3939868b6b"],
        ["Test AUROC (95% CI)", "0.824 (0.819–0.828)", "0.842 (0.836–0.848)", "0.810 (0.801–0.818)"],
        ["Test AUROC without duplicate rows", "0.804", "0.826", "0.790"],
      ],
    },
    {
      type: "p",
      text: "Source: `docs/ERAI_REPORT.md` §2.5. AUROC (a score from 0.5 = guessing to 1.0 = perfect at ranking people) is shown with the duplicate-free figure too, because the dataset has many duplicate rows. The data hash is a fingerprint of the exact data used, so anyone can check the model was trained on the stated data.",
    },
    { type: "h3", text: "Where to see it" },
    {
      type: "list",
      items: [
        "[Trust Passport](/admin/docs/trust-passport) — the full passport.",
        "[Understanding results](/admin/docs/understanding-results) — \"why\" and \"how sure\" on a result.",
        "[Models and data](/admin/docs/models-and-data) — training data, metrics and model cards.",
      ],
    },
    { type: "h3", text: "Known gaps" },
    {
      type: "list",
      items: [
        "Calibration (adjusting scores so they match real rates) did not improve the Brier score for diabetes and heart, but was kept so all three models use the same pipeline. This is stated in `model_meta.json: flags`.",
        "README, ERAI report and demo script were not part of the first claims audit; they need a re-check (`docs/claims_audit.md`).",
      ],
    },

    // ── 6. Accountability ──
    { type: "h2", id: "accountability", text: "6. Accountability" },
    { type: "h3", text: "The rule in plain words" },
    {
      type: "p",
      text: "There must always be a person or team responsible for what the AI system does. Its decisions must be recorded so they can be checked and audited later.",
    },
    { type: "h3", text: "What it means for a health screening app" },
    {
      type: "p",
      text: "Uncertain or worrying results should reach a human. When a clinician disagrees with the model, that must be recorded with a reason. The most important choices (which model, which thresholds) must be signed off by people, not made silently by code.",
    },
    { type: "h3", text: "How VITALNEX does it" },
    {
      type: "list",
      items: [
        "**Clinician review queue.** High and \"not confident\" results of patients who agreed to `share_with_clinician` go to a queue. A clinician agrees or overrides. An override needs a reason; the API rejects one without it.",
        "**Override log.** Overrides are stored append-only (rows are only added, never changed), and only the API can write them. Overrides are **never** used to retrain the models (hard rule 9).",
        "**Audit log** (`audit_logs`) records important actions.",
        "**Versioned models.** Every model has a version and training date shown in the Trust Passport.",
        "**Human sign-off gates** (SPEC §7.4): the team approved the data card (after P2), model choice, thresholds and fairness report (after P3, D-22 to D-24), and the assistant evaluation (after P8, D-25, D-26).",
        "**Rules, not the model, decide next steps** (D-2), so the AI's role stays small and checkable.",
      ],
    },
    { type: "h3", text: "Where to see it" },
    {
      type: "list",
      items: [
        "Review queue and override form: [Clinician workspace](/admin/docs/clinician-workspace).",
        "Override rates, audit log and governance: [Admin console](/admin/docs/admin-console).",
        "Override rate by disease and audit entries (live): [Trust Passport](/admin/docs/trust-passport).",
      ],
    },
    { type: "h3", text: "Known gaps" },
    {
      type: "list",
      items: [
        "Patients see a High result immediately (D-10), so clinician review comes **after** the patient sees it, not before.",
        "The team's own red-team run before the demo (gate 4) is still **pending**. The automated run by Claude Code passed 8 / 8 items (`docs/redteam_report.md`).",
        "Nothing has been tested with real clinicians, so automation bias (clinicians just agreeing with the model) has not been measured in practice.",
      ],
    },

    // ── 7. Human values ──
    { type: "h2", id: "positive-human-values", text: "7. Protection and Reinforcement of Positive Human Values" },
    { type: "h3", text: "The rule in plain words" },
    {
      type: "p",
      text: "An AI system must support good human values such as care, dignity and honesty. It must not mislead people, scare them, or replace human judgement where it matters.",
    },
    { type: "h3", text: "What it means for a health screening app" },
    {
      type: "p",
      text: "The app must not pretend to be a doctor. It must not tell people they \"have\" a disease or tell them what medicine to take. Advice should help people act on what they can change, and they should own their own record.",
    },
    { type: "h3", text: "How VITALNEX does it" },
    {
      type: "list",
      items: [
        "**Non-diagnostic wording everywhere.** Results say \"Your answers are similar to people who have been told they have …\", never \"you have …\". The PDF report says \"This is not a diagnosis\".",
        "**No medicine advice.** A medicine question is caught before the assistant answers, and the reply says to ask a doctor or pharmacist. Red-team item 1 passed in English, Hindi and Marathi. On the test set every medicine request was refused or escalated (`pipeline_safety_test.medication_refused_or_escalated` = 1.0).",
        "**Recourse only on changeable factors.** The \"what could change\" and what-if parts only use things a person can change. Smoking is \"ever smoked 100 cigarettes\" in the data, so quitting cannot lower it, and the what-if panel says so.",
        "**Patient-held record.** The patient can download a PDF report and share it with a QR link they control.",
        "**Fixed replies only.** The assistant has no generative model (D-13), so it cannot invent medical advice.",
      ],
    },
    { type: "h3", text: "Where to see it" },
    {
      type: "list",
      items: [
        "Wording of results and what-if: [Understanding results](/admin/docs/understanding-results).",
        "Medicine refusal: [AI assistant](/admin/docs/ai-assistant).",
        "PDF and QR: [History and reports](/admin/docs/history-and-reports).",
        "Medication-refusal count (live): [Trust Passport](/admin/docs/trust-passport).",
      ],
    },
    { type: "h3", text: "Known gaps" },
    {
      type: "list",
      items: [
        "**Recourse usage is not recorded.** What-if requests store nothing, so this evidence item always shows \"not available\". That is the honest value, not an error.",
        "High results can cause worry, and many are false alarms (see Safety). The wording is plain, but the effect on real users has not been studied.",
      ],
    },

    // ── Summary ──
    { type: "h2", id: "summary", text: "Summary: principle, features and where to read more" },
    {
      type: "table",
      head: ["Principle", "Main features in VITALNEX", "Live evidence", "Doc pages"],
      rows: [
        ["Safety and Reliability", "Emergency override, data-quality gate, conformal abstention, OOD check, recall-first bands", "Coverage per class, abstention rate, emergency triggers count", "[Risk assessment](/admin/docs/risk-assessment), [Understanding results](/admin/docs/understanding-results)"],
        ["Equality", "Fairness audit by sex, age, income, education, access; under-40 note; \"prefer not to say\" rule", "Recall & FPR gap tables", "[Trust Passport](/admin/docs/trust-passport), [Models and data](/admin/docs/models-and-data)"],
        ["Inclusivity and Non-discrimination", "EN/HI/MR interface, plain-language explanations, sensitive attributes not asked, per-language assistant scores", "Language parity table, excluded-features list", "[AI assistant](/admin/docs/ai-assistant), [Getting started](/admin/docs/getting-started)"],
        ["Privacy and Security", "4-purpose consent, data minimisation, RLS, no third-party APIs, revocable QR shares, no chat text stored", "Consent rates, share revocations, data-request log", "[Trust Passport](/admin/docs/trust-passport), [History and reports](/admin/docs/history-and-reports)"],
        ["Transparency", "Trust Passport, model cards, \"why\" and \"how sure\", honest limitations", "Model card version, data hash", "[Trust Passport](/admin/docs/trust-passport), [Models and data](/admin/docs/models-and-data)"],
        ["Accountability", "Clinician review queue, override log, audit log, versioned models, human sign-off gates", "Override rate by disease, audit entries", "[Clinician workspace](/admin/docs/clinician-workspace), [Admin console](/admin/docs/admin-console)"],
        ["Positive Human Values", "Non-diagnostic wording, no medicine advice, recourse on changeable factors only, patient-held record", "Medication-refusal count, recourse usage (not available)", "[AI assistant](/admin/docs/ai-assistant), [History and reports](/admin/docs/history-and-reports)"],
      ],
    },
    { type: "h2", id: "niti-principles", text: "All seven principles at a glance" },
    {
      type: "niti",
      items: [
        {
          id: "safety_reliability",
          how: [
            "Emergency rule runs before any model; red-flag words always show the 108 / 112 card (D-26).",
            "Conformal abstention + OOD check: no level is shown when the model is not confident (abstention 36.8–44.4% on test).",
            "Missing answers are never filled in; impossible values are rejected before the models run.",
            "Moderate threshold set for recall 0.80; test recall 0.792–0.855.",
          ],
        },
        {
          id: "equality",
          how: [
            "Fairness audit with fairlearn by sex, age, income, education and access; gaps above 0.10 flagged.",
            "Age gap disclosed (D-24) and users under 40 see a reliability note.",
            "\"Prefer not to say\" runs both sexes and shows the higher level (D-9).",
          ],
        },
        {
          id: "inclusivity_non_discrimination",
          how: [
            "Full interface in English, Hindi and Marathi.",
            "Income, education, access, \"could not afford a doctor\" and cholesterol check are not inputs (D-6).",
            "Assistant accuracy reported per language (0.882 / 0.927 / 0.891).",
          ],
        },
        {
          id: "privacy_security",
          how: [
            "Four separate consent purposes, one-click withdraw, JSON export and deletion request.",
            "RLS on every table; all ML and NLP run locally, no third-party API.",
            "QR shares: 256-bit token stored only as a SHA-256 hash, expiry 1 h / 24 h / 7 d, revocable, access logged.",
            "Data minimisation under DPDP: only the 14 needed questions; chat text never stored.",
          ],
        },
        {
          id: "transparency",
          how: [
            "AI Trust Passport with data, metrics, fairness, limitations, versions and this principle map.",
            "Model cards rendered from `model_meta.json`; data hash shown.",
            "Every result shows its main factors and whether the model is confident.",
            "Claims audit: no hard-coded metric in the web app.",
          ],
        },
        {
          id: "accountability",
          how: [
            "High and \"not confident\" results of consenting patients go to a clinician review queue.",
            "Overrides need a reason, are append-only, and never retrain the model.",
            "Human sign-off gates after P2, P3 and P8, recorded as D-22 to D-26.",
          ],
        },
        {
          id: "positive_human_values",
          how: [
            "Wording is \"similar to people who have been told they have …\", never a diagnosis.",
            "Medicine questions are always refused and sent to a doctor or pharmacist.",
            "What-if advice only uses factors a person can change; the patient holds their own PDF and QR record.",
          ],
        },
      ],
    },

    // ── FAQ ──
    { type: "h2", id: "common-questions", text: "Common questions" },
    {
      type: "faq",
      items: [
        {
          q: "Is VITALNEX certified as following NITI Aayog's principles?",
          a: "No. There is no certification for these principles, and VITALNEX makes no compliance claim. This page and the Trust Passport show how each principle is put into practice and where it still falls short.",
        },
        {
          q: "Why does an evidence item say \"not available\"?",
          a: "Because the value could not be worked out, for example the database could not be reached, or the thing is not recorded at all (recourse usage). VITALNEX shows \"not available\" instead of inventing a number (hard rule 4).",
        },
        {
          q: "Why not just fix the age gap with different thresholds for young people?",
          a: "It was tried. Young-adult recall went up to about 0.76–0.79, but 28–40% of young people would have been flagged, almost all without the condition. The team decided to disclose the gap instead (D-24). See `docs/fairness_mitigation.md`.",
        },
        {
          q: "Why are income and education not asked if they help prediction?",
          a: "Using them could give poorer or less educated people different scores just because of their background, and the DPDP Act asks to collect only what is needed. They are used only to check fairness on the training data (D-6).",
        },
        {
          q: "Does a clinician check every result?",
          a: "No. Only High and \"not confident\" results go to the review queue, and only for patients who agreed to share with clinicians. The patient sees their result straight away (D-10).",
        },
        {
          q: "Do clinician overrides make the model better over time?",
          a: "No. Overrides are logged for audit only. The models are never retrained automatically from overrides or user data (hard rule 9). Any retraining would be a human decision.",
        },
        {
          q: "Where are the full details?",
          a: "`docs/ERAI_REPORT.md` (the Ethical and Responsible AI report), `docs/DECISIONS.md`, `docs/redteam_report.md`, `docs/claims_audit.md` and the model cards in `docs/model_cards/`.",
        },
      ],
    },
  ],
};

export default page;
