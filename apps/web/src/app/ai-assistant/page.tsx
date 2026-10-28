"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Bot, ExternalLink, Phone, RotateCcw, Send, ShieldCheck, Siren, User } from "lucide-react";
import { AppShell } from "../../components/layout/AppShell";
import { Button } from "../../components/ui/Button";
import { api, apiFailure } from "../../lib/api-client";
import { SUPPORTED_LANGUAGES, useTranslation, type SupportedLanguage } from "../../lib/i18n";

/**
 * SPEC §5 assistant. Every reply comes from the server's fixed, pre-written library (templates, sourced
 * FAQ, navigation). Nothing is generated here and no message is stored in the browser beyond this page.
 * D-26: when the server sets `emergency_card`, the 108 / 112 card is shown above the reply.
 */

interface Suggestion {
  id: string;
  label: string;
  action_type: string; // ask | navigate | emergency_call
  payload?: { path?: string; numbers?: string[] };
}

interface Citation {
  title: string;
  url: string;
}

interface AssistantResponse {
  id: string;
  response: string;
  language: SupportedLanguage;
  intent?: string | null;
  emergency_card?: boolean;
  suggestions: Suggestion[];
  citations: Citation[];
}

type Message =
  | { id: string; role: "user"; text: string }
  | { id: string; role: "assistant"; kind: "welcome" }
  | { id: string; role: "assistant"; kind: "error"; signIn: boolean }
  | { id: string; role: "assistant"; kind: "reply"; data: AssistantResponse };

const CHIPS = ["explain", "change", "disease", "ai", "doctor", "data"] as const;
const WELCOME: Message = { id: "welcome", role: "assistant", kind: "welcome" };

function EmergencyCard({ fullEmergency, text }: { fullEmergency: boolean; text?: string }) {
  const { t } = useTranslation();
  const call =
    "flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-white px-4 text-base font-extrabold text-[#7F1D1D] focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-white";
  return (
    <div role="alert" className="space-y-3 rounded-2xl bg-[#7F1D1D] p-4 text-white shadow-sm">
      <div className="flex items-start gap-2">
        <Siren className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
        <p className="text-sm font-extrabold leading-snug sm:text-base">{t("assistant.emergencyCard.title")}</p>
      </div>
      <p className="whitespace-pre-line text-sm leading-relaxed">
        {fullEmergency && text ? text : t("assistant.emergencyCard.body")}
      </p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <a href="tel:108" className={call}>
          <Phone className="h-4 w-4" aria-hidden="true" />
          {t("assistant.emergencyCard.call108")}
        </a>
        <a href="tel:112" className={call}>
          <Phone className="h-4 w-4" aria-hidden="true" />
          {t("assistant.emergencyCard.call112")}
        </a>
      </div>
      {!fullEmergency && <p className="text-xs text-[#FEE2E2]">{t("assistant.emergencyCard.answerBelow")}</p>}
    </div>
  );
}

