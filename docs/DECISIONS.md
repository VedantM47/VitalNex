# VITALNEX — Decision Log

Status key: **Confirmed** = the team said so · **Delegated** = the team asked Claude to choose ·
**Proposed** = Claude's default, team still to confirm (change it here if you disagree; Claude Code
follows this file).

| ID | Decision | Status | ERAI reasoning |
|---|---|---|---|
| D-1 | VITALNEX serves **patients and clinicians**. It gives a screening level, factors and a next-step category. It is **not** an AI diagnostic and never names or doses medicines. | Confirmed | Patients act on the output, so the output is limited to "what kind of care, how soon" — the safest useful boundary (Safety, Positive Human Values). |
| D-2 | Models are **small predictive models** only; all other behaviour (next steps, emergency, review routing) is deterministic rules. | Confirmed | Keeps the AI's role narrow and auditable (Accountability). |
| D-3 | Train on **CDC BRFSS Health Indicators** (UCI id 891). Three diseases: **diabetes/prediabetes, heart disease/attack, stroke**. One form → three predictions. | Confirmed | Real data makes metrics meaningful; all inputs are patient-answerable, so nothing is invented. |
| D-4 | The Pune synthetic dataset is used **only** for demo patient profiles and stress tests — never for training or reported metrics. | Proposed | Its labels come from a formula (LR AUROC 0.80 ≈ the generator's own score 0.825), so metrics on it describe the formula, not people (Transparency). |
| D-5 | Stack as in the deck: **Next.js + FastAPI + Supabase**. | Confirmed | — |
| D-6 | Income, education, healthcare access, "couldn't afford doctor" and cholesterol-check are **not model inputs** and **not asked in the app**; used only to audit fairness on the dataset. | Confirmed | Avoids baking disadvantage into scores; data minimisation under DPDP (Equality, Privacy). |
| D-7 | **Renovate** the existing repo `Pragati-1-7/VitalNex` on branch `renovate/mvp`: keep UI shell, i18n, API structure, schema, emergency gate; rebuild ML, assessment, Trust Passport, assistant; wire Supabase for real. | Confirmed | — |
| D-8 | MVP feature cut as in SPEC §1.2 (voice, consultation, model-lab, datasets, health-insights frozen). | Confirmed | Smaller scope = fewer half-working features that could mislead. |
| D-9 | Sex "prefer not to say": run the model with both values and show the **higher** band, with a note explaining why. | Proposed | Respects the choice without risking false reassurance (Inclusivity, Safety). |
| D-10 | Patients see their results **immediately**, including High (with "a clinician will review this"). For abstained diseases, **no score** is shown — only "not confident, see a doctor". | Proposed | Hiding results from people about their own health conflicts with autonomy/transparency; showing a number the model isn't sure of is unsafe. |
| D-11 | Novelties in MVP: **1** abstaining model (conformal + OOD), **5** principle traceability map, **6** emergency override, **8** clinician override log, **9** QR patient-held record. | Confirmed | — |
| D-12 | Consent & data-rights centre (minimal: purpose toggles, withdraw, export, delete). | Proposed | Not picked as a novelty, but storing health data needs consent under DPDP regardless; reuses the existing `consents` table. |
| D-13 | Assistant = local multilingual encoder (`l3cube-pune/indic-sentence-bert-nli`, CC-BY-4.0) + trained intent classifier + **curated FAQ retrieval**. No generative model, no external API. | Delegated | Every sentence the assistant says is pre-written and sourced, so it cannot hallucinate medical advice; health data never leaves the server (Privacy, Safety). Pune-built model fits the product story. |
| D-14 | A/B testing: **reserved**. Nothing built until the team names the features. | Confirmed | — |
| D-15 | Languages: **English, Hindi, Marathi**. Human review of HI/MR medical wording is **deferred**; all such text is tracked in `docs/i18n_review.md` as pending. | Confirmed (review deferred) | Accepted risk, recorded openly; templates only, so errors are fixable in one place. |
| D-16 | Remove the Jev/TypeSafe service and every false or unverified claim ("Platt Isotonic", SHAP when not run, hardcoded scores, hardcoded test values). | Confirmed (part of D-7 plan) | Accountability: no dependency or claim we cannot verify. |
| D-17 | Create a **new Supabase project** (team does the sign-up; Claude Code does the rest). | Confirmed | — |
| D-18 | Everything runs on a **CPU laptop**, no paid APIs. | Confirmed | — |
| D-19 | None of the three disease labels is used as an input to any model; all three share one 14-feature contract. | Proposed | Avoids asking users for diagnoses they may not know, keeps one honest form. |
| D-20 | Production model per disease chosen by the rule in SPEC §4.1; bands by SPEC §4.3. Team signs off after Phase 3. | Proposed | Human gate on the most consequential numbers (Accountability). |
| D-21 | Hosting not needed for now; demo runs locally. | Confirmed | — |
| D-22 | P3 sign-off. **Abstention 37–44%** (above the 30% flag) is accepted as is: abstained diseases show no score, only "not confident — see a doctor", and go to clinician review (D-10). α stays 0.10. | Confirmed (P3 gate) | Showing a band the model is not confident about would be false precision (Safety, Transparency). |
| D-23 | P3 sign-off. **Bands accepted**: Low holds 56–66% of people (above the 50% flag) because t_mod targets recall 0.80. The ~20% miss rate is stated openly to users. | Confirmed (P3 gate) | Honest disclosure instead of false reassurance (Transparency). |
| D-24 | P3 sign-off. **Age recall gap** (18–39 recall 0.12–0.40 vs 60+ 0.86–0.91) is reported, not mitigated in the model. Per-age-group thresholds were tried (`docs/fairness_mitigation.md`): young-group recall rose to ~0.76–0.79 but their false-positive rate rose to 0.28–0.40, so they were **not adopted**. Instead: Trust Passport shows the gap, and users under 40 see a note that results are less reliable for their age group. Production models chosen in P3 are approved. | Confirmed (P3 gate) | Equality: disclose the gap and its trade-off rather than hide it or silently retune. |
