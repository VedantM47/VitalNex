"use client";

// Care Connect (SPEC §1.2 F9): synthetic demo doctors and slots from Supabase via the API.
// Filter by specialty, book a free slot, see and cancel upcoming bookings. The results page links
// here with ?specialty=<code> when the next step is "see a doctor soon".
// Nothing here is a real doctor or a real appointment, and the page says so.

import React, { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Calendar, Clock, Languages, MapPin } from "lucide-react";
import { AppShell } from "../../components/layout/AppShell";
import { Card, CardHeader } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Select } from "../../components/ui/Select";
import { Alert } from "../../components/ui/Alert";
import { DemoBadge } from "../../components/ui/StatusBadge";
import { AppointmentCard, isUpcoming, type Appointment } from "../../components/care/AppointmentCard";
import { ApiError, api } from "../../lib/api-client";
import { useTranslation } from "../../lib/i18n";
import { fmt } from "../../lib/assessment";
import { dateTime } from "../../lib/format";
import { SPECIALTIES } from "../../lib/care";

interface Slot {
  id: string;
  starts_at: string;
  ends_at: string;
}

interface Doctor {
  id: string;
  full_name: string;
  specialization: string;
  specialization_code: string;
  years_of_experience: number;
  languages_spoken: string[];
  is_demo: boolean;
  locations: { facility_name: string; locality: string; city: string }[];
  next_slots: Slot[];
}

type Notice = { kind: "success" | "error"; text: string } | null;

