import React from "react";
import { CheckCircle2, AlertTriangle, AlertCircle, Info, Clock, ShieldCheck } from "lucide-react";

export type StatusVariant = "success" | "warning" | "danger" | "info" | "neutral";

interface StatusBadgeProps {
  label: string;
  variant?: StatusVariant;
  icon?: React.ReactNode;
  size?: "sm" | "md";
  className?: string;
}

export function StatusBadge({
  label,
  variant = "info",
  icon,
  size = "md",
  className = "",
}: StatusBadgeProps) {
  const styles = {
    success: "bg-[#0F766E]/10 text-[#0F766E] border-[#0F766E]/30",
    warning: "bg-[#B45309]/10 text-[#B45309] border-[#B45309]/30",
    danger: "bg-[#B42318]/10 text-[#B42318] border-[#B42318]/30",
    info: "bg-[#0E7490]/10 text-[#0E7490] border-[#0E7490]/30",
    neutral: "bg-[#475569]/10 text-[#475569] border-[#475569]/30",
  };

  const defaultIcons = {
    success: <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />,
    warning: <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />,
    danger: <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />,
    info: <Info className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />,
    neutral: <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />,
  };

  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-xs gap-1" : "px-2.5 py-1 text-xs sm:text-sm gap-1.5";

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${styles[variant]} ${sizeClasses} ${className}`}
    >
      {icon || defaultIcons[variant]}
      <span>{label}</span>
    </span>
  );
}

export function RiskBadge({ band }: { band: "Low" | "Moderate" | "High" | string }) {
  if (band === "Low") {
    return (
      <StatusBadge
        label="Low Risk"
        variant="success"
        icon={<ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />}
      />
    );
  }
  if (band === "Moderate") {
    return (
      <StatusBadge
        label="Moderate Risk"
        variant="warning"
        icon={<AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />}
      />
    );
  }
  if (band === "High") {
    return (
      <StatusBadge
        label="High Risk (Review Advised)"
        variant="danger"
        icon={<AlertCircle className="w-3.5 h-3.5" aria-hidden="true" />}
      />
    );
  }
  return <StatusBadge label={band || "Pending Evaluation"} variant="neutral" />;
}

export function DemoBadge({ label = "Demo Mode" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-semibold tracking-wide uppercase bg-[#0B1F33] text-[#22C1DC] border border-[#22C1DC]/30 rounded-full">
      <span className="w-1.5 h-1.5 rounded-full bg-[#22C1DC] animate-pulse" aria-hidden="true" />
      {label}
    </span>
  );
}
