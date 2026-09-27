import React, { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export function Card({ children, className = "", onClick, hoverable = false }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl border border-[#D8E2EA] p-5 sm:p-6 transition-all duration-150 shadow-[0_1px_3px_rgba(11,31,51,0.04)] ${
        hoverable ? "hover:border-[#0E7490] hover:shadow-[0_4px_12px_rgba(11,31,51,0.06)] cursor-pointer" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  badge,
  action,
  className = "",
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  badge?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-start justify-between gap-4 mb-4 ${className}`}>
      <div>
        <div className="flex items-center gap-2.5">
          <h3 className="text-base sm:text-lg font-semibold text-[#0B1F33] leading-snug">{title}</h3>
          {badge}
        </div>
        {subtitle && <p className="text-xs sm:text-sm text-[#475569] mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
