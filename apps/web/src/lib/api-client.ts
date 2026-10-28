/**
 * VITALNEX Frontend API Client.
 * Calls the FastAPI backend with the signed-in user's Supabase access token. The API
 * works out who the user is from the token; no user id is ever sent by the browser.
 */

import { createClient } from "./supabase/client";
import type {
  AssessmentAnswers,
  AssessmentRecord,
  AssessmentRequest,
  AssessmentResponse,
  Changes,
  HistoryResponse,
  Lang,
  RecourseResponse,
  WhatIfResponse,
} from "./assessment";

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/** Absolute URL for an API path the server returned (e.g. "/api/v1/trust-passport/images/…"). */
export function apiUrl(path: string): string {
  return `${API_BASE}${path}`;
}

export class ApiError extends Error {
  constructor(public status: number, public detail: string) {
    super(`API ${status}: ${detail}`);
  }
}

/** What kind of failure an API call had, so pages can show an honest message. */
export type ApiFailure = "signin" | "consent" | "validation" | "notFound" | "unavailable";

export function apiFailure(err: unknown): ApiFailure {
  if (err instanceof ApiError) {
    if (err.status === 401) return "signin";
    if (err.status === 403) return "consent";
    if (err.status === 404) return "notFound";
    if (err.status === 422) return "validation";
  }
  // Network errors (API not running) and 5xx / 503 (e.g. Supabase not configured).
  return "unavailable";
}