function CareConnect() {
  const { t, language } = useTranslation();
  const params = useSearchParams();
  const fromUrl = params.get("specialty");
  const preselected = SPECIALTIES.find((s) => s === fromUrl) ?? null;

  const [specialty, setSpecialty] = useState<string>(preselected ?? "all");
  const [doctors, setDoctors] = useState<Doctor[] | null | "error">(null);
  const [appointments, setAppointments] = useState<Appointment[] | "error">([]);
  const [chosen, setChosen] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice>(null);

  const specialtyLabel = (code: string, fallback = code) => {
    const key = `care.specialty.${code}`;
    return t(key) === key ? fallback : t(key);
  };

  const loadDoctors = useCallback(async (code: string) => {
    try {
      return (await api.getDoctors(code === "all" ? undefined : { specialization: code })) as Doctor[];
    } catch {
      return "error" as const;
    }
  }, []);

  const loadAppointments = useCallback(async () => {
    try {
      return (await api.getAppointments()) as Appointment[];
    } catch {
      return "error" as const;
    }
  }, []);

  useEffect(() => {
    let active = true;
    loadDoctors(specialty).then((d) => active && setDoctors(d));
    return () => {
      active = false;
    };
  }, [specialty, loadDoctors]);

  useEffect(() => {
    let active = true;
    loadAppointments().then((a) => active && setAppointments(a));
    return () => {
      active = false;
    };
  }, [loadAppointments]);

  const refresh = async () => {
    const [d, a] = await Promise.all([loadDoctors(specialty), loadAppointments()]);
    setDoctors(d);
    setAppointments(a);
  };

  const book = async (doc: Doctor) => {
    const slotId = chosen[doc.id];
    const slot = doc.next_slots.find((s) => s.id === slotId);
    if (!slot) return;
    setBusy(doc.id);
    setNotice(null);
    try {
      const apt = await api.createAppointment({ slot_id: slot.id, consultation_type: "in_person" });
      setNotice({
        kind: "success",
        text: fmt(t("care.booked"), { doctor: doc.full_name, time: dateTime(apt.appointment_time, language) ?? "" }),
      });
      setChosen((c) => ({ ...c, [doc.id]: "" }));
    } catch (err) {
      const taken = err instanceof ApiError && err.status === 409;
      setNotice({ kind: "error", text: t(taken ? "care.slotTaken" : "care.bookingFailed") });
    } finally {
      setBusy(null);
      await refresh();
    }
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
      await refresh();
    }
  };

  const upcoming = appointments === "error" ? [] : appointments.filter((a) => isUpcoming(a));

  return (
    <div className="space-y-6">
      <div className="space-y-2 border-b border-[#D8E2EA] pb-6">
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-2xl font-extrabold text-[#0B1F33] sm:text-3xl">{t("care.title")}</h1>
          <DemoBadge label={t("care.demoDoctor")} />
        </div>
        <p className="text-xs text-[#475569] sm:text-sm">{t("care.subtitle")}</p>
      </div>

      <Alert kind="warning">{t("care.demoNotice")}</Alert>
      <p className="text-xs font-semibold text-[#991B1B]">{t("care.emergency")}</p>

      {notice && <Alert kind={notice.kind}>{notice.text}</Alert>}

      <Card className="space-y-3">
        <CardHeader
          title={t("care.upcomingTitle")}
          action={
            <Link href="/appointments" className="text-xs font-semibold text-[#0E7490] hover:underline">
              {t("care.viewAll")}
            </Link>
          }
        />
        {appointments === "error" ? (
          <Alert kind="error">{t("appt.loadFailed")}</Alert>
        ) : upcoming.length === 0 ? (
          <p className="text-sm text-[#475569]">{t("care.upcomingEmpty")}</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {upcoming.map((a) => (
              <AppointmentCard key={a.id} appointment={a} onCancel={cancel} busy={busy === a.id} compact />
            ))}
          </div>
        )}
      </Card>

      <div className="max-w-sm space-y-2">
        <Select
          label={t("care.filterSpecialty")}
          value={specialty}
          onChange={(e) => setSpecialty(e.target.value)}
          options={[
            { value: "all", label: t("care.allSpecialties") },
            ...SPECIALTIES.map((s) => ({ value: s, label: specialtyLabel(s) })),
          ]}
        />
        {preselected && specialty === preselected && (
          <p className="text-xs text-[#0E7490]">{fmt(t("care.suggested"), { specialty: specialtyLabel(preselected) })}</p>
        )}
      </div>

      {doctors === "error" ? (
        <Alert kind="error">{t("care.loadFailed")}</Alert>
      ) : doctors === null ? (
        <p className="text-sm text-[#475569]">{t("common.loading")}</p>
      ) : doctors.length === 0 ? (
        <p className="text-sm text-[#475569]">{t("care.empty")}</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {doctors.map((doc) => {
            const loc = doc.locations[0];
            return (
              <Card key={doc.id} className="flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-bold text-[#0B1F33]">{doc.full_name}</h2>
                    {doc.is_demo && <DemoBadge label={t("care.demoDoctor")} />}
                  </div>
                  <p className="text-sm font-semibold text-[#0E7490]">
                    {specialtyLabel(doc.specialization_code, doc.specialization)}
                  </p>
                  <ul className="space-y-1 text-sm text-[#475569]">
                    <li className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-[#0E7490]" aria-hidden="true" />
                      {fmt(t("care.experience"), { n: doc.years_of_experience })}
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Languages className="h-4 w-4 text-[#0E7490]" aria-hidden="true" />
                      {fmt(t("care.languages"), { list: doc.languages_spoken.join(", ") })}
                    </li>
                    {loc && (
                      <li className="flex items-center gap-1.5">
                        <MapPin className="h-4 w-4 text-[#0E7490]" aria-hidden="true" />
                        {loc.facility_name}, {loc.locality}
                      </li>
                    )}
                  </ul>
                </div>
                <div className="space-y-2 border-t border-[#F1F5F9] pt-3">
                  {doc.next_slots.length === 0 ? (
                    <p className="text-sm text-[#475569]">{t("care.noSlots")}</p>
                  ) : (
                    <>
                      <Select
                        label={t("care.freeSlots")}
                        value={chosen[doc.id] ?? ""}
                        onChange={(e) => setChosen((c) => ({ ...c, [doc.id]: e.target.value }))}
                        options={[
                          { value: "", label: "—" },
                          ...doc.next_slots.map((s) => ({ value: s.id, label: dateTime(s.starts_at, language) ?? s.starts_at })),
                        ]}
                      />
                      <Button
                        size="sm"
                        variant="primary"
                        disabled={!chosen[doc.id]}
                        isLoading={busy === doc.id}
                        onClick={() => book(doc)}
                        leftIcon={<Calendar className="h-3.5 w-3.5" />}
                      >
                        {t("care.book")}
                      </Button>
                    </>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function CareConnectPage() {
  return (
    <AppShell>
      <Suspense fallback={null}>
        <CareConnect />
      </Suspense>
    </AppShell>
  );
}
