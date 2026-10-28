"use client";

// P6: real bookings from Supabase via GET /api/v1/appointments (a doctor sees bookings with them).
// Video consultations are frozen for the MVP, so no video link is offered.

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, RefreshCw } from "lucide-react";
import { AppShell } from "../../../components/layout/AppShell";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { Alert } from "../../../components/ui/Alert";
import { EmptyState } from "../../../components/ui/EmptyState";
import { StatusBadge, type StatusVariant } from "../../../components/ui/StatusBadge";
import { api, apiFailure } from "../../../lib/api-client";
import { useTranslation } from "../../../lib/i18n";
import { dateTime } from "../../../lib/format";

interface Appointment {
  id: string;
  patient_name: string | null;
  appointment_time: string;
  status: string;
  consultation_type: string;
  patient_reason: string | null;
  reason: string | null;
  assessment_id: string | null;
}

const VARIANT: Record<string, StatusVariant> = {
  scheduled: "info",
  confirmed: "success",
  in_progress: "info",
  completed: "neutral",
  cancelled: "danger",
};

export default function DoctorAppointmentsPage() {
  const { t, language } = useTranslation();
  const [items, setItems] = useState<Appointment[] | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const sorted = (a: Appointment[]) => [...a].sort((x, y) => x.appointment_time.localeCompare(y.appointment_time));

  useEffect(() => {
    let active = true;
    api
      .getAppointments()
      .then((a: Appointment[]) => active && setItems(sorted(a)))
      .catch((e) => active && setFailure(apiFailure(e)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setItems(sorted(await api.getAppointments()));
      setFailure(null);
    } catch (e) {
      setFailure(apiFailure(e));
    } finally {
      setLoading(false);
    }
  }, []);

  const update = async (id: string, status: "confirmed" | "completed" | "cancelled") => {
    setBusy(id);
    setMessage(null);
    try {
      await api.updateAppointment(id, { status });
      setMessage({ ok: true, text: t("doctor.appointments.updated") });
      await refresh();
    } catch {
      setMessage({ ok: false, text: t("doctor.appointments.updateFailed") });
    } finally {
      setBusy(null);
    }
  };

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="flex flex-col justify-between gap-4 border-b border-[#D8E2EA] pb-6 sm:flex-row sm:items-center">
          <div className="space-y-1">
            <h1 className="text-2xl font-extrabold text-[#0B1F33] sm:text-3xl">{t("doctor.appointments.title")}</h1>
            <p className="text-xs text-[#475569] sm:text-sm">{t("doctor.appointments.subtitle")}</p>
          </div>
          <Button variant="outline" size="sm" onClick={refresh} isLoading={loading} leftIcon={<RefreshCw className="h-3.5 w-3.5" />}>
            {t("common.refresh")}
          </Button>
        </div>

        {message && <Alert kind={message.ok ? "success" : "error"}>{message.text}</Alert>}
        {failure && (
          <Alert kind="error">{failure === "signin" ? t("common.signInNeeded") : t("doctor.appointments.loadFailed")}</Alert>
        )}

        {items === null ? (
          !failure && <p className="text-sm text-[#475569]">{t("common.loading")}</p>
        ) : items.length === 0 ? (
          <EmptyState
            icon={<Calendar className="h-8 w-8" aria-hidden="true" />}
            title={t("doctor.appointments.emptyTitle")}
            description={t("doctor.appointments.emptyBody")}
          />
        ) : (
          <ul className="space-y-4">
            {items.map((a) => {
              const open = a.status === "scheduled" || a.status === "confirmed";
              return (
                <li key={a.id}>
                  <Card className="space-y-3">
                    <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                      <div>
                        <h2 className="text-base font-bold text-[#0B1F33]">{a.patient_name ?? "—"}</h2>
                        <p className="text-sm text-[#334155]">
                          {dateTime(a.appointment_time, language)} ·{" "}
                          {t(`doctor.appointments.modes.${a.consultation_type}`, a.consultation_type)}
                        </p>
                      </div>
                      <StatusBadge
                        label={t(`doctor.appointments.status.${a.status}`, a.status)}
                        variant={VARIANT[a.status] ?? "neutral"}
                        size="sm"
                      />
                    </div>
                    {(a.patient_reason || a.reason) && (
                      <p className="text-sm text-[#334155]">
                        <span className="font-semibold">{t("doctor.appointments.reason")}:</span> {a.patient_reason || a.reason}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 border-t border-[#F1F5F9] pt-3">
                      {a.assessment_id && (
                        <Link
                          href={`/doctor/cases/${a.assessment_id}`}
                          className="mr-auto text-sm font-semibold text-[#0E7490] hover:underline focus-visible:outline-2 focus-visible:outline-[#0E7490]"
                        >
                          {t("doctor.appointments.linkedScreening")}: {t("doctor.appointments.openCase")}
                        </Link>
                      )}
                      {a.status === "scheduled" && (
                        <Button size="sm" variant="teal" isLoading={busy === a.id} onClick={() => update(a.id, "confirmed")}>
                          {t("doctor.appointments.confirm")}
                        </Button>
                      )}
                      {open && (
                        <>
                          <Button size="sm" variant="outline" disabled={busy === a.id} onClick={() => update(a.id, "completed")}>
                            {t("doctor.appointments.complete")}
                          </Button>
                          <Button size="sm" variant="ghost" disabled={busy === a.id} onClick={() => update(a.id, "cancelled")}>
                            {t("doctor.appointments.cancel")}
                          </Button>
                        </>
                      )}
                    </div>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
