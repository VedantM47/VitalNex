"use client";

// P6 admin governance (docs/SPEC.md §7.1 Accountability). Aggregates only — the API never returns
// patient ids, names, answers or assessment ids here. Model facts come from
// ml/artifacts/<disease>/model_meta.json; counts from the database (users with aggregate_audit
// consent). Anything the API did not compute is shown as "not available".

import React, { useCallback, useEffect, useState } from "react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AppShell } from "../../../components/layout/AppShell";
import { Card, CardHeader } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { Alert } from "../../../components/ui/Alert";
import { api } from "../../../lib/api-client";
import { useTranslation } from "../../../lib/i18n";
import { fmt } from "../../../lib/assessment";
import { ci, dateTime, dec, pct } from "../../../lib/format";

type T = (k: string, f?: string) => string;
const SECTIONS = ["registry", "fairness", "overrides", "activity", "consents", "audit"] as const;
const TH = "p-2 text-left text-xs font-semibold text-[#334155]";
const TD = "p-2 text-sm text-[#0F172A]";

/** Loads one endpoint; null while loading, "error" on failure. */
function useLoad<V>(fn: () => Promise<V>): V | null | "error" {
  const [v, setV] = useState<V | null | "error">(null);
  useEffect(() => {
    let active = true;
    fn()
      .then((x) => active && setV(x))
      .catch(() => active && setV("error"));
    return () => {
      active = false;
    };
  }, [fn]);
  return v;
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="scroll-mt-6">
      <Card className="space-y-4">
        <CardHeader title={<span id={`${id}-h`}>{title}</span>} />
        {children}
      </Card>
    </section>
  );
}

function State({ v, t }: { v: unknown; t: T }) {
  if (v === "error") return <Alert kind="error">{t("admin.gov.loadFailed")}</Alert>;
  return <p className="text-sm text-[#475569]">{t("common.loading")}</p>;
}

