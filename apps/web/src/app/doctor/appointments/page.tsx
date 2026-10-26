"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  Video,
  User,
  CheckCircle2,
  RefreshCw,
  MapPin,
  FileText,
} from "lucide-react";
import { AppShell } from "../../../components/layout/AppShell";
import { Card, CardHeader } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { StatusBadge, DemoBadge } from "../../../components/ui/StatusBadge";
import { api } from "../../../lib/api-client";
import { useTranslation } from "../../../lib/i18n";

export default function DoctorAppointmentsPage() {
  const { t } = useTranslation();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const data = await api.getAppointments("doc-pune-001", "doctor");
      if (Array.isArray(data)) {
        setAppointments(data);
      }
    } catch (e) {
      console.warn("Could not fetch doctor appointments:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    api.getAppointments("doc-pune-001", "doctor")
      .then((data) => {
        if (active && Array.isArray(data)) {
          setAppointments(data);
        }
      })
      .catch((e) => {
        console.warn("Could not fetch doctor appointments:", e);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleMarkCompleted = async (id: string) => {
    try {
      await api.updateAppointment(id, { status: "completed" });
      setActionSuccess("Consultation marked completed.");
      await fetchAppointments();
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D8E2EA] pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F33]">
                Clinician Consultation Schedule
              </h1>
              <DemoBadge label="Dr. Anand Joshi, MD (Cardiology)" />
            </div>
            <p className="text-xs sm:text-sm text-[#475569]">
              View your scheduled teleconsultations, access patient screening histories, and mark appointments completed.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={fetchAppointments} isLoading={loading}>
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Refresh Schedule
            </Button>
            <Link href="/doctor/patients">
              <Button size="sm" variant="primary">
                Review Queue
              </Button>
            </Link>
          </div>
        </div>

        {actionSuccess && (
          <div className="p-4 bg-[#0F766E]/10 border border-[#0F766E]/30 rounded-2xl flex items-center gap-2 text-xs font-semibold text-[#0F766E]">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            {actionSuccess}
          </div>
        )}

        <div className="space-y-4">
          {loading ? (
            <div className="p-12 text-center text-xs text-[#64748B]">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#0E7490]" />
              Loading clinician schedule...
            </div>
          ) : appointments.length === 0 ? (
            <Card className="p-12 text-center space-y-3">
              <Calendar className="w-10 h-10 text-[#94A3B8] mx-auto" />
              <h3 className="font-bold text-sm text-[#0B1F33]">No Consultations Scheduled</h3>
              <p className="text-xs text-[#64748B]">You currently have no patient appointments booked.</p>
            </Card>
          ) : (
            appointments.map((apt) => {
              const aptDate = new Date(apt.appointment_time);
              const formattedDate = aptDate.toLocaleDateString("en-IN", {
                weekday: "short",
                year: "numeric",
                month: "short",
                day: "numeric",
              });
              const formattedTime = aptDate.toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <Card key={apt.id} className="p-6 space-y-4 border-[#D8E2EA]">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F1F5F9] pb-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#0B1F33] text-[#22C1DC] flex items-center justify-center font-bold text-sm shrink-0">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-base text-[#0B1F33]">Patient ID: {apt.patient_id}</h3>
                        </div>
                        <p className="text-xs text-[#0E7490]">Consultation: {apt.consultation_type === "video" ? "Secure Telehealth Video" : "In-Person Clinic"}</p>
                      </div>
                    </div>
                    <StatusBadge
                      label={apt.status.toUpperCase()}
                      variant={
                        apt.status === "completed"
                          ? "success"
                          : apt.status === "cancelled"
                          ? "danger"
                          : "info"
                      }
                      size="sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-[#475569]">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#0E7490]" />
                      <span className="font-semibold text-[#0B1F33]">{formattedDate} at {formattedTime}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#0E7490]" />
                      <span>Demo clinic</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#0E7490]" />
                      <span>Ref: {apt.id}</span>
                    </div>
                  </div>

                  {(apt.patient_reason || apt.reason) && (
                    <p className="text-xs text-[#64748B] pt-1">
                      <strong>Reason for Visit:</strong> {apt.patient_reason || apt.reason}
                    </p>
                  )}

                  <div className="pt-3 border-t border-[#F1F5F9] flex flex-wrap justify-between items-center gap-3">
                    <div className="flex items-center gap-2">
                      {apt.assessment_id && (
                        <a
                          href={api.getReportPdfUrl(apt.assessment_id)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-semibold text-[#0E7490] hover:underline flex items-center gap-1"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>View Patient PDF Report</span>
                        </a>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {apt.status !== "completed" && apt.status !== "cancelled" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleMarkCompleted(apt.id)}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-[#0F766E]" />
                            Mark Completed
                          </Button>
                          <Link href={`/consultation/${apt.id}`}>
                            <Button size="sm" variant="primary">
                              <Video className="w-3.5 h-3.5 mr-1.5" />
                              Launch Video Room
                            </Button>
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </AppShell>
  );
}
