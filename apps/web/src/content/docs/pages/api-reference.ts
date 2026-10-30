import type { DocPage } from "../types";

// Every endpoint below was read from apps/api/routers/v1/*.py, apps/api/main.py and apps/api/schemas/*.py.
// Example bodies come from docs/api_examples.md or from safe GET calls to the local API.

const page: DocPage = {
  slug: "api-reference",
  title: "API reference",
  summary:
    "Every address (endpoint) the VITALNEX server answers, who may call it, what you send and what you get back. Written for developers who want to build on or test the backend.",
  audience: "Developers",
  blocks: [
    // ── Overview ──
    { type: "h2", id: "overview", text: "What this page covers" },
    {
      type: "p",
      text: "VITALNEX has two parts: the web app (Next.js, in `apps/web`) and the server (FastAPI, in `apps/api`). The web app never talks to the screening models directly. It sends requests to the server's **API** (Application Programming Interface: a fixed list of web addresses that accept and return data in JSON format). This page lists every one of those addresses that is really switched on in `apps/api/main.py` and `apps/api/routers/v1/`.",
    },
    {
      type: "list",
      items: [
        "**Base address (local):** `http://localhost:8000`.",
        "**Version prefix:** almost every endpoint starts with `/api/v1` (set by `API_V1_PREFIX` in `apps/api/core/config.py`). Only `/`, `/health`, `/docs`, `/redoc` and `/openapi.json` live outside it.",
        "**Format:** requests and responses are JSON, except the PDF report (a PDF file), the model card (plain Markdown text) and the Trust Passport images (PNG).",
        "**Interactive docs:** FastAPI builds a live, clickable list of all endpoints at `http://localhost:8000/docs` (Swagger UI) and `http://localhost:8000/redoc`. The machine-readable version is `/openapi.json`.",
      ],
    },
    {
      type: "image",
      src: "/docs/api-reference/swagger.png",
      alt: "The FastAPI Swagger page at localhost:8000/docs listing the VITALNEX endpoints grouped by area.",
      caption: "The automatic Swagger page at http://localhost:8000/docs.",
      markers: [
        { n: 1, text: "API title, version and description, taken from `apps/api/main.py`." },
        { n: 2, text: "The Authorize button. Paste a Supabase access token here to try signed-in endpoints." },
        { n: 3, text: "One group of endpoints (here: Health, the first group). Click a row to see its fields and try it." },
      ],
    },
    {
      type: "callout",
      kind: "info",
      title: "Demo only",
      text: "This is an MVP (first small working version). All accounts are synthetic demo accounts and all doctors are synthetic demo doctors. The API gives screening levels, not a diagnosis.",
    },
    {
      type: "table",
      head: ["Area", "Address starts with", "Main users"],
      rows: [
        ["Health check", "`/health`, `/api/v1/health`", "Anyone"],
        ["Session, profile and my data", "`/api/v1/me`, `/api/v1/profile`, `/api/v1/health-profile`, `/api/v1/consents`", "Signed-in users (most parts patients only)"],
        ["Screening (assessments)", "`/api/v1/assessment`, `/api/v1/what-if`, `/api/v1/recourse`", "Patients (what-if and recourse also doctors)"],
        ["History and PDF reports", "`/api/v1/assessment/history`, `/api/v1/reports`", "Patients"],
        ["Assistant", "`/api/v1/assistant/message`", "All signed-in roles"],
        ["Care Connect (doctors and booking)", "`/api/v1/doctors`, `/api/v1/appointments`", "Anyone (directory), patients and doctors (bookings)"],
        ["Trust Passport, consent, QR sharing", "`/api/v1/trust-passport`, `/api/v1/shares`, `/api/v1/share/{token}`", "Anyone (passport, share link), patients (shares)"],
        ["Clinician (doctor) workspace", "`/api/v1/doctor/...`", "Doctors only"],
        ["Models and governance", "`/api/v1/models`, `/api/v1/governance/summary`, `/api/v1/admin/governance/...`", "Anyone (model facts), admins (governance)"],
      ],
    },

    // ── Authentication ──
    { type: "h2", id: "authentication", text: "How sign-in works (authentication)" },
    {
      type: "p",
      text: "Users sign in through **Supabase Auth** (the login service of the Supabase database platform) in the web app. After sign-in, Supabase gives the browser an **access token** (a long, signed piece of text that proves who you are; also called a JWT). The web app sends this token with every API call in an HTTP header:",
    },
    { type: "code", lang: "http", code: "Authorization: Bearer <supabase access token>" },
    {
      type: "steps",
      items: [
        { title: "The server checks the token", text: "`apps/api/core/auth.py` checks the token's signature, its expiry time and that its audience is `authenticated`. New Supabase projects sign tokens with ES256 or RS256; the server fetches the public keys from `<SUPABASE_URL>/auth/v1/.well-known/jwks.json` and keeps them for one hour. Old-style HS256 tokens only work if `SUPABASE_JWT_SECRET` is set." },
        { title: "The server looks up the role", text: "The role (`patient`, `doctor` or `admin`) is read from the `profiles.role` column in the database. It is **never** taken from the token or from anything the user picked on the login page." },
        { title: "The role guard decides", text: "Each endpoint says which roles may call it with `require_role(...)`. A wrong role gets **403** with `You do not have access to this area.`" },
        { title: "The database checks again", text: "Most reads and writes use a database client that acts **as the signed-in user** (`get_user_db`), so Supabase **Row Level Security** (RLS: database rules that decide which rows each person may see) applies too. For example, a doctor can only read a patient's assessment if that patient has turned on sharing with clinicians. Rows you may not see simply come back as **404**." },
      ],
    },
    {
      type: "table",
      head: ["Status", "When", "Body"],
      rows: [
        ["401", "No token, bad token or expired token", "`{\"detail\": \"Not signed in or session expired.\"}`"],
        ["403", "Valid token but no VITALNEX profile", "`{\"detail\": \"No VITALNEX profile for this account.\"}`"],
        ["403", "Valid user, wrong role for this endpoint", "`{\"detail\": \"You do not have access to this area.\"}`"],
      ],
    },
    {
      type: "p",
      text: "To try a signed-in endpoint by hand, sign in to the web app as a demo account, copy the access token from the browser session, and pass it with `curl -H \"Authorization: Bearer <token>\"` or the **Authorize** button on `/docs`. See [Accounts and login](/admin/docs/accounts-and-login) for the demo accounts.",
    },
    { type: "h3", text: "Things every response carries" },
    {
      type: "list",
      items: [
        "`X-Request-ID`: a random id made for each request (added by a middleware in `apps/api/main.py`).",
        "`X-Process-Time`: how long the server took, for example `0.0123s`.",
        "Error bodies always have a `detail` field. For validation errors (**422**) `detail` is the list of field problems from Pydantic (the data-checking library).",
      ],
    },
    { type: "h3", text: "Limits" },
    {
      type: "list",
      items: [
        "**No rate limiting.** The code has no limit on how many requests a client can send. This is fine for a local demo but must be added before any public use.",
        "**Field size limits** come from the schemas: assistant message up to 2,000 characters; assessment `free_text` up to 500; booking reason up to 500; doctor notes up to 2,000; clinician review note up to 2,000 and override note up to 1,000; audit-log page size up to 200.",
        "**Unknown fields are rejected** on the screening, health-profile, share and review bodies (`extra=\"forbid\"`), so a typo returns 422 instead of being ignored.",
        "**CORS** (which websites may call the API from a browser) is limited to the origins in `CORS_ORIGINS` in `apps/api/core/config.py`.",
      ],
    },
    {
      type: "callout",
      kind: "tip",
      title: "No health data leaves the server",
      text: "The screening models, the assistant's sentence encoder and the PDF builder all run on the local server. No endpoint sends health answers to any outside AI or analytics service. The only outside service is your own Supabase project (database and sign-in).",
    },

    // ── Health ──
    { type: "h2", id: "health", text: "Health check" },
    {
      type: "table",
      head: ["Method", "Path", "Who", "What it does"],
      rows: [
        ["GET", "`/`", "Anyone", "Short product info: name, status, where the docs are, the v1 prefix, demo mode and a disclaimer."],
        ["GET", "`/health`", "Anyone", "Says the server is up. Same answer as below."],
        ["GET", "`/api/v1/health`", "Anyone", "Same as `/health`, inside the v1 prefix."],
      ],
    },
    {
      type: "code",
      lang: "json",
      code: `GET /health  ->  200
{
  "status": "healthy",
  "service": "VITALNEX API",
  "version": "1.0.0",
  "environment": "development",
  "demo_mode": true,
  "disclaimer": "VITALNEX is an academic/decision-support research prototype."
}`,
    },
    {
      type: "p",
      text: "The health check only says the web server is running. The three models and the assistant are loaded once when the server starts (`lifespan` in `apps/api/main.py`), so if they fail to load the server does not start at all.",
    },

    // ── Session, profile, my data ──
    { type: "h2", id: "auth-and-profile", text: "Session, profile and my data" },
    {
      type: "table",
      head: ["Method", "Path", "Who", "What it does"],
      rows: [
        ["GET", "`/api/v1/me`", "Any signed-in role", "Your own profile row."],
        ["POST", "`/api/v1/me/login-event`", "Any signed-in role", "The web app calls this right after sign-in. Writes a `LOGIN` audit entry. Returns 204 (no body)."],
        ["POST", "`/api/v1/me/logout-event`", "Any signed-in role", "Writes a `LOGOUT` audit entry. Returns 204."],
        ["GET", "`/api/v1/profile`", "Any signed-in role", "Same profile row as `/me`."],
        ["PUT", "`/api/v1/profile`", "Any signed-in role", "Change your name, phone, preferred language or avatar."],
        ["GET", "`/api/v1/health-profile`", "Patient", "Your saved screening answers (only the ones you answered)."],
        ["PUT", "`/api/v1/health-profile`", "Patient", "Replace your saved answers."],
        ["GET", "`/api/v1/consents/notice`", "Anyone (no sign-in)", "The current consent notice text, so it can be read before sign-up."],
        ["GET", "`/api/v1/consents`", "Patient", "Your four consent choices and their notice text."],
        ["PUT", "`/api/v1/consents/{purpose}`", "Patient", "Turn one consent on or off."],
        ["GET", "`/api/v1/me/data-export`", "Patient", "Download everything VITALNEX holds about you as a JSON file."],
        ["POST", "`/api/v1/me/data-deletion`", "Patient", "Delete your data and your account."],
      ],
    },
    { type: "h3", text: "Profile fields" },
    {
      type: "p",
      text: "A profile response (`ProfileResponse`) has: `id`, `email`, `full_name`, `role`, `phone_number`, `preferred_language` (`en`, `hi` or `mr`), `avatar_url`, `is_demo`, `created_at`, `updated_at`. The PUT body (`ProfileUpdate`) only accepts `full_name` (2–100 characters), `phone_number`, `preferred_language` and `avatar_url`; every field is optional. There is **no** role or email field, and a database trigger also blocks role changes. A missing profile gives **404** `Profile not found.`",
    },
    { type: "h3", text: "Health profile fields" },
    {
      type: "p",
      text: "The health profile holds only the 14 screening questions (same names and limits as the assessment form below). Every answer is optional and has **no default**: a question you skipped stays absent. It is never filled with a \"normal\" value.",
    },
    {
      type: "code",
      lang: "json",
      code: `PUT /api/v1/health-profile
{ "answers": { "age": 45, "sex": "female", "height_cm": 160, "smoker": false } }

200
{ "saved": true, "answers": { "age": 45, "sex": "female", "height_cm": 160.0, "smoker": false }, "updated_at": "..." }`,
    },
    {
      type: "p",
      text: "If you have never saved a profile, GET returns `{\"saved\": false, \"answers\": {}}`. Old saved answers that no longer fit the 14-question form are dropped when read, never converted.",
    },
    { type: "h3", text: "Consents" },
    {
      type: "p",
      text: "There are four consent purposes (`apps/api/schemas/consent.py`): `assessment_processing`, `store_history`, `share_with_clinician` and `aggregate_audit`. Each item in the list has `purpose`, `granted`, `granted_at`, `withdrawn_at`, `notice_version` (now `v1`), `required`, `title`, `notice` and `effect_if_off`. The text comes from `apps/api/content/consent_notices.json`.",
    },
    {
      type: "code",
      lang: "json",
      code: `PUT /api/v1/consents/share_with_clinician
{ "granted": false }

200  ->  the full list of four ConsentStatus items, after the change`,
    },
    {
      type: "list",
      items: [
        "An unknown purpose gives **422** `Unknown consent purpose '...'`.",
        "Turning on sets `granted_at`; turning off sets `withdrawn_at`. The change is written as the user (RLS applies) and a database trigger adds an audit entry.",
        "What each consent changes in the API: without `assessment_processing` the assessment endpoint refuses (403). Without `store_history` results are not saved and the history and reports lists come back empty. Without `share_with_clinician` a result is not sent to the clinician review queue.",
      ],
    },
    { type: "h3", text: "Data export and deletion" },
    {
      type: "p",
      text: "`GET /api/v1/me/data-export` returns a JSON file with the header `Content-Disposition: attachment; filename=\"vitalnex-my-data-YYYYMMDD.json\"` and `Cache-Control: no-store`.",
    },
    {
      type: "code",
      lang: "json",
      code: `POST /api/v1/me/data-deletion
{ "confirm": "DELETE" }

200
{
  "request_id": "...",
  "status": "completed",
  "tables_cleared": ["share_tokens", "appointments", "risk_assessments", "health_profiles",
                     "assistant_logs", "consents", "user_preferences", "voice_preferences",
                     "audit_logs", "profiles"],
  "auth_account_deleted": true
}`,
    },
    {
      type: "callout",
      kind: "danger",
      title: "Deletion cannot be undone",
      text: "The body must be exactly `{\"confirm\": \"DELETE\"}`, otherwise 422. It removes the patient's saved data, audit entries that name them, their profile and their sign-in account. The only thing kept is one audit entry saying a deletion happened, with no user id. If the sign-in account could not be removed, `status` is `failed`. Never call this on a demo account you still need.",
    },

    // ── Assessments ──
    { type: "h2", id: "assessments", text: "Screening (assessments)" },
    {
      type: "table",
      head: ["Method", "Path", "Who", "What it does"],
      rows: [
        ["POST", "`/api/v1/assessment`", "Patient", "Run the three screening models on 14 answers. Saves the result if allowed."],
        ["POST", "`/api/v1/what-if`", "Patient, doctor", "Run the models again with some answers changed. Nothing is saved."],
        ["POST", "`/api/v1/recourse`", "Patient, doctor", "Find the smallest realistic change that would lower a level. Nothing is saved."],
        ["GET", "`/api/v1/assessment/{assessment_id}`", "Patient (own), doctor (consented patients)", "One saved assessment, with any clinician review."],
      ],
    },
    { type: "h3", text: "Request: the 14 answers" },
    {
      type: "p",
      text: "All 14 medical inputs are **required** and have **no default** (`AssessmentInputs` in `apps/api/schemas/assessment.py`). Unknown fields are rejected.",
    },
    {
      type: "table",
      head: ["Field", "Type and allowed values"],
      rows: [
        ["`age`", "Whole number 18–120 (under 18 is blocked)"],
        ["`sex`", "`female`, `male` or `prefer_not_to_say`"],
        ["`height_cm`", "Number 120–220"],
        ["`weight_kg`", "Number 30–250"],
        ["`high_bp`, `high_chol`", "true / false (ever told by a health worker)"],
        ["`smoker`", "true / false (smoked at least 100 cigarettes in your life)"],
        ["`phys_activity`, `fruits`, `veggies`, `heavy_alcohol`, `diff_walk`", "true / false"],
        ["`gen_health`", "Whole number 1 (excellent) to 5 (poor)"],
        ["`ment_health_days`, `phys_health_days`", "Whole number 0–30"],
        ["`symptoms`", "Optional object: `chest_pain`, `stroke_signs`, `severe_breathlessness`, `fainting` (each true / false, default false). These feed the emergency rule, not a model."],
        ["`free_text`", "Optional, up to 500 characters. Checked for emergency words, **never stored**."],
        ["`language`", "`en`, `hi` or `mr` (default `en`)"],
      ],
    },
    {
      type: "code",
      lang: "json",
      code: `POST /api/v1/assessment
{
  "age": 30, "sex": "female", "height_cm": 162, "weight_kg": 55,
  "high_bp": false, "high_chol": false, "smoker": false, "phys_activity": true,
  "fruits": true, "veggies": true, "heavy_alcohol": false, "gen_health": 1,
  "ment_health_days": 0, "phys_health_days": 0, "diff_walk": false,
  "symptoms": { "chest_pain": false }, "language": "en"
}`,
    },
    { type: "h3", text: "Response: what a patient gets" },
    {
      type: "p",
      text: "The response (`AssessmentResponse`) has: `id`, `stored`, `queued_for_review`, `next_step`, `emergency`, `data_quality` (`passed`, `errors`, `warnings`), `bmi`, `results` (one entry per disease: `diabetes`, `heart`, `stroke`), `shared_factors`, `notes`, `guidance`, `model_versions` and `disclaimer`. Shortened example from `docs/api_examples.md` (case a, Low):",
    },
    {
      type: "code",
      lang: "json",
      code: `200
{
  "id": "…", "stored": true, "queued_for_review": false,
  "emergency": false,
  "data_quality": { "passed": true, "errors": [], "warnings": [] },
  "bmi": 21.0,
  "results": {
    "diabetes": {
      "band": "low", "abstained": false, "abstain_reason": null,
      "top_factors": [
        { "feature": "GenHlth", "direction": "lowers", "text_key": "factor.GenHlth.lowers",
          "text": "How you rated your general health made your answers less similar to people who have been told they have this condition." }
      ]
    },
    "heart":  { "band": "low", "...": "..." },
    "stroke": { "band": "low", "...": "..." }
  },
  "shared_factors": [ { "feature": "Age", "diseases": { "diabetes": "lowers", "heart": "lowers", "stroke": "lowers" } } ],
  "notes": ["age_under_40_less_reliable"],
  "guidance": ["regular_checkups"],
  "model_versions": { "diabetes": { "version": "diabetes-v1.0.0", "data_hash": "2f39…", "model": "lightgbm" }, "...": "..." },
  "next_step": "routine_checkup",
  "disclaimer": "…"
}`,
    },
    {
      type: "list",
      items: [
        "**Patients never get numbers.** A patient sees only the level (`band`: low / moderate / high), whether the model held back (`abstained`) and plain-language factors. The probability, the conformal set (the set of answers the model cannot rule out) and SHAP values (how much each answer pushed the result) are only shown to clinicians reading a stored case (decision D-10).",
        "`next_step` is one of: `emergency`, `correct_inputs`, `not_confident`, `see_doctor_soon`, `discuss_next_checkup`, `routine_checkup` (`apps/api/services/screening.py`).",
        "If emergency signs were ticked or written, `emergency` is true, `next_step` is `emergency` and **no model runs** (`results` is empty). The web app then shows 108 / 112 straight away.",
        "If the answers fail the data checks, `next_step` is `correct_inputs` and nothing is saved.",
        "The result is saved (`stored: true`, with an `id`) only if the patient allowed `store_history`. If not, only an `ASSESSMENT_NOT_STORED` audit entry is written, without the answers.",
        "High, uncertain and emergency results go to the clinician queue (`queued_for_review: true`) only if the patient also allowed `share_with_clinician`. If they did not, `notes` includes `no_clinician_review_without_consent`.",
      ],
    },
    {
      type: "table",
      head: ["Status", "When"],
      rows: [
        ["403", "The patient has not turned on `assessment_processing`. The detail asks them to turn it on in My data → Consent."],
        ["422", "A field is missing, out of range or unknown."],
      ],
    },
    { type: "h3", text: "What-if and recourse" },
    {
      type: "code",
      lang: "json",
      code: `POST /api/v1/what-if
{
  "base": { …the same 14 answers… },
  "changes": { "weight_kg": 75, "phys_activity": true },
  "language": "en"
}

200  ->  { "before": { …results… }, "after": { …results… }, … }`,
    },
    {
      type: "list",
      items: [
        "Only answers a person can change are allowed in `changes`: `weight_kg`, `smoker`, `phys_activity`, `fruits`, `veggies`, `heavy_alcohol`, `gen_health`, `ment_health_days`, `phys_health_days`. Changing anything else (for example age) gives **422**.",
        "`before` and `after` are shaped by role: a patient sees levels, a doctor also sees numbers.",
        "`POST /api/v1/recourse` takes `{\"base\": {…}, \"language\": \"en\"}` and returns the smallest single or paired realistic change that lowers a level.",
        "Neither endpoint saves anything.",
      ],
    },
    { type: "h3", text: "Read one saved assessment" },
    {
      type: "p",
      text: "`GET /api/v1/assessment/{assessment_id}` returns the stored row (`id`, `user_id`, `assessment_mode`, `inputs`, `results`, `next_step`, `emergency_flag`, `review_status`, `model_versions`, `created_at`) plus `clinician_review` (the doctor's decision and note, or null). Results are shaped by role. If you may not see it (RLS), the answer is **404** `Assessment ... not found`. Stored `inputs` contain the answers, BMI and ticked symptom names, never the free text.",
    },

    // ── History and reports ──
    { type: "h2", id: "history-and-reports", text: "History and PDF reports" },
    {
      type: "table",
      head: ["Method", "Path", "Who", "What it does"],
      rows: [
        ["GET", "`/api/v1/assessment/history`", "Patient", "All your saved assessments, newest first."],
        ["GET", "`/api/v1/reports`", "Patient", "A short list of your saved screenings with a PDF link for each."],
        ["GET", "`/api/v1/reports/{assessment_id}/pdf`", "Patient", "Download one screening as a PDF. Optional `?lang=en|hi|mr`."],
      ],
    },
    {
      type: "code",
      lang: "json",
      code: `GET /api/v1/assessment/history  ->  200
{
  "user_id": "…",
  "total_assessments": 2,
  "assessments": [ { …stored assessment…, "clinician_review": null }, … ]
}

GET /api/v1/reports  ->  200
[
  { "assessment_id": "…", "created_at": "…", "next_step": "see_doctor_soon",
    "review_status": "pending", "model_versions": { … },
    "pdf_download_url": "/api/v1/reports/<id>/pdf" }
]`,
    },
    {
      type: "list",
      items: [
        "If the patient has withdrawn `store_history`, history returns zero items with `\"hidden\": \"store_history_withdrawn\"`, the reports list is empty and the PDF gives 404.",
        "The PDF shows levels and text only, never probabilities. Without `lang` it uses the profile's preferred language.",
        "The PDF comes with `Content-Disposition: attachment; filename=\"vitalnex-report-YYYYMMDD-<lang>.pdf\"` and `Cache-Control: no-store`. Each download writes a `REPORT_DOWNLOADED` audit entry.",
        "Errors: **404** if the assessment is not yours or is hidden; **503** `Hindi and Marathi PDFs are not available on this server.` if the text-shaping library for Devanagari is missing.",
      ],
    },
    { type: "p", text: "See [History and reports](/admin/docs/history-and-reports) for the screens that use these." },

    // ── Assistant ──
    { type: "h2", id: "assistant", text: "Assistant" },
    {
      type: "table",
      head: ["Method", "Path", "Who", "What it does"],
      rows: [
        ["POST", "`/api/v1/assistant/message`", "Patient, doctor, admin", "Send one message, get one answer from a fixed, pre-written library."],
        ["POST", "`/api/v1/voice/transcribe`", "—", "Switched off for the MVP. Always 503."],
        ["POST", "`/api/v1/voice/synthesize`", "—", "Switched off for the MVP. Always 503."],
      ],
    },
    {
      type: "code",
      lang: "json",
      code: `POST /api/v1/assistant/message
{ "message": "How do I book a doctor?", "language": "en" }

200
{
  "id": "…", "response": "…", "language": "en",
  "intent": "…", "confidence": 0.91, "decided_by": "classifier",
  "suggestions": [ { "id": "…", "label": "…", "action_type": "navigate", "payload": { } } ],
  "citations": [ { "title": "…", "url": "…" } ],
  "escalation_recommended": false,
  "emergency_card": false,
  "disclaimer": "Answers come from a fixed, pre-written library — VITALNEX does not generate medical advice. In an emergency call 108 / 112.",
  "details": { },
  "timestamp": "…"
}`,
    },
    {
      type: "list",
      items: [
        "Request: `message` (1–2,000 characters), `language` (`en`, `hi`, `mr`; default `en`), optional `context` object.",
        "`decided_by` tells you who answered: `rule` (a fixed safety rule, for example an emergency or a medicine question), `classifier` (the local intent model), `abstain` (not sure enough) or `unavailable` (the language model files are missing; emergency and medicine rules still work).",
        "`confidence` is the classifier's probability; it is null when a rule decided.",
        "`emergency_card: true` means the web app must show the 108 / 112 card above the reply (decision D-26).",
        "The message text is **never stored**. Only the intent, confidence and emergency flag are logged.",
        "The 503 voice answer is `{\"detail\": \"Not in MVP: this feature is under development and is not available yet.\"}`.",
      ],
    },
    { type: "p", text: "More in [AI assistant](/admin/docs/ai-assistant)." },

    // ── Care connect ──
    { type: "h2", id: "care-connect", text: "Care Connect: doctors and booking" },
    {
      type: "table",
      head: ["Method", "Path", "Who", "What it does"],
      rows: [
        ["GET", "`/api/v1/doctors`", "Anyone (no sign-in)", "List demo doctors. Filters: `specialization`, `locality`, `language`, `consultation_mode`."],
        ["GET", "`/api/v1/doctors/{doctor_id}`", "Anyone", "One demo doctor. 404 if unknown."],
        ["GET", "`/api/v1/appointments`", "Patient, doctor", "A patient sees their bookings; a doctor sees bookings with them. Optional `?status=`."],
        ["POST", "`/api/v1/appointments`", "Patient", "Book a free slot."],
        ["GET", "`/api/v1/appointments/{appointment_id}`", "Patient, doctor", "One booking. 404 if not yours."],
        ["PATCH", "`/api/v1/appointments/{appointment_id}`", "Patient, doctor", "Patient: cancel. Doctor: confirm, complete or cancel, and add notes."],
        ["GET", "`/api/v1/appointments/{appointment_id}/video-token`", "—", "Switched off for the MVP. Always 503."],
        ["WebSocket", "`/api/v1/ws/signaling/{room_name}`", "—", "Switched off. Closes at once with code 1008."],
      ],
    },
    {
      type: "code",
      lang: "json",
      code: `GET /api/v1/doctors  ->  200  (one item shown)
{
  "id": "d0000001-0000-0000-0000-000000000001",
  "full_name": "Dr. Anand Joshi (Demo)",
  "medical_license_number": "SYNTHETIC-DEMO-0001",
  "specialization": "Cardiology", "specialization_code": "cardiology",
  "years_of_experience": 14,
  "bio": "Synthetic demo clinician. Not a real doctor.",
  "languages_spoken": ["English", "Marathi", "Hindi"],
  "consultation_modes": ["in_person"],
  "rating": null, "review_count": null,
  "is_demo": true, "is_active": true,
  "locations": [ { "facility_name": "Kothrud Heart Clinic (Demo)", "locality": "Kothrud",
                   "city": "Pune", "state": "Maharashtra", "postal_code": "411038",
                   "distance_estimate_km": null } ],
  "next_slots": [ { "id": "…", "starts_at": "…", "ends_at": "…" } ]
}`,
    },
    {
      type: "p",
      text: "`rating` and `review_count` are always null for demo doctors, so no made-up rating is ever shown.",
    },
    {
      type: "code",
      lang: "json",
      code: `POST /api/v1/appointments
{ "slot_id": "…", "consultation_type": "in_person", "patient_reason": "Follow up on my screening", "assessment_id": "…" }

PATCH /api/v1/appointments/{id}
{ "status": "cancelled" }`,
    },
    {
      type: "list",
      items: [
        "Booking body: `slot_id` (required), `consultation_type` (`in_person` or `audio`, default `in_person`), optional `patient_reason` (up to 500 characters) and optional `assessment_id` to attach a screening. The patient is always the signed-in user and the time comes from the slot.",
        "Update body: optional `status` (`confirmed`, `completed`, `cancelled`) and optional `doctor_notes` (up to 2,000 characters).",
        "Response (`AppointmentResponse`): `id`, `patient_id`, `doctor_id`, `doctor_name`, `specialization`, `specialization_code`, `appointment_date`, `start_time`, `end_time`, `appointment_time`, `status`, `consultation_type`, `reason`, `patient_reason`, `doctor_notes`, `patient_name` (only shown to the booked doctor), `slot_id`, `assessment_id`, `created_at`, `updated_at`.",
      ],
    },
    {
      type: "table",
      head: ["Status", "Message", "When"],
      rows: [
        ["404", "`That slot does not exist.`", "Unknown slot id"],
        ["409", "`That slot is in the past. Please pick another one.`", "Old slot"],
        ["409", "`That slot was just booked. Please pick another one.`", "Someone booked it first"],
        ["404", "`Assessment not found.`", "The attached assessment is not yours"],
        ["403", "`Patients can only cancel an appointment.`", "A patient tried another status"],
        ["409", "`Appointment is already <status>.`", "The booking is already finished or cancelled"],
      ],
    },
    { type: "p", text: "More in [Care Connect](/admin/docs/care-connect)." },

    // ── Trust, consent, share ──
    { type: "h2", id: "trust-and-sharing", text: "Trust Passport and QR sharing" },
    {
      type: "table",
      head: ["Method", "Path", "Who", "What it does"],
      rows: [
        ["GET", "`/api/v1/trust-passport`", "Anyone (no sign-in)", "The public AI Trust Passport: what the tool is and is not, data, models, fairness, limits, versions, live counts."],
        ["GET", "`/api/v1/trust-passport/principles`", "Anyone", "The NITI Aayog principle map (`apps/api/content/principle_map.json`) with each evidence item checked live."],
        ["GET", "`/api/v1/trust-passport/images/{disease}/{image}`", "Anyone", "Only `reliability.png` or `shap_global.png` for `diabetes`, `heart` or `stroke`. Cached for one hour."],
        ["POST", "`/api/v1/shares`", "Patient", "Create a time-limited share link and QR code. Returns 201."],
        ["GET", "`/api/v1/shares`", "Patient", "Your share links, with every time each was opened."],
        ["POST", "`/api/v1/shares/{share_id}/revoke`", "Patient", "Stop a share link at once. Returns 204."],
        ["GET", "`/api/v1/share/{token}`", "Anyone with the link", "Read-only summary the patient chose to share."],
      ],
    },
    {
      type: "p",
      text: "The Trust Passport response has the top-level keys `what_it_is`, `what_it_is_not`, `disclaimer`, `data`, `models`, `fairness`, `age_gap`, `accepted_decisions`, `limitations`, `versions`, `live` and `report_a_problem`. Live numbers are counts across all users, or \"not available\"; nothing about a single patient. See [Trust Passport](/admin/docs/trust-passport).",
    },
    {
      type: "code",
      lang: "json",
      code: `POST /api/v1/shares
{ "sections": ["latest_results", "factors"], "expires_in": "24h" }

201
{
  "id": "…",
  "sections": ["latest_results", "factors"],
  "expires_at": "…",
  "url": "<PUBLIC_WEB_URL>/share/<token>",
  "qr_png_data_uri": "data:image/png;base64,…"
}`,
    },
    {
      type: "list",
      items: [
        "`sections`: one or more of `latest_results`, `factors`, `history`, `clinician_notes`. `expires_in`: `1h`, `24h` or `7d`.",
        "The secret token is returned **only once**, inside `url`. The database stores only its SHA-256 hash (a one-way fingerprint), so a lost link cannot be shown again.",
        "`GET /api/v1/shares` items have `id`, `sections`, `created_at`, `expires_at`, `revoked_at`, `status` (`active`, `expired` or `revoked`), `open_count` and `opens` (each with `accessed_at` and `accessor_role`).",
        "`GET /api/v1/share/{token}` needs no sign-in. If a signed-in user opens it, their role is logged; otherwise the open is logged as `public`. The answer has `shared_by`, `notice`, `expires_at`, `sections`, `read_only: true` and a disclaimer, plus the chosen sections. It is sent with `Cache-Control: no-store` and `Referrer-Policy: no-referrer`.",
        "Share link errors: **410** with `{\"code\": \"revoked\"}` or `{\"code\": \"expired\"}`; **404** with `{\"code\": \"not_found\"}` for a wrong token. Revoking an unknown share gives 404 `Share not found.`",
      ],
    },
    { type: "p", text: "Consent endpoints are listed under [Session, profile and my data](#auth-and-profile)." },

    // ── Doctor ──
    { type: "h2", id: "doctor", text: "Clinician (doctor) workspace" },
    {
      type: "p",
      text: "All of these need the `doctor` role. A doctor only ever sees patients who have turned on `share_with_clinician`; this is enforced by the database (RLS), not just by the web app.",
    },
    {
      type: "table",
      head: ["Method", "Path", "What it does"],
      rows: [
        ["GET", "`/api/v1/doctor/reviews`", "The review queue. Optional `?status=pending|agreed|overridden`."],
        ["GET", "`/api/v1/doctor/reviews/{assessment_id}`", "One queue item. 404 if none."],
        ["PATCH", "`/api/v1/doctor/reviews/{assessment_id}`", "Agree with the model, or override a level with a reason."],
        ["GET", "`/api/v1/doctor/patients`", "Patients who share with clinicians."],
        ["GET", "`/api/v1/doctor/cases/{assessment_id}`", "Full case: answers, calibrated probability, conformal set, why the model held back, top SHAP factors, data-quality notes and history. 404 `Case not found.`"],
      ],
    },
    {
      type: "p",
      text: "A queue item (`ReviewQueueItem`) has `id`, `assessment_id`, `patient_id`, `patient_name`, `reasons` (any of `high_band`, `abstained`, `data_quality`, `emergency`), `status`, `assigned_to`, `reviewed_by`, `reviewed_at`, `clinician_note` and `created_at`.",
    },
    {
      type: "code",
      lang: "json",
      code: `PATCH /api/v1/doctor/reviews/{assessment_id}
{
  "decision": "override",
  "note": "Discussed at visit; please book a follow-up.",
  "overrides": [
    { "disease": "heart", "clinician_band": "Moderate", "reason_code": "clinical_history_not_captured" }
  ]
}

PATCH /api/v1/doctor/reviews/{assessment_id}
{ "decision": "agree", "note": "Agree with the screening." }`,
    },
    {
      type: "list",
      items: [
        "`decision`: `agree` or `override`. `note` (up to 2,000 characters) is shown to the patient.",
        "Each override needs `disease` (`diabetes`, `heart`, `stroke`), `clinician_band` (`Low`, `Moderate`, `High`) and a **required** `reason_code`: `clinical_history_not_captured`, `symptoms_present`, `input_likely_wrong`, `model_overestimates`, `model_underestimates` or `other`. `other` also needs a `note` (up to 1,000 characters).",
        "**422** if: `agree` carries overrides; `override` has none; the same disease appears twice; the new level equals the model's level (use Agree); the disease has no model result (for example an emergency case, where no model ran); or no model version is stored.",
        "**409** if the case was already reviewed, or someone else reviewed it at the same moment. **404** if there is no queue item or assessment.",
        "Each decision writes a `clinician_overrides` row and an audit entry. Overrides are **never** used to retrain the models (CLAUDE.md hard rule 9).",
      ],
    },
    { type: "p", text: "More in [Clinician workspace](/admin/docs/clinician-workspace)." },

    // ── Governance ──
    { type: "h2", id: "governance-and-admin", text: "Models, governance and admin" },
    {
      type: "table",
      head: ["Method", "Path", "Who", "What it does"],
      rows: [
        ["GET", "`/api/v1/models`", "Anyone (no sign-in)", "Version and headline test numbers of the three loaded models."],
        ["GET", "`/api/v1/models/{model_id}`", "Anyone", "The full `model_meta.json` for `diabetes`, `heart` or `stroke`. 404 `Model not found`."],
        ["GET", "`/api/v1/models/{model_id}/card`", "Anyone", "The model card as Markdown text."],
        ["GET", "`/api/v1/governance/summary`", "Admin", "Counts: total assessments, models in use, pending reviews, recent events."],
        ["GET", "`/api/v1/admin/governance/models`", "Admin", "Model registry: versions, data hash, model-card links."],
        ["GET", "`/api/v1/admin/governance/fairness`", "Admin", "Fairness tables from `model_meta.json` (test set), with a plain reading."],
        ["GET", "`/api/v1/admin/governance/overrides`", "Admin", "Override rate per disease, overrides per reason, agree rate."],
        ["GET", "`/api/v1/admin/governance/activity`", "Admin", "Assessments, held-back results and emergency flags per day. `?days=` 1–365, default 30."],
        ["GET", "`/api/v1/admin/governance/consents`", "Admin", "Consent counts, share counts and data-request counts."],
        ["GET", "`/api/v1/admin/governance/audit-logs`", "Admin", "Audit log viewer with filters and pages."],
      ],
    },
    {
      type: "p",
      text: "These endpoints only expose model facts or totals. The admin endpoints never return patient ids, names, answers or assessment ids (`apps/api/routers/v1/admin.py`). In the audit log, patients show only as the role `patient`.",
    },
    {
      type: "code",
      lang: "json",
      code: `GET /api/v1/models  ->  200  (first item, values from ml/artifacts/diabetes/model_meta.json)
{
  "id": "diabetes",
  "version": "diabetes-v1.0.0",
  "model": "lightgbm",
  "created_at": "2026-10-28T12:24:06+00:00",
  "data_hash": "2f3939868b6b6653d84458193a2c94280921ff5a3b2849adc18b1b307be55cbc",
  "test_auroc": 0.8237,
  "test_auroc_ci95": [0.8190, 0.8282],
  "test_recall_at_t_mod": 0.8549,
  "test_brier": 0.0979,
  "thresholds": { "t_mod": 0.1246, "t_high": 0.2774 },
  "abstention_rate_test": 0.3676,
  "flags": ["band 'low' holds 56.3% of test people (> 50%)", "abstention 36.8% on test (> 30%)",
            "isotonic calibration did not improve Brier on cal-B", "AgeGroup: recall gap 0.509 > 0.1",
            "Income: recall gap 0.136 > 0.1"]
}`,
    },
    {
      type: "p",
      text: "Numbers above are rounded here for reading; the API returns the full values. `flags` are warnings the training script wrote itself, and the API passes them on unchanged. See [Models and data](/admin/docs/models-and-data).",
    },
    { type: "h3", text: "Audit log filters" },
    {
      type: "list",
      items: [
        "`action` and `resource_type`: text, up to 64 characters.",
        "`actor_role`: `patient`, `doctor`, `admin` or `system`.",
        "`since` and `until`: date-times.",
        "`limit`: 1–200 (default 50). `offset`: 0 or more.",
      ],
    },
    {
      type: "p",
      text: "`GovernanceSummaryResponse` has `total_assessments`, `models_in_production`, `fairness_compliance_rate`, `human_reviews_pending`, `data_quality_index` and `recent_events`. `fairness_compliance_rate` and `data_quality_index` are null when not computed; they are never filled with a placeholder number.",
    },
    { type: "p", text: "More in [Admin console](/admin/docs/admin-console)." },

    // ── Switched off ──
    { type: "h2", id: "switched-off", text: "Switched-off endpoints" },
    {
      type: "p",
      text: "Some features are frozen for the MVP (`docs/SPEC.md` §1.2). Their code stays, but the endpoints refuse clearly instead of returning fake data (`apps/api/core/frozen.py`).",
    },
    {
      type: "table",
      head: ["Endpoint", "Answer"],
      rows: [
        ["`POST /api/v1/voice/transcribe`", "503 Not in MVP"],
        ["`POST /api/v1/voice/synthesize`", "503 Not in MVP"],
        ["`GET /api/v1/appointments/{id}/video-token`", "503 Not in MVP"],
        ["`WS /api/v1/ws/signaling/{room_name}`", "Connection closed, code 1008"],
      ],
    },

    // ── Errors ──
    { type: "h2", id: "errors", text: "Error codes in short" },
    {
      type: "table",
      head: ["Code", "Meaning in VITALNEX"],
      rows: [
        ["200 / 201 / 204", "Worked. 201 = created (share). 204 = worked, no body (login/logout events, revoke)."],
        ["401", "Not signed in, or the token is bad or expired."],
        ["403", "Wrong role, no VITALNEX profile, or a required consent is off."],
        ["404", "Not found, or you are not allowed to see it (the database hides it)."],
        ["409", "Clash: slot already taken or in the past, booking already finished, case already reviewed."],
        ["410", "Share link revoked or expired."],
        ["422", "The body or a query field is wrong (missing, out of range, unknown field, rule broken)."],
        ["503", "Feature switched off for the MVP, or Hindi/Marathi PDF shaping not available on this server."],
      ],
    },
    {
      type: "p",
      text: "In the web app, `apps/web/src/lib/api-client.ts` adds the Bearer header and sorts these codes into a few error kinds for the screens to explain (for example 404 → `notFound`, 422 → `validation`, network errors and 5xx → `unavailable`).",
    },

    // ── NITI ──
    { type: "h2", id: "niti-principles", text: "Which NITI Aayog principles this follows" },
    {
      type: "niti",
      items: [
        {
          id: "privacy_security",
          how: [
            "Every signed-in call is checked against a verified Supabase token, and the role always comes from the database, never from the token or the login page.",
            "Reads and writes run as the signed-in user, so database Row Level Security hides other people's rows (they come back as 404). Doctors only see patients who turned on `share_with_clinician`.",
            "The assistant message and the assessment `free_text` are never stored; share tokens are stored only as SHA-256 hashes; admin endpoints return totals only.",
            "Models, the assistant and the PDF builder run on the local server. No health data is sent to any outside AI service.",
          ],
        },
        {
          id: "accountability",
          how: [
            "Login, logout, report downloads, unsaved assessments, consent changes and data deletion all write audit entries that admins can filter at `/api/v1/admin/governance/audit-logs`.",
            "A clinician override must carry a reason code (and a note for `other`) and is stored in `clinician_overrides`; it is never used to retrain.",
            "Every opening of a QR share link is logged with the viewer's role, and the patient can see each open.",
          ],
        },
        {
          id: "transparency",
          how: [
            "Each assessment response carries `model_versions` (version, data hash, model type) so any result can be traced to one trained model.",
            "`/api/v1/models`, `/api/v1/models/{id}/card` and `/api/v1/trust-passport` are public and serve the numbers straight from `model_meta.json`, including the training script's own warning `flags`.",
            "FastAPI publishes the full, live list of endpoints and fields at `/docs` and `/openapi.json`.",
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
          q: "Where do I get a token to test signed-in endpoints?",
          a: "Sign in to the web app with a demo account (for example `patient1@vitalnex.demo`). The browser's Supabase session holds the access token. Send it as `Authorization: Bearer <token>`. Tokens expire, so copy a fresh one if you get 401.",
        },
        {
          q: "Why does a doctor get 404 for a patient's assessment that exists?",
          a: "The database only lets a doctor read assessments of patients who have turned on `share_with_clinician`. Rows they may not see are hidden, so the API answers 404 rather than saying the row exists.",
        },
        {
          q: "Why does my patient call to POST /assessment return 403?",
          a: "The patient has not turned on the `assessment_processing` consent. Turn it on with `PUT /api/v1/consents/assessment_processing` and body `{\"granted\": true}`, or in My data in the web app.",
        },
        {
          q: "Can a patient get the probability numbers through the API?",
          a: "No. Results are shaped by role on the server. Patients only get levels, the held-back flag and plain-language factors. Probabilities, conformal sets and SHAP values are only returned to doctors.",
        },
        {
          q: "Is there a rate limit?",
          a: "No. The current code has no rate limiting. Only field size limits apply (for example 2,000 characters for an assistant message).",
        },
        {
          q: "Do any endpoints call an outside AI service?",
          a: "No. All screening and assistant work runs on the server itself. The only outside service is the Supabase project used for the database and sign-in.",
        },
        {
          q: "Why do the voice and video endpoints return 503?",
          a: "They are frozen for the MVP. They answer with `Not in MVP` on purpose instead of returning fake data.",
        },
        {
          q: "Is there an endpoint to create accounts?",
          a: "No. Sign-up and sign-in go straight to Supabase Auth from the web app. Demo accounts are made by `python supabase/seed/seed_demo.py`.",
        },
      ],
    },
  ],
};

export default page;
