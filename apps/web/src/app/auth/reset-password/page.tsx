"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Lock } from "lucide-react";
import { BrandLogo } from "../../../components/layout/BrandLogo";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { createClient } from "../../../lib/supabase/client";
import { useTranslation } from "../../../lib/i18n";

const MIN_PASSWORD = 8;

/** Opened from the Supabase recovery e-mail link, which signs the user in for this step. */
export default function ResetPasswordPage() {
  const { t } = useTranslation();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < MIN_PASSWORD) return setError(t("auth.passwordTooShort"));
    if (password !== confirmPassword) return setError(t("auth.passwordsDiffer"));
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        setError(t("auth.resetLinkInvalid"));
        return;
      }
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      await supabase.auth.signOut();
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : t("common.error"));
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
            <h1 className="text-2xl font-extrabold text-[#0B1F33]">{t("auth.resetTitle")}</h1>
          </div>

          {success ? (
            <p role="status" className="p-4 bg-[#F0FDF4] rounded-2xl border border-[#0F766E]/20 text-center text-xs text-[#0F766E]">
              {t("auth.passwordUpdated")}
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label={t("auth.newPassword")}
                type="password"
                autoComplete="new-password"
                minLength={MIN_PASSWORD}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
                required
              />
              <Input
                label={t("auth.confirmPassword")}
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
                required
              />
              {error && (
                <p role="alert" className="text-xs text-[#B42318] bg-[#B42318]/5 border border-[#B42318]/20 rounded-xl p-3">
                  {error}
                </p>
              )}
              <Button type="submit" variant="primary" size="lg" className="w-full" isLoading={isLoading}>
                {t("auth.updatePassword")}
              </Button>
            </form>
          )}

          <div className="text-center pt-2">
            <Link href="/auth/login" className="text-xs text-[#0E7490] hover:underline font-semibold">
              {t("auth.backToSignIn")}
            </Link>
          </div>
        </Card>
      </main>

      <footer />
    </div>
  );
}
