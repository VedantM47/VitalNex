/**
 * VITALNEX Frontend API Client.
 * Connects Next.js to FastAPI backend with typed contracts and graceful demo fallbacks.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`API ${res.status}: ${errText || res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    console.warn(`[VITALNEX API Client] Error calling ${endpoint}:`, error);
    throw error;
  }
}

export const api = {
  // Health
  getHealth: () => fetchApi<any>("/health"),

  // User Profile
  getProfile: (userId?: string) =>
    fetchApi<any>(`/api/v1/profile${userId ? `?user_id=${encodeURIComponent(userId)}` : ""}`),
  updateProfile: (data: any, userId?: string) =>
    fetchApi<any>(`/api/v1/profile${userId ? `?user_id=${encodeURIComponent(userId)}` : ""}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),


  // Health Profile
  getHealthProfile: (userId = "demo-user") =>
    fetchApi<any>(`/api/v1/health-profile?user_id=${userId}`),
  updateHealthProfile: (data: any) =>
    fetchApi<any>("/api/v1/health-profile", { method: "PUT", body: JSON.stringify(data) }),

  // Clinical Risk Assessment
  runAssessment: (payload: any) =>
    fetchApi<any>("/api/v1/assessment", { method: "POST", body: JSON.stringify(payload) }),
  getAssessment: (id: string) => fetchApi<any>(`/api/v1/assessment/${id}`),

  // AI Trust Passport
  getTrustPassport: (assessmentId: string) =>
    fetchApi<any>(`/api/v1/trust-passport/${assessmentId}`),

  // Doctors & Care Connect
  getDoctors: (params?: Record<string, string>) => {
    const query = params ? "?" + new URLSearchParams(params).toString() : "";
    return fetchApi<any[]>(`/api/v1/doctors${query}`);
  },
  getDoctor: (id: string) => fetchApi<any>(`/api/v1/doctors/${id}`),

  // Appointments
  getAppointments: (userId = "demo-user", role = "patient", status?: string) => {
    const params = new URLSearchParams({ user_id: userId, role });
    if (status) params.append("status", status);
    return fetchApi<any[]>(`/api/v1/appointments?${params.toString()}`);
  },
  getAppointment: (id: string) => fetchApi<any>(`/api/v1/appointments/${id}`),
  createAppointment: (payload: any) =>
    fetchApi<any>("/api/v1/appointments", { method: "POST", body: JSON.stringify(payload) }),
  updateAppointment: (id: string, payload: any) =>
    fetchApi<any>(`/api/v1/appointments/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  deleteAppointment: (id: string) =>
    fetchApi<any>(`/api/v1/appointments/${id}`, { method: "DELETE" }),

  // Clinician Patient Reviews
  getDoctorReviews: (clinicianId = "doc-pune-001", status?: string) => {
    const params = new URLSearchParams({ clinician_id: clinicianId });
    if (status) params.append("status", status);
    return fetchApi<any[]>(`/api/v1/doctor/reviews?${params.toString()}`);
  },
  getDoctorReview: (assessmentId: string) =>
    fetchApi<any>(`/api/v1/doctor/reviews/${assessmentId}`),
  updateDoctorReview: (assessmentId: string, payload: any) =>
    fetchApi<any>(`/api/v1/doctor/reviews/${assessmentId}`, { method: "PATCH", body: JSON.stringify(payload) }),

  // Assistant & Voice
  sendAssistantMessage: (payload: { user_id: string; message: string; language: string }) =>
    fetchApi<any>("/api/v1/assistant/message", { method: "POST", body: JSON.stringify(payload) }),
  transcribeVoice: (audioBase64: string, language: string) =>
    fetchApi<any>("/api/v1/voice/transcribe", {
      method: "POST",
      body: JSON.stringify({ audio_base64: audioBase64, language }),
    }),

  // What-If Model Simulator
  runWhatIf: (payload: any) =>
    fetchApi<any>("/api/v1/what-if", { method: "POST", body: JSON.stringify(payload) }),

  // Clinical Reports & PDF Download
  getReports: (userId = "demo-user") =>
    fetchApi<any[]>(`/api/v1/reports?user_id=${userId}`),
  getReportPdfUrl: (assessmentId: string) =>
    `${API_BASE}/api/v1/reports/${assessmentId}/pdf`,

  // Assessment History Timeline
  getAssessmentHistory: (userId = "demo-user") =>
    fetchApi<any>(`/api/v1/assessment/history/${userId}`),

  // Model Laboratory & Governance
  getModels: () => fetchApi<any[]>("/api/v1/models"),
  getGovernanceSummary: () => fetchApi<any>("/api/v1/governance/summary"),
  getDatasetMetadata: () => fetchApi<any>("/api/v1/dataset/metadata"),
};

