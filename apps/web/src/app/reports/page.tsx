"use client";

// Reports: the QR patient-held record (P7, SPEC §1.2 F15) and the printable PDF of each saved
// screening (P9, F17). The PDF is built by the API from the stored result: levels only, never a
// probability (D-10); abstained conditions say "not confident — see a doctor".

import React, { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { AppShell } from "../../components/layout/AppShell";
import { Card, CardHeader } from "../../components/ui/Card";
import { Button, ButtonLink } from "../../components/ui/Button";
import { Select } from "../../components/ui/Select";
import { Alert } from "../../components/ui/Alert";
import { ShareManager } from "../../components/share/ShareManager";
import { api } from "../../lib/api-client";
import { SUPPORTED_LANGUAGES, useTranslation, type SupportedLanguage } from "../../lib/i18n";
import { fmt } from "../../lib/assessment";
import { dateTime } from "../../lib/format";

interface ReportItem {
  assessment_id: string;
  created_at: string;
  next_step: string;
}

function save(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const { t, language } = useTranslation();
  const [reports, setReports] = useState<ReportItem[] | null | "error">(null);
  const [pdfLang, setPdfLang] = useState<SupportedLanguage>(language);
  const [busy, setBusy] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

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

  const download = async (id: string) => {
    setBusy(id);
    setFailed(false);
    try {
      const { blob, filename } = await api.downloadReportPdf(id, pdfLang);
      save(blob, filename);
    } catch {
      setFailed(true);
    } finally {
      setBusy(null);
    }
  };

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="space-y-1 border-b border-[#D8E2EA] pb-6">
          <h1 className="text-2xl font-extrabold text-[#0B1F33] sm:text-3xl">{t("nav.reports")}</h1>
          <p className="text-xs text-[#475569] sm:text-sm">{t("reportsPage.subtitle")}</p>
        </div>

        <ShareManager />

        <Card className="space-y-4">
          <CardHeader title={t("reportsPage.pdfTitle")} subtitle={t("reportsPage.pdfIntro")} />
          {reports === "error" ? (
            <Alert kind="error">{t("common.apiUnavailable")}</Alert>
          ) : reports === null ? (
            <p className="text-sm text-[#475569]">{t("common.loading")}</p>
          ) : (
            <>
              <div className="max-w-xs">
                <Select
                  label={t("reportsPage.pdfLanguage")}
                  value={pdfLang}
                  onChange={(e) => setPdfLang(e.target.value as SupportedLanguage)}
                  options={SUPPORTED_LANGUAGES.map((l) => ({ value: l.code, label: l.nativeName }))}
                />
              </div>
              {failed && <Alert kind="error">{t("reportsPage.downloadFailed")}</Alert>}
              <p className="text-sm text-[#334155]">{fmt(t("reportsPage.count"), { n: reports.length })}</p>
              {reports.length > 0 && (
                <ul className="divide-y divide-[#E2E8F0]">
                  {reports.slice(0, 20).map((r) => (
                    <li key={r.assessment_id} className="flex flex-col justify-between gap-2 py-3 text-sm sm:flex-row sm:items-center">
                      <div>
                        <p className="font-medium text-[#0B1F33]">{t(`results.nextStep.${r.next_step}.title`)}</p>
                        <p className="text-xs text-[#475569]">{dateTime(r.created_at, language)}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        isLoading={busy === r.assessment_id}
                        onClick={() => download(r.assessment_id)}
                        leftIcon={<Download className="h-3.5 w-3.5" />}
                      >
                        {t("reportsPage.download")}
                      </Button>
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
