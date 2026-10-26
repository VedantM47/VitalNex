"use client";

// Read-only review queue backed by Supabase (only patients with an active
// share_with_clinician consent are returned, enforced by RLS). The case view and
// Agree / Override actions with a required reason are built in P6.

import React, { useCallback, useEffect, useState } from "react";
import { Activity, RefreshCw, UserCheck } from "lucide-react";
import { AppShell } from "../../../components/layout/AppShell";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { EmptyState } from "../../../components/ui/EmptyState";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { api } from "../../../lib/api-client";
import { useTranslation } from "../../../lib/i18n";

interface QueueItem {
  id: string;
  assessment_id: string;
  patient_name: string | null;
  reasons: string[];
  status: "pending" | "agreed" | "overridden";
  clinician_note: string | null;
  created_at: string;
}

const STATUS_VARIANT = { pending: "warning", agreed: "success", overridden: "info" } as const;

export default function DoctorPatientsPage() {
  const { t, language } = useTranslation();
  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      setItems(await api.getDoctorReviews());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    api
      .getDoctorReviews()
      .then((data) => active && setItems(data))
      .catch(() => active && setError(true))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D8E2EA] pb-6">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F33]">{t("reviewQueue.title")}</h1>
            <p className="text-xs sm:text-sm text-[#475569]">{t("reviewQueue.subtitle")}</p>
          </div>
          <Button variant="outline" size="sm" onClick={load} isLoading={loading}>
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" />
            {t("reviewQueue.refresh")}
          </Button>
        </div>

        {error ? (
          <p role="alert" className="text-xs text-[#B42318] bg-[#B42318]/5 border border-[#B42318]/20 rounded-xl p-3">
            {t("reviewQueue.loadFailed")}
          </p>
        ) : !loading && items.length === 0 ? (
          <EmptyState
            icon={<UserCheck className="w-8 h-8" aria-hidden="true" />}
            title={t("reviewQueue.emptyTitle")}
            description={t("reviewQueue.emptyBody")}
          />
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <Card key={item.id} className="p-6 space-y-4 border-[#D8E2EA]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#0B1F33] flex items-center justify-center shrink-0">
                      <Activity className="w-5 h-5 text-[#22C1DC]" aria-hidden="true" />
                    </div>
                    <div>
                      <h2 className="font-bold text-base text-[#0B1F33]">{item.patient_name ?? "—"}</h2>
                      <p className="text-xs text-[#475569]">
                        {t("reviewQueue.screenedOn")}{" "}
                        {new Date(item.created_at).toLocaleDateString(language === "en" ? "en-IN" : `${language}-IN`, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                  <StatusBadge
                    label={t(`reviewQueue.status.${item.status}`)}
                    variant={STATUS_VARIANT[item.status]}
                    size="sm"
                  />
                </div>

                <div className="text-xs space-y-1.5">
                  <span className="font-semibold text-[#0B1F33]">{t("reviewQueue.reasonsLabel")}:</span>
                  <ul className="flex flex-wrap gap-2">
                    {item.reasons.map((r) => (
                      <li key={r} className="px-2.5 py-1 rounded-lg bg-[#F1F5F9] text-[#0B1F33]">
                        {t(`reviewQueue.reason.${r}`)}
                      </li>
                    ))}
                  </ul>
                </div>

                {item.clinician_note && (
                  <div className="p-3 bg-[#F0FDF4] rounded-xl border border-[#0F766E]/20 text-xs">
                    <span className="font-bold text-[#0F766E]">{t("reviewQueue.clinicianNote")}:</span>{" "}
                    <span className="text-[#0F766E]">{item.clinician_note}</span>
                  </div>
                )}

                <p className="text-[11px] text-[#64748B]">{t("reviewQueue.actionsUnavailable")}</p>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
