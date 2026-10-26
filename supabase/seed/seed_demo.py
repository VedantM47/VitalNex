"""
VITALNEX demo seed (docs/SPEC.md §6, PROMPTS P1 step 4).

Creates the dummy accounts, their profiles and roles, three synthetic doctors with
bookable slots for the next 14 days, and consents for the demo patients. Uses the
Supabase service key from .env and is idempotent: run it as often as you like.

    python supabase/seed/seed_demo.py

It does NOT create any assessments: those need the real models (P3/P4).
Every account, doctor and slot is synthetic and labelled as such.
"""

import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

import pandas as pd

REPO_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO_ROOT))

from supabase import Client, create_client  # noqa: E402

from apps.api.core.config import settings  # noqa: E402

SYNTHETIC_CSV = REPO_ROOT / "data" / "synthetic" / "Pune_Clinical_Risk_Synthetic_Dataset_20000.csv"
IST = ZoneInfo("Asia/Kolkata")
NOTICE_VERSION = "v1"
SLOT_DAYS = 14
SLOT_MINUTES = 30

ADMIN = {"email": "admin@vitalnex.demo", "full_name": "VITALNEX Demo Admin", "role": "admin", "lang": "en"}

SPECIALIZATIONS = [
    {
        "code": "cardiology",
        "title_en": "Cardiology",
        "title_hi": "हृदय रोग (कार्डियोलॉजी)",
        "title_mr": "हृदयरोग (कार्डिओलॉजी)",
        "description": "Heart and blood vessel conditions.",
    },
    {
        "code": "endocrinology",
        "title_en": "Endocrinology (diabetes)",
        "title_hi": "एंडोक्रिनोलॉजी (मधुमेह)",
        "title_mr": "एंडोक्रिनोलॉजी (मधुमेह)",
        "description": "Diabetes and other hormone conditions.",
    },
    {
        "code": "neurology",
        "title_en": "Neurology (stroke)",
        "title_hi": "न्यूरोलॉजी (स्ट्रोक)",
        "title_mr": "न्यूरोलॉजी (स्ट्रोक)",
        "description": "Brain and nerve conditions, including stroke.",
    },
]

# Fixed ids keep the seed idempotent. Licence numbers are visibly fake.
DOCTORS = [
    {
        "id": "d0000001-0000-0000-0000-000000000001",
        "email": "dr.joshi@vitalnex.demo",
        "full_name": "Dr. Anand Joshi (Demo)",
        "specialization": "cardiology",
        "licence": "SYNTHETIC-DEMO-0001",
        "years": 14,
        "languages": ["English", "Marathi", "Hindi"],
        "facility": "Kothrud Heart Clinic (Demo)",
        "locality": "Kothrud",
        "postal_code": "411038",
        "weekdays": [0, 2, 4],  # Mon, Wed, Fri
        "lang": "mr",
    },
    {
        "id": "d0000001-0000-0000-0000-000000000002",
        "email": "dr.khan@vitalnex.demo",
        "full_name": "Dr. Sana Khan (Demo)",
        "specialization": "endocrinology",
        "licence": "SYNTHETIC-DEMO-0002",
        "years": 11,
        "languages": ["English", "Hindi"],
        "facility": "Baner Diabetes Care Centre (Demo)",
        "locality": "Baner",
        "postal_code": "411045",
        "weekdays": [1, 3, 5],  # Tue, Thu, Sat
        "lang": "hi",
    },
    {
        "id": "d0000001-0000-0000-0000-000000000003",
        "email": "dr.patil@vitalnex.demo",
        "full_name": "Dr. Meera Patil (Demo)",
        "specialization": "neurology",
        "licence": "SYNTHETIC-DEMO-0003",
        "years": 9,
        "languages": ["English", "Marathi"],
        "facility": "Shivajinagar Neuro Clinic (Demo)",
        "locality": "Shivajinagar",
        "postal_code": "411005",
        "weekdays": [0, 1, 3],  # Mon, Tue, Thu
        "lang": "en",
    },
]
DAILY_HOURS = (10, 13)  # 10:00-13:00 IST

# Patients 1-4 share with clinicians, 5-6 do not (PROMPTS P1 step 4).
PATIENT_LANGS = ["en", "hi", "mr", "en", "hi", "mr"]
SHARING_PATIENTS = {1, 2, 3, 4}
HEALTH_CONTEXT_LOCALITIES = {"Urban_Pune", "Peri_Urban_Pune", "PCMC"}


def fail(message: str) -> None:
    print(f"ERROR: {message}", file=sys.stderr)
    sys.exit(1)


def service_client() -> Client:
    if not settings.supabase_configured:
        fail("SUPABASE_URL and SUPABASE_SECRET_KEY must be set in .env")
    if not settings.DEMO_PASSWORD:
        fail("DEMO_PASSWORD must be set in .env")
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SECRET_KEY)


def existing_users(client: Client) -> dict:
    by_email = {}
    page = 1
    while True:
        users = client.auth.admin.list_users(page=page, per_page=200)
        if not users:
            break
        for u in users:
            if u.email:
                by_email[u.email.lower()] = u.id
        page += 1
    return by_email


def ensure_user(client: Client, known: dict, email: str, full_name: str) -> str:
    """Create the auth user, or reset its password to DEMO_PASSWORD if it exists."""
    attrs = {
        "password": settings.DEMO_PASSWORD,
        "email_confirm": True,
        "user_metadata": {"full_name": full_name},
    }
    user_id = known.get(email)
    if user_id:
        client.auth.admin.update_user_by_id(user_id, attrs)
        return user_id
    created = client.auth.admin.create_user({"email": email, **attrs})
    known[email] = created.user.id
    return created.user.id


