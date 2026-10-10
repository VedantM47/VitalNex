"use client";

import React, { useState } from "react";
import {
  Settings,
  Globe,
  Shield,
  Bell,
  Cpu,
  User,
  CheckCircle2,
  Lock,
  Save,
} from "lucide-react";
import { AppShell } from "../../components/layout/AppShell";
import { Card, CardHeader } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Select } from "../../components/ui/Select";
import { Input } from "../../components/ui/Input";
import { DemoBadge, StatusBadge } from "../../components/ui/StatusBadge";
import { useTranslation, SUPPORTED_LANGUAGES } from "../../lib/i18n";
import { useAuth } from "../../lib/auth-context";

export default function SettingsPage() {
  const { t, language, setLanguage } = useTranslation();
  const { user, role } = useAuth();

  const [saved, setSaved] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.fullName || "Rajesh Sharma",
    email: user?.email || "rajesh.sharma@vitalnex.health",
    language: language,
    notificationsEnabled: true,
    researchConsent: true,
    dataRetentionDays: "365",
    preferredModel: "gradient_boosting",
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setLanguage(formData.language as any);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <AppShell>
      <div className="space-y-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D8E2EA] pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F33]">
                {t("nav.settings") || "Platform Preferences & Settings"}
              </h1>
              <DemoBadge label="Client Configuration" />
            </div>
            <p className="text-xs sm:text-sm text-[#475569]">
              Manage your language, privacy consents, explainability preferences, and clinical decision support settings.
            </p>
          </div>
        </div>

        {saved && (
          <div className="p-4 bg-[#0F766E]/10 border border-[#0F766E]/30 rounded-2xl flex items-center gap-3 text-xs text-[#0F766E] font-medium">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            Settings saved successfully and local preferences updated.
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Language & Regional Localization */}
          <Card className="p-6 sm:p-8 space-y-6">
            <CardHeader
              title="Language & Regional Localization"
              subtitle="Select your preferred language for the AI intelligence suite, voice synthesis, and clinical reports"
              badge={<Globe className="w-5 h-5 text-[#0E7490]" />}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Interface Language"
                value={formData.language}
                onChange={(e) => setFormData({ ...formData, language: e.target.value as any })}
                options={SUPPORTED_LANGUAGES.map((l) => ({
                  value: l.code,
                  label: `${l.name} (${l.nativeName})`,
                }))}
              />

              <div className="p-4 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-1 text-xs text-[#475569]">
                <span className="font-semibold text-[#0B1F33]">Regional Dialect Coverage:</span>
                <p>Supports Pune, PCMC, and peri-urban Marathi/Hindi phrasing including health terminology and voice transcripts.</p>
              </div>
            </div>
          </Card>

          {/* User Profile Info */}
          <Card className="p-6 sm:p-8 space-y-6">
            <CardHeader
              title="Account & Identity"
              subtitle="Your identity details within the research and connected care prototype"
              badge={<User className="w-5 h-5 text-[#0E7490]" />}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              <Input
                label="Email Address"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </Card>

          {/* AI Explainability & Model Preferences */}
          <Card className="p-6 sm:p-8 space-y-6">
            <CardHeader
              title="Clinical Model & Explainability Engine"
              subtitle="Configure which underlying predictive model architecture is used for your risk assessments"
              badge={<Cpu className="w-5 h-5 text-[#0E7490]" />}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Default Risk Model"
                value={formData.preferredModel}
                onChange={(e) => setFormData({ ...formData, preferredModel: e.target.value })}
                options={[
                  { value: "gradient_boosting", label: "Gradient Boosting (Trained ML - Recommended)" },
                  { value: "random_forest", label: "Random Forest Ensemble" },
                  { value: "logistic_regression", label: "Calibrated Logistic Regression" },
                ]}
              />

              <div className="p-4 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-1 text-xs text-[#475569]">
                <span className="font-semibold text-[#0B1F33]">Responsible AI Guarantee:</span>
                <p>All models adhere to Platt Isotonic calibration, demographic parity checks (≥80%), and local TreeSHAP attribution.</p>
              </div>
            </div>
          </Card>

          {/* Privacy & Research Governance Consent */}
          <Card className="p-6 sm:p-8 space-y-6">
            <CardHeader
              title="Data Privacy & Research Consent"
              subtitle="Control how your screening data is processed and stored"
              badge={<Shield className="w-5 h-5 text-[#0E7490]" />}
            />

            <div className="space-y-4 text-xs">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.researchConsent}
                  onChange={(e) => setFormData({ ...formData, researchConsent: e.target.checked })}
                  className="w-4 h-4 rounded border-[#CBD5E1] text-[#0E7490] focus:ring-[#0E7490] mt-0.5"
                />
                <div>
                  <span className="font-semibold text-[#0B1F33]">Anonymized Research Participation</span>
                  <p className="text-[#64748B]">
                    Allow de-identified risk screening values to contribute to aggregate Pune regional epidemiological research benchmarks.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.notificationsEnabled}
                  onChange={(e) => setFormData({ ...formData, notificationsEnabled: e.target.checked })}
                  className="w-4 h-4 rounded border-[#CBD5E1] text-[#0E7490] focus:ring-[#0E7490] mt-0.5"
                />
                <div>
                  <span className="font-semibold text-[#0B1F33]">Automated Follow-up Reminders</span>
                  <p className="text-[#64748B]">
                    Receive periodic health check prompts when risk factors indicate re-screening is advised.
                  </p>
                </div>
              </label>
            </div>
          </Card>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="submit" variant="primary" size="md">
              <Save className="w-4 h-4 mr-2" />
              Save Preferences
            </Button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
