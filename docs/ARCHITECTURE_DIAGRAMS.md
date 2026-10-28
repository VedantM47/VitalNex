# VITALNEX — Architecture diagrams

Six core diagrams, written in Mermaid. They render on GitHub, in VS Code (with a Mermaid preview
extension) and at <https://mermaid.live>. Every component, table, threshold and number below is
taken from the code, `ml/artifacts/<disease>/model_meta.json` or `docs/DECISIONS.md`.

1. [System architecture](#1-system-architecture)
2. [ML training pipeline](#2-ml-training-pipeline)
3. [Assessment request flow](#3-assessment-request-flow)
4. [Next-step decision rules](#4-next-step-decision-rules)
5. [Database ER diagram](#5-database-er-diagram)
6. [NITI Aayog principle traceability map](#6-niti-aayog-principle-traceability-map)

---

## 1. System architecture

Everything that touches health data runs on the VITALNEX server. No third-party AI or analytics API
is called (CLAUDE.md hard rule 6).

```mermaid
flowchart LR
    subgraph Client["Browser"]
        WEB["Next.js 16 web app<br/>EN / HI / MR<br/>patient · clinician · admin"]
    end

    subgraph Server["VITALNEX server (CPU laptop)"]
        API["FastAPI<br/>routers → services → schemas"]
        subgraph Local["Local models (no external calls)"]
            ML["Screening models<br/>ml/artifacts/diabetes · heart · stroke<br/>LightGBM / LR + isotonic + conformal + OOD"]
            NLP["Assistant NLP<br/>l3cube-pune/indic-sentence-bert-nli<br/>+ intent head + FAQ library"]
            RULES["Deterministic rules<br/>emergency · medicine refusal · next step"]
        end
        PDF["reportlab PDF · qrcode"]
    end

    subgraph Cloud["Supabase (region ap-south-1, Mumbai)"]
        AUTH["Supabase Auth<br/>JWT sign-in"]
        DB[("Postgres<br/>Row Level Security")]
    end

    WEB -- "sign in" --> AUTH
    WEB -- "Bearer JWT · JSON" --> API
    API -- "verify JWT (JWKS)" --> AUTH
    API --> RULES
    API --> ML
    API --> NLP
    API --> PDF
    API -- "user client (RLS applies)" --> DB
    API -- "service role (server-only writes)" --> DB

    classDef local fill:#e8f5e9,stroke:#2e7d32,color:#1b1b1b;
    class ML,NLP,RULES local;
```

| Layer | Technology | Responsibility |
|---|---|---|
| Web | Next.js 16, React 19, Tailwind, Recharts | Forms, results, clinician and admin workspaces, Trust Passport |
| API | FastAPI, Pydantic v2 | Validation, rules, model scoring, role-shaped responses, audit |
| ML | scikit-learn, LightGBM, PyTorch (CPU), SHAP, fairlearn | 3 screening models + calibration, abstention, explanations |
| NLP | sentence-transformers (local encoder) | Intent classification and FAQ retrieval, no generated text |
| Data | Supabase Postgres + Auth + RLS | Accounts, consents, assessments, review queue, audit |

---

## 2. ML training pipeline

One run per disease (`python -m ml.training.train_all`). The test split is used once, after the
model choice is fixed.

```mermaid
flowchart TD
    A["CDC BRFSS 2015<br/>UCI id 891 · 253,680 rows"] --> B["prepare.py<br/>column contract · ranges · SHA-256 hash"]
    B --> C{"Stratified split · seed 42"}
    C --> TR["Train 60%"]
    C --> CA["Cal-A 10%"]
    C --> CB["Cal-B 10%"]
    C --> TE["Test 20%<br/>(locked)"]

    TR --> M1["Logistic Regression"]
    TR --> M2["LightGBM"]
    TR --> M3["PyTorch MLP<br/>14→64→32→1"]
    M1 & M2 & M3 --> CV["3-fold CV grid on train"]

    CV --> ISO["Isotonic calibration<br/>fitted on Cal-A"]
    CA --> ISO
    ISO --> SEL{"Select on Cal-B<br/>best AUROC unless within 0.005<br/>with better Brier → simpler"}
    CB --> SEL

    SEL --> BAND["Bands on Cal-B<br/>t_mod: recall ≥ 0.80<br/>t_high: precision ≥ 3× prevalence"]
    SEL --> CONF["Mondrian conformal on Cal-B<br/>α = 0.10 per class"]
    TR --> OOD["IsolationForest OOD<br/>99th percentile"]
    SEL --> SHAP["SHAP explainer<br/>200 background rows"]

    BAND & CONF & OOD & SHAP --> EVAL["Final evaluation on Test<br/>AUROC · Brier · 500 bootstrap CIs<br/>de-duplicated check"]
    TE --> EVAL
    EVAL --> FAIR["fairlearn audit<br/>sex · age · income · education · access"]
    FAIR --> META["model_meta.json + model_card.md<br/>ml/artifacts/&lt;disease&gt;/"]
    META --> GATE(["Human sign-off · P3 gate"])

    SYN["Pune synthetic dataset"] -. "demo profiles and stress tests only<br/>never training or metrics (D-4)" .-> X["Demo / tests"]
```

**Result (test set, from `model_meta.json`):**

| Disease | Chosen model | Test AUROC (95% CI) | Abstention |
|---|---|---|---|
| Diabetes / prediabetes | LightGBM | 0.824 (0.819–0.828) | 37% |
| Heart disease / attack | LightGBM | 0.842 (0.836–0.848) | 39% |
| Stroke | Logistic Regression | 0.810 (0.801–0.819) | 44% |

---

## 3. Assessment request flow

`POST /api/v1/assessment`. The order follows SPEC §1.4. Free text is checked for red flags and never stored.

```mermaid
sequenceDiagram
    autonumber
    actor P as Patient
    participant W as Web app
    participant A as FastAPI
    participant R as Rules engine
    participant M as 3 disease models
    participant D as Supabase (Postgres)

    P->>W: Fill 6-step form (14 answers + symptom ticks)
    W->>A: POST /assessment (JWT)
    A->>A: Verify JWT, role = patient
    A->>A: Pydantic validation (ranges, no defaults)
    alt invalid or missing answer
        A-->>W: 422 with field names
    end
    A->>D: Read consents
    alt no assessment_processing consent
        A-->>W: 403 consent required
    end
    A->>R: Emergency red flags (ticks + free text)
    alt emergency
        R-->>A: next_step = emergency (models NOT run)
    else no emergency
        A->>R: Data-quality gate (BMI 12–70)
        alt gate failed
            R-->>A: next_step = correct_inputs
        else gate passed
            A->>M: Predict (both sexes if "prefer not to say", D-9)
            M-->>A: calibrated p · band · conformal set · OOD · SHAP top 3
            A->>R: Next-step rules + guidance + notes (age < 40, D-24)
        end
    end
    opt store_history consent
        A->>D: INSERT risk_assessments (with model versions)
        opt queue needed AND share_with_clinician consent
            A->>D: INSERT review_queue (reasons)
        end
    end
    opt no store_history consent
        A->>D: INSERT audit_logs (no health data)
    end
    A->>A: Shape for patient: bands + text only, no probabilities (D-10)
    A-->>W: Result
    W-->>P: Three condition cards · next step · why · what can change · how sure
```

---

## 4. Next-step decision rules

Deterministic: the model output never decides on its own. First match wins.

```mermaid
flowchart TD
    S([Assessment submitted]) --> E{"1. Emergency red flag?<br/>symptom tick or red-flag words"}
    E -- yes --> E1["🚨 Call 108 / 112 now<br/>no scores shown"]:::red
    E1 --> Q1[["Review queue: emergency"]]
    E -- no --> G{"2. Data-quality gate failed?<br/>impossible BMI"}
    G -- yes --> G1["Please correct your answers"]:::grey
    G -- no --> AB{"3. Any disease abstained?<br/>conformal set {0,1} or OOD"}
    AB -- yes --> AB1["Not confident for you —<br/>please see a doctor<br/>(no band for that disease)"]:::amber
    AB1 --> Q2[["Review queue: abstained"]]
    AB -- no --> H{"4. Any disease High?"}
    H -- yes --> H1["See a doctor soon<br/>(within 2 weeks)"]:::orange
    H1 --> Q3[["Review queue: high_band"]]
    H -- no --> MO{"5. Any disease Moderate?"}
    MO -- yes --> MO1["Discuss at your next check-up"]:::yellow
    MO -- no --> L1["All Low: keep up regular check-ups"]:::green

    Q1 & Q2 & Q3 -.-> C{"share_with_clinician<br/>consent?"}
    C -- yes --> CL["Clinician: Agree or Override<br/>(reason required, logged)"]
    C -- no --> N["Patient told to see a doctor directly"]

    classDef red fill:#fdecea,stroke:#c62828,color:#1b1b1b;
    classDef amber fill:#fff4e5,stroke:#ef6c00,color:#1b1b1b;
    classDef orange fill:#fff0e0,stroke:#e65100,color:#1b1b1b;
    classDef yellow fill:#fffde7,stroke:#f9a825,color:#1b1b1b;
    classDef green fill:#e8f5e9,stroke:#2e7d32,color:#1b1b1b;
    classDef grey fill:#f2f2f2,stroke:#757575,color:#1b1b1b;
```

Bands (calibrated probability *p*, thresholds from Cal-B): **Low** p < t_mod · **Moderate**
t_mod ≤ p < t_high · **High** p ≥ t_high. These are screening bands, not clinical cut-offs.

---

## 5. Database ER diagram

Main tables (Supabase Postgres, RLS on every table). Doctor and appointment tables are shown in brief.

```mermaid
erDiagram
    profiles ||--o{ consents : "grants"
    profiles ||--o| health_profiles : "has"
    profiles ||--o{ risk_assessments : "owns"
    risk_assessments ||--o| review_queue : "may enter"
    risk_assessments ||--o{ clinician_overrides : "reviewed by"
    profiles ||--o{ clinician_overrides : "clinician writes"
    profiles ||--o{ share_tokens : "creates"
    share_tokens ||--o{ share_access_log : "opened"
    profiles ||--o{ data_requests : "requests"
    profiles ||--o{ assistant_logs : "chats"
    profiles ||--o{ audit_logs : "acts"
    doctors ||--o{ doctor_slots : "offers"
    profiles ||--o{ appointments : "books"
    doctors ||--o{ appointments : "receives"

    profiles {
        uuid id PK
        text role "patient | doctor | admin"
        text preferred_language "en | hi | mr"
        bool is_demo
    }
    consents {
        uuid user_id FK
        text purpose "assessment_processing | store_history | share_with_clinician | aggregate_audit"
        bool granted
        timestamptz withdrawn_at
        text notice_version
    }
    health_profiles {
        uuid user_id FK
        jsonb answers "14-answer contract"
    }
    risk_assessments {
        uuid id PK
        uuid user_id FK
        text assessment_mode "live | demo"
        jsonb inputs
        jsonb results "per disease: band, p, conformal set, factors"
        text next_step
        bool emergency_flag
        text review_status
        jsonb model_versions
    }
    review_queue {
        uuid id PK
        uuid assessment_id FK
        uuid patient_id FK
        text_array reasons "high_band | abstained | data_quality | emergency"
        text status "pending | agreed | overridden"
        text clinician_note
    }
    clinician_overrides {
        uuid id PK
        uuid assessment_id FK
        text disease
        text model_band
        text clinician_band
        text reason_code
        uuid clinician_id FK
        text model_version
    }
    share_tokens {
        uuid id PK
        uuid user_id FK
        text token_hash "SHA-256 only"
        jsonb scope
        timestamptz expires_at
        timestamptz revoked_at
    }
    share_access_log {
        uuid token_id FK
        timestamptz accessed_at
        text accessor_role
    }
    data_requests {
        uuid user_id FK
        text type "export | deletion"
        text status
    }
    assistant_logs {
        uuid user_id FK
        text intent
        real confidence
        bool emergency_flag "no message text stored"
    }
    audit_logs {
        uuid user_id FK
        text action
        text resource_type
        jsonb metadata
    }
    doctors {
        uuid id PK
        text specialization
        bool is_demo
    }
    doctor_slots {
        uuid id PK
        uuid doctor_id FK
        timestamptz starts_at
    }
    appointments {
        uuid id PK
        uuid patient_id FK
        uuid doctor_id FK
        uuid slot_id FK
    }
```

**Access rules (RLS):** a patient reads only their own rows. A clinician reads only patients who granted
`share_with_clinician`. An admin sees aggregates and the audit log, never patient records.
`clinician_overrides` is never read by any training code (hard rule 9).

---

## 6. NITI Aayog principle traceability map

Source: `apps/api/content/principle_map.json`. The Trust Passport resolves each evidence item live
from model metadata and the database, and shows "not available" when a value can't be computed.

```mermaid
flowchart LR
    subgraph P["Principle"]
        P1["Safety & Reliability"]
        P2["Equality"]
        P3["Inclusivity & Non-discrimination"]
        P4["Privacy & Security"]
        P5["Transparency"]
        P6["Accountability"]
        P7["Positive Human Values"]
    end

    subgraph F["Implemented by"]
        F1["Data-quality gate · Conformal abstention<br/>OOD check · Emergency override<br/>Recall-first bands"]
        F2["Fairness audit across sex / age /<br/>income / education / access"]
        F3["EN / HI / MR UI · Plain-language explanations<br/>Sensitive attributes excluded<br/>Per-language NLP accuracy"]
        F4["Purpose-specific consent · Data minimisation<br/>RLS · No third-party APIs<br/>Revocable QR shares · No chat text stored"]
        F5["Trust Passport · Model cards<br/>Per-result why + how sure<br/>Honest limitations"]
        F6["Clinician review queue · Override log<br/>Audit log · Versioned models<br/>Human sign-off gates"]
        F7["Non-diagnostic wording · No medicine advice<br/>Recourse only on changeable factors<br/>Patient-held record"]
    end

    subgraph E["Live evidence"]
        E1["Coverage per class · Abstention rate<br/>Emergency triggers count"]
        E2["Recall & FPR gap tables"]
        E3["Language parity table<br/>Excluded-features list"]
        E4["Consent rates · Share revocations<br/>Data-request log"]
        E5["Model card version · Data hash"]
        E6["Override rate by disease<br/>Audit entries"]
        E7["Medication-refusal count<br/>Recourse usage"]
    end

    P1 --> F1 --> E1
    P2 --> F2 --> E2
    P3 --> F3 --> E3
    P4 --> F4 --> E4
    P5 --> F5 --> E5
    P6 --> F6 --> E6
    P7 --> F7 --> E7
```

Known gap: "Recourse usage" shows "not available", because what-if and recourse calls are not recorded.
