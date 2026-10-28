"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  CalendarCheck,
  ExternalLink,
  HelpCircle,
  Info,
  ShieldCheck,
  Stethoscope,
  UserCheck,
} from "lucide-react";
import { Card, CardHeader } from "../ui/Card";
import { Button } from "../ui/Button";
import { BandBadge } from "./BandBadge";
import { WhatIfPanel } from "./WhatIfPanel";
import { api } from "../../lib/api-client";
import { useTranslation } from "../../lib/i18n";
import {
  DISEASES,
  fmt,
  type AssessmentAnswers,
  type AssessmentResponse,
  type Changes,
  type Disease,
  type DiseaseResult,
  type ModelSummary,
  type NextStep,
  type RecourseResponse,
} from "../../lib/assessment";

const STEP_STYLE: Record<Exclude<NextStep, "emergency" | "correct_inputs">, { cls: string; Icon: typeof Info }> = {
  not_confident: { cls: "border-[#475569]/40 bg-[#F1F5F9] text-[#1E293B]", Icon: HelpCircle },
  see_doctor_soon: { cls: "border-[#B42318]/40 bg-[#FEF2F2] text-[#7F1D1D]", Icon: Stethoscope },
  discuss_next_checkup: { cls: "border-[#B45309]/40 bg-[#FFFBEB] text-[#78350F]", Icon: AlertTriangle },
  routine_checkup: { cls: "border-[#0F766E]/40 bg-[#ECFDF5] text-[#064E3B]", Icon: CalendarCheck },
};

export function useBandText() {
  const { t } = useTranslation();
  return (r: DiseaseResult | undefined) => (r && !r.abstained && r.band ? t(`results.band.${r.band}`) : t("results.notConfident"));
}

function NextStepBanner({ step }: { step: NextStep }) {
  const { t } = useTranslation();
  if (step === "emergency" || step === "correct_inputs") return null;
  const { cls, Icon } = STEP_STYLE[step];
  return (
    <section aria-labelledby="next-step-title" className={`flex gap-3 rounded-2xl border p-4 sm:p-5 ${cls}`}>
      <Icon className="mt-0.5 h-6 w-6 shrink-0" aria-hidden="true" />
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide">{t("results.nextStepLabel")}</p>
        <h2 id="next-step-title" className="text-lg font-bold leading-snug">
          {t(`results.nextStep.${step}.title`)}
        </h2>
        <p className="mt-1 text-sm">{t(`results.nextStep.${step}.body`)}</p>
      </div>
    </section>
  );
}

function ConditionCard({ disease, result }: { disease: Disease; result: DiseaseResult | undefined }) {
  const { t } = useTranslation();
  const condition = t(`results.conditionShort.${disease}`);
  const confident = result && !result.abstained && result.band;
  return (
    <Card className="flex h-full flex-col gap-3">
      <h3 className="text-base font-bold text-[#0B1F33]">{t(`results.condition.${disease}`)}</h3>
      {confident ? (
        <>
          <div>
            <BandBadge band={result.band} label={t(`results.band.${result.band}`)} size="lg" />
          </div>
          <p className="text-sm text-[#0F172A]">{fmt(t(`results.similar.${result.band}`), { condition })}</p>
        </>
      ) : (
        <>
          <div>
            <BandBadge band={null} label={t("results.notConfident")} size="lg" />
          </div>
          <p className="text-sm text-[#0F172A]">{t("results.notConfidentBody")}</p>
          {result?.abstain_reason && (
            <p className="text-xs text-[#475569]">{t(`results.abstainReason.${result.abstain_reason}`)}</p>
          )}
        </>
      )}
      <p className="mt-auto text-xs font-semibold text-[#475569]">{t("assess.notDiagnosis")}</p>
    </Card>
  );
}

function changeText(changes: Changes, t: (k: string) => string): string {
  const parts = Object.entries(changes).map(([k, v]) => {
    if (k === "gen_health") return fmt(t("results.changeText.gen_health"), { v: t(`assess.genHealthOption.${v}`) });
    if (typeof v === "boolean") return t(`results.changeText.${k}`);
    return fmt(t(`results.changeText.${k}`), { v: v as number });
  });
  return parts.join(t("results.change.joiner"));
}

