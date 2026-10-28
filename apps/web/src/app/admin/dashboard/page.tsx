"use client";

// P6: headline aggregates only (no patient identities). Models come from model_meta.json via
// /admin/governance/models; counts from the database via /governance/summary and
// /admin/governance/overrides. A value the API did not compute is shown as "—".

import React, { useEffect, useState } from "react";
import { ArrowRight, Cpu, ShieldCheck, Stethoscope, UserCheck } from "lucide-react";
import { AppShell } from "../../../components/layout/AppShell";
import { StatCard } from "../../../components/ui/StatCard";
import { ButtonLink } from "../../../components/ui/Button";
import { Alert } from "../../../components/ui/Alert";
import { api, apiFailure } from "../../../lib/api-client";
import { useTranslation } from "../../../lib/i18n";
import { pct } from "../../../lib/format";

export default function AdminDashboardPage() {
  const { t } = useTranslation();
  const [models, setModels] = useState<unknown[] | null>(null);
  const [summary, setSummary] = useState<{ total_assessments: number; human_reviews_pending: number } | null>(null);
  const [overrides, setOverrides] = useState<{ agree_rate: number | null; reviewed: number } | null>(null);
  const [failure, setFailure] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const fail = (e: unknown) => active && setFailure(apiFailure(e));
    api.getGovModels().then((m) => active && setModels(m)).catch(fail);
    api.getGovernanceSummary().then((s) => active && setSummary(s)).catch(fail);
    api.getGovOverrides().then((o) => active && setOverrides(o)).catch(fail);
    return () => {
      active = false;
    };
  }, []);

  const show = (v: number | string | null | undefined) => (v === null || v === undefined ? "—" : String(v));

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="space-y-1 border-b border-[#D8E2EA] pb-6">
          <h1 className="text-2xl font-extrabold text-[#0B1F33] sm:text-3xl">{t("admin.dashboard.title")}</h1>
          <p className="text-xs text-[#475569] sm:text-sm">{t("admin.dashboard.subtitle")}</p>
        </div>

        {failure && <Alert kind="error">{failure === "signin" ? t("common.signInNeeded") : t("common.apiUnavailable")}</Alert>}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label={t("admin.dashboard.models")} value={show(models?.length)} icon={<Cpu className="h-5 w-5" aria-hidden="true" />} />
          <StatCard
            label={t("admin.dashboard.assessments")}
            value={show(summary?.total_assessments)}
            subtext={t("admin.dashboard.assessmentsSub")}
            icon={<ShieldCheck className="h-5 w-5" aria-hidden="true" />}
          />
          <StatCard
            label={t("admin.dashboard.pending")}
            value={show(summary?.human_reviews_pending)}
            icon={<Stethoscope className="h-5 w-5" aria-hidden="true" />}
          />
          <StatCard
            label={t("admin.dashboard.agreeRate")}
            value={overrides ? (pct(overrides.agree_rate) ?? t("common.notAvailable")) : "—"}
            subtext={overrides ? `${t("admin.gov.ov.reviewed")}: ${overrides.reviewed}` : undefined}
            icon={<UserCheck className="h-5 w-5" aria-hidden="true" />}
          />
        </div>

        <ButtonLink href="/admin/governance" size="md">
          {t("admin.dashboard.open")}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </ButtonLink>
      </div>
    </AppShell>
  );
}
