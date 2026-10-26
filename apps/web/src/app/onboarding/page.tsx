"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  Heart,
  Activity,
  Apple,
  MapPin,
  Settings,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Mic,
  Shield,
} from "lucide-react";
import { BrandLogo } from "../../components/layout/BrandLogo";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { ProgressBar } from "../../components/ui/StatCard";
import { useTranslation } from "../../lib/i18n";

export default function OnboardingPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const totalSteps = 8;

  // Onboarding form state
  const [formData, setFormData] = useState({
    fullName: "Rajesh Sharma",
    age: 48,
    sex: "1",
    heightCm: 172,
    weightKg: 75,
    bloodGroup: "B+",
    smoking: "0",
    physicalActivity: "Moderate",
    sedentaryHours: 6.5,
    sleepHours: 7,
    dietQuality: "Moderate",
    dietPattern: "Mixed",
    hypertension: "1",
    diabetes: "0",
    familyHistory: "1",
    restingBp: "",
    cholesterol: "",
    locality: "Urban_Pune",
    preferredLanguage: "en",
    consentHealthData: false,
  });

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      router.push("/dashboard");
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <div className="min-h-screen bg-[#F7FAFC] flex flex-col justify-between p-4 sm:p-8">
      {/* Top Header */}
      <header className="max-w-3xl mx-auto w-full flex items-center justify-between pb-6 border-b border-[#D8E2EA]">
        <BrandLogo size="sm" />
        <Link
          href="/voice"
          className="inline-flex items-center gap-1.5 text-xs text-[#0E7490] hover:underline font-medium"
        >
          <Mic className="w-4 h-4" />
          <span>Prefer voice onboarding?</span>
        </Link>
      </header>

      {/* Main Wizard Container */}
      <main className="max-w-2xl mx-auto w-full my-auto py-8">
        <div className="space-y-6">
          {/* Progress Tracker */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-semibold text-[#475569]">
              <span className="uppercase tracking-wider text-[#0E7490]">
                {t("onboarding.step")} {step} {t("onboarding.of")} {totalSteps}
              </span>
              <span>{Math.round((step / totalSteps) * 100)}% Completed</span>
            </div>
            <ProgressBar value={step} max={totalSteps} showPercentage={false} />
          </div>

          <Card className="p-6 sm:p-8 shadow-sm">
            {/* Step 1: Welcome & Overview */}
            {step === 1 && (
              <div className="space-y-5 text-center sm:text-left">
                <div className="w-12 h-12 rounded-2xl bg-[#0E7490]/10 text-[#0E7490] flex items-center justify-center">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-[#0B1F33]">
                    Welcome to VITALNEX Health Intelligence
                  </h2>
                  <p className="text-xs sm:text-sm text-[#475569] mt-1.5 leading-relaxed">
                    We will guide you through setting up your health baseline. Information is strictly separated into validated clinical inputs and lifestyle factors so you have total transparency into your data.
                  </p>
                </div>
                <div className="p-3.5 bg-[#F8FAFC] rounded-xl border border-[#D8E2EA] flex items-start gap-3 text-xs text-[#475569]">
                  <CheckCircle2 className="w-4 h-4 text-[#0F766E] shrink-0 mt-0.5" />
                  <span>
                    Your privacy is protected. Data is governed under strict Row-Level Security (RLS) and will never be shared without your explicit consent.
                  </span>
                </div>
              </div>
            )}

            {/* Step 2: Basic Profile */}
            {step === 2 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-[#0B1F33]">Basic Demographics</h2>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    Basic details about you.
                  </p>
                </div>
                <div className="space-y-4">
                  <Input
                    label="Full Name"
                    value={formData.fullName}
                    onChange={(e) => handleChange("fullName", e.target.value)}
                    required
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Age in Years"
                      type="number"
                      value={formData.age}
                      onChange={(e) => handleChange("age", Number(e.target.value))}
                      required
                    />
                    <Select
                      label="Sex"
                      value={formData.sex}
                      onChange={(e) => handleChange("sex", e.target.value)}
                      options={[
                        { value: "0", label: "Female" },
                        { value: "1", label: "Male" },
                      ]}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Height (cm)"
                      type="number"
                      value={formData.heightCm}
                      onChange={(e) => handleChange("heightCm", Number(e.target.value))}
                    />
                    <Input
                      label="Weight (kg)"
                      type="number"
                      value={formData.weightKg}
                      onChange={(e) => handleChange("weightKg", Number(e.target.value))}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Lifestyle */}
            {step === 3 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-[#0B1F33]">Lifestyle Factors</h2>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    Habits and daily patterns that provide contextual health intelligence.
                  </p>
                </div>
                <div className="space-y-4">
                  <Select
                    label="Physical Activity Level"
                    value={formData.physicalActivity}
                    onChange={(e) => handleChange("physicalActivity", e.target.value)}
                    options={[
                      { value: "Low", label: "Low (Sedentary, minimal exercise)" },
                      { value: "Moderate", label: "Moderate (30+ mins walking or workout)" },
                      { value: "High", label: "High (Rigorous active daily training)" },
                    ]}
                  />
                  <Select
                    label="Tobacco / Smoking"
                    value={formData.smoking}
                    onChange={(e) => handleChange("smoking", e.target.value)}
                    options={[
                      { value: "0", label: "Non-Smoker (No active tobacco use)" },
                      { value: "1", label: "Active Smoker (Regular tobacco use)" },
                    ]}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Sedentary Hours / Day"
                      type="number"
                      value={formData.sedentaryHours}
                      onChange={(e) => handleChange("sedentaryHours", Number(e.target.value))}
                    />
                    <Input
                      label="Sleep Hours / Night"
                      type="number"
                      value={formData.sleepHours}
                      onChange={(e) => handleChange("sleepHours", Number(e.target.value))}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Nutrition & Diet */}
            {step === 4 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-[#0B1F33]">Nutrition & Diet Quality</h2>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    Informs cardiometabolic lifestyle recommendations.
                  </p>
                </div>
                <div className="space-y-4">
                  <Select
                    label="Diet Pattern"
                    value={formData.dietPattern}
                    onChange={(e) => handleChange("dietPattern", e.target.value)}
                    options={[
                      { value: "Vegetarian", label: "Vegetarian" },
                      { value: "Non-Vegetarian", label: "Non-Vegetarian" },
                      { value: "Vegan", label: "Vegan" },
                      { value: "Mixed", label: "Mixed / Balanced" },
                    ]}
                  />
                  <Select
                    label="General Diet Quality"
                    value={formData.dietQuality}
                    onChange={(e) => handleChange("dietQuality", e.target.value)}
                    options={[
                      { value: "Healthy", label: "Healthy (High whole foods & vegetables)" },
                      { value: "Moderate", label: "Moderate (Occasional processed items)" },
                      { value: "Needs_Improvement", label: "Needs Improvement (Frequent fried/refined foods)" },
                    ]}
                  />
                </div>
              </div>
            )}

            {/* Step 5: Clinical Background */}
            {step === 5 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-[#0B1F33]">Clinical Indicators</h2>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    Validated medical model features. Leave resting estimates if you haven&apos;t had recent lab work.
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Select
                      label="Hypertension"
                      value={formData.hypertension}
                      onChange={(e) => handleChange("hypertension", e.target.value)}
                      options={[
                        { value: "0", label: "No diagnosed hypertension" },
                        { value: "1", label: "Yes (Diagnosed)" },
                      ]}
                    />
                    <Select
                      label="Diabetes Mellitus"
                      value={formData.diabetes}
                      onChange={(e) => handleChange("diabetes", e.target.value)}
                      options={[
                        { value: "0", label: "No diagnosed diabetes" },
                        { value: "1", label: "Yes (Diagnosed)" },
                      ]}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Resting Blood Pressure (mm Hg)"
                      type="number"
                      value={formData.restingBp}
                      onChange={(e) => handleChange("restingBp", Number(e.target.value))}
                      helperText="Default 120-135 if not measured"
                    />
                    <Input
                      label="Serum Cholesterol (mg/dL)"
                      type="number"
                      value={formData.cholesterol}
                      onChange={(e) => handleChange("cholesterol", Number(e.target.value))}
                      helperText="Standard lab reference ~190"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 6: Regional Context */}
            {step === 6 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-[#0B1F33]">Regional Healthcare Context</h2>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    Aligns you with regional healthcare facilities and clinic proximity.
                  </p>
                </div>
                <div className="space-y-4">
                  <Select
                    label="Locality / Region"
                    value={formData.locality}
                    onChange={(e) => handleChange("locality", e.target.value)}
                    options={[
                      { value: "Urban_Pune", label: "Urban Pune (Shivajinagar, Kothrud, Deccan)" },
                      { value: "PCMC", label: "Pimpri-Chinchwad (PCMC, Akurdi, Wakad)" },
                      { value: "Peri_Urban_Pune", label: "Peri-Urban Pune (Baner, Hinjawadi, Wagholi)" },
                      { value: "Rural_Maharashtra", label: "Rural Maharashtra District" },
                    ]}
                  />
                </div>
              </div>
            )}

            {/* Step 7: Preferences & Consent */}
            {step === 7 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-[#0B1F33]">Language & Consent</h2>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    Configure your language and verify ethical data governance.
                  </p>
                </div>
                <div className="space-y-4">
                  <Select
                    label="Preferred Language"
                    value={formData.preferredLanguage}
                    onChange={(e) => handleChange("preferredLanguage", e.target.value)}
                    options={[
                      { value: "en", label: "English" },
                      { value: "hi", label: "हिन्दी (Hindi)" },
                      { value: "mr", label: "मराठी (Marathi)" },
                    ]}
                  />
                  <div className="p-4 bg-[#F8FAFC] rounded-xl border border-[#D8E2EA] flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="consent"
                      checked={formData.consentHealthData}
                      onChange={(e) => handleChange("consentHealthData", e.target.checked)}
                      className="mt-1 w-4 h-4 rounded text-[#0E7490] focus:ring-[#0E7490]"
                    />
                    <label htmlFor="consent" className="text-xs text-[#475569] leading-relaxed">
                      I agree to the continuous screening prototype terms. I acknowledge that VITALNEX is a research decision-support tool and not a clinical diagnosis replacement.
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Step 8: Review & Complete */}
            {step === 8 && (
              <div className="space-y-5">
                <div className="w-12 h-12 rounded-2xl bg-[#0F766E]/10 text-[#0F766E] flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-[#0B1F33]">Review Health Baseline</h2>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    Your baseline is structured and ready for your first transparent clinical risk assessment.
                  </p>
                </div>
                <div className="p-4 bg-[#F8FAFC] rounded-xl border border-[#D8E2EA] space-y-2 text-xs text-[#475569]">
                  <div className="flex justify-between border-b border-[#E2E8F0] pb-2">
                    <span className="font-semibold text-[#0B1F33]">Patient:</span>
                    <span>{formData.fullName} ({formData.age} y/o)</span>
                  </div>
                  <div className="flex justify-between border-b border-[#E2E8F0] pb-2">
                    <span className="font-semibold text-[#0B1F33]">Locality:</span>
                    <span>{formData.locality}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#E2E8F0] pb-2">
                    <span className="font-semibold text-[#0B1F33]">Blood Pressure / Cholesterol:</span>
                    <span>{formData.restingBp} mmHg / {formData.cholesterol} mg/dL</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-[#0B1F33]">Data Completeness:</span>
                    <span className="text-[#475569]">Not checked yet</span>
                  </div>
                </div>
              </div>
            )}

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-6 border-t border-[#F1F5F9] mt-6">
              {step > 1 ? (
                <Button variant="outline" size="md" onClick={handleBack} leftIcon={<ArrowLeft className="w-4 h-4" />}>
                  {t("onboarding.btnBack")}
                </Button>
              ) : (
                <div />
              )}
              <Button
                variant="primary"
                size="md"
                onClick={handleNext}
                rightIcon={step < totalSteps ? <ArrowRight className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
              >
                {step < totalSteps ? t("onboarding.btnNext") : t("onboarding.btnFinish")}
              </Button>
            </div>
          </Card>
        </div>
      </main>

      <footer className="text-center text-xs text-[#94A3B8] pt-4">
        Protected under VITALNEX Responsible AI Governance Framework.
      </footer>
    </div>
  );
}
