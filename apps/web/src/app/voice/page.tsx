"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Languages,
  Play,
  RotateCcw,
  Sparkles,
  PhoneCall,
  Activity,
  ArrowRight,
} from "lucide-react";
import { AppShell } from "../../components/layout/AppShell";
import { Card, CardHeader } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { StatusBadge, DemoBadge } from "../../components/ui/StatusBadge";
import { useTranslation } from "../../lib/i18n";

export default function VoiceAccessibilityPage() {
  const { t, language, setLanguage } = useTranslation();
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState(
    "माझे नुकतेच झालेले क्लिनिकल जोखीम मूल्यांकन आणि जीवनशैली बदल समजावून सांगा."
  );

  const toggleListening = () => {
    if (!isListening) {
      setIsListening(true);
      setTimeout(() => {
        setIsListening(false);
        setTranscript(
          language === "mr"
            ? "माझे रक्तदाब 132 mmHg आणि कोलेस्टेरॉल 181 mg/dL असताना हृदयविकाराची जोखीम कशी कमी करता येईल?"
            : language === "hi"
            ? "मेरा रक्तचाप 132 mmHg और कोलेस्ट्रॉल 181 mg/dL होने पर जोखिम को कैसे कम करें?"
            : "How can I lower my cardiometabolic risk with resting BP at 132 mmHg and cholesterol at 181 mg/dL?"
        );
      }, 3000);
    } else {
      setIsListening(false);
    }
  };

  const playSpeech = () => {
    setIsSpeaking(true);
    setTimeout(() => setIsSpeaking(false), 3500);
  };

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D8E2EA] pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F33]">
                {t("voice.title")}
              </h1>
              <DemoBadge label="Multilingual Voice Engine" />
            </div>
            <p className="text-xs sm:text-sm text-[#475569]">
              {t("voice.subtitle")}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/ai-assistant">
              <Button variant="outline" size="sm">
                Switch to Text Assistant
              </Button>
            </Link>
          </div>
        </div>

        {/* Central Voice Control Hub */}
        <div className="max-w-2xl mx-auto space-y-6 text-center">
          <Card className="p-8 sm:p-12 space-y-8 flex flex-col items-center justify-center">
            {/* Pulsing Waveform / Microphone Orb */}
            <div className="relative">
              <div
                className={`w-28 h-28 sm:w-36 sm:h-36 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl cursor-pointer ${
                  isListening
                    ? "bg-[#B42318] text-white ring-8 ring-[#B42318]/20 animate-pulse"
                    : isSpeaking
                    ? "bg-[#0E7490] text-white ring-8 ring-[#0E7490]/20"
                    : "bg-[#0B1F33] text-white hover:bg-[#132E4A]"
                }`}
                onClick={toggleListening}
                role="button"
                aria-label={isListening ? "Stop listening" : "Start speaking"}
              >
                {isListening ? (
                  <MicOff className="w-10 h-10 sm:w-12 sm:h-12" />
                ) : (
                  <Mic className="w-10 h-10 sm:w-12 sm:h-12 text-[#22C1DC]" />
                )}
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-lg sm:text-xl font-bold text-[#0B1F33]">
                {isListening ? t("voice.listening") : isSpeaking ? t("voice.speaking") : t("voice.idle")}
              </h2>
              <p className="text-xs text-[#64748B]">
                Supports conversational input in English, हिन्दी, and मराठी.
              </p>
            </div>

            {/* Language Toggle Pills */}
            <div className="flex items-center gap-2 bg-[#F8FAFC] p-1.5 rounded-2xl border border-[#D8E2EA]">
              <button
                type="button"
                onClick={() => setLanguage("en")}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                  language === "en" ? "bg-[#0B1F33] text-white shadow-2xs" : "text-[#475569] hover:text-[#0B1F33]"
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setLanguage("hi")}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                  language === "hi" ? "bg-[#0B1F33] text-white shadow-2xs" : "text-[#475569] hover:text-[#0B1F33]"
                }`}
              >
                हिन्दी (Hindi)
              </button>
              <button
                type="button"
                onClick={() => setLanguage("mr")}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                  language === "mr" ? "bg-[#0B1F33] text-white shadow-2xs" : "text-[#475569] hover:text-[#0B1F33]"
                }`}
              >
                मराठी (Marathi)
              </button>
            </div>

            {/* Transcribed Speech Container */}
            <div className="w-full text-left p-5 bg-[#F8FAFC] rounded-2xl border border-[#D8E2EA] space-y-3">
              <div className="flex items-center justify-between text-xs text-[#64748B]">
                <span className="font-semibold uppercase tracking-wider">Voice Transcription</span>
                <span className="text-[#0F766E] font-medium">Confidence: 96%</span>
              </div>
              <p className="text-xs sm:text-sm text-[#0B1F33] leading-relaxed italic">
                &ldquo;{transcript}&rdquo;
              </p>
              <div className="pt-2 flex items-center justify-between">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={playSpeech}
                  isLoading={isSpeaking}
                  leftIcon={<Volume2 className="w-4 h-4 text-[#0E7490]" />}
                >
                  {t("voice.ttsPlay")}
                </Button>
                <Link href="/risk-assessment">
                  <Button size="sm" variant="primary" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                    Evaluate Assessment
                  </Button>
                </Link>
              </div>
            </div>
          </Card>

          {/* IVR & Accessibility Architecture Callout */}
          <div className="p-4 bg-white rounded-2xl border border-[#D8E2EA] flex items-center justify-between text-xs text-[#475569]">
            <div className="flex items-center gap-2.5">
              <PhoneCall className="w-4 h-4 text-[#0E7490]" />
              <span>
                <strong>Future IVR Telephony:</strong> Prepared for toll-free dial-in voice health screening in rural Maharashtra.
              </span>
            </div>
            <StatusBadge label="Prompt 3 Roadmap" variant="neutral" size="sm" />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
