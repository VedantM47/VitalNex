/**
 * The patient's saved health-profile answers, through the API (GET/PUT /api/v1/health-profile).
 * Only answers from the 14-question contract (docs/SPEC.md §3.3) are saved; a missing key means
 * "not answered" and is never filled in (CLAUDE.md hard rule 3). The API validates every answer
 * with the same limits as the screening form and rejects unknown fields.
 */

import { api } from "./api-client";
import { sanitizeSaved, type AssessmentAnswers } from "./assessment";

/** Saved answers, or an empty object when nothing is saved yet. Throws if unavailable. */
export async function loadSavedAnswers(): Promise<Partial<AssessmentAnswers>> {
  const res = await api.getHealthProfile();
  return sanitizeSaved(res.answers);
}

/** Replaces the saved answers with exactly the answered ones. */
export async function saveAnswers(answers: Partial<AssessmentAnswers>): Promise<Partial<AssessmentAnswers>> {
  const res = await api.saveHealthProfile(sanitizeSaved(answers));
  return sanitizeSaved(res.answers);
}
