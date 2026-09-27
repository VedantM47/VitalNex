"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { createClient } from "./supabase/client";

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
  login: (email: string, role?: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  switchRole: (newRole: UserRole) => void;
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<UserRole>(() => {
    if (typeof window !== "undefined") {
      const savedRole = localStorage.getItem("vitalnex_demo_role") as UserRole;
      if (savedRole && DEMO_USERS[savedRole]) return savedRole;
    }
    return "patient";
  });

  const [user, setUser] = useState<UserProfile | null>(() => {
    if (typeof window !== "undefined") {
      const savedRole = localStorage.getItem("vitalnex_demo_role") as UserRole;
      if (savedRole && DEMO_USERS[savedRole]) return DEMO_USERS[savedRole];
    }
    return DEMO_USERS.patient;
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const login = async (email: string, targetRole: UserRole = "patient") => {
    setIsLoading(true);
    try {
      const selected = DEMO_USERS[targetRole];
      setUser({ ...selected, email });
      setRole(targetRole);
      localStorage.setItem("vitalnex_demo_role", targetRole);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      setUser(null);
      localStorage.removeItem("vitalnex_demo_role");
    } finally {
      setIsLoading(false);
    }
  };

  const switchRole = (newRole: UserRole) => {
    setRole(newRole);
    setUser(DEMO_USERS[newRole]);
    localStorage.setItem("vitalnex_demo_role", newRole);
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
