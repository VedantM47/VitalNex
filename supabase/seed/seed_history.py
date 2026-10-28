"""
Demo assessment history (PROMPTS P4 step 6).

For demo patients 1-6 (created by seed_demo.py) this runs the REAL screening engine on 2-4
plausible answer sequences dated over the past months and stores them with
assessment_mode = 'demo'. Age and sex come from the patient's synthetic demo profile; the other
answers are invented for the demo and labelled as such. Idempotent: previous demo assessments of
these patients are replaced.

    python supabase/seed/seed_history.py
"""

import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

import numpy as np

REPO_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO_ROOT))
sys.path.insert(0, str(Path(__file__).resolve().parent))

from apps.api.schemas import AssessmentRequest  # noqa: E402
from apps.api.services import screening  # noqa: E402
from apps.api.services.prediction_service import stored_inputs  # noqa: E402
from seed_demo import existing_users, service_client  # noqa: E402

N_PATIENTS = 6

# P10 demo: patient1 (shares with clinicians) gets one extra, most recent visit with answers that
# the real models score High, so the clinician review/override part of the demo has a High case.
# These answers are invented for the demo (labelled assessment_mode='demo'); the band is NOT
# hard-coded: the script runs screening.assess and only reports what it returns.
# Height/weight give BMI 27.0. Offline check (43-year-old male profile): see_doctor_soon.
HIGH_CASE_PATIENT = 1
HIGH_CASE_ANSWERS = {
    "height_cm": 168.0, "weight_kg": 76.2, "high_bp": True, "high_chol": True, "smoker": True,
    "phys_activity": False, "fruits": False, "veggies": True, "heavy_alcohol": False,
    "gen_health": 5, "ment_health_days": 2, "phys_health_days": 7, "diff_walk": True,
}


def visits(age: int, sex: int, rng: np.random.Generator) -> list[dict]:
    """2-4 visits, oldest first. Lifestyle answers drift a little between visits."""
    height = float(rng.choice([152, 158, 163, 168, 172, 176]))
    base = {
        "age": age, "sex": "male" if sex == 1 else "female", "height_cm": height,
        "weight_kg": round(float(rng.uniform(22, 31)) * (height / 100) ** 2, 1),
        "high_bp": bool(rng.random() < 0.45), "high_chol": bool(rng.random() < 0.4),
        "smoker": bool(rng.random() < 0.35), "phys_activity": bool(rng.random() < 0.5),
        "fruits": bool(rng.random() < 0.6), "veggies": bool(rng.random() < 0.8),
        "heavy_alcohol": bool(rng.random() < 0.08), "gen_health": int(rng.integers(2, 5)),
        "ment_health_days": int(rng.choice([0, 0, 2, 5, 10])),
        "phys_health_days": int(rng.choice([0, 0, 3, 7, 14])), "diff_walk": bool(rng.random() < 0.15),
    }
    out = [base]
    for _ in range(int(rng.integers(1, 4))):
        v = dict(out[-1])
        v["weight_kg"] = round(v["weight_kg"] * float(rng.uniform(0.96, 1.02)), 1)
        v["phys_activity"] = v["phys_activity"] or bool(rng.random() < 0.4)
        v["phys_health_days"] = max(0, v["phys_health_days"] - int(rng.integers(0, 4)))
        out.append(v)
    return out


def main() -> None:
    client = service_client()
    known = existing_users(client)
    now = datetime.now(timezone.utc)
    for i in range(1, N_PATIENTS + 1):
        email = f"patient{i}@vitalnex.demo"
        user_id = known.get(email)
        if not user_id:
            print(f"  {email}: not found, run seed_demo.py first")
            continue
        hp = client.table("health_profiles").select("age, sex").eq("user_id", user_id).execute().data
        consents = client.table("consents").select("purpose, granted").eq("user_id", user_id).execute().data
        shares = any(c["purpose"] == "share_with_clinician" and c["granted"] for c in consents)
        client.table("risk_assessments").delete().eq("user_id", user_id).eq("assessment_mode", "demo").execute()

        rng = np.random.default_rng(100 + i)
        seq = visits(int(hp[0]["age"]), int(hp[0]["sex"]), rng)
        if i == HIGH_CASE_PATIENT:
            seq.append({**seq[-1], **HIGH_CASE_ANSWERS})
        summary = []
        for k, answers in enumerate(seq):
            when = now - timedelta(days=30 * (len(seq) - k) + int(rng.integers(0, 10)))
            req = AssessmentRequest(**answers)
            result = screening.assess(req)
            queue = shares and bool(result["queue_reasons"])
            row = {
                "user_id": user_id, "assessment_mode": "demo", "inputs": stored_inputs(req),
                "results": result["results"], "next_step": result["next_step"],
                "emergency_flag": result["emergency"],
                "review_status": "pending" if queue else "not_required",
                "model_versions": result["model_versions"], "created_at": when.isoformat(),
            }
            asm_id = client.table("risk_assessments").insert(row).execute().data[0]["id"]
            if queue:
                client.table("review_queue").insert(
                    {"assessment_id": asm_id, "patient_id": user_id, "reasons": result["queue_reasons"]}
                ).execute()
            summary.append(result["next_step"] + (" (queued)" if queue else ""))
        print(f"  {email}: {len(seq)} demo assessments -> {', '.join(summary)}")
    print("Done. Demo assessments are labelled assessment_mode='demo'.")


if __name__ == "__main__":
    main()
