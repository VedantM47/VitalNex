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

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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

  // User Profile
  getProfile: () => fetchApi<any>("/api/v1/profile"),
  updateProfile: (data: any) => fetchApi<any>("/api/v1/profile", { method: "PUT", body: JSON.stringify(data) }),

  // Health Profile
  getHealthProfile: () => fetchApi<any>("/api/v1/health-profile"),

  // Screening (P4 API). Patients receive bands and text only (D-10).
  runAssessment: (payload: AssessmentRequest) =>
    fetchApi<AssessmentResponse>("/api/v1/assessment", { method: "POST", body: JSON.stringify(payload) }),
  getAssessment: (id: string) => fetchApi<AssessmentRecord>(`/api/v1/assessment/${id}`),
  getAssessmentHistory: () => fetchApi<HistoryResponse>("/api/v1/assessment/history"),
  runWhatIf: (payload: { base: AssessmentAnswers; changes: Changes; language: Lang }) =>
    fetchApi<WhatIfResponse>("/api/v1/what-if", { method: "POST", body: JSON.stringify(payload) }),
  getRecourse: (payload: { base: AssessmentAnswers; language: Lang }) =>
    fetchApi<RecourseResponse>("/api/v1/recourse", { method: "POST", body: JSON.stringify(payload) }),

  // AI Trust Passport
  getTrustPassport: (assessmentId: string) => fetchApi<any>(`/api/v1/trust-passport/${assessmentId}`),

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

  // Assistant & Voice
  sendAssistantMessage: (payload: { message: string; language: string }) =>
    fetchApi<any>("/api/v1/assistant/message", { method: "POST", body: JSON.stringify(payload) }),
  transcribeVoice: (audioBase64: string, language: string) =>
    fetchApi<any>("/api/v1/voice/transcribe", {
      method: "POST",
      body: JSON.stringify({ audio_base64: audioBase64, language }),
    }),

  // Reports (PDF rebuilt in P9)
  getReports: () => fetchApi<any[]>("/api/v1/reports"),
  getReportPdfUrl: (assessmentId: string) => `${API_BASE}/api/v1/reports/${assessmentId}/pdf`,

  // Model registry & governance
  getModels: () => fetchApi<any[]>("/api/v1/models"),
  getGovernanceSummary: () => fetchApi<any>("/api/v1/governance/summary"),
  // Frozen page (admin/datasets): the endpoint does not exist in the MVP.
  getDatasetMetadata: () => fetchApi<any>("/api/v1/dataset/metadata"),
};
