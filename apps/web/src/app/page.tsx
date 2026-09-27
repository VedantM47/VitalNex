"use client";

import React from "react";
import Link from "next/link";
import {
  Activity,
  ShieldCheck,
  Stethoscope,
  Mic,
  Globe,
  ArrowRight,
  CheckCircle2,
  Lock,
  Cpu,
  HeartHandshake,
  Sparkles,
  BarChart3,
  Users,
} from "lucide-react";
import { BrandLogo } from "../components/layout/BrandLogo";
import { LanguageSelector } from "../components/ui/LanguageSelector";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { StatusBadge, RiskBadge, DemoBadge } from "../components/ui/StatusBadge";
import { Footer } from "../components/layout/Footer";
import { useTranslation } from "../lib/i18n";

export default function LandingPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-[#F7FAFC] flex flex-col selection:bg-[#0E7490] selection:text-white">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#D8E2EA] px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <BrandLogo size="md" />
        <div className="hidden md:flex items-center gap-6 text-xs sm:text-sm font-medium text-[#475569]">
          <a href="#features" className="hover:text-[#0E7490] transition-colors">Capabilities</a>
          <a href="#trust-passport" className="hover:text-[#0E7490] transition-colors">AI Trust Passport</a>
          <a href="#connected-care" className="hover:text-[#0E7490] transition-colors">Connected Care</a>
          <a href="#how-it-works" className="hover:text-[#0E7490] transition-colors">Workflow</a>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSelector variant="compact" />
          <Link href="/dashboard">
            <Button size="sm" variant="primary">
              Enter Platform
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 space-y-24 sm:space-y-32">
        {/* 1. HERO SECTION */}
        <section className="pt-12 sm:pt-20 px-4 sm:px-8 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center gap-2">
                <DemoBadge label="Research & Decision-Support" />
                <span className="text-xs font-semibold text-[#0E7490] tracking-wide uppercase">
                  Continuous Clinical Intelligence
                </span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-[#0B1F33] tracking-tight leading-[1.12]">
                {t("hero.title")}
              </h1>

              <p className="text-base sm:text-lg text-[#475569] leading-relaxed max-w-2xl">
                {t("hero.subtitle")}
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link href="/onboarding">
                  <Button size="lg" variant="primary" rightIcon={<ArrowRight className="w-4 h-4" />}>
                    {t("hero.ctaBuild")}
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button size="lg" variant="outline">
                    {t("hero.ctaExplore")}
                  </Button>
                </Link>
              </div>

              <div className="pt-4 flex flex-wrap items-center gap-6 text-xs text-[#64748B]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#0F766E]" />
                  <span>Calibrated Risk Prediction</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#0F766E]" />
                  <span>11-Dimension AI Trust Passport</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#0F766E]" />
                  <span>Regional Care Connect</span>
                </div>
              </div>
            </div>

            {/* Hero Visual Mockup: Clean Clinical Glass UI, NOT a generic AI Brain */}
            <div className="lg:col-span-5 relative">
              <div className="relative bg-white rounded-2xl border border-[#D8E2EA] p-6 shadow-xl space-y-5">
                {/* Visual Header */}
                <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#0B1F33] text-[#22C1DC] flex items-center justify-center font-bold text-xs">
                      VN
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#0B1F33]">Clinical Decision Snapshot</p>
                      <p className="text-[10px] text-[#64748B]">Patient Profile: PUN_SYN_00001 (Demo)</p>
                    </div>
                  </div>
                  <RiskBadge band="Low" />
                </div>

                {/* Metric Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#D8E2EA]">
                    <p className="text-[11px] text-[#64748B]">Estimated Risk Score</p>
                    <p className="text-xl font-bold text-[#0B1F33]">18.1%</p>
                    <p className="text-[10px] text-[#0F766E] font-medium">95% CI: [13.6 - 22.6]</p>
                  </div>
                  <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#D8E2EA]">
                    <p className="text-[11px] text-[#64748B]">Data Completeness</p>
                    <p className="text-xl font-bold text-[#0E7490]">100%</p>
                    <p className="text-[10px] text-[#64748B]">All 26 Features Validated</p>
                  </div>
                </div>

                {/* Mini SHAP Feature Attribution Indicator */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-[11px] text-[#475569]">
                    <span className="font-medium">Primary Attribution Driver</span>
                    <span className="text-[#0E7490] font-semibold">Resting BP (132 mmHg)</span>
                  </div>
                  <div className="w-full h-2 bg-[#E2E8F0] rounded-full overflow-hidden">
                    <div className="w-2/3 h-full bg-[#0E7490] rounded-full" />
                  </div>
                </div>

                {/* Trust Verification Stamp */}
                <div className="p-3 bg-[#F0FDF4] rounded-xl border border-[#0F766E]/20 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-[#0F766E]">
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <span className="font-semibold">AI Trust Passport Verified</span>
                  </div>
                  <span className="text-[10px] text-[#0F766E] font-medium">Fairness: 94% Parity</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. WHAT VITALNEX DOES */}
        <section id="features" className="px-4 sm:px-8 max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-semibold text-[#0E7490] tracking-wider uppercase">
              End-to-End Clinical Intelligence
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold text-[#0B1F33]">
              From Vitals to Verifiable AI and Connected Care
            </h2>
            <p className="text-sm sm:text-base text-[#475569]">
              Built with rigorous separation of validated clinical inputs, responsible AI guardrails, and real-world regional physician discovery.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card hoverable className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-[#0E7490]/10 text-[#0E7490] flex items-center justify-center">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#0B1F33]">1. Clinical Risk Prediction</h3>
              <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
                Separates validated clinical model features (ECG, blood pressure, fasting sugar) from contextual lifestyle habits to generate calibrated risk intervals.
              </p>
            </Card>

            <Card hoverable className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-[#0F766E]/10 text-[#0F766E] flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#0B1F33]">2. AI Trust Passport</h3>
              <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
                Inspect 11 rigorous dimensions including SHAP explainability, demographic parity across Pune subgroups, uncertainty quantification, and clinical review flags.
              </p>
            </Card>

            <Card hoverable className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-[#22C1DC]/15 text-[#0B1F33] flex items-center justify-center">
                <Stethoscope className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#0B1F33]">3. Connected Care</h3>
              <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
                Transparent physician matching without biased &quot;best doctor&quot; labels. Discover specialists in Kothrud, Baner, and Shivajinagar by language and proximity.
              </p>
            </Card>
          </div>
        </section>

        {/* 3. AI TRUST PASSPORT HIGHLIGHT */}
        <section id="trust-passport" className="px-4 sm:px-8 max-w-7xl mx-auto">
          <div className="bg-[#0B1F33] rounded-3xl p-8 sm:p-12 text-white space-y-8">
            <div className="max-w-2xl space-y-3">
              <span className="text-xs font-semibold text-[#22C1DC] uppercase tracking-wider">
                Explainability & Ethical AI
              </span>
              <h2 className="text-2xl sm:text-4xl font-bold tracking-tight">
                No Black Boxes. Total Transparency with the AI Trust Passport.
              </h2>
              <p className="text-xs sm:text-sm text-[#CBD5E1] leading-relaxed">
                Healthcare predictions cannot be trusted on raw probabilities alone. Every VITALNEX risk calculation generates an immutable AI Trust Passport answering how, why, and with what confidence an assessment was derived.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-2">
                <p className="text-xs font-bold text-[#22C1DC]">Local Attribution</p>
                <p className="text-xs text-[#CBD5E1]">SHAP values pinpoint exactly which vitals drove the risk score.</p>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-2">
                <p className="text-xs font-bold text-[#22C1DC]">Subgroup Fairness</p>
                <p className="text-xs text-[#CBD5E1]">Demographic parity audited across sex, locality, and socioeconomic bands.</p>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-2">
                <p className="text-xs font-bold text-[#22C1DC]">Uncertainty Bounds</p>
                <p className="text-xs text-[#CBD5E1]">Separates data noise (aleatoric) from model knowledge gaps (epistemic).</p>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-2">
                <p className="text-xs font-bold text-[#22C1DC]">Physiological Guardrails</p>
                <p className="text-xs text-[#CBD5E1]">Catches biological anomalies and triggers mandatory clinician review.</p>
              </div>
            </div>

            <div className="pt-2">
              <Link href="/ai-trust">
                <Button variant="teal" size="md">
                  Inspect Trust Passport Architecture
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* 4. MULTILINGUAL & ACCESSIBILITY SECTION */}
        <section className="px-4 sm:px-8 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <span className="text-xs font-semibold text-[#0E7490] tracking-wider uppercase">
                Accessibility For All
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#0B1F33]">
                Multilingual Voice & Screen Reader Native
              </h2>
              <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
                Health technology should leave no one behind. VITALNEX incorporates complete English, Hindi (हिन्दी), and Marathi (मराठी) localization, voice speech-to-text, and WCAG 2.2 AA compliant focus and contrast states.
              </p>
              <div className="flex gap-4 pt-2">
                <Link href="/voice">
                  <Button variant="outline" size="md" leftIcon={<Mic className="w-4 h-4 text-[#0E7490]" />}>
                    Experience Voice Interface
                  </Button>
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#D8E2EA] p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
                <span className="text-xs font-bold text-[#0B1F33]">Supported Regional Languages</span>
                <span className="text-xs text-[#0F766E] font-medium">3 Active Dictionaries</span>
              </div>
              <div className="space-y-3">
                <div className="p-3 bg-[#F8FAFC] rounded-xl flex items-center justify-between">
                  <span className="text-xs font-medium text-[#0B1F33]">English (en)</span>
                  <span className="text-xs text-[#64748B]">Complete Clinical Terminology</span>
                </div>
                <div className="p-3 bg-[#F8FAFC] rounded-xl flex items-center justify-between">
                  <span className="text-xs font-medium text-[#0B1F33]">हिन्दी - Hindi (hi)</span>
                  <span className="text-xs text-[#64748B]">Devanagari Typography & Voice</span>
                </div>
                <div className="p-3 bg-[#F8FAFC] rounded-xl flex items-center justify-between">
                  <span className="text-xs font-medium text-[#0B1F33]">मराठी - Marathi (mr)</span>
                  <span className="text-xs text-[#64748B]">Maharashtra Regional Healthcare</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 5. CALL TO ACTION SECTION */}
        <section className="px-4 sm:px-8 max-w-7xl mx-auto pb-16">
          <div className="bg-gradient-to-br from-[#0B1F33] to-[#132E4A] rounded-3xl p-8 sm:p-14 text-center text-white space-y-6">
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Ready to experience modern healthcare intelligence?
            </h2>
            <p className="text-xs sm:text-sm text-[#CBD5E1] max-w-xl mx-auto leading-relaxed">
              Step into VITALNEX to configure your profile, test transparent clinical risk screening, and verify responsible AI governance.
            </p>
            <div className="flex justify-center gap-4 pt-2">
              <Link href="/onboarding">
                <Button size="lg" variant="teal">
                  Start Multi-Step Onboarding
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                  Launch Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
