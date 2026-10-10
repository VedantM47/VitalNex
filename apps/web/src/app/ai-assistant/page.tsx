"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Bot,
  Send,
  Mic,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  User,
  ExternalLink,
} from "lucide-react";
import { AppShell } from "../../components/layout/AppShell";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { DemoBadge } from "../../components/ui/StatusBadge";
import { api } from "../../lib/api-client";
import { useTranslation, SupportedLanguage } from "../../lib/i18n";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  escalationRecommended?: boolean;
  suggestions?: { id: string; label: string; action_type: string; payload?: any }[];
  citations?: { source: string }[];
  timestamp: string;
}

export default function AIAssistantPage() {
  const { t, language, setLanguage } = useTranslation();
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "msg-welcome",
      role: "assistant",
      content:
        "Hello! I am your VITALNEX Health Intelligence Assistant. I can help interpret your continuous cardiometabolic risk screening, explain feature contributions from your AI Trust Passport, and help connect you to certified clinicians in Pune.",
      suggestions: [
        { id: "s1", label: "Explain my health profile", action_type: "navigate", payload: { path: "/health-profile" } },
        { id: "s2", label: "What does my risk assessment mean?", action_type: "navigate", payload: { path: "/risk-assessment" } },
        { id: "s3", label: "Help me find a specialist in Pune", action_type: "navigate", payload: { path: "/care-connect" } },
      ],
      citations: [{ source: "VITALNEX Clinical Guidance Protocol v1.0" }],
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await api.sendAssistantMessage({
        user_id: "demo-user",
        message: text,
        language: language,
      });

      if (res) {
        const assistantMessage: Message = {
          id: res.id,
          role: "assistant",
          content: res.response,
          escalationRecommended: res.escalation_recommended,
          suggestions: res.suggestions,
          citations: res.citations,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (err) {
      console.warn("Assistant API unavailable:", err);
      const fallback: Message = {
        id: `ast-offline-${Date.now()}`,
        role: "assistant",
        content:
          language === "mr"
            ? "सूचना: थेट सहाय्यक सर्व्हरशी संपर्क होऊ शकला नाही. स्थानिक सुरक्षा नियमांनुसार: तीव्र अस्वस्थता असल्यास त्वरित 108 वर संपर्क साधा किंवा आपल्या डॉक्टरांचा सल्ला घ्या."
            : language === "hi"
            ? "सूचना: सहायक सर्वर से संपर्क नहीं हो पाया। आपातकालीन स्थिति में तुरंत 108 पर कॉल करें अथवा अपने चिकित्सक से संपर्क करें।"
            : "Notice: Unable to reach the live intelligence service. Using offline clinical guidance: For acute symptoms please contact emergency services (108/112). For routine review, please check your AI Trust Passport or consult a licensed clinician.",
        suggestions: [
          { id: "fb-1", label: "Inspect AI Trust Passport", action_type: "navigate", payload: { path: "/ai-trust" } },
          { id: "fb-2", label: "Discover Clinicians", action_type: "navigate", payload: { path: "/care-connect" } },
        ],
        citations: [{ source: "VITALNEX Offline Safety Protocol" }],
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, fallback]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: "msg-reset",
        role: "assistant",
        content: "Conversation history cleared. How may I assist your health journey?",
        suggestions: [
          { id: "s1", label: "Explain my health profile", action_type: "navigate", payload: { path: "/health-profile" } },
          { id: "s2", label: "Help me find a cardiologist in Pune", action_type: "navigate", payload: { path: "/care-connect" } },
        ],
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  return (
    <AppShell>
      <div className="space-y-6 flex flex-col h-[calc(100vh-130px)]">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D8E2EA] pb-4 shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#0B1F33]">
                {t("assistant.title")}
              </h1>
              <DemoBadge label="Agentic AI Guardrails Active" />
            </div>
            <p className="text-xs text-[#475569]">{t("assistant.subtitle")}</p>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={clearChat} leftIcon={<RotateCcw className="w-3.5 h-3.5" />}>
              Clear Chat
            </Button>
            <Link href="/voice">
              <Button variant="outline" size="sm" leftIcon={<Mic className="w-3.5 h-3.5" />}>
                Voice Mode
              </Button>
            </Link>
          </div>
        </div>

        {/* Emergency Triage Banner */}
        <div className="p-3 bg-[#FEF2F2] rounded-xl border border-[#FCA5A5] flex items-center justify-between text-xs text-[#991B1B] shrink-0">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#B42318] shrink-0" />
            <span>
              <strong>Emergency Safeguard:</strong> {t("assistant.emergencyBanner")}
            </span>
          </div>
          <span className="font-bold underline cursor-pointer">Emergency: 108</span>
        </div>

        {/* Chat Messages Container */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  msg.role === "user" ? "bg-[#0B1F33] text-white" : "bg-[#0E7490] text-white"
                }`}
              >
                {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div className={`space-y-2 max-w-xl ${msg.role === "user" ? "text-right" : "text-left"}`}>
                <div
                  className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-[#0B1F33] text-white rounded-tr-xs"
                      : msg.escalationRecommended
                      ? "bg-[#FEF2F2] text-[#991B1B] border border-[#F87171] rounded-tl-xs"
                      : "bg-white text-[#0F172A] border border-[#D8E2EA] rounded-tl-xs shadow-xs"
                  }`}
                >
                  <p>{msg.content}</p>

                  {/* Citations */}
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-slate-200/60 text-[11px] text-[#64748B] flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#0F766E]" />
                      <span>Source: {msg.citations[0].source}</span>
                    </div>
                  )}
                </div>

                {/* Suggestions and Tool Action Cards */}
                {msg.suggestions && msg.suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {msg.suggestions.map((sug) => (
                      <button
                        key={sug.id}
                        onClick={() => handleSend(sug.label)}
                        className="px-3 py-1.5 rounded-xl bg-white border border-[#D8E2EA] hover:border-[#0E7490] text-[#0B1F33] hover:text-[#0E7490] text-xs font-medium transition-colors shadow-2xs"
                      >
                        {sug.label}
                      </button>
                    ))}
                  </div>
                )}

                <span className="text-[10px] text-[#94A3B8] px-1">{msg.timestamp}</span>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#0E7490] text-white flex items-center justify-center">
                <Bot className="w-4 h-4 animate-pulse" />
              </div>
              <div className="p-3 bg-white border border-[#D8E2EA] rounded-2xl text-xs text-[#64748B] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#0E7490] animate-ping" />
                <span>Evaluating clinical intelligence guardrails...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white rounded-2xl border border-[#D8E2EA] shadow-xs shrink-0 flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={t("assistant.placeholder")}
            className="flex-1 bg-transparent border-0 outline-none shadow-none text-xs sm:text-sm h-10 text-[#0F172A] placeholder:text-[#94A3B8]"
          />

          <Link href="/voice">
            <button
              type="button"
              aria-label="Voice input"
              className="p-2.5 rounded-xl text-[#0E7490] hover:bg-[#F1F5F9] transition-colors"
            >
              <Mic className="w-4 h-4" />
            </button>
          </Link>

          <Button
            size="sm"
            variant="primary"
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            rightIcon={<Send className="w-3.5 h-3.5" />}
          >
            {t("assistant.btnSend")}
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
