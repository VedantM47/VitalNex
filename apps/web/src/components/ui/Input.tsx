"use client";

import React, { InputHTMLAttributes, forwardRef, useId } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, rightElement, className = "", id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs sm:text-sm font-medium text-[#0F172A]">
            {label}
            {props.required && <span className="text-[#B42318] ml-1">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 text-[#64748B] pointer-events-none flex items-center">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
            className={`w-full h-11 px-3.5 bg-white text-[#0F172A] border rounded-xl text-sm placeholder:text-[#94A3B8] transition-all duration-150 focus-visible:outline-2 focus-visible:outline-[#0E7490] focus-visible:border-[#0E7490] ${
              leftIcon ? "pl-10" : ""
            } ${rightElement ? "pr-12" : ""} ${
              error ? "border-[#B42318] focus-visible:outline-[#B42318]" : "border-[#CBD5E1]"
            } ${className}`}
            {...props}
          />
          {rightElement && <div className="absolute right-3.5 flex items-center">{rightElement}</div>}
        </div>
        {error && (
          <p id={`${inputId}-error`} role="alert" className="text-xs text-[#B42318] font-medium">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id={`${inputId}-helper`} className="text-xs text-[#64748B]">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
