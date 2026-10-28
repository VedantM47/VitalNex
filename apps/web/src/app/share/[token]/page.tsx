"use client";

// Public QR patient-held record (P7 step 4). Read-only summary the patient chose to share:
// levels and text only (no probabilities, D-10), "shared by the patient, expires at …" and the
// non-diagnostic notice. Every open is logged server-side (share_access_log). Expired, revoked
// and invalid links get a clear message and show nothing else.

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AlertTriangle, Lock } from "lucide-react";
import { BrandLogo } from "../../../components/layout/BrandLogo";
import { LanguageSelector } from "../../../components/ui/LanguageSelector";
import { Card, CardHeader } from "../../../components/ui/Card";
import { Alert } from "../../../components/ui/Alert";
import { ApiError, api } from "../../../lib/api-client";
import { useTranslation } from "../../../lib/i18n";
import { DISEASES, fmt } from "../../../lib/assessment";
import { dateOnly, dateTime } from "../../../lib/format";

type Failure = "expired" | "revoked" | "invalid" | "unavailable";

interface Shared {
  expires_at: string;
  sections: string[];
  history_hidden?: boolean;
  latest_results?: {
    created_at: string;
    next_step: string;
    emergency_flag: boolean;
    results: Record<string, { band: string | null; abstained: boolean }>;
  } | null;
  factors?: Record<string, { feature: string; direction: "raises" | "lowers" }[]> | null;
  history?: { created_at: string; next_step: string; bands: Record<string, string | null> }[] | null;
  clinician_notes?: {
    assessment_created_at: string | null;
    status: string;
    reviewed_at: string | null;
    clinician_note: string | null;
    clinician_bands: Record<string, string>;
  }[] | null;
}

function failureOf(err: unknown): Failure {
  if (err instanceof ApiError) {
    let code = "";
    try {
      code = JSON.parse(err.detail).code ?? "";
    } catch {
      code = "";
    }
    if (code === "expired" || code === "revoked") return code;
    if (err.status === 404 || code === "not_found") return "invalid";
  }
  return "unavailable";
}

