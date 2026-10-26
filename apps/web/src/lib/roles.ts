/** App roles. "doctor" is the clinician role; "researcher" exists in the schema but is unused. */
export type UserRole = "patient" | "doctor" | "admin";

export const ROLE_HOME: Record<UserRole, string> = {
  patient: "/dashboard",
  doctor: "/doctor/dashboard",
  admin: "/admin/dashboard",
};

/** Route prefixes and the roles allowed on them. Anything not listed here is public. */
export const PROTECTED_ROUTES: { prefix: string; roles: UserRole[] }[] = [
  { prefix: "/doctor", roles: ["doctor"] },
  { prefix: "/admin", roles: ["admin"] },
  { prefix: "/dashboard", roles: ["patient"] },
  { prefix: "/onboarding", roles: ["patient"] },
  { prefix: "/health-profile", roles: ["patient"] },
  { prefix: "/risk-assessment", roles: ["patient"] },
  { prefix: "/history", roles: ["patient"] },
  { prefix: "/reports", roles: ["patient"] },
  { prefix: "/appointments", roles: ["patient"] },
  { prefix: "/care-connect", roles: ["patient"] },
  { prefix: "/health-insights", roles: ["patient"] },
  { prefix: "/consultation", roles: ["patient", "doctor"] },
  { prefix: "/voice", roles: ["patient"] },
  { prefix: "/ai-assistant", roles: ["patient", "doctor", "admin"] },
  { prefix: "/settings", roles: ["patient", "doctor", "admin"] },
];

export function rolesFor(pathname: string): UserRole[] | null {
  const match = PROTECTED_ROUTES.find((r) => pathname === r.prefix || pathname.startsWith(`${r.prefix}/`));
  return match ? match.roles : null;
}

export function isUserRole(value: unknown): value is UserRole {
  return value === "patient" || value === "doctor" || value === "admin";
}
