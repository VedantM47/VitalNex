"use client";

// P5: real assessments only (GET /api/v1/assessment/history), a band-over-time chart per
// condition, and clinician review badges/notes. No probabilities (D-10); empty and error
// states are shown honestly.

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Activity, Clock, RefreshCw } from "lucide-react";
import { AppShell } from "../../components/layout/AppShell";
import { Card, CardHeader } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { BandTrendChart } from "../../components/assessment/BandTrendChart";
import { AssessmentRow } from "../../components/assessment/AssessmentRow";
import { api, apiFailure, type ApiFailure } from "../../lib/api-client";
import { useTranslation } from "../../lib/i18n";
import { useAuth } from "../../lib/auth-context";
import type { AssessmentRecord } from "../../lib/assessment";

interface Loaded {
  assessments: AssessmentRecord[];
  hidden: boolean;
  failure: ApiFailure | null;
}

async function fetchAll(): Promise<Loaded> {
  try {
    const data = await api.getAssessmentHistory();
    return { assessments: data?.assessments ?? [], hidden: !!data?.hidden, failure: null };
  } catch (err) {
    return { assessments: [], hidden: false, failure: apiFailure(err) };
  }
}

export default function HistoryPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [state, setState] = useState<Loaded | null>(null);
  const [reloading, setReloading] = useState(false);

  useEffect(() => {
    let active = true;
    fetchAll().then((r) => active && setState(r));
    return () => {
      active = false;
    };
  }, [userId]);

  const reload = async () => {
    setReloading(true);
    setState(await fetchAll());
    setReloading(false);
  };

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="flex flex-col justify-between gap-4 border-b border-[#D8E2EA] pb-6 sm:flex-row sm:items-center">
          <div className="space-y-1">
            <h1 className="text-2xl font-extrabold text-[#0B1F33] sm:text-3xl">{t("nav.history")}</h1>
            <p className="text-xs text-[#475569] sm:text-sm">{t("historyPage.subtitle")}</p>
          </div>
          <Button variant="outline" size="sm" onClick={reload} isLoading={reloading} leftIcon={<RefreshCw className="h-3.5 w-3.5" />}>
            {t("common.retry")}
          </Button>
        </div>

        {state === null ? (
          <p className="text-sm text-[#475569]" aria-live="polite">
            {t("common.loading")}
          </p>
        ) : state.failure ? (
          <EmptyState title={t("historyPage.unavailableTitle")} description={t(`assess.errors.${state.failure}`)} />
        ) : state.hidden ? (
          <EmptyState title={t("historyPage.hiddenTitle")} description={t("historyPage.hiddenBody")} />
        ) : state.assessments.length === 0 ? (
          <EmptyState
            icon={<Clock className="h-8 w-8" aria-hidden="true" />}
            title={t("historyPage.emptyTitle")}
            description={t("historyPage.emptyBody")}
            action={
              <Link href="/risk-assessment">
                <Button variant="primary" size="sm" leftIcon={<Activity className="h-3.5 w-3.5" />}>
                  {t("dashboard.btnStartAssessment")}
                </Button>
              </Link>
            }
          />
        ) : (
          <>
            <Card className="space-y-4">
              <CardHeader title={t("historyPage.trendTitle")} subtitle={t("historyPage.trendIntro")} />
              <BandTrendChart records={state.assessments} />
            </Card>
            <Card className="space-y-4">
              <CardHeader title={t("historyPage.listTitle")} subtitle={t("assess.notDiagnosis")} />
              <ul className="space-y-3">
                {state.assessments.map((a) => (
                  <AssessmentRow key={a.id} record={a} />
                ))}
              </ul>
            </Card>
          </>
        )}
      </div>
    </AppShell>
  );
}