function RecourseSection({ answers, results }: { answers: AssessmentAnswers; results: AssessmentResponse["results"] }) {
  const { t, language } = useTranslation();
  const [data, setData] = useState<RecourseResponse | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    api
      .getRecourse({ base: answers, language })
      .then((r) => active && setData(r))
      .catch(() => active && setFailed(true));
    return () => {
      active = false;
    };
  }, [answers, language]);

  return (
    <Card className="space-y-4">
      <CardHeader title={t("results.change.title")} subtitle={t("results.change.intro")} />
      {failed ? (
        <p className="text-sm text-[#475569]">{t("results.change.unavailable")}</p>
      ) : !data ? (
        <p className="text-sm text-[#475569]" aria-live="polite">
          {t("common.loading")}
        </p>
      ) : (
        <ul className="space-y-2">
          {DISEASES.map((d) => {
            const item = data.recourse[d];
            const condition = t(`results.conditionShort.${d}`);
            let text: string;
            if (item?.suggestion && item.current_band) {
              text = fmt(t("results.change.suggestion"), {
                changes: changeText(item.suggestion.changes, t),
                condition,
                from: t(`results.band.${item.current_band}`),
                to: t(`results.band.${item.suggestion.new_band}`),
              });
            } else if (results[d]?.abstained) {
              text = t("results.change.abstained");
            } else {
              text = t(`results.change.${item?.reason ?? "no_small_change_found"}`);
            }
            return (
              <li key={d} className="rounded-xl border border-[#D8E2EA] bg-[#F8FAFC] p-3 text-sm">
                <span className="font-semibold text-[#0B1F33]">{t(`results.condition.${d}`)}: </span>
                <span className="text-[#0F172A]">{text}</span>
              </li>
            );
          })}
        </ul>
      )}
      {(answers.high_bp || answers.high_chol) && <p className="text-xs text-[#475569]">{t("results.change.controlNote")}</p>}
      <p className="text-xs text-[#475569]">{t("whatIf.estimateNote")}</p>
    </Card>
  );
}

function SureSection({ results }: { results: AssessmentResponse["results"] }) {
  const { t } = useTranslation();
  const [models, setModels] = useState<ModelSummary[] | null>(null);

  useEffect(() => {
    let active = true;
    api
      .getModels()
      .then((m) => active && setModels(m as ModelSummary[]))
      .catch(() => active && setModels(null));
    return () => {
      active = false;
    };
  }, []);

  return (
    <Card className="space-y-4">
      <CardHeader title={t("results.sure.title")} subtitle={t("results.sure.intro")} />
      <ul className="space-y-2">
        {DISEASES.map((d) => {
          const r = results[d];
          const confident = !!r && !r.abstained && !!r.band;
          const m = models?.find((x) => x.id === d);
          const missed = m && typeof m.test_recall_at_t_mod === "number" ? Math.round((1 - m.test_recall_at_t_mod) * 100) : null;
          return (
            <li key={d} className="space-y-1.5 rounded-xl border border-[#D8E2EA] bg-[#F8FAFC] p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold text-[#0B1F33]">{t(`results.condition.${d}`)}</span>
                <span className="inline-flex items-center gap-1.5 font-semibold text-[#0F172A]">
                  {confident ? (
                    <ShieldCheck className="h-4 w-4 text-[#0F766E]" aria-hidden="true" />
                  ) : (
                    <HelpCircle className="h-4 w-4 text-[#475569]" aria-hidden="true" />
                  )}
                  {confident ? t("results.sure.confident") : t("results.sure.notConfident")}
                </span>
              </div>
              {missed !== null && (
                <p className="text-xs text-[#475569]">
                  {fmt(t("results.sure.missRate"), { n: missed, condition: t(`results.conditionShort.${d}`) })}
                </p>
              )}
            </li>
          );
        })}
      </ul>
      <Link
        href="/ai-trust"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0E7490] underline-offset-4 hover:underline"
      >
        {t("results.sure.trustLink")}
        <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
      </Link>
    </Card>
  );
}

function Direction({ dir }: { dir: "raises" | "lowers" }) {
  const { t } = useTranslation();
  return dir === "raises" ? (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#991B1B]">
      <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
      {t("results.shared.raises")}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#065F46]">
      <ArrowDownRight className="h-3.5 w-3.5" aria-hidden="true" />
      {t("results.shared.lowers")}
    </span>
  );
}

