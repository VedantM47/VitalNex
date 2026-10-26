"use client";

// P0: hardcoded metrics (ROC-AUC 0.912, 94.2% parity, 1,420 runs, Pune dataset) were
// removed. Values come from /governance/summary and /models; both are empty until
// the BRFSS models exist (P3) and governance is wired to Supabase (P6).

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Cpu, Lock, ShieldCheck } from "lucide-react";
import { AppShell } from "../../../components/layout/AppShell";
import { Card } from "../../../components/ui/Card";
import { StatCard } from "../../../components/ui/StatCard";
import { DemoBadge } from "../../../components/ui/StatusBadge";
import { Button } from "../../../components/ui/Button";
import { api } from "../../../lib/api-client";

export default function AdminDashboardPage() {
  const [models, setModels] = useState<any[] | null>(null);
  const [summary, setSummary] = useState<any | null>(null);

  useEffect(() => {
    let active = true;
    api.getModels().then((m) => active && setModels(m)).catch(() => active && setModels(null));
    api.getGovernanceSummary().then((s) => active && setSummary(s)).catch(() => active && setSummary(null));
    return () => {
      active = false;
    };
  }, []);

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D8E2EA] pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F33]">Governance Console</h1>
              <DemoBadge label="Admin" />
            </div>
            <p className="text-xs sm:text-sm text-[#475569]">
              Model registry, review activity and audit. Only aggregates are shown here.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          <StatCard
            label="Models in registry"
            value={models === null ? "—" : String(models.length)}
            subtext={models && models.length === 0 ? "No trained models yet" : "From model cards"}
            icon={<Cpu className="w-5 h-5 text-[#0B1F33]" />}
          />
          <StatCard
            label="Assessments recorded"
            value={summary === null ? "—" : String(summary.total_assessments)}
            subtext="All time"
            icon={<ShieldCheck className="w-5 h-5 text-[#0F766E]" />}
          />
          <StatCard
            label="Pending clinician reviews"
            value={summary === null ? "—" : String(summary.human_reviews_pending)}
            subtext="Across all clinicians"
            icon={<Lock className="w-5 h-5 text-[#B45309]" />}
          />
        </div>

        <Card className="p-6 space-y-4 max-w-md">
          <h3 className="text-base font-bold text-[#0B1F33]">Governance &amp; Audit</h3>
          <p className="text-xs text-[#475569] leading-relaxed">
            Audit events, fairness tables and override analytics. Fairness and model metrics appear only after
            they are computed from the real models.
          </p>
          <Link href="/admin/governance" className="block pt-2">
            <Button variant="outline" size="sm" className="w-full">
              Review Governance
            </Button>
          </Link>
        </Card>
      </div>
    </AppShell>
  );
}
