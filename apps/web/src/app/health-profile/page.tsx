"use client";

import React, { useState } from "react";
import { AppShell } from "../../components/layout/AppShell";
import { Card, CardHeader } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { StatusBadge, DemoBadge } from "../../components/ui/StatusBadge";
import { Save, CheckCircle2, Shield, Heart, Activity, Apple, MapPin } from "lucide-react";
import { useTranslation } from "../../lib/i18n";

import { useEffect } from "react";
import { useAuth } from "../../lib/auth-context";
import { api } from "../../lib/api-client";

export default function HealthProfilePage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const userId = user?.id || "usr-demo-patient-001";

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Health Profile State strictly dividing Model Features vs Context & Lifestyle
  const [profile, setProfile] = useState({
    // Model Features
    age: 48,
    sex: "1",
    bmi: 25.4,
    smoking: "0",
    familyHistory: "1",
    diabetes: "0",
    hypertension: "1",
    restingBp: 135,
    cholesterol: 215,
    fbs: "0",
    restEcg: "0",
    maxHeartRate: 148,
    exerciseAngina: "0",
    stDepression: 0.5,
    stSlope: "1",
    majorVessels: "0",
    thal: "3",

    // Context & Demographic (Non-Model Inputs)
    localityType: "Urban_Pune",
    socioeconomicBand: "Middle",
    city: "Pune",
    occupation: "Software Engineer",

    // Lifestyle & Nutrition
    physicalActivity: "Moderate",
    sedentaryHours: 6.5,
    sleepHours: 7.0,
    stressLevel: "Moderate",
    dietQuality: "Moderate",
    dietPattern: "Mixed",
  });

  useEffect(() => {
    let active = true;
    api.getHealthProfile(userId)
      .then((hp) => {
        if (active && hp && hp.clinical_model) {
          const cm = hp.clinical_model;
          const ls = hp.lifestyle || {};
          const nut = hp.nutrition || {};
          const ctx = hp.context || {};
          setProfile({
            age: cm.age ?? 48,
            sex: String(cm.sex ?? "1"),
            bmi: cm.bmi ?? 25.4,
            smoking: String(cm.smoking ?? "0"),
            familyHistory: String(cm.family_history ?? "0"),
            diabetes: String(cm.diabetes ?? "0"),
            hypertension: String(cm.hypertension ?? "1"),
            restingBp: cm.trestbps ?? 135,
            cholesterol: cm.chol ?? 215,
            fbs: String(cm.fbs ?? "0"),
            restEcg: String(cm.restecg ?? "0"),
            maxHeartRate: cm.thalach ?? 148,
            exerciseAngina: String(cm.exang ?? "0"),
            stDepression: cm.oldpeak ?? 0.5,
            stSlope: String(cm.slope ?? "1"),
            majorVessels: String(cm.ca ?? "0"),
            thal: String(cm.thal ?? "3"),

            localityType: ctx.locality_type || "Urban_Pune",
            socioeconomicBand: ctx.socioeconomic_band || "Middle",
            city: ctx.city || "Pune",
            occupation: ctx.occupation || "Software Engineer",

            physicalActivity: ls.physical_activity || "Moderate",
            sedentaryHours: ls.sedentary_hours_per_day ?? 6.5,
            sleepHours: ls.sleep_hours_per_night ?? 7.0,
            stressLevel: ls.stress_level || "Moderate",
            dietQuality: nut.diet_quality || "Moderate",
            dietPattern: nut.diet_pattern || "Mixed",
          });
        }
      })
      .catch((err) => console.warn("Health profile fetch fallback:", err));

    return () => {
      active = false;
    };
  }, [userId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.updateHealthProfile({
        user_id: userId,
        clinical_model: {
          age: Number(profile.age),
          sex: Number(profile.sex),
          bmi: Number(profile.bmi),
          smoking: Number(profile.smoking),
          family_history: Number(profile.familyHistory),
          diabetes: Number(profile.diabetes),
          hypertension: Number(profile.hypertension),
          cp: 4,
          trestbps: Number(profile.restingBp),
          chol: Number(profile.cholesterol),
          fbs: Number(profile.fbs),
          restecg: Number(profile.restEcg),
          thalach: Number(profile.maxHeartRate),
          exang: Number(profile.exerciseAngina),
          oldpeak: Number(profile.stDepression),
          slope: Number(profile.stSlope),
          ca: Number(profile.majorVessels),
          thal: Number(profile.thal),
        },
        lifestyle: {
          physical_activity: profile.physicalActivity,
          sedentary_hours_per_day: Number(profile.sedentaryHours),
          sleep_hours_per_night: Number(profile.sleepHours),
          stress_level: profile.stressLevel,
          hydration_liters_per_day: 2.2,
        },
        nutrition: {
          diet_quality: profile.dietQuality,
          diet_pattern: profile.dietPattern,
          meal_frequency_per_day: 3,
          daily_fruit_veg_servings: 3,
          processed_food_frequency: "Occasional",
        },
        context: {
          locality_type: profile.localityType,
          socioeconomic_band: profile.socioeconomicBand,
          city: profile.city,
          region: "Maharashtra",
          country: "India",
          occupation: profile.occupation,
          work_pattern: "Desk Work",
        },
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err) {
      console.error("Failed to save health profile:", err);
    } finally {
      setIsSaving(false);
    }
  };


  return (
    <AppShell>
      <form onSubmit={handleSave} className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D8E2EA] pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F33]">
                Personal Health Profile
              </h1>
              <DemoBadge label="Demo Patient" />
            </div>
            <p className="text-xs sm:text-sm text-[#475569]">
              Strict architectural separation between validated predictive model features and lifestyle context.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {saveSuccess && (
              <span className="text-xs text-[#0F766E] font-semibold flex items-center gap-1.5 bg-[#0F766E]/10 px-3 py-1.5 rounded-xl">
                <CheckCircle2 className="w-4 h-4" /> Profile Saved
              </span>
            )}
            <Button type="submit" variant="primary" leftIcon={<Save className="w-4 h-4" />}>
              Save Health Profile
            </Button>
          </div>
        </div>

        {/* Notice on Model Features Separation */}
        <div className="p-4 bg-[#F8FAFC] rounded-2xl border border-[#D8E2EA] flex items-start gap-3.5">
          <Shield className="w-5 h-5 text-[#0E7490] shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <p className="font-semibold text-[#0B1F33]">Architectural Separation of Features</p>
            <p className="text-[#475569] leading-relaxed">
              Only clinically validated laboratory parameters (BP, cholesterol, ECG, ST metrics) are consumed by the predictive ML pipeline. Contextual features (locality, occupation, diet patterns) are preserved exclusively for subgroup fairness evaluations and personalized care matching.
            </p>
          </div>
        </div>

        {/* Section 1: Validated Clinical Model Features */}
        <Card className="p-6 space-y-6">
          <CardHeader
            title="1. Validated Clinical Model Features"
            subtitle="Parameters consumed directly by the cardiometabolic risk classification model."
            badge={<StatusBadge label="Model Consumed" variant="info" size="sm" />}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Input
              label="Age (Years)"
              type="number"
              value={profile.age}
              onChange={(e) => setProfile({ ...profile, age: Number(e.target.value) })}
              required
            />
            <Select
              label="Biological Sex"
              value={profile.sex}
              onChange={(e) => setProfile({ ...profile, sex: e.target.value })}
              options={[
                { value: "0", label: "Female" },
                { value: "1", label: "Male" },
              ]}
              required
            />
            <Input
              label="BMI (kg/m²)"
              type="number"
              step="0.1"
              value={profile.bmi}
              onChange={(e) => setProfile({ ...profile, bmi: Number(e.target.value) })}
              required
            />
            <Select
              label="Active Tobacco / Smoking"
              value={profile.smoking}
              onChange={(e) => setProfile({ ...profile, smoking: e.target.value })}
              options={[
                { value: "0", label: "Non-Smoker" },
                { value: "1", label: "Smoker" },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Input
              label="Resting Blood Pressure (mm Hg)"
              type="number"
              value={profile.restingBp}
              onChange={(e) => setProfile({ ...profile, restingBp: Number(e.target.value) })}
              helperText="Normal < 120 mm Hg"
              required
            />
            <Input
              label="Serum Cholesterol (mg/dL)"
              type="number"
              value={profile.cholesterol}
              onChange={(e) => setProfile({ ...profile, cholesterol: Number(e.target.value) })}
              helperText="Desirable < 200 mg/dL"
              required
            />
            <Input
              label="Max Heart Rate Achieved (thalach)"
              type="number"
              value={profile.maxHeartRate}
              onChange={(e) => setProfile({ ...profile, maxHeartRate: Number(e.target.value) })}
            />
            <Input
              label="ST Depression (oldpeak)"
              type="number"
              step="0.1"
              value={profile.stDepression}
              onChange={(e) => setProfile({ ...profile, stDepression: Number(e.target.value) })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Select
              label="Hypertension History"
              value={profile.hypertension}
              onChange={(e) => setProfile({ ...profile, hypertension: e.target.value })}
              options={[
                { value: "0", label: "No" },
                { value: "1", label: "Yes" },
              ]}
            />
            <Select
              label="Diabetes Mellitus"
              value={profile.diabetes}
              onChange={(e) => setProfile({ ...profile, diabetes: e.target.value })}
              options={[
                { value: "0", label: "No" },
                { value: "1", label: "Yes" },
              ]}
            />
            <Select
              label="Family History of CVD"
              value={profile.familyHistory}
              onChange={(e) => setProfile({ ...profile, familyHistory: e.target.value })}
              options={[
                { value: "0", label: "No" },
                { value: "1", label: "Yes" },
              ]}
            />
            <Select
              label="Exercise Induced Angina"
              value={profile.exerciseAngina}
              onChange={(e) => setProfile({ ...profile, exerciseAngina: e.target.value })}
              options={[
                { value: "0", label: "No" },
                { value: "1", label: "Yes" },
              ]}
            />
          </div>
        </Card>

        {/* Section 2: Regional & Demographic Context */}
        <Card className="p-6 space-y-6">
          <CardHeader
            title="2. Regional & Demographic Context"
            subtitle="Used for algorithmic fairness evaluations (demographic parity audits across Pune subgroups)."
            badge={<StatusBadge label="Fairness Context Only" variant="neutral" size="sm" />}
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              label="Locality Context (Pune Sub-region)"
              value={profile.localityType}
              onChange={(e) => setProfile({ ...profile, localityType: e.target.value })}
              options={[
                { value: "Urban_Pune", label: "Urban Pune (Kothrud, Deccan, Camp)" },
                { value: "PCMC", label: "PCMC (Pimpri, Chinchwad, Akurdi)" },
                { value: "Peri_Urban_Pune", label: "Peri-Urban Pune (Baner, Wagholi, Hinjawadi)" },
                { value: "Rural_Maharashtra", label: "Rural Maharashtra District" },
              ]}
            />
            <Select
              label="Socioeconomic Band (Research Subgroup)"
              value={profile.socioeconomicBand}
              onChange={(e) => setProfile({ ...profile, socioeconomicBand: e.target.value })}
              options={[
                { value: "Lower", label: "Lower" },
                { value: "Lower_Middle", label: "Lower Middle" },
                { value: "Middle", label: "Middle" },
                { value: "Upper_Middle", label: "Upper Middle" },
                { value: "Upper", label: "Upper" },
              ]}
            />
            <Input
              label="Current Occupation"
              value={profile.occupation}
              onChange={(e) => setProfile({ ...profile, occupation: e.target.value })}
            />
          </div>
        </Card>

        {/* Section 3: Lifestyle & Nutrition */}
        <Card className="p-6 space-y-6">
          <CardHeader
            title="3. Lifestyle & Nutrition Factors"
            subtitle="Contextual health indicators for personalized lifestyle intelligence and preventative care."
            badge={<StatusBadge label="Personalization" variant="neutral" size="sm" />}
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              label="Physical Activity Frequency"
              value={profile.physicalActivity}
              onChange={(e) => setProfile({ ...profile, physicalActivity: e.target.value })}
              options={[
                { value: "Low", label: "Low (< 60 mins/week)" },
                { value: "Moderate", label: "Moderate (150 mins/week)" },
                { value: "High", label: "High (300+ mins/week)" },
              ]}
            />
            <Input
              label="Sedentary Hours Per Day"
              type="number"
              value={profile.sedentaryHours}
              onChange={(e) => setProfile({ ...profile, sedentaryHours: Number(e.target.value) })}
            />
            <Input
              label="Average Sleep Hours / Night"
              type="number"
              value={profile.sleepHours}
              onChange={(e) => setProfile({ ...profile, sleepHours: Number(e.target.value) })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              label="Diet Quality"
              value={profile.dietQuality}
              onChange={(e) => setProfile({ ...profile, dietQuality: e.target.value })}
              options={[
                { value: "Healthy", label: "Healthy (Whole grains, fresh produce)" },
                { value: "Moderate", label: "Moderate (Standard balanced meals)" },
                { value: "Needs_Improvement", label: "Needs Improvement (High sugar/fried)" },
              ]}
            />
            <Select
              label="Diet Pattern"
              value={profile.dietPattern}
              onChange={(e) => setProfile({ ...profile, dietPattern: e.target.value })}
              options={[
                { value: "Vegetarian", label: "Vegetarian" },
                { value: "Non-Vegetarian", label: "Non-Vegetarian" },
                { value: "Mixed", label: "Mixed" },
              ]}
            />
            <Select
              label="Perceived Stress Level"
              value={profile.stressLevel}
              onChange={(e) => setProfile({ ...profile, stressLevel: e.target.value })}
              options={[
                { value: "Low", label: "Low" },
                { value: "Moderate", label: "Moderate" },
                { value: "High", label: "High" },
              ]}
            />
          </div>
        </Card>
      </form>
    </AppShell>
  );
}
