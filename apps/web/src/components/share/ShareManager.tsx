"use client";

// QR patient-held record (novelty 9, PROMPTS P7 step 4): the patient picks sections and an
// expiry; the server returns the URL + QR once (only the token hash is stored). The list shows
// every share, each open (time + role of the viewer) and lets the patient revoke it.

import React, { useEffect, useState } from "react";
import { Copy, QrCode } from "lucide-react";
import { Card, CardHeader } from "../ui/Card";
import { Button } from "../ui/Button";
import { Alert } from "../ui/Alert";
import { StatusBadge, type StatusVariant } from "../ui/StatusBadge";
import { api } from "../../lib/api-client";
import { useTranslation } from "../../lib/i18n";
import { fmt } from "../../lib/assessment";
import { dateTime } from "../../lib/format";

const SECTIONS = ["latest_results", "factors", "history", "clinician_notes"] as const;
const EXPIRIES = ["1h", "24h", "7d"] as const;
type Expiry = (typeof EXPIRIES)[number];

interface ShareInfo {
  id: string;
  sections: string[];
  created_at: string;
  expires_at: string;
  status: "active" | "expired" | "revoked";
  open_count: number;
  opens: { accessed_at: string; accessor_role: string }[];
}
interface Created {
  id: string;
  url: string;
  expires_at: string;
  qr_png_data_uri: string;
}

const STATUS_VARIANT: Record<ShareInfo["status"], StatusVariant> = { active: "success", expired: "neutral", revoked: "danger" };