async function authHeader(): Promise<Record<string, string>> {
  try {
    const { data } = await createClient().auth.getSession();
    const token = data.session?.access_token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(await authHeader()),
      ...options.headers,
    },
  });

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = typeof body.detail === "string" ? body.detail : JSON.stringify(body.detail);
    } catch {
      // keep statusText
    }
    console.warn(`[VITALNEX API Client] ${endpoint} -> ${res.status}: ${detail}`);
    throw new ApiError(res.status, detail);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  // Health
  getHealth: () => fetchApi<any>("/health"),

  // Session (audit) and consents
  getMe: () => fetchApi<any>("/api/v1/me"),
  recordLogin: () => fetchApi<void>("/api/v1/me/login-event", { method: "POST" }),
  recordLogout: () => fetchApi<void>("/api/v1/me/logout-event", { method: "POST" }),
  getConsents: () => fetchApi<any[]>("/api/v1/consents"),
  setConsent: (purpose: string, granted: boolean) =>
    fetchApi<any[]>(`/api/v1/consents/${purpose}`, { method: "PUT", body: JSON.stringify({ granted }) }),
  getConsentNotice: () => fetchApi<any>("/api/v1/consents/notice"),

  // Data rights ("My data", SPEC §2.2)
  downloadMyData: async (): Promise<{ blob: Blob; filename: string }> => {
    const res = await fetch(`${API_BASE}/api/v1/me/data-export`, { headers: await authHeader() });
    if (!res.ok) throw new ApiError(res.status, res.statusText);
    const cd = res.headers.get("Content-Disposition") || "";
    const m = /filename="([^"]+)"/.exec(cd);
    return { blob: await res.blob(), filename: m ? m[1] : "vitalnex-my-data.json" };
  },
  deleteMyData: () =>
    fetchApi<any>("/api/v1/me/data-deletion", { method: "POST", body: JSON.stringify({ confirm: "DELETE" }) }),

  // QR patient-held record (P7)
  createShare: (payload: { sections: string[]; expires_in: "1h" | "24h" | "7d" }) =>
    fetchApi<any>("/api/v1/shares", { method: "POST", body: JSON.stringify(payload) }),
  getShares: () => fetchApi<any[]>("/api/v1/shares"),
  revokeShare: (id: string) => fetchApi<void>(`/api/v1/shares/${id}/revoke`, { method: "POST" }),
  openShare: (token: string) => fetchApi<any>(`/api/v1/share/${encodeURIComponent(token)}`),

  // User Profile
  getProfile: () => fetchApi<any>("/api/v1/profile"),
  updateProfile: (data: any) => fetchApi<any>("/api/v1/profile", { method: "PUT", body: JSON.stringify(data) }),

  // Health Profile (14-answer contract; unanswered questions are absent, never defaulted)
  getHealthProfile: () =>
    fetchApi<{ saved: boolean; answers: Record<string, unknown>; updated_at: string | null }>("/api/v1/health-profile"),
  saveHealthProfile: (answers: Record<string, unknown>) =>
    fetchApi<{ saved: boolean; answers: Record<string, unknown>; updated_at: string | null }>("/api/v1/health-profile", {
      method: "PUT",
      body: JSON.stringify({ answers }),
    }),

  // Screening (P4 API). Patients receive bands and text only (D-10).
  runAssessment: (payload: AssessmentRequest) =>
    fetchApi<AssessmentResponse>("/api/v1/assessment", { method: "POST", body: JSON.stringify(payload) }),
  getAssessment: (id: string) => fetchApi<AssessmentRecord>(`/api/v1/assessment/${id}`),
  getAssessmentHistory: () => fetchApi<HistoryResponse>("/api/v1/assessment/history"),
  runWhatIf: (payload: { base: AssessmentAnswers; changes: Changes; language: Lang }) =>
    fetchApi<WhatIfResponse>("/api/v1/what-if", { method: "POST", body: JSON.stringify(payload) }),
  getRecourse: (payload: { base: AssessmentAnswers; language: Lang }) =>
    fetchApi<RecourseResponse>("/api/v1/recourse", { method: "POST", body: JSON.stringify(payload) }),

  // AI Trust Passport + principle map (public; built from model_meta.json and DB aggregates)
  getTrustPassport: () => fetchApi<any>("/api/v1/trust-passport"),
  getPrincipleMap: () => fetchApi<any>("/api/v1/trust-passport/principles"),
  modelCardUrl: (disease: string) => `${API_BASE}/api/v1/models/${disease}/card`,

  // Doctors & Care Connect
  getDoctors: (params?: Record<string, string>) => {
    const query = params ? "?" + new URLSearchParams(params).toString() : "";
    return fetchApi<any[]>(`/api/v1/doctors${query}`);
  },
  getDoctor: (id: string) => fetchApi<any>(`/api/v1/doctors/${id}`),

  // Appointments (patient: own bookings; doctor: bookings with them)
  getAppointments: (status?: string) =>
    fetchApi<any[]>(`/api/v1/appointments${status ? `?status=${encodeURIComponent(status)}` : ""}`),
  getAppointment: (id: string) => fetchApi<any>(`/api/v1/appointments/${id}`),
  createAppointment: (payload: { slot_id: string; consultation_type?: string; patient_reason?: string; assessment_id?: string }) =>
    fetchApi<any>("/api/v1/appointments", { method: "POST", body: JSON.stringify(payload) }),
  updateAppointment: (id: string, payload: { status?: string; doctor_notes?: string }) =>
    fetchApi<any>(`/api/v1/appointments/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),

  // Clinician review queue
  getDoctorReviews: (status?: string) =>
    fetchApi<any[]>(`/api/v1/doctor/reviews${status ? `?status=${encodeURIComponent(status)}` : ""}`),
  getDoctorReview: (assessmentId: string) => fetchApi<any>(`/api/v1/doctor/reviews/${assessmentId}`),
  updateDoctorReview: (assessmentId: string, payload: any) =>
    fetchApi<any>(`/api/v1/doctor/reviews/${assessmentId}`, { method: "PATCH", body: JSON.stringify(payload) }),
  getDoctorPatients: () => fetchApi<any[]>("/api/v1/doctor/patients"),
  getDoctorCase: (assessmentId: string) => fetchApi<any>(`/api/v1/doctor/cases/${assessmentId}`),

  // Assistant & Voice
  sendAssistantMessage: (payload: { message: string; language: string }) =>
    fetchApi<any>("/api/v1/assistant/message", { method: "POST", body: JSON.stringify(payload) }),
  transcribeVoice: (audioBase64: string, language: string) =>
    fetchApi<any>("/api/v1/voice/transcribe", {
      method: "POST",
      body: JSON.stringify({ audio_base64: audioBase64, language }),
    }),

  // Reports: saved screenings and the printable PDF (bands only, D-10)
  getReports: () => fetchApi<any[]>("/api/v1/reports"),
  downloadReportPdf: async (assessmentId: string, lang: Lang): Promise<{ blob: Blob; filename: string }> => {
    const res = await fetch(
      `${API_BASE}/api/v1/reports/${encodeURIComponent(assessmentId)}/pdf?lang=${encodeURIComponent(lang)}`,
      { headers: await authHeader() },
    );
    if (!res.ok) throw new ApiError(res.status, res.statusText);
    const cd = res.headers.get("Content-Disposition") || "";
    const m = /filename="([^"]+)"/.exec(cd);
    return { blob: await res.blob(), filename: m ? m[1] : `vitalnex-report-${lang}.pdf` };
  },

  // Model registry & governance
  getModels: () => fetchApi<any[]>("/api/v1/models"),
  getGovernanceSummary: () => fetchApi<any>("/api/v1/governance/summary"),
  // Frozen page (admin/datasets): the endpoint does not exist in the MVP.
  getDatasetMetadata: () => fetchApi<any>("/api/v1/dataset/metadata"),

  // Admin governance (aggregates only, no patient identities)
  getGovModels: () => fetchApi<any[]>("/api/v1/admin/governance/models"),
  getGovFairness: () => fetchApi<any>("/api/v1/admin/governance/fairness"),
  getGovOverrides: () => fetchApi<any>("/api/v1/admin/governance/overrides"),
  getGovActivity: (days: number) => fetchApi<any>(`/api/v1/admin/governance/activity?days=${days}`),
  getGovConsents: () => fetchApi<any>("/api/v1/admin/governance/consents"),
  getGovAuditLogs: (filters: Record<string, string | number | undefined>) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(filters)) if (v !== undefined && v !== "") q.set(k, String(v));
    return fetchApi<any>(`/api/v1/admin/governance/audit-logs?${q.toString()}`);
  },
};
