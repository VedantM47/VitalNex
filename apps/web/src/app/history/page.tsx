"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Clock,
  Activity,
  TrendingDown,
  TrendingUp,
  ShieldCheck,
  Calendar,
  ArrowRight,
  Download,
  FileText,
  Sparkles,
  RefreshCw,
  ChevronRight,
} from "lucide-react";
import { AppShell } from "../../components/layout/AppShell";
import { Card, CardHeader } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { RiskBadge, StatusBadge, DemoBadge } from "../../components/ui/StatusBadge";
import { api } from "../../lib/api-client";
import { useTranslation } from "../../lib/i18n";

import { useAuth } from "../../lib/auth-context";

export default function HistoryPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const userId = user?.id || "usr-demo-patient-001";

  const [historyData, setHistoryData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const data = await api.getAssessmentHistory(userId);
      setHistoryData(data);
    } catch (err) {
      console.error("Failed to load history:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    api.getAssessmentHistory(userId)
      .then((data) => {
        if (active) setHistoryData(data);
      })
      .catch((err) => {
        console.error("Failed to load history:", err);
        if (active) {
          setHistoryData({
            user_id: userId,
            total_assessments: user?.isDemo ? 3 : 0,
            assessments: user?.isDemo ? [
              {
                id: "asm-demo-001",
                risk_score: 18.1,
                risk_band: "Low",
                confidence_interval: [13.6, 22.6],
                calibration_status: "Calibrated (Platt Isotonic)",
                model_version: "v1.1.0-gradient_boosting",
                evaluated_at: "2026-09-15T10:30:00Z",
                input_snapshot: { trestbps: 132, chol: 181, smoking: 0, bmi: 24.9 },
              },
              {
                id: "asm-hist-002",
                risk_score: 34.6,
                risk_band: "Moderate",
                confidence_interval: [29.8, 39.4],
                calibration_status: "Calibrated (Platt Isotonic)",
                model_version: "v1.1.0-gradient_boosting",
                evaluated_at: "2026-07-20T14:15:00Z",
                input_snapshot: { trestbps: 142, chol: 210, smoking: 1, bmi: 24.9 },
              },
              {
                id: "asm-hist-003",
                risk_score: 42.8,
                risk_band: "Moderate",
                confidence_interval: [37.5, 48.1],
                calibration_status: "Calibrated (Platt Isotonic)",
                model_version: "v1.0.0-random_forest",
                evaluated_at: "2026-05-10T09:45:00Z",
                input_snapshot: { trestbps: 148, chol: 225, smoking: 1, bmi: 26.2 },
              },
            ] : [],
            trajectory: [],
          });
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [userId, user?.isDemo]);


  const assessments = historyData?.assessments || [];
  const latestRisk = assessments[0]?.risk_score || 18.1;
  const oldestRisk = assessments[assessments.length - 1]?.risk_score || 42.8;
  const netDelta = (latestRisk - oldestRisk).toFixed(1);

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D8E2EA] pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F33]">
                {t("nav.history") || "Cardiometabolic Risk History"}
              </h1>
              <DemoBadge label="Longitudinal Health Journey" />
            </div>
            <p className="text-xs sm:text-sm text-[#475569]">
              Track your risk screening trajectory over time, compare lifestyle interventions, and monitor long-term cardiovascular metrics.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={handleRefresh} isLoading={loading}>
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

        {/* Longitudinal Trajectory Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Card className="p-6 space-y-2">
            <span className="text-xs text-[#64748B] font-semibold uppercase tracking-wider">Current Risk Score</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-extrabold text-[#0B1F33]">{latestRisk}%</span>
              <RiskBadge band={assessments[0]?.risk_band || "Low"} />
            </div>
            <p className="text-xs text-[#64748B]">Calibrated ML model estimation</p>
          </Card>

          <Card className="p-6 space-y-2">
            <span className="text-xs text-[#64748B] font-semibold uppercase tracking-wider">Overall Trajectory</span>
            <div className="flex items-center gap-2">
              {Number(netDelta) <= 0 ? (
                <>
                  <div className="p-1.5 bg-[#0F766E]/10 rounded-lg text-[#0F766E]">
                    <TrendingDown className="w-5 h-5" />
                  </div>
                  <span className="text-2xl font-bold text-[#0F766E]">{netDelta}%</span>
                </>
              ) : (
                <>
                  <div className="p-1.5 bg-[#B42318]/10 rounded-lg text-[#B42318]">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <span className="text-2xl font-bold text-[#B42318]">+{netDelta}%</span>
                </>
              )}
            </div>
            <p className="text-xs text-[#64748B]">Net risk change since initial baseline</p>
          </Card>

          <Card className="p-6 space-y-2">
            <span className="text-xs text-[#64748B] font-semibold uppercase tracking-wider">Recorded Screenings</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-extrabold text-[#0B1F33]">{assessments.length}</span>
              <span className="text-xs text-[#64748B]">Evaluations</span>
            </div>
            <p className="text-xs text-[#0F766E] font-medium">All sessions audited in Trust Passport</p>
          </Card>
        </div>

        {/* Timeline Visualization */}
        <Card className="p-6 sm:p-8 space-y-6">
          <CardHeader
            title="Screening Timeline & Risk Progression"
            subtitle="Longitudinal progression of model-estimated risk probabilities across clinical sessions"
            badge={<StatusBadge label="Audited Trail" variant="success" size="sm" />}
          />

          <div className="space-y-6">
            {assessments.map((item: any, idx: number) => {
              const d = new Date(item.evaluated_at);
              const formattedDate = d.toLocaleDateString("en-IN", {
                year: "numeric",
                month: "short",
                day: "numeric",
              });
              const inputs = item.input_snapshot || {};

              return (
                <div key={item.id} className="relative pl-6 sm:pl-8 border-l-2 border-[#D8E2EA] pb-6 last:pb-0">
                  {/* Dot */}
                  <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-white border-4 border-[#0E7490]" />

                  <div className="p-5 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] space-y-4 hover:border-[#CBD5E1] transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-[#0B1F33] uppercase">{formattedDate}</span>
                        <RiskBadge band={item.risk_band} />
                        <span className="text-xs text-[#64748B]">({item.id})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[#0B1F33]">Risk: {item.risk_score}%</span>
                        <span className="text-xs text-[#64748B]">CI: [{item.confidence_interval?.[0]}% - {item.confidence_interval?.[1]}%]</span>
                      </div>
                    </div>

                    {/* Vitals Snapshot */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="p-2.5 bg-white rounded-xl border border-[#E2E8F0]">
                        <span className="text-[#64748B] block">Resting BP</span>
                        <span className="font-bold text-[#0B1F33]">{inputs.trestbps || 132} mmHg</span>
                      </div>
                      <div className="p-2.5 bg-white rounded-xl border border-[#E2E8F0]">
                        <span className="text-[#64748B] block">Serum Chol</span>
                        <span className="font-bold text-[#0B1F33]">{inputs.chol || 181} mg/dL</span>
                      </div>
                      <div className="p-2.5 bg-white rounded-xl border border-[#E2E8F0]">
                        <span className="text-[#64748B] block">Smoking Status</span>
                        <span className="font-bold text-[#0B1F33]">{inputs.smoking === 1 ? "Active Smoker" : "Non-Smoker"}</span>
                      </div>
                      <div className="p-2.5 bg-white rounded-xl border border-[#E2E8F0]">
                        <span className="text-[#64748B] block">Body Mass Index</span>
                        <span className="font-bold text-[#0B1F33]">{inputs.bmi || 24.9} kg/m²</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#E2E8F0] text-xs">
                      <span className="text-[#64748B]">Model: {item.model_version}</span>
                      <div className="flex items-center gap-2">
                        <a
                          href={api.getReportPdfUrl(item.id)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#D8E2EA] font-semibold text-[#0E7490] hover:bg-[#F1F5F9]"
                        >
                          <Download className="w-3.5 h-3.5" />
                          PDF Report
                        </a>
                        <Link
                          href={`/ai-trust?id=${item.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0B1F33] font-semibold text-white hover:bg-[#132E4A]"
                        >
                          Trust Passport
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
