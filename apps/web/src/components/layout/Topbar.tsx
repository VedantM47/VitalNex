"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, Mic, Bell, UserCircle, LogOut, Check } from "lucide-react";
import { LanguageSelector } from "../ui/LanguageSelector";
import { useAuth, UserRole } from "../../lib/auth-context";
import { useTranslation } from "../../lib/i18n";

export function Topbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const { user, role, switchRole, logout } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  const roles: { id: UserRole; label: string; desc: string }[] = [
    { id: "patient", label: "Patient View", desc: "Personal Health Intelligence & Risk Assessment" },
    { id: "doctor", label: "Clinician View", desc: "Doctor Review Queue & Consultations" },
    { id: "researcher", label: "Researcher View", desc: "Model Laboratory & Governance Dashboard" },
  ];

  return (
    <header className="h-16 bg-white border-b border-[#D8E2EA] px-4 sm:px-6 flex items-center justify-between shrink-0 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        {onMenuClick && (
          <button
            type="button"
            onClick={onMenuClick}
            aria-label="Open mobile navigation menu"
            className="md:hidden p-2 text-[#475569] hover:bg-[#F1F5F9] rounded-xl focus-visible:outline-2 focus-visible:outline-[#0E7490]"
          >
            <Menu className="w-5 h-5" aria-hidden="true" />
          </button>
        )}
        <div className="hidden sm:block">
          <span className="text-xs font-semibold text-[#0E7490] tracking-wide uppercase">
            Clinical AI & Connected Care
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Role Switcher (Crucial for Demo Mode Testing) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setRoleMenuOpen(!roleMenuOpen)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#D8E2EA] bg-[#F8FAFC] text-xs font-semibold text-[#0B1F33] hover:bg-[#F1F5F9] focus-visible:outline-2 focus-visible:outline-[#0E7490]"
            aria-label="Switch demonstration user role"
          >
            <span className="w-2 h-2 rounded-full bg-[#0E7490]" aria-hidden="true" />
            <span className="capitalize">{role}</span>
          </button>

          {roleMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl bg-white border border-[#D8E2EA] shadow-xl py-2 z-50">
              <p className="px-3.5 py-1 text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider">
                Select Active Perspective
              </p>
              {roles.map((r) => (
                <button
                  key={r.id}
                  onClick={() => {
                    switchRole(r.id);
                    setRoleMenuOpen(false);
                    if (r.id === "doctor") router.push("/doctor/dashboard");
                    else if (r.id === "researcher") router.push("/admin/dashboard");
                    else router.push("/dashboard");
                  }}
                  className={`w-full text-left px-3.5 py-2.5 flex items-start justify-between text-xs transition-colors ${
                    role === r.id ? "bg-[#0E7490]/10 text-[#0E7490] font-semibold" : "hover:bg-[#F8FAFC] text-[#0F172A]"
                  }`}
                >
                  <div>
                    <p className="font-medium">{r.label}</p>
                    <p className="text-[10px] text-[#64748B] font-normal">{r.desc}</p>
                  </div>
                  {role === r.id && <Check className="w-4 h-4 text-[#0E7490] shrink-0" aria-hidden="true" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Language Selector */}
        <LanguageSelector variant="compact" />

        {/* Accessibility Voice Button */}
        <Link
          href="/voice"
          aria-label="Voice accessibility interface"
          className="p-2 rounded-xl text-[#0E7490] hover:bg-[#0E7490]/10 transition-colors focus-visible:outline-2 focus-visible:outline-[#0E7490]"
        >
          <Mic className="w-5 h-5" aria-hidden="true" />
        </Link>

        {/* Notifications */}
        <button
          type="button"
          aria-label="Notifications"
          className="relative p-2 text-[#475569] hover:bg-[#F1F5F9] rounded-xl focus-visible:outline-2 focus-visible:outline-[#0E7490]"
        >
          <Bell className="w-5 h-5" aria-hidden="true" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#0E7490]" />
        </button>

        {/* Sign Out / User Avatar */}
        <button
          type="button"
          onClick={() => logout()}
          aria-label="Sign out"
          title="Sign out"
          className="p-2 text-[#475569] hover:text-[#B42318] hover:bg-[#B42318]/10 rounded-xl transition-colors focus-visible:outline-2 focus-visible:outline-[#B42318]"
        >
          <LogOut className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
