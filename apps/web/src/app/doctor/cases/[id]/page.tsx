"use client";

// P6 clinician case view (docs/SPEC.md §1.3 clinician flow). Per condition the display order is
// factors -> uncertainty -> model's level, so the band does not anchor the clinician (reduces
// automation bias). Then Agree, or Override with a new level + required reason code per
// condition. Overrides are an accountability log and are never used for training (hard rule 9).

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Siren } from "lucide-react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AppShell } from "../../../../components/layout/AppShell";
import { Card, CardHeader } from "../../../../components/ui/Card";
import { Button } from "../../../../components/ui/Button";
import { Alert } from "../../../../components/ui/Alert";
import { StatusBadge } from "../../../../components/ui/StatusBadge";
import { ApiError, api, apiFailure } from "../../../../lib/api-client";
import { useTranslation } from "../../../../lib/i18n";
import { ANSWER_KEYS, DISEASES, FEATURE_OF, fmt, type Disease } from "../../../../lib/assessment";
import { dateOnly, dateTime, dec } from "../../../../lib/format";

interface CaseFactor {
  feature: string;
  direction: "raises" | "lowers";
  shap?: number;
}
interface DiseaseView {
  top_factors: CaseFactor[];
  probability: number | null;
  conformal_set: number[] | null;
  abstained: boolean;
  abstain_reason: string | null;
  model_band: "low" | "moderate" | "high" | null;
  model_version: string | null;
  thresholds: { t_mod: number; t_high: number } | null;
}
interface CaseDetail {
  assessment_id: string;
  created_at: string;
  patient: { id: string; full_name: string | null };
  inputs: Record<string, unknown>;
  data_quality: {
    available: boolean;
    passed?: boolean;
    errors?: { field: string; code: string }[];
    warnings?: { code: string }[];
  };
  next_step: string;
  emergency_flag: boolean;
  review_status: string;
  review: { status: string; clinician_note: string | null; reviewed_at: string | null; reasons: string[] } | null;
  diseases: Partial<Record<Disease, DiseaseView>>;
  overrides: { disease: string; model_band: string; clinician_band: string; reason_code: string; note: string | null; created_at: string }[];
  history: {
    id: string;
    created_at: string;
    diseases: Partial<Record<Disease, { probability: number | null; abstained: boolean }>>;
  }[];
}

const REASONS = [
  "clinical_history_not_captured",
  "symptoms_present",
  "input_likely_wrong",
  "model_overestimates",
  "model_underestimates",
  "other",
] as const;
const CLIN_BANDS = ["Low", "Moderate", "High"] as const;
const LINE_COLOR: Record<Disease, string> = { diabetes: "#0284C7", heart: "#B42318", stroke: "#6D28D9" };

interface OverrideDraft {
  on: boolean;
  band: string;
  reason: string;
  note: string;
}
const EMPTY_OVERRIDE: OverrideDraft = { on: false, band: "", reason: "", note: "" };

/** The model's band as clinician_overrides stores it. */
function modelBandOf(v: DiseaseView): string {
  if (v.abstained || !v.model_band) return "not_confident";
  return v.model_band[0].toUpperCase() + v.model_band.slice(1);
}

