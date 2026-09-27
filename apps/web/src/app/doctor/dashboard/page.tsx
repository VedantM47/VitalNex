"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Stethoscope,
  Activity,
  Calendar,
  AlertTriangle,
  UserCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  FileText,
  User,
} from "lucide-react";
import { AppShell } from "../../../components/layout/AppShell";
import { Card, CardHeader } from "../../../components/ui/Card";
import { StatCard } from "../../../components/ui/StatCard";
import { RiskBadge, StatusBadge, DemoBadge } from "../../../components/ui/StatusBadge";
import { Button } from "../../../components/ui/Button";

export default function DoctorDashboardPage() {
  const [activeTab, setActiveTab] = useState<"queue" | "appointments">("queue");

  const reviewQueue = [
    {
      id: "rev-001",
      patientId: "PUN_SYN_00003",
      patientName: "Rajesh Sharma (Demo)",
      age: 59,
      gender: "Male",
      riskScore: "91.3%",
      riskBand: "High",
      reason: "Blood pressure (135 mmHg) + Exercise ST depression (1.0) warrants clinician confirmation.",
      aiRecommendation: "Recommend secondary in-person ECG and lipid panel consultation.",
      status: "Pending Review",
    },
    {
      id: "rev-002",
      patientId: "PUN_SYN_00004",
      patientName: "Sunita Kulkarni (Demo)",
      age: 61,
      gender: "Female",
      riskScore: "59.9%",
      riskBand: "Moderate",
      reason: "Elevated serum cholesterol (259 mg/dL) with positive family history.",
      aiRecommendation: "Evaluate dietary modification and 90-day repeat screening.",
      status: "Pending Review",
    },
  ];

  const todaysAppointments = [
    {
      id: "apt-01",
      patientName: "Anand Deshpande (Demo)",
      time: "10:30 AM",
      type: "Video E-Connect",
      reason: "Cardiometabolic Risk Screening Follow-up",
      status: "Confirmed",
    },
    {
      id: "apt-02",
      patientName: "Meera Patil (Demo)",
      time: "02:00 PM",
      type: "In-Person Clinic Visit (Kothrud)",
      reason: "Hypertension and Lifestyle Consultation",
      status: "Scheduled",
    },
  ];

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Clinician Portal Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D8E2EA] pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F33]">
                Clinician Oversight Hub
              </h1>
              <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-[#0E7490] text-white">
                Dr. Anand Joshi, MD
              </span>
              <DemoBadge label="Demo Clinician Portal" />
            </div>
            <p className="text-xs sm:text-sm text-[#475569]">
              Human-in-the-loop review queue for flagged clinical AI risk assessments and video consultations.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button size="sm" variant="outline" leftIcon={<Clock className="w-3.5 h-3.5" />}>
              Next Clinic Slot: 10:30 AM
            </Button>
          </div>
        </div>

        {/* Top Clinician Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <StatCard
            label="Pending AI Reviews"
            value="2 Cases"
            subtext="High-risk and borderline flags"
            icon={<AlertTriangle className="w-5 h-5 text-[#B45309]" />}
          />
          <StatCard
            label="Today's Consultations"
            value="2 Patients"
            subtext="1 Video, 1 Clinic visit"
            icon={<Calendar className="w-5 h-5 text-[#0E7490]" />}
          />
          <StatCard
            label="Reviewed This Month"
            value="38 Cases"
            subtext="96% Clinician-AI agreement"
            icon={<UserCheck className="w-5 h-5 text-[#0F766E]" />}
          />
          <StatCard
            label="Physiological Boundary Passes"
            value="99.4%"
            subtext="Zero out-of-bounds inputs"
            icon={<ShieldCheck className="w-5 h-5 text-[#0B1F33]" />}
          />
        </div>

        {/* Main Content Area */}
        <div className="space-y-6">
          {/* Section Navigation Tabs */}
          <div className="flex gap-2 border-b border-[#D8E2EA] pb-2 text-xs font-semibold">
            <button
              onClick={() => setActiveTab("queue")}
              className={`px-4 py-2 rounded-xl transition-colors ${
                activeTab === "queue"
                  ? "bg-[#0B1F33] text-white"
                  : "text-[#475569] hover:bg-[#F1F5F9]"
              }`}
            >
              AI Human Review Queue (2 Flagged)
            </button>
            <button
              onClick={() => setActiveTab("appointments")}
              className={`px-4 py-2 rounded-xl transition-colors ${
                activeTab === "appointments"
                  ? "bg-[#0B1F33] text-white"
                  : "text-[#475569] hover:bg-[#F1F5F9]"
              }`}
            >
              Today&apos;s Appointments (2)
            </button>
          </div>

          {activeTab === "queue" && (
            <div className="space-y-4">
              {reviewQueue.map((item) => (
                <Card key={item.id} className="p-6 space-y-4 border-l-4 border-l-[#B45309]">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F1F5F9] pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#0B1F33] text-[#22C1DC] flex items-center justify-center font-bold text-xs">
                        {item.patientName.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-[#0B1F33]">
                          {item.patientName} ({item.age} y/o, {item.gender})
                        </h3>
                        <p className="text-[11px] text-[#64748B]">Patient ID: {item.patientId}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <RiskBadge band={item.riskBand} />
                      <span className="text-xs font-bold text-[#0B1F33] bg-[#F8FAFC] px-2.5 py-1 rounded-lg border border-[#D8E2EA]">
                        Score: {item.riskScore}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#D8E2EA] space-y-1">
                      <p className="font-semibold text-[#0B1F33]">AI Triage Escalation Reason</p>
                      <p className="text-[#475569] leading-relaxed">{item.reason}</p>
                    </div>
                    <div className="p-3 bg-[#F0FDF4] rounded-xl border border-[#0F766E]/20 space-y-1">
                      <p className="font-semibold text-[#0F766E]">Suggested Clinical Action</p>
                      <p className="text-[#0F766E] leading-relaxed">{item.aiRecommendation}</p>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs border-t border-[#F1F5F9]">
                    <Link
                      href="/ai-trust"
                      className="text-[#0E7490] hover:underline font-semibold flex items-center gap-1"
                    >
                      <span>Inspect Patient AI Trust Passport</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>

                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline">
                        Request Notes
                      </Button>
                      <Button size="sm" variant="primary" leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}>
                        Approve Assessment
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {activeTab === "appointments" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {todaysAppointments.map((apt) => (
                <Card key={apt.id} className="p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-sm text-[#0B1F33]">{apt.patientName}</h3>
                      <p className="text-xs text-[#0E7490] font-semibold mt-0.5">{apt.type}</p>
                    </div>
                    <StatusBadge label={apt.time} variant="info" size="sm" />
                  </div>
                  <p className="text-xs text-[#475569]">{apt.reason}</p>
                  <div className="pt-2 border-t border-[#F1F5F9] flex justify-end">
                    <Button size="sm" variant="primary">
                      Open Consultation Room
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
