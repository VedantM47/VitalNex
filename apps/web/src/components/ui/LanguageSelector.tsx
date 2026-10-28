"use client";

import React, { useState, useRef, useEffect } from "react";
import { Globe, Check } from "lucide-react";
import { useTranslation, SUPPORTED_LANGUAGES, type SupportedLanguage } from "../../lib/i18n";

export function LanguageSelector({ variant = "normal" }: { variant?: "normal" | "compact" }) {
  const { language, setLanguage, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Each language is shown in its own script (a proper name, not translated) plus its name in the
  // current interface language.
  const languages: { code: SupportedLanguage; label: string; native: string }[] = SUPPORTED_LANGUAGES.map((l) => ({
    code: l.code,
    label: t(`common.langName.${l.code}`),
    native: l.nativeName,
  }));

  const currentLang = languages.find((l) => l.code === language) || languages[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={t("common.selectLanguage")}
        className={`inline-flex items-center gap-2 rounded-xl border border-[#D8E2EA] bg-white text-[#0B1F33] hover:bg-[#F8FAFC] transition-colors focus-visible:outline-2 focus-visible:outline-[#0E7490] ${
          variant === "compact" ? "h-9 px-2.5 text-xs" : "h-10 px-3 text-xs sm:text-sm font-medium"
        }`}
      >
        <Globe className="w-4 h-4 text-[#0E7490] shrink-0" aria-hidden="true" />
        <span>{currentLang.native}</span>
      </button>

      {isOpen && (
        <div
          role="listbox"
          className="absolute right-0 mt-1.5 w-44 rounded-xl bg-white border border-[#D8E2EA] shadow-lg py-1.5 z-50 focus:outline-none"
        >
          {languages.map((item) => (
            <button
              key={item.code}
              role="option"
              aria-selected={item.code === language}
              onClick={() => {
                setLanguage(item.code);
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2 text-xs sm:text-sm text-left transition-colors ${
                item.code === language
                  ? "bg-[#0E7490]/10 text-[#0E7490] font-semibold"
                  : "text-[#0F172A] hover:bg-[#F1F5F9]"
              }`}
            >
              <span>{item.native} <span className="text-xs text-[#64748B] font-normal">({item.label})</span></span>
              {item.code === language && (
                <Check className="w-4 h-4 text-[#0E7490] shrink-0" aria-hidden="true" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
