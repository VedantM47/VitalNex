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
                  <span>Screening, not diagnosis</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#0F766E]" />
                  <span>Clinician review for high-risk results</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#0F766E]" />
                  <span>Regional Care Connect</span>
                </div>
              </div>
            </div>

            {/* Hero card: what VITALNEX is and is not (no example scores, P0 honesty pass) */}
            <div className="lg:col-span-5 relative">
              <div className="relative bg-white rounded-2xl border border-[#D8E2EA] p-6 shadow-xl space-y-4">
                <p className="text-xs font-bold text-[#0B1F33] border-b border-[#F1F5F9] pb-3">What VITALNEX is</p>
                <ul className="space-y-2 text-xs text-[#475569]">
                  <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-[#0F766E] shrink-0" />A screening and care-navigation aid for diabetes, heart disease and stroke.</li>
                  <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-[#0F766E] shrink-0" />Tells you what kind of care to seek and how soon.</li>
                  <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-[#0F766E] shrink-0" />Available in English, Hindi and Marathi.</li>
                </ul>
                <p className="text-xs font-bold text-[#0B1F33] border-b border-[#F1F5F9] pb-3 pt-2">What it is not</p>
                <ul className="space-y-2 text-xs text-[#475569]">
                  <li className="flex gap-2"><Lock className="w-4 h-4 text-[#B42318] shrink-0" />Not a diagnosis and not a replacement for a doctor.</li>
                  <li className="flex gap-2"><Lock className="w-4 h-4 text-[#B42318] shrink-0" />Never names or doses medicines.</li>
                  <li className="flex gap-2"><Lock className="w-4 h-4 text-[#B42318] shrink-0" />Not yet validated on Indian patients. Accounts are demo accounts.</li>
                </ul>
                <div className="p-3 bg-[#FEF2F2] rounded-xl border border-[#B42318]/20 text-xs text-[#B42318] font-semibold">
                  Emergency? Call 108 / 112 now.
                </div>
                <p className="text-[11px] text-[#64748B]">Project status: MVP in progress. The risk screening is being rebuilt.</p>
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
              Planned for the MVP. Features are being rebuilt; anything not yet working says so in the app.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card hoverable className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-[#0E7490]/10 text-[#0E7490] flex items-center justify-center">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#0B1F33]">1. Clinical Risk Prediction</h3>
              <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
                About 15 simple questions you can answer yourself. Results show a screening level, the main factors and a next step. Being rebuilt on real survey data.
              </p>
            </Card>

            <Card hoverable className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-[#0F766E]/10 text-[#0F766E] flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#0B1F33]">2. AI Trust Passport</h3>
              <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
                A public page explaining how the models work and where they fail. Every number on it will come from the real model cards.
              </p>
            </Card>

            <Card hoverable className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-[#22C1DC]/15 text-[#0B1F33] flex items-center justify-center">
                <Stethoscope className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#0B1F33]">3. Connected Care</h3>
              <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
                Browse demo clinicians by specialty and language and book a demo appointment. All doctors in the MVP are synthetic.
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
                Health predictions should not be trusted on numbers alone. The Trust Passport will explain how the models were built, how well they work and where they fail. It is being rebuilt; no metrics are shown until they are computed.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-2">
                <p className="text-xs font-bold text-[#22C1DC]">Main factors</p>
                <p className="text-xs text-[#CBD5E1]">Planned: the main factors behind each result, in plain language.</p>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-2">
                <p className="text-xs font-bold text-[#22C1DC]">Fairness checks</p>
                <p className="text-xs text-[#CBD5E1]">Planned: how results differ across groups, with the gaps reported openly.</p>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-2">
                <p className="text-xs font-bold text-[#22C1DC]">Knowing when it is unsure</p>
                <p className="text-xs text-[#CBD5E1]">Planned: when the model is not confident, it says so and asks you to see a doctor.</p>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-2">
                <p className="text-xs font-bold text-[#22C1DC]">Safety rules first</p>
                <p className="text-xs text-[#CBD5E1]">Emergency symptoms always override everything and show 108 / 112.</p>
              </div>
            </div>

            <div className="pt-2">
              <Link href="/ai-trust">
                <Button variant="teal" size="md">
                  About the Trust Passport
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
                Available in English, Hindi and Marathi
              </h2>
              <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
                Health technology should leave no one behind. VITALNEX is being built in English, Hindi (हिन्दी) and Marathi (मराठी). Hindi and Marathi medical wording is still awaiting human review.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-[#D8E2EA] p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
                <span className="text-xs font-bold text-[#0B1F33]">Supported Regional Languages</span>
                <span className="text-xs text-[#0F766E] font-medium">3 languages</span>
              </div>
              <div className="space-y-3">
                <div className="p-3 bg-[#F8FAFC] rounded-xl flex items-center justify-between">
                  <span className="text-xs font-medium text-[#0B1F33]">English (en)</span>
                  <span className="text-xs text-[#64748B]">Interface language</span>
                </div>
                <div className="p-3 bg-[#F8FAFC] rounded-xl flex items-center justify-between">
                  <span className="text-xs font-medium text-[#0B1F33]">हिन्दी - Hindi (hi)</span>
                  <span className="text-xs text-[#64748B]">Translation review pending</span>
                </div>
                <div className="p-3 bg-[#F8FAFC] rounded-xl flex items-center justify-between">
                  <span className="text-xs font-medium text-[#0B1F33]">मराठी - Marathi (mr)</span>
                  <span className="text-xs text-[#64748B]">Translation review pending</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 5. CALL TO ACTION SECTION */}
        <section className="px-4 sm:px-8 max-w-7xl mx-auto pb-16">
          <div className="bg-gradient-to-br from-[#0B1F33] to-[#132E4A] rounded-3xl p-8 sm:p-14 text-center text-white space-y-6">
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Try the MVP
            </h2>
            <p className="text-xs sm:text-sm text-[#CBD5E1] max-w-xl mx-auto leading-relaxed">
              Explore the demo with a dummy account. Some features are still being rebuilt and say so.
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
