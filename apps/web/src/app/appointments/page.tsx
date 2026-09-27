"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Calendar, Video, Clock, MapPin, User, CheckCircle2 } from "lucide-react";
import { AppShell } from "../../components/layout/AppShell";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { StatusBadge, DemoBadge } from "../../components/ui/StatusBadge";
import { api } from "../../lib/api-client";

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([
    {
      id: "apt-001",
      doctor_name: "Dr. Anand Joshi",
      doctor_specialization: "Cardiology & Preventive Heart Health",
      appointment_time: new Date(Date.now() + 86400000 * 2).toISOString(),
      status: "scheduled",
      consultation_type: "video",
      patient_reason: "Preventive cardiometabolic screening review following VITALNEX risk assessment.",
      meeting_link: "https://meet.vitalnex.health/room-demo-8492",
    },
  ]);

  useEffect(() => {
    async function loadApts() {
      try {
        const data = await api.getAppointments();
        if (data && data.length > 0) setAppointments(data);
      } catch {
        // Fallback
      }
    }
    loadApts();
  }, []);

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D8E2EA] pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F33]">
                Care Consultations & Appointments
              </h1>
              <DemoBadge label="Connected Care" />
            </div>
            <p className="text-xs sm:text-sm text-[#475569]">
              Manage upcoming teleconsultations and clinic visits with your healthcare specialists.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/care-connect">
              <Button size="sm" variant="primary">
                Book New Consultation
              </Button>
            </Link>
          </div>
        </div>

        <div className="space-y-4">
          {appointments.map((apt) => (
            <Card key={apt.id} className="p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F1F5F9] pb-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#0B1F33] text-[#22C1DC] flex items-center justify-center font-bold text-sm shrink-0">
                    <Video className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-[#0B1F33]">{apt.doctor_name}</h3>
                    <p className="text-xs text-[#0E7490] font-semibold">{apt.doctor_specialization}</p>
                  </div>
                </div>
                <StatusBadge label="Confirmed" variant="success" size="sm" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-[#475569]">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#0E7490]" />
                  <span>{new Date(apt.appointment_time).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4 text-[#0E7490]" />
                  <span>Secure Video Consultation (LiveKit Ready)</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#0E7490]" />
                  <span>Kothrud Hub, Pune</span>
                </div>
              </div>

              <p className="text-xs text-[#64748B] pt-1">
                <strong>Reason:</strong> {apt.patient_reason}
              </p>

              <div className="pt-3 border-t border-[#F1F5F9] flex justify-end gap-3">
                <Button size="sm" variant="outline">
                  Reschedule
                </Button>
                <Button size="sm" variant="teal" leftIcon={<Video className="w-3.5 h-3.5" />}>
                  Join Consultation Room
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
