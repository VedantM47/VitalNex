"use client";

// Reports: the QR patient-held record (P7, SPEC §1.2 F15) and the list of saved screenings.
// The printable PDF is rebuilt in P9; until then no PDF is offered (the old page showed a
// "risk score %" field the API never returns — patients never see probabilities, D-10).

import React, { useEffect, useState } from "react";
import { AppShell } from "../../components/layout/AppShell";
import { Card, CardHeader } from "../../components/ui/Card";
import { ButtonLink } from "../../components/ui/Button";
import { Alert } from "../../components/ui/Alert";
import { ShareManager } from "../../components/share/ShareManager";
import { api } from "../../lib/api-client";
import { useTranslation } from "../../lib/i18n";
import { fmt } from "../../lib/assessment";
import { dateTime } from "../../lib/format";

interface ReportItem {
  assessment_id: string;
  created_at: string;
  next_step: string;
}

export default function ReportsPage() {
  const { t, language } = useTranslation();
  const [reports, setReports] = useState<ReportItem[] | null | "error">(null);

  useEffect(() => {
    let active = true;
    api
      .getReports()
      .then((r) => active && setReports(r))
      .catch(() => active && setReports("error"));
    return () => {
      active = false;
    };
  }, []);

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="space-y-1 border-b border-[#D8E2EA] pb-6">
          <h1 className="text-2xl font-extrabold text-[#0B1F33] sm:text-3xl">{t("nav.reports")}</h1>
          <p className="text-xs text-[#475569] sm:text-sm">{t("reportsPage.subtitle")}</p>
        </div>

        <ShareManager />

        <Card className="space-y-3">
          <CardHeader title={t("reportsPage.saved")} />
          <Alert kind="info">{t("reportsPage.pdfLater")}</Alert>
          {reports === "error" ? (
            <Alert kind="error">{t("common.apiUnavailable")}</Alert>
          ) : reports === null ? (
            <p className="text-sm text-[#475569]">{t("common.loading")}</p>
          ) : (
            <>
              <p className="text-sm text-[#334155]">{fmt(t("reportsPage.count"), { n: reports.length })}</p>
              {reports.length > 0 && (
                <ul className="divide-y divide-[#E2E8F0]">
                  {reports.slice(0, 10).map((r) => (
                    <li key={r.assessment_id} className="flex flex-col justify-between gap-1 py-2 text-sm sm:flex-row">
                      <span>{dateTime(r.created_at, language)}</span>
                      <span className="font-medium text-[#0B1F33]">{t(`results.nextStep.${r.next_step}.title`)}</span>
                    </li>
                  ))}
                </ul>
              )}
              <ButtonLink href="/history" variant="outline">
                {t("reportsPage.openHistory")}
              </ButtonLink>
            </>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
