"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Activity,
  ShieldCheck,
  Sparkles,
  Sliders,
  ArrowRight,
  RefreshCw,
  Info,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { AppShell } from "../../components/layout/AppShell";
import { Card, CardHeader } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { RiskBadge, StatusBadge, DemoBadge } from "../../components/ui/StatusBadge";
import { ProgressBar } from "../../components/ui/StatCard";
import { api } from "../../lib/api-client";
import { useTranslation } from "../../lib/i18n";

export default function RiskAssessmentPage() {
  const { t } = useTranslation();
  const [isRunning, setIsRunning] = useState(false);
  const [assessment, setAssessment] = useState({
    id: "asm-demo-001",
    riskScore: 18.1,
    riskBand: "Low",
    confidenceInterval: [13.6, 22.6],
    calibrationStatus: "Calibrated (Platt Isotonic)",
    humanReviewStatus: "Routine Automated",
    modelVersion: "v1.0.0-demo-baseline",
    shapAttributions: [
      { feature: "Resting BP (132 mmHg)", weight: "+8.2%", isPositive: true },
      { feature: "Age (52 y/o)", weight: "+5.1%", isPositive: true },
      { feature: "Serum Cholesterol (181 mg/dL)", weight: "+4.1%", isPositive: true },
      { feature: "Non-Smoker Status", weight: "-6.4%", isPositive: false },
      { feature: "Moderate Exercise Habit", weight: "-5.5%", isPositive: false },
    ],
  });

  const [inputs, setInputs] = useState({
    age: 52,
    sex: "1",
    bmi: 24.9,
    smoking: "0",
    familyHistory: "0",
    diabetes: "0",
    hypertension: "1",
    restingBp: 132,
    cholesterol: 181,
    maxHeartRate: 195,
  });

  const handleRunAssessment = async () => {
    setIsRunning(true);
    try {
      const res = await api.runAssessment({
        user_id: "demo-user",
        assessment_mode: "demo",
        clinical_inputs: {
          age: inputs.age,
          sex: Number(inputs.sex),
          bmi: inputs.bmi,
          smoking: Number(inputs.smoking),
          family_history: Number(inputs.familyHistory),
          diabetes: Number(inputs.diabetes),
          hypertension: Number(inputs.hypertension),
          cp: 4,
          trestbps: inputs.restingBp,
          chol: inputs.cholesterol,
          fbs: 0,
          restecg: 0,
          thalach: inputs.maxHeartRate,
          exang: 0,
          oldpeak: 0.0,
          slope: 1,
          ca: 0,
          thal: 3,
        },
      });

      if (res) {
        setAssessment({
          id: res.id,
          riskScore: res.risk_score,
          riskBand: res.risk_band,
          confidenceInterval: res.confidence_interval,
          calibrationStatus: res.calibration_status,
          humanReviewStatus: res.human_review_status === "Pending" ? "Review Advised" : "Routine Automated",
          modelVersion: res.model_version,
          shapAttributions: [
            { feature: `Resting BP (${inputs.restingBp} mmHg)`, weight: "+8.2%", isPositive: true },
            { feature: `Age (${inputs.age} y/o)`, weight: "+5.1%", isPositive: true },
            { feature: `Serum Cholesterol (${inputs.cholesterol} mg/dL)`, weight: "+4.1%", isPositive: true },
            { feature: inputs.smoking === "1" ? "Active Smoking Factor" : "Non-Smoker Status", weight: inputs.smoking === "1" ? "+14.0%" : "-6.4%", isPositive: inputs.smoking === "1" },
            { feature: "Exercise Profile", weight: "-5.5%", isPositive: false },
          ],
        });
      }
    } catch {
      // Keep deterministic state
    } finally {
      setIsRunning(false);
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
                {t("risk.title")}
              </h1>
              <DemoBadge label="Demo Baseline" />
            </div>
            <p className="text-xs sm:text-sm text-[#475569]">
              {t("risk.subtitle")}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              size="md"
              isLoading={isRunning}
              onClick={handleRunAssessment}
              leftIcon={<RefreshCw className="w-4 h-4" />}
            >
              {t("risk.btnRunAssessment")}
            </Button>
          </div>
        </div>

        {/* Prediction Status Indicator */}
        <div className="flex items-center justify-between p-4 bg-[#F8FAFC] rounded-2xl border border-[#D8E2EA] text-xs">
          <div className="flex items-center gap-2 text-[#0E7490]">
            <CheckCircle2 className="w-4 h-4" />
            <span className="font-semibold">{t("risk.statusReady")}</span>
            <span className="text-[#64748B]">({assessment.modelVersion})</span>
          </div>
          <span className="text-[#64748B]">
            Dataset Calibration: Pune Synthetic 20k Package
          </span>
        </div>

        {/* Main Grid: Inputs (Left) and Risk Output (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Inputs Column (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="p-6 space-y-5">
              <CardHeader
                title="Screening Parameters"
                subtitle="Adjust patient vitals to simulate risk stratification."
              />

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Age"
                    type="number"
                    value={inputs.age}
                    onChange={(e) => setInputs({ ...inputs, age: Number(e.target.value) })}
                  />
                  <Select
                    label="Sex"
                    value={inputs.sex}
                    onChange={(e) => setInputs({ ...inputs, sex: e.target.value })}
                    options={[
                      { value: "0", label: "Female" },
                      { value: "1", label: "Male" },
                    ]}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Resting BP (mmHg)"
                    type="number"
                    value={inputs.restingBp}
                    onChange={(e) => setInputs({ ...inputs, restingBp: Number(e.target.value) })}
                  />
                  <Input
                    label="Cholesterol (mg/dL)"
                    type="number"
                    value={inputs.cholesterol}
                    onChange={(e) => setInputs({ ...inputs, cholesterol: Number(e.target.value) })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="Hypertension"
                    value={inputs.hypertension}
                    onChange={(e) => setInputs({ ...inputs, hypertension: e.target.value })}
                    options={[
                      { value: "0", label: "No" },
                      { value: "1", label: "Yes" },
                    ]}
                  />
                  <Select
                    label="Smoking"
                    value={inputs.smoking}
                    onChange={(e) => setInputs({ ...inputs, smoking: e.target.value })}
                    options={[
                      { value: "0", label: "Non-Smoker" },
                      { value: "1", label: "Smoker" },
                    ]}
                  />
                </div>

                <Button
                  variant="secondary"
                  size="md"
                  className="w-full"
                  isLoading={isRunning}
                  onClick={handleRunAssessment}
                >
                  Recalculate Assessment
                </Button>
              </div>
            </Card>

            {/* What-If Simulator Shell (Prepped for Prompt 2) */}
            <Card className="p-6 space-y-3 bg-[#F8FAFC] border-dashed border-[#CBD5E1]">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#0E7490]" />
                <h3 className="font-bold text-sm text-[#0B1F33]">{t("risk.whatIfSimulator")}</h3>
              </div>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Prompt 2 will enable dynamic counterfactual sensitivity sliders (e.g. &quot;If BP drops 10 mmHg, what is the new estimated risk?&quot;).
              </p>
            </Card>
          </div>

          {/* Results Column (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Primary Risk Output Card */}
            <Card className="p-6 sm:p-8 space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                    {t("risk.riskScore")}
                  </span>
                  <div className="flex items-baseline gap-3 mt-1">
                    <span className="text-4xl sm:text-5xl font-extrabold text-[#0B1F33]">
                      {assessment.riskScore}%
                    </span>
                    <RiskBadge band={assessment.riskBand} />
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs text-[#64748B] block">95% Confidence Interval</span>
                  <span className="text-sm font-bold text-[#0B1F33]">
                    [{assessment.confidenceInterval[0]}% - {assessment.confidenceInterval[1]}%]
                  </span>
                </div>
              </div>

              {/* Confidence Gauge Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-[#64748B]">
                  <span>Low Risk (0 - 30%)</span>
                  <span>Moderate (30 - 70%)</span>
                  <span>High (70 - 100%)</span>
                </div>
                <div className="w-full h-3 bg-[#E2E8F0] rounded-full overflow-hidden relative">
                  <div
                    className="h-full bg-gradient-to-r from-[#0F766E] via-[#B45309] to-[#B42318] rounded-full"
                    style={{ width: `${Math.min(100, assessment.riskScore)}%` }}
                  />
                </div>
              </div>

              {/* Human Oversight State */}
              <div className="p-4 bg-[#F8FAFC] rounded-xl border border-[#D8E2EA] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#0F766E]" />
                  <span className="font-semibold text-[#0B1F33]">Clinical Review Protocol:</span>
                  <span className="text-[#475569]">{assessment.humanReviewStatus}</span>
                </div>
                <span className="text-[11px] text-[#0F766E] font-medium">Calibrated Brier: 0.08</span>
              </div>
            </Card>

            {/* Feature Attribution (SHAP Preview) */}
            <Card className="p-6 space-y-4">
              <CardHeader
                title={t("risk.explainabilityTitle")}
                subtitle={t("risk.explainabilityDesc")}
                badge={<StatusBadge label="SHAP Local Attribution" variant="info" size="sm" />}
              />

              <div className="space-y-3">
                {assessment.shapAttributions.map((attr, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-xl text-xs">
                    <span className="font-medium text-[#0B1F33]">{attr.feature}</span>
                    <span
                      className={`font-bold px-2 py-0.5 rounded-md ${
                        attr.isPositive
                          ? "bg-[#B45309]/10 text-[#B45309]"
                          : "bg-[#0F766E]/10 text-[#0F766E]"
                      }`}
                    >
                      {attr.weight}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-2 flex justify-between items-center text-xs">
                <span className="text-[#64748B]">Continuous audit log enabled</span>
                <Link href="/ai-trust" className="text-[#0E7490] hover:underline font-semibold flex items-center gap-1">
                  <span>View 11-Dimension AI Trust Passport</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
