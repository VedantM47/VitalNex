"use client";

// Settings = language + "My data" (docs/SPEC.md §1.2: settings beyond language + My data are
// frozen). My data (P7, SPEC §2.2): view and toggle each consent purpose with its notice text and
// version (withdraw is one click and applies immediately), export everything as JSON, and request
// deletion with an in-page confirm dialog (never a browser alert).

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, QrCode, Trash2 } from "lucide-react";
import { AppShell } from "../../components/layout/AppShell";
import { Card, CardHeader } from "../../components/ui/Card";
import { Button, ButtonLink } from "../../components/ui/Button";
import { Alert } from "../../components/ui/Alert";
import { Dialog } from "../../components/ui/Dialog";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { api } from "../../lib/api-client";
import { useTranslation, SUPPORTED_LANGUAGES, type SupportedLanguage } from "../../lib/i18n";
import { useAuth } from "../../lib/auth-context";
import { fmt } from "../../lib/assessment";
import { dateTime } from "../../lib/format";

interface Consent {
  purpose: string;
  granted: boolean;
  granted_at: string | null;
  withdrawn_at: string | null;
  notice_version: string;
  required: boolean;
}

function ConsentCentre() {
  const { t, language } = useTranslation();
  const [consents, setConsents] = useState<Consent[] | null | "error">(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    let active = true;
    api
      .getConsents()
      .then((c) => active && setConsents(c))
      .catch(() => active && setConsents("error"));
    return () => {
      active = false;
    };
  }, []);

  const toggle = async (c: Consent) => {
    setBusy(c.purpose);
    setMsg(null);
    try {
      setConsents(await api.setConsent(c.purpose, !c.granted));
      setMsg({ ok: true, text: t("myData.changed") });
    } catch {
      setMsg({ ok: false, text: t("myData.changeFailed") });
    } finally {
      setBusy(null);
    }
  };

  if (consents === "error") return <Alert kind="error">{t("myData.loadFailed")}</Alert>;
  if (consents === null) return <p className="text-sm text-[#475569]">{t("common.loading")}</p>;
  return (
    <div className="space-y-4">
      {msg && <Alert kind={msg.ok ? "success" : "error"}>{msg.text}</Alert>}
      <ul className="space-y-4">
        {consents.map((c) => {
          const base = `myData.purposes.${c.purpose}`;
          const titleId = `consent-${c.purpose}`;
          return (
            <li key={c.purpose} className="space-y-2 rounded-2xl border border-[#D8E2EA] p-4" aria-labelledby={titleId}>
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                <div className="space-y-1">
                  <h3 id={titleId} className="text-sm font-bold text-[#0B1F33]">
                    {t(`${base}.title`)}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge size="sm" variant={c.granted ? "success" : "neutral"} label={c.granted ? t("myData.on") : t("myData.off")} />
                    {c.required && <StatusBadge size="sm" variant="info" label={t("myData.required")} />}
                  </div>
                </div>
                <Button
                  role="switch"
                  aria-checked={c.granted}
                  aria-describedby={`${titleId}-notice`}
                  size="sm"
                  variant={c.granted ? "outline" : "teal"}
                  isLoading={busy === c.purpose}
                  onClick={() => toggle(c)}
                >
                  {c.granted ? t("myData.withdraw") : t("myData.turnOn")}
                </Button>
              </div>
              <p id={`${titleId}-notice`} className="text-sm text-[#334155]">
                {t(`${base}.notice`)}
              </p>
              <p className="text-xs text-[#475569]">{fmt(t("myData.ifOff"), { text: t(`${base}.effect`) })}</p>
              <p className="text-xs text-[#475569]">
                {fmt(t("myData.version"), { v: c.notice_version })}
                {c.granted && c.granted_at && ` · ${fmt(t("myData.since"), { date: dateTime(c.granted_at, language) ?? "—" })}`}
                {!c.granted && c.withdrawn_at && ` · ${fmt(t("myData.withdrawnOn"), { date: dateTime(c.withdrawn_at, language) ?? "—" })}`}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ExportAndDelete() {
  const { t } = useTranslation();
  const { logout } = useAuth();
  const router = useRouter();
  const [exporting, setExporting] = useState(false);
  const [exportMsg, setExportMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const doExport = async () => {
    setExporting(true);
    setExportMsg(null);
    try {
      const { blob, filename } = await api.downloadMyData();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setExportMsg({ ok: true, text: t("myData.export.done") });
    } catch {
      setExportMsg({ ok: false, text: t("myData.export.failed") });
    } finally {
      setExporting(false);
    }
  };

  const doDelete = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      await api.deleteMyData();
      setOpen(false);
      try {
        await logout();
      } catch {
        // the account no longer exists; the local session is cleared below by navigation
      }
      router.replace("/");
    } catch {
      setDeleteError(t("myData.delete.failed"));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Card className="space-y-3">
        <CardHeader title={t("myData.export.title")} subtitle={t("myData.export.body")} />
        {exportMsg && <Alert kind={exportMsg.ok ? "success" : "error"}>{exportMsg.text}</Alert>}
        <Button variant="outline" size="sm" onClick={doExport} isLoading={exporting} leftIcon={<Download className="h-4 w-4" />}>
          {t("myData.export.button")}
        </Button>
      </Card>

      <Card className="space-y-3 border-[#B42318]/30">
        <CardHeader title={t("myData.delete.title")} subtitle={t("myData.delete.body")} />
        <Button
          variant="danger"
          size="sm"
          onClick={() => {
            setTyped("");
            setDeleteError(null);
            setOpen(true);
          }}
          leftIcon={<Trash2 className="h-4 w-4" />}
        >
          {t("myData.delete.button")}
        </Button>
      </Card>

      <Dialog open={open} onClose={() => !deleting && setOpen(false)} title={t("myData.delete.dialogTitle")} labelledBy="delete-title">
        <p className="text-sm text-[#334155]">{t("myData.delete.body")}</p>
        <p className="text-sm font-semibold text-[#0B1F33]">{t("myData.delete.dialogBody")}</p>
        <div className="space-y-1">
          <label htmlFor="delete-confirm" className="text-xs font-semibold text-[#0B1F33]">
            {t("myData.delete.typeLabel")}
          </label>
          <input
            id="delete-confirm"
            autoComplete="off"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            className="h-10 w-full rounded-xl border border-[#CBD5E1] px-3 font-mono text-sm focus-visible:outline-2 focus-visible:outline-[#B42318]"
          />
        </div>
        {deleteError && <Alert kind="error">{deleteError}</Alert>}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setOpen(false)} disabled={deleting}>
            {t("common.cancel")}
          </Button>
          <Button variant="danger" size="sm" onClick={doDelete} disabled={typed !== "DELETE"} isLoading={deleting}>
            {t("myData.delete.confirm")}
          </Button>
        </div>
      </Dialog>
    </>
  );
}

export default function SettingsPage() {
  const { t, language, setLanguage } = useTranslation();
  const { user, role, updateProfile } = useAuth();
  const [langError, setLangError] = useState(false);

  const changeLanguage = async (lang: SupportedLanguage) => {
    setLanguage(lang);
    setLangError(false);
    if (user) {
      try {
        await updateProfile({ preferredLanguage: lang });
      } catch {
        setLangError(true);
      }
    }
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="space-y-1 border-b border-[#D8E2EA] pb-6">
          <h1 className="text-2xl font-extrabold text-[#0B1F33] sm:text-3xl">{t("nav.settings")}</h1>
          <p className="text-xs text-[#475569] sm:text-sm">{t("settingsPage.subtitle")}</p>
        </div>

        <Card className="space-y-3">
          <CardHeader title={t("settingsPage.language")} subtitle={t("settingsPage.languageHelp")} />
          <label htmlFor="ui-lang" className="sr-only">
            {t("settingsPage.language")}
          </label>
          <select
            id="ui-lang"
            value={language}
            onChange={(e) => changeLanguage(e.target.value as SupportedLanguage)}
            className="h-11 w-full max-w-xs rounded-xl border border-[#CBD5E1] bg-white px-3 text-sm focus-visible:outline-2 focus-visible:outline-[#0E7490]"
          >
            {SUPPORTED_LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.nativeName}
              </option>
            ))}
          </select>
          {langError && <Alert kind="warning">{t("healthProfilePage.languageFailed")}</Alert>}
        </Card>

        <section aria-labelledby="mydata-h" className="space-y-4">
          <div className="space-y-1">
            <h2 id="mydata-h" className="text-xl font-bold text-[#0B1F33]">
              {t("myData.title")}
            </h2>
            <p className="text-sm text-[#475569]">{t("myData.subtitle")}</p>
          </div>
          {role === "patient" ? (
            <>
              <Card className="space-y-4">
                <CardHeader title={t("myData.consents")} />
                <ConsentCentre />
              </Card>
              <ExportAndDelete />
              <ButtonLink href="/reports" variant="outline">
                <QrCode className="h-4 w-4" aria-hidden="true" />
                {t("myData.shareLink")}
              </ButtonLink>
            </>
          ) : (
            <Alert kind="info">{t("myData.staffNote")}</Alert>
          )}
        </section>
      </div>
    </AppShell>
  );
}
