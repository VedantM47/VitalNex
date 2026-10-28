"use client";

// First-time onboarding (SPEC §1.3 patient flow step 1): what VITALNEX is / is not, language,
// consent choices (each purpose is toggled separately in My data, SPEC §2.2), then the health
// profile. Nothing is collected or pre-filled on this page (CLAUDE.md hard rules 3 and 10).

import React from "react";
import { CheckCircle2, Lock, ShieldCheck, UserRound } from "lucide-react";
import { BrandLogo } from "../../components/layout/BrandLogo";
import { LanguageSelector } from "../../components/ui/LanguageSelector";
import { Card } from "../../components/ui/Card";
import { ButtonLink } from "../../components/ui/Button";
import { useTranslation } from "../../lib/i18n";

export default function OnboardingPage() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen flex-col bg-[#F7FAFC] p-4 sm:p-8">
      <header className="mx-auto flex w-full max-w-3xl items-center justify-between border-b border-[#D8E2EA] pb-6">
        <BrandLogo size="sm" />
        <LanguageSelector variant="compact" />
      </header>

      <main className="mx-auto w-full max-w-2xl space-y-6 py-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold text-[#0B1F33] sm:text-3xl">{t("onboarding.title")}</h1>
          <p className="text-sm text-[#475569]">{t("onboarding.intro")}</p>
        </div>

        <Card className="space-y-4">
          <p className="text-sm font-bold text-[#0B1F33]">{t("landing.isTitle")}</p>
          <ul className="space-y-2 text-sm text-[#334155]">
            {["is1", "is2", "is3"].map((k) => (
              <li key={k} className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#0F766E]" aria-hidden="true" />
                {t(`landing.${k}`)}
              </li>
            ))}
          </ul>
          <p className="pt-2 text-sm font-bold text-[#0B1F33]">{t("landing.notTitle")}</p>
          <ul className="space-y-2 text-sm text-[#334155]">
            {["not1", "not2", "not3"].map((k) => (
              <li key={k} className="flex gap-2">
                <Lock className="mt-0.5 h-4 w-4 shrink-0 text-[#B42318]" aria-hidden="true" />
                {t(`landing.${k}`)}
              </li>
            ))}
          </ul>
          <p className="rounded-xl border border-[#B42318]/20 bg-[#FEF2F2] p-3 text-sm font-semibold text-[#B42318]">
            {t("landing.emergency")}
          </p>
        </Card>

        <Card className="space-y-3">
          <h2 className="text-base font-bold text-[#0B1F33]">{t("onboarding.step1")}</h2>
          <LanguageSelector />
        </Card>

        <Card className="space-y-3">
          <h2 className="flex items-center gap-2 text-base font-bold text-[#0B1F33]">
            <ShieldCheck className="h-5 w-5 text-[#0E7490]" aria-hidden="true" />
            {t("onboarding.step2")}
          </h2>
          <p className="text-sm text-[#475569]">{t("onboarding.step2Body")}</p>
          <ButtonLink href="/settings" variant="outline">{t("onboarding.step2Button")}</ButtonLink>
        </Card>

        <Card className="space-y-3">
          <h2 className="flex items-center gap-2 text-base font-bold text-[#0B1F33]">
            <UserRound className="h-5 w-5 text-[#0E7490]" aria-hidden="true" />
            {t("onboarding.step3")}
          </h2>
          <p className="text-sm text-[#475569]">{t("onboarding.step3Body")}</p>
          <ButtonLink href="/health-profile">{t("onboarding.step3Button")}</ButtonLink>
        </Card>

        <ButtonLink href="/dashboard" variant="outline">{t("onboarding.skip")}</ButtonLink>
      </main>
    </div>
  );
}
