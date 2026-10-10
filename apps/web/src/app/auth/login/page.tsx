"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Mail, ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";
import { BrandLogo } from "../../../components/layout/BrandLogo";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { DemoBadge } from "../../../components/ui/StatusBadge";
import { useAuth, UserRole } from "../../../lib/auth-context";

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRoleParam = searchParams.get("role") as UserRole | null;
  const { login } = useAuth();

  const [selectedRole, setSelectedRole] = useState<UserRole>(() => {
    if (initialRoleParam && ["patient", "doctor", "admin", "researcher"].includes(initialRoleParam)) {
      return initialRoleParam;
    }
    return "patient";
  });

  const [email, setEmail] = useState(() => {
    if (selectedRole === "doctor") return "dr.anand.joshi@vitalnex.health";
    if (selectedRole === "admin" || selectedRole === "researcher") return "admin@vitalnex.health";
    return "rajesh.sharma@vitalnex.health";
  });

  const [password, setPassword] = useState("••••••••••••");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (initialRoleParam && ["patient", "doctor", "admin", "researcher"].includes(initialRoleParam)) {
      setSelectedRole(initialRoleParam);
      if (initialRoleParam === "doctor") setEmail("dr.anand.joshi@vitalnex.health");
      else if (initialRoleParam === "admin" || initialRoleParam === "researcher") setEmail("admin@vitalnex.health");
      else setEmail("rajesh.sharma@vitalnex.health");
    }
  }, [initialRoleParam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(email, selectedRole);
      if (selectedRole === "doctor") router.push("/doctor/dashboard");
      else if (selectedRole === "researcher" || selectedRole === "admin") router.push("/admin/dashboard");
      else router.push("/dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-8 sm:p-10 space-y-6 shadow-md border-[#D8E2EA]">
      <div className="space-y-1.5 text-center">
        <h1 className="text-2xl font-extrabold text-[#0B1F33]">Sign in to VITALNEX</h1>
        <p className="text-xs sm:text-sm text-[#475569]">
          {selectedRole === "doctor"
            ? "Clinician Oversight Portal"
            : selectedRole === "admin" || selectedRole === "researcher"
            ? "Research & Governance Portal"
            : "Patient Health Intelligence Portal"}
        </p>
      </div>

      {/* Role Selector */}
      <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#D8E2EA] space-y-2">
        <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">
          Select Role Entry Point:
        </span>
        <div className="grid grid-cols-3 gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => {
              setSelectedRole("patient");
              setEmail("rajesh.sharma@vitalnex.health");
            }}
            className={`py-1.5 px-2 rounded-lg font-medium transition-colors ${
              selectedRole === "patient" ? "bg-[#0B1F33] text-white" : "bg-white text-[#475569] border border-[#CBD5E1]"
            }`}
          >
            Patient
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedRole("doctor");
              setEmail("dr.anand.joshi@vitalnex.health");
            }}
            className={`py-1.5 px-2 rounded-lg font-medium transition-colors ${
              selectedRole === "doctor" ? "bg-[#0B1F33] text-white" : "bg-white text-[#475569] border border-[#CBD5E1]"
            }`}
          >
            Clinician
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedRole("admin");
              setEmail("admin@vitalnex.health");
            }}
            className={`py-1.5 px-2 rounded-lg font-medium transition-colors ${
              selectedRole === "admin" || selectedRole === "researcher" ? "bg-[#0B1F33] text-white" : "bg-white text-[#475569] border border-[#CBD5E1]"
            }`}
          >
            Admin
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Work or Personal Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          leftIcon={<Mail className="w-4 h-4" />}
          required
        />

        <div className="space-y-1">
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock className="w-4 h-4" />}
            required
          />
          <div className="text-right">
            <Link href="/auth/forgot-password" className="text-xs text-[#0E7490] hover:underline font-medium">
              Forgot password?
            </Link>
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full"
          isLoading={isLoading}
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          Sign In as {selectedRole.toUpperCase()}
        </Button>
      </form>

      <div className="pt-2 text-center text-xs text-[#475569]">
        Don&apos;t have an account?{" "}
        <Link href="/auth/signup" className="text-[#0E7490] font-semibold hover:underline">
          Create account
        </Link>
      </div>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#F7FAFC] flex flex-col justify-between p-4 sm:p-8">
      <header className="max-w-md mx-auto w-full flex justify-between items-center pb-6">
        <BrandLogo size="md" />
        <DemoBadge label="Supabase / Local Auth Mode" />
      </header>

      <main className="max-w-md mx-auto w-full my-auto">
        <Suspense fallback={<div className="p-8 text-center text-xs text-[#64748B]">Loading authentication portal...</div>}>
          <LoginFormContent />
        </Suspense>
      </main>

      <footer className="text-center text-xs text-[#94A3B8] pt-6">
        Protected by Role-Based Access Controls (RBAC) &amp; Supabase Auth.
      </footer>
    </div>
  );
}
