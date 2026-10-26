"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Activity,
  Apple,
  Moon,
  Heart,
  Droplet,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Info,
  ArrowRight,
  RefreshCw,
  BookOpen,
  UserCheck,
  Stethoscope,
} from "lucide-react";
import { AppShell } from "../../components/layout/AppShell";
import { Card, CardHeader } from "../../components/ui/Card";
import { StatusBadge, DemoBadge } from "../../components/ui/StatusBadge";
import { Button } from "../../components/ui/Button";
import { useAuth } from "../../lib/auth-context";
import { useTranslation } from "../../lib/i18n";
import { api } from "../../lib/api-client";

interface InsightCardProps {
  id: string;
  title: string;
  category: string;
  currentValue: string;
  recommendation: string;
  whyItAppears: string;
  evidenceSource: string;
  limitations: string;
  clinicianDiscussionPoints: string[];
  icon: any;
}

export default function HealthInsightsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [loading, setLoading] = useState(true);
  const [healthProfile, setHealthProfile] = useState<any>(null);
  const [latestAssessment, setLatestAssessment] = useState<any>(null);
  const [historyCount, setHistoryCount] = useState<number>(0);
  const [expandedId, setExpandedId] = useState<string | null>("activity");

  useEffect(() => {
    let active = true;
    const loadInsightsData = async () => {
      setLoading(true);
      try {
        const hp = await api.getHealthProfile();
        if (active && hp) setHealthProfile(hp);

        const history = await api.getAssessmentHistory();
        if (active && history) {
          setHistoryCount(history.total_assessments || (history.assessments?.length || 0));
          if (history.assessments && history.assessments.length > 0) {
            setLatestAssessment(history.assessments[0]);
          }
        }
      } catch (err) {
        console.warn("Could not load health insights data:", err);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadInsightsData();
    return () => {
      active = false;
    };
  }, [userId]);

  // Extract vitals & lifestyle context
  const cm = healthProfile?.clinical_model || latestAssessment?.input_snapshot || {};
  const ls = healthProfile?.lifestyle || {};
  const nut = healthProfile?.nutrition || {};

  const bpVal = cm.trestbps || cm.restingBp || 135;
  const cholVal = cm.chol || cm.cholesterol || 215;
  const thalachVal = cm.thalach || cm.maxHeartRate || 148;
  const bmiVal = cm.bmi || 25.4;
  const activityVal = ls.physical_activity || "Moderate";
  const sleepVal = ls.sleep_hours_per_night || 7.0;

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const insights: InsightCardProps[] = [
    {
      id: "activity",
      title: "Cardiovascular Aerobic Exercise",
      category: "Physical Activity",
      currentValue: `Current Status: ${activityVal} (${thalachVal} bpm max HR)`,
      icon: Activity,
      recommendation:
        "Maintaining 150 minutes per week of moderate-intensity aerobic physical activity (such as brisk walking or cycling) supports vascular elasticity and helps regulate resting blood pressure.",
      whyItAppears: `Recorded resting blood pressure is ${bpVal} mmHg with maximum heart rate recorded at ${thalachVal} bpm. Aerobic exercise reduces systemic vascular resistance over longitudinal timelines.`,
      evidenceSource: "AHA/ACC Hypertension Clinical Practice Guidelines & WHO Global Recommendations on Physical Activity for Health.",
      limitations: "General physical activity guidance. Patients with active chest pain or exercise-induced shortness of breath must be clinically evaluated before starting new exercise regimens.",
      clinicianDiscussionPoints: [
        "What is my target heart rate zone during aerobic exercise?",
        "Should I undergo an exercise stress test before increasing workout intensity?",
        "How frequently should I monitor blood pressure responses post-workout?",
      ],
    },
    {
      id: "nutrition",
      title: "Cardiometabolic Nutrition & Soluble Fiber",
      category: "Diet & Lipid Modulation",
      currentValue: `Current Cholesterol: ${cholVal} mg/dL (Diet: ${nut.diet_pattern || "Mixed"})`,
      icon: Apple,
      recommendation:
        "Increasing dietary intake of soluble fiber (oats, legumes, whole grains, and regional Maharashtra produce) helps lower intestinal absorption of dietary lipids.",
      whyItAppears: `Serum cholesterol parameter is ${cholVal} mg/dL (desirable baseline < 200 mg/dL). Non-pharmacological dietary modulation is the primary conservative intervention.`,
      evidenceSource: "NLA Lipid Guidelines for Management of Dyslipidemia & ICMR National Guidelines for Cardiovascular Disease Prevention.",
      limitations: "Dietary modifications complement, but do not replace, prescribed lipid-lowering pharmacotherapy when indicated by a physician.",
      clinicianDiscussionPoints: [
        "Is my lipid profile suitable for conservative lifestyle intervention alone?",
        "Should a detailed fasting lipid panel (LDL, HDL, Triglycerides) be ordered?",
        "Are there specific dietary changes tailored to Indian regional culinary habits?",
      ],
    },
    {
      id: "hypertension",
      title: "Blood Pressure & Stress Rhythm Management",
      category: "Vascular Health",
      currentValue: `Resting BP: ${bpVal} mmHg (${ls.stress_level || "Moderate"} Stress)`,
      icon: Heart,
      recommendation:
        "Consistent daily rest, sodium moderation (< 2,000 mg daily), and structured stress reduction techniques (mindfulness or deep breathing) help buffer nocturnal blood pressure surges.",
      whyItAppears: `Resting blood pressure is recorded at ${bpVal} mmHg. Elevated systolic pressure increases cardiac workload over long horizons.`,
      evidenceSource: "ISH 2020 Global Hypertension Practice Guidelines.",
      limitations: "Self-monitored blood pressure readings should be calibrated using a certified upper-arm cuff device.",
      clinicianDiscussionPoints: [
        "What schedule should I use for home blood pressure monitoring?",
        "Would ambulatory 24-hour blood pressure monitoring be beneficial?",
        "How do my stress levels impact my resting blood pressure readings?",
      ],
    },
  ];

  const lastUpdatedDate = latestAssessment?.evaluated_at
    ? new Date(latestAssessment.evaluated_at).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "Current Session";

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D8E2EA] pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F33]">
                Personalized Health &amp; Lifestyle Insights
              </h1>
              <StatusBadge label={`Updated: ${lastUpdatedDate}`} variant="info" size="sm" />
            </div>
            <p className="text-xs sm:text-sm text-[#475569]">
              Evidence-based health indicators, educational insights, and discussion points tailored to your profile.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/health-profile">
              <Button variant="outline" size="sm">
                Update Health Profile
              </Button>
            </Link>
            <Link href="/risk-assessment">
              <Button variant="primary" size="sm" leftIcon={<Activity className="w-3.5 h-3.5" />}>
                New Screening
              </Button>
            </Link>
          </div>
        </div>

        {/* Disclaimer Banner */}
        <div className="p-4 bg-[#F8FAFC] rounded-2xl border border-[#D8E2EA] flex items-start gap-3">
          <Info className="w-5 h-5 text-[#0E7490] shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs text-[#0B1F33]">
            <p className="font-bold">Educational Health Intelligence Notice</p>
            <p className="text-[#475569] leading-relaxed">
              These insights provide general health education and evidence-based lifestyle information derived from your recorded parameters. They do not constitute personalized medical diagnosis or treatment plans. Always consult your healthcare provider for medical decisions.
            </p>
          </div>
        </div>

        {/* Available Health Indicators Grid */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-[#0B1F33] uppercase tracking-wider">
            Recorded Vitals &amp; Health Indicators
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="p-4 bg-[#F8FAFC] rounded-2xl border border-[#D8E2EA] space-y-1">
              <span className="text-[11px] text-[#64748B] block">Resting BP</span>
              <p className="text-lg font-extrabold text-[#0B1F33]">{bpVal} <span className="text-xs font-normal text-[#64748B]">mmHg</span></p>
              <span className="text-[10px] text-[#0E7490] font-semibold">{bpVal > 130 ? "Elevated" : "Normal"}</span>
            </div>

            <div className="p-4 bg-[#F8FAFC] rounded-2xl border border-[#D8E2EA] space-y-1">
              <span className="text-[11px] text-[#64748B] block">Serum Chol</span>
              <p className="text-lg font-extrabold text-[#0B1F33]">{cholVal} <span className="text-xs font-normal text-[#64748B]">mg/dL</span></p>
              <span className="text-[10px] text-[#0E7490] font-semibold">{cholVal > 200 ? "Borderline High" : "Desirable"}</span>
            </div>

            <div className="p-4 bg-[#F8FAFC] rounded-2xl border border-[#D8E2EA] space-y-1">
              <span className="text-[11px] text-[#64748B] block">Max Heart Rate</span>
              <p className="text-lg font-extrabold text-[#0B1F33]">{thalachVal} <span className="text-xs font-normal text-[#64748B]">bpm</span></p>
              <span className="text-[10px] text-[#0F766E] font-semibold">Normal Range</span>
            </div>

            <div className="p-4 bg-[#F8FAFC] rounded-2xl border border-[#D8E2EA] space-y-1">
              <span className="text-[11px] text-[#64748B] block">Body Mass Index</span>
              <p className="text-lg font-extrabold text-[#0B1F33]">{bmiVal} <span className="text-xs font-normal text-[#64748B]">kg/m²</span></p>
              <span className="text-[10px] text-[#0E7490] font-semibold">{bmiVal > 25 ? "Overweight" : "Normal"}</span>
            </div>

            <div className="p-4 bg-[#F8FAFC] rounded-2xl border border-[#D8E2EA] space-y-1">
              <span className="text-[11px] text-[#64748B] block">Activity Level</span>
              <p className="text-lg font-extrabold text-[#0B1F33]">{activityVal}</p>
              <span className="text-[10px] text-[#0F766E] font-semibold">Habitual</span>
            </div>

            <div className="p-4 bg-[#F8FAFC] rounded-2xl border border-[#D8E2EA] space-y-1">
              <span className="text-[11px] text-[#64748B] block">Sleep Duration</span>
              <p className="text-lg font-extrabold text-[#0B1F33]">{sleepVal} <span className="text-xs font-normal text-[#64748B]">hrs</span></p>
              <span className="text-[10px] text-[#0F766E] font-semibold">Optimal Rest</span>
            </div>
          </div>
        </div>

        {/* Prioritized Educational Insights List */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-[#0B1F33] uppercase tracking-wider">
            Prioritized Lifestyle Insights &amp; Clinical Discussion Points
          </h2>

          <div className="space-y-4">
            {insights.map((item) => {
              const Icon = item.icon;
              const isExpanded = expandedId === item.id;

              return (
                <Card key={item.id} className="p-6 space-y-4 border-[#D8E2EA]">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-[#0E7490]/10 text-[#0E7490] rounded-2xl">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[11px] font-bold text-[#0E7490] uppercase tracking-wider">
                          {item.category}
                        </span>
                        <h3 className="font-extrabold text-base text-[#0B1F33]">{item.title}</h3>
                        <p className="text-xs text-[#0F766E] font-semibold mt-0.5">{item.currentValue}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleExpand(item.id)}
                      className="p-2 text-[#64748B] hover:text-[#0B1F33] hover:bg-[#F1F5F9] rounded-xl transition-colors"
                      aria-label="Toggle details"
                    >
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>

                  <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
                    {item.recommendation}
                  </p>

                  {/* Expandable Section */}
                  {isExpanded && (
                    <div className="pt-4 border-t border-[#F1F5F9] space-y-4 text-xs">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-1">
                          <span className="font-bold text-[#0B1F33]">Why This Insight Appears:</span>
                          <p className="text-[#475569] leading-relaxed">{item.whyItAppears}</p>
                        </div>

                        <div className="p-4 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-1">
                          <span className="font-bold text-[#0B1F33]">Evidence &amp; Clinical Guidelines:</span>
                          <p className="text-[#475569] leading-relaxed">{item.evidenceSource}</p>
                        </div>
                      </div>

                      <div className="p-4 bg-[#FFFBEB] rounded-xl border border-[#B45309]/30 space-y-1">
                        <span className="font-bold text-[#B45309]">Important Limitations:</span>
                        <p className="text-[#B45309] leading-relaxed">{item.limitations}</p>
                      </div>

                      <div className="p-4 bg-[#0B1F33]/5 rounded-xl border border-[#0B1F33]/15 space-y-2">
                        <div className="flex items-center gap-2 text-[#0B1F33] font-bold">
                          <Stethoscope className="w-4 h-4 text-[#0E7490]" />
                          <span>Suggested Discussion Points for Your Clinician:</span>
                        </div>
                        <ul className="list-disc list-inside space-y-1 text-[#475569] pl-1">
                          {item.clinicianDiscussionPoints.map((pt, i) => (
                            <li key={i}>{pt}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  <div className="pt-2 text-right">
                    <button
                      type="button"
                      onClick={() => toggleExpand(item.id)}
                      className="text-xs font-semibold text-[#0E7490] hover:underline inline-flex items-center gap-1"
                    >
                      <span>{isExpanded ? "Show Less" : "Why this appears & Clinician Discussion Points"}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Historical Trend Callout (only rendered when genuine data exists) */}
        {historyCount > 1 && (
          <Card className="p-6 space-y-3 bg-[#F8FAFC] border-[#0F766E]/30">
            <div className="flex items-center gap-2 text-[#0F766E] font-bold text-sm">
              <Activity className="w-4 h-4" />
              <span>Historical Risk Trajectory Available</span>
            </div>
            <p className="text-xs text-[#475569] leading-relaxed">
              You have {historyCount} recorded cardiometabolic screenings in your longitudinal timeline. Compare your vitals progression across clinical sessions.
            </p>
            <Link href="/history">
              <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                View Longitudinal Trajectory
              </Button>
            </Link>
          </Card>
        )}

        {/* Action Footer */}
        <div className="p-6 bg-[#0B1F33] text-white rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-extrabold text-base">Keep Your Health Profile Updated</h3>
            <p className="text-xs text-[#94A3B8] mt-0.5">
              Accurate laboratory and vital inputs ensure precise model calibration and relevant lifestyle guidance.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link href="/health-profile">
              <Button variant="teal" size="md">
                Edit Health Profile
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
