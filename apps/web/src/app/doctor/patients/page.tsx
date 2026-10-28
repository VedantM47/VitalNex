"use client";

// P6: review queue + consented patient list. Both are RLS-scoped server-side: only patients with
// an active share_with_clinician consent are returned, and withdrawal removes access at once.
// Each queue item opens the case view (/doctor/cases/[id]) with Agree / Override.

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { RefreshCw, UserCheck } from "lucide-react";
import { AppShell } from "../../../components/layout/AppShell";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { Alert } from "../../../components/ui/Alert";
import { EmptyState } from "../../../components/ui/EmptyState";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { api, apiFailure } from "../../../lib/api-client";
import { useTranslation } from "../../../lib/i18n";
import { dateOnly, dateTime } from "../../../lib/format";

interface QueueItem {
  id: string;
  assessment_id: string;
  patient_name: string | null;
  reasons: string[];
  status: "pending" | "agreed" | "overridden";
  clinician_note: string | null;
  created_at: string;
}

interface PatientRow {
  id: string;
  full_name: string | null;
  assessments: number;
  latest_assessment_at: string | null;
  latest_next_step: string | null;
  pending_reviews: number;
}

const STATUS_VARIANT = { pending: "warning", agreed: "success", overridden: "info" } as const;
type Filter = "all" | "pending" | "agreed" | "overridden";
const FILTERS: Filter[] = ["all", "pending", "agreed", "overridden"];

