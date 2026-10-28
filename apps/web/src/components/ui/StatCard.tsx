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