export default function SharedRecordPage() {
  const { token } = useParams<{ token: string }>();
  const { t, language } = useTranslation();
  const [data, setData] = useState<Shared | null>(null);
  const [failure, setFailure] = useState<Failure | null>(null);

  useEffect(() => {
    let active = true;
    api
      .openShare(token)
      .then((d: Shared) => active && setData(d))
      .catch((e) => active && setFailure(failureOf(e)));
    return () => {
      active = false;
    };
  }, [token]);

  const band = (b: string | null | undefined, abstained?: boolean) =>
    abstained || !b ? t("results.notConfident") : t(`results.band.${b.toLowerCase()}`);
  const none = <p className="text-sm text-[#475569]">{t("share.public.none")}</p>;

  return (
    <div className="min-h-screen bg-[#F7FAFC]">
      <header className="flex items-center justify-between gap-4 border-b border-[#D8E2EA] bg-white px-4 py-3 sm:px-8">
        <BrandLogo size="sm" />
        <LanguageSelector variant="compact" />
      </header>
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
        <h1 className="text-2xl font-extrabold text-[#0B1F33]">{t("share.public.title")}</h1>

        {failure ? (
          <Card className="space-y-2 text-center">
            <Lock className="mx-auto h-8 w-8 text-[#475569]" aria-hidden="true" />
            <h2 className="text-lg font-bold text-[#0B1F33]">
              {failure === "unavailable" ? t("common.error") : t(`share.public.${failure}Title`)}
            </h2>
            <p role="alert" className="text-sm text-[#334155]">
              {failure === "unavailable" ? t("common.apiUnavailable") : t(`share.public.${failure}Body`)}
            </p>
          </Card>
        ) : !data ? (
          <p className="text-sm text-[#475569]" aria-live="polite">
            {t("share.public.loading")}
          </p>
        ) : (
          <>
            <Alert kind="info">
              <p className="font-semibold">{fmt(t("share.public.sharedBy"), { date: dateTime(data.expires_at, language) ?? "—" })}</p>
              <p className="text-xs">{t("share.public.readOnly")}</p>
            </Alert>
            <Alert kind="warning">
              <span className="flex gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                {t("share.public.notice")}
              </span>
            </Alert>

            {data.history_hidden && <Alert kind="info">{t("share.public.historyHidden")}</Alert>}

            {data.sections.includes("latest_results") && !data.history_hidden && (
              <Card>
                <CardHeader title={t("share.public.latest")} />
                {!data.latest_results ? (
                  none
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs text-[#475569]">
                      {fmt(t("share.public.screenedOn"), { date: dateOnly(data.latest_results.created_at, language) ?? "—" })}
                    </p>
                    {data.latest_results.emergency_flag ? (
                      <Alert kind="error">{t("historyPage.emergencyRow")}</Alert>
                    ) : (
                      <dl className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                        {DISEASES.filter((d) => data.latest_results!.results[d]).map((d) => {
                          const r = data.latest_results!.results[d];
                          return (
                            <div key={d} className="rounded-xl border border-[#E2E8F0] p-3">
                              <dt className="text-xs text-[#475569]">{t(`results.condition.${d}`)}</dt>
                              <dd className="text-base font-bold text-[#0B1F33]">{band(r.band, r.abstained)}</dd>
                            </div>
                          );
                        })}
                      </dl>
                    )}
                    <p className="text-sm">
                      <span className="font-semibold">{t("results.nextStepLabel")}:</span>{" "}
                      {t(`results.nextStep.${data.latest_results.next_step}.title`)}
                    </p>
                  </div>
                )}
              </Card>
            )}

            {data.sections.includes("factors") && !data.history_hidden && (
              <Card>
                <CardHeader title={t("share.public.factors")} />
                {!data.factors || Object.keys(data.factors).length === 0 ? (
                  none
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {DISEASES.filter((d) => data.factors![d]).map((d) => (
                      <div key={d}>
                        <h3 className="text-sm font-bold text-[#0B1F33]">{t(`results.condition.${d}`)}</h3>
                        {data.factors![d].length === 0 ? (
                          <p className="text-xs text-[#475569]">{t("results.why.none")}</p>
                        ) : (
                          <ul className="mt-1 space-y-0.5 text-sm">
                            {data.factors![d].map((f) => (
                              <li key={f.feature}>
                                {t(`results.features.${f.feature}`, f.feature)}: {t(`results.shared.${f.direction}`)}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {data.sections.includes("history") && !data.history_hidden && (
              <Card>
                <CardHeader title={t("share.public.history")} />
                {!data.history || data.history.length === 0 ? (
                  none
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[480px] text-sm">
                      <thead className="bg-[#F8FAFC]">
                        <tr>
                          <th scope="col" className="p-2 text-left text-xs">{t("admin.gov.act.date")}</th>
                          {DISEASES.map((d) => (
                            <th key={d} scope="col" className="p-2 text-left text-xs">
                              {t(`results.condition.${d}`)}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E2E8F0]">
                        {data.history.map((h, i) => (
                          <tr key={i}>
                            <th scope="row" className="p-2 text-left font-medium">{dateOnly(h.created_at, language)}</th>
                            {h.next_step === "emergency" ? (
                              <td colSpan={3} className="p-2 text-[#991B1B]">{t("historyPage.emergencyRow")}</td>
                            ) : (
                              DISEASES.map((d) => (
                                <td key={d} className="p-2">
                                  {d in h.bands ? band(h.bands[d]) : "—"}
                                </td>
                              ))
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            )}

            {data.sections.includes("clinician_notes") && !data.history_hidden && (
              <Card>
                <CardHeader title={t("share.public.notes")} />
                {!data.clinician_notes || data.clinician_notes.length === 0 ? (
                  none
                ) : (
                  <ul className="space-y-3">
                    {data.clinician_notes.map((n, i) => (
                      <li key={i} className="rounded-xl bg-[#F0FDF4] p-3 text-sm text-[#065F46]">
                        <p className="text-xs">
                          {fmt(t("share.public.reviewedOn"), { date: dateOnly(n.reviewed_at, language) ?? "—" })} ·{" "}
                          {fmt(t("share.public.screenedOn"), { date: dateOnly(n.assessment_created_at, language) ?? "—" })}
                        </p>
                        {Object.entries(n.clinician_bands).map(([d, b]) => (
                          <p key={d}>
                            {t("historyPage.clinicianLevel")} — {t(`results.condition.${d}`)}: {band(b)}
                          </p>
                        ))}
                        {n.clinician_note && <p className="mt-1">{n.clinician_note}</p>}
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            )}

            <p className="text-xs text-[#475569]">{t("results.disclaimer")}</p>
          </>
        )}
      </main>
    </div>
  );
}
