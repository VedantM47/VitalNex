"use client";

// The patient's demo appointments (SPEC §1.2 F9): upcoming / past / cancelled, with cancel.
// Rows come from Supabase via the API (RLS: own bookings only).

import React, { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { AppShell } from "../../components/layout/AppShell";
import { Button, ButtonLink } from "../../components/ui/Button";
import { Alert } from "../../components/ui/Alert";
import { DemoBadge } from "../../components/ui/StatusBadge";
import { AppointmentCard, isUpcoming, type Appointment } from "../../components/care/AppointmentCard";
import { api } from "../../lib/api-client";
import { useTranslation } from "../../lib/i18n";

type Tab = "upcoming" | "past" | "cancelled";
const TABS: Tab[] = ["upcoming", "past", "cancelled"];

export default function AppointmentsPage() {
  const { t } = useTranslation();
  const [appointments, setAppointments] = useState<Appointment[] | null | "error">(null);
  const [tab, setTab] = useState<Tab>("upcoming");
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  const load = useCallback(async () => {
    try {
      return (await api.getAppointments()) as Appointment[];
    } catch {
      return "error" as const;
    }
  }, []);

  useEffect(() => {
    let active = true;
    load().then((a) => active && setAppointments(a));
    return () => {
      active = false;
    };
  }, [load]);

  const refresh = async () => {
    setAppointments(null);
    setAppointments(await load());
  };

  const cancel = async (id: string) => {
    if (!window.confirm(t("appt.confirmCancel"))) return;
    setBusy(id);
    setNotice(null);
    try {
      await api.updateAppointment(id, { status: "cancelled" });
      setNotice({ kind: "success", text: t("appt.cancelled") });
    } catch {
      setNotice({ kind: "error", text: t("appt.cancelFailed") });
    } finally {
      setBusy(null);
      setAppointments(await load());
    }
  };

  const now = Date.now();
  const shown = Array.isArray(appointments)
    ? appointments.filter((a) =>
        tab === "cancelled"
          ? a.status === "cancelled"
          : tab === "upcoming"
            ? isUpcoming(a, now)
            : a.status !== "cancelled" && !isUpcoming(a, now),
      )
    : [];

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 border-b border-[#D8E2EA] pb-6 sm:flex-row sm:items-center">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-extrabold text-[#0B1F33] sm:text-3xl">{t("nav.appointments")}</h1>
              <DemoBadge label={t("appt.demo")} />
            </div>
            <p className="text-xs text-[#475569] sm:text-sm">{t("appt.subtitle")}</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={refresh} leftIcon={<RefreshCw className="h-3.5 w-3.5" />}>
              {t("common.refresh")}
            </Button>
            <ButtonLink href="/care-connect">{t("appt.bookNew")}</ButtonLink>
          </div>
        </div>

        {notice && <Alert kind={notice.kind}>{notice.text}</Alert>}

        <div role="tablist" className="flex w-fit items-center gap-2 rounded-2xl bg-[#F1F5F9] p-1.5 text-xs font-semibold">
          {TABS.map((k) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={tab === k}
              onClick={() => setTab(k)}
              className={`rounded-xl px-4 py-2 transition-all ${
                tab === k ? "bg-white text-[#0B1F33] shadow-xs" : "text-[#64748B] hover:text-[#0B1F33]"
              }`}
            >
              {t(`appt.tabs.${k}`)}
            </button>
          ))}
        </div>

        {appointments === "error" ? (
          <Alert kind="error">{t("appt.loadFailed")}</Alert>
        ) : appointments === null ? (
          <p className="text-sm text-[#475569]">{t("common.loading")}</p>
        ) : shown.length === 0 ? (
          <p className="text-sm text-[#475569]">{t(`appt.empty.${tab}`)}</p>
        ) : (
          <div className="space-y-4">
            {shown.map((a) => (
              <AppointmentCard key={a.id} appointment={a} onCancel={cancel} busy={busy === a.id} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
