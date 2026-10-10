"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<UserRole>("patient");
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedUserStr = localStorage.getItem("vitalnex_user_profile");
      const savedRole = localStorage.getItem("vitalnex_demo_role") as UserRole;
      if (savedUserStr) {
        try {
          const parsed = JSON.parse(savedUserStr);
          setUser(parsed);
          setRole(parsed.role || savedRole || "patient");
        } catch {
          setUser(DEMO_USERS.patient);
        }
      } else if (savedRole && DEMO_USERS[savedRole]) {
        setUser(DEMO_USERS[savedRole]);
        setRole(savedRole);
      } else {
        setUser(DEMO_USERS.patient);
        setRole("patient");
      }
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, targetRole: UserRole = "patient", customName?: string) => {
    setIsLoading(true);
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

      setUser(newUser);
      setRole(targetRole);
      localStorage.setItem("vitalnex_demo_role", targetRole);
      localStorage.setItem("vitalnex_user_profile", JSON.stringify(newUser));
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      setUser(null);
      localStorage.removeItem("vitalnex_demo_role");
      localStorage.removeItem("vitalnex_user_profile");
    } finally {
      setIsLoading(false);
    }
  };

  const switchRole = (newRole: UserRole) => {
    setRole(newRole);
    const selected = DEMO_USERS[newRole];
    setUser(selected);
    localStorage.setItem("vitalnex_demo_role", newRole);
    localStorage.setItem("vitalnex_user_profile", JSON.stringify(selected));
  };

  const updateProfile = (updates: Partial<UserProfile>) => {
    if (!user) return;
    const updated = { ...user, ...updates };
    setUser(updated);
    localStorage.setItem("vitalnex_user_profile", JSON.stringify(updated));
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

