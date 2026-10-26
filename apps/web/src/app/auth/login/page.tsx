"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Mail, ArrowRight } from "lucide-react";
import { BrandLogo } from "../../../components/layout/BrandLogo";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { LanguageSelector } from "../../../components/ui/LanguageSelector";
import { useAuth } from "../../../lib/auth-context";
import { useTranslation } from "../../../lib/i18n";
import { ROLE_HOME, isUserRole, rolesFor } from "../../../lib/roles";

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn } = useAuth();
  const { t } = useTranslation();

  // The ?role= portal only changes the heading. The role always comes from the profile.
  const portalParam = searchParams.get("role");
  const portal = isUserRole(portalParam) ? portalParam : "patient";
  const next = searchParams.get("next");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const profile = await signIn(email, password);
      const nextAllowed = next && next.startsWith("/") && rolesFor(next)?.includes(profile.role);
      router.replace(nextAllowed ? next : ROLE_HOME[profile.role]);
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (message.includes("not configured")) setError(t("auth.notConfigured"));
      else if (message.includes("No VITALNEX profile")) setError(t("auth.noProfile"));
      else setError(t("auth.invalidCredentials"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-8 sm:p-10 space-y-6 shadow-md border-[#D8E2EA]">
      <div className="space-y-1.5 text-center">
        <h1 className="text-2xl font-extrabold text-[#0B1F33]">{t("auth.signInTitle")}</h1>
        <p className="text-xs sm:text-sm text-[#475569]">{t(`auth.portal.${portal}`)}</p>
      </div>

      <p className="p-3 bg-[#FFFBEB] border border-[#B45309]/20 rounded-xl text-[11px] text-[#92400E] leading-relaxed">
        {t("auth.demoNotice")}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate={false}>
        <Input
          label={t("auth.email")}
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          leftIcon={<Mail className="w-4 h-4" />}
          required
        />

        <div className="space-y-1">
          <Input
            label={t("auth.password")}
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock className="w-4 h-4" />}
            required
          />
          <div className="text-right">
            <Link href="/auth/forgot-password" className="text-xs text-[#0E7490] hover:underline font-medium">
              {t("auth.forgotPassword")}
            </Link>
          </div>
        </div>

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
          {t("auth.signIn")}
        </Button>
        <p className="text-[11px] text-center text-[#64748B]">{t("auth.roleNotice")}</p>
      </form>

      {portal === "patient" && (
        <div className="pt-2 text-center text-xs text-[#475569]">
          {t("auth.noAccount")}{" "}
          <Link href="/auth/signup" className="text-[#0E7490] font-semibold hover:underline">
            {t("auth.createAccount")}
          </Link>
        </div>
      )}
    </Card>
  );
}

export default function LoginPage() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-[#F7FAFC] flex flex-col justify-between p-4 sm:p-8">
      <header className="max-w-md mx-auto w-full flex justify-between items-center pb-6">
        <BrandLogo size="md" />
        <LanguageSelector variant="compact" />
      </header>

      <main className="max-w-md mx-auto w-full my-auto">
        <Suspense fallback={<div className="p-8 text-center text-xs text-[#64748B]">{t("common.loading")}</div>}>
          <LoginFormContent />
        </Suspense>
      </main>

      <footer />
    </div>
  );
}