// ── Model registry ──
function Registry({ t, lang }: { t: T; lang: string }) {
  const v = useLoad(api.getGovModels);
  if (v === null || v === "error") return <State v={v} t={t} />;
  const na = t("common.notAvailable");
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px]">
        <thead className="bg-[#F8FAFC]">
          <tr>
            {["disease", "version", "model", "trained", "dataHash", "auroc", "brier", "recall", "abstention", "card"].map((k) => (
              <th key={k} scope="col" className={TH}>
                {t(`admin.gov.${k}`)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#E2E8F0]">
          {v.map((m) => (
            <tr key={m.disease}>
              <th scope="row" className={`${TD} font-semibold`}>{t(`results.condition.${m.disease}`)}</th>
              <td className={`${TD} font-mono text-xs`}>{m.version}</td>
              <td className={TD}>{m.chosen_model}</td>
              <td className={TD}>{dateTime(m.trained_at, lang) ?? na}</td>
              <td className={`${TD} font-mono text-xs`} title={m.data_hash}>
                {String(m.data_hash).slice(0, 12)}…
              </td>
              <td className={TD}>
                {dec(m.test_auroc) ?? na} ({ci(m.test_auroc_ci95) ?? na})
              </td>
              <td className={TD}>{dec(m.test_brier) ?? na}</td>
              <td className={TD}>{pct(m.test_recall_at_t_mod) ?? na}</td>
              <td className={TD}>{pct(m.abstention_rate_test) ?? na}</td>
              <td className={TD}>
                <a href={api.modelCardUrl(m.disease)} target="_blank" rel="noreferrer" className="font-semibold text-[#0E7490] underline">
                  {t("admin.gov.card")}
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {v.map((m) => (
        <details key={m.disease} className="mt-3 text-sm">
          <summary className="cursor-pointer font-semibold text-[#0B1F33]">
            {t(`results.condition.${m.disease}`)} — {t("admin.gov.flags")} ({m.flags.length})
          </summary>
          <ul className="mt-1 list-disc pl-6 text-[#334155]">
            {m.flags.map((f: string) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </details>
      ))}
    </div>
  );
}

// ── Fairness ──
function Fairness({ t }: { t: T }) {
  const v = useLoad(api.getGovFairness);
  if (v === null || v === "error") return <State v={v} t={t} />;
  const na = t("common.notAvailable");
  return (
    <div className="space-y-6">
      {Object.entries(v as Record<string, any>).map(([d, f]) => (
        <div key={d} className="space-y-3">
          <h3 className="text-base font-bold text-[#0B1F33]">
            {t(`results.condition.${d}`)} <span className="font-mono text-xs font-normal">({f.version})</span>
          </h3>
          <p className="text-xs text-[#475569]">
            {t("admin.gov.definition")}: {f.definition}
          </p>
          <p className="text-xs text-[#475569]">{fmt(t("admin.gov.fairnessOnly"), { cols: f.fairness_only_columns.join(", ") })}</p>
          {Object.entries(f.groups as Record<string, any>).map(([g, gv]) => (
            <div key={g} className="overflow-x-auto rounded-xl border border-[#E2E8F0]">
              <table className="w-full min-w-[640px]">
                <caption className="bg-[#F8FAFC] p-2 text-left text-sm font-semibold text-[#0B1F33]">
                  {g}
                  <span className="block text-xs font-normal text-[#334155]">{gv.reading}</span>
                </caption>
                <thead>
                  <tr>
                    {["group", "n", "recall", "fpr", "precision", "observed", "groupAbstention"].map((k) => (
                      <th key={k} scope="col" className={TH}>
                        {t(`admin.gov.${k === "recall" ? "recallShort" : k}`)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {Object.entries(gv.by_group as Record<string, any>).map(([name, r]) => (
                    <tr key={name}>
                      <th scope="row" className={`${TD} font-medium`}>{name}</th>
                      <td className={TD}>{typeof r.n === "number" ? r.n.toLocaleString() : na}</td>
                      <td className={TD}>{pct(r.recall) ?? na}</td>
                      <td className={TD}>{pct(r.false_positive_rate) ?? na}</td>
                      <td className={TD}>{pct(r.precision) ?? na}</td>
                      <td className={TD}>{pct(r.observed_rate) ?? na}</td>
                      <td className={TD}>{pct(r.abstention_rate) ?? na}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="p-2 text-xs text-[#334155]">
                {fmt(t("admin.gov.gap"), {
                  r: dec(gv.gaps?.recall?.max_gap) ?? na,
                  f: dec(gv.gaps?.false_positive_rate?.max_gap) ?? na,
                })}
              </p>
            </div>
          ))}
          {f.flags.length > 0 && (
            <ul className="list-disc pl-6 text-sm text-[#78350F]">
              {f.flags.map((x: string) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Override analytics ──
function Overrides({ t }: { t: T }) {
  const v = useLoad(api.getGovOverrides);
  if (v === null || v === "error") return <State v={v} t={t} />;
  const na = t("common.notAvailable");
  const stat = (label: string, value: React.ReactNode) => (
    <div className="rounded-xl border border-[#E2E8F0] p-3">
      <dt className="text-xs text-[#475569]">{label}</dt>
      <dd className="text-xl font-bold text-[#0B1F33]">{value}</dd>
    </div>
  );
  const counts = (obj: Record<string, number>, prefix: string) =>
    Object.keys(obj).length === 0 ? (
      <p className="text-sm text-[#475569]">{t("admin.gov.cons.none")}</p>
    ) : (
      <ul className="space-y-1 text-sm">
        {Object.entries(obj).map(([k, n]) => (
          <li key={k} className="flex justify-between gap-4">
            <span>{t(`${prefix}.${k}`, k)}</span>
            <span className="font-semibold">{n}</span>
          </li>
        ))}
      </ul>
    );
  return (
    <div className="space-y-5">
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {stat(t("admin.gov.ov.queueItems"), v.queue_items)}
        {stat(t("admin.gov.ov.pending"), v.pending)}
        {stat(t("admin.gov.ov.reviewed"), v.reviewed)}
        {stat(t("admin.gov.ov.agreed"), v.agreed)}
        {stat(t("admin.gov.ov.overridden"), v.overridden)}
        {stat(t("admin.gov.ov.agreeRate"), pct(v.agree_rate) ?? na)}
      </dl>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px]">
          <caption className="p-2 text-left text-sm font-semibold text-[#0B1F33]">{t("admin.gov.ov.perDisease")}</caption>
          <thead className="bg-[#F8FAFC]">
            <tr>
              <th scope="col" className={TH}>{t("admin.gov.disease")}</th>
              <th scope="col" className={TH}>{t("admin.gov.ov.eligible")}</th>
              <th scope="col" className={TH}>{t("admin.gov.ov.count")}</th>
              <th scope="col" className={TH}>{t("admin.gov.ov.rate")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0]">
            {Object.entries(v.per_disease as Record<string, any>).map(([d, r]) => (
              <tr key={d}>
                <th scope="row" className={`${TD} font-medium`}>{t(`results.condition.${d}`)}</th>
                <td className={TD}>{r.reviewed_with_result}</td>
                <td className={TD}>{r.overrides}</td>
                <td className={TD}>{pct(r.override_rate) ?? na}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div>
          <h3 className="mb-2 text-sm font-bold text-[#0B1F33]">{t("admin.gov.ov.perReason")}</h3>
          {counts(v.per_reason, "doctor.case.reasons")}
        </div>
        <div>
          <h3 className="mb-2 text-sm font-bold text-[#0B1F33]">{t("admin.gov.ov.direction")}</h3>
          {counts(v.direction, "admin.gov.ov")}
        </div>
        <div>
          <h3 className="mb-2 text-sm font-bold text-[#0B1F33]">{t("admin.gov.ov.queueReasons")}</h3>
          {counts(v.queue_reasons, "reviewQueue.reason")}
        </div>
      </div>
    </div>
  );
}

// ── Activity over time ──
const SERIES = [
  { key: "assessments", label: "admin.gov.act.assessments", color: "#0284C7" },
  { key: "abstained_any", label: "admin.gov.act.abstained", color: "#B45309" },
  { key: "emergency_assessments", label: "admin.gov.act.emergencyForm", color: "#B42318" },
  { key: "emergency_assistant", label: "admin.gov.act.emergencyAssistant", color: "#6D28D9" },
] as const;

function Activity({ t }: { t: T }) {
  const [days, setDays] = useState(30);
  const fn = useCallback(() => api.getGovActivity(days), [days]);
  const v = useLoad(fn);
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <label htmlFor="act-days" className="text-sm font-semibold text-[#0B1F33]">
          {t("admin.gov.act.range")}
        </label>
        <select
          id="act-days"
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="h-10 rounded-xl border border-[#CBD5E1] bg-white px-3 text-sm focus-visible:outline-2 focus-visible:outline-[#0E7490]"
        >
          {[7, 30, 90, 365].map((n) => (
            <option key={n} value={n}>
              {fmt(t("admin.gov.act.days"), { n })}
            </option>
          ))}
        </select>
      </div>
      {v === null || v === "error" ? (
        <State v={v} t={t} />
      ) : v.series.length === 0 ? (
        <p className="text-sm text-[#475569]">{t("admin.gov.act.empty")}</p>
      ) : (
        <>
          <div className="h-72 w-full" role="img" aria-label={t("admin.gov.act.chartLabel")}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={v.series} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
                <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#334155" }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#334155" }} />
                <Tooltip />
                <Legend />
                {SERIES.map((s) => (
                  <Line
                    key={s.key}
                    type="monotone"
                    dataKey={s.key}
                    name={t(s.label)}
                    stroke={s.color}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    isAnimationActive={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <details>
            <summary className="cursor-pointer text-sm font-semibold text-[#0E7490]">{t("admin.gov.act.table")}</summary>
            <div className="overflow-x-auto">
              <table className="mt-2 w-full min-w-[560px]">
                <thead className="bg-[#F8FAFC]">
                  <tr>
                    <th scope="col" className={TH}>{t("admin.gov.act.date")}</th>
                    {SERIES.map((s) => (
                      <th key={s.key} scope="col" className={TH}>
                        {t(s.label)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {v.series.map((r: Record<string, number | string>) => (
                    <tr key={r.date as string}>
                      <th scope="row" className={`${TD} font-medium`}>{r.date}</th>
                      {SERIES.map((s) => (
                        <td key={s.key} className={TD}>
                          {r[s.key]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </>
      )}
    </div>
  );
}

// ── Consent stats ──
function Consents({ t }: { t: T }) {
  const v = useLoad(api.getGovConsents);
  if (v === null || v === "error") return <State v={v} t={t} />;
  const na = t("common.notAvailable");
  const c = v.consents;
  const req = (o: Record<string, number>) =>
    Object.keys(o).length === 0 ? t("admin.gov.cons.none") : Object.entries(o).map(([k, n]) => `${k}: ${n}`).join(", ");
  return (
    <div className="space-y-5">
      <p className="text-sm text-[#334155]">{fmt(t("admin.gov.cons.patients"), { n: c.patients })}</p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px]">
          <thead className="bg-[#F8FAFC]">
            <tr>
              {["purpose", "granted", "withdrawn", "rate", "versions"].map((k) => (
                <th key={k} scope="col" className={TH}>
                  {t(`admin.gov.cons.${k}`)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0]">
            {Object.entries(c.purposes as Record<string, any>).map(([p, r]) => (
              <tr key={p}>
                <th scope="row" className={`${TD} font-medium`}>{t(`myData.purposes.${p}.title`, p)}</th>
                <td className={TD}>{r.granted}</td>
                <td className={TD}>{r.withdrawn}</td>
                <td className={TD}>{pct(r.granted_rate) ?? na}</td>
                <td className={`${TD} font-mono text-xs`}>{req(r.notice_versions)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <h3 className="mb-2 text-sm font-bold text-[#0B1F33]">{t("admin.gov.cons.shares")}</h3>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            {(["created", "revoked", "expired", "opens"] as const).map((k) => (
              <div key={k} className="flex justify-between gap-2 rounded-lg bg-[#F8FAFC] p-2">
                <dt>{t(`admin.gov.cons.${k}`)}</dt>
                <dd className="font-semibold">{v.shares[k]}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div>
          <h3 className="mb-2 text-sm font-bold text-[#0B1F33]">{t("admin.gov.cons.requests")}</h3>
          <dl className="space-y-1 text-sm">
            <div className="flex justify-between gap-2">
              <dt>{t("admin.gov.cons.export")}</dt>
              <dd className="font-mono text-xs">{req(v.data_requests.export)}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>{t("admin.gov.cons.delete")}</dt>
              <dd className="font-mono text-xs">{req(v.data_requests.delete)}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}

// ── Audit log viewer ──
const PAGE = 25;
const EMPTY_FILTERS = { action: "", resource_type: "", actor_role: "", since: "", until: "" };

function Audit({ t, lang }: { t: T; lang: string }) {
  const [draft, setDraft] = useState(EMPTY_FILTERS);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [offset, setOffset] = useState(0);
  const fn = useCallback(
    () =>
      api.getGovAuditLogs({
        action: filters.action.trim() || undefined,
        resource_type: filters.resource_type.trim() || undefined,
        actor_role: filters.actor_role || undefined,
        since: filters.since ? new Date(filters.since).toISOString() : undefined,
        until: filters.until ? new Date(`${filters.until}T23:59:59`).toISOString() : undefined,
        limit: PAGE,
        offset,
      }),
    [filters, offset]
  );
  const v = useLoad(fn);
  const input = "h-10 w-full rounded-xl border border-[#CBD5E1] bg-white px-3 text-sm focus-visible:outline-2 focus-visible:outline-[#0E7490]";
  return (
    <div className="space-y-4">
      <form
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6"
        onSubmit={(e) => {
          e.preventDefault();
          setOffset(0);
          setFilters(draft);
        }}
      >
        <div>
          <label htmlFor="f-action" className="text-xs font-semibold">{t("admin.gov.audit.action")}</label>
          <input id="f-action" className={input} value={draft.action} onChange={(e) => setDraft({ ...draft, action: e.target.value })} />
        </div>
        <div>
          <label htmlFor="f-res" className="text-xs font-semibold">{t("admin.gov.audit.resource")}</label>
          <input id="f-res" className={input} value={draft.resource_type} onChange={(e) => setDraft({ ...draft, resource_type: e.target.value })} />
        </div>
        <div>
          <label htmlFor="f-role" className="text-xs font-semibold">{t("admin.gov.audit.actor")}</label>
          <select id="f-role" className={input} value={draft.actor_role} onChange={(e) => setDraft({ ...draft, actor_role: e.target.value })}>
            <option value="">{t("common.all")}</option>
            {["patient", "doctor", "admin", "system"].map((r) => (
              <option key={r} value={r}>
                {t(`admin.gov.audit.roles.${r}`)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="f-since" className="text-xs font-semibold">{t("admin.gov.audit.since")}</label>
          <input id="f-since" type="date" className={input} value={draft.since} onChange={(e) => setDraft({ ...draft, since: e.target.value })} />
        </div>
        <div>
          <label htmlFor="f-until" className="text-xs font-semibold">{t("admin.gov.audit.until")}</label>
          <input id="f-until" type="date" className={input} value={draft.until} onChange={(e) => setDraft({ ...draft, until: e.target.value })} />
        </div>
        <div className="flex items-end gap-2">
          <Button type="submit" size="sm">{t("common.apply")}</Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => {
              setDraft(EMPTY_FILTERS);
              setFilters(EMPTY_FILTERS);
              setOffset(0);
            }}
          >
            {t("common.reset")}
          </Button>
        </div>
      </form>

      {v === null || v === "error" ? (
        <State v={v} t={t} />
      ) : v.entries.length === 0 ? (
        <p className="text-sm text-[#475569]">{t("admin.gov.audit.empty")}</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead className="bg-[#F8FAFC]">
                <tr>
                  {["time", "action", "resource", "actor", "staffId", "details"].map((k) => (
                    <th key={k} scope="col" className={TH}>
                      {t(`admin.gov.audit.${k}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {v.entries.map((e: any) => (
                  <tr key={e.id}>
                    <td className={`${TD} whitespace-nowrap text-xs`}>{dateTime(e.created_at, lang)}</td>
                    <td className={`${TD} font-mono text-xs`}>{e.action}</td>
                    <td className={`${TD} font-mono text-xs`}>{e.resource_type}</td>
                    <td className={TD}>{t(`admin.gov.audit.roles.${e.actor_role}`, e.actor_role)}</td>
                    <td className={`${TD} font-mono text-xs`}>{e.actor_id ? `${String(e.actor_id).slice(0, 8)}…` : "—"}</td>
                    <td className={`${TD} max-w-[320px] break-words font-mono text-xs`}>
                      {Object.keys(e.metadata).length ? JSON.stringify(e.metadata) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between gap-3 text-sm">
            <span aria-live="polite">
              {fmt(t("admin.gov.audit.showing"), { from: v.offset + 1, to: v.offset + v.entries.length, total: v.total })}
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - PAGE))}>
                {t("common.prev")}
              </Button>
              <Button size="sm" variant="outline" disabled={v.offset + v.entries.length >= v.total} onClick={() => setOffset(offset + PAGE)}>
                {t("common.next")}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function GovernancePage() {
  const { t, language } = useTranslation();
  return (
    <AppShell>
      <div className="space-y-8">
        <div className="space-y-1 border-b border-[#D8E2EA] pb-6">
          <h1 className="text-2xl font-extrabold text-[#0B1F33] sm:text-3xl">{t("admin.gov.title")}</h1>
          <p className="text-xs text-[#475569] sm:text-sm">{t("admin.gov.subtitle")}</p>
        </div>
        <nav aria-label={t("trust.toc")} className="flex flex-wrap gap-2">
          {SECTIONS.map((s) => (
            <a
              key={s}
              href={`#${s}`}
              className="rounded-full border border-[#CBD5E1] bg-white px-3 py-1.5 text-xs font-semibold text-[#0B1F33] hover:bg-[#F1F5F9] focus-visible:outline-2 focus-visible:outline-[#0E7490]"
            >
              {t(`admin.gov.sections.${s}`)}
            </a>
          ))}
        </nav>
        <Section id="registry" title={t("admin.gov.sections.registry")}>
          <Registry t={t} lang={language} />
        </Section>
        <Section id="fairness" title={t("admin.gov.sections.fairness")}>
          <Fairness t={t} />
        </Section>
        <Section id="overrides" title={t("admin.gov.sections.overrides")}>
          <Overrides t={t} />
        </Section>
        <Section id="activity" title={t("admin.gov.sections.activity")}>
          <Activity t={t} />
        </Section>
        <Section id="consents" title={t("admin.gov.sections.consents")}>
          <Consents t={t} />
        </Section>
        <Section id="audit" title={t("admin.gov.sections.audit")}>
          <Audit t={t} lang={language} />
        </Section>
      </div>
    </AppShell>
  );
}
