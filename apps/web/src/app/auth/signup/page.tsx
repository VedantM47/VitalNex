"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, User, ArrowRight } from "lucide-react";
import { BrandLogo } from "../../../components/layout/BrandLogo";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { useAuth } from "../../../lib/auth-context";

export default function SignupPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(email, "patient");
      router.push("/onboarding");
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
            <h1 className="text-2xl font-extrabold text-[#0B1F33]">Create Your Account</h1>
            <p className="text-xs sm:text-sm text-[#475569]">
              Start your health journey with VITALNEX
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Rajesh Sharma"
              leftIcon={<User className="w-4 h-4" />}
              required
            />

            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              leftIcon={<Mail className="w-4 h-4" />}
              required
            />

            <Input
              label="Choose a Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              leftIcon={<Lock className="w-4 h-4" />}
              required
            />

            <p className="text-[11px] text-[#64748B] leading-relaxed">
              Clinical health vitals are not collected during account creation. You can optionally complete your health profile during onboarding.
            </p>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Continue to Onboarding
            </Button>
          </form>

          <div className="pt-2 text-center text-xs text-[#475569]">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-[#0E7490] font-semibold hover:underline">
              Sign in
            </Link>
          </div>
        </Card>
      </main>

      <footer className="text-center text-xs text-[#94A3B8] pt-6">
        Protected by Supabase Auth with Row-Level Security (RLS).
      </footer>
    </div>
  );
}
