# VITALNEX demo accounts

All accounts are synthetic dummy users created by `python supabase/seed/seed_demo.py`.
**Password for every account: `password123`** (dummy accounts only).
Set `DEMO_PASSWORD=password123` in `.env` so re-running the seed keeps it.

Login page: http://localhost:3000

| Role | Email | Name | Language |
|------|-------|------|----------|
| Admin | admin@vitalnex.demo | VITALNEX Demo Admin | en |
| Clinician | dr.joshi@vitalnex.demo | Dr. Anand Joshi (Demo) - Kothrud Heart Clinic | - |
| Clinician | dr.khan@vitalnex.demo | Dr. Sana Khan (Demo) - Baner Diabetes Care Centre | - |
| Clinician | dr.patil@vitalnex.demo | Dr. Meera Patil (Demo) - Shivajinagar Neuro Clinic | - |
| Patient 1 | patient1@vitalnex.demo | Demo Patient 1 (synthetic) | en |
| Patient 2 | patient2@vitalnex.demo | Demo Patient 2 (synthetic) | hi |
| Patient 3 | patient3@vitalnex.demo | Demo Patient 3 (synthetic) | mr |
| Patient 4 | patient4@vitalnex.demo | Demo Patient 4 (synthetic) | en |
| Patient 5 | patient5@vitalnex.demo | Demo Patient 5 (synthetic) | hi |
| Patient 6 | patient6@vitalnex.demo | Demo Patient 6 (synthetic) | mr |

Notes:
- Patients 1-4 share data with clinicians via consent; 5-6 do not (see `docs/PROGRESS.md`).
- Re-running the seed script resets all passwords to the current `DEMO_PASSWORD`.
