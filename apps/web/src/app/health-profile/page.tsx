"use client";

// P5: the health profile holds only the 14 answers of the screening form (docs/SPEC.md §3.3)
// plus the language preference. Every answer is optional here; an unanswered question stays
// empty and is never filled in. Saved answers pre-fill the screening form, visibly marked.

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Activity, CheckCircle2, Eraser } from "lucide-react";
import { AppShell } from "../../components/layout/AppShell";
import { Card, CardHeader } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { AnswerFields, validateKeys } from "../../components/assessment/AnswerFields";
import { loadSavedAnswers, saveAnswers } from "../../lib/patient-data";
import { useTranslation, SUPPORTED_LANGUAGES, type SupportedLanguage } from "../../lib/i18n";
import { useAuth } from "../../lib/auth-context";
import { ANSWER_KEYS, EMPTY_DRAFT, type AnswerKey, type AssessmentAnswers, type Draft } from "../../lib/assessment";

const GROUPS: { id: string; keys: AnswerKey[] }[] = [
  { id: "about", keys: ["age", "sex", "height_cm", "weight_kg"] },
  { id: "history", keys: ["high_bp", "high_chol", "diff_walk"] },
  { id: "lifestyle", keys: ["smoker", "phys_activity", "fruits", "veggies", "heavy_alcohol"] },
  { id: "feel", keys: ["gen_health", "ment_health_days", "phys_health_days"] },
];

const NONE = new Set<AnswerKey>();

export default function HealthProfilePage() {
  const { t, language, setLanguage } = useTranslation();
  const { user, updateProfile } = useAuth();
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [status, setStatus] = useState<"loading" | "ready" | "unavailable">("loading");
  const [errors, setErrors] = useState<Partial<Record<AnswerKey, string>>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    let active = true;
    loadSavedAnswers()
      .then((saved) => {
        if (!active) return;
        setDraft({ ...EMPTY_DRAFT, ...saved });
        setStatus("ready");
      })
      .catch(() => active && setStatus("unavailable"));
    return () => {
      active = false;
    };
  }, []);

  const setField = <K extends AnswerKey>(k: K, v: Draft[K]) => {
    setDraft((d) => ({ ...d, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
    setMessage(null);
  };

  const save = async () => {
    const errs = validateKeys(ANSWER_KEYS, draft, t, { requireAll: false });
    if (draft.age !== null && draft.age < 18) errs.age = t("assess.under18.title");
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    const answers: Partial<AssessmentAnswers> = {};
    for (const k of ANSWER_KEYS) if (draft[k] !== null) (answers as Record<string, unknown>)[k] = draft[k];
    setSaving(true);
    try {
      await saveAnswers(answers);
      setMessage({ ok: true, text: t("healthProfilePage.saved") });
    } catch {
      setMessage({ ok: false, text: t("healthProfilePage.saveFailed") });
    } finally {
      setSaving(false);
    }
  };

  const changeLanguage = async (lang: SupportedLanguage) => {
    setLanguage(lang);
    if (user) {
      try {
        await updateProfile({ preferredLanguage: lang });
      } catch {
        setMessage({ ok: false, text: t("healthProfilePage.languageFailed") });
      }
    }
  };

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="space-y-1 border-b border-[#D8E2EA] pb-6">
          <h1 className="text-2xl font-extrabold text-[#0B1F33] sm:text-3xl">{t("nav.myHealth")}</h1>
          <p className="text-xs text-[#475569] sm:text-sm">{t("healthProfilePage.subtitle")}</p>
        </div>

        <Card className="space-y-3">
          <CardHeader title={t("healthProfilePage.language")} subtitle={t("healthProfilePage.languageHelp")} />
          <label htmlFor="pref-lang" className="sr-only">
            {t("healthProfilePage.language")}
          </label>
          <select
            id="pref-lang"
            value={language}
            onChange={(e) => changeLanguage(e.target.value as SupportedLanguage)}
            className="h-11 w-full max-w-xs rounded-xl border border-[#CBD5E1] bg-white px-3 text-sm text-[#0F172A] focus-visible:outline-2 focus-visible:outline-[#0E7490]"
          >
            {SUPPORTED_LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.nativeName}
              </option>
            ))}
          </select>
        </Card>

        {status === "loading" ? (
          <p className="text-sm text-[#475569]" aria-live="polite">
            {t("common.loading")}
          </p>
        ) : status === "unavailable" ? (
          <Card>
            <p className="text-sm text-[#334155]">{t("healthProfilePage.loadFailed")}</p>
          </Card>
        ) : (
          <>
            <p className="rounded-xl border border-[#0E7490]/30 bg-[#0E7490]/5 p-3 text-sm text-[#0F172A]">
              {t("healthProfilePage.intro")}
            </p>
            {GROUPS.map((g) => (
              <Card key={g.id} className="space-y-4">
                <CardHeader title={t(`assess.steps.${g.id}`)} />
                <AnswerFields keys={g.keys} draft={draft} setField={setField} errors={errors} prefilled={NONE} />
                <div className="flex flex-wrap gap-2">
                  {g.keys
                    .filter((k) => draft[k] !== null)
                    .map((k) => (
                      <Button
                        key={k}
                        variant="ghost"
                        size="sm"
                        leftIcon={<Eraser className="h-3.5 w-3.5" />}
                        onClick={() => setField(k, null)}
                      >
                        {t("healthProfilePage.clear")}: {t(`results.features.${FEATURE_OF[k]}`)}
                      </Button>
                    ))}
                </div>
              </Card>
            ))}
            {message && (
              <p
                role={message.ok ? "status" : "alert"}
                className={`flex items-center gap-2 rounded-xl border p-3 text-sm ${
                  message.ok ? "border-[#0F766E]/40 bg-[#ECFDF5] text-[#065F46]" : "border-[#B42318]/30 bg-[#FEF2F2] text-[#991B1B]"
                }`}
              >
                {message.ok && <CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
                {message.text}
              </p>
            )}
            <div className="flex flex-wrap gap-3">
              <Button variant="primary" onClick={save} isLoading={saving}>
                {t("common.save")}
              </Button>
              <Link href="/risk-assessment">
                <Button variant="outline" leftIcon={<Activity className="h-4 w-4" />}>
                  {t("dashboard.btnStartAssessment")}
                </Button>
              </Link>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}

/** Answer key → model feature name, used for the short labels in results.features. */
const FEATURE_OF: Record<AnswerKey, string> = {
  age: "Age",
  sex: "Sex",
  height_cm: "Height",
  weight_kg: "Weight",
  high_bp: "HighBP",
  high_chol: "HighChol",
  smoker: "Smoker",
  phys_activity: "PhysActivity",
  fruits: "Fruits",
  veggies: "Veggies",
  heavy_alcohol: "HvyAlcoholConsump",
  gen_health: "GenHlth",
  ment_health_days: "MentHlth",
  phys_health_days: "PhysHlth",
  diff_walk: "DiffWalk",
};
