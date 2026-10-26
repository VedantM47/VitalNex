"use client";

// P0: the old profile pre-filled invented clinical values (age 48, BP 135, ca=0,
// thal=3, cp=4 …) and asked for socioeconomic band (CLAUDE.md hard rules 3 and 10).
// It is replaced in P5 by the 14-feature contract in docs/SPEC.md §3.3.

import React from "react";
import Link from "next/link";
import { User } from "lucide-react";
import { AppShell } from "../../components/layout/AppShell";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { useTranslation } from "../../lib/i18n";

export default function HealthProfilePage() {
  const { t } = useTranslation();

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="border-b border-[#D8E2EA] pb-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F33]">{t("nav.myHealth")}</h1>
        </div>

        <EmptyState
          icon={<User className="w-8 h-8" aria-hidden="true" />}
          title={t("status.profileRebuildTitle")}
          description={t("status.profileRebuildBody")}
          action={
            <Link href="/settings">
              <Button variant="secondary" size="sm">
                {t("nav.settings")}
              </Button>
            </Link>
          }
        />
      </div>
    </AppShell>
  );
}
