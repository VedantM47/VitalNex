"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Activity,
  ShieldCheck,
  Stethoscope,
  Calendar,
  Sparkles,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Download,
  FileText,
  Clock,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
import { AppShell } from "../../components/layout/AppShell";
import { Card, CardHeader } from "../../components/ui/Card";
import { StatCard } from "../../components/ui/StatCard";
import { RiskBadge, StatusBadge, DemoBadge } from "../../components/ui/StatusBadge";
import { Button } from "../../components/ui/Button";
import { useAuth } from "../../lib/auth-context";
import { useTranslation } from "../../lib/i18n";
import { api } from "../../lib/api-client";

export default function DashboardPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const userId = user?.id || "usr-demo-patient-001";

  const [loading, setLoading] = useState(true);
  const [latestAssessment, setLatestAssessment] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [profileCompleteness, setProfileCompleteness] = useState<number>(85);

  useEffect(() => {
    let active = true;
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Fetch Assessment History
        const historyData = await api.getAssessmentHistory(userId);
        if (active && historyData?.assessments && historyData.assessments.length > 0) {
          setLatestAssessment(historyData.assessments[0]);
        }

        // Fetch Scheduled Appointments
        const aptsData = await api.getAppointments(userId, "patient");
        if (active && Array.isArray(aptsData)) {
          setAppointments(aptsData);
        }

        // Fetch Health Profile for completeness calculation
        const hp = await api.getHealthProfile(userId);
        if (active && hp) {
          setProfileCompleteness(hp.completeness_score || 90);
        }
      } catch (err) {
        console.warn("Dashboard data fetch warning:", err);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchDashboardData();
    return () => {
      active = false;
    };
  }, [userId]);

  const nextAppointment = appointments.find((a) => a.status === "confirmed" || a.status === "scheduled") || appointments[0];

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D8E2EA] pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F33]">
                {t("dashboard.welcome")}, {user?.fullName || "Patient"}
              </h1>
              {user?.isDemo && <DemoBadge label="Demo Environment" />}
            </div>
            <p className="text-xs sm:text-sm text-[#475569]">
              Personalized cardiometabolic risk overview and care management.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/risk-assessment">
              <Button size="md" variant="primary" rightIcon={<Activity className="w-4 h-4" />}>
                {t("dashboard.btnStartAssessment")}
              </Button>
            </Link>
          </div>
        </div>

        {/* Compact Overview Grid (3 Cards) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Latest Risk Screening */}
          <StatCard
            label="Latest Risk Screening"
            value={latestAssessment ? `${latestAssessment.risk_score}%` : "No Screening Yet"}
            subtext={latestAssessment ? `${latestAssessment.risk_band} Risk Stratum` : "Complete a screening to compute baseline"}
            icon={<Activity className="w-5 h-5 text-[#0E7490]" />}
          />

          {/* Card 2: Profile Completeness */}
          <StatCard
            label="Health Profile Completeness"
            value={`${profileCompleteness}%`}
            subtext="Clinical model parameters validated"
            icon={<ShieldCheck className="w-5 h-5 text-[#0F766E]" />}
          />

          {/* Card 3: Upcoming Appointment */}
          <StatCard
            label="Next Scheduled Care"
            value={nextAppointment ? nextAppointment.doctor_name : "No Appointments"}
            subtext={nextAppointment ? `${nextAppointment.consultation_type} • ${nextAppointment.appointment_time}` : "Schedule a specialist consultation"}
            icon={<Calendar className="w-5 h-5 text-[#0B1F33]" />}
          />
        </div>

        {/* Main Section: Latest Risk Assessment Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 space-y-6">
            <Card className="p-6 sm:p-8 space-y-6">
              <CardHeader
                title="Latest Risk Assessment Summary"
                subtitle="Calibrated cardiometabolic screening model evaluation."
                badge={
                  latestAssessment ? (
                    <RiskBadge band={latestAssessment.risk_band} />
                  ) : (
                    <StatusBadge label="Screening Required" variant="neutral" size="sm" />
                  )
                }
                action={
                  <Link href="/risk-assessment">
                    <Button variant="outline" size="sm" rightIcon={<ChevronRight className="w-3.5 h-3.5" />}>
                      Full Risk Analysis
                    </Button>
                  </Link>
                }
              />

              {latestAssessment ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 bg-[#F8FAFC] rounded-2xl border border-[#D8E2EA]">
                    <div>
                      <p className="text-xs text-[#64748B]">Calculated Risk Index</p>
                      <p className="text-3xl font-extrabold text-[#0B1F33] mt-1">{latestAssessment.risk_score}%</p>
                      <p className="text-[11px] text-[#0F766E] font-semibold mt-0.5">{latestAssessment.risk_band} Risk Stratum</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#64748B]">95% Confidence Interval</p>
                      <p className="text-lg font-bold text-[#0B1F33] mt-1">
                        [{latestAssessment.confidence_interval?.[0]}% - {latestAssessment.confidence_interval?.[1]}%]
                      </p>
                      <p className="text-[11px] text-[#64748B] mt-0.5">Platt Isotonic Calibrated</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#64748B]">Clinical Review Gate</p>
                      <p className="text-sm font-bold text-[#0F766E] mt-2">
                        {latestAssessment.human_review_status === "Pending" ? "Physician Review Advised" : "Automated Gate"}
                      </p>
                      <p className="text-[11px] text-[#64748B] mt-0.5">Audited in AI Trust Passport</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs">
                    <span className="text-[#64748B]">Model Engine: {latestAssessment.model_version}</span>
                    <div className="flex items-center gap-3">
                      <a
                        href={api.getReportPdfUrl(latestAssessment.id)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#0E7490] hover:underline font-semibold flex items-center gap-1"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download PDF Report</span>
                      </a>
                      <Link
                        href={`/ai-trust?id=${latestAssessment.id}`}
                        className="text-[#0B1F33] hover:underline font-semibold flex items-center gap-1"
                      >
                        <span>AI Trust Passport</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center space-y-4 bg-[#F8FAFC] rounded-2xl border border-[#D8E2EA]">
                  <Activity className="w-10 h-10 text-[#94A3B8] mx-auto" />
                  <div>
                    <h3 className="font-bold text-base text-[#0B1F33]">No Cardiometabolic Assessment Completed</h3>
                    <p className="text-xs text-[#64748B] max-w-md mx-auto mt-1">
                      Enter your physiological parameters to run the calibrated ML screening model and receive personalized risk guidance.
                    </p>
                  </div>
                  <Link href="/risk-assessment">
                    <Button variant="primary" size="md">
                      Start Risk Screening
                    </Button>
                  </Link>
                </div>
              )}
            </Card>

            {/* Quick Actions Grid (4 Actions) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Link href="/risk-assessment" className="block">
                <Card className="p-4 space-y-2 hover:border-[#0E7490] hover:shadow-xs transition-all cursor-pointer h-full">
                  <div className="p-2 bg-[#0E7490]/10 rounded-xl text-[#0E7490] w-fit">
                    <Activity className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-xs text-[#0B1F33]">Start Assessment</h4>
                  <p className="text-[11px] text-[#64748B]">Calculate risk index</p>
                </Card>
              </Link>

              <Link href="/history" className="block">
                <Card className="p-4 space-y-2 hover:border-[#0E7490] hover:shadow-xs transition-all cursor-pointer h-full">
                  <div className="p-2 bg-[#0F766E]/10 rounded-xl text-[#0F766E] w-fit">
                    <Clock className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-xs text-[#0B1F33]">View History</h4>
                  <p className="text-[11px] text-[#64748B]">Risk trajectory timeline</p>
                </Card>
              </Link>

              <Link href="/care-connect" className="block">
                <Card className="p-4 space-y-2 hover:border-[#0E7490] hover:shadow-xs transition-all cursor-pointer h-full">
                  <div className="p-2 bg-[#0B1F33]/10 rounded-xl text-[#0B1F33] w-fit">
                    <Stethoscope className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-xs text-[#0B1F33]">Find Clinician</h4>
                  <p className="text-[11px] text-[#64748B]">Pune specialists</p>
                </Card>
              </Link>

              <Link href="/reports" className="block">
                <Card className="p-4 space-y-2 hover:border-[#0E7490] hover:shadow-xs transition-all cursor-pointer h-full">
                  <div className="p-2 bg-[#0E7490]/10 rounded-xl text-[#0E7490] w-fit">
                    <FileText className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-xs text-[#0B1F33]">Clinical Reports</h4>
                  <p className="text-[11px] text-[#64748B]">Download PDF summaries</p>
                </Card>
              </Link>
            </div>
          </div>

          {/* Side Column: Care Connect & Appointments */}
          <div className="lg:col-span-4 space-y-6">
            {/* Next Appointment / Care Connect Card */}
            {nextAppointment ? (
              <Card className="p-6 space-y-4 border-[#0E7490]/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-[#0E7490]" />
                    <h3 className="font-bold text-sm text-[#0B1F33]">Upcoming Consultation</h3>
                  </div>
                  <StatusBadge label={nextAppointment.status.toUpperCase()} variant="info" size="sm" />
                </div>

                <div className="p-4 bg-[#F8FAFC] rounded-xl border border-[#D8E2EA] space-y-2 text-xs">
                  <p className="font-bold text-[#0B1F33] text-sm">{nextAppointment.doctor_name}</p>
                  <p className="text-[#64748B]">{nextAppointment.consultation_type} • {nextAppointment.appointment_time}</p>
                  <p className="text-[#0F766E] font-semibold">{nextAppointment.location}</p>
                </div>

                <Link href={`/consultation/${nextAppointment.id}`} className="block">
                  <Button variant="primary" size="md" className="w-full">
                    Join Video Consultation Room
                  </Button>
                </Link>
              </Card>
            ) : (
              <Card className="p-6 space-y-4 bg-gradient-to-br from-[#0B1F33] to-[#132E4A] text-white">
                <div className="flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-[#22C1DC]" />
                  <h3 className="font-bold text-sm">Care Connect</h3>
                </div>
                <p className="text-xs text-[#CBD5E1] leading-relaxed">
                  Schedule a consultation with verified cardiologists and preventive health specialists in Kothrud, Baner, and Shivajinagar.
                </p>
                <Link href="/care-connect" className="block pt-2">
                  <Button variant="teal" size="sm" className="w-full">
                    Find Pune Specialists
                  </Button>
                </Link>
              </Card>
            )}

            {/* AI Trust Passport Link Card */}
            <Card className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#0F766E]" />
                <h3 className="font-bold text-sm text-[#0B1F33]">AI Trust &amp; Governance</h3>
              </div>
              <p className="text-xs text-[#475569] leading-relaxed">
                Inspect 11 transparent governance dimensions including demographic parity, Brier calibration, and Platt scaling metrics.
              </p>
              <Link href="/ai-trust" className="block">
                <Button variant="outline" size="sm" className="w-full">
                  Inspect Trust Passport
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
