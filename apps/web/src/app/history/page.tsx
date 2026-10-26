"use client";

// P0: hardcoded fallback assessments and default vitals were removed. This page now
// lists only what the API returns; the trend chart per disease comes in P5.

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Activity, Clock, Download, RefreshCw } from "lucide-react";
import { AppShell } from "../../components/layout/AppShell";
import { Card, CardHeader } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { RiskBadge } from "../../components/ui/StatusBadge";
import { api } from "../../lib/api-client";
import { useTranslation } from "../../lib/i18n";
import { useAuth } from "../../lib/auth-context";

export default function HistoryPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const userId = user?.id || "usr-demo-patient-001";

  const [assessments, setAssessments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const fetchHistory = async () => {
    try {
      const data = await api.getAssessmentHistory(userId);
      return { assessments: data?.assessments || [], error: false };
    } catch (err) {
      console.error("Failed to load history:", err);
      return { assessments: [], error: true };
    }
  };

  const applyResult = (result: { assessments: any[]; error: boolean }) => {
    setAssessments(result.assessments);
    setLoadError(result.error);
    setLoading(false);
  };

  const reload = async () => {
    setLoading(true);
    applyResult(await fetchHistory());
  };

  useEffect(() => {
    let active = true;
    fetchHistory().then((result) => {
      if (active) applyResult(result);
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D8E2EA] pb-6">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F33]">{t("nav.history")}</h1>
          </div>
          <Button variant="outline" size="sm" onClick={reload} isLoading={loading}>
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            {t("common.retry")}
          </Button>
        </div>

        {loading ? (
          <p className="text-sm text-[#64748B]">{t("common.loading")}</p>
        ) : loadError ? (
          <EmptyState title={t("common.error")} description={t("status.noDataBody")} />
        ) : assessments.length === 0 ? (
          <EmptyState
            icon={<Clock className="w-8 h-8" aria-hidden="true" />}
            title={t("status.noAssessmentTitle")}
            description={t("status.noAssessmentBody")}
            action={
              <Link href="/risk-assessment">
                <Button variant="primary" size="sm">
                  <Activity className="w-3.5 h-3.5 mr-1.5" />
                  {t("nav.riskAssessment")}
                </Button>
              </Link>
            }
          />
        ) : (
          <Card className="p-6 sm:p-8 space-y-6">
            <CardHeader title={t("nav.history")} />
            <ul className="space-y-3">
              {assessments.map((item: any) => (
                <li
                  key={item.id}
                  className="p-4 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] flex flex-wrap items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-[#0B1F33]">
                      {new Date(item.evaluated_at).toLocaleDateString("en-IN", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <RiskBadge band={item.risk_band} />
                    <span className="text-[#64748B]">{item.model_version}</span>
                  </div>
                  <a
                    href={api.getReportPdfUrl(item.id)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 font-semibold text-[#0E7490] hover:underline"
                  >
                    <Download className="w-3.5 h-3.5" />
                    PDF
                  </a>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
