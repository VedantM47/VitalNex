import React from "react";
import { AlertOctagon, AlertTriangle, HelpCircle, ShieldCheck } from "lucide-react";
import type { Band } from "../../lib/assessment";

/** Band shown with colour + icon + text, never colour alone. `band = null` means not confident. */
const STYLE: Record<Band | "none", { cls: string; Icon: typeof ShieldCheck }> = {
  low: { cls: "bg-[#ECFDF5] text-[#065F46] border-[#0F766E]/40", Icon: ShieldCheck },
  moderate: { cls: "bg-[#FFFBEB] text-[#92400E] border-[#B45309]/40", Icon: AlertTriangle },
  high: { cls: "bg-[#FEF2F2] text-[#991B1B] border-[#B42318]/40", Icon: AlertOctagon },
  none: { cls: "bg-[#F1F5F9] text-[#334155] border-[#475569]/40", Icon: HelpCircle },
};

export function BandBadge({
  band,
  label,
  size = "md",
}: {
  band: Band | null;
  label: string;
  size?: "sm" | "md" | "lg";
}) {
  const { cls, Icon } = STYLE[band ?? "none"];
  const sz =
    size === "lg"
      ? "px-3.5 py-1.5 text-base gap-2"
      : size === "sm"
        ? "px-2 py-0.5 text-xs gap-1"
        : "px-2.5 py-1 text-sm gap-1.5";
  const icon = size === "lg" ? "w-5 h-5" : size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4";
  return (
    <span className={`inline-flex items-center rounded-full border font-semibold ${cls} ${sz}`}>
      <Icon className={`${icon} shrink-0`} aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}
