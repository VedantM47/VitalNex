"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Activity,
  ShieldCheck,
  Stethoscope,
  Calendar,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Heart,
  Droplet,
  Moon,
  Info,
  ChevronRight,
} from "lucide-react";
import { AppShell } from "../../components/layout/AppShell";
import { Card, CardHeader } from "../../components/ui/Card";
import { StatCard, ProgressBar } from "../../components/ui/StatCard";
import { RiskBadge, StatusBadge, DemoBadge } from "../../components/ui/StatusBadge";
import { Button } from "../../components/ui/Button";
import { useAuth } from "../../lib/auth-context";
import { useTranslation } from "../../lib/i18n";

export default function DashboardPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [hasCompletedAssessment, setHasCompletedAssessment] = useState(true);

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Welcome Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D8E2EA] pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F33]">
                {t("dashboard.welcome")}, {user?.fullName || "Patient"}
              </h1>
              <DemoBadge label="Demo Environment" />
            </div>
            <p className="text-xs sm:text-sm text-[#475569]">
              {t("dashboard.subtitle")}
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

        {/* Top StatCards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <StatCard
            label="Profile Completeness"
            value="85%"
            subtext="22 of 26 features validated"
            icon={<ShieldCheck className="w-5 h-5 text-[#0F766E]" />}
          />
          <StatCard
            label="Latest Risk Screening"
            value="Low Risk"
            subtext="Baseline score: 18.1%"
            icon={<Activity className="w-5 h-5 text-[#0E7490]" />}
          />
          <StatCard
            label="AI Trust Verification"
            value="100% Passed"
            subtext="Parity: 0.94 across sex & locality"
            icon={<Sparkles className="w-5 h-5 text-[#0E7490]" />}
          />
          <StatCard
            label="Upcoming Care"
            value="1 Scheduled"
            subtext="Dr. Anand Joshi (Video)"
            icon={<Calendar className="w-5 h-5 text-[#0B1F33]" />}
          />
        </div>

        {/* Primary Health & Risk Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Health Overview Container (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            <Card className="p-6">
              <CardHeader
                title="Cardiometabolic Risk Screening"
                subtitle="Baseline screening model calibrated on academic synthetic distributions."
                badge={<DemoBadge label="Demo Mode" />}
                action={
                  <Link href="/risk-assessment">
                    <Button variant="outline" size="sm" rightIcon={<ChevronRight className="w-3.5 h-3.5" />}>
                      Full Analysis
                    </Button>
                  </Link>
                }
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-[#F8FAFC] rounded-xl border border-[#D8E2EA] mb-6">
                <div>
                  <p className="text-xs text-[#64748B]">Calculated Risk Index</p>
                  <p className="text-2xl font-bold text-[#0B1F33] mt-1">18.1%</p>
                  <p className="text-[11px] text-[#0F766E] font-medium mt-0.5">Low Risk Band</p>
                </div>
                <div>
                  <p className="text-xs text-[#64748B]">95% Confidence Interval</p>
                  <p className="text-lg font-bold text-[#0B1F33] mt-1">[13.6% - 22.6%]</p>
                  <p className="text-[11px] text-[#64748B] mt-0.5">Narrow error bounds</p>
                </div>
                <div>
                  <p className="text-xs text-[#64748B]">Clinician Oversight</p>
                  <p className="text-sm font-bold text-[#0F766E] mt-2">Routine Automated</p>
                  <p className="text-[11px] text-[#64748B] mt-0.5">No urgent flags detected</p>
                </div>
              </div>

              {/* Progress and Feature Drivers */}
              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs font-semibold text-[#0B1F33]">
                  <span>Key Contributing Vitals</span>
                  <span className="text-[#64748B]">Relative Model Weight</span>
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs text-[#475569] mb-1">
                      <span>Resting Blood Pressure (132 mmHg)</span>
                      <span className="font-semibold text-[#0B1F33]">+8.2% impact</span>
                    </div>
                    <ProgressBar value={60} max={100} showPercentage={false} />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-[#475569] mb-1">
                      <span>Serum Cholesterol (181 mg/dL)</span>
                      <span className="font-semibold text-[#0B1F33]">+4.1% impact</span>
                    </div>
                    <ProgressBar value={40} max={100} showPercentage={false} />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-[#475569] mb-1">
                      <span>Physical Activity (Moderate Habit)</span>
                      <span className="font-semibold text-[#0F766E]">-5.5% mitigating</span>
                    </div>
                    <ProgressBar value={55} max={100} showPercentage={false} />
                  </div>
                </div>
              </div>
            </Card>

            {/* Lifestyle Snapshot */}
            <Card className="p-6">
              <CardHeader
                title="Lifestyle & Daily Rhythm Snapshot"
                subtitle="Contextual health indicators captured for personalized lifestyle guidance."
              />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 bg-[#F8FAFC] rounded-xl border border-[#D8E2EA] space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-[#64748B]">
                    <Moon className="w-3.5 h-3.5 text-[#0E7490]" />
                    <span>Sleep</span>
                  </div>
                  <p className="text-lg font-bold text-[#0B1F33]">7.0 hrs</p>
                  <p className="text-[10px] text-[#0F766E] font-medium">Restful duration</p>
                </div>

                <div className="p-4 bg-[#F8FAFC] rounded-xl border border-[#D8E2EA] space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-[#64748B]">
                    <Activity className="w-3.5 h-3.5 text-[#0E7490]" />
                    <span>Activity</span>
                  </div>
                  <p className="text-lg font-bold text-[#0B1F33]">Moderate</p>
                  <p className="text-[10px] text-[#0F766E] font-medium">35 mins daily</p>
                </div>

                <div className="p-4 bg-[#F8FAFC] rounded-xl border border-[#D8E2EA] space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-[#64748B]">
                    <Droplet className="w-3.5 h-3.5 text-[#0E7490]" />
                    <span>Hydration</span>
                  </div>
                  <p className="text-lg font-bold text-[#0B1F33]">2.2 L</p>
                  <p className="text-[10px] text-[#0F766E] font-medium">Optimal range</p>
                </div>

                <div className="p-4 bg-[#F8FAFC] rounded-xl border border-[#D8E2EA] space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-[#64748B]">
                    <Heart className="w-3.5 h-3.5 text-[#0E7490]" />
                    <span>Diet Quality</span>
                  </div>
                  <p className="text-lg font-bold text-[#0B1F33]">Balanced</p>
                  <p className="text-[10px] text-[#64748B]">Mixed nutrition</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Side Column: AI Trust Status & Connected Care (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* AI Trust Passport Card */}
            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#0F766E]" />
                  <h3 className="font-bold text-sm sm:text-base text-[#0B1F33]">AI Trust Passport</h3>
                </div>
                <StatusBadge label="Verified" variant="success" size="sm" />
              </div>

              <p className="text-xs text-[#475569] leading-relaxed">
                This assessment was verified against 11 responsible AI standards before display.
              </p>

              <div className="space-y-2.5 pt-2 border-t border-[#F1F5F9] text-xs">
                <div className="flex justify-between py-1 border-b border-[#F8FAFC]">
                  <span className="text-[#64748B]">Demographic Parity:</span>
                  <span className="font-semibold text-[#0F766E]">94% Ratio (Pass)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#F8FAFC]">
                  <span className="text-[#64748B]">Calibration (Platt):</span>
                  <span className="font-semibold text-[#0B1F33]">Brier 0.082</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#F8FAFC]">
                  <span className="text-[#64748B]">Safety Boundary Check:</span>
                  <span className="font-semibold text-[#0F766E]">100% In-Bounds</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#64748B]">Model Artifact:</span>
                  <span className="font-mono text-[11px] text-[#0E7490]">v1.0.0-demo</span>
                </div>
              </div>

              <Link href="/ai-trust" className="block pt-2">
                <Button variant="outline" size="sm" className="w-full">
                  Inspect All 11 Dimensions
                </Button>
              </Link>
            </Card>

            {/* Care Connect Quick Action Card */}
            <Card className="p-6 space-y-4 bg-gradient-to-br from-[#0B1F33] to-[#132E4A] text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-[#22C1DC]" />
                  <h3 className="font-bold text-sm sm:text-base">Care Connect</h3>
                </div>
                <span className="text-[11px] text-[#22C1DC] font-semibold">Pune Region</span>
              </div>

              <p className="text-xs text-[#CBD5E1] leading-relaxed">
                Schedule a consultation with certified cardiologists and preventive health physicians in Kothrud, Baner, and Shivajinagar.
              </p>

              <Link href="/care-connect" className="block pt-2">
                <Button variant="teal" size="sm" className="w-full">
                  Find Pune Specialists
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
