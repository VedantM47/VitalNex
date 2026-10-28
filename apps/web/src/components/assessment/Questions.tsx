"use client";

import React, { useId } from "react";
import { useTranslation } from "../../lib/i18n";

/** Small tag shown next to an answer that was filled in from the saved health profile. */
export function FromProfileTag() {
  const { t } = useTranslation();
  return (
    <span className="ml-2 inline-flex items-center rounded-full border border-[#0E7490]/40 bg-[#0E7490]/10 px-2 py-0.5 text-[11px] font-semibold text-[#0E7490]">
      {t("assess.fromProfile")}
    </span>
  );
}

interface ChoiceOption<T> {
  value: T;
  label: string;
}

/** Native radio group in a fieldset: arrow keys move between options, Tab leaves the group. */
export function ChoiceField<T extends string | number | boolean>({
  name,
  legend,
  help,
  options,
  value,
  onChange,
  error,
  prefilled,
  columns = 2,
}: {
  name: string;
  legend: string;
  help?: string;
  options: ChoiceOption<T>[];
  value: T | null;
  onChange: (v: T) => void;
  error?: string;
  prefilled?: boolean;
  columns?: 2 | 3 | 5;
}) {
  const id = useId();
  const grid = columns === 5 ? "sm:grid-cols-5" : columns === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2";
  return (
    <fieldset
      className="space-y-2"
      aria-describedby={[help ? `${id}-help` : "", error ? `${id}-err` : ""].join(" ").trim() || undefined}
      aria-invalid={!!error}
    >
      <legend className="text-sm font-semibold text-[#0F172A] leading-snug">
        {legend}
        {prefilled && <FromProfileTag />}
      </legend>
      {help && (
        <p id={`${id}-help`} className="text-xs text-[#475569]">
          {help}
        </p>
      )}
      <div className={`grid grid-cols-1 ${grid} gap-2`}>
        {options.map((o) => {
          const checked = value === o.value;
          return (
            <label
              key={String(o.value)}
              className={`flex min-h-[44px] cursor-pointer items-center gap-2.5 rounded-xl border px-3.5 py-2 text-sm transition-colors focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#0E7490] ${
                checked
                  ? "border-[#0E7490] bg-[#0E7490]/10 font-semibold text-[#0B1F33]"
                  : "border-[#CBD5E1] bg-white text-[#0F172A] hover:bg-[#F8FAFC]"
              }`}
            >
              <input
                type="radio"
                name={`${name}-${id}`}
                className="h-4 w-4 accent-[#0E7490]"
                checked={checked}
                onChange={() => onChange(o.value)}
              />
              <span>{o.label}</span>
            </label>
          );
        })}
      </div>
      {error && (
        <p id={`${id}-err`} role="alert" className="text-xs font-medium text-[#B42318]">
          {error}
        </p>
      )}
    </fieldset>
  );
}

export function YesNoField(props: {
  name: string;
  legend: string;
  help?: string;
  value: boolean | null;
  onChange: (v: boolean) => void;
  error?: string;
  prefilled?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <ChoiceField<boolean>
      {...props}
      options={[
        { value: true, label: t("assess.yes") },
        { value: false, label: t("assess.no") },
      ]}
    />
  );
}

export function NumberField({
  label,
  help,
  value,
  onChange,
  min,
  max,
  step = 1,
  unit,
  error,
  prefilled,
}: {
  label: string;
  help?: string;
  value: number | null;
  onChange: (v: number | null) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  error?: string;
  prefilled?: boolean;
}) {
  const id = useId();
  const describedBy = [help ? `${id}-help` : "", error ? `${id}-err` : ""].join(" ").trim() || undefined;
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-semibold text-[#0F172A]">
        {label}
        {prefilled && <FromProfileTag />}
      </label>
      {help && (
        <p id={`${id}-help`} className="text-xs text-[#475569]">
          {help}
        </p>
      )}
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="number"
          inputMode="decimal"
          min={min}
          max={max}
          step={step}
          value={value ?? ""}
          onChange={(e) => {
            const raw = e.target.value;
            if (raw === "") return onChange(null);
            const n = Number(raw);
            onChange(Number.isFinite(n) ? n : null);
          }}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className={`h-11 w-full max-w-[12rem] rounded-xl border bg-white px-3.5 text-sm text-[#0F172A] focus-visible:outline-2 focus-visible:outline-[#0E7490] ${
            error ? "border-[#B42318]" : "border-[#CBD5E1]"
          }`}
        />
        {unit && <span className="text-sm text-[#475569]">{unit}</span>}
      </div>
      {error && (
        <p id={`${id}-err`} role="alert" className="text-xs font-medium text-[#B42318]">
          {error}
        </p>
      )}
    </div>
  );
}
