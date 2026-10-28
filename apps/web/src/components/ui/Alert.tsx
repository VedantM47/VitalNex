import React, { ReactNode } from "react";

/** Inline message. "error" is announced immediately (role=alert), others politely (role=status). */
export function Alert({
  kind = "info",
  children,
  className = "",
}: {
  kind?: "info" | "success" | "error" | "warning";
  children: ReactNode;
  className?: string;
}) {
  const styles = {
    info: "border-[#0E7490]/30 bg-[#0E7490]/5 text-[#0F172A]",
    success: "border-[#0F766E]/40 bg-[#ECFDF5] text-[#065F46]",
    error: "border-[#B42318]/30 bg-[#FEF2F2] text-[#991B1B]",
    warning: "border-[#B45309]/30 bg-[#FFFBEB] text-[#78350F]",
  };
  return (
    <div role={kind === "error" ? "alert" : "status"} className={`rounded-xl border p-3 text-sm ${styles[kind]} ${className}`}>
      {children}
    </div>
  );
}
