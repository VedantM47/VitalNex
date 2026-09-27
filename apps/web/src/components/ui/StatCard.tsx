import React, { ReactNode } from "react";
import { Card } from "./Card";

interface StatCardProps {
  label: string;
  value: ReactNode;
  subtext?: string;
  icon?: ReactNode;
  trend?: {
    text: string;
    positive?: boolean;
  };
  className?: string;
}

export function StatCard({ label, value, subtext, icon, trend, className = "" }: StatCardProps) {
  return (
    <Card className={`relative overflow-hidden ${className}`}>
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <p className="text-xs sm:text-sm font-medium text-[#475569]">{label}</p>
          <div className="text-2xl sm:text-3xl font-bold text-[#0B1F33] tracking-tight">{value}</div>
          {subtext && <p className="text-xs text-[#64748B]">{subtext}</p>}
          {trend && (
            <p
              className={`text-xs font-medium inline-flex items-center gap-1 ${
                trend.positive ? "text-[#0F766E]" : "text-[#B45309]"
              }`}
            >
              {trend.text}
            </p>
          )}
        </div>
        {icon && (
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#F0FDF4]/80 text-[#0E7490] flex items-center justify-center shrink-0 border border-[#D8E2EA]">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}

export function ProgressBar({
  value,
  max = 100,
  label,
  className = "",
  showPercentage = true,
}: {
  value: number;
  max?: number;
  label?: string;
  className?: string;
  showPercentage?: boolean;
}) {
  const percentage = Math.min(100, Math.max(0, Math.round((value / max) * 100)));

  return (
    <div className={`w-full space-y-1.5 ${className}`}>
      {(label || showPercentage) && (
        <div className="flex justify-between items-center text-xs text-[#475569]">
          {label && <span className="font-medium">{label}</span>}
          {showPercentage && <span className="font-semibold text-[#0B1F33]">{percentage}%</span>}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label || "Progress indicator"}
        className="w-full h-2.5 bg-[#E2E8F0] rounded-full overflow-hidden"
      >
        <div
          className="h-full bg-gradient-to-r from-[#0E7490] to-[#22C1DC] rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