export function ShareManager() {
  const { t, language } = useTranslation();
  const [sections, setSections] = useState<string[]>(["latest_results"]);
  const [expiry, setExpiry] = useState<Expiry>("24h");
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<Created | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copyMsg, setCopyMsg] = useState<string | null>(null);
  const [shares, setShares] = useState<ShareInfo[] | null | "error">(null);
  const [historyOff, setHistoryOff] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    api
      .getShares()
      .then((s) => active && setShares(s))
      .catch(() => active && setShares("error"));
    api
      .getConsents()
      .then((c: { purpose: string; granted: boolean }[]) => {
        if (active) setHistoryOff(!c.find((x) => x.purpose === "store_history")?.granted);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  const reload = async () => {
    try {
      setShares(await api.getShares());
    } catch {
      setShares("error");
    }
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setCopyMsg(null);
    if (sections.length === 0) return setError(t("share.chooseSection"));
    setCreating(true);
    try {
      const ordered = SECTIONS.filter((s) => sections.includes(s));
      setCreated(await api.createShare({ sections: ordered, expires_in: expiry }));
      await reload();
    } catch {
      setError(t("share.createFailed"));
    } finally {
      setCreating(false);
    }
  };

  const copy = async () => {
    if (!created) return;
    try {
      await navigator.clipboard.writeText(created.url);
      setCopyMsg(t("share.copied"));
    } catch {
      setCopyMsg(t("share.copyFailed"));
    }
  };

  const revoke = async (id: string) => {
    setBusy(id);
    setError(null);
    try {
      await api.revokeShare(id);
      if (created?.id === id) setCreated(null);
      await reload();
    } catch {
      setError(t("share.revokeFailed"));
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card className="space-y-5">
      <CardHeader title={t("share.title")} subtitle={t("share.intro")} badge={<QrCode className="h-5 w-5 text-[#0E7490]" aria-hidden="true" />} />
      {historyOff && <Alert kind="warning">{t("share.historyOff")}</Alert>}

      <form onSubmit={create} className="space-y-4" noValidate>
        <fieldset className="space-y-2">
          <legend className="text-sm font-bold text-[#0B1F33]">{t("share.sectionsLabel")}</legend>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {SECTIONS.map((s) => (
              <label key={s} className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={sections.includes(s)}
                  onChange={(e) => setSections((cur) => (e.target.checked ? [...cur, s] : cur.filter((x) => x !== s)))}
                  className="h-4 w-4 accent-[#0E7490]"
                />
                {t(`share.sections.${s}`)}
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset className="space-y-2">
          <legend className="text-sm font-bold text-[#0B1F33]">{t("share.expiryLabel")}</legend>
          <div className="flex flex-wrap gap-4">
            {EXPIRIES.map((x) => (
              <label key={x} className="flex cursor-pointer items-center gap-2 text-sm">
                <input type="radio" name="expiry" value={x} checked={expiry === x} onChange={() => setExpiry(x)} className="h-4 w-4 accent-[#0E7490]" />
                {t(`share.expiry.${x}`)}
              </label>
            ))}
          </div>
        </fieldset>
        {error && <Alert kind="error">{error}</Alert>}
        <Button type="submit" variant="primary" size="sm" isLoading={creating}>
          {t("share.create")}
        </Button>
      </form>

      {created && (
        <div className="space-y-3 rounded-2xl border border-[#0E7490]/30 bg-[#0E7490]/5 p-4" aria-live="polite">
          <h3 className="text-sm font-bold text-[#0B1F33]">{t("share.createdTitle")}</h3>
          <p className="text-xs text-[#334155]">{t("share.createdNote")}</p>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            {/* eslint-disable-next-line @next/next/no-img-element -- data URI generated by the API */}
            <img src={created.qr_png_data_uri} alt={t("share.qrAlt")} width={180} height={180} className="rounded-xl border border-[#E2E8F0] bg-white" />
            <div className="min-w-0 flex-1 space-y-2">
              <label htmlFor="share-url" className="sr-only">
                {t("share.createdTitle")}
              </label>
              <input
                id="share-url"
                readOnly
                value={created.url}
                onFocus={(e) => e.currentTarget.select()}
                className="h-10 w-full rounded-xl border border-[#CBD5E1] bg-white px-3 font-mono text-xs"
              />
              <p className="text-xs text-[#334155]">{fmt(t("share.expiresAt"), { date: dateTime(created.expires_at, language) ?? "—" })}</p>
              <Button type="button" variant="outline" size="sm" onClick={copy} leftIcon={<Copy className="h-3.5 w-3.5" />}>
                {t("share.copy")}
              </Button>
              {copyMsg && <p className="text-xs text-[#065F46]" role="status">{copyMsg}</p>}
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <h3 className="text-sm font-bold text-[#0B1F33]">{t("share.listTitle")}</h3>
        {shares === "error" ? (
          <Alert kind="error">{t("share.listFailed")}</Alert>
        ) : shares === null ? (
          <p className="text-sm text-[#475569]">{t("common.loading")}</p>
        ) : shares.length === 0 ? (
          <p className="text-sm text-[#475569]">{t("share.listEmpty")}</p>
        ) : (
          <ul className="space-y-3">
            {shares.map((s) => (
              <li key={s.id} className="space-y-2 rounded-xl border border-[#E2E8F0] p-3">
                <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                  <div className="space-y-0.5 text-sm">
                    <p className="font-semibold text-[#0B1F33]">{s.sections.map((x) => t(`share.sections.${x}`, x)).join(", ")}</p>
                    <p className="text-xs text-[#475569]">
                      {fmt(t("share.createdAt"), { date: dateTime(s.created_at, language) ?? "—" })} ·{" "}
                      {fmt(t("share.expiresAt"), { date: dateTime(s.expires_at, language) ?? "—" })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge size="sm" variant={STATUS_VARIANT[s.status]} label={t(`share.status.${s.status}`)} />
                    {s.status === "active" && (
                      <Button size="sm" variant="outline" isLoading={busy === s.id} onClick={() => revoke(s.id)}>
                        {t("share.revoke")}
                      </Button>
                    )}
                  </div>
                </div>
                <details className="text-xs">
                  <summary className="cursor-pointer text-[#0E7490]">{fmt(t("share.opens"), { n: s.open_count })}</summary>
                  {s.opens.length > 0 && (
                    <ul className="mt-1 space-y-0.5 pl-4 text-[#334155]">
                      {s.opens.map((o, i) => (
                        <li key={i}>
                          {fmt(t("share.openRow"), {
                            date: dateTime(o.accessed_at, language) ?? "—",
                            role: t(`share.roles.${o.accessor_role}`, o.accessor_role),
                          })}
                        </li>
                      ))}
                    </ul>
                  )}
                </details>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}