def set_profile(client: Client, user_id: str, full_name: str, role: str, lang: str) -> None:
    # The signup trigger created the row as 'patient'; the service role sets the real role
    # (which the sync trigger mirrors into app_metadata).
    client.table("profiles").update(
        {"full_name": full_name, "role": role, "preferred_language": lang, "is_demo": True}
    ).eq("id", user_id).execute()


def synthetic_demographics(n: int) -> list:
    if not SYNTHETIC_CSV.exists():
        fail(f"{SYNTHETIC_CSV} not found (see data/synthetic/README.md)")
    df = pd.read_csv(SYNTHETIC_CSV, usecols=["patient_id", "age", "sex", "locality_type"])
    pool = df[df["age"].between(25, 75) & df["locality_type"].isin(HEALTH_CONTEXT_LOCALITIES)]
    rows = pool.sample(n=n, random_state=42).sort_values("patient_id")
    return rows.to_dict("records")


def seed_admin(client: Client, known: dict) -> None:
    user_id = ensure_user(client, known, ADMIN["email"], ADMIN["full_name"])
    set_profile(client, user_id, ADMIN["full_name"], ADMIN["role"], ADMIN["lang"])


def seed_doctors(client: Client, known: dict) -> None:
    client.table("doctor_specializations").upsert(SPECIALIZATIONS, on_conflict="code").execute()

    now = datetime.now(IST)
    first_day = (now + timedelta(days=1)).date()
    for doc in DOCTORS:
        user_id = ensure_user(client, known, doc["email"], doc["full_name"])
        set_profile(client, user_id, doc["full_name"], "doctor", doc["lang"])

        client.table("doctors").upsert(
            {
                "id": doc["id"],
                "profile_id": user_id,
                "full_name": doc["full_name"],
                "medical_license_number": doc["licence"],
                "specialization": doc["specialization"],
                "years_of_experience": doc["years"],
                "bio": "Synthetic demo clinician. Not a real doctor.",
                "languages_spoken": doc["languages"],
                "consultation_modes": ["in_person"],
                "rating": None,
                "review_count": None,
                "is_demo": True,
                "is_active": True,
            },
            on_conflict="id",
        ).execute()

        client.table("doctor_locations").delete().eq("doctor_id", doc["id"]).execute()
        client.table("doctor_locations").insert(
            {
                "doctor_id": doc["id"],
                "facility_name": doc["facility"],
                "locality": doc["locality"],
                "city": "Pune",
                "state": "Maharashtra",
                "postal_code": doc["postal_code"],
                "distance_estimate_km": None,
            }
        ).execute()

        slots = []
        for offset in range(SLOT_DAYS):
            day = first_day + timedelta(days=offset)
            if day.weekday() not in doc["weekdays"]:
                continue
            start = datetime(day.year, day.month, day.day, DAILY_HOURS[0], tzinfo=IST)
            end_of_day = datetime(day.year, day.month, day.day, DAILY_HOURS[1], tzinfo=IST)
            while start < end_of_day:
                end = start + timedelta(minutes=SLOT_MINUTES)
                slots.append(
                    {
                        "doctor_id": doc["id"],
                        "starts_at": start.astimezone(timezone.utc).isoformat(),
                        "ends_at": end.astimezone(timezone.utc).isoformat(),
                    }
                )
                start = end
        if slots:
            client.table("doctor_slots").upsert(
                slots, on_conflict="doctor_id,starts_at", ignore_duplicates=True
            ).execute()
        print(f"  {doc['email']:<26} {doc['specialization']:<14} {len(slots)} slots")


def seed_patients(client: Client, known: dict) -> None:
    demographics = synthetic_demographics(len(PATIENT_LANGS))
    now = datetime.now(timezone.utc).isoformat()
    for i, (lang, demo) in enumerate(zip(PATIENT_LANGS, demographics), start=1):
        email = f"patient{i}@vitalnex.demo"
        full_name = f"Demo Patient {i} (synthetic)"
        user_id = ensure_user(client, known, email, full_name)
        set_profile(client, user_id, full_name, "patient", lang)

        hp = (
            client.table("health_profiles")
            .upsert(
                {"user_id": user_id, "age": int(demo["age"]), "sex": int(demo["sex"])},
                on_conflict="user_id",
            )
            .execute()
        )
        client.table("health_context").upsert(
            {"health_profile_id": hp.data[0]["id"], "locality_type": demo["locality_type"]},
            on_conflict="health_profile_id",
        ).execute()

        consents = []
        for purpose in ("assessment_processing", "store_history", "share_with_clinician", "aggregate_audit"):
            granted = purpose != "share_with_clinician" or i in SHARING_PATIENTS
            consents.append(
                {
                    "user_id": user_id,
                    "purpose": purpose,
                    "granted": granted,
                    "granted_at": now if granted else None,
                    "withdrawn_at": None,
                    "notice_version": NOTICE_VERSION,
                }
            )
        client.table("consents").upsert(consents, on_conflict="user_id,purpose").execute()
        shares = "shares with clinicians" if i in SHARING_PATIENTS else "does not share"
        print(
            f"  {email:<26} age {int(demo['age']):>2}, sex {int(demo['sex'])}, "
            f"{demo['locality_type']:<16} lang {lang}, {shares}  (from {demo['patient_id']})"
        )


def main() -> None:
    client = service_client()
    known = existing_users(client)
    print("Admin:")
    seed_admin(client, known)
    print(f"  {ADMIN['email']}")
    print("Doctors (synthetic):")
    seed_doctors(client, known)
    print("Patients (synthetic demographics from data/synthetic):")
    seed_patients(client, known)
    print("Done. All accounts use DEMO_PASSWORD from .env. No assessments were created.")


if __name__ == "__main__":
    main()
