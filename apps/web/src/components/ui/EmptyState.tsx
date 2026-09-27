import React, { ReactNode } from "react";
import { AlertCircle } from "lucide-react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon = <AlertCircle className="w-8 h-8 text-[#0E7490]" aria-hidden="true" />,
  title,
  description,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 border border-dashed border-[#CBD5E1] rounded-2xl bg-[#F8FAFC]/50 ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-[#0E7490]/10 flex items-center justify-center mb-4 text-[#0E7490]">
        {icon}
      </div>
      <h3 className="text-base sm:text-lg font-semibold text-[#0B1F33] mb-1">{title}</h3>
      <p className="text-xs sm:text-sm text-[#475569] max-w-md mb-6">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
}
