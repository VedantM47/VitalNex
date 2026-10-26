"use client";

import React from "react";
import { Construction } from "lucide-react";
import { AppShell } from "./AppShell";
import { EmptyState } from "../ui/EmptyState";
import { useTranslation } from "../../lib/i18n";

/**
 * Shown instead of a page that is frozen for the MVP (docs/SPEC.md §1.2).
 * Rendered from the frozen route's layout.tsx, which does not render its children,
 * so the frozen page never mounts (no camera, microphone or API side effects).
 */
export function FrozenRouteNotice() {
  const { t } = useTranslation();
  return (
    <AppShell>
      <EmptyState
        icon={<Construction className="w-8 h-8" aria-hidden="true" />}
        title={t("status.notInMvpTitle")}
        description={t("status.notInMvpBody")}
      />
    </AppShell>
  );
}
