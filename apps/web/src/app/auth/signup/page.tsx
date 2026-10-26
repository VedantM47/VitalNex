"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, User, ArrowRight } from "lucide-react";
import { BrandLogo } from "../../../components/layout/BrandLogo";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { LanguageSelector } from "../../../components/ui/LanguageSelector";
import { useAuth } from "../../../lib/auth-context";
import { useTranslation } from "../../../lib/i18n";

const MIN_PASSWORD = 8;

/** Patient self-signup. Clinician and admin accounts are seeded, never self-created. */
export default function SignupPage() {
  const router = useRouter();
  const { signUp } = useAuth();
  const { t, language } = useTranslation();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < MIN_PASSWORD) {
      setError(t("auth.passwordTooShort"));
      return;
    }
    setIsLoading(true);
    try {
      const { signedIn } = await signUp(email, password, fullName.trim(), language);
      if (signedIn) {
        router.replace("/onboarding");
        router.refresh();
      } else {
        setNeedsConfirmation(true);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      setError(message.includes("not configured") ? t("auth.notConfigured") : `${t("auth.signupFailed")} ${message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7FAFC] flex flex-col justify-between p-4 sm:p-8">
      <header className="max-w-md mx-auto w-full flex justify-between items-center pb-6">
        <BrandLogo size="md" />
        <LanguageSelector variant="compact" />
      </header>

      <main className="max-w-md mx-auto w-full my-auto">
        <Card className="p-8 sm:p-10 space-y-6 shadow-md border-[#D8E2EA]">
          <div className="space-y-1.5 text-center">
            <h1 className="text-2xl font-extrabold text-[#0B1F33]">{t("auth.signupTitle")}</h1>
            <p className="text-xs sm:text-sm text-[#475569]">{t("auth.signupSubtitle")}</p>
          </div>

          {needsConfirmation ? (
            <p role="status" className="p-4 bg-[#F0FDF4] rounded-2xl border border-[#0F766E]/20 text-center text-xs text-[#0F766E]">
              {t("auth.checkEmail")}
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label={t("auth.fullName")}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoComplete="name"
                leftIcon={<User className="w-4 h-4" />}
                required
              />
              <Input
                label={t("auth.email")}
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="w-4 h-4" />}
                required
              />
              <Input
                label={t("auth.choosePassword")}
                type="password"
                autoComplete="new-password"
                minLength={MIN_PASSWORD}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
                required
              />

              <p className="text-[11px] text-[#64748B] leading-relaxed">{t("auth.signupNoHealthData")}</p>

              {error && (
                <p role="alert" className="text-xs text-[#B42318] bg-[#B42318]/5 border border-[#B42318]/20 rounded-xl p-3">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                isLoading={isLoading}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                {t("auth.signupButton")}
              </Button>
            </form>
          )}

          <div className="pt-2 text-center text-xs text-[#475569]">
            {t("auth.haveAccount")}{" "}
            <Link href="/auth/login" className="text-[#0E7490] font-semibold hover:underline">
              {t("auth.signIn")}
            </Link>
          </div>
        </Card>
      </main>

      <footer />
    </div>
  );
}