export default function CasePage() {
  const { id } = useParams<{ id: string }>();
  const { t, language } = useTranslation();
  const [data, setData] = useState<CaseDetail | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [decision, setDecision] = useState<"agree" | "override">("agree");
  const [note, setNote] = useState("");
  const [ovr, setOvr] = useState<Partial<Record<Disease, OverrideDraft>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = useCallback(() => api.getDoctorCase(id), [id]);

  useEffect(() => {
    let active = true;
    load()
      .then((c: CaseDetail) => active && setData(c))
      .catch((e) => active && setFailure(apiFailure(e)));
    return () => {
      active = false;
    };
  }, [load]);

  const bandLabel = (b: string) =>
    b === "not_confident" ? t("doctor.case.notConfident") : t(`results.band.${b.toLowerCase()}`);

  const answerValue = (k: string, v: unknown): string => {
    if (v === null || v === undefined) return "—";
    if (typeof v === "boolean") return v ? t("common.yes") : t("common.no");
    if (k === "sex") return t(`assess.sexOption.${v}`);
    if (k === "gen_health") return `${v} – ${t(`assess.genHealthOption.${v}`)}`;
    return String(v);
  };

  const setO = (d: Disease, patch: Partial<OverrideDraft>) =>
    setOvr((o) => ({ ...o, [d]: { ...(o[d] ?? EMPTY_OVERRIDE), ...patch } }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data) return;
    setFormError(null);
    const overrides: { disease: Disease; clinician_band: string; reason_code: string; note?: string }[] = [];
    if (decision === "override") {
      for (const d of DISEASES) {
        const o = ovr[d];
        const v = data.diseases[d];
        if (!o?.on || !v) continue;
        if (!o.band || o.band === modelBandOf(v)) return setFormError(t("doctor.case.errBand"));
        if (!o.reason) return setFormError(t("doctor.case.errReason"));
        if (o.reason === "other" && !o.note.trim()) return setFormError(t("doctor.case.errOtherNote"));
        overrides.push({ disease: d, clinician_band: o.band, reason_code: o.reason, ...(o.note.trim() ? { note: o.note.trim() } : {}) });
      }
      if (overrides.length === 0) return setFormError(t("doctor.case.errChooseOne"));
    }
    setSaving(true);
    try {
      await api.updateDoctorReview(data.assessment_id, {
        decision,
        ...(note.trim() ? { note: note.trim() } : {}),
        overrides,
      });
      setSaved(true);
      setData(await load());
    } catch (err) {
      const detail = err instanceof ApiError ? err.detail : t("common.apiUnavailable");
      setFormError(fmt(t("doctor.case.saveFailed"), { detail }));
    } finally {
      setSaving(false);
    }
  };

  const chartData =
    data?.history.map((h) => {
      const row: Record<string, string | number | null> = { date: dateOnly(h.created_at, language) ?? "" };
      for (const d of DISEASES) {
        const r = h.diseases[d];
        row[d] = r && !r.abstained && typeof r.probability === "number" ? r.probability : null;
      }
      return row;
    }) ?? [];

  return (
    <AppShell>
      <div className="space-y-8">
        <Link
          href="/doctor/patients"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0E7490] hover:underline focus-visible:outline-2 focus-visible:outline-[#0E7490]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {t("doctor.case.back")}
        </Link>

        {failure ? (
          <Alert kind="error">
            {failure === "notFound" ? t("doctor.case.notFound") : failure === "signin" ? t("common.signInNeeded") : t("common.apiUnavailable")}
          </Alert>
        ) : !data ? (
          <p className="text-sm text-[#475569]">{t("common.loading")}</p>
        ) : (
          <>
            <div className="space-y-1 border-b border-[#D8E2EA] pb-6">
              <h1 className="text-2xl font-extrabold text-[#0B1F33] sm:text-3xl">
                {t("doctor.case.title")}: {data.patient.full_name ?? "—"}
              </h1>
              <p className="text-sm text-[#475569]">
                {fmt(t("doctor.case.screenedOn"), { date: dateTime(data.created_at, language) ?? "—" })}
              </p>
              {data.review && (
                <div className="flex flex-wrap gap-2 pt-2 text-xs">
                  <StatusBadge label={t(`reviewQueue.status.${data.review.status}`)} variant="neutral" size="sm" />
                  {data.review.reasons.map((r) => (
                    <span key={r} className="rounded-lg bg-[#F1F5F9] px-2.5 py-1 text-[#0B1F33]">
                      {t(`reviewQueue.reason.${r}`)}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {data.emergency_flag && (
              <Alert kind="error">
                <span className="flex items-center gap-2 font-semibold">
                  <Siren className="h-4 w-4" aria-hidden="true" />
                  {t("doctor.case.emergency")}
                </span>
              </Alert>
            )}

            <Card>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#475569]">{t("doctor.case.nextStep")}</p>
              <p className="mt-1 font-semibold text-[#0B1F33]">{t(`results.nextStep.${data.next_step}.title`)}</p>
            </Card>

            <Alert kind="info">{t("doctor.case.orderNote")}</Alert>

            {Object.keys(data.diseases).length === 0 ? (
              <Card>
                <p className="text-sm text-[#334155]">{t("doctor.case.noResults")}</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {DISEASES.filter((d) => data.diseases[d]).map((d) => {
                  const v = data.diseases[d]!;
                  return (
                    <Card key={d} className="space-y-5">
                      <h2 className="text-lg font-bold text-[#0B1F33]">{t(`results.condition.${d}`)}</h2>

                      <section aria-label={t("doctor.case.factors")} className="space-y-2">
                        <h3 className="text-sm font-bold text-[#0B1F33]">{t("doctor.case.factors")}</h3>
                        {v.top_factors.length === 0 ? (
                          <p className="text-xs text-[#475569]">{t("doctor.case.noFactors")}</p>
                        ) : (
                          <ul className="space-y-1 text-sm">
                            {v.top_factors.map((f) => (
                              <li key={f.feature} className="flex justify-between gap-2">
                                <span className="text-[#0F172A]">
                                  {t(`results.features.${f.feature}`, f.feature)}{" "}
                                  <span className={f.direction === "raises" ? "text-[#B42318]" : "text-[#0F766E]"}>
                                    ({t(`doctor.case.${f.direction}`)})
                                  </span>
                                </span>
                                <span className="font-mono text-xs text-[#334155]">{dec(f.shap, 3) ?? ""}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </section>

                      <section className="space-y-1 text-sm">
                        <h3 className="text-sm font-bold text-[#0B1F33]">{t("doctor.case.uncertainty")}</h3>
                        <p>
                          {t("doctor.case.probability")}:{" "}
                          <span className="font-mono font-semibold">{dec(v.probability, 3) ?? t("common.notAvailable")}</span>
                        </p>
                        <p>
                          {t("doctor.case.conformalSet")}:{" "}
                          <span className="font-mono">
                            {v.conformal_set ? `{${v.conformal_set.join(", ")}}` : t("common.notAvailable")}
                          </span>
                        </p>
                        <p className="text-xs text-[#475569]">
                          {t("doctor.case.set0")} · {t("doctor.case.set1")}
                        </p>
                        <p className={v.abstained ? "font-semibold text-[#B45309]" : "text-[#065F46]"}>
                          {v.abstained ? t("doctor.case.abstained") : t("doctor.case.confident")}
                        </p>
                        {v.abstain_reason && (
                          <p className="text-xs text-[#334155]">{t(`doctor.case.abstainReason.${v.abstain_reason}`, v.abstain_reason)}</p>
                        )}
                        <p className="text-xs text-[#475569]">
                          {v.thresholds
                            ? fmt(t("doctor.case.thresholds"), { t_mod: v.thresholds.t_mod.toFixed(3), t_high: v.thresholds.t_high.toFixed(3) })
                            : t("doctor.case.thresholdsUnknown")}
                        </p>
                      </section>

                      <section className="space-y-1 border-t border-[#E2E8F0] pt-4">
                        <h3 className="text-sm font-bold text-[#0B1F33]">{t("doctor.case.modelBand")}</h3>
                        <p className="text-base font-semibold text-[#0B1F33]">{bandLabel(modelBandOf(v))}</p>
                        <p className="text-xs text-[#475569]">
                          {fmt(t("doctor.case.modelVersion"), { v: v.model_version ?? t("common.notAvailable") })}
                        </p>
                      </section>
                    </Card>
                  );
                })}
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader title={t("doctor.case.inputs")} />
                <dl className="grid grid-cols-1 gap-x-4 gap-y-1 text-sm sm:grid-cols-2">
                  {ANSWER_KEYS.map((k) => (
                    <div key={k} className="flex justify-between gap-2 border-b border-[#F1F5F9] py-1">
                      <dt className="text-[#475569]">{t(`results.features.${FEATURE_OF[k]}`)}</dt>
                      <dd className="font-semibold text-[#0F172A]">{answerValue(k, data.inputs[k])}</dd>
                    </div>
                  ))}
                </dl>
              </Card>
              <Card>
                <CardHeader title={t("doctor.case.dataQuality")} />
                {!data.data_quality.available ? (
                  <p className="text-sm text-[#475569]">{t("doctor.case.dqUnavailable")}</p>
                ) : (data.data_quality.errors?.length ?? 0) + (data.data_quality.warnings?.length ?? 0) === 0 ? (
                  <p className="text-sm text-[#065F46]">{t("doctor.case.dqPassed")}</p>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {data.data_quality.errors?.map((e) => (
                      <li key={e.code}>
                        <span className="font-semibold text-[#991B1B]">{t("doctor.case.dqError")}:</span>{" "}
                        {e.code === "bmi_out_of_range" ? t("results.correct.bmi") : e.code}
                      </li>
                    ))}
                    {data.data_quality.warnings?.map((w) => (
                      <li key={w.code}>
                        <span className="font-semibold text-[#78350F]">{t("doctor.case.dqWarning")}:</span>{" "}
                        {t(`results.warnings.${w.code}`, w.code)}
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </div>

            <Card>
              <CardHeader title={t("doctor.case.history")} subtitle={t("doctor.case.historyIntro")} />
              <div className="h-64 w-full" role="img" aria-label={t("doctor.case.historyIntro")}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
                    <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#334155" }} />
                    <YAxis domain={[0, 1]} tick={{ fontSize: 11, fill: "#334155" }} />
                    <Tooltip />
                    <Legend />
                    {DISEASES.map((d) => (
                      <Line
                        key={d}
                        type="monotone"
                        dataKey={d}
                        name={t(`results.condition.${d}`)}
                        stroke={LINE_COLOR[d]}
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        connectNulls={false}
                        isAnimationActive={false}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {data.overrides.length > 0 && (
              <Card>
                <CardHeader title={t("doctor.case.overridesLog")} />
                <ul className="space-y-1 text-sm">
                  {data.overrides.map((o, i) => (
                    <li key={i}>
                      {fmt(t("doctor.case.overrideRow"), {
                        condition: t(`results.condition.${o.disease}`),
                        from: bandLabel(o.model_band),
                        to: bandLabel(o.clinician_band),
                        reason: t(`doctor.case.reasons.${o.reason_code}`),
                      })}
                      {o.note ? ` — ${o.note}` : ""}
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            <Card className="space-y-4">
              <CardHeader title={t("doctor.case.review")} subtitle={t("doctor.case.notTraining")} />
              {saved && <Alert kind="success">{t("doctor.case.saved")}</Alert>}
              {!data.review ? (
                <p className="text-sm text-[#475569]">{t("doctor.case.notQueued")}</p>
              ) : data.review.status !== "pending" ? (
                <div className="space-y-2 text-sm">
                  <p>{fmt(t("doctor.case.reviewedAlready"), { status: t(`reviewQueue.status.${data.review.status}`) })}</p>
                  {data.review.clinician_note && (
                    <p className="rounded-xl bg-[#F0FDF4] p-3 text-[#065F46]">
                      <span className="font-bold">{t("doctor.case.existingNote")}:</span> {data.review.clinician_note}
                    </p>
                  )}
                </div>
              ) : (
                <form onSubmit={submit} className="space-y-5" noValidate>
                  <fieldset className="space-y-2">
                    <legend className="text-sm font-bold text-[#0B1F33]">{t("doctor.case.decision")}</legend>
                    {(["agree", "override"] as const).map((opt) => (
                      <label key={opt} className="flex cursor-pointer items-center gap-2 text-sm">
                        <input
                          type="radio"
                          name="decision"
                          value={opt}
                          checked={decision === opt}
                          onChange={() => setDecision(opt)}
                          className="h-4 w-4 accent-[#0E7490]"
                        />
                        {t(`doctor.case.${opt}`)}
                      </label>
                    ))}
                  </fieldset>

                  {decision === "override" && (
                    <div className="space-y-4">
                      {DISEASES.map((d) => {
                        const v = data.diseases[d];
                        const o = ovr[d] ?? EMPTY_OVERRIDE;
                        if (!v) return null;
                        const mb = modelBandOf(v);
                        return (
                          <fieldset key={d} className="space-y-3 rounded-xl border border-[#D8E2EA] p-4">
                            <legend className="px-1 text-sm font-bold text-[#0B1F33]">
                              {t(`results.condition.${d}`)} — {t("doctor.case.modelLevel")}: {bandLabel(mb)}
                            </legend>
                            <label className="flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                checked={o.on}
                                onChange={(e) => setO(d, { on: e.target.checked })}
                                className="h-4 w-4 accent-[#0E7490]"
                              />
                              {t("doctor.case.overrideCondition")}
                            </label>
                            {o.on && (
                              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <div className="space-y-1">
                                  <label htmlFor={`band-${d}`} className="text-xs font-semibold text-[#0B1F33]">
                                    {t("doctor.case.newBand")}
                                  </label>
                                  <select
                                    id={`band-${d}`}
                                    value={o.band}
                                    onChange={(e) => setO(d, { band: e.target.value })}
                                    className="h-10 w-full rounded-xl border border-[#CBD5E1] bg-white px-3 text-sm focus-visible:outline-2 focus-visible:outline-[#0E7490]"
                                  >
                                    <option value="">{t("doctor.case.chooseBand")}</option>
                                    {CLIN_BANDS.filter((b) => b !== mb).map((b) => (
                                      <option key={b} value={b}>
                                        {bandLabel(b)}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div className="space-y-1">
                                  <label htmlFor={`reason-${d}`} className="text-xs font-semibold text-[#0B1F33]">
                                    {t("doctor.case.reason")}
                                  </label>
                                  <select
                                    id={`reason-${d}`}
                                    value={o.reason}
                                    onChange={(e) => setO(d, { reason: e.target.value })}
                                    className="h-10 w-full rounded-xl border border-[#CBD5E1] bg-white px-3 text-sm focus-visible:outline-2 focus-visible:outline-[#0E7490]"
                                  >
                                    <option value="">{t("doctor.case.chooseReason")}</option>
                                    {REASONS.map((r) => (
                                      <option key={r} value={r}>
                                        {t(`doctor.case.reasons.${r}`)}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div className="space-y-1 sm:col-span-2">
                                  <label htmlFor={`rnote-${d}`} className="text-xs font-semibold text-[#0B1F33]">
                                    {t("doctor.case.reasonNote")}
                                  </label>
                                  <input
                                    id={`rnote-${d}`}
                                    type="text"
                                    maxLength={1000}
                                    value={o.note}
                                    aria-describedby={`rnote-help-${d}`}
                                    onChange={(e) => setO(d, { note: e.target.value })}
                                    className="h-10 w-full rounded-xl border border-[#CBD5E1] px-3 text-sm focus-visible:outline-2 focus-visible:outline-[#0E7490]"
                                  />
                                  <p id={`rnote-help-${d}`} className="text-xs text-[#475569]">
                                    {t("doctor.case.reasonNoteHelp")}
                                  </p>
                                </div>
                              </div>
                            )}
                          </fieldset>
                        );
                      })}
                    </div>
                  )}

                  <div className="space-y-1">
                    <label htmlFor="patient-note" className="text-sm font-bold text-[#0B1F33]">
                      {t("doctor.case.note")}
                    </label>
                    <textarea
                      id="patient-note"
                      rows={3}
                      maxLength={2000}
                      value={note}
                      aria-describedby="patient-note-help"
                      onChange={(e) => setNote(e.target.value)}
                      className="w-full rounded-xl border border-[#CBD5E1] p-3 text-sm focus-visible:outline-2 focus-visible:outline-[#0E7490]"
                    />
                    <p id="patient-note-help" className="text-xs text-[#475569]">
                      {t("doctor.case.noteHelp")}
                    </p>
                  </div>

                  {formError && <Alert kind="error">{formError}</Alert>}
                  <Button type="submit" variant="primary" isLoading={saving}>
                    {t("doctor.case.submit")}
                  </Button>
                </form>
              )}
            </Card>
          </>
        )}
      </div>
    </AppShell>
  );
}
