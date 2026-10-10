"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  FileText,
  Download,
  Calendar,
  ShieldCheck,
  Activity,
  ArrowRight,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { AppShell } from "../../components/layout/AppShell";
import { Card, CardHeader } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { RiskBadge, StatusBadge, DemoBadge } from "../../components/ui/StatusBadge";
import { api } from "../../lib/api-client";
import { useTranslation } from "../../lib/i18n";

interface ReportItem {
  id: string;
  assessment_id: string;
  user_id: string;
  title: string;
  risk_score: number;
  risk_band: string;
  created_at: string;
  model_version: string;
  review_status: string;
  pdf_download_url: string;
}

import { useAuth } from "../../lib/auth-context";

export default function ReportsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const userId = user?.id || "usr-demo-patient-001";

  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const data = await api.getReports(userId);
      if (Array.isArray(data)) {
        setReports(data);
      }
    } catch (e) {
      console.error("Failed to load reports:", e);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    api.getReports(userId)
      .then((data) => {
        if (active && Array.isArray(data)) {
          setReports(data);
        }
      })
      .catch((e) => {
        console.error("Failed to load reports:", e);
        if (active) {
          setReports([]);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [userId]);


  const handleDownloadPdf = async (assessmentId: string) => {
    setDownloadingId(assessmentId);
    try {
      const downloadUrl = api.getReportPdfUrl(assessmentId);
      // Open in new tab or trigger download
      window.open(downloadUrl, "_blank");
    } catch (err) {
      console.error("PDF download error:", err);
    } finally {
      setTimeout(() => setDownloadingId(null), 1500);
    }
  };

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D8E2EA] pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F33]">
                {t("nav.reports") || "Clinical Reports & Summaries"}
              </h1>
              <DemoBadge label="ReportLab PDF Engine" />
            </div>
            <p className="text-xs sm:text-sm text-[#475569]">
              Verified clinical screening documents, explainability summaries, and printable physician-ready PDF reports.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              isLoading={loading}
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Refresh
            </Button>
            <Link href="/risk-assessment">
              <Button variant="primary" size="sm">
                <Activity className="w-3.5 h-3.5 mr-1.5" />
                New Screening
              </Button>
            </Link>
          </div>
        </div>

        {/* Informational Banner */}
        <div className="p-4 bg-[#0E7490]/5 border border-[#0E7490]/20 rounded-2xl flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-[#0E7490] shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs text-[#0B1F33]">
            <p className="font-bold">Physician-Ready Decision Support Reports</p>
            <p className="text-[#475569] leading-relaxed">
              Every VITALNEX report includes audited physiological inputs, Platt Isotonic confidence intervals, local TreeSHAP attributions, and bounded safety governance metadata.
            </p>
          </div>
        </div>

        {/* Reports Grid / List */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-[#0B1F33] uppercase tracking-wider">
            Available Assessment Reports ({reports.length})
          </h2>

          {loading ? (
            <div className="p-12 text-center text-[#64748B] text-xs">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#0E7490]" />
              Loading verified clinical documents...
            </div>
          ) : reports.length === 0 ? (
            <Card className="p-8 text-center space-y-4">
              <FileText className="w-10 h-10 text-[#94A3B8] mx-auto" />
              <p className="text-sm font-semibold text-[#0B1F33]">No assessment reports yet</p>
              <p className="text-xs text-[#64748B]">Complete a cardiometabolic risk screening to generate your first verified clinical report.</p>
              <Link href="/risk-assessment">
                <Button variant="primary" size="sm">Run Risk Assessment</Button>
              </Link>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reports.map((report) => {
                const evalDate = new Date(report.created_at).toLocaleDateString("en-IN", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                });

                return (
                  <Card key={report.id} className="p-6 space-y-5 flex flex-col justify-between hover:shadow-md transition-shadow border-[#D8E2EA]">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="p-2.5 bg-[#F1F5F9] rounded-xl text-[#0E7490]">
                          <FileText className="w-5 h-5" />
                        </div>
                        <RiskBadge band={report.risk_band} />
                      </div>

                      <div>
                        <h3 className="font-bold text-sm text-[#0B1F33] leading-snug line-clamp-2">
                          {report.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1.5 text-xs text-[#64748B]">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{evalDate}</span>
                        </div>
                      </div>

                      <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-[#64748B]">Risk Score:</span>
                          <span className="font-bold text-[#0B1F33]">{report.risk_score}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#64748B]">Model Engine:</span>
                          <span className="font-medium text-[#475569] truncate max-w-[140px]">{report.model_version}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#64748B]">Clinical Review:</span>
                          <span className="font-medium text-[#0F766E]">{report.review_status === "Pending" ? "Review Advised" : "Automated Gate"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#F1F5F9] flex items-center gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        className="flex-1"
                        isLoading={downloadingId === report.assessment_id}
                        onClick={() => handleDownloadPdf(report.assessment_id)}
                      >
                        <Download className="w-3.5 h-3.5 mr-1.5" />
                        Download PDF
                      </Button>
                      <Link href={`/ai-trust?id=${report.assessment_id}`}>
                        <Button variant="outline" size="sm" aria-label="View AI Trust Details">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
