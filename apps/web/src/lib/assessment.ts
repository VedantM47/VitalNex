/**
 * Types and helpers for the 14-question screening (docs/SPEC.md §3.3) and the P4 API
 * (apps/api/schemas/assessment.py). Patients never receive probabilities (D-10), so no
 * type here has one.
 */

export type Band = "low" | "moderate" | "high";
export type Disease = "diabetes" | "heart" | "stroke";
export type Sex = "female" | "male" | "prefer_not_to_say";
export type Lang = "en" | "hi" | "mr";

export const DISEASES: Disease[] = ["diabetes", "heart", "stroke"];
export const BANDS: Band[] = ["low", "moderate", "high"];

export interface AssessmentAnswers {
  age: number;
  sex: Sex;
  height_cm: number;
  weight_kg: number;
  high_bp: boolean;
  high_chol: boolean;
  smoker: boolean;
  phys_activity: boolean;
  fruits: boolean;
  veggies: boolean;
  heavy_alcohol: boolean;
  gen_health: number;
  ment_health_days: number;
  phys_health_days: number;
  diff_walk: boolean;
}

export type AnswerKey = keyof AssessmentAnswers;

export interface Symptoms {
  chest_pain: boolean;
  stroke_signs: boolean;
  severe_breathlessness: boolean;
  fainting: boolean;
}

export const SYMPTOM_KEYS: (keyof Symptoms)[] = ["chest_pain", "stroke_signs", "severe_breathlessness", "fainting"];

export interface AssessmentRequest extends AssessmentAnswers {
  symptoms: Symptoms;
  free_text?: string;
  language: Lang;
}

export interface Factor {
  feature: string;
  direction: "raises" | "lowers";
  text_key: string;
  text: string;
}

export interface DiseaseResult {
  band: Band | null;
  abstained: boolean;
  abstain_reason: string | null;
  top_factors: Factor[];
}

export type Results = Partial<Record<Disease, DiseaseResult>>;

export interface SharedFactor {
  feature: string;
  diseases: Partial<Record<Disease, "raises" | "lowers">>;
}

export interface GuidanceItem {
  key: string;
  text: string;
  source_title: string;
  source_url: string;
}

export type NextStep =
  | "emergency"
  | "correct_inputs"
  | "not_confident"
  | "see_doctor_soon"
  | "discuss_next_checkup"
  | "routine_checkup";

export interface DataQuality {
  passed: boolean;
  errors: { field: string; code: string; bmi?: number }[];
  warnings: { code: string }[];
}

export interface AssessmentResponse {
  id: string | null;
  stored: boolean;
  queued_for_review: boolean;
  next_step: NextStep;
  emergency: boolean;
  data_quality: DataQuality;
  bmi: number | null;
  results: Results;
  shared_factors: SharedFactor[];
  notes: string[];
  guidance: GuidanceItem[];
  disclaimer: string;
}

export const CHANGEABLE_KEYS = [
  "weight_kg",
  "smoker",
  "phys_activity",
  "fruits",
  "veggies",
  "heavy_alcohol",
  "gen_health",
  "ment_health_days",
  "phys_health_days",
] as const;
export type ChangeableKey = (typeof CHANGEABLE_KEYS)[number];
export type Changes = Partial<Pick<AssessmentAnswers, ChangeableKey>>;

export interface WhatIfResponse {
  before: Results;
  after: Results;
  applied_changes: Changes;
  notes: string[];
  disclaimer: string;
}

export interface RecourseItem {
  current_band: Band | null;
  suggestion: { changes: Changes; new_band: Band } | null;
  reason: "abstained" | "already_low" | "no_small_change_found" | null;
}

export interface RecourseResponse {
  recourse: Partial<Record<Disease, RecourseItem>>;
  limits: string;
  disclaimer: string;
}

export type ReviewStatus = "not_required" | "pending" | "agreed" | "overridden";

export interface AssessmentRecord {
  id: string;
  user_id: string;
  assessment_mode: string;
  inputs: Record<string, unknown>;
  results: Results;
  next_step: NextStep;
  emergency_flag: boolean;
  review_status: ReviewStatus;
  model_versions: Record<string, unknown>;
  created_at: string;
  /** Added by the API: what the patient may see about a clinician review. */
  clinician_review?: ClinicianReview | null;
}

