"use client";

// One demo appointment (care-connect "upcoming" list and the appointments page).
// Patients can only cancel; everything shown comes from the appointments row.

import React from "react";
import { Clock, MapPin, Stethoscope } from "lucide-react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { StatusBadge, type StatusVariant } from "../ui/StatusBadge";
import { useTranslation } from "../../lib/i18n";
import { fmt } from "../../lib/assessment";
import { dateTime } from "../../lib/format";

export interface Appointment {
  id: string;
  doctor_name: string;
  specialization: string;
  specialization_code?: string | null;
  appointment_time: string;
  status: "scheduled" | "confirmed" | "in_progress" | "completed" | "cancelled";
  consultation_type: string;
  patient_reason?: string | null;
  doctor_notes?: string | null;
}

const STATUS_VARIANT: Record<Appointment["status"], StatusVariant> = {
  scheduled: "success",
  confirmed: "success",
  in_progress: "info",
  completed: "neutral",
  cancelled: "danger",
};

export function isUpcoming(a: Appointment, now = Date.now()): boolean {
  return a.status !== "cancelled" && a.status !== "completed" && new Date(a.appointment_time).getTime() >= now;
}

export function AppointmentCard({
  appointment: a,
  onCancel,
  busy = false,
  compact = false,
}: {
  appointment: Appointment;
  onCancel?: (id: string) => void;
  busy?: boolean;
  compact?: boolean;
}) {
  const { t, language } = useTranslation();
  const canCancel = !!onCancel && a.status !== "cancelled" && a.status !== "completed";
  const typeKey = `appt.type.${a.consultation_type}`;
  const typeLabel = t(typeKey) === typeKey ? a.consultation_type : t(typeKey);
  const specKey = `care.specialty.${a.specialization_code}`;
  const specialty = a.specialization_code && t(specKey) !== specKey ? t(specKey) : a.specialization;

  return (
    <Card className={compact ? "space-y-2 p-4" : "space-y-3"}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0B1F33] text-[#22C1DC]">
            <Stethoscope className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <p className="font-bold text-[#0B1F33]">{a.doctor_name}</p>
            <p className="text-xs font-semibold text-[#0E7490]">{specialty}</p>
          </div>
        </div>
        <StatusBadge label={t(`appt.status.${a.status}`)} variant={STATUS_VARIANT[a.status] ?? "neutral"} size="sm" />
      </div>
      <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-[#334155]">
        <span className="inline-flex items-center gap-1.5 font-semibold text-[#0B1F33]">
          <Clock className="h-4 w-4 text-[#0E7490]" aria-hidden="true" />
          {dateTime(a.appointment_time, language)}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <MapPin className="h-4 w-4 text-[#0E7490]" aria-hidden="true" />
          {typeLabel} · {t("appt.demoClinic")}
        </span>
      </div>
      {!compact && a.patient_reason && (
        <p className="text-sm text-[#475569]">
          <strong>{t("appt.reason")}:</strong> {a.patient_reason}
        </p>
      )}
      {!compact && a.doctor_notes && (
        <p className="rounded-xl border border-[#0F766E]/20 bg-[#F0FDF4] p-3 text-sm text-[#065F46]">
          <strong>{t("appt.doctorNotes")}:</strong> {a.doctor_notes}
        </p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#F1F5F9] pt-2">
        <span className="text-xs text-[#64748B]">{fmt(t("appt.reference"), { id: a.id.slice(0, 8) })}</span>
        {canCancel && (
          <Button
            size="sm"
            variant="ghost"
            className="text-[#B42318] hover:bg-[#B42318]/10"
            isLoading={busy}
            onClick={() => onCancel!(a.id)}
          >
            {t("appt.cancel")}
          </Button>
        )}
      </div>
    </Card>
  );
}
