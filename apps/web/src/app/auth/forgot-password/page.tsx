"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft } from "lucide-react";
import { BrandLogo } from "../../../components/layout/BrandLogo";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { createClient } from "../../../lib/supabase/client";
import { useTranslation } from "../../../lib/i18n";

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const { error: resetError } = await createClient().auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      if (resetError) throw resetError;
      // Same message whether or not the account exists (no account enumeration).
      setSubmitted(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      setError(message.includes("not configured") ? t("auth.notConfigured") : message || t("common.error"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7FAFC] flex flex-col justify-between p-4 sm:p-8">
      <header className="max-w-md mx-auto w-full flex justify-between items-center pb-6">
        <BrandLogo size="md" />
      </header>

      <main className="max-w-md mx-auto w-full my-auto">
        <Card className="p-8 sm:p-10 space-y-6 shadow-md border-[#D8E2EA]">
          <div className="space-y-1.5 text-center">
            <h1 className="text-2xl font-extrabold text-[#0B1F33]">{t("auth.forgotTitle")}</h1>
            <p className="text-xs sm:text-sm text-[#475569]">{t("auth.forgotSubtitle")}</p>
          </div>

          {submitted ? (
            <p role="status" className="p-4 bg-[#F0FDF4] rounded-2xl border border-[#0F766E]/20 text-center text-xs text-[#0F766E]">
              {t("auth.resetSent")}
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label={t("auth.email")}
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="w-4 h-4" />}
                required
              />
              {error && (
                <p role="alert" className="text-xs text-[#B42318] bg-[#B42318]/5 border border-[#B42318]/20 rounded-xl p-3">
                  {error}
                </p>
              )}
              <Button type="submit" variant="primary" size="lg" className="w-full" isLoading={isLoading}>
                {t("auth.sendResetLink")}
              </Button>
            </form>
          )}

          <div className="text-center pt-2">
            <Link href="/auth/login" className="text-xs text-[#475569] hover:text-[#0B1F33] inline-flex items-center gap-1.5">
              <ArrowLeft className="w-3.5 h-3.5" /> {t("auth.backToSignIn")}
            </Link>
          </div>
        </Card>
      </main>

      <footer />
    </div>
  );
}
