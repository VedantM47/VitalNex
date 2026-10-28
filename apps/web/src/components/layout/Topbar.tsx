"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Menu, LogOut } from "lucide-react";
import { LanguageSelector } from "../ui/LanguageSelector";
import { useAuth } from "../../lib/auth-context";
import { useTranslation } from "../../lib/i18n";

export function Topbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const { role, logout } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();
  return (
    <header className="h-16 bg-white border-b border-[#D8E2EA] px-4 sm:px-6 flex items-center justify-between shrink-0 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        {onMenuClick && (
          <button
            type="button"
            onClick={onMenuClick}
            aria-label={t("shell.openMenu")}
            className="md:hidden p-2 text-[#475569] hover:bg-[#F1F5F9] rounded-xl focus-visible:outline-2 focus-visible:outline-[#0E7490]"
          >
            <Menu className="w-5 h-5" aria-hidden="true" />
          </button>
        )}
        <div className="hidden sm:block">
          <span className="text-xs font-semibold text-[#0E7490] tracking-wide uppercase">
            {t("shell.tag")}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {role && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#D8E2EA] bg-[#F8FAFC] text-xs font-semibold text-[#0B1F33]">
            <span className="w-2 h-2 rounded-full bg-[#0E7490]" aria-hidden="true" />
            {t(`auth.role.${role}`)}
          </span>
        )}

        {/* Language Selector */}
        <LanguageSelector variant="compact" />

        {/* Sign Out / User Avatar */}
        <button
          type="button"
          onClick={async () => {
            await logout();
            router.replace("/auth/login");
            router.refresh();
          }}
          aria-label={t("auth.signOut")}
          title={t("auth.signOut")}
          className="p-2 text-[#475569] hover:text-[#B42318] hover:bg-[#B42318]/10 rounded-xl transition-colors focus-visible:outline-2 focus-visible:outline-[#B42318]"
        >
          <LogOut className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