export default function DoctorPatientsPage() {
  const { t, language } = useTranslation();
  const [tab, setTab] = useState<"queue" | "patients">("queue");
  const [filter, setFilter] = useState<Filter>("pending");
  const [items, setItems] = useState<QueueItem[] | null>(null);
  const [patients, setPatients] = useState<PatientRow[] | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(
    (f: Filter) =>
      Promise.all([api.getDoctorReviews(f === "all" ? undefined : f), api.getDoctorPatients()]),
    []
  );

  useEffect(() => {
    let active = true;
    fetchAll(filter)
      .then(([q, p]) => {
        if (!active) return;
        setItems([...q].sort((a, b) => b.created_at.localeCompare(a.created_at)));
        setPatients(p);
        setFailure(null);
      })
      .catch((e) => active && setFailure(apiFailure(e)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [filter, fetchAll]);

  const refresh = () => {
    setLoading(true);
    fetchAll(filter)
      .then(([q, p]) => {
        setItems([...q].sort((a, b) => b.created_at.localeCompare(a.created_at)));
        setPatients(p);
        setFailure(null);
      })
      .catch((e) => setFailure(apiFailure(e)))
      .finally(() => setLoading(false));
  };

  const tabBtn = (id: "queue" | "patients", label: string) => (
    <button
      type="button"
      role="tab"
      id={`tab-${id}`}
      aria-selected={tab === id}
      aria-controls={`panel-${id}`}
      onClick={() => setTab(id)}
      className={`rounded-xl px-4 py-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-[#0E7490] ${
        tab === id ? "bg-[#0B1F33] text-white" : "bg-white text-[#0B1F33] border border-[#CBD5E1]"
      }`}
    >
      {label}
    </button>
  );

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="flex flex-col justify-between gap-4 border-b border-[#D8E2EA] pb-6 sm:flex-row sm:items-center">
          <div className="space-y-1">
            <h1 className="text-2xl font-extrabold text-[#0B1F33] sm:text-3xl">{t("doctor.patients.title")}</h1>
            <p className="text-xs text-[#475569] sm:text-sm">{t("doctor.patients.subtitle")}</p>
          </div>
          <Button variant="outline" size="sm" onClick={refresh} isLoading={loading} leftIcon={<RefreshCw className="h-3.5 w-3.5" />}>
            {t("common.refresh")}
          </Button>
        </div>

        <div role="tablist" aria-label={t("doctor.patients.title")} className="flex gap-2">
          {tabBtn("queue", t("doctor.patients.tabQueue"))}
          {tabBtn("patients", t("doctor.patients.tabPatients"))}
        </div>

        {failure && (
          <Alert kind="error">
            {failure === "signin" ? t("common.signInNeeded") : t("reviewQueue.loadFailed")}
          </Alert>
        )}

        {tab === "queue" ? (
          <section id="panel-queue" role="tabpanel" aria-labelledby="tab-queue" className="space-y-4">
            <div className="flex items-center gap-2">
              <label htmlFor="status-filter" className="text-sm font-semibold text-[#0B1F33]">
                {t("doctor.patients.statusFilter")}
              </label>
              <select
                id="status-filter"
                value={filter}
                onChange={(e) => {
                  setLoading(true);
                  setFilter(e.target.value as Filter);
                }}
                className="h-10 rounded-xl border border-[#CBD5E1] bg-white px-3 text-sm focus-visible:outline-2 focus-visible:outline-[#0E7490]"
              >
                {FILTERS.map((f) => (
                  <option key={f} value={f}>
                    {f === "all" ? t("common.all") : t(`reviewQueue.status.${f}`)}
                  </option>
                ))}
              </select>
            </div>

            {items === null ? (
              !failure && <p className="text-sm text-[#475569]">{t("common.loading")}</p>
            ) : items.length === 0 ? (
              <EmptyState
                icon={<UserCheck className="h-8 w-8" aria-hidden="true" />}
                title={t("reviewQueue.emptyTitle")}
                description={t("reviewQueue.emptyBody")}
              />
            ) : (
              <ul className="space-y-3">
                {items.map((item) => (
                  <li key={item.id}>
                    <Card className="space-y-3">
                      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                        <div>
                          <h2 className="text-base font-bold text-[#0B1F33]">{item.patient_name ?? "—"}</h2>
                          <p className="text-xs text-[#475569]">
                            {t("reviewQueue.screenedOn")} {dateTime(item.created_at, language)}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <StatusBadge
                            label={t(`reviewQueue.status.${item.status}`)}
                            variant={STATUS_VARIANT[item.status]}
                            size="sm"
                          />
                          <Link
                            href={`/doctor/cases/${item.assessment_id}`}
                            className="rounded-xl bg-[#0B1F33] px-3.5 py-2 text-xs font-medium text-white hover:bg-[#132E4A] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0E7490]"
                          >
                            {t("doctor.patients.openCase")}
                          </Link>
                        </div>
                      </div>
                      <div className="text-xs">
                        <span className="font-semibold text-[#0B1F33]">{t("reviewQueue.reasonsLabel")}: </span>
                        <ul className="mt-1 inline-flex flex-wrap gap-2">
                          {item.reasons.map((r) => (
                            <li key={r} className="rounded-lg bg-[#F1F5F9] px-2.5 py-1 text-[#0B1F33]">
                              {t(`reviewQueue.reason.${r}`)}
                            </li>
                          ))}
                        </ul>
                      </div>
                      {item.clinician_note && (
                        <p className="rounded-xl border border-[#0F766E]/20 bg-[#F0FDF4] p-3 text-xs text-[#065F46]">
                          <span className="font-bold">{t("reviewQueue.clinicianNote")}:</span> {item.clinician_note}
                        </p>
                      )}
                    </Card>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : (
          <section id="panel-patients" role="tabpanel" aria-labelledby="tab-patients">
            {patients === null ? (
              !failure && <p className="text-sm text-[#475569]">{t("common.loading")}</p>
            ) : patients.length === 0 ? (
              <EmptyState
                icon={<UserCheck className="h-8 w-8" aria-hidden="true" />}
                title={t("doctor.patients.noPatientsTitle")}
                description={t("doctor.patients.noPatientsBody")}
              />
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-[#D8E2EA] bg-white">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#F8FAFC] text-xs text-[#334155]">
                    <tr>
                      <th scope="col" className="p-3">{t("doctor.patients.colName")}</th>
                      <th scope="col" className="p-3">{t("doctor.patients.colAssessments")}</th>
                      <th scope="col" className="p-3">{t("doctor.patients.colLatest")}</th>
                      <th scope="col" className="p-3">{t("doctor.patients.colNextStep")}</th>
                      <th scope="col" className="p-3">{t("doctor.patients.colPending")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {patients.map((p) => (
                      <tr key={p.id}>
                        <th scope="row" className="p-3 font-semibold text-[#0B1F33]">{p.full_name ?? "—"}</th>
                        <td className="p-3">{p.assessments}</td>
                        <td className="p-3">{dateOnly(p.latest_assessment_at, language) ?? t("doctor.patients.never")}</td>
                        <td className="p-3">
                          {p.latest_next_step ? t(`results.nextStep.${p.latest_next_step}.title`) : "—"}
                        </td>
                        <td className="p-3">{p.pending_reviews}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </div>
    </AppShell>
  );
}
