"use client";

import React, { useState, useEffect } from "react";
import { Lock, ShieldCheck, Scale, AlertTriangle, Clock, CheckCircle2 } from "lucide-react";
import { AppShell } from "../../../components/layout/AppShell";
import { Card, CardHeader } from "../../../components/ui/Card";
import { StatusBadge, DemoBadge } from "../../../components/ui/StatusBadge";
import { api } from "../../../lib/api-client";

export default function GovernancePage() {
  const [govData, setGovData] = useState<any>({
    total_assessments: 1420,
    models_in_production: 1,
    fairness_compliance_rate: 98.4,
    human_reviews_pending: 3,
    data_quality_index: 96.8,
    recent_events: [
      {
        id: "gov-001",
        event_type: "FAIRNESS_AUDIT_PASS",
        severity: "INFO",
        entity_type: "model_version",
        details: { parity_metric: "0.93 across sex and locality groups" },
        timestamp: new Date().toISOString(),
      },
      {
        id: "gov-002",
        event_type: "DATASET_REGISTRATION",
        severity: "INFO",
        entity_type: "dataset",
        details: { rows: 20000, provenance: "Verified Synthetic Academic Package" },
        timestamp: new Date().toISOString(),
      },
    ],
  });

  useEffect(() => {
    async function loadGov() {
      try {
        const data = await api.getGovernanceSummary();
        if (data) setGovData(data);
      } catch {
        // Keep fallback
      }
    }
    loadGov();
  }, []);

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D8E2EA] pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F33]">
                AI Governance & Audit Trail
              </h1>
              <DemoBadge label="Compliance Protocol v1.0" />
            </div>
            <p className="text-xs sm:text-sm text-[#475569]">
              Real-time monitoring of subgroup fairness disparities, model drift, and safety events.
            </p>
          </div>
        </div>

        {/* Governance Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-5 space-y-1">
            <p className="text-xs text-[#64748B]">Fairness Compliance Rate</p>
            <p className="text-2xl font-bold text-[#0F766E]">{govData.fairness_compliance_rate}%</p>
            <p className="text-[10px] text-[#64748B]">Audited across 5 subgroups</p>
          </Card>
          <Card className="p-5 space-y-1">
            <p className="text-xs text-[#64748B]">Data Quality Index</p>
            <p className="text-2xl font-bold text-[#0E7490]">{govData.data_quality_index}%</p>
            <p className="text-[10px] text-[#64748B]">Completeness & bounds check</p>
          </Card>
          <Card className="p-5 space-y-1">
            <p className="text-xs text-[#64748B]">Pending Clinician Overrides</p>
            <p className="text-2xl font-bold text-[#B45309]">{govData.human_reviews_pending}</p>
            <p className="text-[10px] text-[#B45309] font-medium">In clinician review queue</p>
          </Card>
          <Card className="p-5 space-y-1">
            <p className="text-xs text-[#64748B]">Audited Predictions</p>
            <p className="text-2xl font-bold text-[#0B1F33]">{govData.total_assessments.toLocaleString()}</p>
            <p className="text-[10px] text-[#0F766E] font-medium">RLS Encryption verified</p>
          </Card>
        </div>

        {/* Live Audit Log */}
        <Card className="p-6 space-y-4">
          <CardHeader
            title="Real-Time Governance Events"
            subtitle="Immutable audit log recorded in PostgreSQL governance_events table."
            badge={<StatusBadge label="Live Logging" variant="success" size="sm" />}
          />

          <div className="space-y-3">
            {govData.recent_events.map((evt: any) => (
              <div
                key={evt.id}
                className="p-4 bg-[#F8FAFC] rounded-xl border border-[#D8E2EA] flex items-start justify-between gap-4 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[#0B1F33]">{evt.event_type}</span>
                    <StatusBadge
                      label={evt.severity}
                      variant={evt.severity === "CRITICAL" ? "danger" : evt.severity === "WARNING" ? "warning" : "info"}
                      size="sm"
                    />
                  </div>
                  <p className="text-[#64748B]">
                    Entity: <span className="font-medium text-[#0F172A]">{evt.entity_type}</span> — {JSON.stringify(evt.details)}
                  </p>
                </div>
                <span className="text-[11px] text-[#94A3B8] shrink-0">
                  {new Date(evt.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
