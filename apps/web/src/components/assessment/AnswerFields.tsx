"use client";

import React from "react";
import { useTranslation } from "../../lib/i18n";
import { LIMITS, bmiCategory, bmiOf, fmt, type AnswerKey, type Draft, type Sex } from "../../lib/assessment";
import { ChoiceField, NumberField, YesNoField } from "./Questions";

/** Translation key of the question for each answer (docs/SPEC.md §3.3 wording). */
export const QUESTION_KEY: Record<AnswerKey, string> = {
  age: "assess.q.age",
  sex: "assess.q.sex",
  height_cm: "assess.q.height",
  weight_kg: "assess.q.weight",
  high_bp: "assess.q.highBp",
  high_chol: "assess.q.highChol",
  smoker: "assess.q.smoker",
  phys_activity: "assess.q.physActivity",
  fruits: "assess.q.fruits",
  veggies: "assess.q.veggies",
  heavy_alcohol: "assess.q.heavyAlcohol",
  gen_health: "assess.q.genHealth",
  ment_health_days: "assess.q.mentHealth",
  phys_health_days: "assess.q.physHealth",
  diff_walk: "assess.q.diffWalk",
};

/** Human-readable answer for review lists. */
export function useAnswerText() {
  const { t } = useTranslation();
  return (key: AnswerKey, value: unknown): string => {
    if (value === null || value === undefined) return t("assess.notAnswered");
    if (typeof value === "boolean") return value ? t("assess.yes") : t("assess.no");
    if (key === "sex") return t(`assess.sexOption.${value as Sex}`);
    if (key === "gen_health") return t(`assess.genHealthOption.${value}`);
    if (key === "height_cm") return `${value} cm`;
    if (key === "weight_kg") return `${value} kg`;
    if (key === "ment_health_days" || key === "phys_health_days") return fmt(t("assess.daysValue"), { n: value as number });
    return String(value);
  };
}

export function BmiInfo({ heightCm, weightKg }: { heightCm: number | null; weightKg: number | null }) {
  const { t } = useTranslation();
  const bmi = bmiOf(heightCm, weightKg);
  if (bmi === null) return null;
  const cat = bmiCategory(bmi);
  return (
    <div className="rounded-2xl border border-[#D8E2EA] bg-[#F8FAFC] p-4 text-sm" aria-live="polite">
      <p className="font-semibold text-[#0B1F33]">
        {t("assess.bmi.label")}: <span className="text-lg">{bmi}</span>{" "}
        <span className="font-medium text-[#334155]">— {t(`assess.bmi.${cat}`)}</span>
      </p>
      <p className="mt-1 text-xs text-[#475569]">{t("assess.bmi.note")}</p>
    </div>
  );
}

export function AnswerFields({
  keys,
  draft,
  setField,
  errors,
  prefilled,
}: {
  keys: AnswerKey[];
  draft: Draft;
  setField: <K extends AnswerKey>(k: K, v: Draft[K]) => void;
  errors: Partial<Record<AnswerKey, string>>;
  prefilled: Set<AnswerKey>;
}) {
  const { t } = useTranslation();

  const field = (k: AnswerKey) => {
    const common = { error: errors[k], prefilled: prefilled.has(k) };
    switch (k) {
      case "age":
      case "height_cm":
      case "weight_kg":
      case "ment_health_days":
      case "phys_health_days": {
        const [min, max] = LIMITS[k]!;
        const unit = k === "height_cm" ? "cm" : k === "weight_kg" ? "kg" : k === "age" ? t("assess.unitYears") : t("assess.unitDays");
        const help = k === "age" ? t("assess.q.ageHelp") : k.endsWith("_days") ? t("assess.q.daysHelp") : undefined;
        return (
          <NumberField
            key={k}
            label={t(QUESTION_KEY[k])}
            help={help}
            value={draft[k] as number | null}
            onChange={(v) => setField(k, v)}
            min={k === "age" ? 1 : min}
            max={max}
            step={k === "weight_kg" || k === "height_cm" ? 0.5 : 1}
            unit={unit}
            {...common}
          />
        );
      }
      case "sex":
        return (
          <ChoiceField<Sex>
            key={k}
            name={k}
            legend={t(QUESTION_KEY[k])}
            help={t("assess.q.sexHelp")}
            columns={3}
            value={draft.sex}
            onChange={(v) => setField("sex", v)}
            options={(["female", "male", "prefer_not_to_say"] as Sex[]).map((s) => ({
              value: s,
              label: t(`assess.sexOption.${s}`),
            }))}
            {...common}
          />
        );
      case "gen_health":
        return (
          <ChoiceField<number>
            key={k}
            name={k}
            legend={t(QUESTION_KEY[k])}
            columns={5}
            value={draft.gen_health}
            onChange={(v) => setField("gen_health", v)}
            options={[1, 2, 3, 4, 5].map((n) => ({ value: n, label: t(`assess.genHealthOption.${n}`) }))}
            {...common}
          />
        );
      default:
        return (
          <YesNoField
            key={k}
            name={k}
            legend={t(QUESTION_KEY[k])}
            help={k === "smoker" ? t("assess.q.smokerHelp") : undefined}
            value={draft[k] as boolean | null}
            onChange={(v) => setField(k, v as Draft[typeof k])}
            {...common}
          />
        );
    }
  };

  return (
    <div className="space-y-6">
      {keys.map((k) => (
        <React.Fragment key={k}>
          {field(k)}
          {k === "weight_kg" && <BmiInfo heightCm={draft.height_cm} weightKg={draft.weight_kg} />}
        </React.Fragment>
      ))}
    </div>
  );
}

/** Errors for the given answers: missing, out of range, or impossible BMI. */
export function validateKeys(
  keys: AnswerKey[],
  draft: Draft,
  t: (k: string) => string,
  { requireAll = true }: { requireAll?: boolean } = {}
): Partial<Record<AnswerKey, string>> {
  const errors: Partial<Record<AnswerKey, string>> = {};
  for (const k of keys) {
    const v = draft[k];
    if (v === null) {
      if (requireAll) errors[k] = t("assess.requiredError");
      continue;
    }
    const lim = LIMITS[k];
    // Age under 18 is handled by the blocked screen, not as an error.
    if (lim && typeof v === "number" && !(k === "age" && v >= 1 && v < 18) && (v < lim[0] || v > lim[1])) {
      errors[k] = fmt(t("assess.rangeError"), { min: lim[0], max: lim[1] });
    }
  }
  if (keys.includes("weight_kg") && !errors.weight_kg && !errors.height_cm) {
    const bmi = bmiOf(draft.height_cm, draft.weight_kg);
    if (bmi !== null && (bmi < 12 || bmi > 70)) errors.weight_kg = fmt(t("assess.bmiRangeError"), { bmi });
  }
  return errors;
}
