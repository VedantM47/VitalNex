"use client";

import React from "react";
import Link from "next/link";
import { Cpu, Activity, CheckCircle2, ArrowRight, ShieldCheck, Sparkles, Layers } from "lucide-react";
import { AppShell } from "../../../components/layout/AppShell";
import { Card, CardHeader } from "../../../components/ui/Card";
import { StatusBadge, DemoBadge } from "../../../components/ui/StatusBadge";
import { Button } from "../../../components/ui/Button";

export default function ModelLabPage() {
  const models = [
    {
      id: "mod-01",
      name: "CardioRisk Baseline Classifier",
      framework: "scikit-learn (Calibrated Gradient Boosted)",
      version: "v1.0.0-demo-baseline",
      status: "Production",
      accuracy: "88.4%",
      rocAuc: "0.912",
      f1Score: "0.871",
      fairnessRatio: "0.94",
      lastTrained: "Academic Synthetic Baseline Build",
    },
    {
      id: "mod-02",
      name: "Deep Cardiometabolic Network (Prompt 2)",
      framework: "TensorFlow / Keras MLP",
      version: "v2.0.0-alpha",
      status: "Scheduled for Prompt 2",
      accuracy: "Pending Training",
      rocAuc: "Pending",
      f1Score: "Pending",
      fairnessRatio: "Pending",
      lastTrained: "Staging Pipeline",
    },
  ];

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D8E2EA] pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F33]">
                Model Laboratory
              </h1>
              <DemoBadge label="Registry v1.0" />
            </div>
            <p className="text-xs sm:text-sm text-[#475569]">
              Machine learning model registry, architecture manifests, and performance benchmarks.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-[#0F766E] font-semibold bg-[#0F766E]/10 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> Ready for Prompt 2 ML/DL Training
            </span>
          </div>
        </div>

        {/* Notice for Prompt 2 */}
        <div className="p-4 bg-[#F0FDF4] rounded-2xl border border-[#0F766E]/20 flex items-start gap-3.5">
          <Layers className="w-5 h-5 text-[#0F766E] shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs text-[#0F766E]">
            <p className="font-bold">Prompt 2 Machine Learning Integration Ready</p>
            <p className="leading-relaxed">
              This registry is pre-wired to the FastAPI `ModelRegistryService` and `model_versions` database tables. Prompt 2 will train and deploy scikit-learn ensemble and TensorFlow neural network architectures directly into this interface.
            </p>
          </div>
        </div>

        {/* Model Cards */}
        <div className="space-y-4">
          {models.map((mod) => (
            <Card key={mod.id} className="p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F1F5F9] pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-[#0B1F33]">{mod.name}</h3>
                    <span className="font-mono text-xs px-2 py-0.5 bg-[#F1F5F9] text-[#475569] rounded-md">
                      {mod.version}
                    </span>
                  </div>
                  <p className="text-xs text-[#64748B] mt-0.5">{mod.framework}</p>
                </div>
                <StatusBadge
                  label={mod.status}
                  variant={mod.status === "Production" ? "success" : "neutral"}
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#D8E2EA]">
                  <p className="text-[#64748B]">Validation Accuracy</p>
                  <p className="text-base font-bold text-[#0B1F33] mt-0.5">{mod.accuracy}</p>
                </div>
                <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#D8E2EA]">
                  <p className="text-[#64748B]">ROC-AUC Metric</p>
                  <p className="text-base font-bold text-[#0E7490] mt-0.5">{mod.rocAuc}</p>
                </div>
                <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#D8E2EA]">
                  <p className="text-[#64748B]">F1 Score</p>
                  <p className="text-base font-bold text-[#0B1F33] mt-0.5">{mod.f1Score}</p>
                </div>
                <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#D8E2EA]">
                  <p className="text-[#64748B]">Demographic Parity</p>
                  <p className="text-base font-bold text-[#0F766E] mt-0.5">{mod.fairnessRatio}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
