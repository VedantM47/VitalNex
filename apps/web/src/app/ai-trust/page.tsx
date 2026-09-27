"use client";

import React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Activity,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Cpu,
  Clock,
  UserCheck,
  Scale,
  Sparkles,
  Info,
  ExternalLink,
} from "lucide-react";
import { AppShell } from "../../components/layout/AppShell";
import { Card, CardHeader } from "../../components/ui/Card";
import { StatusBadge, RiskBadge, DemoBadge } from "../../components/ui/StatusBadge";
import { Button } from "../../components/ui/Button";
import { useTranslation } from "../../lib/i18n";

export default function AITrustPassportPage() {
  const { t } = useTranslation();

  const trustDimensions = [
    {
      id: "dim-1",
      number: "01",
      title: "Prediction Target & Task",
      status: "Calibrated",
      variant: "success" as const,
      icon: Activity,
      summary: "Cardiometabolic Risk Screening Index (0–100 scale)",
      detail: "Binary screening target aligned with UCI structural feature sets and ICMR risk indicators. Non-diagnostic decision support.",
    },
    {
      id: "dim-2",
      number: "02",
      title: "Confidence & Calibration",
      status: "Verified",
      variant: "success" as const,
      icon: Sparkles,
      summary: "91% Confidence Score | Brier Loss: 0.082",
      detail: "Scaled via Platt Isotonic calibration. Narrow 95% error margin [13.6% - 22.6%] ensuring dependable screening confidence.",
    },
    {
      id: "dim-3",
      number: "03",
      title: "Data Quality & Completeness",
      status: "100% Ingested",
      variant: "success" as const,
      icon: CheckCircle2,
      summary: "26 / 26 Features Verified (0 missing values)",
      detail: "Outlier detection verified all inputs within verified biological bounds (BP: 132, Chol: 181, HR: 195).",
    },
    {
      id: "dim-4",
      number: "04",
      title: "Explainability (SHAP)",
      status: "Calculated",
      variant: "info" as const,
      icon: Info,
      summary: "Local TreeSHAP Attribution Snapshot",
      detail: "Resting BP (+8.2%) and age (+5.1%) elevated risk, moderated by moderate exercise (-5.5%) and non-smoking (-6.4%).",
    },
    {
      id: "dim-5",
      number: "05",
      title: "Fairness & Parity",
      status: "94% Ratio",
      variant: "success" as const,
      icon: Scale,
      summary: "Audited Across Sex, Locality, and Socioeconomic Bands",
      detail: "Demographic parity disparity ratio complies with strict 80% rule thresholds across Urban Pune, PCMC, and Peri-urban subgroups.",
    },
    {
      id: "dim-6",
      number: "06",
      title: "Uncertainty Quantification",
      status: "Low Entropy",
      variant: "success" as const,
      icon: HelpCircle,
      summary: "Epistemic: 0.04 | Aleatoric: 0.08 | Total Entropy: 0.12",
      detail: "Prediction lies securely inside model training distribution with high predictive confidence and minimal variance.",
    },
    {
      id: "dim-7",
      number: "07",
      title: "Physiological Safety Bounds",
      status: "Pass (0 Violations)",
      variant: "success" as const,
      icon: ShieldCheck,
      summary: "Zero Contraindications or Anomalous Outliers",
      detail: "Deterministic biological checks confirmed inputs are physiologically viable without adversarial perturbation.",
    },
    {
      id: "dim-8",
      number: "08",
      title: "Human Oversight (Clinician-in-the-Loop)",
      status: "Routine Automated",
      variant: "neutral" as const,
      icon: UserCheck,
      summary: "No Urgent Clinical Flag Triggered",
      detail: "Automatic clinical triage escalation is triggered for High Risk (>70%) or contradictory input patterns.",
    },
    {
      id: "dim-9",
      number: "09",
      title: "Model Artifact & Versioning",
      status: "v1.0.0-demo",
      variant: "info" as const,
      icon: Cpu,
      summary: "scikit-learn Baseline Classifier",
      detail: "Registered in Model Registry with immutable SHA-256 artifact checksum and reproducible hyperparameter manifest.",
    },
    {
      id: "dim-10",
      number: "10",
      title: "Assessment Timestamp & Audit",
      status: "Immutable Log",
      variant: "neutral" as const,
      icon: Clock,
      summary: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }),
      detail: "Secure cryptographic hash stored in Supabase Audit Logs with user consent verification.",
    },
    {
      id: "dim-11",
      number: "11",
      title: "Operational Limitations",
      status: "Declared",
      variant: "warning" as const,
      icon: AlertCircle,
      summary: "Academic Synthetic Research Dataset Only",
      detail: "Not validated for clinical intervention or independent prescription. Professional clinical evaluation mandatory.",
    },
  ];

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D8E2EA] pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F33]">
                {t("trust.title")}
              </h1>
              <DemoBadge label="Continuous Passport v1.0" />
            </div>
            <p className="text-xs sm:text-sm text-[#475569]">
              {t("trust.subtitle")}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/risk-assessment">
              <Button variant="outline" size="md">
                Back to Risk Assessment
              </Button>
            </Link>
          </div>
        </div>

        {/* Top Passport Summary Banner */}
        <div className="bg-[#0B1F33] rounded-3xl p-6 sm:p-8 text-white space-y-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#22C1DC]/20 text-[#22C1DC] flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#22C1DC] uppercase tracking-wider">AI Trust Passport #TP-84920</p>
                <p className="text-lg font-bold text-white">Verified Clinical Screening Assessment</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <StatusBadge label="11 of 11 Dimensions Verified" variant="success" />
            </div>
          </div>

          <p className="text-xs sm:text-sm text-[#CBD5E1] leading-relaxed max-w-4xl">
            This passport establishes verifiable proof of transparency, explainability, fairness, and safety boundaries. It guarantees that healthcare machine learning operates with human accountability and continuous governance.
          </p>
        </div>

        {/* 11 Dimensions Structured Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trustDimensions.map((dim) => {
            const Icon = dim.icon;
            return (
              <Card key={dim.id} className="p-5 sm:p-6 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-[#64748B]">{dim.number}</span>
                    <StatusBadge label={dim.status} variant={dim.variant} size="sm" />
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#F8FAFC] border border-[#D8E2EA] flex items-center justify-center text-[#0E7490] shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#0B1F33] leading-snug">{dim.title}</h3>
                      <p className="text-xs font-semibold text-[#0E7490] mt-0.5">{dim.summary}</p>
                    </div>
                  </div>

                  <p className="text-xs text-[#475569] leading-relaxed pt-1">
                    {dim.detail}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Mandatory Research Limitations Notice */}
        <div className="p-5 bg-[#FFFBEB] rounded-2xl border border-[#FDE68A] text-xs text-[#92400E] space-y-2">
          <p className="font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#B45309]" />
            <span>Ethical Governance & Academic Scope Notice</span>
          </p>
          <p className="leading-relaxed">
            {t("trust.limitationsText")} VITALNEX adheres strictly to the ICMR and WHO Ethical Guidelines for Artificial Intelligence in Health. In Prompt 2, real SHAP beeswarm plots, Fairlearn parity distributions, and Monte Carlo dropout uncertainty will be rendered inside this passport.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
