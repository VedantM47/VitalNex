import type { Band, Disease } from "./assessment";

/** Specialty codes of the synthetic demo doctors (doctor_specializations.code). */
export const SPECIALTIES = ["cardiology", "endocrinology", "neurology"] as const;
export type Specialty = (typeof SPECIALTIES)[number];

/** Which demo specialty to pre-select in Care Connect for each screened condition. */
export const DISEASE_SPECIALTY: Record<Disease, Specialty> = {
  diabetes: "endocrinology",
  heart: "cardiology",
  stroke: "neurology",
};

const RANK: Record<Band, number> = { low: 1, moderate: 2, high: 3 };

/**
 * The specialty for the condition with the highest band among the conditions the model was
 * confident about (abstained conditions have no band). Ties keep the order diabetes, heart, stroke.
 */
export function suggestedSpecialty(
  results: Partial<Record<Disease, { band: Band | null; abstained: boolean } | undefined>>,
  diseases: Disease[],
): Specialty | null {
  let best: { d: Disease; rank: number } | null = null;
  for (const d of diseases) {
    const r = results[d];
    if (!r || r.abstained || !r.band) continue;
    const rank = RANK[r.band];
    if (!best || rank > best.rank) best = { d, rank };
  }
  return best ? DISEASE_SPECIALTY[best.d] : null;
}