export function ResultsView({
  response,
  answers,
  onNewAssessment,
}: {
  response: AssessmentResponse;
  answers: AssessmentAnswers;
  onNewAssessment: () => void;
}) {
  const { t } = useTranslation();
  const { results } = response;
  const anyFactors = DISEASES.some((d) => (results[d]?.top_factors?.length ?? 0) > 0);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-extrabold text-[#0B1F33] sm:text-2xl">{t("results.title")}</h2>
        <p className="text-sm font-semibold text-[#334155]">{t("assess.notDiagnosis")}</p>
      </div>

      <NextStepBanner step={response.next_step} />

      {response.queued_for_review && (
        <p className="flex items-center gap-2 rounded-2xl border border-[#0E7490]/40 bg-[#0E7490]/10 p-4 text-sm font-semibold text-[#0B1F33]">
          <UserCheck className="h-5 w-5 shrink-0 text-[#0E7490]" aria-hidden="true" />
          {t("results.queued")}
        </p>
      )}

      {(response.notes.length > 0 || !response.stored || response.data_quality.warnings.length > 0) && (
        <ul className="space-y-2">
          {response.notes.map((n) => (
            <li key={n} className="flex gap-2 rounded-xl border border-[#B45309]/30 bg-[#FFFBEB] p-3 text-sm text-[#78350F]">
              <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{t(`results.notes.${n}`)}</span>
            </li>
          ))}
          {response.data_quality.warnings.map((w) => (
            <li key={w.code} className="flex gap-2 rounded-xl border border-[#B45309]/30 bg-[#FFFBEB] p-3 text-sm text-[#78350F]">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{t(`results.warnings.${w.code}`)}</span>
            </li>
          ))}
          {!response.stored && (
            <li className="flex gap-2 rounded-xl border border-[#D8E2EA] bg-[#F8FAFC] p-3 text-sm text-[#334155]">
              <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{t("results.notStored")}</span>
            </li>
          )}
        </ul>
      )}

      <section aria-label={t("results.title")} className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {DISEASES.map((d) => (
          <ConditionCard key={d} disease={d} result={results[d]} />
        ))}
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="space-y-4">
          <CardHeader title={t("results.why.title")} subtitle={t("results.why.intro")} />
          {anyFactors ? (
            <div className="space-y-4">
              {DISEASES.filter((d) => (results[d]?.top_factors?.length ?? 0) > 0).map((d) => (
                <div key={d} className="space-y-2">
                  <h4 className="text-sm font-bold text-[#0B1F33]">{t(`results.condition.${d}`)}</h4>
                  <ul className="space-y-1.5">
                    {results[d]!.top_factors.map((f) => (
                      <li key={f.feature} className="flex gap-2 text-sm text-[#0F172A]">
                        {f.direction === "raises" ? (
                          <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-[#991B1B]" aria-label={t("results.shared.raises")} />
                        ) : (
                          <ArrowDownRight className="mt-0.5 h-4 w-4 shrink-0 text-[#065F46]" aria-label={t("results.shared.lowers")} />
                        )}
                        <span>{f.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#475569]">{t("results.why.none")}</p>
          )}
        </Card>

        <Card className="space-y-4">
          <CardHeader title={t("results.shared.title")} subtitle={t("results.shared.intro")} />
          {response.shared_factors.length === 0 ? (
            <p className="text-sm text-[#475569]">{t("results.shared.none")}</p>
          ) : (
            <ul className="space-y-2">
              {response.shared_factors.map((s) => (
                <li key={s.feature} className="space-y-1.5 rounded-xl border border-[#D8E2EA] bg-[#F8FAFC] p-3">
                  <p className="text-sm font-semibold text-[#0B1F33]">{t(`results.features.${s.feature}`)}</p>
                  <ul className="flex flex-wrap gap-x-4 gap-y-1">
                    {(Object.entries(s.diseases) as [Disease, "raises" | "lowers"][]).map(([d, dir]) => (
                      <li key={d} className="flex items-center gap-1.5 text-xs text-[#334155]">
                        <span>{t(`results.condition.${d}`)}:</span>
                        <Direction dir={dir} />
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RecourseSection answers={answers} results={results} />
        <SureSection results={results} />
      </div>

      <WhatIfPanel base={answers} />

      {response.guidance.length > 0 && (
        <Card className="space-y-4">
          <CardHeader title={t("results.guidance.title")} subtitle={t("results.guidance.intro")} />
          <ul className="space-y-3">
            {response.guidance.map((g) => (
              <li key={g.key} className="rounded-xl border border-[#D8E2EA] bg-[#F8FAFC] p-3 text-sm">
                <p className="text-[#0F172A]">{g.text}</p>
                <a
                  href={g.source_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-[#0E7490] hover:underline"
                >
                  {t("results.guidance.source")} {g.source_title}
                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </a>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <p className="rounded-2xl border border-[#D8E2EA] bg-white p-4 text-xs leading-relaxed text-[#475569]">
        {t("results.disclaimer")}
      </p>

      <div className="flex flex-wrap gap-3">
        <Button variant="primary" onClick={onNewAssessment}>
          {t("results.newAssessment")}
        </Button>
        <Link href="/history">
          <Button variant="outline">{t("results.toHistory")}</Button>
        </Link>
        <Link href="/care-connect">
          <Button variant="outline" leftIcon={<Stethoscope className="h-4 w-4" />}>
            {t("results.bookDoctor")}
          </Button>
        </Link>
      </div>
    </div>
  );
}
