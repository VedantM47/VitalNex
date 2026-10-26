"use client";

// P0: hardcoded queue items, scores and agreement rates were removed. Counts below come
// from the API only. Review queue + override log are rebuilt in P6.

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Calendar, ArrowRight } from "lucide-react";
import { AppShell } from "../../../components/layout/AppShell";
import { StatCard } from "../../../components/ui/StatCard";
import { EmptyState } from "../../../components/ui/EmptyState";
import { Button } from "../../../components/ui/Button";
import { DemoBadge } from "../../../components/ui/StatusBadge";
import { api } from "../../../lib/api-client";
import { useTranslation } from "../../../lib/i18n";

// TODO(P1): clinician id comes from the Supabase session, not a constant.
const DEMO_CLINICIAN_ID = "doc-pune-001";

export default function DoctorDashboardPage() {
  const { t } = useTranslation();
  const [pendingReviews, setPendingReviews] = useState<number | null>(null);
  const [upcomingAppointments, setUpcomingAppointments] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    api
      .getDoctorReviews(DEMO_CLINICIAN_ID)
      .then((reviews: any[]) => {
        if (active) setPendingReviews(reviews.filter((r) => r.review_status !== "reviewed").length);
      })
      .catch(() => active && setPendingReviews(null));
    api
      .getAppointments(DEMO_CLINICIAN_ID, "doctor")
      .then((apts: any[]) => {
        if (active) setUpcomingAppointments(apts.filter((a) => a.status !== "cancelled" && a.status !== "completed").length);
      })
      .catch(() => active && setUpcomingAppointments(null));
    return () => {
      active = false;
    };
  }, []);

  const show = (n: number | null) => (n === null ? "—" : String(n));

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D8E2EA] pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F33]">Clinician Dashboard</h1>
              <DemoBadge label="Demo Clinician Portal" />
            </div>
            <p className="text-xs sm:text-sm text-[#475569]">
              Review queue for high-risk and uncertain screening results, and your appointments.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <StatCard
            label="Pending reviews"
            value={show(pendingReviews)}
            subtext="Cases waiting for a clinician"
            icon={<AlertTriangle className="w-5 h-5 text-[#B45309]" />}
          />
          <StatCard
            label="Upcoming appointments"
            value={show(upcomingAppointments)}
            subtext="Scheduled or confirmed"
            icon={<Calendar className="w-5 h-5 text-[#0E7490]" />}
          />
        </div>

        {pendingReviews === 0 && upcomingAppointments === 0 ? (
          <EmptyState title={t("status.noDataTitle")} description={t("status.noDataBody")} />
        ) : (
          <div className="flex flex-wrap gap-3">
            <Link href="/doctor/patients">
              <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                Patient reviews
              </Button>
            </Link>
            <Link href="/doctor/appointments">
              <Button variant="outline" size="sm">
                Appointments
              </Button>
            </Link>
          </div>
        )}
      </div>
    </AppShell>
  );
}
