import type { DocPage } from "../types";

// Every number on this page is copied from ml/artifacts/<disease>/model_card.md (rendered from
// model_meta.json), docs/data_card.md, docs/fairness_mitigation.md or docs/model_cards/assistant.md.
// If the models are retrained, update this page from the new files.

const page: DocPage = {
  slug: "models-and-data",
  title: "Models and data",
  summary:
    "Which data the three screening models learned from, how they were built and chosen, every test result they reached, how fair they are across groups, and what they cannot do. All numbers come from the files the training code wrote.",
  audience: "Reviewers, clinicians and developers",
  blocks: [
    // ── Overview ──
    { type: "h2", id: "overview", text: "What this page covers" },
    {
      type: "p",
      text: "VITALNEX uses three small **models** (computer programs that learned patterns from past data) to look at a person's answers. One model is for **diabetes or prediabetes**, one for **heart disease** (coronary heart disease or heart attack) and one for **stroke**. Each model gives a score. The score says how similar the person's answers are to the answers of people who said a doctor had told them they have that condition. It is **not** a diagnosis.",
    },
    {
      type: "p",
      text: "VITALNEX also has a fourth, separate model: the **intent model** of the assistant (it decides what kind of question a chat message is). It is described near the end of this page.",
    },
    {
      type: "p",
      text: "This page explains, in plain words: the training data, how the data was checked and split, how the models were built and chosen, every test result, how scores become Low / Moderate / High, when the model says it is \"not confident\", how answers are explained, how fair the models are for different groups, how to retrain, and the honest limits.",
    },
    {
      type: "callout",
      kind: "info",
      title: "Where the numbers come from",
      text: "Every number here was written by the training code into `ml/artifacts/<disease>/model_meta.json` and the model card `ml/artifacts/<disease>/model_card.md` (disease = `diabetes`, `heart` or `stroke`). Data numbers come from `docs/data_card.md`. Nothing is typed in by hand. The admin **Governance & audit** page reads the same files live (see [Admin console](/admin/docs/admin-console)).",
    },
    {
      type: "table",
      head: ["Model", "Version", "Trained (UTC)", "Chosen algorithm"],
      rows: [
        ["Diabetes / prediabetes", "`diabetes-v1.0.0`", "2026-10-28 12:24", "LightGBM + isotonic calibration"],
        ["Heart disease / heart attack", "`heart-v1.0.0`", "2026-10-28 12:24", "LightGBM + isotonic calibration"],
        ["Stroke", "`stroke-v1.0.0`", "2026-10-28 12:25", "Logistic Regression + isotonic calibration"],
        ["Assistant intent model", "`assistant-v1.0.0`", "2026-10-28 14:13", "Local sentence encoder + small neural network (MLP)"],
      ],
    },

    // ── Training data ──
    { type: "h2", id: "training-data", text: "The training data: BRFSS" },
    {
      type: "p",
      text: "All three screening models learned from one public dataset: the **CDC Diabetes Health Indicators** dataset (UCI Machine Learning Repository id 891, DOI 10.24432/C53919). The same file is on Kaggle as `diabetes_binary_health_indicators_BRFSS2015.csv`.",
    },
    {
      type: "p",
      text: "It comes from the **BRFSS** (Behavioral Risk Factor Surveillance System). BRFSS is a yearly **telephone survey** of adults in the United States, run by the US CDC (Centers for Disease Control and Prevention). People answer questions about their health and habits. **All answers are self-reported** (people say them; nobody measured them).",
    },
    {
      type: "table",
      head: ["Fact", "Value (from docs/data_card.md)"],
      rows: [
        ["Survey year", "2015 (file name). The UCI page links the 2014 page, so the year is recorded as a known mismatch."],
        ["Rows (people)", "253,680"],
        ["Columns", "21 answers + labels, no missing values (the Kaggle author dropped rows with missing answers)"],
        ["Licence", "\"CC0: Public Domain\" (Kaggle licence field). Underlying BRFSS data is US federal public survey data."],
        ["Exact duplicate rows", "24,206 (9.5%). Kept, because answers are coarse and different people can answer the same way."],
        ["File fingerprint (SHA-256)", "`2f3939868b6b6653d84458193a2c94280921ff5a3b2849adc18b1b307be55cbc`"],
      ],
    },
    { type: "h3", text: "What the labels mean" },
    {
      type: "p",
      text: "A **label** is the answer the model tries to learn. Here each label means \"this person said a doctor had ever told them they have the condition\". It is not a lab test. It describes the past, not the future.",
    },
    {
      type: "table",
      head: ["Model", "Label column", "People with label = yes", "Share (prevalence)"],
      rows: [
        ["Diabetes", "`Diabetes_binary` (diabetes and prediabetes merged)", "35,346", "13.93%"],
        ["Heart", "`HeartDiseaseorAttack` (coronary heart disease and heart attack merged)", "23,893", "9.42%"],
        ["Stroke", "`Stroke`", "10,292", "4.06%"],
      ],
    },
    {
      type: "p",
      text: "No label is used as an input to any other model (decision D-19). For example, the heart model does not know if the person has diabetes.",
    },
    { type: "h3", text: "Why this dataset was chosen" },
    {
      type: "list",
      items: [
        "It is large (over 250,000 people) and public, with a clear licence (decision D-3).",
        "It has all three conditions in **one** file, so **one form** can feed three models.",
        "Its questions are simple yes/no or number questions that a person can answer at home, without a blood test. That fits a screening app.",
        "It is small enough to train on a normal laptop CPU (no graphics card, no paid cloud).",
      ],
    },
    { type: "h3", text: "Its limits for Indian users" },
    {
      type: "callout",
      kind: "warning",
      title: "Not validated on Indian people",
      text: "The data is from US adults in 2014/2015. The models have **not** been tested on Indian users. Results for Indian users may be less accurate in ways we cannot measure yet.",
    },
    {
      type: "list",
      items: [
        "Smokeless tobacco (gutka, khaini) and bidis are common in India but are **not** in the data. `Smoker` only means \"smoked 100 cigarettes in your life\".",
        "BMI (body mass index, weight compared to height) risk levels are lower for South Asians. The model uses the raw BMI; the app's lifestyle guidance uses Asian cut-offs (23 and 27.5).",
        "Sex is only male / female in the data. There is no data for intersex or non-binary people.",
        "Survey weights are not in the file, so the shares above are not true US population rates.",
        "Age is only in 5-year bands (13 bands, 80+ is open-ended). BMI is rounded to a whole number.",
        "People who were never diagnosed count as \"no\". So the model partly learns \"was diagnosed\", not only \"has the condition\".",
      ],
    },
    { type: "h3", text: "The Pune synthetic dataset is NOT used for the models" },
    {
      type: "callout",
      kind: "danger",
      title: "Synthetic, demo only",
      text: "The Pune Clinical Risk Synthetic Dataset (`data/synthetic/`) is **made-up (synthetic) data**, not real patients. It is used **only** for demo patient profiles and stress tests. It is **never** used to train or test the models, and no number on this page comes from it (decision D-4).",
    },

    // ── Data preparation ──
    { type: "h2", id: "data-preparation", text: "How the data was prepared" },
    {
      type: "p",
      text: "Preparation is done by two scripts. They always give the same result because they use a fixed random **seed** (42), a number that makes \"random\" choices repeatable.",
    },
    {
      type: "steps",
      items: [
        {
          title: "Download",
          text: "`python -m ml.data.download` fetches the raw CSV file into `data/raw/`. Raw data is git-ignored (not stored in the code repository).",
        },
        {
          title: "Validate (check)",
          text: "`python -m ml.data.prepare` checks the file before anything else. It stops with an error if a column is missing or extra, if any value is empty, if any value is outside its allowed range, or if a label is not 0/1. Nothing is fixed or filled in silently.",
        },
        {
          title: "Split",
          text: "For each disease, people are split into four groups, keeping the same share of \"yes\" labels in each (this is called **stratified**): **train** 60%, **cal-A** 10%, **cal-B** 10%, **test** 20%. Only row numbers are saved, in `ml/data/splits/<disease>.json`.",
        },
        {
          title: "Fingerprint (hash)",
          text: "The prepared file `data/processed/brfss2015.parquet` gets a **SHA-256 hash** (a fingerprint: if one byte changes, the hash changes). Training refuses to run if the splits were made from a file with a different hash. The hash is stored in every `model_meta.json` and shown in the admin model registry.",
        },
        {
          title: "Data card",
          text: "`python -m ml.data.data_card` writes `docs/data_card.md` from the computed statistics, including charts in `docs/figures/`.",
        },
      ],
    },
    {
      type: "table",
      head: ["Group", "Rows", "What it is used for"],
      rows: [
        ["train", "152,208", "Learning the patterns (with 3-fold cross-validation to pick settings)."],
        ["cal-A", "25,368", "Fitting the calibration step (see below)."],
        ["cal-B", "25,368", "Comparing models, setting the Low/Moderate/High cut-offs, and setting the \"not confident\" rule."],
        ["test", "50,736", "Used **once**, after the model was chosen, to report the final results."],
      ],
    },
    {
      type: "callout",
      kind: "tip",
      title: "Why the test group is touched only once",
      text: "If you look at the test results while still choosing, you start to tune for the test, and the numbers become too good. The training code checks that each model only ever saw training rows; it stops with an error otherwise.",
    },

    // ── Inputs ──
    { type: "h2", id: "inputs", text: "What the models look at (inputs)" },
    {
      type: "p",
      text: "All three models use the **same 14 answers**. Every answer comes from the assessment form. If a value is missing, the form does not let the person continue; the app **never** fills in a \"normal\" value. See [Risk assessment](/admin/docs/risk-assessment).",
    },
    {
      type: "table",
      head: ["Input", "Question in the app", "Values"],
      rows: [
        ["`Age`", "Your age (years)", "18–120, turned into the 13 BRFSS age bands. Under 18 is blocked."],
        ["`Sex`", "Sex assigned at birth (used only for risk calculation)", "female / male / prefer not to say"],
        ["`BMI`", "Height (cm) and weight (kg); BMI is computed", "BMI must be 12–70, otherwise the person is asked to correct it"],
        ["`HighBP`", "Ever told you have high blood pressure?", "yes / no"],
        ["`HighChol`", "Ever told your cholesterol is high?", "yes / no"],
        ["`Smoker`", "Smoked at least 100 cigarettes in your life?", "yes / no"],
        ["`PhysActivity`", "Any exercise in the past 30 days (other than your job)?", "yes / no"],
        ["`Fruits`", "Fruit at least once a day?", "yes / no"],
        ["`Veggies`", "Vegetables at least once a day?", "yes / no"],
        ["`HvyAlcoholConsump`", "More than 14 drinks a week (men) / 7 (women)?", "yes / no"],
        ["`GenHlth`", "In general, how is your health?", "1 excellent … 5 poor"],
        ["`MentHlth`", "Days of not-good mental health in the past 30 days", "0–30"],
        ["`PhysHlth`", "Days of not-good physical health in the past 30 days", "0–30"],
        ["`DiffWalk`", "Serious difficulty walking or climbing stairs?", "yes / no"],
      ],
    },
    {
      type: "p",
      text: "**\"Prefer not to say\" for sex** (decision D-9): the server runs each model twice, once as female and once as male, and keeps the **higher** level. If either run is \"not confident\", that condition is shown as not confident.",
    },
    {
      type: "callout",
      kind: "info",
      title: "Not asked, ever",
      text: "Income, education, health insurance, \"could not afford a doctor\" and \"had cholesterol checked\" are in the dataset but are **never** model inputs and are **never** asked in the app (decision D-6, data minimisation). They are used only to check fairness on the dataset.",
    },

    // ── Model choice ──
    { type: "h2", id: "how-models-were-chosen", text: "How each model was built and chosen" },
    {
      type: "p",
      text: "For each disease, the training script `python -m ml.training.train_all` tried three kinds of model:",
    },
    {
      type: "list",
      items: [
        "**Logistic Regression**: the simplest. It gives each answer a fixed weight and adds them up. Easy to explain.",
        "**LightGBM**: many small decision trees (yes/no question chains) that correct each other. Good at catching combinations of answers.",
        "**PyTorch MLP**: a small neural network (layers of 64 and 32 units). The most flexible, but hardest to explain.",
      ],
    },
    {
      type: "steps",
      items: [
        { title: "Tune on train", text: "Each kind is tuned with a small grid of settings and 3-fold cross-validation (the train group is cut in 3 and each part takes a turn as a mini test)." },
        { title: "Calibrate on cal-A", text: "Each model's raw score is adjusted with isotonic calibration (explained below)." },
        { title: "Compare on cal-B", text: "The models are compared on the cal-B group by AUROC (explained below)." },
        {
          title: "Apply the fixed rule",
          text: "Rule written before testing: \"highest cal-B AUROC, unless another model is within 0.005 AUROC and has a better calibrated Brier score; ties go to the simpler model\" (order: Logistic Regression, LightGBM, MLP).",
        },
        { title: "Test once", text: "Only the chosen model's final result on the test group is reported as the official number." },
      ],
    },
    {
      type: "table",
      head: ["Disease", "Logistic Regression (cal-B AUROC)", "LightGBM", "PyTorch MLP", "Chosen"],
      rows: [
        ["Diabetes", "0.819", "0.825", "0.824", "**LightGBM** (highest, 0.8254)"],
        ["Heart", "0.841", "0.843", "0.843", "**LightGBM** (highest, 0.8429)"],
        ["Stroke", "0.808", "0.807", "0.808", "**Logistic Regression** (0.8081; tie goes to the simpler model)"],
      ],
    },
    {
      type: "p",
      text: "All three kinds scored very close to each other. This tells us the 14 answers, not the algorithm, set the limit on how well the models can do.",
    },

    // ── Metrics ──
    { type: "h2", id: "metrics", text: "Test results, with what each number means" },
    { type: "h3", text: "The metrics in one sentence each" },
    {
      type: "table",
      head: ["Metric", "Plain meaning", "Better is"],
      rows: [
        ["**AUROC**", "If you pick one person with the condition and one without, how often the model gives the first person the higher score (0.5 = coin toss, 1.0 = always right).", "higher"],
        ["**Brier score**", "The average squared gap between the score and what really happened (0 or 1); it checks that scores are honest as chances.", "lower"],
        ["**ECE** (expected calibration error)", "How far, on average, the scores are from the real rate in 10 score buckets.", "lower"],
        ["**Recall at Moderate threshold**", "Of all people who have the label, the share the model places in Moderate or High (\"how many it catches\").", "higher"],
        ["**Precision**", "Of the people the model flags, the share who really have the label.", "higher"],
        ["**False-positive rate (FPR)**", "Of people **without** the label, the share who are flagged anyway.", "lower"],
        ["**Abstention rate**", "The share of people for whom the model says \"not confident\" and shows no level.", "lower, if safety stays the same"],
        ["**95% CI** (confidence interval)", "The range the true value probably sits in, found by re-scoring 500 random re-samples of the test group.", "narrower"],
      ],
    },
    { type: "h3", text: "Final results on the test group (50,736 people)" },
    {
      type: "table",
      head: ["Metric", "Diabetes (LightGBM)", "Heart (LightGBM)", "Stroke (Logistic Regression)"],
      rows: [
        ["Share with label (prevalence)", "13.9%", "9.4%", "4.1%"],
        ["AUROC (95% CI)", "0.824 (0.819–0.828)", "0.842 (0.836–0.848)", "0.810 (0.801–0.818)"],
        ["Brier score (95% CI)", "0.0979 (0.0963–0.0997)", "0.0711 (0.0695–0.0728)", "0.0364 (0.0351–0.0377)"],
        ["Recall at Moderate threshold (95% CI)", "0.855 (0.847–0.862)", "0.838 (0.828–0.849)", "0.792 (0.774–0.809)"],
        ["Precision at Moderate threshold", "0.273", "0.224", "0.094"],
        ["Recall at High threshold", "0.479", "0.624", "0.524"],
        ["Precision at High threshold", "0.429", "0.301", "0.145"],
        ["Abstention (\"not confident\"), total", "36.8%", "38.5%", "44.4%"],
      ],
    },
    {
      type: "p",
      text: "**Check without duplicates.** Because the data has many repeated rows, the results were also measured on the test group with duplicates removed: diabetes AUROC 0.804 (7,568 rows removed), heart 0.826 (7,740 removed), stroke 0.790 (8,217 removed). Recall stayed almost the same (0.854 / 0.836 / 0.792).",
    },
    {
      type: "callout",
      kind: "warning",
      title: "How to read precision",
      text: "Precision is low for stroke (0.094 at Moderate) because stroke is rare in the data (4.1%). Most people flagged Moderate or High for stroke do **not** have the label. That is expected for a screening tool that tries to miss few cases, and it is why a flag means \"talk to a doctor\", never \"you have it\".",
    },

    // ── Calibration ──
    { type: "h2", id: "calibration", text: "Calibration: making scores honest" },
    {
      type: "p",
      text: "**Calibration** means adjusting scores so that a score of 0.20 really matches about 20 people in 100 with the label. VITALNEX uses **isotonic calibration** (a step-shaped curve that maps raw scores to real rates). It was fitted on cal-A and measured on cal-B. It really ran for all three models; the files are `ml/artifacts/<disease>/calibrator.joblib` and the chart `reliability.png`.",
    },
    {
      type: "table",
      head: ["Disease", "Brier before → after", "ECE before → after"],
      rows: [
        ["Diabetes", "0.0969 → 0.0971", "0.0025 → 0.0059"],
        ["Heart", "0.0709 → 0.0710", "0.0033 → 0.0032"],
        ["Stroke", "0.1824 → 0.0366", "0.3262 → 0.0012"],
      ],
    },
    {
      type: "p",
      text: "Honest reading: LightGBM (diabetes, heart) was already well calibrated, so the step did **not** improve it (the model card flags this). For stroke, Logistic Regression was trained with \"balanced\" class weights, which pushes raw scores up on purpose; calibration fixed this (Brier 0.1824 → 0.0366).",
    },

    // ── Bands ──
    { type: "h2", id: "risk-bands", text: "Risk bands: Low, Moderate, High" },
    {
      type: "p",
      text: "The calibrated score is turned into one of three **screening bands** using two cut-offs set on cal-B. These are screening bands, **not** clinical cut-offs.",
    },
    {
      type: "list",
      items: [
        "**Moderate cut-off (t_mod)**: the largest cut-off that still catches at least 80% of people with the label (recall ≥ 0.80).",
        "**High cut-off (t_high)**: the smallest cut-off where precision is at least 3 times the share with the label.",
        "Score below t_mod = **Low**; from t_mod up to t_high = **Moderate**; t_high or more = **High**.",
      ],
    },
    {
      type: "table",
      head: ["Disease", "t_mod", "t_high", "Low / Moderate / High share of people (test)", "Share of all people with the label who land in Low (test)"],
      rows: [
        ["Diabetes", "0.1246", "0.2774", "56.3% / 28.1% / 15.6%", "14.5%"],
        ["Heart", "0.1026", "0.1607", "64.8% / 15.7% / 19.5%", "16.2%"],
        ["Stroke", "0.0345", "0.0877", "65.9% / 19.4% / 14.7%", "20.8%"],
      ],
    },
    {
      type: "callout",
      kind: "warning",
      title: "About 1 in 5 cases can still show Low",
      text: "Because the Moderate cut-off aims at 80% recall, up to about 20% of people with the label get **Low**. This was accepted on purpose and is said openly to users (decision D-23). Low never means \"you are fine\".",
    },
    {
      type: "p",
      text: "**From bands to next steps.** The model never decides the next step on its own. Fixed rules on the server do, in this order (first match wins): emergency red flags → show 108 / 112; answers that fail checks → ask to correct; any condition \"not confident\" → see a doctor; any High → see a doctor soon; any Moderate → discuss at the next check-up; otherwise routine check-up. Emergency, not-confident and High cases also go to the clinician review queue. See [Understanding results](/admin/docs/understanding-results).",
    },

    // ── Uncertainty ──
    { type: "h2", id: "uncertain-results", text: "When the model says \"not confident\"" },
    {
      type: "p",
      text: "Each model can **abstain** (decline to give a level). Two checks, both trained and saved in the artifacts folder, decide this:",
    },
    {
      type: "list",
      items: [
        "**Conformal prediction** (`conformal.json`): a method that gives a set of possible answers with a promised hit rate. VITALNEX uses \"Mondrian split conformal\" with α = 0.1, so each class (with / without label) is covered about 90% of the time. If the set contains **both** \"yes\" and \"no\", the model is unsure and abstains.",
        "**Out-of-distribution check** (`ood.joblib`): an IsolationForest (a method that spots unusual rows) with 200 trees. If a person's answers look stranger than 99% of the training rows, the model abstains, because it has seen too few people like them.",
      ],
    },
    {
      type: "table",
      head: ["Test result", "Diabetes", "Heart", "Stroke"],
      rows: [
        ["Coverage, people without label (target 0.90)", "0.901", "0.926", "0.910"],
        ["Coverage, people with label (target 0.90)", "0.903", "0.926", "0.922"],
        ["Abstained by conformal", "36.2%", "38.0%", "43.9%"],
        ["Unusual answers (out-of-distribution)", "1.0%", "1.1%", "1.0%"],
        ["Abstained in total", "36.8%", "38.5%", "44.4%"],
        ["Abstained among people with the label", "45.4%", "50.6%", "53.7%"],
      ],
    },
    {
      type: "p",
      text: "When a condition abstains, the patient sees **no score and no level** for it, only \"not confident, please see a doctor\", and the case goes to clinician review (decision D-10). Clinicians can see the score. The high abstention rate (37–44%, above the team's 30% warning line) was accepted at sign-off (decision D-22), and α stays 0.10.",
    },

    // ── Explanations ──
    { type: "h2", id: "explanations", text: "How results are explained (SHAP)" },
    {
      type: "p",
      text: "**SHAP** (SHapley Additive exPlanations) is a method that splits a score into how much each answer pushed it up or down. SHAP really runs in VITALNEX: TreeExplainer for the LightGBM models and LinearExplainer for the stroke Logistic Regression, with 200 training rows as the comparison base (`shap_background.json`).",
    },
    {
      type: "p",
      text: "For each person, the server takes the **top 3** answers with the biggest effect and turns them into fixed sentences such as \"… raises\" or \"… lowers\" (from `apps/api/content/explanations.<lang>.json`). It also shows factors that matter for two or more conditions at once.",
    },
    {
      type: "table",
      head: ["Rank (average effect, cal-B)", "Diabetes", "Heart", "Stroke"],
      rows: [
        ["1", "General health (0.639)", "Age (0.712)", "Age (0.505)"],
        ["2", "High blood pressure (0.509)", "General health (0.507)", "General health (0.409)"],
        ["3", "Age (0.449)", "High blood pressure (0.428)", "High blood pressure (0.319)"],
        ["4", "BMI (0.423)", "High cholesterol (0.336)", "Difficulty walking (0.196)"],
        ["5", "High cholesterol (0.343)", "Sex (0.298)", "High cholesterol (0.141)"],
      ],
    },
    {
      type: "callout",
      kind: "info",
      title: "Associations, not causes",
      text: "The data is from one survey at one time. Some answers (poor general health, difficulty walking, unwell days) may be **results** of the condition, not causes. So explanations describe what the model noticed, not what caused the condition or what will fix it.",
    },

    // ── Fairness ──
    { type: "h2", id: "fairness", text: "Fairness: how the models do for different groups" },
    {
      type: "p",
      text: "The training code checks the test results for each group using `fairlearn`. A person counts as **flagged** if the calibrated score is at or above the Moderate cut-off. Groups checked: **sex**, **age group** (18–39 / 40–59 / 60+), and four audit-only groups: income, education, health coverage and cost barrier to seeing a doctor. Gaps are **reported, not judged** against any legal rule.",
    },
    { type: "h3", text: "By sex (recall = share of people with the label who are flagged)" },
    {
      type: "table",
      head: ["Disease", "Female recall", "Male recall", "Gap", "Female FPR", "Male FPR"],
      rows: [
        ["Diabetes", "0.847", "0.864", "0.017", "0.342", "0.405"],
        ["Heart", "0.779", "0.882", "**0.103**", "0.240", "0.381"],
        ["Stroke", "0.793", "0.790", "0.003", "0.320", "0.324"],
      ],
    },
    { type: "h3", text: "By age group" },
    {
      type: "table",
      head: ["Disease", "Recall 18–39", "Recall 40–59", "Recall 60+", "Gap", "FPR 18–39 → 60+"],
      rows: [
        ["Diabetes", "0.396", "0.792", "0.905", "**0.509**", "0.051 → 0.563"],
        ["Heart", "0.118", "0.660", "0.901", "**0.783**", "0.014 → 0.532"],
        ["Stroke", "0.170", "0.634", "0.862", "**0.692**", "0.014 → 0.548"],
      ],
    },
    {
      type: "p",
      text: "**Other gaps above the 0.1 warning line (recall):** income: diabetes 0.136, heart 0.120, stroke 0.244; education: stroke 0.110. Heart's sex gap (0.103) is also just above the line.",
    },
    {
      type: "callout",
      kind: "warning",
      title: "The big one: younger people",
      text: "The models catch far fewer cases in people aged 18–39 (recall 0.12–0.40) than in people 60+ (0.86–0.91). Few young people in the data have these conditions, so their scores stay below the cut-off.",
    },
    { type: "h3", text: "What was tried, and what was decided" },
    {
      type: "p",
      text: "A fix was tested (`python -m ml.training.mitigation`, results in `docs/fairness_mitigation.md`): give each age group its own Moderate cut-off. It raised recall for 18–39 to 0.759 (diabetes), 0.763 (heart) and 0.792 (stroke), but their false-positive rate jumped to 0.286, 0.275 and 0.397 — many more young people flagged who do not have the label.",
    },
    {
      type: "p",
      text: "Decision D-24: the fix was **not adopted**. Instead, the gap is shown openly on the Trust Passport, and users **under 40** see a note that results are less reliable for their age group. See [Trust Passport](/admin/docs/trust-passport).",
    },

    // ── Screenshots ──
    { type: "h2", id: "where-to-see-it", text: "Where to see these numbers in the app" },
    {
      type: "p",
      text: "Sign in as an admin (demo: `admin@vitalnex.demo`) and open **Governance & audit** (`/admin/governance`). Only the admin role can open it. The first two sections show the live model numbers, read by the server from `model_meta.json`.",
    },
    {
      type: "image",
      src: "/docs/models-and-data/registry.png",
      alt: "Model registry table on the Governance & audit page, one row per condition",
      caption: "Model registry on /admin/governance (admin account).",
      markers: [
        { n: 1, text: "One row per condition: version, chosen model, training date and the first 12 characters of the data hash (hover to see the full hash)." },
        { n: 2, text: "Test AUROC with its 95% range, Brier score, recall at the Moderate threshold and abstention rate — the same numbers as the tables above." },
        { n: 3, text: "\"Model card\" opens the full model card for that condition in a new tab." },
        { n: 4, text: "\"Flags\": click to open the list of warnings the training code raised (for example abstention above 30%, age recall gap)." },
      ],
    },
    {
      type: "image",
      src: "/docs/models-and-data/fairness.png",
      alt: "Fairness section on the Governance & audit page with per-group tables",
      caption: "Fairness section on /admin/governance.",
      markers: [
        { n: 1, text: "Condition name and model version. Below it: how \"flagged\" is defined and which columns were used only for the audit." },
        { n: 2, text: "Group name with a plain sentence built only from the numbers (lowest and highest recall, false-positive range)." },
        { n: 3, text: "Per-group table: people, recall, false-positive rate, precision, observed rate and abstention." },
        { n: 4, text: "Largest gap in recall and false-positive rate for this grouping." },
      ],
    },

    // ── Assistant ──
    { type: "h2", id: "assistant-model", text: "The assistant's intent model" },
    {
      type: "p",
      text: "The chat assistant does **not** write its own answers. A small model only decides the **intent** (what the message is about), choosing from 11 intents such as \"explain my result\", \"book a doctor\", \"medicine request\" or \"emergency\". Every reply is pre-written. There is no generative model and no outside API. Details: `docs/model_cards/assistant.md`; see also [AI assistant](/admin/docs/ai-assistant).",
    },
    {
      type: "list",
      items: [
        "**Encoder**: `l3cube-pune/indic-sentence-bert-nli` (licence CC-BY-4.0), run on the server's CPU and frozen (not retrained). It turns a message into 768 numbers. About 39.7 ms per message.",
        "**Classifier**: a small neural network (MLP) on top. Chosen from three options by best validation score before testing.",
        "**Data**: 1,320 training and 330 test messages in English, Hindi and Marathi (including romanised Hindi/Marathi). All were **written by Claude Code** (synthetic), not real users, so real accuracy will be lower.",
      ],
    },
    {
      type: "table",
      head: ["Test result (with \"out of scope\" cut-off 0.45)", "English", "Hindi", "Marathi"],
      rows: [
        ["Accuracy", "0.882", "0.927", "0.891"],
        ["Macro-F1 (average quality across all intents)", "0.882", "0.926", "0.891"],
        ["Weakest intent (F1)", "Medicine request (0.78)", "Out of scope (0.80)", "Explain result (0.76)"],
      ],
    },
    { type: "h3", text: "Emergency safety" },
    {
      type: "p",
      text: "Fixed emergency word rules run **first**, then the classifier acts as a backstop. On the test set, emergency recall was 1.000, but the rules were extended after seeing test misses, so that number is optimistic.",
    },
    {
      type: "callout",
      kind: "info",
      title: "The honest emergency figure: 29 of 30",
      text: "A separate hold-out of 30 emergency messages was written after the rules were finished. The full pipeline caught **29 of 30** (0.967). The one miss (romanised Marathi, \"feels like someone is sitting on my chest\") and similar \"chest heavy / pressure\" wordings were then added to the rules (decision D-25). Because that miss has now been seen, the hold-out is no longer an untouched test; a new hold-out is needed to re-measure.",
    },
    {
      type: "p",
      text: "Bare red-flag words such as \"stroke\", \"heart attack\" or \"chest pain\" (and Hindi/Marathi versions) **always** show the 108 / 112 card (decision D-26). This shows the card on 6.0% of non-emergency test messages, a deliberate trade of convenience for safety. Message text is never stored; only the intent, confidence and emergency flag are logged.",
    },

    // ── Retrain ──
    { type: "h2", id: "how-to-retrain", text: "How to retrain" },
    {
      type: "callout",
      kind: "danger",
      title: "Retraining is always manual",
      text: "VITALNEX **never** retrains by itself, and never learns from user answers or clinician overrides (hard rule 9). Only a developer runs these commands, on purpose, and the team reviews the new model cards before use.",
    },
    {
      type: "steps",
      items: [
        { title: "Install", text: "Create a Python environment and run `pip install -r apps/api/requirements.txt -r ml/requirements.txt`." },
        { title: "Get and prepare the data", text: "Run `python -m ml.data.download`, then `python -m ml.data.prepare`, then `python -m ml.data.data_card`." },
        { title: "Train the three models", text: "Run `python -m ml.training.train_all` (or name one disease, e.g. `python -m ml.training.train_all stroke`). It runs on a laptop CPU; no graphics card is needed." },
        { title: "Re-render the model cards", text: "Run `python -m ml.training.model_card`. Optional: `python -m ml.training.mitigation` re-runs the age-threshold experiment." },
        { title: "Retrain the assistant (optional)", text: "Run `python -m ml.nlp.train_intents`. It rewrites `docs/model_cards/assistant.md`." },
        { title: "Test and restart", text: "Run `python -m pytest tests -v`. Then restart the API (`uvicorn apps.api.main:app --reload --port 8000`): models are loaded once at start-up." },
        { title: "Update this page", text: "Copy the new numbers from the new model cards into this documentation page, so the docs never show old numbers." },
      ],
    },
    {
      type: "code",
      lang: "bash",
      code: "pip install -r apps/api/requirements.txt -r ml/requirements.txt\npython -m ml.data.download\npython -m ml.data.prepare\npython -m ml.data.data_card\npython -m ml.training.train_all\npython -m ml.training.model_card\npython -m ml.nlp.train_intents      # assistant (optional)\npython -m pytest tests -v",
    },
    {
      type: "table",
      head: ["File in ml/artifacts/<disease>/", "What it holds"],
      rows: [
        ["`model.joblib`", "The trained model"],
        ["`calibrator.joblib`", "The isotonic calibration step"],
        ["`conformal.json`", "The \"not confident\" thresholds (q0, q1)"],
        ["`ood.joblib`", "The unusual-answers check"],
        ["`shap_background.json`", "200 training rows used by SHAP"],
        ["`model_meta.json`", "Every number: metrics, thresholds, fairness, flags, library versions, data hash"],
        ["`model_card.md`", "Human-readable report made from `model_meta.json`"],
        ["`reliability.png`, `shap_global.png`, `training_curves.png`", "Charts"],
      ],
    },

    // ── Limitations ──
    { type: "h2", id: "limitations", text: "Honest limitations" },
    {
      type: "list",
      items: [
        "**Not a diagnosis.** Labels are \"ever told by a doctor\". The models show similarity to people who were told they have a condition; they cannot say if someone has it.",
        "**Not future risk.** The survey is a single snapshot, so the models do not predict who will get a condition in 10 years.",
        "**US data, not Indian.** Not validated on Indian users; smokeless tobacco and bidis are missing; BMI thresholds differ.",
        "**Misses happen.** Up to about 1 in 5 people with the label get Low, and recall is much lower for people under 40.",
        "**Many \"not confident\" results** (37–44%), which sends many people to a doctor instead of giving a level.",
        "**Merged labels.** Diabetes includes prediabetes; heart includes both coronary heart disease and heart attack.",
        "**Self-reported answers** can be wrong, and undiagnosed people count as \"no\", so groups with less access to care may be under-flagged.",
        "**Assistant data is synthetic** and the Hindi/Marathi lines still wait for native-speaker review.",
        "**Not for under-18s**, and never for choosing, naming or dosing medicines.",
      ],
    },

    // ── NITI ──
    { type: "h2", id: "niti-principles", text: "Which NITI Aayog principles this follows" },
    {
      type: "niti",
      items: [
        {
          id: "transparency",
          how: [
            "Every model has a model card made by code from `model_meta.json`; nothing is typed by hand.",
            "The admin model registry and fairness tables read those same files live, and each row links to the model card.",
            "Only methods that really ran are named: isotonic calibration, conformal prediction and SHAP all have saved artifacts.",
            "Weak points are written down openly: flags in each model card, the 29/30 emergency figure, and \"calibration did not improve Brier\".",
          ],
        },
        {
          id: "equality",
          how: [
            "Test results are broken down by sex, age group, income, education, coverage and cost barrier, with the largest gap shown.",
            "The age recall gap was tested with per-age cut-offs (`docs/fairness_mitigation.md`), and the trade-off was decided in the open (D-24).",
            "Users under 40 see a note that results are less reliable for their age group.",
            "\"Prefer not to say\" for sex runs both versions and keeps the higher level, so nobody gets a lower level by not answering (D-9).",
          ],
        },
        {
          id: "safety_reliability",
          how: [
            "The test group is used once, after model choice; the code stops if a model saw non-training rows or a different data file.",
            "When unsure (conformal) or when answers look unusual (out-of-distribution), the model gives no level and the case goes to clinician review.",
            "Emergency rules run before any model and always show 108 / 112.",
            "Moderate cut-off is set to catch at least 80% of cases on cal-B.",
          ],
        },
        {
          id: "accountability",
          how: [
            "Each model has a version, training date, data hash and library versions, so any result can be traced to the exact model.",
            "Model choice, bands, abstention and the age gap were signed off by the team as decisions D-20 to D-25.",
            "Retraining is manual only; user data and clinician overrides are never used to retrain automatically.",
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
          q: "Does a High result mean the person has the condition?",
          a: "No. It means their answers are similar to people who said a doctor had told them they have it. For stroke, only 14.5% of people in the High band had the label in the test group. High means \"see a doctor soon\", and a clinician reviews the case.",
        },
        {
          q: "Why are the models trained on US data?",
          a: "The team chose BRFSS because it is large, public, has a clear licence, covers all three conditions in one file and uses simple questions a person can answer at home (decision D-3). The US origin is a real limit: the models have not been validated on Indian users, and this is stated in every model card.",
        },
        {
          q: "Is the Pune dataset real patient data?",
          a: "No. It is synthetic (made up). It is used only for demo profiles and stress tests, never for training or for any reported number.",
        },
        {
          q: "Why does the model say \"not confident\" so often?",
          a: "The conformal check abstains whenever both answers (with / without the label) stay possible at a 90% guarantee. With only 14 simple answers, that happens for 37–44% of people. The team chose safety: those people are told to see a doctor and a clinician reviews them.",
        },
        {
          q: "Why was stroke given a simpler model?",
          a: "On cal-B, Logistic Regression and the neural network both scored 0.808 AUROC and LightGBM 0.807. The fixed rule gives ties to the simpler model, which is also easier to explain.",
        },
        {
          q: "Does the app learn from users over time?",
          a: "No. Nothing retrains automatically. User answers and clinician overrides are never fed back into the models.",
        },
        {
          q: "Does any health data go to an outside AI service?",
          a: "No. All models, including the assistant's encoder, run on the VITALNEX server's CPU.",
        },
        {
          q: "Where do I check the current numbers?",
          a: "On `/admin/governance` (Model registry and Fairness sections) or in `ml/artifacts/<disease>/model_card.md`. If they differ from this page, the files are right and this page needs updating.",
        },
      ],
    },
  ],
};

export default page;
