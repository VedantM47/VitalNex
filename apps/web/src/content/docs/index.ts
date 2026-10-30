import type { DocPage } from "./types";
import introduction from "./pages/introduction";
import gettingStarted from "./pages/getting-started";
import architecture from "./pages/architecture";
import responsibleAi from "./pages/responsible-ai";
import modelsAndData from "./pages/models-and-data";
import testing from "./pages/testing";
import apiReference from "./pages/api-reference";
import faq from "./pages/faq";
import accountsAndLogin from "./pages/accounts-and-login";
import patientDashboard from "./pages/patient-dashboard";
import riskAssessment from "./pages/risk-assessment";
import understandingResults from "./pages/understanding-results";
import historyAndReports from "./pages/history-and-reports";
import aiAssistant from "./pages/ai-assistant";
import careConnect from "./pages/care-connect";
import trustPassport from "./pages/trust-passport";
import clinicianWorkspace from "./pages/clinician-workspace";
import adminConsole from "./pages/admin-console";

// Sidebar order. Group titles are English like the content (D-27).
export const DOC_GROUPS: { title: string; pages: DocPage[] }[] = [
  { title: "Get started", pages: [introduction, gettingStarted, architecture] },
  {
    title: "Features for patients",
    pages: [accountsAndLogin, patientDashboard, riskAssessment, understandingResults, historyAndReports, aiAssistant, careConnect, trustPassport],
  },
  { title: "Features for clinicians and admins", pages: [clinicianWorkspace, adminConsole] },
  { title: "Responsible AI", pages: [responsibleAi, modelsAndData] },
  { title: "For developers", pages: [testing, apiReference, faq] },
];

export const DOC_PAGES: DocPage[] = DOC_GROUPS.flatMap((g) => g.pages);

export const DEFAULT_DOC = "introduction";

export function getDoc(slug: string): DocPage | undefined {
  return DOC_PAGES.find((p) => p.slug === slug);
}
