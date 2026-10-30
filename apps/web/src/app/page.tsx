"use client";

// Public landing page (SPEC §1.1 roles: public). What VITALNEX is and is not, what it does, and
// links to the Trust Passport and sign-in. No example scores and no metrics are shown here.

import React from "react";
import Link from "next/link";
import { Activity, ArrowRight, BookOpen, CheckCircle2, Globe, Lock, ShieldCheck, Stethoscope, Users } from "lucide-react";
import { BrandLogo } from "../components/layout/BrandLogo";
import { LanguageSelector } from "../components/ui/LanguageSelector";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { DemoBadge } from "../components/ui/StatusBadge";
import { Footer } from "../components/layout/Footer";
import { SUPPORTED_LANGUAGES, useTranslation } from "../lib/i18n";
import { getDoc } from "../content/docs";

export default function LandingPage() {
  const { t } = useTranslation();

  const features = [
    { Icon: Activity, title: "landing.f1Title", body: "landing.f1Body", cls: "bg-[#0E7490]/10 text-[#0E7490]" },
    { Icon: ShieldCheck, title: "landing.f2Title", body: "landing.f2Body", cls: "bg-[#0F766E]/10 text-[#0F766E]" },
    { Icon: Stethoscope, title: "landing.f3Title", body: "landing.f3Body", cls: "bg-[#22C1DC]/15 text-[#0B1F33]" },
  ];
  const trustPoints = ["t1", "t2", "t3", "t4"];

  return (
    <div className="flex min-h-screen flex-col bg-[#F7FAFC] selection:bg-[#0E7490] selection:text-white">
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-[#D8E2EA] bg-white/95 px-4 py-3.5 backdrop-blur-md sm:px-8">
        <BrandLogo size="md" />
        <nav className="hidden items-center gap-6 text-xs font-medium text-[#475569] sm:text-sm md:flex">
          <a href="#features" className="transition-colors hover:text-[#0E7490]">{t("landing.navFeatures")}</a>
          <a href="#trust-passport" className="transition-colors hover:text-[#0E7490]">{t("landing.navTrust")}</a>
          <a href="#languages" className="transition-colors hover:text-[#0E7490]">{t("landing.navLanguages")}</a>
          <Link href="/documentation" className="transition-colors hover:text-[#0E7490]">{t("landing.navDocs")}</Link>
        </nav>
        <div className="flex items-center gap-3">
          <LanguageSelector variant="compact" />
          <Link href="/dashboard">
            <Button size="sm" variant="primary">{t("landing.open")}</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 space-y-24 sm:space-y-32">
        <section className="mx-auto max-w-7xl px-4 pt-12 sm:px-8 sm:pt-20">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-8">
            <div className="space-y-6 text-left lg:col-span-7">
              <div className="inline-flex flex-wrap items-center gap-2">
                <DemoBadge label={t("landing.badge")} />
                <span className="text-xs font-semibold uppercase tracking-wide text-[#0E7490]">{t("landing.kicker")}</span>
              </div>
              <h1 className="text-3xl font-extrabold leading-[1.12] tracking-tight text-[#0B1F33] sm:text-5xl lg:text-6xl">
                {t("landing.title")}
              </h1>
              <p className="max-w-2xl text-base leading-relaxed text-[#475569] sm:text-lg">{t("landing.subtitle")}</p>
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link href="/onboarding">
                  <Button size="lg" variant="primary" rightIcon={<ArrowRight className="h-4 w-4" />}>
                    {t("landing.ctaStart")}
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button size="lg" variant="outline">{t("landing.ctaDashboard")}</Button>
                </Link>
              </div>
              <ul className="flex flex-wrap items-center gap-6 pt-4 text-xs text-[#64748B]">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#0F766E]" aria-hidden="true" />
                  {t("landing.point1")}
                </li>
                <li className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-[#0F766E]" aria-hidden="true" />
                  {t("landing.point2")}
                </li>
                <li className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-[#0F766E]" aria-hidden="true" />
                  {t("landing.point3")}
                </li>
              </ul>
            </div>

            <div className="lg:col-span-5">
              <div className="space-y-4 rounded-2xl border border-[#D8E2EA] bg-white p-6 shadow-xl">
                <p className="border-b border-[#F1F5F9] pb-3 text-xs font-bold text-[#0B1F33]">{t("landing.isTitle")}</p>
                <ul className="space-y-2 text-xs text-[#475569]">
                  {["is1", "is2", "is3"].map((k) => (
                    <li key={k} className="flex gap-2">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-[#0F766E]" aria-hidden="true" />
                      {t(`landing.${k}`)}
                    </li>
                  ))}
                </ul>
                <p className="border-b border-[#F1F5F9] pb-3 pt-2 text-xs font-bold text-[#0B1F33]">{t("landing.notTitle")}</p>
                <ul className="space-y-2 text-xs text-[#475569]">
                  {["not1", "not2", "not3"].map((k) => (
                    <li key={k} className="flex gap-2">
                      <Lock className="h-4 w-4 shrink-0 text-[#B42318]" aria-hidden="true" />
                      {t(`landing.${k}`)}
                    </li>
                  ))}
                </ul>
                <p className="rounded-xl border border-[#B42318]/20 bg-[#FEF2F2] p-3 text-xs font-semibold text-[#B42318]">
                  {t("landing.emergency")}
                </p>
                <p className="text-[11px] text-[#64748B]">{t("landing.status")}</p>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="mx-auto max-w-7xl space-y-12 px-4 sm:px-8">
          <div className="mx-auto max-w-2xl space-y-3 text-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#0E7490]">{t("landing.featuresKicker")}</span>
            <h2 className="text-2xl font-bold text-[#0B1F33] sm:text-4xl">{t("landing.featuresTitle")}</h2>
            <p className="text-sm text-[#475569] sm:text-base">{t("landing.featuresIntro")}</p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {features.map(({ Icon, title, body, cls }) => (
              <Card key={title} hoverable className="space-y-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${cls}`}>
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-bold text-[#0B1F33]">{t(title)}</h3>
                <p className="text-xs leading-relaxed text-[#475569] sm:text-sm">{t(body)}</p>
              </Card>
            ))}
          </div>
        </section>

        <section id="trust-passport" className="mx-auto max-w-7xl px-4 sm:px-8">
          <div className="space-y-8 rounded-3xl bg-[#0B1F33] p-8 text-white sm:p-12">
            <div className="max-w-2xl space-y-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#22C1DC]">{t("landing.trustKicker")}</span>
              <h2 className="text-2xl font-bold tracking-tight sm:text-4xl">{t("landing.trustTitle")}</h2>
              <p className="text-xs leading-relaxed text-[#CBD5E1] sm:text-sm">{t("landing.trustBody")}</p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {trustPoints.map((k) => (
                <div key={k} className="space-y-2 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs font-bold text-[#22C1DC]">{t(`landing.${k}Title`)}</p>
                  <p className="text-xs text-[#CBD5E1]">{t(`landing.${k}Body`)}</p>
                </div>
              ))}
            </div>
            <Link href="/ai-trust">
              <Button variant="teal" size="md">{t("landing.trustCta")}</Button>
            </Link>
          </div>
        </section>

        <section id="languages" className="mx-auto max-w-7xl px-4 sm:px-8">
          <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-2">
            <div className="space-y-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#0E7490]">{t("landing.langKicker")}</span>
              <h2 className="text-2xl font-bold text-[#0B1F33] sm:text-3xl">{t("landing.langTitle")}</h2>
              <p className="text-xs leading-relaxed text-[#475569] sm:text-sm">{t("landing.langBody")}</p>
            </div>
            <ul className="space-y-3 rounded-2xl border border-[#D8E2EA] bg-white p-6 shadow-sm">
              {SUPPORTED_LANGUAGES.map((l) => (
                <li key={l.code} className="flex items-center justify-between rounded-xl bg-[#F8FAFC] p-3">
                  <span className="flex items-center gap-2 text-xs font-medium text-[#0B1F33]">
                    <Globe className="h-4 w-4 text-[#0E7490]" aria-hidden="true" />
                    {l.nativeName} ({t(`common.langName.${l.code}`)})
                  </span>
                  <span className="text-xs text-[#64748B]">
                    {l.code === "en" ? t("landing.langSource") : t("landing.langReview")}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="documentation" className="mx-auto max-w-7xl px-4 sm:px-8">
          <div className="space-y-8 rounded-3xl border border-[#D8E2EA] bg-white p-8 shadow-sm sm:p-12">
            <div className="max-w-2xl space-y-3">
              <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#0E7490]">
                <BookOpen className="h-4 w-4" aria-hidden="true" />
                {t("landing.docsKicker")}
              </span>
              <h2 className="text-2xl font-bold text-[#0B1F33] sm:text-3xl">{t("landing.docsTitle")}</h2>
              <p className="text-xs leading-relaxed text-[#475569] sm:text-sm">{t("landing.docsBody")}</p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {["introduction", "risk-assessment", "responsible-ai", "testing"].map((slug) => {
                const d = getDoc(slug);
                return d ? (
                  <Link key={slug} href={`/documentation/${slug}`} className="space-y-1.5 rounded-2xl border border-[#D8E2EA] bg-[#F8FAFC] p-4 transition-colors hover:border-[#0E7490]">
                    <p lang="en" className="text-sm font-bold text-[#0B1F33]">{d.title}</p>
                    <p lang="en" className="line-clamp-3 text-xs leading-relaxed text-[#475569]">{d.summary}</p>
                  </Link>
                ) : null;
              })}
            </div>
            <Link href="/documentation">
              <Button variant="primary" size="md" rightIcon={<ArrowRight className="h-4 w-4" />}>{t("landing.docsCta")}</Button>
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-8">
          <div className="space-y-6 rounded-3xl bg-gradient-to-br from-[#0B1F33] to-[#132E4A] p-8 text-center text-white sm:p-14">
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-4xl">{t("landing.ctaTitle")}</h2>
            <p className="mx-auto max-w-xl text-xs leading-relaxed text-[#CBD5E1] sm:text-sm">{t("landing.ctaBody")}</p>
            <div className="flex flex-wrap justify-center gap-4 pt-2">
              <Link href="/onboarding">
                <Button size="lg" variant="teal">{t("landing.ctaStart")}</Button>
              </Link>
              <Link href="/dashboard">
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                  {t("landing.ctaDashboard")}
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
