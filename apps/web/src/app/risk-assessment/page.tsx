"use client";

// P0: the old form sent hardcoded clinical values (cp, fbs, restecg, exang, oldpeak,
// slope, ca, thal) and showed invented scores. It is removed until the new
// 14-question assessment is rebuilt in P5 on the P3/P4 models.

import React from "react";
import Link from "next/link";
import { Activity } from "lucide-react";
import { AppShell } from "../../components/layout/AppShell";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { useTranslation } from "../../lib/i18n";

export default function RiskAssessmentPage() {
  const { t } = useTranslation();

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="space-y-1 border-b border-[#D8E2EA] pb-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F33]">{t("risk.title")}</h1>
          <p className="text-xs sm:text-sm text-[#475569]">{t("risk.subtitle")}</p>
        </div>

        <EmptyState
          icon={<Activity className="w-8 h-8" aria-hidden="true" />}
          title={t("status.assessmentUnavailableTitle")}
          description={t("status.assessmentUnavailableBody")}
          action={
            <Link href="/care-connect">
              <Button variant="secondary" size="sm">
                {t("nav.careConnect")}
              </Button>
            </Link>
          }
        />
      </div>
    </AppShell>
  );
}
