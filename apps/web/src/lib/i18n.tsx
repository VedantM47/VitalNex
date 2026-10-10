"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import en from "../messages/en.json";
import hi from "../messages/hi.json";
import mr from "../messages/mr.json";

export type SupportedLanguage = "en" | "hi" | "mr";

export const SUPPORTED_LANGUAGES = [
  { code: "en" as const, name: "English", nativeName: "English" },
  { code: "hi" as const, name: "Hindi", nativeName: "हिंदी" },
  { code: "mr" as const, name: "Marathi", nativeName: "मराठी" },
];

interface I18nContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (path: string, fallback?: string) => string;
}

const dictionaries: Record<SupportedLanguage, any> = {
  en,
  hi,
  mr,
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("vitalnex_lang") as SupportedLanguage;
      if (saved && (saved === "en" || saved === "hi" || saved === "mr")) {
        return saved;
      }
    }
    return "en";
  });

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = language;
    }
  }, [language]);

  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang);
    localStorage.setItem("vitalnex_lang", lang);
    document.documentElement.lang = lang;
  };

  const t = (path: string, fallback?: string): string => {
    const keys = path.split(".");
    let current = dictionaries[language];

    for (const key of keys) {
      if (current && typeof current === "object" && key in current) {
        current = current[key];
      } else {
        // Fallback to English dictionary
        let enFallback = dictionaries.en;
        for (const k of keys) {
          if (enFallback && typeof enFallback === "object" && k in enFallback) {
            enFallback = enFallback[k];
          } else {
            return fallback || path;
          }
        }
        return typeof enFallback === "string" ? enFallback : fallback || path;
      }
    }

    return typeof current === "string" ? current : fallback || path;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useTranslation must be used within an I18nProvider");
  }
  return context;
}