export default function AIAssistantPage() {
  const { t, language, setLanguage } = useTranslation();
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages, isLoading]);

  const send = async (raw?: string) => {
    const text = (raw ?? input).trim();
    if (!text || isLoading) return;
    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: "user", text }]);
    setInput("");
    setIsLoading(true);
    try {
      const res = (await api.sendAssistantMessage({ message: text, language })) as AssistantResponse;
      setMessages((prev) => [...prev, { id: res.id, role: "assistant", kind: "reply", data: res }]);
    } catch (err) {
      const signIn = apiFailure(err) === "signin";
      setMessages((prev) => [...prev, { id: `e-${Date.now()}`, role: "assistant", kind: "error", signIn }]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const clearChat = () => {
    setMessages([WELCOME]);
    inputRef.current?.focus();
  };

  const chip =
    "rounded-xl border border-[#D8E2EA] bg-white px-3 py-1.5 text-xs font-medium text-[#0B1F33] shadow-2xs transition-colors hover:border-[#0E7490] hover:text-[#0E7490] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0E7490] disabled:opacity-50";
  const navBtn =
    "inline-flex items-center gap-1.5 rounded-xl bg-[#0E7490] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#0C627A] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0E7490]";

  const renderSuggestions = (items: Suggestion[]) => {
    const visible = items.filter((s) => s.action_type !== "emergency_call"); // the emergency card has the call buttons
    if (visible.length === 0) return null;
    return (
      <div className="flex flex-wrap gap-2 pt-1">
        {visible.map((s) =>
          s.action_type === "navigate" && s.payload?.path ? (
            <Link key={s.id} href={s.payload.path} className={navBtn} aria-label={`${t("assistant.goTo")}: ${s.label}`}>
              {s.label}
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          ) : (
            <button key={s.id} type="button" className={chip} onClick={() => send(s.label)} disabled={isLoading}>
              {s.label}
            </button>
          )
        )}
      </div>
    );
  };

  const bubble = "rounded-2xl border border-[#D8E2EA] bg-white p-4 text-sm leading-relaxed text-[#0F172A] shadow-xs";

  const renderAssistant = (m: Extract<Message, { role: "assistant" }>) => {
    if (m.kind === "welcome") {
      return (
        <>
          <div className={bubble}>
            <p>{t("assistant.welcome")}</p>
          </div>
          <p className="pt-1 text-xs font-semibold text-[#475569]">{t("assistant.suggestedTitle")}</p>
          <div className="flex flex-wrap gap-2">
            {CHIPS.map((c) => (
              <button key={c} type="button" className={chip} onClick={() => send(t(`assistant.chips.${c}`))} disabled={isLoading}>
                {t(`assistant.chips.${c}`)}
              </button>
            ))}
          </div>
        </>
      );
    }
    if (m.kind === "error") {
      return (
        <div className="rounded-2xl border border-[#FCA5A5] bg-[#FEF2F2] p-4 text-sm text-[#991B1B]">
          <p>{m.signIn ? t("assistant.signIn") : t("assistant.error")}</p>
        </div>
      );
    }
    const d = m.data;
    const fullEmergency = d.intent === "EMERGENCY";
    return (
      <>
        {d.emergency_card && <EmergencyCard fullEmergency={fullEmergency} text={d.response} />}
        {!fullEmergency && (
          <div className={bubble}>
            <p className="whitespace-pre-line">{d.response}</p>
            {d.citations.length > 0 && (
              <ul className="mt-3 space-y-1 border-t border-slate-200/60 pt-2 text-xs text-[#475569]">
                {d.citations.map((c) => (
                  <li key={c.url} className="flex items-start gap-1.5">
                    <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#0F766E]" aria-hidden="true" />
                    <span>
                      {t("assistant.sources")}:{" "}
                      <a
                        href={c.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-medium text-[#0E7490] underline underline-offset-2"
                      >
                        {c.title}
                        <ExternalLink className="h-3 w-3" aria-hidden="true" />
                      </a>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        {renderSuggestions(d.suggestions)}
      </>
    );
  };

  return (
    <AppShell>
      <div className="flex h-[calc(100vh-130px)] flex-col gap-4">
        {/* Header */}
        <div className="flex shrink-0 flex-col justify-between gap-3 border-b border-[#D8E2EA] pb-4 sm:flex-row sm:items-start">
          <div className="space-y-1">
            <h1 className="text-xl font-extrabold text-[#0B1F33] sm:text-2xl">{t("assistant.title")}</h1>
            <p className="text-xs text-[#475569] sm:text-sm">{t("assistant.subtitle")}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div role="group" aria-label={t("assistant.languageLabel")} className="flex items-center gap-1">
              <span className="mr-1 text-xs text-[#475569]" aria-hidden="true">
                {t("assistant.languageLabel")}
              </span>
              {SUPPORTED_LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  lang={l.code}
                  aria-pressed={language === l.code}
                  onClick={() => setLanguage(l.code)}
                  className={`h-8 rounded-lg border px-2.5 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0E7490] ${
                    language === l.code
                      ? "border-[#0E7490] bg-[#0E7490] text-white"
                      : "border-[#D8E2EA] bg-white text-[#0B1F33] hover:border-[#0E7490]"
                  }`}
                >
                  {l.nativeName}
                </button>
              ))}
            </div>
            <Button variant="ghost" size="sm" onClick={clearChat} leftIcon={<RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />}>
              {t("assistant.clear")}
            </Button>
          </div>
        </div>

        {/* Fixed-library notice + standing emergency line */}
        <div className="shrink-0 space-y-2">
          <div className="flex items-start gap-2 rounded-xl border border-[#BAE6FD] bg-[#F0F9FF] p-3 text-xs text-[#0B1F33]">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#0E7490]" aria-hidden="true" />
            <p>
              <strong>{t("assistant.notice")}</strong> {t("assistant.noticeDetail")}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#FCA5A5] bg-[#FEF2F2] p-3 text-xs text-[#991B1B]">
            <span>{t("assistant.emergencyBanner")}</span>
            <span className="flex gap-3 font-bold">
              <a href="tel:108" className="underline underline-offset-2">108</a>
              <a href="tel:112" className="underline underline-offset-2">112</a>
            </span>
          </div>
        </div>

        {/* Conversation: a log region so screen readers announce each new message */}
        <div
          role="log"
          aria-live="polite"
          aria-relevant="additions"
          aria-label={t("assistant.conversationLabel")}
          aria-busy={isLoading}
          className="flex-1 space-y-4 overflow-y-auto pr-1"
        >
          {messages.map((m) => (
            <div key={m.id} className={`flex items-start gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-white ${
                  m.role === "user" ? "bg-[#0B1F33]" : "bg-[#0E7490]"
                }`}
                aria-hidden="true"
              >
                {m.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>
              <div className={`max-w-xl space-y-2 ${m.role === "user" ? "text-right" : ""}`}>
                <span className="sr-only">{m.role === "user" ? t("assistant.you") : t("assistant.bot")}:</span>
                {m.role === "user" ? (
                  <div className="inline-block rounded-2xl bg-[#0B1F33] p-3 text-left text-sm text-white">{m.text}</div>
                ) : (
                  renderAssistant(m)
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex items-center gap-3 text-xs text-[#475569]">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#0E7490] text-white" aria-hidden="true">
                <Bot className="h-4 w-4 animate-pulse" />
              </div>
              <span>{t("assistant.thinking")}</span>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Input */}
        <form
          className="flex shrink-0 items-center gap-2 rounded-2xl border border-[#D8E2EA] bg-white p-3 shadow-xs"
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
        >
          <label htmlFor="assistant-input" className="sr-only">
            {t("assistant.inputLabel")}
          </label>
          <input
            id="assistant-input"
            ref={inputRef}
            type="text"
            value={input}
            maxLength={2000}
            autoComplete="off"
            lang={language}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t("assistant.placeholder")}
            className="h-10 flex-1 rounded-lg border-0 bg-transparent px-1 text-sm text-[#0F172A] outline-none placeholder:text-[#94A3B8] focus-visible:ring-2 focus-visible:ring-[#0E7490]"
          />
          <Button
            type="submit"
            size="sm"
            variant="primary"
            disabled={!input.trim() || isLoading}
            rightIcon={<Send className="h-3.5 w-3.5" aria-hidden="true" />}
          >
            {t("assistant.btnSend")}
          </Button>
        </form>
      </div>
    </AppShell>
  );
}
