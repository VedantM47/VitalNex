"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { BrandLogo } from "../../../components/layout/BrandLogo";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#F7FAFC] flex flex-col justify-between p-4 sm:p-8">
      <header className="max-w-md mx-auto w-full flex justify-between items-center pb-6">
        <BrandLogo size="md" />
      </header>

      <main className="max-w-md mx-auto w-full my-auto">
        <Card className="p-8 sm:p-10 space-y-6 shadow-md border-[#D8E2EA]">
          <div className="space-y-1.5 text-center">
            <h1 className="text-2xl font-extrabold text-[#0B1F33]">Reset Password</h1>
            <p className="text-xs sm:text-sm text-[#475569]">
              Enter your email address to receive password recovery instructions.
            </p>
          </div>

          {submitted ? (
            <div className="p-4 bg-[#F0FDF4] rounded-2xl border border-[#0F766E]/20 text-center space-y-2 text-xs text-[#0F766E]">
              <CheckCircle2 className="w-8 h-8 mx-auto" />
              <p className="font-semibold text-sm">Recovery Link Dispatched</p>
              <p>We have sent a secure password reset link to {email}.</p>
              <div className="pt-2">
                <Link href="/auth/login">
                  <Button variant="outline" size="sm">
                    Return to Login
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                leftIcon={<Mail className="w-4 h-4" />}
                required
              />

              <Button type="submit" variant="primary" size="lg" className="w-full">
                Send Reset Link
              </Button>

              <div className="text-center pt-2">
                <Link href="/auth/login" className="text-xs text-[#475569] hover:text-[#0B1F33] inline-flex items-center gap-1.5">
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign in
                </Link>
              </div>
            </form>
          )}
        </Card>
      </main>

      <footer className="text-center text-xs text-[#94A3B8] pt-6">
        Protected by Supabase Auth with Row-Level Security (RLS).
      </footer>
    </div>
  );
}
