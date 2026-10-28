"use client";

import React, { useId, useState } from "react";
import { ArrowRight, Info, RotateCcw } from "lucide-react";
import { Card, CardHeader } from "../ui/Card";
import { Button } from "../ui/Button";
import { BandBadge } from "./BandBadge";
import { api, apiFailure } from "../../lib/api-client";
import { useTranslation } from "../../lib/i18n";
import {
  DISEASES,
  bmiOf,
  type AssessmentAnswers,
  type Changes,
  type DiseaseResult,
  type WhatIfResponse,
} from "../../lib/assessment";

type Editable = Pick<
  AssessmentAnswers,
  "weight_kg" | "phys_activity" | "fruits" | "veggies" | "heavy_alcohol" | "gen_health" | "ment_health_days" | "phys_health_days"
>;

function pick(a: AssessmentAnswers): Editable {
  return {
    weight_kg: a.weight_kg,
    phys_activity: a.phys_activity,
    fruits: a.fruits,
    veggies: a.veggies,
    heavy_alcohol: a.heavy_alcohol,
    gen_health: a.gen_health,
    ment_health_days: a.ment_health_days,
    phys_health_days: a.phys_health_days,
  };
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  const id = useId();
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-[#D8E2EA] bg-white px-3.5 py-2.5">
      <label htmlFor={id} className="text-sm text-[#0F172A]">
        {label}
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0E7490] ${
          checked ? "border-[#0E7490] bg-[#0E7490]" : "border-[#94A3B8] bg-[#E2E8F0]"
        }`}
      >
        <span
          className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-6" : "translate-x-1"}`}
          aria-hidden="true"
        />
      </button>
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (v: number) => void;
}) {
  const id = useId();
  return (
    <div className="space-y-1.5 rounded-xl border border-[#D8E2EA] bg-white px-3.5 py-2.5">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className="text-sm text-[#0F172A]">
          {label}
        </label>
        <output htmlFor={id} className="text-sm font-semibold text-[#0B1F33]">
          {display}
        </output>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-valuetext={display}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[#0E7490]"
      />
    </div>
  );
}

export function WhatIfPanel({ base }: { base: AssessmentAnswers }) {
  const { t, language } = useTranslation();
  const [values, setValues] = useState<Editable>(() => pick(base));
  const [result, setResult] = useState<WhatIfResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  const set = <K extends keyof Editable>(k: K, v: Editable[K]) => setValues((p) => ({ ...p, [k]: v }));

  const changes: Changes = {};
  (Object.keys(values) as (keyof Editable)[]).forEach((k) => {
    if (values[k] !== base[k]) (changes as Record<string, unknown>)[k] = values[k];
  });
  const hasChanges = Object.keys(changes).length > 0;

  const wMin = Math.max(30, Math.round(base.weight_kg * 0.75));
  const wMax = Math.min(250, Math.round(base.weight_kg * 1.1));
  const newBmi = bmiOf(base.height_cm, values.weight_kg);

  const run = async () => {
    setRunning(true);
    setError(null);
    try {
      setResult(await api.runWhatIf({ base, changes, language }));
    } catch (err) {
      setResult(null);
      setError(t(`assess.errors.${apiFailure(err)}`));
    } finally {
      setRunning(false);
    }
  };

  const label = (r: DiseaseResult | undefined) =>
    r?.abstained || !r?.band ? t("results.notConfident") : t(`results.band.${r.band}`);

  return (
    <Card className="space-y-5">
      <CardHeader title={t("whatIf.title")} subtitle={t("whatIf.intro")} />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Slider
          label={t("whatIf.weight")}
          value={values.weight_kg}
          min={wMin}
          max={wMax}
          step={0.5}
          display={`${values.weight_kg} kg${newBmi ? ` · BMI ${newBmi}` : ""}`}
          onChange={(v) => set("weight_kg", v)}
        />
        <Slider
          label={t("assess.q.genHealth")}
          value={values.gen_health}
          min={1}
          max={5}
          step={1}
          display={t(`assess.genHealthOption.${values.gen_health}`)}
          onChange={(v) => set("gen_health", v)}
        />
        <Slider
          label={t("assess.q.mentHealth")}
          value={values.ment_health_days}
          min={0}
          max={30}
          step={1}
          display={String(values.ment_health_days)}
          onChange={(v) => set("ment_health_days", v)}
        />
        <Slider
          label={t("assess.q.physHealth")}
          value={values.phys_health_days}
          min={0}
          max={30}
          step={1}
          display={String(values.phys_health_days)}
          onChange={(v) => set("phys_health_days", v)}
        />
        <Toggle label={t("assess.q.physActivity")} checked={values.phys_activity} onChange={(v) => set("phys_activity", v)} />
        <Toggle label={t("assess.q.fruits")} checked={values.fruits} onChange={(v) => set("fruits", v)} />
        <Toggle label={t("assess.q.veggies")} checked={values.veggies} onChange={(v) => set("veggies", v)} />
        <Toggle label={t("assess.q.heavyAlcohol")} checked={values.heavy_alcohol} onChange={(v) => set("heavy_alcohol", v)} />
      </div>

      {base.smoker && (
        <p className="flex gap-2 rounded-xl border border-[#0E7490]/30 bg-[#0E7490]/5 p-3 text-xs text-[#0F172A]">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#0E7490]" aria-hidden="true" />
          <span>{t("whatIf.smokerNote")}</span>
        </p>
      )}
      <p className="text-xs text-[#475569]">{t("whatIf.fixedNote")}</p>

      <div className="flex flex-wrap gap-3">
        <Button variant="teal" size="md" onClick={run} isLoading={running} disabled={!hasChanges}>
          {t("whatIf.run")}
        </Button>
        <Button
          variant="outline"
          size="md"
          leftIcon={<RotateCcw className="h-4 w-4" />}
          onClick={() => {
            setValues(pick(base));
            setResult(null);
            setError(null);
          }}
        >
          {t("whatIf.reset")}
        </Button>
      </div>
      {!hasChanges && <p className="text-xs text-[#475569]">{t("whatIf.noChanges")}</p>}

      {error && (
        <p role="alert" className="rounded-xl border border-[#B42318]/30 bg-[#FEF2F2] p-3 text-sm text-[#991B1B]">
          {error}
        </p>
      )}

      {result && (
        <div className="space-y-3" aria-live="polite">
          <ul className="space-y-2">
            {DISEASES.map((d) => (
              <li
                key={d}
                className="flex flex-col gap-2 rounded-xl border border-[#D8E2EA] bg-[#F8FAFC] p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="text-sm font-semibold text-[#0B1F33]">{t(`results.condition.${d}`)}</span>
                <span className="flex flex-wrap items-center gap-2">
                  <span className="sr-only">{t("whatIf.before")}</span>
                  <BandBadge band={result.before[d]?.abstained ? null : result.before[d]?.band ?? null} label={label(result.before[d])} size="sm" />
                  <ArrowRight className="h-4 w-4 text-[#475569]" aria-hidden="true" />
                  <span className="sr-only">{t("whatIf.after")}</span>
                  <BandBadge band={result.after[d]?.abstained ? null : result.after[d]?.band ?? null} label={label(result.after[d])} size="sm" />
                </span>
              </li>
            ))}
          </ul>
          {result.notes.includes("smoker_ever_cannot_reset") && (
            <p className="text-xs text-[#475569]">{t("whatIf.smokerNote")}</p>
          )}
          <p className="text-xs text-[#475569]">{t("whatIf.estimateNote")}</p>
        </div>
      )}
    </Card>
  );
}
