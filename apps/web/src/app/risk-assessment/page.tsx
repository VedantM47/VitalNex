"use client";

// P5: the 14-question screening (docs/SPEC.md §3.3) as a short stepper, and the results
// view for the P4 API. Nothing is pre-filled except from the user's saved health profile,
// and then visibly. Patients never see probabilities (D-10).

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Ban, Check, Pencil, Phone } from "lucide-react";
import { AppShell } from "../../components/layout/AppShell";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { AnswerFields, BmiInfo, QUESTION_KEY, useAnswerText, validateKeys } from "../../components/assessment/AnswerFields";
import { EmergencyScreen } from "../../components/assessment/EmergencyScreen";
import { ResultsView } from "../../components/assessment/ResultsView";
import { api, apiFailure, ApiError, type ApiFailure } from "../../lib/api-client";
import { loadSavedAnswers } from "../../lib/patient-data";
import { useTranslation } from "../../lib/i18n";
import {
  EMPTY_DRAFT,
  SYMPTOM_KEYS,
  isComplete,
  type AnswerKey,
  type AssessmentAnswers,
  type AssessmentResponse,
  type Draft,
  type Symptoms,
} from "../../lib/assessment";

type StepId = "about" | "history" | "lifestyle" | "feel" | "symptoms" | "review";

const STEPS: { id: StepId; keys: AnswerKey[] }[] = [
  { id: "about", keys: ["age", "sex", "height_cm", "weight_kg"] },
  { id: "history", keys: ["high_bp", "high_chol", "diff_walk"] },
  { id: "lifestyle", keys: ["smoker", "phys_activity", "fruits", "veggies", "heavy_alcohol"] },
  { id: "feel", keys: ["gen_health", "ment_health_days", "phys_health_days"] },
  { id: "symptoms", keys: [] },
  { id: "review", keys: [] },
];

const NO_SYMPTOMS: Symptoms = { chest_pain: false, stroke_signs: false, severe_breathlessness: false, fainting: false };

type Phase =
  | { kind: "form" }
  | { kind: "under18" }
  | { kind: "emergency" }
  | { kind: "correct"; response: AssessmentResponse }
  | { kind: "results"; response: AssessmentResponse; answers: AssessmentAnswers };

