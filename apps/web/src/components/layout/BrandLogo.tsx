import React from "react";
import Link from "next/link";

export function BrandLogo({
  variant = "full",
  size = "md",
  className = "",
}: {
  variant?: "full" | "mark";
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const markSizes = {
    sm: "w-7 h-7",
    md: "w-8 h-8",
    lg: "w-10 h-10",
  };

  const textSizes = {
    sm: "text-base font-bold",
    md: "text-lg sm:text-xl font-bold",
    lg: "text-2xl font-extrabold",
  };

  return (
    <Link
      href="/"
      className={`inline-flex items-center gap-2.5 select-none focus-visible:outline-2 focus-visible:outline-[#0E7490] rounded-lg ${className}`}
      aria-label="VITALNEX Home"
    >
      {/* Precision Geometric V + Pulse Mark */}
      <div
        className={`${markSizes[size]} rounded-xl bg-[#0B1F33] text-[#22C1DC] flex items-center justify-center shrink-0 border border-[#0E7490]/30 shadow-sm`}
      >
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5 text-[#22C1DC]"
          aria-hidden="true"
        >
          {/* V shaped connected nodes with cardiometabolic waveform pulse */}
          <path
            d="M6 8L12 24L16 16L19 22L22 14L26 8"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="16" cy="16" r="2.2" fill="#0F766E" />
        </svg>
      </div>

      {variant === "full" && (
        <div className="flex flex-col">
          <span className={`tracking-wider text-[#0B1F33] leading-none ${textSizes[size]}`}>
            VITAL<span className="text-[#0E7490]">NEX</span>
          </span>
          <span className="text-[10px] text-[#64748B] tracking-normal font-medium mt-0.5 hidden sm:inline">
            Health. Humanity. High-Tech.
          </span>
        </div>
      )}
    </Link>
  );
}
