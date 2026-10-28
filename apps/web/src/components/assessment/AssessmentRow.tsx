"use client";

import React from "react";
import { Clock, Siren, UserCheck } from "lucide-react";
import { BandBadge } from "./BandBadge";
import { useTranslation } from "../../lib/i18n";
import { DISEASES, type AssessmentRecord, type Band } from "../../lib/assessment";

/** One stored assessment: date, next step, band per condition, clinician review. */
export function AssessmentRow({ record }: { record: AssessmentRecord }) {
  const { t, language } = useTranslation();
  const locale = language === "en" ? "en-IN" : `${language}-IN`;
  const date = new Date(record.created_at).toLocaleDateString(locale, { year: "numeric", month: "short", day: "numeric" });
  const review = record.clinician_review ?? null;
  const status = review?.status ?? record.review_status;
  const reviewed = status === "agreed" || status === "overridden";

  return (
    <li className="space-y-3 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="font-bold text-[#0B1F33]">{date}</span>
        {record.assessment_mode === "demo" && (
          <span className="rounded-full border border-[#475569]/40 bg-white px-2 py-0.5 text-[11px] font-semibold text-[#334155]">
            {t("historyPage.demo")}
          </span>
        )}
        {reviewed && (
          <span className="inline-flex items-center gap-1 rounded-full border border-[#0F766E]/40 bg-[#ECFDF5] px-2 py-0.5 text-xs font-semibold text-[#065F46]">
            <UserCheck className="h-3.5 w-3.5" aria-hidden="true" />
            {t("historyPage.reviewed")}
          </span>
        )}
        {status === "pending" && (
          <span className="inline-flex items-center gap-1 rounded-full border border-[#475569]/40 bg-white px-2 py-0.5 text-xs font-semibold text-[#334155]">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            {t("historyPage.reviewPending")}
          </span>
        )}
      </div>

      {record.emergency_flag ? (
        <p className="flex items-center gap-2 text-sm font-semibold text-[#991B1B]">
          <Siren className="h-4 w-4" aria-hidden="true" />
          {t("historyPage.emergencyRow")}
        </p>
      ) : (
        <>
          <p className="text-sm text-[#0F172A]">
            <span className="text-[#475569]">{t("results.nextStepLabel")}: </span>
            <span className="font-semibold">{t(`results.nextStep.${record.next_step}.title`)}</span>
          </p>
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            {DISEASES.map((d) => {
              const r = record.results?.[d];
              if (!r) return null;
              const confident = !r.abstained && !!r.band;
              const clinicianBand = review?.clinician_bands?.[d]?.toLowerCase() as Band | undefined;
              return (
                <li key={d} className="flex flex-wrap items-center gap-1.5 text-xs text-[#334155]">
                  <span>{t(`results.condition.${d}`)}:</span>
                  <BandBadge
                    band={confident ? r.band : null}
                    label={confident ? t(`results.band.${r.band}`) : t("results.notConfident")}
                    size="sm"
                  />
                  {clinicianBand && (
                    <span className="inline-flex items-center gap-1">
                      <span>{t("historyPage.clinicianLevel")}:</span>
                      <BandBadge band={clinicianBand} label={t(`results.band.${clinicianBand}`)} size="sm" />
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}

      {review?.clinician_note && (
        <div className="rounded-xl border border-[#0F766E]/30 bg-white p-3 text-sm">
          <p className="text-xs font-semibold text-[#065F46]">{t("historyPage.clinicianNote")}</p>
          <p className="mt-0.5 whitespace-pre-line text-[#0F172A]">{review.clinician_note}</p>
        </div>
      )}
    </li>
  );
}
