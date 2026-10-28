"use client";

// P7 Trust Passport (public). Nothing is hardcoded: every number comes from GET /api/v1/trust-passport
// (ml/artifacts/<disease>/model_meta.json, ml/data/stats.json, docs/data_card.md, docs/DECISIONS.md
// and DB aggregates) and the principle map from GET /api/v1/trust-passport/principles. A value
// the API could not compute is shown as "not available", never as a placeholder number.

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, ChevronDown, ChevronUp, ShieldCheck, XCircle } from "lucide-react";
import { AppShell } from "../../components/layout/AppShell";
import { Card, CardHeader } from "../../components/ui/Card";
import { Alert } from "../../components/ui/Alert";
import { EmptyState } from "../../components/ui/EmptyState";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { api, apiUrl } from "../../lib/api-client";
import { useTranslation } from "../../lib/i18n";
import { DISEASES, fmt } from "../../lib/assessment";
import { NOT_AVAILABLE, ci, dateOnly, dec, isNum, pct } from "../../lib/format";

type T = (k: string, f?: string) => string;
const TOC = ["what", "data", "models", "fairness", "abst", "decisions", "limits", "versions", "report", "principles"] as const;

/** Source docs use light Markdown (**bold**, `code`, <url>); show them as plain text. */
function plain(s: unknown): string {
  return String(s ?? "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/<(https?:[^>]+)>/g, "$1");
}

function Row({ label, value, help }: { label: string; value: React.ReactNode; help?: string }) {
  return (
    <div className="border-b border-[#F1F5F9] py-2">
      <dt className="text-xs font-semibold text-[#334155]">{label}</dt>
      <dd className="text-sm text-[#0F172A]">{value}</dd>
      {help && <p className="text-xs text-[#475569]">{help}</p>}
    </div>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="scroll-mt-6">
      <Card className="space-y-4">
        <h2 id={`${id}-h`} className="text-lg font-bold text-[#0B1F33] sm:text-xl">
          {title}
        </h2>
        {children}
      </Card>
    </section>
  );
}

function Plot({ src, alt, t }: { src: string; alt: string; t: T }) {
  const [broken, setBroken] = useState(false);
  if (broken) return <p className="text-xs text-[#475569]">{t("trust.models.imageMissing")}</p>;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- served by the API, not by Next
    <img src={apiUrl(src)} alt={alt} loading="lazy" className="w-full rounded-xl border border-[#E2E8F0] bg-white" onError={() => setBroken(true)} />
  );
}

/** Renders a live evidence value of any shape; "not available" stays literal. */
function Evidence({ v, t }: { v: unknown; t: T }): React.ReactElement {
  if (v === NOT_AVAILABLE || v === null || v === undefined) {
    return <span className="font-semibold text-[#78350F]">{t("common.notAvailable")}</span>;
  }
  if (isNum(v)) return <span className="font-mono">{Number.isInteger(v) ? v.toLocaleString() : v.toFixed(4)}</span>;
  if (typeof v === "boolean") return <span>{v ? t("common.yes") : t("common.no")}</span>;
  if (typeof v === "string") return <span className="break-all font-mono text-xs">{v}</span>;
  if (Array.isArray(v)) return <span className="text-xs">{v.map((x) => (typeof x === "object" ? JSON.stringify(x) : String(x))).join(", ")}</span>;
  const entries = Object.entries(v as Record<string, unknown>);
  if (entries.length === 0) return <span className="text-xs">—</span>;
  return (
    <dl className="ml-2 space-y-0.5 border-l border-[#E2E8F0] pl-3">
      {entries.map(([k, x]) => (
        <div key={k} className="text-xs">
          <dt className="inline font-semibold text-[#334155]">
            {(DISEASES as string[]).includes(k) ? t(`results.condition.${k}`) : k}:{" "}
          </dt>
          <dd className="inline">
            <Evidence v={x} t={t} />
          </dd>
        </div>
      ))}
    </dl>
  );
}

