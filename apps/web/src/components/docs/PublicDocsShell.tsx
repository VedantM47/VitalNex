"use client";

// Page frame for the public documentation (/documentation): same header look as the landing
// page, no sign-in needed.

import React from "react";
import Link from "next/link";
import { BrandLogo } from "../layout/BrandLogo";
import { Footer } from "../layout/Footer";
import { LanguageSelector } from "../ui/LanguageSelector";
import { Button } from "../ui/Button";
import { useTranslation } from "../../lib/i18n";

export function PublicDocsShell({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-screen flex-col bg-[#F7FAFC]">
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-[#D8E2EA] bg-white/95 px-4 py-3.5 backdrop-blur-md sm:px-8">
        <BrandLogo size="md" />
        <nav className="hidden items-center gap-6 text-xs font-medium text-[#475569] sm:text-sm md:flex">
          <Link href="/" className="transition-colors hover:text-[#0E7490]">{t("docs.backHome")}</Link>
          <Link href="/documentation" className="font-semibold text-[#0B1F33]">{t("docs.title")}</Link>
        </nav>
        <div className="flex items-center gap-3">
          <LanguageSelector variant="compact" />
          <Link href="/dashboard">
            <Button size="sm" variant="primary">{t("landing.open")}</Button>
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-8">{children}</main>
      <Footer />
    </div>
  );
}
