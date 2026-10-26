"use client";

import React, { createContext, useContext, useMemo, useState, useSyncExternalStore, ReactNode } from "react";

export type UserRole = "patient" | "doctor" | "researcher" | "admin";

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  phone?: string;
  preferredLanguage: string;
  isDemo: boolean;
}

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, role?: UserRole, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  switchRole: (newRole: UserRole) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USERS: Record<UserRole, UserProfile> = {
  patient: {
    id: "usr-demo-patient-001",
    email: "rajesh.sharma@vitalnex.health",
    fullName: "Rajesh Sharma",
    role: "patient",
    phone: "+91 98220 12345",
    preferredLanguage: "en",
    isDemo: true,
  },
  doctor: {
    id: "d0000001-0000-0000-0000-000000000001",
    email: "dr.anand.joshi@vitalnex.health",
    fullName: "Dr. Anand Joshi",
    role: "doctor",
    phone: "+91 98220 54321",
    preferredLanguage: "mr",
    isDemo: true,
  },
  researcher: {
    id: "usr-demo-researcher-001",
    email: "research.ai@vitalnex.health",
    fullName: "Prof. Arvind Patil",
    role: "researcher",
    phone: "+91 98220 67890",
    preferredLanguage: "en",
    isDemo: true,
  },
  admin: {
    id: "usr-demo-admin-001",
    email: "admin@vitalnex.health",
    fullName: "VITALNEX Governance Admin",
    role: "admin",
    phone: "+91 98220 99999",
    preferredLanguage: "en",
    isDemo: true,
  },
};

// TODO(P1): replaced by Supabase Auth. Until then the demo session lives in localStorage
// and is read with useSyncExternalStore (no setState inside an effect, no hydration mismatch).
const USER_KEY = "vitalnex_user_profile";
const ROLE_KEY = "vitalnex_demo_role";
const SESSION_EVENT = "vitalnex-session-change";
const LOGGED_OUT = "logged-out";
const SERVER_SNAPSHOT = "__server__";

function subscribeToSession(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(SESSION_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(SESSION_EVENT, onChange);
  };
}

function readSessionSnapshot(): string {
  return JSON.stringify([localStorage.getItem(USER_KEY), localStorage.getItem(ROLE_KEY)]);
}

function writeSession(user: UserProfile | null, role: UserRole | null) {
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } else {
    localStorage.setItem(USER_KEY, LOGGED_OUT);
  }
  if (role) {
    localStorage.setItem(ROLE_KEY, role);
  } else {
    localStorage.removeItem(ROLE_KEY);
  }
  window.dispatchEvent(new Event(SESSION_EVENT));
}

function resolveSession(snapshot: string): { user: UserProfile | null; role: UserRole } {
  const [savedUserStr, savedRoleStr] = JSON.parse(snapshot) as [string | null, string | null];
  const savedRole = savedRoleStr as UserRole | null;
  if (savedUserStr === LOGGED_OUT) {
    return { user: null, role: savedRole || "patient" };
  }
  if (savedUserStr) {
    try {
      const parsed = JSON.parse(savedUserStr) as UserProfile;
      return { user: parsed, role: parsed.role || savedRole || "patient" };
    } catch {
      return { user: DEMO_USERS.patient, role: "patient" };
    }
  }
  if (savedRole && DEMO_USERS[savedRole]) {
    return { user: DEMO_USERS[savedRole], role: savedRole };
  }
  return { user: DEMO_USERS.patient, role: "patient" };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const snapshot = useSyncExternalStore(subscribeToSession, readSessionSnapshot, () => SERVER_SNAPSHOT);
  const [pending, setPending] = useState(false);

  const isHydrated = snapshot !== SERVER_SNAPSHOT;
  const { user, role } = useMemo(
    () => (isHydrated ? resolveSession(snapshot) : { user: null, role: "patient" as UserRole }),
    [snapshot, isHydrated]
  );
  const isLoading = !isHydrated || pending;

  const login = async (email: string, targetRole: UserRole = "patient", customName?: string) => {
    setPending(true);
    try {
      const baseDemo = DEMO_USERS[targetRole];
      const isDemoUser = email.endsWith("@vitalnex.health") && (email.startsWith("rajesh") || email.startsWith("dr.anand") || email.startsWith("admin"));
      const derivedName = customName || (isDemoUser ? baseDemo.fullName : email.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()));
      const derivedId = isDemoUser ? baseDemo.id : `usr-${email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "-")}`;

      const newUser: UserProfile = {
        id: derivedId,
        email,
        fullName: derivedName,
        role: targetRole,
        phone: baseDemo.phone,
        preferredLanguage: baseDemo.preferredLanguage,
        isDemo: isDemoUser,
      };

      writeSession(newUser, targetRole);
    } finally {
      setPending(false);
    }
  };

  const logout = async () => {
    writeSession(null, null);
  };

  const switchRole = (newRole: UserRole) => {
    writeSession(DEMO_USERS[newRole], newRole);
  };

  const updateProfile = (updates: Partial<UserProfile>) => {
    if (!user) return;
    writeSession({ ...user, ...updates }, role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        switchRole,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

