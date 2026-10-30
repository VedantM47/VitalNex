import type { DocPage } from "../types";

const page: DocPage = {
  slug: "care-connect",
  title: "Care Connect and appointments",
  summary:
    "Care Connect lets a patient find a demo doctor and book a time slot. The Appointments page lists those bookings and lets the patient cancel one. All doctors, slots and bookings are synthetic demo data.",
  audience: "Patients",
  blocks: [
    // ── 1. What it is ──
    { type: "h2", id: "what-it-is", text: "What this feature is" },
    {
      type: "p",
      text: "VITALNEX does not stop at a screening result. After a screening, it tells the person what kind of care to seek and how soon (see [Understanding your results](/admin/docs/understanding-results)). **Care Connect** is the next step: it shows a short list of doctors and their free time slots, and lets the patient book one slot.",
    },
    {
      type: "p",
      text: "The **Appointments** page is the patient's list of bookings. It shows upcoming, past and cancelled bookings, and lets the patient cancel a booking that is still open.",
    },
    {
      type: "callout",
      kind: "warning",
      title: "Everything here is demo data",
      text: "There are exactly three doctors, and all of them are **synthetic** (made up for the demo). Their names end in \"(Demo)\", their licence numbers start with `SYNTHETIC-DEMO-`, and their bio says \"Synthetic demo clinician. Not a real doctor.\" Booking a slot does **not** make a real appointment anywhere. The page itself says this in a yellow notice at the top.",
    },
    { type: "h3", text: "Who uses it" },
    {
      type: "list",
      items: [
        "**Patients** use Care Connect and Appointments. Only the patient role can open these two pages.",
        "**Doctors** do not use these pages. A doctor sees the bookings made with them on their own Appointments page (`/doctor/appointments`), where they can confirm, complete or cancel a booking. See [Clinician workspace](/admin/docs/clinician-workspace).",
        "**Admins** cannot open these pages.",
      ],
    },
    { type: "h3", text: "The three demo doctors" },
    {
      type: "p",
      text: "These come from the demo seed script (`supabase/seed/seed_demo.py`). Each doctor matches one of the three conditions VITALNEX screens for.",
    },
    {
      type: "table",
      head: ["Doctor", "Specialty", "Matches screening for", "Clinic (demo)", "Languages", "Days with slots"],
      rows: [
        ["Dr. Anand Joshi (Demo)", "Cardiology (heart)", "Heart disease", "Kothrud Heart Clinic (Demo), Kothrud", "English, Marathi, Hindi", "Mon, Wed, Fri"],
        ["Dr. Sana Khan (Demo)", "Endocrinology (diabetes and hormones)", "Diabetes / prediabetes", "Baner Diabetes Care Centre (Demo), Baner", "English, Hindi", "Tue, Thu, Sat"],
        ["Dr. Meera Patil (Demo)", "Neurology (brain and stroke)", "Stroke", "Shivajinagar Neuro Clinic (Demo), Shivajinagar", "English, Marathi", "Mon, Tue, Thu"],
      ],
    },
    {
      type: "p",
      text: "Dr. Joshi has 14 years of experience, Dr. Khan 11 and Dr. Patil 9 (also from the seed script). There are **no star ratings or review counts**. Earlier versions had made-up ratings; a database migration removed them because a demo doctor has no real reviews.",
    },

    // ── 2. Where to find it ──
    { type: "h2", id: "where-to-find-it", text: "Where to find it" },
    {
      type: "table",
      head: ["Page", "Address (URL)", "How to get there", "Who can open it"],
      rows: [
        ["Care Connect", "`/care-connect`", "Left menu: **Care Connect**. Also the \"Find a demo clinician\" button on the dashboard, and the \"Find a doctor\" button under a screening result.", "Patients only"],
        ["Appointments", "`/appointments`", "Left menu: **Appointments**. Also the \"See all appointments\" link on the Care Connect page.", "Patients only"],
      ],
    },
    {
      type: "p",
      text: "Both addresses are limited to the `patient` role (`apps/web/src/lib/roles.ts`, checked in `apps/web/src/proxy.ts` before the page loads). A signed-out visitor is sent to the login page; a doctor or admin is sent to their own home page.",
    },
    {
      type: "callout",
      kind: "info",
      title: "Video consultations are switched off",
      text: "The old video consultation pages (`/consultation/...`) are **frozen** in this MVP (MVP = the first, smallest working version). The files are kept, but the app shows a \"not part of the MVP\" notice instead. The video call API also refuses every request. All demo bookings are \"In-person visit\".",
    },

    // ── 3. Screenshots ──
    { type: "h2", id: "screenshots", text: "What the screen looks like" },
    {
      type: "image",
      src: "/docs/care-connect/overview.png",
      alt: "The Care Connect page with the demo notice, the emergency line, the upcoming appointments box, the specialty filter and a doctor card.",
      caption: "Care Connect, signed in as a demo patient.",
      markers: [
        { n: 1, text: "**Demo notice.** Says that all doctors and slots are synthetic and no real appointment is made." },
        { n: 2, text: "**Emergency line** (red text). \"This is not for emergencies. If you have chest pain, signs of stroke or severe breathlessness, call 108 / 112 now.\"" },
        { n: 3, text: "**Your upcoming appointments.** A short list of your open bookings, with a \"See all appointments\" link. If you have none, it says \"You have no upcoming appointments.\"" },
        { n: 4, text: "**Specialty filter.** Choose \"All specialties\", Cardiology, Endocrinology or Neurology." },
        { n: 5, text: "**Doctor card.** One card per demo doctor that matches the filter." },
      ],
    },
    {
      type: "image",
      src: "/docs/care-connect/doctor-card.png",
      alt: "Close-up of one demo doctor card with a slot chosen and the Book this slot button.",
      caption: "One doctor card, with a slot chosen but not yet booked.",
      markers: [
        { n: 1, text: "**Doctor name** and the \"Demo doctor (synthetic)\" badge." },
        { n: 2, text: "**Specialty** in plain words, for example \"Cardiology (heart)\"." },
        { n: 3, text: "**Details**: years of experience, languages spoken, and the demo clinic with its area of Pune." },
        { n: 4, text: "**Choose a free slot.** A drop-down list of the next free times for this doctor (up to 10)." },
        { n: 5, text: "**Book this slot.** Greyed out until you pick a slot. One click books it straight away." },
      ],
    },

    // ── 4. How to use it ──
    { type: "h2", id: "how-to-use-it", text: "How to use it" },
    { type: "h3", text: "Book an appointment" },
    {
      type: "steps",
      items: [
        { title: "Sign in as a patient", text: "Use a demo patient account, for example `patient1@vitalnex.demo`. See [Accounts and login](/admin/docs/accounts-and-login)." },
        { title: "Open Care Connect", text: "Click **Care Connect** in the left menu. The page loads the demo doctors and your upcoming bookings." },
        { title: "Read the two warnings", text: "The yellow box says the doctors are demo data. The red line says this page is not for emergencies. If you have chest pain, signs of stroke or severe breathlessness, stop here and call **108 / 112**." },
        { title: "Pick a specialty (optional)", text: "Use the **Specialty** drop-down to show only one kind of doctor. \"All specialties\" shows all three doctors. The list reloads as soon as you change it." },
        { title: "Look at the doctor cards", text: "Each card shows the doctor's name, specialty, years of experience, languages and demo clinic. Use the languages line if you want a doctor who speaks Hindi or Marathi." },
        { title: "Choose a free slot", text: "Open **Choose a free slot** on the doctor you want and pick a date and time. Times are shown in your browser's local time and in the app language you chose. If a doctor has no free time left, the card says \"No free slots in the next 14 days.\"" },
        { title: "Click Book this slot", text: "There is no extra confirm screen. The booking is made as soon as you click. While it is saving, the button shows a spinner." },
        { title: "Read the message at the top", text: "If it worked, a green message says \"Booked (demo) with <doctor> on <time>.\" The booking now appears under **Your upcoming appointments**, and that slot disappears from the doctor's list. If someone else took the slot a moment earlier, you see \"That slot is no longer free. Please choose another one.\" Pick another time and try again." },
      ],
    },
    {
      type: "image",
      src: "/docs/care-connect/booked.png",
      alt: "Care Connect after a booking, with the green success message above the upcoming appointments box, which has not reloaded yet.",
      caption: "Right after booking a slot.",
      markers: [
        { n: 1, text: "**Success message**: \"Booked (demo) with … on …\"." },
        { n: 2, text: "**Your upcoming appointments.** The list reloads right after the success message, so for a second or two it can still show the old state (here: \"You have no upcoming appointments.\"). The new booking then appears with status \"Booked\", as on the Appointments page below." },
      ],
    },
    { type: "h3", text: "When the app suggests a specialty for you" },
    {
      type: "p",
      text: "After a screening, the result page always has a **Find a doctor** button that opens Care Connect. In one case the app goes further and picks a specialty for you:",
    },
    {
      type: "list",
      items: [
        "The overall next step must be **\"see a doctor soon\"**. The server chooses this step when at least one condition is in the **High** band and the model was confident for every condition (rule in `apps/api/services/screening.py`, function `next_step`).",
        "The app then takes the condition with the highest band (ties keep the order diabetes, heart, stroke) and maps it: diabetes → Endocrinology, heart disease → Cardiology, stroke → Neurology (`apps/web/src/lib/care.ts`).",
        "The result page shows a box: \"Your result says to see a doctor soon. Care Connect opens with this specialty pre-selected (demo doctors only).\" with a button such as \"Book a demo Cardiology (heart) doctor\".",
        "Care Connect then opens with that specialty already chosen in the filter and a small line under it: \"Pre-selected from your screening result: … You can change it.\"",
      ],
    },
    {
      type: "p",
      text: "For any other next step (for example \"discuss at your next check-up\" or \"routine check-up\"), the button opens Care Connect with **All specialties**. When the result is an emergency, no screening levels are shown at all and the person is told to call 108 / 112.",
    },
    {
      type: "image",
      src: "/docs/care-connect/suggested.png",
      alt: "Care Connect opened from a result, with Cardiology pre-selected in the specialty filter and the explanation line below it.",
      caption: "Care Connect opened with a suggested specialty (address `/care-connect?specialty=cardiology`).",
      markers: [
        { n: 1, text: "**Specialty filter**, already set to the suggested specialty." },
        { n: 2, text: "**Explanation line.** Tells you the choice came from your screening result and that you can change it." },
      ],
    },
    {
      type: "callout",
      kind: "tip",
      text: "The suggestion is only a starting point. It is a filter, not a referral. The patient can switch to any specialty or to \"All specialties\".",
    },
    { type: "h3", text: "See and cancel your appointments" },
    {
      type: "steps",
      items: [
        { title: "Open Appointments", text: "Click **Appointments** in the left menu, or **See all appointments** on Care Connect." },
        { title: "Choose a tab", text: "**Upcoming**: open bookings whose time has not passed yet. **Past**: bookings whose time has passed, or that the doctor marked Completed (cancelled ones are not here). **Cancelled**: bookings that you or the doctor cancelled." },
        { title: "Read a booking card", text: "Each card shows the doctor, the specialty, the date and time, the visit type (\"In-person visit · Demo clinic\"), a status badge and a short reference number (the first 8 characters of the booking id). If the doctor left notes, they appear in a green box." },
        { title: "Cancel if you need to", text: "Click **Cancel appointment** on the card. The browser asks \"Cancel this appointment?\". Click OK. A message says \"Appointment cancelled.\" and the booking moves to the Cancelled tab. The slot becomes free again for other patients." },
        { title: "Refresh", text: "Click **Refresh** to reload the list, for example after a doctor confirmed your booking." },
        { title: "Book another", text: "Click **Book an appointment** to go back to Care Connect." },
      ],
    },
    {
      type: "image",
      src: "/docs/care-connect/appointments.png",
      alt: "The Appointments page with the three tabs and one booking card.",
      caption: "The Appointments page, Upcoming tab.",
      markers: [
        { n: 1, text: "**Book an appointment** opens Care Connect. **Refresh** sits next to it." },
        { n: 2, text: "**Tabs**: Upcoming, Past, Cancelled." },
        { n: 3, text: "**Booking card**: doctor, specialty, date and time, visit type." },
        { n: 4, text: "**Status badge**, for example \"Booked\" or \"Confirmed\"." },
        { n: 5, text: "**Cancel appointment.** Only shown while the booking is still open." },
      ],
    },
    { type: "h3", text: "What each status means" },
    {
      type: "table",
      head: ["Status shown", "Stored value", "Meaning", "Who sets it"],
      rows: [
        ["Booked", "`scheduled`", "The slot is booked. The doctor has not confirmed yet.", "Set automatically when the patient books."],
        ["Confirmed", "`confirmed`", "The doctor has confirmed the booking.", "The doctor, on their Appointments page."],
        ["In progress", "`in_progress`", "Allowed by the database, but nothing in the MVP sets it.", "Nobody in the MVP."],
        ["Completed", "`completed`", "The doctor marked the visit as done. It can no longer be cancelled.", "The doctor."],
        ["Cancelled", "`cancelled`", "The booking is cancelled and the slot is free again. It cannot be changed back.", "The patient or the doctor."],
      ],
    },
    {
      type: "callout",
      kind: "info",
      title: "No rescheduling",
      text: "There is no \"move to another time\" button. To change the time, cancel the booking and book a new slot. A patient can only cancel; the server refuses any other change from a patient.",
    },

    // ── 5. Behind the scenes ──
    { type: "h2", id: "what-happens-behind-the-scenes", text: "What happens behind the scenes" },
    {
      type: "p",
      text: "The web page never talks to the database directly for bookings. It calls the VITALNEX **API** (the app's own server, written in FastAPI) and the API reads and writes the **Supabase** database (Postgres). Code: `apps/api/routers/v1/doctors.py` and `apps/api/services/doctor_service.py`.",
    },
    { type: "h3", text: "Where the data lives" },
    {
      type: "table",
      head: ["Table", "What it holds"],
      rows: [
        ["`doctors`", "The three demo doctors: name, specialty code, years of experience, languages, `is_demo = true`."],
        ["`doctor_specializations`", "The specialty codes (`cardiology`, `endocrinology`, `neurology`) and their titles."],
        ["`doctor_locations`", "The demo clinic name, area, city (Pune) and postal code for each doctor."],
        ["`doctor_slots`", "One row per bookable time: doctor, start time, end time."],
        ["`appointments`", "One row per booking: patient, doctor, slot, time, status, visit type, optional reason, optional doctor notes."],
      ],
    },
    { type: "h3", text: "How the slots are made" },
    {
      type: "list",
      items: [
        "The seed script `supabase/seed/seed_demo.py` creates slots for the **14 days** starting the day after it runs.",
        "On each doctor's working days there are slots from **10:00 to 13:00 India time**, each **30 minutes** long (6 slots a day).",
        "Slots are only created when the seed script runs. If the script has not been run for more than two weeks, the cards will say \"No free slots in the next 14 days.\" Running the script again adds new slots and does not duplicate old ones.",
      ],
    },
    { type: "h3", text: "Loading the doctor list" },
    {
      type: "list",
      items: [
        "The page calls `GET /api/v1/doctors`, adding `?specialization=<code>` when a specialty is chosen.",
        "The server returns active doctors, sorted by name, each with its clinic and its **next free slots** (at most 10 per doctor).",
        "A slot counts as free when its start time is in the future **and** no booking that is not cancelled points at it. There is no separate \"booked\" flag; the bookings table is the only truth.",
        "The API can also filter by area, language and visit type, but the Care Connect page only offers the specialty filter.",
      ],
    },
    { type: "h3", text: "Making a booking" },
    {
      type: "steps",
      items: [
        { title: "The page sends the slot", text: "`POST /api/v1/appointments` with the slot id and the visit type `in_person`. The page does not send a reason or a screening id." },
        { title: "The server checks the person", text: "Only a signed-in user with the **patient** role may book. The patient is always the signed-in user; the page cannot book for someone else." },
        { title: "The server checks the slot", text: "If the slot does not exist, it answers \"That slot does not exist.\" If the slot has already started, it answers \"That slot is in the past.\" The time of the booking is always copied from the slot, never from the browser." },
        { title: "The database stops double booking", text: "A unique rule in the database (`uniq_active_appointment_per_slot`) allows only one booking that is not cancelled per slot. If two people click at the same moment, only one booking is saved. The other gets error 409 (\"conflict\"), and the page shows \"That slot is no longer free.\"" },
        { title: "The booking is saved", text: "Status is set to `scheduled` (shown as \"Booked\"). The page then reloads the doctor list and your bookings." },
      ],
    },
    { type: "h3", text: "Cancelling and other changes" },
    {
      type: "list",
      items: [
        "`PATCH /api/v1/appointments/<id>` changes a booking. The server first reads the booking with the user's own access rights. If the user may not see it, the answer is \"Appointment not found.\"",
        "A **patient** may only set the status to `cancelled`. Anything else gets \"Patients can only cancel an appointment.\" (error 403).",
        "A **doctor** may set `confirmed`, `completed` or `cancelled`. The API also accepts doctor notes, but the doctor page in this MVP has no box for writing notes.",
        "A booking that is already cancelled or completed cannot be changed again (error 409).",
      ],
    },
    { type: "h3", text: "Who can see a booking" },
    {
      type: "list",
      items: [
        "Database **row level security** (RLS: rules inside the database that decide which rows each signed-in user may read) lets a patient read only their own bookings, and a doctor read only bookings made with them.",
        "The doctor list and the slot list are public to read, because they hold only demo directory data and no patient data.",
        "Writing bookings is done by the API with a server key, only **after** the API has checked who the user is and that they own the booking.",
      ],
    },
    { type: "h3", text: "What the doctor sees when you book" },
    {
      type: "list",
      items: [
        "The time, the status and the visit type of the booking.",
        "Your **full name**. The API adds the patient's name only when the person asking is a doctor, so it goes only to the doctor you booked with.",
        "Nothing about your screening. Booking does **not** share your answers or results. Screening results reach clinicians only through the separate \"share with clinician\" consent, which you control in **My data** under Settings (see [AI Trust Passport, consent and sharing](/admin/docs/trust-passport) and [Clinician workspace](/admin/docs/clinician-workspace)).",
      ],
    },
    { type: "h3", text: "API calls used" },
    {
      type: "table",
      head: ["Call", "Used by", "What it does"],
      rows: [
        ["`GET /api/v1/doctors`", "Care Connect", "List demo doctors with their next free slots. No sign-in needed."],
        ["`GET /api/v1/doctors/<id>`", "Not used by the page", "One doctor with free slots."],
        ["`GET /api/v1/appointments`", "Care Connect, Appointments", "Your own bookings (patient) or bookings with you (doctor)."],
        ["`POST /api/v1/appointments`", "Care Connect", "Book a slot. Patients only."],
        ["`PATCH /api/v1/appointments/<id>`", "Appointments, Care Connect", "Cancel (patient) or confirm / complete / cancel (doctor)."],
      ],
    },
    {
      type: "p",
      text: "Full details are in the [API reference](/admin/docs/api-reference).",
    },

    // ── 6. Safety and limits ──
    { type: "h2", id: "safety-and-limits", text: "Safety and limits" },
    {
      type: "callout",
      kind: "danger",
      title: "Not for emergencies",
      text: "Booking is never the answer to an emergency. The Care Connect page always shows the line \"This is not for emergencies. If you have chest pain, signs of stroke or severe breathlessness, call 108 / 112 now.\" When a screening finds emergency warning signs, the result page shows 108 / 112 first and gives no screening levels.",
    },
    {
      type: "callout",
      kind: "warning",
      title: "Not real doctors, not real appointments",
      text: "All three doctors and every slot are synthetic. Nobody will call the patient and no clinic expects them. A real product would need real, verified clinicians before this page could be used.",
    },
    {
      type: "list",
      items: [
        "**No medicine advice.** Care Connect shows doctors and times only. It never names or suggests a medicine.",
        "**No diagnosis.** A suggested specialty only means the screening answers are similar to people who have been told they have that condition. It does not mean the person has it.",
        "**No video or phone calls.** Every booking from the page is an in-person visit type. Video consultation is switched off in the MVP.",
        "**No rescheduling, no reminders.** The app sends no SMS, email or calendar invite. To change the time, cancel and book again.",
        "**No reason box.** The page does not ask why you are booking, so it does not collect that data. The database has a place for a reason, but the MVP page leaves it empty.",
        "**No payments, ratings or reviews.** None of these exist in the MVP.",
        "**Only one filter.** The page filters by specialty only, even though the API can also filter by area, language and visit type.",
        "**Slots run out.** Slots exist only for 14 days after the seed script was last run.",
        "**Not in the audit log.** Bookings and cancellations are stored with their own created and updated times, but they are not written to the separate audit log in this MVP.",
      ],
    },

    // ── 7. NITI principles ──
    { type: "h2", id: "niti-principles", text: "Which NITI Aayog principles this follows" },
    {
      type: "niti",
      items: [
        {
          id: "safety_reliability",
          how: [
            "The red line \"call 108 / 112 now\" is always shown on Care Connect, so a person in an emergency is not sent to a booking form.",
            "A unique rule in the database allows only one active booking per slot, so two people can never hold the same time.",
            "The server rejects slots that do not exist or have already started, and takes the booking time from the slot, not from the browser.",
          ],
        },
        {
          id: "privacy_security",
          how: [
            "Row level security lets a patient read only their own bookings and a doctor only the bookings made with them.",
            "The patient's name is sent only to the doctor they booked with. Booking does not share any screening answers or results; that needs the separate share-with-clinician consent.",
            "The page asks for no reason, phone number or address, so no extra personal data is collected (data minimisation).",
            "Nothing about a booking is sent to an outside service. It stays in the project's own database.",
          ],
        },
        {
          id: "transparency",
          how: [
            "Every doctor card carries a \"Demo doctor (synthetic)\" badge, and a notice says no real appointment is made.",
            "When a specialty is pre-selected, the page says why (\"Pre-selected from your screening result\") and that the patient can change it.",
            "Invented ratings and review counts were removed from the doctor data, so nothing on the card is made up beyond the clearly labelled demo profile.",
          ],
        },
        {
          id: "accountability",
          how: [
            "Only a doctor can confirm or complete a booking; the app never confirms on its own.",
            "Each booking keeps its status and its created and updated times in the `appointments` table, so changes can be checked later.",
            "The server checks the user's role on every booking call: patients may only cancel, doctors may confirm, complete or cancel.",
          ],
        },
        {
          id: "inclusivity_non_discrimination",
          how: [
            "The pages are available in English, Hindi and Marathi, and dates are shown in the chosen language.",
            "Each card lists the languages the doctor speaks, so a patient can pick a doctor they can talk to.",
            "Specialties are named in plain words, for example \"Neurology (brain and stroke)\".",
          ],
        },
        {
          id: "positive_human_values",
          how: [
            "The suggested specialty is a gentle starting point, not an order. The patient always chooses the doctor and time.",
            "The page never says the patient has a disease and never names a medicine.",
            "The app is honest that doctors and bookings are demo data, so nobody is misled into thinking care has been arranged.",
          ],
        },
      ],
    },

    // ── 8. FAQ ──
    { type: "h2", id: "common-questions", text: "Common questions" },
    {
      type: "faq",
      items: [
        {
          q: "Are these real doctors?",
          a: "No. All three doctors are synthetic demo profiles made by the seed script. Their names end in \"(Demo)\" and their licence numbers start with `SYNTHETIC-DEMO-`. Booking does not create a real appointment.",
        },
        {
          q: "Why does Care Connect open with a specialty already chosen?",
          a: "Because you came from a screening result whose next step was \"see a doctor soon\". The app picks the specialty for the condition with the highest band (diabetes → Endocrinology, heart → Cardiology, stroke → Neurology). You can change the filter at any time.",
        },
        {
          q: "I clicked Book and got \"That slot is no longer free\". What happened?",
          a: "Someone else booked the same slot a moment before you, or the list was out of date. The database allows only one active booking per slot. The page reloads the list; pick another time.",
        },
        {
          q: "Can I change the time of a booking?",
          a: "Not directly. Cancel the booking on the Appointments page, then book a new slot in Care Connect.",
        },
        {
          q: "Why is the Cancel button missing on some bookings?",
          a: "A booking that is already Cancelled or Completed cannot be changed, so the button is hidden. The server would also refuse it.",
        },
        {
          q: "Does the doctor see my screening results when I book?",
          a: "No. The doctor sees your name and the booking time, status and visit type. Your screening results reach clinicians only if you have turned on the share-with-clinician consent, and that is separate from booking.",
        },
        {
          q: "A doctor card says \"No free slots in the next 14 days\". Why?",
          a: "Either every slot is booked, or the demo slots have run out because the seed script (`python supabase/seed/seed_demo.py`) has not been run in the last two weeks. Running it again adds new slots.",
        },
        {
          q: "Can I book a video or phone consultation?",
          a: "No. Video consultation is switched off in the MVP, and the page books every slot as an in-person visit.",
        },
        {
          q: "I have chest pain right now. Should I book?",
          a: "No. Call **108 / 112** now. Care Connect is not for emergencies, and the page says so in red.",
        },
      ],
    },
  ],
};

export default page;
