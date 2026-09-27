"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, Heart, Activity, Apple, Moon, ArrowRight, ShieldCheck } from "lucide-react";
import { AppShell } from "../../components/layout/AppShell";
import { Card, CardHeader } from "../../components/ui/Card";
import { StatusBadge, DemoBadge } from "../../components/ui/StatusBadge";
import { Button } from "../../components/ui/Button";

export default function HealthInsightsPage() {
  return (
    <AppShell>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D8E2EA] pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F33]">
                Personalized Health & Lifestyle Insights
              </h1>
              <DemoBadge label="Lifestyle AI" />
            </div>
            <p className="text-xs sm:text-sm text-[#475569]">
              Evidence-based lifestyle and cardiometabolic recommendations tailored to your profile.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#0E7490]/10 text-[#0E7490] flex items-center justify-center">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-[#0B1F33]">Physical Activity Optimization</h3>
                <p className="text-xs text-[#0F766E] font-semibold">Current: Moderate (35 mins/day)</p>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
              Based on your resting heart rate (thalach: 148) and resting blood pressure (132 mmHg), continuing regular aerobic brisk walking for 35 minutes 5 days a week provides optimal cardiovascular buffering against hypertension.
            </p>
          </Card>

          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#0F766E]/10 text-[#0F766E] flex items-center justify-center">
                <Apple className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-[#0B1F33]">Cardiometabolic Nutrition</h3>
                <p className="text-xs text-[#0F766E] font-semibold">Focus: Sodium & Lipid Modulation</p>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
              With serum cholesterol at 181 mg/dL, increasing soluble fiber (oats, legumes, and fresh regional Maharashtra vegetables) can further stabilize lipid profiles before pharmacological interventions are ever contemplated.
            </p>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
