/**
 * Patient-owned rows read and written straight through Supabase with the user's own session.
 * Row Level Security limits every call to the signed-in user's rows ("health_profiles: own").
 *
 * The health profile is saved here, not through PUT /api/v1/health-profile, because that
 * endpoint still expects the old pre-P4 clinical fields. Only answers from the 14-question
 * contract (docs/SPEC.md §3.3) are saved; a missing key means "not answered".
 */

import { createClient } from "./supabase/client";
import { sanitizeSaved, type AssessmentAnswers } from "./assessment";

async function currentUserId(): Promise<string> {
  const { data, error } = await createClient().auth.getUser();
  if (error || !data.user) throw new Error("not_signed_in");
  return data.user.id;
}

/** Saved answers, or an empty object when nothing is saved yet. Throws if unavailable. */
export async function loadSavedAnswers(): Promise<Partial<AssessmentAnswers>> {
  const userId = await currentUserId();
  const { data, error } = await createClient()
    .from("health_profiles")
    .select("answers")
    .eq("user_id", userId)
    .maybeSingle<{ answers: unknown }>();
  if (error) throw error;
  return sanitizeSaved(data?.answers);
}

export async function saveAnswers(answers: Partial<AssessmentAnswers>): Promise<void> {
  const userId = await currentUserId();
  const clean = sanitizeSaved(answers);
  const { error } = await createClient()
    .from("health_profiles")
    .upsert(
      {
        user_id: userId,
        answers: clean,
        height_cm: clean.height_cm ?? null,
        weight_kg: clean.weight_kg ?? null,
      },
      { onConflict: "user_id" }
    );
  if (error) throw error;
}
