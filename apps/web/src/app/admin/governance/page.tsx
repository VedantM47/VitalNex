"use client";

// P0: hardcoded fallback metrics (98.4% fairness, 96.8 data quality, 1,420 predictions,
// "RLS Encryption verified") were removed. Only API values are shown; metrics the API
// has not computed are shown as "not available". Rebuilt in P6.

import React, { useState, useEffect } from "react";
import { AppShell } from "../../../components/layout/AppShell";
import { Card, CardHeader } from "../../../components/ui/Card";
import { EmptyState } from "../../../components/ui/EmptyState";
import { StatusBadge, DemoBadge } from "../../../components/ui/StatusBadge";
import { api } from "../../../lib/api-client";
import { useTranslation } from "../../../lib/i18n";

const NOT_AVAILABLE = "not available";

export default function GovernancePage() {
  const { t } = useTranslation();
  const [govData, setGovData] = useState<any | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let active = true;
    api
      .getGovernanceSummary()
      .then((data) => active && setGovData(data))
      .catch(() => active && setLoadError(true));
    return () => {
      active = false;
    };
  }, []);

  const metric = (value: number | null | undefined, suffix = "") =>
    value === null || value === undefined ? NOT_AVAILABLE : `${value}${suffix}`;

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D8E2EA] pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F33]">Governance &amp; Audit</h1>
              <DemoBadge label="Admin" />
            </div>
            <p className="text-xs sm:text-sm text-[#475569]">
              Aggregate review activity, fairness results and audit events.
            </p>
          </div>
        </div>

        {loadError ? (
          <EmptyState title={t("common.error")} description={t("status.noDataBody")} />
        ) : govData === null ? (
          <p className="text-sm text-[#64748B]">{t("common.loading")}</p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="p-5 space-y-1">
                <p className="text-xs text-[#64748B]">Fairness results</p>
                <p className="text-lg font-bold text-[#0B1F33]">{metric(govData.fairness_compliance_rate, "%")}</p>
                <p className="text-[10px] text-[#64748B]">Computed after model training</p>
              </Card>
              <Card className="p-5 space-y-1">
                <p className="text-xs text-[#64748B]">Data quality index</p>
                <p className="text-lg font-bold text-[#0B1F33]">{metric(govData.data_quality_index, "%")}</p>
                <p className="text-[10px] text-[#64748B]">Computed from real assessments</p>
              </Card>
              <Card className="p-5 space-y-1">
                <p className="text-xs text-[#64748B]">Pending clinician reviews</p>
                <p className="text-lg font-bold text-[#0B1F33]">{metric(govData.human_reviews_pending)}</p>
              </Card>
              <Card className="p-5 space-y-1">
                <p className="text-xs text-[#64748B]">Assessments recorded</p>
                <p className="text-lg font-bold text-[#0B1F33]">{metric(govData.total_assessments)}</p>
              </Card>
            </div>

            <Card className="p-6 space-y-4">
              <CardHeader title="Audit events" />
              {govData.recent_events.length === 0 ? (
                <EmptyState title={t("status.noDataTitle")} description={t("status.noDataBody")} />
              ) : (
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
                          Entity: <span className="font-medium text-[#0F172A]">{evt.entity_type}</span> —{" "}
                          {JSON.stringify(evt.details)}
                        </p>
                      </div>
                      <span className="text-[11px] text-[#94A3B8] shrink-0">
                        {new Date(evt.timestamp).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </>
        )}
      </div>
    </AppShell>
  );
}
