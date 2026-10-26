"use client";

// P0: the old page showed hardcoded metrics (Brier 0.082, parity 0.93, "Platt Isotonic",
// TreeSHAP, "11 dimensions") that no code computed. Rebuilt in P7 from
// ml/artifacts/<disease>/model_meta.json and database aggregates.

import React from "react";
import { ShieldCheck } from "lucide-react";
import { AppShell } from "../../components/layout/AppShell";
import { EmptyState } from "../../components/ui/EmptyState";
import { useTranslation } from "../../lib/i18n";

export default function AITrustPassportPage() {
  const { t } = useTranslation();

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="border-b border-[#D8E2EA] pb-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F33]">{t("nav.aiTrust")}</h1>
        </div>

        <EmptyState
          icon={<ShieldCheck className="w-8 h-8" aria-hidden="true" />}
          title={t("status.trustUnavailableTitle")}
          description={t("status.trustUnavailableBody")}
        />
      </div>
    </AppShell>
  );
}