export default function RiskAssessmentPage() {
  const { t, language } = useTranslation();
  const answerText = useAnswerText();

  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [prefilled, setPrefilled] = useState<Set<AnswerKey>>(new Set());
  const [symptoms, setSymptoms] = useState<Symptoms>(NO_SYMPTOMS);
  const [freeText, setFreeText] = useState("");
  const [step, setStep] = useState(0);
  const [maxStep, setMaxStep] = useState(0);
  const [errors, setErrors] = useState<Partial<Record<AnswerKey, string>>>({});
  const [phase, setPhase] = useState<Phase>({ kind: "form" });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<{ kind: ApiFailure; detail?: string } | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);

  // Pre-fill only from the user's own saved health profile, and mark each such answer.
  useEffect(() => {
    let active = true;
    loadSavedAnswers()
      .then((saved) => {
        if (!active) return;
        const keys = Object.keys(saved) as AnswerKey[];
        if (keys.length === 0) return;
        setDraft((d) => {
          const next = { ...d };
          for (const k of keys) if (next[k] === null) (next as Record<string, unknown>)[k] = saved[k];
          return next;
        });
        setPrefilled(new Set(keys));
      })
      .catch(() => undefined); // No saved profile available: every answer stays empty.
    return () => {
      active = false;
    };
  }, []);

  // Move focus to the step heading when the step changes (keyboard and screen-reader users).
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [step]);

  const setField = <K extends AnswerKey>(k: K, v: Draft[K]) => {
    setDraft((d) => ({ ...d, [k]: v }));
    setPrefilled((p) => {
      if (!p.has(k)) return p;
      const n = new Set(p);
      n.delete(k);
      return n;
    });
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const anySymptom = SYMPTOM_KEYS.some((k) => symptoms[k]);

  const goTo = (i: number) => {
    setErrors({});
    setStep(i);
    setMaxStep((m) => Math.max(m, i));
  };

  const next = () => {
    const keys = STEPS[step].keys;
    if (step === 0 && draft.age !== null && draft.age >= 1 && draft.age < 18) {
      setPhase({ kind: "under18" });
      return;
    }
    const errs = validateKeys(keys, draft, t);
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    goTo(step + 1);
  };

  const submit = async () => {
    // Re-check every step; jump to the first one with a problem.
    for (let i = 0; i < STEPS.length; i++) {
      const errs = validateKeys(STEPS[i].keys, draft, t);
      if (Object.keys(errs).length) {
        goTo(i);
        setErrors(errs);
        return;
      }
    }
    if (!isComplete(draft)) return;
    if (draft.age < 18) {
      setPhase({ kind: "under18" });
      return;
    }
    const answers: AssessmentAnswers = { ...draft };
    setSubmitting(true);
    setSubmitError(null);
    try {
      const response = await api.runAssessment({
        ...answers,
        symptoms,
        free_text: freeText.trim() ? freeText.trim() : undefined,
        language,
      });
      if (response.emergency || response.next_step === "emergency") setPhase({ kind: "emergency" });
      else if (response.next_step === "correct_inputs") setPhase({ kind: "correct", response });
      else setPhase({ kind: "results", response, answers });
    } catch (err) {
      // Emergency red flags override everything, even when the service is unreachable.
      if (anySymptom) {
        setPhase({ kind: "emergency" });
        return;
      }
      const kind = apiFailure(err);
      setSubmitError({ kind, detail: kind === "validation" && err instanceof ApiError ? err.detail : undefined });
    } finally {
      setSubmitting(false);
    }
  };

  const restart = () => {
    setPhase({ kind: "form" });
    setSymptoms(NO_SYMPTOMS);
    setFreeText("");
    setSubmitError(null);
    goTo(0);
  };

  const header = (
    <div className="space-y-1 border-b border-[#D8E2EA] pb-6">
      <h1 className="text-2xl font-extrabold text-[#0B1F33] sm:text-3xl">{t("risk.title")}</h1>
      <p className="text-xs text-[#475569] sm:text-sm">{t("risk.subtitle")}</p>
    </div>
  );

  if (phase.kind === "emergency") {
    return (
      <AppShell>
        {header}
        <EmergencyScreen onBack={() => setPhase({ kind: "form" })} />
      </AppShell>
    );
  }

  if (phase.kind === "under18") {
    return (
      <AppShell>
        <div className="space-y-8">
          {header}
          <Card className="mx-auto max-w-xl space-y-4 text-center">
            <Ban className="mx-auto h-10 w-10 text-[#B42318]" aria-hidden="true" />
            <h2 className="text-xl font-bold text-[#0B1F33]">{t("assess.under18.title")}</h2>
            <p className="text-sm text-[#334155]">{t("assess.under18.body")}</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button variant="outline" onClick={() => setPhase({ kind: "form" })}>
                {t("assess.under18.change")}
              </Button>
              <Link href="/care-connect">
                <Button variant="primary">{t("results.bookDoctor")}</Button>
              </Link>
            </div>
          </Card>
        </div>
      </AppShell>
    );
  }

  if (phase.kind === "correct") {
    return (
      <AppShell>
        <div className="space-y-8">
          {header}
          <Card className="mx-auto max-w-xl space-y-4">
            <AlertTriangle className="h-8 w-8 text-[#B45309]" aria-hidden="true" />
            <h2 className="text-xl font-bold text-[#0B1F33]">{t("results.correct.title")}</h2>
            <p className="text-sm text-[#334155]">{t("results.correct.body")}</p>
            <ul className="list-disc space-y-1 pl-5 text-sm text-[#0F172A]">
              {phase.response.data_quality.errors.map((e, i) => (
                <li key={i}>
                  {e.code === "bmi_out_of_range" ? t("results.correct.bmi") : `${e.field}: ${e.code}`}
                </li>
              ))}
            </ul>
            <Button
              variant="primary"
              onClick={() => {
                setPhase({ kind: "form" });
                goTo(0);
              }}
            >
              {t("results.correct.back")}
            </Button>
          </Card>
        </div>
      </AppShell>
    );
  }

  if (phase.kind === "results") {
    return (
      <AppShell>
        <div className="space-y-8">
          {header}
          <ResultsView response={phase.response} answers={phase.answers} onNewAssessment={restart} />
        </div>
      </AppShell>
    );
  }

  const current = STEPS[step];

  return (
    <AppShell>
      <div className="space-y-8">
        {header}

        <nav aria-label={t("assess.stepsLabel")}>
          <ol className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {STEPS.map((s, i) => {
              const done = i < step;
              const isCurrent = i === step;
              const reachable = i <= maxStep;
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => reachable && goTo(i)}
                    disabled={!reachable}
                    aria-current={isCurrent ? "step" : undefined}
                    className={`flex w-full min-h-[44px] items-center gap-2 rounded-xl border px-2.5 py-2 text-left text-xs font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0E7490] disabled:cursor-not-allowed ${
                      isCurrent
                        ? "border-[#0B1F33] bg-[#0B1F33] text-white"
                        : done
                          ? "border-[#0E7490]/50 bg-[#0E7490]/10 text-[#0B1F33]"
                          : "border-[#D8E2EA] bg-white text-[#475569]"
                    }`}
                  >
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] ${
                        isCurrent ? "bg-white text-[#0B1F33]" : done ? "bg-[#0E7490] text-white" : "bg-[#E2E8F0] text-[#334155]"
                      }`}
                      aria-hidden="true"
                    >
                      {done ? <Check className="h-3 w-3" /> : i + 1}
                    </span>
                    <span className="min-w-0 break-words">{t(`assess.steps.${s.id}`)}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        <Card className="space-y-6">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-[#475569]">
              {t("assess.stepOf").replace("{n}", String(step + 1)).replace("{total}", String(STEPS.length))}
            </p>
            <h2 ref={headingRef} tabIndex={-1} className="text-xl font-bold text-[#0B1F33] outline-none">
              {t(`assess.steps.${current.id}`)}
            </h2>
            {prefilled.size > 0 && step < 4 && (
              <p className="rounded-xl border border-[#0E7490]/30 bg-[#0E7490]/5 p-3 text-xs text-[#0F172A]">
                {t("assess.prefilledNotice")}
              </p>
            )}
          </div>

          {current.keys.length > 0 && (
            <AnswerFields keys={current.keys} draft={draft} setField={setField} errors={errors} prefilled={prefilled} />
          )}

          {current.id === "symptoms" && (
            <div className="space-y-5">
              <fieldset className="space-y-2">
                <legend className="text-sm font-semibold text-[#0F172A]">{t("assess.symptoms.intro")}</legend>
                {SYMPTOM_KEYS.map((k) => (
                  <label
                    key={k}
                    className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-xl border border-[#CBD5E1] bg-white px-3.5 py-2 text-sm focus-within:outline-2 focus-within:outline-[#0E7490]"
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-[#B42318]"
                      checked={symptoms[k]}
                      onChange={(e) => setSymptoms((s) => ({ ...s, [k]: e.target.checked }))}
                    />
                    <span>{t(`assess.symptoms.${k}`)}</span>
                  </label>
                ))}
              </fieldset>
              {anySymptom && (
                <div role="alert" className="space-y-3 rounded-2xl border-2 border-[#B42318] bg-[#FEF2F2] p-4 text-sm text-[#7F1D1D]">
                  <p className="font-bold">{t("assess.symptoms.tickedWarning")}</p>
                  <div className="flex flex-wrap gap-2">
                    <a href="tel:108" className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#B42318] px-4 font-bold text-white">
                      <Phone className="h-4 w-4" aria-hidden="true" />
                      {t("emergency.call108")}
                    </a>
                    <a href="tel:112" className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#B42318] px-4 font-bold text-white">
                      <Phone className="h-4 w-4" aria-hidden="true" />
                      {t("emergency.call112")}
                    </a>
                  </div>
                </div>
              )}
              <div className="space-y-1.5">
                <label htmlFor="free-text" className="block text-sm font-semibold text-[#0F172A]">
                  {t("assess.symptoms.freeText")} <span className="font-normal text-[#475569]">({t("common.optional")})</span>
                </label>
                <p id="free-text-help" className="text-xs text-[#475569]">
                  {t("assess.symptoms.freeTextHelp")}
                </p>
                <textarea
                  id="free-text"
                  aria-describedby="free-text-help"
                  maxLength={500}
                  rows={3}
                  value={freeText}
                  onChange={(e) => setFreeText(e.target.value)}
                  className="w-full rounded-xl border border-[#CBD5E1] bg-white p-3 text-sm text-[#0F172A] focus-visible:outline-2 focus-visible:outline-[#0E7490]"
                />
              </div>
            </div>
          )}

          {current.id === "review" && (
            <div className="space-y-4">
              <p className="text-sm text-[#334155]">{t("assess.review.intro")}</p>
              {STEPS.slice(0, 4).map((s, i) => (
                <div key={s.id} className="rounded-2xl border border-[#D8E2EA] bg-[#F8FAFC] p-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <h3 className="text-sm font-bold text-[#0B1F33]">{t(`assess.steps.${s.id}`)}</h3>
                    <Button variant="ghost" size="sm" leftIcon={<Pencil className="h-3.5 w-3.5" />} onClick={() => goTo(i)}>
                      {t("assess.edit")}
                    </Button>
                  </div>
                  <dl className="space-y-1.5 text-sm">
                    {s.keys.map((k) => (
                      <div key={k} className="grid grid-cols-1 gap-0.5 sm:grid-cols-[2fr_1fr] sm:gap-3">
                        <dt className="text-[#475569]">{t(QUESTION_KEY[k])}</dt>
                        <dd className="font-semibold text-[#0B1F33]">{answerText(k, draft[k])}</dd>
                      </div>
                    ))}
                  </dl>
                  {s.id === "about" && (
                    <div className="mt-3">
                      <BmiInfo heightCm={draft.height_cm} weightKg={draft.weight_kg} />
                    </div>
                  )}
                </div>
              ))}
              <div className="rounded-2xl border border-[#D8E2EA] bg-[#F8FAFC] p-4 text-sm">
                <h3 className="mb-1 text-sm font-bold text-[#0B1F33]">{t("assess.steps.symptoms")}</h3>
                <p className="text-[#0F172A]">
                  {anySymptom
                    ? SYMPTOM_KEYS.filter((k) => symptoms[k]).map((k) => t(`assess.symptoms.${k}`)).join("; ")
                    : t("assess.symptoms.none")}
                </p>
              </div>
              <p className="text-xs text-[#475569]">{t("assess.review.consentNote")}</p>
              {submitError && (
                <div role="alert" className="space-y-1 rounded-xl border border-[#B42318]/30 bg-[#FEF2F2] p-3 text-sm text-[#991B1B]">
                  <p>{t(`assess.errors.${submitError.kind}`)}</p>
                  {submitError.detail && <p className="break-words text-xs">{submitError.detail}</p>}
                  {submitError.kind === "consent" && (
                    <Link href="/settings" className="font-semibold underline">
                      {t("assess.errors.consentLink")}
                    </Link>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex flex-wrap justify-between gap-3 border-t border-[#E2E8F0] pt-5">
            <Button variant="outline" onClick={() => goTo(step - 1)} disabled={step === 0}>
              {t("assess.back")}
            </Button>
            {current.id === "review" ? (
              <Button variant="primary" onClick={submit} isLoading={submitting}>
                {t("assess.submit")}
              </Button>
            ) : (
              <Button variant="primary" onClick={next}>
                {t("assess.next")}
              </Button>
            )}
          </div>
        </Card>

        <p className="text-xs text-[#475569]">{t("results.disclaimer")}</p>
      </div>
    </AppShell>
  );
}
