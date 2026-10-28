"use client";

// P5: overview from real data only — latest assessment (bands per condition, no
// probabilities, D-10), band trend, and appointments. Empty states when nothing exists.

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Activity, Calendar, ChevronRight, Clock, FileText, ShieldCheck, Stethoscope, User } from "lucide-react";
import { AppShell } from "../../components/layout/AppShell";
import { Card, CardHeader } from "../../components/ui/Card";
import { DemoBadge, StatusBadge } from "../../components/ui/StatusBadge";
import { Button } from "../../components/ui/Button";
import { AssessmentRow } from "../../components/assessment/AssessmentRow";
import { BandTrendChart } from "../../components/assessment/BandTrendChart";
import { useAuth } from "../../lib/auth-context";
import { useTranslation } from "../../lib/i18n";
import { api, apiFailure, type ApiFailure } from "../../lib/api-client";
import type { AssessmentRecord } from "../../lib/assessment";

interface Appointment {
  id: string;
  status: string;
  doctor_name?: string;
  consultation_type?: string;
  appointment_time?: string;
  location?: string;
}

interface DashboardData {
  assessments: AssessmentRecord[];
  historyFailure: ApiFailure | null;
  appointments: Appointment[];
}

async function fetchDashboard(): Promise<DashboardData> {
  const [history, appointments] = await Promise.allSettled([api.getAssessmentHistory(), api.getAppointments()]);
  return {
    assessments: history.status === "fulfilled" ? history.value?.assessments ?? [] : [],
    historyFailure: history.status === "rejected" ? apiFailure(history.reason) : null,
    appointments: appointments.status === "fulfilled" && Array.isArray(appointments.value) ? appointments.value : [],
  };
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const userId = user?.id ?? null;
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    let active = true;
    fetchDashboard().then((d) => active && setData(d));
    return () => {
      active = false;
    };
  }, [userId]);

  const latest = data?.assessments[0];
  const nextAppointment =
    data?.appointments.find((a) => a.status === "confirmed" || a.status === "scheduled") ?? data?.appointments[0];

  const quick = [
    { href: "/risk-assessment", icon: Activity, key: "start" },
    { href: "/history", icon: Clock, key: "history" },
    { href: "/health-profile", icon: User, key: "profile" },
    { href: "/care-connect", icon: Stethoscope, key: "care" },
  ];

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="flex flex-col justify-between gap-4 border-b border-[#D8E2EA] pb-6 sm:flex-row sm:items-center">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-extrabold text-[#0B1F33] sm:text-3xl">
                {t("home.welcome")}
                {user?.fullName ? `, ${user.fullName}` : ""}
              </h1>
              {user?.isDemo && <DemoBadge label={t("home.demoAccount")} />}
            </div>
            <p className="text-xs text-[#475569] sm:text-sm">{t("home.subtitle")}</p>
          </div>
          <Link href="/risk-assessment">
            <Button size="md" variant="primary" rightIcon={<Activity className="h-4 w-4" />}>
              {t("dashboard.btnStartAssessment")}
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-8">
            <Card className="space-y-4">
              <CardHeader
                title={t("home.latestTitle")}
                subtitle={t("assess.notDiagnosis")}
                action={
                  latest ? (
                    <Link href="/history">
                      <Button variant="outline" size="sm" rightIcon={<ChevronRight className="h-3.5 w-3.5" />}>
                        {t("home.viewHistory")}
                      </Button>
                    </Link>
                  ) : undefined
                }
              />
              {data === null ? (
                <p className="text-sm text-[#475569]" aria-live="polite">
                  {t("common.loading")}
                </p>
              ) : data.historyFailure ? (
                <p className="rounded-2xl border border-[#D8E2EA] bg-[#F8FAFC] p-4 text-sm text-[#334155]">
                  {t(`assess.errors.${data.historyFailure}`)}
                </p>
              ) : latest ? (
                <ul>
                  <AssessmentRow record={latest} />
                </ul>
              ) : (
                <div className="space-y-3 rounded-2xl border border-[#D8E2EA] bg-[#F8FAFC] p-8 text-center">
                  <Activity className="mx-auto h-10 w-10 text-[#64748B]" aria-hidden="true" />
                  <h3 className="text-base font-bold text-[#0B1F33]">{t("historyPage.emptyTitle")}</h3>
                  <p className="mx-auto max-w-md text-xs text-[#475569]">{t("historyPage.emptyBody")}</p>
                </div>
              )}
            </Card>

            {data && data.assessments.length > 1 && (
              <Card className="space-y-4">
                <CardHeader title={t("historyPage.trendTitle")} subtitle={t("historyPage.trendIntro")} />
                <BandTrendChart records={data.assessments} />
              </Card>
            )}

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {quick.map(({ href, icon: Icon, key }) => (
                <Link key={key} href={href} className="block rounded-2xl focus-visible:outline-2 focus-visible:outline-[#0E7490]">
                  <Card className="h-full space-y-2 p-4 hover:border-[#0E7490]">
                    <div className="w-fit rounded-xl bg-[#0E7490]/10 p-2 text-[#0E7490]">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <h2 className="text-xs font-bold text-[#0B1F33]">{t(`home.quick.${key}`)}</h2>
                  </Card>
                </Link>
              ))}
            </div>
          </div>

          <div className="space-y-6 lg:col-span-4">
            {nextAppointment ? (
              <Card className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-[#0E7490]" aria-hidden="true" />
                    <h2 className="text-sm font-bold text-[#0B1F33]">{t("home.upcoming")}</h2>
                  </div>
                  <StatusBadge label={nextAppointment.status} variant="info" size="sm" />
                </div>
                <div className="space-y-1 rounded-xl border border-[#D8E2EA] bg-[#F8FAFC] p-4 text-xs">
                  {nextAppointment.doctor_name && <p className="text-sm font-bold text-[#0B1F33]">{nextAppointment.doctor_name}</p>}
                  <p className="text-[#475569]">
                    {[nextAppointment.consultation_type, nextAppointment.appointment_time].filter(Boolean).join(" • ")}
                  </p>
                  {nextAppointment.location && <p className="font-semibold text-[#0F766E]">{nextAppointment.location}</p>}
                </div>
                <Link href="/appointments" className="block">
                  <Button variant="primary" size="md" className="w-full">
                    {t("nav.appointments")}
                  </Button>
                </Link>
              </Card>
            ) : (
              <Card className="space-y-4 bg-linear-to-br from-[#0B1F33] to-[#132E4A] text-white">
                <div className="flex items-center gap-2">
                  <Stethoscope className="h-5 w-5 text-[#22C1DC]" aria-hidden="true" />
                  <h2 className="text-sm font-bold">{t("nav.careConnect")}</h2>
                </div>
                <p className="text-xs leading-relaxed text-[#E2E8F0]">{t("home.careBody")}</p>
                <Link href="/care-connect" className="block">
                  <Button variant="teal" size="sm" className="w-full">
                    {t("home.careButton")}
                  </Button>
                </Link>
              </Card>
            )}

            <Card className="space-y-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-[#0F766E]" aria-hidden="true" />
                <h2 className="text-sm font-bold text-[#0B1F33]">{t("nav.aiTrust")}</h2>
              </div>
              <p className="text-xs leading-relaxed text-[#475569]">{t("home.trustBody")}</p>
              <Link href="/ai-trust" className="block">
                <Button variant="outline" size="sm" className="w-full" leftIcon={<FileText className="h-3.5 w-3.5" />}>
                  {t("results.sure.trustLink")}
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
