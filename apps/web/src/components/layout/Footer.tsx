"use client";

import React from "react";
import Link from "next/link";
import { BrandLogo } from "./BrandLogo";
import { useTranslation } from "../../lib/i18n";
import { fmt } from "../../lib/assessment";

export function Footer() {
  const { t } = useTranslation();
  const columns = [
    {
      title: "footer.product",
      links: [
        { href: "/risk-assessment", label: "footer.screening" },
        { href: "/ai-trust", label: "footer.trust" },
        { href: "/health-profile", label: "footer.profile" },
        { href: "/care-connect", label: "footer.care" },
        { href: "/documentation", label: "footer.docs" },
      ],
    },
    { title: "footer.governance", links: [{ href: "/admin/governance", label: "footer.audit" }] },
    { title: "footer.privacy", links: [{ href: "/settings", label: "footer.settings" }] },
  ];

  return (
    <footer className="mt-auto border-t border-[#D8E2EA] bg-white px-4 pb-8 pt-10 sm:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="space-y-3 md:col-span-1">
            <BrandLogo size="md" />
            <p className="text-xs leading-relaxed text-[#64748B]">{t("footer.about")}</p>
          </div>
          {columns.map((c) => (
            <div key={c.title} className="space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#0B1F33]">{t(c.title)}</h4>
              <ul className="space-y-1.5 text-xs text-[#475569]">
                {c.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="hover:text-[#0E7490]">{t(l.label)}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="space-y-2 border-t border-[#F1F5F9] pt-6 text-center">
          <p className="mx-auto max-w-4xl text-xs leading-relaxed text-[#475569]">
            <strong className="text-[#0B1F33]">{t("footer.disclaimerLabel")}</strong> {t("footer.disclaimer")}
          </p>
          <p className="text-[11px] text-[#94A3B8]">{fmt(t("footer.copyright"), { year: new Date().getFullYear() })}</p>
        </div>
      </div>
    </footer>
  );
}
