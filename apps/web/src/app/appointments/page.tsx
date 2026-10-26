"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Calendar,
  Video,
  Clock,
  MapPin,
  User,
  CheckCircle2,
  AlertCircle,
  X,
  RotateCcw,
  Sparkles,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { AppShell } from "../../components/layout/AppShell";
import { Card, CardHeader } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { StatusBadge, DemoBadge } from "../../components/ui/StatusBadge";
import { api } from "../../lib/api-client";
import { useTranslation } from "../../lib/i18n";

export default function AppointmentsPage() {
  const { t } = useTranslation();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"upcoming" | "past" | "cancelled">("upcoming");

  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const data = await api.getAppointments();
      if (Array.isArray(data)) {
        setAppointments(data);
      }
    } catch (err) {
      console.warn("Could not load appointments from backend:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    api.getAppointments()
      .then((data) => {
        if (active && Array.isArray(data)) {
          setAppointments(data);
        }
      })
      .catch((err) => {
        console.warn("Could not load appointments from backend:", err);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleCancel = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this appointment?")) return;
    try {
      await api.updateAppointment(id, { status: "cancelled" });
      setActionSuccess("Appointment cancelled successfully.");
      await fetchAppointments();
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (e) {
      console.error("Failed to cancel appointment:", e);
    }
  };

  const now = new Date();
  const filteredAppointments = appointments.filter((apt) => {
    const aptDate = new Date(apt.appointment_time);
    if (tab === "cancelled") {
      return apt.status === "cancelled";
    }
    if (tab === "past") {
      return apt.status === "completed" || (apt.status !== "cancelled" && aptDate < now);
    }
    // upcoming
    return apt.status !== "cancelled" && apt.status !== "completed" && aptDate >= now;
  });

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D8E2EA] pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F33]">
                {t("nav.appointments") || "Care Consultations & Appointments"}
              </h1>
              <DemoBadge label="Demo appointments" />
            </div>
            <p className="text-xs sm:text-sm text-[#475569]">
              Manage your demo appointments with demo clinicians.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={fetchAppointments} isLoading={loading}>
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Refresh
            </Button>
            <Link href="/care-connect">
              <Button size="sm" variant="primary">
                Book New Consultation
              </Button>
            </Link>
          </div>
        </div>

        {/* Action notification */}
        {actionSuccess && (
          <div className="p-4 bg-[#0F766E]/10 border border-[#0F766E]/30 rounded-2xl flex items-center gap-2 text-xs font-semibold text-[#0F766E]">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            {actionSuccess}
          </div>
        )}

        {/* Status Tabs */}
        <div className="flex items-center gap-2 p-1.5 bg-[#F1F5F9] rounded-2xl w-fit text-xs font-semibold">
          <button
            type="button"
            onClick={() => setTab("upcoming")}
            className={`px-4 py-2 rounded-xl transition-all ${
              tab === "upcoming" ? "bg-white text-[#0B1F33] shadow-xs" : "text-[#64748B] hover:text-[#0B1F33]"
            }`}
          >
            Upcoming Consultations
          </button>
          <button
            type="button"
            onClick={() => setTab("past")}
            className={`px-4 py-2 rounded-xl transition-all ${
              tab === "past" ? "bg-white text-[#0B1F33] shadow-xs" : "text-[#64748B] hover:text-[#0B1F33]"
            }`}
          >
            Past & Completed
          </button>
          <button
            type="button"
            onClick={() => setTab("cancelled")}
            className={`px-4 py-2 rounded-xl transition-all ${
              tab === "cancelled" ? "bg-white text-[#0B1F33] shadow-xs" : "text-[#64748B] hover:text-[#0B1F33]"
            }`}
          >
            Cancelled
          </button>
        </div>

        {/* Appointments List */}
        <div className="space-y-4">
          {loading ? (
            <div className="p-12 text-center text-xs text-[#64748B]">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#0E7490]" />
              Loading appointments...
            </div>
          ) : filteredAppointments.length === 0 ? (
            <Card className="p-12 text-center space-y-3">
              <Calendar className="w-10 h-10 text-[#94A3B8] mx-auto" />
              <h3 className="font-bold text-sm text-[#0B1F33]">No {tab} appointments</h3>
              <p className="text-xs text-[#64748B]">You have no {tab} consultations matching this filter.</p>
              {tab === "upcoming" && (
                <Link href="/care-connect">
                  <Button variant="primary" size="sm" className="mt-2">
                    Browse Specialists & Book
                  </Button>
                </Link>
              )}
            </Card>
          ) : (
            filteredAppointments.map((apt) => {
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
                        <Video className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-[#0B1F33]">{apt.doctor_name}</h3>
                        <p className="text-xs text-[#0E7490] font-semibold">{apt.doctor_specialization || apt.specialization}</p>
                      </div>
                    </div>
                    <StatusBadge
                      label={apt.status.toUpperCase()}
                      variant={
                        apt.status === "scheduled" || apt.status === "confirmed"
                          ? "success"
                          : apt.status === "rescheduled"
                          ? "info"
                          : apt.status === "cancelled"
                          ? "danger"
                          : "neutral"
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
                      <Video className="w-4 h-4 text-[#0E7490]" />
                      <span>{apt.consultation_type === "video" ? "Secure Video Consultation" : "In-Person Clinic Visit"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#0E7490]" />
                      <span>Demo clinic</span>
                    </div>
                  </div>

                  {(apt.patient_reason || apt.reason) && (
                    <p className="text-xs text-[#64748B] pt-1">
                      <strong>Clinical Reason:</strong> {apt.patient_reason || apt.reason}
                    </p>
                  )}

                  {apt.doctor_notes && (
                    <p className="text-xs text-[#0F766E] bg-[#F0FDF4] p-3 rounded-xl border border-[#0F766E]/20">
                      <strong>Clinician Notes:</strong> {apt.doctor_notes}
                    </p>
                  )}

                  <div className="pt-3 border-t border-[#F1F5F9] flex flex-wrap justify-between items-center gap-3">
                    <span className="text-[11px] text-[#94A3B8]">Reference ID: {apt.id}</span>
                    <div className="flex items-center gap-2">
                      {apt.status !== "cancelled" && apt.status !== "completed" && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-[#B42318] hover:bg-[#B42318]/10"
                            onClick={() => handleCancel(apt.id)}
                          >
                            Cancel
                          </Button>
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