function PrincipleMap({ t }: { t: T }) {
  const [pm, setPm] = useState<any | null | "error">(null);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  useEffect(() => {
    let active = true;
    api
      .getPrincipleMap()
      .then((x) => active && setPm(x))
      .catch(() => active && setPm("error"));
    return () => {
      active = false;
    };
  }, []);
  if (pm === "error") return <Alert kind="error">{t("trust.principles.loadFailed")}</Alert>;
  if (pm === null) return <p className="text-sm text-[#475569]">{t("common.loading")}</p>;
  return (
    <div className="space-y-4">
      <p className="text-sm text-[#334155]">{t("trust.principles.intro")}</p>
      <p className="text-xs text-[#475569]">{pm.source}</p>
      <ul className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {pm.principles.map((p: any) => {
          const missing = p.evidence.filter((e: any) => !e.available).length;
          const isOpen = !!open[p.id];
          return (
            <li key={p.id} className="space-y-3 rounded-2xl border border-[#D8E2EA] p-4">
              <h3 className="text-base font-bold text-[#0B1F33]">{p.principle}</h3>
              <div>
                <p className="text-xs font-semibold text-[#334155]">{t("trust.principles.implementedBy")}</p>
                <ul className="mt-1 flex flex-wrap gap-2">
                  {p.implemented_by.map((f: any) => (
                    <li key={f.id}>
                      <Link
                        href={f.page}
                        className="inline-block rounded-lg bg-[#F1F5F9] px-2.5 py-1 text-xs text-[#0B1F33] underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-[#0E7490]"
                      >
                        {f.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge
                  size="sm"
                  variant={missing ? "warning" : "success"}
                  label={`${t("trust.principles.evidence")}: ${p.evidence.length - missing}/${p.evidence.length}`}
                />
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={`ev-${p.id}`}
                  onClick={() => setOpen((o) => ({ ...o, [p.id]: !isOpen }))}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#0E7490] hover:underline focus-visible:outline-2 focus-visible:outline-[#0E7490]"
                >
                  {isOpen ? t("trust.principles.hideEvidence") : t("trust.principles.showEvidence")}
                  {isOpen ? <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" /> : <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />}
                </button>
              </div>
              {isOpen && (
                <ul id={`ev-${p.id}`} className="space-y-3">
                  {p.evidence.map((e: any) => (
                    <li key={e.id} className="rounded-xl bg-[#F8FAFC] p-3">
                      <p className="flex items-center gap-1.5 text-sm font-semibold text-[#0B1F33]">
                        {e.available ? (
                          <CheckCircle2 className="h-4 w-4 text-[#0F766E]" aria-hidden="true" />
                        ) : (
                          <XCircle className="h-4 w-4 text-[#B45309]" aria-hidden="true" />
                        )}
                        {e.label}
                      </p>
                      <p className="text-xs text-[#475569]">{fmt(t("trust.principles.source"), { s: e.source })}</p>
                      <div className="mt-1">
                        <Evidence v={e.value} t={t} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function AITrustPassportPage() {
  const { t, language } = useTranslation();
  const [tp, setTp] = useState<any | null | "error">(null);

  useEffect(() => {
    let active = true;
    api
      .getTrustPassport()
      .then((x) => active && setTp(x))
      .catch(() => active && setTp("error"));
    return () => {
      active = false;
    };
  }, []);

  const na = t("common.notAvailable");
  const show = (s: string | null | undefined) => s ?? na;
  const conds = tp && tp !== "error" ? DISEASES.filter((d) => tp.models[d]) : [];

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="space-y-1 border-b border-[#D8E2EA] pb-6">
          <h1 className="text-2xl font-extrabold text-[#0B1F33] sm:text-3xl">{t("trust.title")}</h1>
          <p className="text-xs text-[#475569] sm:text-sm">{t("trust.subtitle")}</p>
        </div>

        {tp === "error" ? (
          <EmptyState icon={<ShieldCheck className="h-8 w-8" aria-hidden="true" />} title={t("trust.title")} description={t("trust.loadFailed")} />
        ) : tp === null ? (
          <p className="text-sm text-[#475569]">{t("common.loading")}</p>
        ) : (
          <>
            <nav aria-label={t("trust.toc")} className="flex flex-wrap gap-2">
              {TOC.map((s) => (
                <a
                  key={s}
                  href={`#${s}`}
                  className="rounded-full border border-[#CBD5E1] bg-white px-3 py-1.5 text-xs font-semibold text-[#0B1F33] hover:bg-[#F1F5F9] focus-visible:outline-2 focus-visible:outline-[#0E7490]"
                >
                  {t(s === "principles" ? "trust.principles.title" : s === "what" ? "trust.what.title" : `trust.${s}.title`)}
                </a>
              ))}
            </nav>

            <Section id="what" title={t("trust.what.title")}>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <h3 className="mb-2 text-sm font-bold text-[#065F46]">{t("trust.what.is")}</h3>
                  <ul className="space-y-2 text-sm">
                    {tp.what_it_is.map((k: string) => (
                      <li key={k} className="flex gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#0F766E]" aria-hidden="true" />
                        {t(`trust.what.items.${k}`, k)}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="mb-2 text-sm font-bold text-[#991B1B]">{t("trust.what.isNot")}</h3>
                  <ul className="space-y-2 text-sm">
                    {tp.what_it_is_not.map((k: string) => (
                      <li key={k} className="flex gap-2">
                        <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#B42318]" aria-hidden="true" />
                        {t(`trust.what.items.${k}`, k)}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Section>

            <Section id="data" title={t("trust.data.title")}>
              {!tp.data.available ? (
                <p className="text-sm">{na}</p>
              ) : (
                <dl className="grid grid-cols-1 gap-x-6 md:grid-cols-2">
                  <Row label={t("trust.data.name")} value={plain(tp.data.name)} />
                  <Row label={t("trust.data.survey")} value={plain(tp.data.underlying_survey)} />
                  <Row label={t("trust.data.doi")} value={plain(tp.data.doi)} />
                  <Row label={t("trust.data.licence")} value={plain(tp.data.licence)} />
                  <Row label={t("trust.data.rows")} value={isNum(tp.data.rows) ? tp.data.rows.toLocaleString() : na} />
                  <Row
                    label={t("trust.data.duplicates")}
                    value={isNum(tp.data.exact_duplicate_rows) ? tp.data.exact_duplicate_rows.toLocaleString() : na}
                  />
                  <Row
                    label={t("trust.data.prevalence")}
                    value={
                      tp.data.prevalence
                        ? DISEASES.map((d) => `${t(`results.condition.${d}`)}: ${show(pct(tp.data.prevalence[d]))}`).join(" · ")
                        : na
                    }
                  />
                  <Row label={t("trust.data.hash")} value={<span className="break-all font-mono text-xs">{tp.data.data_hash ?? na}</span>} />
                  <Row label={t("trust.data.synthetic")} value={plain(tp.data.synthetic_data_note)} />
                </dl>
              )}
              {tp.data.data_card_path && (
                <p className="text-xs text-[#475569]">{fmt(t("trust.data.card"), { path: tp.data.data_card_path })}</p>
              )}
            </Section>

            <Section id="models" title={t("trust.models.title")}>
              <div className="space-y-8">
                {conds.map((d) => {
                  const m = tp.models[d];
                  const cname = t(`results.condition.${d}`);
                  return (
                    <article key={d} aria-labelledby={`m-${d}`} className="space-y-4 border-b border-[#E2E8F0] pb-6 last:border-0">
                      <h3 id={`m-${d}`} className="text-base font-bold text-[#0B1F33]">
                        {cname} <span className="font-mono text-xs font-normal">{m.version}</span>
                      </h3>
                      <dl className="grid grid-cols-1 gap-x-6 md:grid-cols-2 lg:grid-cols-3">
                        <Row label={t("trust.models.chosen")} value={m.chosen_model} help={plain(m.chosen_reason)} />
                        <Row label={t("trust.models.testN")} value={isNum(m.test_n) ? m.test_n.toLocaleString() : na} />
                        <Row
                          label={t("trust.models.auroc")}
                          value={`${show(dec(m.auroc))} (${show(ci(m.auroc_ci95))})`}
                          help={t("trust.models.aurocHelp")}
                        />
                        <Row
                          label={t("trust.models.brier")}
                          value={`${show(dec(m.brier, 4))} (${show(ci(m.brier_ci95, 4))})`}
                          help={t("trust.models.brierHelp")}
                        />
                        <Row
                          label={t("trust.models.recall")}
                          value={`${show(pct(m.recall_at_moderate_threshold))} (${show(ci(m.recall_at_moderate_threshold_ci95, 3, true))})`}
                          help={t("trust.models.recallHelp")}
                        />
                        <Row label={t("trust.models.miss")} value={show(pct(m.miss_rate_in_low_band))} help={t("trust.models.missHelp")} />
                        <Row label={t("trust.models.dedup")} value={show(dec(m.deduplicated_test_auroc))} />
                        <Row
                          label={t("trust.models.calibration")}
                          value={`${show(dec(m.calibration?.ece_before, 4))} → ${show(dec(m.calibration?.ece_after, 4))}`}
                        />
                      </dl>
                      <div className="overflow-x-auto">
                        <table className="w-full max-w-xl text-sm">
                          <caption className="pb-1 text-left text-xs font-semibold text-[#334155]">{t("trust.models.bands")}</caption>
                          <thead className="bg-[#F8FAFC]">
                            <tr>
                              <th scope="col" className="p-2 text-left text-xs">{t("trust.models.band")}</th>
                              <th scope="col" className="p-2 text-left text-xs">{t("trust.models.share")}</th>
                              <th scope="col" className="p-2 text-left text-xs">{t("trust.models.observed")}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#E2E8F0]">
                            {Object.entries(m.bands_test as Record<string, any>).map(([b, r]) => (
                              <tr key={b}>
                                <th scope="row" className="p-2 text-left font-medium">{t(`results.band.${b}`)}</th>
                                <td className="p-2">{show(pct(r.share_of_people))}</td>
                                <td className="p-2">{show(pct(r.observed_rate))}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <figure className="space-y-1">
                          <Plot src={m.images.reliability} alt={fmt(t("trust.models.reliabilityAlt"), { condition: cname })} t={t} />
                          <figcaption className="text-xs text-[#475569]">{t("trust.models.reliability")}</figcaption>
                        </figure>
                        <figure className="space-y-1">
                          <Plot src={m.images.shap_global} alt={fmt(t("trust.models.shapAlt"), { condition: cname })} t={t} />
                          <figcaption className="text-xs text-[#475569]">
                            {t("trust.models.shap")}:{" "}
                            {m.global_shap_top.map((f: any) => t(`results.features.${f.feature}`, f.feature)).join(", ")}
                          </figcaption>
                        </figure>
                      </div>
                      <a
                        href={apiUrl(m.model_card_url)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block text-sm font-semibold text-[#0E7490] underline focus-visible:outline-2 focus-visible:outline-[#0E7490]"
                      >
                        {t("trust.models.card")}
                      </a>
                    </article>
                  );
                })}
              </div>
            </Section>

            <Section id="fairness" title={t("trust.fairness.title")}>
              <p className="text-sm text-[#334155]">{t("trust.fairness.intro")}</p>
              <ul className="space-y-2">
                {conds.map((d) => {
                  const g = tp.age_gap.by_disease[d];
                  return (
                    <li key={d}>
                      <Alert kind="warning">
                        {g
                          ? fmt(t("trust.fairness.ageGap"), {
                              condition: t(`results.condition.${d}`),
                              yr: show(pct(g.youngest_recall)),
                              young: g.youngest_group,
                              or: show(pct(g.oldest_recall)),
                              old: g.oldest_group,
                              age: tp.age_gap.young_age_threshold,
                            })
                          : na}
                      </Alert>
                    </li>
                  );
                })}
              </ul>
              {conds.map((d) => {
                const f = tp.fairness[d];
                return (
                  <details key={d} className="rounded-xl border border-[#E2E8F0] p-3">
                    <summary className="cursor-pointer text-sm font-semibold text-[#0B1F33]">{t(`results.condition.${d}`)}</summary>
                    <div className="mt-3 space-y-4">
                      {Object.entries(f.groups as Record<string, any>).map(([g, gv]) => (
                        <div key={g} className="overflow-x-auto">
                          <table className="w-full min-w-[420px] text-sm">
                            <caption className="pb-1 text-left text-xs text-[#334155]">
                              <span className="font-semibold">{fmt(t("trust.fairness.groupLabel"), { group: g })}</span> — {gv.reading}
                            </caption>
                            <thead className="bg-[#F8FAFC]">
                              <tr>
                                <th scope="col" className="p-2 text-left text-xs">{t("admin.gov.group")}</th>
                                <th scope="col" className="p-2 text-left text-xs">{t("admin.gov.recallShort")}</th>
                                <th scope="col" className="p-2 text-left text-xs">{t("admin.gov.fpr")}</th>
                                <th scope="col" className="p-2 text-left text-xs">{t("admin.gov.n")}</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E2E8F0]">
                              {Object.entries(gv.by_group as Record<string, any>).map(([name, r]) => (
                                <tr key={name}>
                                  <th scope="row" className="p-2 text-left font-medium">{name}</th>
                                  <td className="p-2">{show(pct(r.recall))}</td>
                                  <td className="p-2">{show(pct(r.false_positive_rate))}</td>
                                  <td className="p-2">{isNum(r.n) ? r.n.toLocaleString() : na}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ))}
                    </div>
                  </details>
                );
              })}
            </Section>

            <Section id="abst" title={t("trust.abst.title")}>
              <p className="text-sm text-[#334155]">{t("trust.abst.intro")}</p>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-sm">
                  <thead className="bg-[#F8FAFC]">
                    <tr>
                      <th scope="col" className="p-2 text-left text-xs">{t("admin.gov.disease")}</th>
                      <th scope="col" className="p-2 text-left text-xs">{t("trust.abst.alpha")}</th>
                      <th scope="col" className="p-2 text-left text-xs">{t("trust.abst.coverage")}</th>
                      <th scope="col" className="p-2 text-left text-xs">{t("trust.abst.rate")}</th>
                      <th scope="col" className="p-2 text-left text-xs">{t("trust.abst.ood")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {conds.map((d) => {
                      const a = tp.models[d].abstention;
                      return (
                        <tr key={d}>
                          <th scope="row" className="p-2 text-left font-medium">{t(`results.condition.${d}`)}</th>
                          <td className="p-2">{show(dec(a.alpha, 2))}</td>
                          <td className="p-2">{show(pct(a.coverage?.overall))}</td>
                          <td className="p-2">{show(pct(a.abstention_rate_total))}</td>
                          <td className="p-2">{show(pct(a.ood_rate))}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <h3 className="text-sm font-bold text-[#0B1F33]">{t("trust.abst.live")}</h3>
              <p className="text-xs text-[#475569]">{t("trust.abst.liveNote")}</p>
              <dl className="grid grid-cols-1 gap-x-6 md:grid-cols-2">
                <Row
                  label={t("trust.abst.liveAssessments")}
                  value={tp.live.assessments === NOT_AVAILABLE ? na : tp.live.assessments.assessments}
                />
                <Row
                  label={t("trust.abst.liveAbstained")}
                  value={
                    tp.live.assessments === NOT_AVAILABLE
                      ? na
                      : `${tp.live.assessments.abstained_any} (${show(pct(tp.live.assessments.abstention_rate_any))})`
                  }
                />
                <Row
                  label={t("trust.abst.liveEmergency")}
                  value={tp.live.emergency_triggers === NOT_AVAILABLE ? na : tp.live.emergency_triggers.total}
                />
                <Row
                  label={t("trust.abst.liveReviewed")}
                  value={
                    tp.live.clinician_review === NOT_AVAILABLE
                      ? na
                      : `${tp.live.clinician_review.reviewed} (${show(pct(tp.live.clinician_review.agree_rate))})`
                  }
                />
              </dl>
            </Section>

            <Section id="decisions" title={t("trust.decisions.title")}>
              <ul className="space-y-3">
                {tp.accepted_decisions.map((d: any) => (
                  <li key={d.id} className="rounded-xl bg-[#F8FAFC] p-3 text-sm">
                    <p className="font-semibold text-[#0B1F33]">
                      {d.id} {d.status ? `· ${d.status}` : ""}
                    </p>
                    <p className="text-[#0F172A]">{d.decision === NOT_AVAILABLE ? na : plain(d.decision)}</p>
                    {d.reasoning && <p className="text-xs text-[#475569]">{plain(d.reasoning)}</p>}
                  </li>
                ))}
              </ul>
            </Section>

            <Section id="limits" title={t("trust.limits.title")}>
              {Array.isArray(tp.limitations.data) ? (
                <ol className="list-decimal space-y-1 pl-6 text-sm text-[#0F172A]">
                  {tp.limitations.data.map((l: string, i: number) => (
                    <li key={i}>{plain(l)}</li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm">{na}</p>
              )}
              <h3 className="text-sm font-bold text-[#0B1F33]">{t("trust.models.flags")}</h3>
              {conds.map((d) => (
                <div key={d} className="text-sm">
                  <p className="font-semibold">{t(`results.condition.${d}`)}</p>
                  <ul className="list-disc pl-6 text-[#334155]">
                    {(tp.limitations.model_flags[d] ?? []).map((f: string) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </Section>

            <Section id="versions" title={t("trust.versions.title")}>
              <dl className="grid grid-cols-1 gap-x-6 md:grid-cols-2">
                <Row label={t("trust.versions.api")} value={tp.versions.api ?? na} />
                {conds.map((d) => (
                  <Row
                    key={d}
                    label={t(`results.condition.${d}`)}
                    value={`${tp.versions.models[d].version} · ${fmt(t("trust.versions.trainedOn"), {
                      date: dateOnly(tp.versions.models[d].trained_at, language) ?? na,
                    })}`}
                  />
                ))}
              </dl>
            </Section>

            <Section id="report" title={t("trust.report.title")}>
              <dl>
                <Row label={t("trust.report.contact")} value={tp.report_a_problem.contact === NOT_AVAILABLE ? na : tp.report_a_problem.contact} />
              </dl>
              <Alert kind="error">{fmt(t("trust.report.emergency"), { n: tp.report_a_problem.emergency })}</Alert>
            </Section>
          </>
        )}

        <section id="principles" aria-labelledby="principles-h" className="scroll-mt-6">
          <Card className="space-y-4">
            <CardHeader title={<span id="principles-h">{t("trust.principles.title")}</span>} />
            <PrincipleMap t={t} />
          </Card>
        </section>
      </div>
    </AppShell>
  );
}