export interface ClinicianReview {
  status: "pending" | "agreed" | "overridden";
  reviewed_by_clinician: boolean;
  reviewed_at: string | null;
  clinician_note: string | null;
  /** Level set by the clinician when they overrode the screening (DB values Low/Moderate/High). */
  clinician_bands: Partial<Record<Disease, string>>;
}

export interface HistoryResponse {
  user_id: string;
  total_assessments: number;
  assessments: AssessmentRecord[];
  /** "store_history_withdrawn" when the patient withdrew history consent. */
  hidden?: string;
}

/** One model's headline facts from /api/v1/models (ml/artifacts/<disease>/model_meta.json). */
export interface ModelSummary {
  id: string;
  version: string;
  test_recall_at_t_mod: number;
  abstention_rate_test: number;
}

// --- Form draft: every answer starts missing (null). Nothing is ever filled in. ----------------

export type Draft = { [K in AnswerKey]: AssessmentAnswers[K] | null };

export const EMPTY_DRAFT: Draft = {
  age: null,
  sex: null,
  height_cm: null,
  weight_kg: null,
  high_bp: null,
  high_chol: null,
  smoker: null,
  phys_activity: null,
  fruits: null,
  veggies: null,
  heavy_alcohol: null,
  gen_health: null,
  ment_health_days: null,
  phys_health_days: null,
  diff_walk: null,
};

export const ANSWER_KEYS = Object.keys(EMPTY_DRAFT) as AnswerKey[];
export const BOOL_KEYS: AnswerKey[] = [
  "high_bp",
  "high_chol",
  "smoker",
  "phys_activity",
  "fruits",
  "veggies",
  "heavy_alcohol",
  "diff_walk",
];

/** Validation limits from docs/SPEC.md §3.3 (and the API schema). */
export const LIMITS: Partial<Record<AnswerKey, [number, number]>> = {
  age: [18, 120],
  height_cm: [120, 220],
  weight_kg: [30, 250],
  gen_health: [1, 5],
  ment_health_days: [0, 30],
  phys_health_days: [0, 30],
};
export const BMI_LIMITS: [number, number] = [12, 70];

/** Keep only well-typed saved answers (e.g. from the health profile). Unknown keys are dropped. */
export function sanitizeSaved(raw: unknown): Partial<AssessmentAnswers> {
  const out: Partial<AssessmentAnswers> = {};
  if (!raw || typeof raw !== "object") return out;
  const r = raw as Record<string, unknown>;
  for (const k of BOOL_KEYS) if (typeof r[k] === "boolean") (out as Record<string, unknown>)[k] = r[k];
  for (const [k, [lo, hi]] of Object.entries(LIMITS) as [AnswerKey, [number, number]][]) {
    const v = r[k];
    if (typeof v === "number" && Number.isFinite(v) && v >= lo && v <= hi) (out as Record<string, unknown>)[k] = v;
  }
  if (r.sex === "female" || r.sex === "male" || r.sex === "prefer_not_to_say") out.sex = r.sex;
  return out;
}

export function isComplete(d: Draft): d is AssessmentAnswers {
  return ANSWER_KEYS.every((k) => d[k] !== null);
}

export function bmiOf(heightCm: number | null, weightKg: number | null): number | null {
  if (!heightCm || !weightKg) return null;
  const m = heightCm / 100;
  return Math.round((weightKg / (m * m)) * 10) / 10;
}

/** Asian-Indian BMI cut-offs (overweight >= 23, obese >= 27.5; docs/SPEC.md §1.4). */
export type BmiCategory = "under" | "normal" | "overweight" | "obese";
export function bmiCategory(bmi: number): BmiCategory {
  if (bmi < 18.5) return "under";
  if (bmi < 23) return "normal";
  if (bmi < 27.5) return "overweight";
  return "obese";
}

/** Replace {name} placeholders in a translated string. */
export function fmt(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
}

export function bandIndex(band: Band | null | undefined): number | null {
  return band ? BANDS.indexOf(band) + 1 : null;
}
