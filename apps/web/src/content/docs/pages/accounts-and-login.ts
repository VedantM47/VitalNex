import type { DocPage } from "../types";

const page: DocPage = {
  slug: "accounts-and-login",
  title: "Accounts, sign-in and settings",
  summary:
    "How people get into VITALNEX: the sign-in page, patient sign-up, password reset, the first-time welcome page, the language choice, the Settings page and signing out. It also explains what each role (patient, clinician, admin) can open.",
  audience: "Patients, clinicians and admins",
  blocks: [
    // 1. What it is
    { type: "h2", id: "what-it-is", text: "What this feature is" },
    {
      type: "p",
      text: "Every person who uses VITALNEX has an **account** (a user name and password stored by the app). The account decides who you are and what you can see. There are three kinds of account, called **roles**: **patient**, **clinician** (shown as \"doctor\" in the code) and **admin**.",
    },
    {
      type: "p",
      text: "This page covers everything around the account itself. It does not cover the screening form or results; see [Risk assessment](/admin/docs/risk-assessment) for that.",
    },
    {
      type: "list",
      items: [
        "**Sign-in** — one sign-in page for all three roles.",
        "**Patient sign-up** — only patients can create their own account. Clinician and admin accounts are made by the VITALNEX team with a setup script.",
        "**Forgot / reset password** — get an e-mail link and choose a new password.",
        "**Welcome page (onboarding)** — a first-time page for new patients that explains what VITALNEX is and is not.",
        "**Language** — English, Hindi (हिंदी) or Marathi (मराठी), changeable at any time.",
        "**Settings** — language for everyone, and for patients the \"My data\" area (consents, download, delete).",
        "**Sign-out** — the door icon at the top right.",
      ],
    },
    {
      type: "callout",
      kind: "warning",
      title: "Demo accounts only",
      text: "VITALNEX is an MVP (a first, small working version). All accounts are dummy accounts. The sign-in page itself says: \"MVP with dummy accounts only. Do not enter real personal health information.\"",
    },

    // 2. Where to find it
    { type: "h2", id: "where-to-find-it", text: "Where to find it" },
    {
      type: "table",
      head: ["Screen", "Web address (URL)", "Who can open it"],
      rows: [
        ["Home page (landing page)", "`/`", "Anyone, signed in or not"],
        ["Sign-in", "`/auth/login`", "Anyone"],
        ["Portal short-cuts", "`/login/patient`, `/login/doctor`, `/login/admin`", "Anyone (they only forward to `/auth/login`)"],
        ["Patient sign-up", "`/auth/signup`", "Anyone"],
        ["Forgot password", "`/auth/forgot-password`", "Anyone"],
        ["Set a new password", "`/auth/reset-password`", "Opened from the e-mail link"],
        ["Welcome page (onboarding)", "`/onboarding`", "Patients only"],
        ["Settings", "`/settings`", "Patients, clinicians and admins"],
        ["Sign-out", "Door icon in the top bar of every signed-in page", "Everyone who is signed in"],
      ],
    },
    {
      type: "p",
      text: "Inside the app, **Settings** is in the left menu for every role. For patients it is in the lower group of the menu, under Reports. For clinicians and admins it is the last item.",
    },
    {
      type: "h3",
      text: "The home page and the \"portals\"",
    },
    {
      type: "p",
      text: "The home page (`/`) has three buttons that lead into the app: **Open VITALNEX** (top right), **Get started** and **Open my dashboard**. \"Get started\" goes to the welcome page; the other two go to the patient dashboard. Both of those pages are for patients only, so a visitor who is not signed in is first sent to the sign-in page. After signing in, a patient is taken back to the page they asked for.",
    },
    {
      type: "p",
      text: "There is no separate sign-in page per role. The addresses `/login/patient`, `/login/doctor` and `/login/admin` show \"Opening the sign-in page…\" and then forward to `/auth/login?role=patient`, `?role=doctor` or `?role=admin`. The `role` part only changes the small line under the title (\"Patient portal\", \"Clinician portal\" or \"Governance portal\") and whether the \"Create an account\" link is shown (patient portal only). The home page does not link to these short-cuts; you type them yourself.",
    },
    {
      type: "callout",
      kind: "info",
      title: "The portal never decides your role",
      text: "Your role always comes from your profile in the database. The sign-in page says so: \"Your access depends on your account, not on the portal you choose.\" A patient who signs in through `/login/admin` still lands on the patient dashboard.",
    },

    // 3. Screenshots
    { type: "h2", id: "screenshots", text: "What the screens look like" },
    {
      type: "image",
      src: "/docs/accounts-and-login/login.png",
      alt: "The VITALNEX sign-in page with e-mail and password fields",
      caption: "The sign-in page at /auth/login (patient portal, the default).",
      markers: [
        { n: 1, text: "Portal line. Shows \"Patient portal\", \"Clinician portal\" or \"Governance portal\". It is only a label." },
        { n: 2, text: "Demo warning: dummy accounts only, no real health information." },
        { n: 3, text: "E-mail address of the account." },
        { n: 4, text: "Password." },
        { n: 5, text: "\"Forgot password?\" link to the reset page." },
        { n: 6, text: "\"Sign in\" button." },
        { n: 7, text: "\"Create an account\" link. Shown only on the patient portal." },
        { n: 8, text: "Language selector (English / हिंदी / मराठी)." },
      ],
    },
    {
      type: "image",
      src: "/docs/accounts-and-login/signup.png",
      alt: "The patient sign-up page with name, e-mail and password fields",
      caption: "Patient sign-up at /auth/signup. Only three things are asked.",
      markers: [
        { n: 1, text: "Reminder that clinician and admin accounts are created by the VITALNEX team." },
        { n: 2, text: "Full name." },
        { n: 3, text: "E-mail address." },
        { n: 4, text: "Password, at least 8 characters." },
        { n: 5, text: "Note: no health information is collected when you create an account." },
        { n: 6, text: "\"Create account\" button." },
        { n: 7, text: "\"Sign in\" link for people who already have an account." },
      ],
    },
    {
      type: "image",
      src: "/docs/accounts-and-login/language-menu.png",
      alt: "The language menu opened, listing English, Hindi and Marathi",
      caption: "The language selector, opened. Each language is written in its own script, with its name in the current language in brackets.",
      markers: [
        { n: 1, text: "The open list of three languages." },
        { n: 2, text: "The language in use now, marked with a tick." },
      ],
    },

    // 4. How to use it
    { type: "h2", id: "how-to-use-it", text: "How to use it" },
    { type: "h3", text: "Sign in" },
    {
      type: "steps",
      items: [
        { title: "Open the sign-in page", text: "Go to `/auth/login`, or click any button on the home page that leads into the app." },
        { title: "Type your e-mail and password", text: "Use the e-mail and password of your account. For the demo, the accounts are listed in [Getting started](/admin/docs/getting-started)." },
        { title: "Click \"Sign in\"", text: "The button shows a loading spinner while the app checks your details." },
        {
          title: "You land on your home page",
          text: "Patients go to `/dashboard`, clinicians to `/doctor/dashboard`, admins to `/admin/dashboard`. If you were sent to sign-in from a page you are allowed to open, you go back to that page instead.",
        },
      ],
    },
    {
      type: "table",
      head: ["Message you may see", "What it means"],
      rows: [
        ["\"Email or password is incorrect.\"", "The e-mail or password is wrong, or the account does not exist. The app does not say which, on purpose."],
        ["\"This account has no VITALNEX profile.\"", "The sign-in worked but there is no matching row in the `profiles` table (or its role is not patient, doctor or admin). The app signs the account out again."],
        ["\"Sign-in is not available: Supabase is not configured for this app.\"", "The web app is missing its Supabase settings. This is a set-up problem, not a user problem."],
      ],
    },

    { type: "h3", text: "Create a patient account (sign-up)" },
    {
      type: "steps",
      items: [
        { title: "Open sign-up", text: "On the sign-in page click **Create an account**, or go to `/auth/signup`." },
        { title: "Pick your language first (optional)", text: "Use the language selector at the top right. The language shown when you click \"Create account\" is saved as your preferred language." },
        { title: "Fill in three fields", text: "Full name, e-mail, and a password of at least 8 characters. If the password is shorter you see \"Use at least 8 characters.\" and nothing is sent." },
        { title: "Click \"Create account\"", text: "The account is created in Supabase (the sign-in and database service VITALNEX uses)." },
        {
          title: "Next screen",
          text: "If the Supabase project signs new users in straight away, you go to the welcome page (`/onboarding`). If it asks for e-mail confirmation first, you see \"Check your email to confirm your account, then sign in.\"",
        },
      ],
    },
    {
      type: "callout",
      kind: "info",
      title: "Clinicians and admins cannot sign up",
      text: "Sign-up always makes a **patient** account, whatever is sent. Clinician and admin accounts are created by the setup script `supabase/seed/seed_demo.py`, which uses the server's own key to set the role.",
    },

    { type: "h3", text: "Forgot your password" },
    {
      type: "steps",
      items: [
        { title: "Click \"Forgot password?\"", text: "It is under the password box on the sign-in page. It opens `/auth/forgot-password`." },
        { title: "Type your e-mail and click \"Send reset link\"", text: "You always see \"If an account exists for this email, a reset link has been sent.\" The app shows the same text whether or not the account exists, so nobody can use this page to find out who has an account." },
        { title: "Open the link in the e-mail", text: "Supabase sends the e-mail. The link opens `/auth/reset-password` and signs you in for this one step." },
        { title: "Choose a new password", text: "Type it in \"New password\" and again in \"Confirm new password\". It must be at least 8 characters and both boxes must match." },
        { title: "Click \"Update password\"", text: "The password is changed, you are signed out, and you see \"Password updated. You can now sign in.\" Use \"Back to sign in\" to continue." },
      ],
    },
    {
      type: "callout",
      kind: "warning",
      text: "If the reset page is opened without a valid e-mail link (or the link is too old), it says \"This reset link is invalid or has expired. Request a new one.\" Please do not change the passwords of the shared demo accounts.",
    },
    {
      type: "image",
      src: "/docs/accounts-and-login/forgot-password.png",
      alt: "The reset-your-password page with one e-mail field",
      caption: "The \"Reset your password\" page at /auth/forgot-password.",
      markers: [
        { n: 1, text: "E-mail address of the account." },
        { n: 2, text: "\"Send reset link\" button." },
        { n: 3, text: "\"Back to sign in\" link." },
      ],
    },

    { type: "h3", text: "The welcome page (onboarding)" },
    {
      type: "p",
      text: "New patients land on `/onboarding` right after sign-up. Anyone with a patient account can open it again later at that address. It is a reading page with links. **It saves nothing and asks no health questions.**",
    },
    {
      type: "image",
      src: "/docs/accounts-and-login/onboarding.png",
      alt: "The Welcome to VITALNEX page with what it is, what it is not, and three steps",
      caption: "The welcome page at /onboarding, seen as a patient.",
      markers: [
        { n: 1, text: "\"What VITALNEX is\" and \"What it is not\": a screening aid, not a diagnosis, never names medicines, not validated on Indian patients." },
        { n: 2, text: "Emergency line: \"Emergency? Call 108 / 112 now.\"" },
        { n: 3, text: "Step 1: choose your language." },
        { n: 4, text: "Step 2: \"Open My data (consent)\" goes to Settings, where you choose what you agree to." },
        { n: 5, text: "Step 3: \"Go to my health profile\" opens the My Health page." },
        { n: 6, text: "\"Go to my dashboard\" skips the rest for now." },
      ],
    },
    {
      type: "steps",
      items: [
        { title: "Read what VITALNEX is and is not", text: "The first card repeats the key limits and the emergency numbers 108 / 112." },
        { title: "Step 1 — choose your language", text: "Use the language selector in the card. The whole app switches at once." },
        { title: "Step 2 — choose what you agree to", text: "Click **Open My data (consent)**. This opens Settings. Turn on \"Process my answers to give me a screening result\" if you want to run a screening; the other three are optional." },
        { title: "Step 3 — fill in your health profile", text: "Click **Go to my health profile**. Questions you do not answer stay empty; nothing is filled in for you." },
        { title: "Or skip", text: "Click **Go to my dashboard**. You can come back to any step later from the left menu." },
      ],
    },

    { type: "h3", text: "Change the language" },
    {
      type: "p",
      text: "The language selector (a globe icon with the current language) is at the top right of the home page, the sign-in page, the sign-up page, the welcome page and every signed-in page. Click it, then click a language. The forgot-password and reset-password pages do not have the selector; they use the language you chose before.",
    },
    {
      type: "list",
      items: [
        "The choice is saved **in this browser** (in `localStorage`, a small store inside the browser, under the name `vitalnex_lang`). It stays after you sign out, on this device only.",
        "The **Language** box on the Settings page, and the language box on the My Health page, also save the choice to your **profile** in the database (`profiles.preferred_language`).",
        "The selector in the top bar changes only the browser, not the profile.",
        "Your profile language is used as the default language of your PDF report (see [History and reports](/admin/docs/history-and-reports)).",
      ],
    },
    {
      type: "callout",
      kind: "info",
      title: "Hindi and Marathi wording",
      text: "Medical wording in Hindi and Marathi is still waiting for review by a native-speaking clinician. The home page says so next to each language (\"Wording review pending\"). English is the source language.",
    },

    { type: "h3", text: "Use the Settings page" },
    {
      type: "image",
      src: "/docs/accounts-and-login/settings.png",
      alt: "The Settings page for a patient with Language and My data sections",
      caption: "Settings at /settings, seen as a patient.",
      markers: [
        { n: 1, text: "Language box. Changes the app language and saves it to your profile." },
        { n: 2, text: "\"My data\" section (patients only)." },
        { n: 3, text: "One consent purpose, with its On/Off badge, notice text, what happens if it is off, and the notice version." },
        { n: 4, text: "The switch for that purpose: \"Withdraw\" when it is on, \"Turn on\" when it is off." },
        { n: 5, text: "\"Download JSON\": a copy of everything VITALNEX holds about you." },
        { n: 6, text: "\"Delete my data…\": opens a confirm box." },
        { n: 7, text: "\"Share my record with a QR code\" goes to the Reports page." },
        { n: 8, text: "Sign-out button (door icon) in the top bar." },
      ],
    },
    {
      type: "table",
      head: ["Part of Settings", "Who sees it", "What you can do"],
      rows: [
        ["Language", "Everyone", "Pick English, हिंदी or मराठी. Applies at once and is saved to your profile. If saving to the profile fails, a yellow warning appears; the screen language still changes."],
        ["Consents", "Patients", "Turn each of four purposes on or off. One click; the change applies at once and shows \"Saved.\""],
        ["Download a copy of my data", "Patients", "Click \"Download JSON\" to get a file with your profile, consents, saved answers, screenings, reviews, shares and appointments."],
        ["Delete my data", "Patients", "Click \"Delete my data…\", type `DELETE` in the box, then \"Delete permanently\". You are signed out and your account no longer exists."],
        ["Share my record with a QR code", "Patients", "A link to the Reports page, where share links are made."],
        ["Staff note", "Clinicians and admins", "Instead of My data, they see: \"Consent settings and data rights apply to patient accounts.\""],
      ],
    },
    {
      type: "callout",
      kind: "info",
      title: "What Settings cannot change",
      text: "There is no box to change your name, phone number, e-mail or role in the app. The database blocks any change to role, e-mail or the demo flag that comes from a signed-in user; only the server can change them.",
    },
    {
      type: "table",
      head: ["Consent purpose (as shown)", "Required?", "If it is off"],
      rows: [
        ["Process my answers to give me a screening result", "Required for screening", "You cannot run a screening."],
        ["Save my results so I can see my history", "Optional", "Each result is shown once and not saved. Your saved history is hidden while this is off."],
        ["Let VITALNEX clinicians review my results", "Optional", "No clinician review. If a result is high or uncertain, you are told to see a doctor directly. Clinicians lose access immediately."],
        ["Count my results in anonymous safety statistics", "Optional", "Your results are left out of governance statistics."],
      ],
    },
    {
      type: "p",
      text: "Each purpose also shows its notice version (for example \"Notice version v1\") and the date it was turned on or withdrawn.",
    },

    { type: "h3", text: "Sign out" },
    {
      type: "steps",
      items: [
        { title: "Click the door icon", text: "It is at the far right of the top bar on every signed-in page. Its label is \"Sign out\"." },
        { title: "You are back on the sign-in page", text: "The app records a sign-out event, ends your session and opens `/auth/login`." },
      ],
    },

    { type: "h3", text: "What each role can open" },
    {
      type: "table",
      head: ["Role", "Home page after sign-in", "Left menu", "Can sign up?"],
      rows: [
        ["Patient", "`/dashboard`", "Overview, My Health, Risk Assessment, AI Trust Passport, Care Connect, AI Health Assistant, then Appointments, Health History, Reports, Settings", "Yes"],
        ["Clinician", "`/doctor/dashboard`", "Clinician dashboard, Patients & reviews, Appointments, AI Trust Passport, Settings", "No (seeded)"],
        ["Admin", "`/admin/dashboard`", "Admin overview, Governance & audit, Documentation, AI Trust Passport, Settings", "No (seeded)"],
      ],
    },
    {
      type: "p",
      text: "The AI Health Assistant page (`/ai-assistant`) is allowed for all three roles, though only patients have it in the menu. Pages open to everyone without signing in: the home page, the sign-in pages, the AI Trust Passport (`/ai-trust`) and shared-record links (`/share/...`).",
    },
    {
      type: "p",
      text: "If you open a page your role is not allowed to see, you are sent to your own home page. If you are not signed in, you are sent to the sign-in page, and the page you wanted is remembered.",
    },
    {
      type: "callout",
      kind: "info",
      text: "Some older pages still exist on disk but are switched off for this MVP and are not in any menu: `/health-insights`, `/voice`, `/consultation/*`, `/admin/datasets` and `/admin/model-lab`. They are not documented as working features.",
    },

    // 5. Behind the scenes
    { type: "h2", id: "what-happens-behind-the-scenes", text: "What happens behind the scenes" },
    {
      type: "p",
      text: "VITALNEX uses **Supabase Auth** (the sign-in part of Supabase) to check passwords, send reset e-mails and give the browser a signed **token** (a small proof of who you are, also called a JWT). The password never reaches the VITALNEX API.",
    },
    {
      type: "list",
      ordered: true,
      items: [
        "**Sign-up.** When a new user is created, a database trigger (`handle_new_user`, an automatic rule in Postgres) adds a row to the `profiles` table: id, e-mail, full name, role, preferred language and the demo flag. The role is always written as `patient`; it is never taken from what the browser sent. The language is kept only if it is `en`, `hi` or `mr`, otherwise `en`.",
        "**Role copy.** A second trigger (`sync_role_to_auth`) copies `profiles.role` into the token's `app_metadata`, a part of the token users cannot write.",
        "**Sign-in.** The browser signs in with Supabase, then reads its own profile row. It then calls the API `POST /api/v1/me/login-event`, which writes a `LOGIN` line to the audit log. If that call fails, sign-in still works and the error is shown in the browser console.",
        "**Page guard.** On every page request, `apps/web/src/proxy.ts` checks the token and refreshes it if needed. It compares the role in the token with the list in `apps/web/src/lib/roles.ts`. Not signed in → sign-in page; wrong role → your own home page.",
        "**API guard.** The page guard is only a first, quick check. The real check is on the server: for every API call, `apps/api/core/auth.py` verifies the token and reads the role fresh from `profiles.role`.",
        "**Database guard (RLS).** Row Level Security (rules inside Postgres that decide which rows each user can read or change) means a user can read and update only their own `profiles` row. A clinician can read a patient's profile only while that patient's \"share with clinician\" consent is on.",
        "**Locked columns.** A trigger (`protect_profile_columns`) refuses any change to role, e-mail, demo flag or id that comes from a signed-in user.",
        "**Sign-out.** The app calls `POST /api/v1/me/logout-event` (a `LOGOUT` audit line), then ends the Supabase session.",
        "**Consents.** New accounts have no consent rows, so all four purposes show Off until the patient turns them on. Each change is written to the audit log by a database trigger. The screening API refuses to run without the \"Process my answers\" consent.",
      ],
    },
    {
      type: "code",
      lang: "text",
      code: "profiles row (one per account)\n  id                  same id as the Supabase Auth user\n  email               set at sign-up, cannot be changed by the user\n  full_name           from the sign-up form\n  role                patient | doctor | admin  (set by the server only)\n  phone_number        optional, not asked anywhere in the app\n  preferred_language  en | hi | mr\n  is_demo             true for seeded demo accounts",
    },
    {
      type: "p",
      text: "For more on how the parts fit together, see [Architecture](/admin/docs/architecture).",
    },

    // 6. Safety and limits
    { type: "h2", id: "safety-and-limits", text: "Safety and limits" },
    {
      type: "callout",
      kind: "danger",
      title: "Emergency",
      text: "Sign-in is never needed to get emergency help. The home page and the welcome page both show \"Emergency? Call 108 / 112 now.\"",
    },
    {
      type: "callout",
      kind: "info",
      title: "Only what is needed (data minimisation)",
      text: "Sign-up asks for name, e-mail and password only. VITALNEX never asks for income, education or access to healthcare (decision D-6 in `docs/DECISIONS.md`). These are used only to check fairness on the training dataset, never as inputs and never asked in the app.",
    },
    {
      type: "callout",
      kind: "info",
      title: "Consent is not asked at sign-up",
      text: "Creating an account does not switch on any consent. The welcome page points patients to Settings, where each purpose is turned on separately and can be withdrawn with one click.",
    },
    {
      type: "callout",
      kind: "warning",
      title: "Limits you should know",
      text: "The language chosen in the browser is per device: on a new device the app starts in English until you choose again, even if your profile says Hindi or Marathi. Clinician and admin accounts cannot be created in the app. There is no in-app way to change your name, e-mail or phone. Reset e-mails depend on the Supabase project's e-mail settings.",
    },
    {
      type: "callout",
      kind: "tip",
      text: "The page guard in the browser is a convenience, not the security wall. Even if someone got around it, the API and the database rules (RLS) would still refuse data that their role may not see.",
    },

    // 7. NITI principles
    { type: "h2", id: "niti-principles", text: "Which NITI Aayog principles this follows" },
    {
      type: "niti",
      items: [
        {
          id: "privacy_security",
          how: [
            "Sign-up asks only name, e-mail and password, and says \"No health information is collected when you create an account.\"",
            "Row Level Security lets each user read and change only their own profile; clinicians see a patient only while that patient's share consent is on.",
            "Each consent purpose is turned on separately in Settings and can be withdrawn with one click; patients can download all their data as JSON or delete it.",
            "The forgot-password page shows the same message whether or not an account exists, so it cannot be used to find out who is registered.",
          ],
        },
        {
          id: "inclusivity_non_discrimination",
          how: [
            "Every screen of sign-in, sign-up, welcome and settings is available in English, Hindi and Marathi through the language selector.",
            "Each language is shown in its own script (हिंदी, मराठी), so a person can find it without reading English.",
            "The chosen language is saved to the profile and used for the patient's PDF report.",
          ],
        },
        {
          id: "accountability",
          how: [
            "Every sign-in and sign-out writes a LOGIN or LOGOUT line to the audit log through the API.",
            "Every consent change is written to the audit log by a database trigger.",
            "Roles are set only by the server's setup script, and a database trigger blocks users from changing their own role.",
          ],
        },
        {
          id: "safety_reliability",
          how: [
            "Pages are guarded three times: the browser page guard, the API role check from `profiles.role`, and the database RLS rules.",
            "If Supabase is not configured, protected pages send people to sign-in instead of showing anything.",
            "A sign-in without a VITALNEX profile is signed out again instead of being let in with no role.",
          ],
        },
        {
          id: "positive_human_values",
          how: [
            "The welcome page tells new patients plainly what VITALNEX is not: not a diagnosis, never names or doses medicines, not validated on Indian patients.",
            "The demo warning on the sign-in page asks people not to enter real health information.",
            "Questions left empty stay empty; the welcome page says nothing is filled in for you.",
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
          q: "Can I sign up as a clinician or admin?",
          a: "No. Sign-up always creates a patient account. Clinician and admin accounts are created by the VITALNEX team with `supabase/seed/seed_demo.py`.",
        },
        {
          q: "What is the difference between /login/doctor and /auth/login?",
          a: "None, apart from a label. `/login/doctor` forwards to `/auth/login?role=doctor`, which shows \"Clinician portal\" under the title and hides the sign-up link. The account's role, not the portal, decides where you land.",
        },
        {
          q: "I signed in as a patient but typed /admin/dashboard. What happens?",
          a: "The page guard sends you to your own home page, `/dashboard`. Even without the guard, the API and the database would refuse admin data.",
        },
        {
          q: "Do I have to go through the welcome page?",
          a: "No. New patients land there once after sign-up, but \"Go to my dashboard\" skips it. Nothing on it is saved except the language choice.",
        },
        {
          q: "Why does the app open in English on my other computer?",
          a: "The on-screen language is stored in each browser. Choose your language again on that device. The Settings language box also saves it to your profile, which is used for your PDF report.",
        },
        {
          q: "Why can't I run a screening right after signing up?",
          a: "A new account has all consents off. Open Settings and turn on \"Process my answers to give me a screening result\". The other consents are optional.",
        },
        {
          q: "Can I change my name or e-mail?",
          a: "Not in this version. There is no field for it in Settings, and the database does not let a user change their own e-mail or role.",
        },
        {
          q: "Does VITALNEX ask about my income or education?",
          a: "No. These are never asked in the app (decision D-6). Sign-up asks only name, e-mail and password.",
        },
        {
          q: "What happens when I delete my data?",
          a: "Your screenings, saved answers, shares, consents, profile and account are removed. Only a minimal record that a deletion happened is kept. You are signed out and cannot undo it.",
        },
      ],
    },
  ],
};

export default page;
