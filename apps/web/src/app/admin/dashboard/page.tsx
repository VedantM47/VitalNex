"use client";

import React from "react";
import Link from "next/link";
import {
  Cpu,
  Database,
  Lock,
  Activity,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Scale,
  Sparkles,
} from "lucide-react";
import { AppShell } from "../../../components/layout/AppShell";
import { Card, CardHeader } from "../../../components/ui/Card";
import { StatCard } from "../../../components/ui/StatCard";
import { StatusBadge, DemoBadge } from "../../../components/ui/StatusBadge";
import { Button } from "../../../components/ui/Button";

export default function AdminDashboardPage() {
  return (
    <AppShell>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D8E2EA] pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F33]">
                AI Research & Model Governance Console
              </h1>
              <DemoBadge label="Researcher Role" />
            </div>
            <p className="text-xs sm:text-sm text-[#475569]">
              Academic ML pipeline registry, demographic parity monitors, and data provenance auditing.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/admin/model-lab">
              <Button size="sm" variant="primary" leftIcon={<Cpu className="w-3.5 h-3.5" />}>
                Model Laboratory
              </Button>
            </Link>
          </div>
        </div>

        {/* Console Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <StatCard
            label="Active Research Dataset"
            value="20,000 Rows"
            subtext="26 Features (Pune Synthetic Package)"
            icon={<Database className="w-5 h-5 text-[#0E7490]" />}
          />
          <StatCard
            label="Active Production Model"
            value="v1.0.0-demo"
            subtext="ROC-AUC: 0.912 | Accuracy: 88.4%"
            icon={<Cpu className="w-5 h-5 text-[#0B1F33]" />}
          />
          <StatCard
            label="Demographic Parity"
            value="94.2% Ratio"
            subtext="Complies with >=80% guideline"
            icon={<Scale className="w-5 h-5 text-[#0F766E]" />}
          />
          <StatCard
            label="Audited Assessments"
            value="1,420 Runs"
            subtext="0 Data drift violations"
            icon={<ShieldCheck className="w-5 h-5 text-[#0F766E]" />}
          />
        </div>

        {/* Quick Nav Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 space-y-4">
            <div className="w-10 h-10 rounded-xl bg-[#0E7490]/10 text-[#0E7490] flex items-center justify-center">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#0B1F33]">Model Laboratory</h3>
            <p className="text-xs text-[#475569] leading-relaxed">
              Inspect model architecture registry, hyperparameter manifests, baseline scikit-learn models, and evaluation runs.
            </p>
            <Link href="/admin/model-lab" className="block pt-2">
              <Button variant="outline" size="sm" className="w-full">
                Open Model Lab
              </Button>
            </Link>
          </Card>

          <Card className="p-6 space-y-4">
            <div className="w-10 h-10 rounded-xl bg-[#0F766E]/10 text-[#0F766E] flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#0B1F33]">Research Datasets</h3>
            <p className="text-xs text-[#475569] leading-relaxed">
              Verify schema validation, provenance files, null-check distributions, and 26-column data dictionaries.
            </p>
            <Link href="/admin/datasets" className="block pt-2">
              <Button variant="outline" size="sm" className="w-full">
                Inspect Datasets
              </Button>
            </Link>
          </Card>

          <Card className="p-6 space-y-4">
            <div className="w-10 h-10 rounded-xl bg-[#B45309]/10 text-[#B45309] flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#0B1F33]">Governance & Audit</h3>
            <p className="text-xs text-[#475569] leading-relaxed">
              Live audit events, fairness disparity monitoring across Pune localities, and clinical oversight escalations.
            </p>
            <Link href="/admin/governance" className="block pt-2">
              <Button variant="outline" size="sm" className="w-full">
                Review Governance
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
