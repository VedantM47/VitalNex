"use client";

// P6: counts and recent queue items come only from the API (review queue is RLS-scoped to
// patients with share_with_clinician consent). Nothing is hardcoded.

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, Calendar } from "lucide-react";
import { AppShell } from "../../../components/layout/AppShell";
import { Card, CardHeader } from "../../../components/ui/Card";
import { StatCard } from "../../../components/ui/StatCard";
import { ButtonLink } from "../../../components/ui/Button";
import { Alert } from "../../../components/ui/Alert";
import { api, apiFailure } from "../../../lib/api-client";
import { useTranslation } from "../../../lib/i18n";
import { dateTime } from "../../../lib/format";

interface QueueItem {
  id: string;
  assessment_id: string;
  patient_name: string | null;
  reasons: string[];
  status: string;
  created_at: string;
}

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
}

export default function DoctorDashboardPage() {
  const { t, language } = useTranslation();
  const [pending, setPending] = useState<QueueItem[] | null>(null);
  const [today, setToday] = useState<number | null>(null);
  const [failure, setFailure] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    api
      .getDoctorReviews("pending")
      .then((items: QueueItem[]) => {
        if (!active) return;
        setPending([...items].sort((a, b) => b.created_at.localeCompare(a.created_at)));
      })
      .catch((e) => active && setFailure(apiFailure(e)));
    api
      .getAppointments()
      .then((apts: { appointment_time: string; status: string }[]) => {
        if (active) setToday(apts.filter((a) => a.status !== "cancelled" && isToday(a.appointment_time)).length);
      })
      .catch((e) => active && setFailure(apiFailure(e)));
    return () => {
      active = false;
    };
  }, []);

  const show = (n: number | null | undefined) => (n === null || n === undefined ? "—" : String(n));

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="space-y-1 border-b border-[#D8E2EA] pb-6">
          <h1 className="text-2xl font-extrabold text-[#0B1F33] sm:text-3xl">{t("doctor.dashboard.title")}</h1>
          <p className="text-xs text-[#475569] sm:text-sm">{t("doctor.dashboard.subtitle")}</p>
        </div>

        {failure && (
          <Alert kind="error">{failure === "signin" ? t("common.signInNeeded") : t("common.apiUnavailable")}</Alert>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
          <StatCard
            label={t("doctor.dashboard.pending")}
            value={show(pending?.length)}
            subtext={t("doctor.dashboard.pendingSub")}
            icon={<AlertTriangle className="h-5 w-5 text-[#B45309]" aria-hidden="true" />}
          />
          <StatCard
            label={t("doctor.dashboard.today")}
            value={show(today)}
            subtext={t("doctor.dashboard.todaySub")}
            icon={<Calendar className="h-5 w-5 text-[#0E7490]" aria-hidden="true" />}
          />
        </div>

        <Card>
          <CardHeader title={t("doctor.dashboard.recent")} />
          {pending === null ? (
            <p className="text-sm text-[#475569]">{failure ? "—" : t("common.loading")}</p>
          ) : pending.length === 0 ? (
            <p className="text-sm text-[#475569]">{t("doctor.dashboard.noPending")}</p>
          ) : (
            <ul className="divide-y divide-[#E2E8F0]">
              {pending.slice(0, 5).map((q) => (
                <li key={q.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[#0B1F33]">{q.patient_name ?? "—"}</p>
                    <p className="text-xs text-[#475569]">
                      {dateTime(q.created_at, language)} · {q.reasons.map((r) => t(`reviewQueue.reason.${r}`)).join(", ")}
                    </p>
                  </div>
                  <Link
                    href={`/doctor/cases/${q.assessment_id}`}
                    className="text-sm font-semibold text-[#0E7490] underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-[#0E7490]"
                  >
                    {t("doctor.patients.openCase")}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="flex flex-wrap gap-3">
          <ButtonLink href="/doctor/patients">
            {t("doctor.dashboard.openQueue")}
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </ButtonLink>
          <ButtonLink href="/doctor/appointments" variant="outline">
            {t("doctor.dashboard.openAppointments")}
          </ButtonLink>
        </div>
      </div>
    </AppShell>
  );
}
