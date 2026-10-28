"use client";

import React, { useEffect, useRef } from "react";
import { Phone, Siren } from "lucide-react";
import { useTranslation } from "../../lib/i18n";

/**
 * Emergency override (SPEC §1.4 rule 1, CLAUDE.md hard rule 8): takes the whole screen,
 * shows 108 / 112 and no screening levels.
 */
export function EmergencyScreen({ onBack }: { onBack: () => void }) {
  const { t } = useTranslation();
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => headingRef.current?.focus(), []);

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="emergency-title"
      aria-describedby="emergency-body"
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-[#7F1D1D] p-4 text-white"
    >
      <div className="w-full max-w-xl space-y-6 py-8 text-center">
        <Siren className="mx-auto h-14 w-14" aria-hidden="true" />
        <h1 id="emergency-title" ref={headingRef} tabIndex={-1} className="text-3xl font-extrabold leading-tight outline-none sm:text-4xl">
          {t("emergency.title")}
        </h1>
        <p id="emergency-body" className="text-base leading-relaxed sm:text-lg">
          {t("emergency.body")}
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <a
            href="tel:108"
            className="flex min-h-[56px] items-center justify-center gap-2 rounded-2xl bg-white px-5 text-lg font-extrabold text-[#7F1D1D] focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <Phone className="h-5 w-5" aria-hidden="true" />
            {t("emergency.call108")}
          </a>
          <a
            href="tel:112"
            className="flex min-h-[56px] items-center justify-center gap-2 rounded-2xl bg-white px-5 text-lg font-extrabold text-[#7F1D1D] focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <Phone className="h-5 w-5" aria-hidden="true" />
            {t("emergency.call112")}
          </a>
        </div>
        <p className="text-sm text-[#FEE2E2]">{t("emergency.noScores")}</p>
        <button
          type="button"
          onClick={onBack}
          className="text-sm font-semibold text-white underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          {t("emergency.back")}
        </button>
      </div>
    </div>
  );
}
