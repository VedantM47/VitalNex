"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  User,
  Activity,
  ShieldCheck,
  Stethoscope,
  Bot,
  Calendar,
  Clock,
  FileText,
  Settings,
  Lock,
  ChevronRight,
  BookOpen,
} from "lucide-react";
import { useTranslation } from "../../lib/i18n";
import { useAuth } from "../../lib/auth-context";
import { BrandLogo } from "./BrandLogo";
import { DemoBadge } from "../ui/StatusBadge";

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const { t } = useTranslation();
  const { role, user } = useAuth();

  const patientNav = [
    { label: t("nav.overview"), href: "/dashboard", icon: LayoutDashboard },
    { label: t("nav.myHealth"), href: "/health-profile", icon: User },
    { label: t("nav.riskAssessment"), href: "/risk-assessment", icon: Activity },
    { label: t("nav.aiTrust"), href: "/ai-trust", icon: ShieldCheck },
    { label: t("nav.careConnect"), href: "/care-connect", icon: Stethoscope },
    { label: t("nav.aiAssistant"), href: "/ai-assistant", icon: Bot },
  ];

  const secondaryNav = [
    { label: t("nav.appointments"), href: "/appointments", icon: Calendar },
    { label: t("nav.history"), href: "/history", icon: Clock },
    { label: t("nav.reports"), href: "/reports", icon: FileText },
    { label: t("nav.settings"), href: "/settings", icon: Settings },
  ];

  const doctorNav = [
    { label: t("nav.doctorDashboard"), href: "/doctor/dashboard", icon: LayoutDashboard },
    { label: t("nav.doctorPatients"), href: "/doctor/patients", icon: Activity },
    { label: t("nav.doctorAppointments"), href: "/doctor/appointments", icon: Calendar },
  ];

  const adminNav = [
    { label: t("nav.adminDashboard"), href: "/admin/dashboard", icon: LayoutDashboard },
    { label: t("nav.adminGovernance"), href: "/admin/governance", icon: Lock },
    { label: t("nav.adminDocs"), href: "/admin/docs", icon: BookOpen },
  ];

  const renderNavLink = (item: { label: string; href: string; icon: any }) => {
    const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
    const Icon = item.icon;

    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onClose}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-[#0E7490] ${
          isActive
            ? "bg-[#0B1F33] text-white shadow-sm"
            : "text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0B1F33]"
        }`}
      >
        <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-[#22C1DC]" : "text-[#64748B]"}`} aria-hidden="true" />
        <span className="truncate">{item.label}</span>
      </Link>
    );
  };

  return (
    <aside className="w-64 h-full bg-white border-r border-[#D8E2EA] flex flex-col justify-between overflow-y-auto">
      <div className="p-4 space-y-6">
        <div className="px-2 pt-1 flex items-center justify-between">
          <BrandLogo size="sm" />
        </div>

        <div className="px-2">
          <DemoBadge label={t("shell.demoEnv")} />
        </div>

        {role === "patient" && (
        <>
        {/* Primary Patient Section */}
        <div className="space-y-1">
          <p className="px-3 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-2">
            {t("shell.section.patient")}
          </p>
          {patientNav.map(renderNavLink)}
        </div>

        {/* Secondary Patient Section */}
        <div className="space-y-1 pt-2 border-t border-[#F1F5F9]">
          <p className="px-3 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-2">
            {t("shell.section.care")}
          </p>
          {secondaryNav.map(renderNavLink)}
        </div>
        </>
        )}

        {/* Clinician Portal (nav shows only the signed-in role's area; access is enforced server-side) */}
        {role === "doctor" && (
        <div className="space-y-1">
          <p className="px-3 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-2">
            {t("shell.section.doctor")}
          </p>
          {doctorNav.map(renderNavLink)}
          {renderNavLink({ label: t("nav.aiTrust"), href: "/ai-trust", icon: ShieldCheck })}
          {renderNavLink({ label: t("nav.settings"), href: "/settings", icon: Settings })}
        </div>
        )}

        {/* Admin / Governance Portal */}
        {role === "admin" && (
        <div className="space-y-1">
          <p className="px-3 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-2">
            {t("shell.section.admin")}
          </p>
          {adminNav.map(renderNavLink)}
          {renderNavLink({ label: t("nav.aiTrust"), href: "/ai-trust", icon: ShieldCheck })}
          {renderNavLink({ label: t("nav.settings"), href: "/settings", icon: Settings })}
        </div>
        )}
      </div>

      {/* User Footer Profile & Role Status */}
      <div className="p-4 border-t border-[#D8E2EA] bg-[#F8FAFC]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#0B1F33] text-[#22C1DC] flex items-center justify-center font-bold text-xs shrink-0">
            {user?.fullName ? user.fullName[0] : ""}
          </div>
          <div className="truncate flex-1 min-w-0">
            <p className="text-xs font-semibold text-[#0B1F33] truncate">{user?.fullName ?? ""}</p>
            <p className="text-[11px] text-[#64748B] truncate">{role ? t(`auth.role.${role}`) : ""}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
