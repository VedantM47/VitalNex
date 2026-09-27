"use client";

import React, { ButtonHTMLAttributes, forwardRef } from "react";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "teal" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      className = "",
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 select-none cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

    const variantStyles = {
      primary: "bg-[#0B1F33] text-white hover:bg-[#132E4A] active:bg-[#081726] focus-visible:outline-[#0E7490]",
      secondary: "bg-[#F1F5F9] text-[#0F172A] hover:bg-[#E2E8F0] active:bg-[#CBD5E1] border border-[#D8E2EA] focus-visible:outline-[#0E7490]",
      teal: "bg-[#0E7490] text-white hover:bg-[#0C627A] active:bg-[#094E61] focus-visible:outline-[#22C1DC]",
      outline: "bg-transparent text-[#0B1F33] border border-[#CBD5E1] hover:bg-[#F8FAFC] active:bg-[#F1F5F9] focus-visible:outline-[#0E7490]",
      ghost: "bg-transparent text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A] focus-visible:outline-[#0E7490]",
      danger: "bg-[#B42318] text-white hover:bg-[#991B1B] active:bg-[#7F1D1D] focus-visible:outline-[#B42318]",
    };

    const sizeStyles = {
      sm: "h-9 px-3.5 text-xs gap-1.5 min-h-[36px]",
      md: "h-11 px-5 text-sm gap-2 min-h-[44px]",
      lg: "h-12 px-6 text-base gap-2.5 min-h-[48px]",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current" aria-hidden="true" />
        ) : (
          leftIcon && <span className="inline-flex shrink-0" aria-hidden="true">{leftIcon}</span>
        )}
        <span>{children}</span>
        {!isLoading && rightIcon && (
          <span className="inline-flex shrink-0" aria-hidden="true">{rightIcon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
