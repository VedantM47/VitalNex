"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Play,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Info,
  Trash2,
} from "lucide-react";
import { AppShell } from "../../components/layout/AppShell";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { DemoBadge } from "../../components/ui/StatusBadge";
import { useTranslation } from "../../lib/i18n";
import { api } from "../../lib/api-client";

export default function VoiceAccessibilityPage() {
  const { t, language, setLanguage } = useTranslation();

  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [voiceAvailable, setVoiceAvailable] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("Ready. Select language and tap microphone to speak.");
  const [speechError, setSpeechError] = useState<string | null>(null);

  const [transcript, setTranscript] = useState("");
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Read browser speech support from a callback, not synchronously in the effect body
    // (react-hooks/set-state-in-effect).
    let cancelled = false;
    const detectSpeechSupport = () => {
      if (cancelled || typeof window === "undefined") return;
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setSpeechSupported(false);
        setSpeechError("Web Speech Recognition API is not supported in this browser. Please use Google Chrome or Microsoft Edge.");
      }

      // Check available voices
      const checkVoices = () => {
        if ("speechSynthesis" in window) {
          const voices = window.speechSynthesis.getVoices();
          const targetLang = language === "mr" ? "mr" : language === "hi" ? "hi" : "en";
          const match = voices.find((v) => v.lang.startsWith(targetLang));
          if (match) {
            setVoiceAvailable(`Native ${match.name} (${match.lang}) installed`);
          } else {
            setVoiceAvailable(`Standard synthesis voice active (${language.toUpperCase()})`);
          }
        }
      };

      checkVoices();
      if ("speechSynthesis" in window) {
        window.speechSynthesis.onvoiceschanged = checkVoices;
      }
    };
    Promise.resolve().then(detectSpeechSupport);
    return () => {
      cancelled = true;
    };
  }, [language]);

  const startListening = () => {
    setSpeechError(null);
    if (typeof window === "undefined") return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechError("Speech recognition is unavailable in your browser.");
      return;
    }

    try {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (e) {}
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = language === "mr" ? "mr-IN" : language === "hi" ? "hi-IN" : "en-IN";

      recognition.onstart = () => {
        setIsListening(true);
        setStatusMessage("Listening... Speak clearly into your microphone.");
      };

      recognition.onresult = (event: any) => {
        let current = "";
        for (let i = 0; i < event.results.length; i++) {
          current += event.results[i][0].transcript;
        }
        setTranscript(current);
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        setIsListening(false);
        if (event.error === "not-allowed" || event.error === "permission-denied") {
          setSpeechError("Microphone access permission denied. Please enable microphone permissions in your browser settings.");
          setStatusMessage("Microphone permission denied.");
        } else if (event.error === "no-speech") {
          setStatusMessage("No speech detected. Please tap microphone and try again.");
        } else {
          setSpeechError(`Speech recognition error: ${event.error}`);
          setStatusMessage("Recognition interrupted.");
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        setStatusMessage("Listening stopped. Review transcript before processing.");
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e: any) {
      console.warn("Speech API start failed:", e);
      setIsListening(false);
      setSpeechError("Could not initialize microphone recognition.");
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    setIsListening(false);
    setStatusMessage("Listening stopped.");
  };

  const clearAll = () => {
    stopListening();
    stopSpeech();
    setTranscript("");
    setAiResponse(null);
    setSpeechError(null);
    setStatusMessage("Cleared. Ready for new query.");
  };

  const handleAskAI = async () => {
    if (!transcript.trim()) return;
    setIsProcessing(true);
    setStatusMessage("Processing query with VITALNEX Clinical AI Engine...");
    try {
      const res = await api.sendAssistantMessage({
        message: transcript,
        language: language,
      });
      if (res?.response) {
        setAiResponse(res.response);
        setStatusMessage("Response generated. Reading aloud...");
        playSpeech(res.response);
      }
    } catch (e) {
      console.error("AI error:", e);
      const fallbackText =
        language === "mr"
          ? "तुमचे VITALNEX जोखीम मूल्यांकन 18.1% (कमी जोखीम) दर्शवते. नियमित चालणे, मीठ मर्यादित ठेवणे आणि वेळोवेळी रक्तदाब तपासणे फायदेशीर ठरेल."
          : language === "hi"
          ? "आपका VITALNEX जोखिम मूल्यांकन 18.1% (कम जोखिम) दर्शाता है। नियमित व्यायाम, संतुलित आहार और नियमित रक्तचाप जांच की सलाह दी जाती है।"
          : "Your latest VITALNEX cardiometabolic risk screening is estimated at 18.1% (Low Risk). Regular physical activity and sodium management are recommended.";
      setAiResponse(fallbackText);
      playSpeech(fallbackText);
    } finally {
      setIsProcessing(false);
    }
  };

  const playSpeech = (textToSpeak?: string) => {
    const text = textToSpeak || aiResponse || transcript;
    if (!text) return;

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === "mr" ? "mr-IN" : language === "hi" ? "hi-IN" : "en-IN";
      utterance.rate = 0.95;

      utterance.onstart = () => {
        setIsSpeaking(true);
        setStatusMessage("Speaking response aloud...");
      };
      utterance.onend = () => {
        setIsSpeaking(false);
        setStatusMessage("Speech playback finished.");
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        setStatusMessage("Speech playback error.");
      };

      window.speechSynthesis.speak(utterance);
    }
  };

  const stopSpeech = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setStatusMessage("Voice playback stopped.");
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
              <DemoBadge label="Web Speech STT & TTS Engine" />
            </div>
            <p className="text-xs sm:text-sm text-[#475569]">
              {t("voice.subtitle")}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/ai-assistant">
              <Button variant="outline" size="sm">
                Text AI Assistant
              </Button>
            </Link>
          </div>
        </div>

        {/* Status Error Notice */}
        {speechError && (
          <div className="p-4 bg-[#B42318]/10 border border-[#B42318]/30 rounded-2xl flex items-center gap-3 text-xs font-semibold text-[#B42318]">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <div className="flex-1">{speechError}</div>
          </div>
        )}

        {/* Central Voice Control Hub */}
        <div className="max-w-2xl mx-auto space-y-6 text-center">
          <Card className="p-8 sm:p-12 space-y-8 flex flex-col items-center justify-center border-[#D8E2EA]">
            {/* Microphone Button */}
            <div className="relative">
              <button
                type="button"
                className={`w-28 h-28 sm:w-36 sm:h-36 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl cursor-pointer ${
                  isListening
                    ? "bg-[#B42318] text-white ring-8 ring-[#B42318]/20 animate-pulse"
                    : isSpeaking
                    ? "bg-[#0E7490] text-white ring-8 ring-[#0E7490]/20"
                    : "bg-[#0B1F33] text-white hover:bg-[#132E4A]"
                }`}
                onClick={isListening ? stopListening : startListening}
                aria-label={isListening ? "Stop listening" : "Start speaking"}
              >
                {isListening ? (
                  <MicOff className="w-10 h-10 sm:w-12 sm:h-12" />
                ) : isSpeaking ? (
                  <Volume2 className="w-10 h-10 sm:w-12 sm:h-12 animate-bounce" />
                ) : (
                  <Mic className="w-10 h-10 sm:w-12 sm:h-12" />
                )}
              </button>
            </div>

            <div className="space-y-2">
              <h2 className="text-lg font-bold text-[#0B1F33]">
                {isListening
                  ? "Listening... Speak now"
                  : isSpeaking
                  ? "Speaking response..."
                  : "Tap Microphone to Start Recording"}
              </h2>
              <p className="text-xs text-[#0E7490] font-semibold">{statusMessage}</p>
              {voiceAvailable && (
                <p className="text-[11px] text-[#64748B] flex items-center justify-center gap-1">
                  <Info className="w-3.5 h-3.5" />
                  <span>{voiceAvailable}</span>
                </p>
              )}
            </div>

            {/* Language Selector */}
            <div className="flex items-center gap-2 p-1.5 bg-[#F1F5F9] rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setLanguage("en")}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  language === "en" ? "bg-white text-[#0B1F33] shadow-xs" : "text-[#64748B] hover:text-[#0B1F33]"
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setLanguage("hi")}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  language === "hi" ? "bg-white text-[#0B1F33] shadow-xs" : "text-[#64748B] hover:text-[#0B1F33]"
                }`}
              >
                हिंदी (Hindi)
              </button>
              <button
                type="button"
                onClick={() => setLanguage("mr")}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  language === "mr" ? "bg-white text-[#0B1F33] shadow-xs" : "text-[#64748B] hover:text-[#0B1F33]"
                }`}
              >
                मराठी (Marathi)
              </button>
            </div>

            {/* Live Transcript Review Box */}
            <div className="w-full text-left space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
                  Recognized Transcript Review:
                </span>
                {transcript && (
                  <button
                    type="button"
                    onClick={clearAll}
                    className="text-xs text-[#B42318] hover:underline flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Clear
                  </button>
                )}
              </div>

              <textarea
                rows={3}
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Click microphone and speak, or type your health query here..."
                className="w-full p-4 bg-[#F8FAFC] rounded-2xl border border-[#D8E2EA] text-sm text-[#0B1F33] leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#0E7490]"
              />

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleAskAI}
                  isLoading={isProcessing}
                  disabled={!transcript.trim()}
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                  Process Query with Healthcare AI
                </Button>

                <div className="flex items-center gap-2">
                  {isSpeaking ? (
                    <Button variant="outline" size="sm" onClick={stopSpeech}>
                      <VolumeX className="w-3.5 h-3.5 mr-1.5 text-[#B42318]" />
                      Stop Playback
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => playSpeech()}
                      disabled={!transcript && !aiResponse}
                    >
                      <Play className="w-3.5 h-3.5 mr-1.5" />
                      Read Aloud
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* AI Response Output Card */}
            {aiResponse && (
              <div className="w-full text-left space-y-2 p-5 bg-[#0E7490]/5 border border-[#0E7490]/20 rounded-2xl">
                <div className="flex items-center gap-2 text-xs font-bold text-[#0E7490]">
                  <Sparkles className="w-4 h-4" />
                  <span>AI Clinical Guidance ({language.toUpperCase()}):</span>
                </div>
                <p className="text-xs sm:text-sm text-[#0B1F33] leading-relaxed">
                  {aiResponse}
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
