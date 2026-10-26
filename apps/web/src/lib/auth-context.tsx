"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { createClient } from "./supabase/client";
import { isUserRole, type UserRole } from "./roles";
import { api } from "./api-client";

export type { UserRole } from "./roles";

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  phone?: string;
  preferredLanguage: string;
  isDemo: boolean;
}

interface SignUpResult {
  /** False when Supabase requires e-mail confirmation before the first sign-in. */
  signedIn: boolean;
}

interface AuthContextType {
  user: UserProfile | null;
  /** Role from the `profiles` table. Null while signed out or loading. */
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<UserProfile>;
  signUp: (email: string, password: string, fullName: string, language: string) => Promise<SignUpResult>;
  logout: () => Promise<void>;
  updateProfile: (updates: { fullName?: string; phone?: string; preferredLanguage?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface ProfileRow {
  id: string;
  email: string;
  full_name: string;
  role: string;
  phone_number: string | null;
  preferred_language: string;
  is_demo: boolean;
}

function toProfile(row: ProfileRow): UserProfile | null {
  if (!isUserRole(row.role)) return null;
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    role: row.role,
    phone: row.phone_number ?? undefined,
    preferredLanguage: row.preferred_language,
    isDemo: row.is_demo,
  };
}

async function fetchProfile(session: Session | null): Promise<UserProfile | null> {
  if (!session) return null;
  // RLS: a user can read only their own profile row.
  const { data, error } = await createClient()
    .from("profiles")
    .select("id, email, full_name, role, phone_number, preferred_language, is_demo")
    .eq("id", session.user.id)
    .single<ProfileRow>();
  if (error || !data) return null;
  return toProfile(data);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    let supabase;
    try {
      supabase = createClient();
    } catch (err) {
      console.error(err);
      // Supabase not configured: nobody is signed in.
      queueMicrotask(() => active && setIsLoading(false));
      return () => {
        active = false;
      };
    }
    // Fires once with the current session, then on every sign-in / sign-out / refresh.
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "TOKEN_REFRESHED") return;
      // Supabase advises not awaiting other Supabase calls inside this callback.
      setTimeout(async () => {
        const profile = await fetchProfile(session);
        if (!active) return;
        setUser(profile);
        setIsLoading(false);
      }, 0);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    const profile = await fetchProfile(data.session);
    if (!profile) {
      await supabase.auth.signOut();
      throw new Error("No VITALNEX profile for this account.");
    }
    setUser(profile);
    // Audit the login. A failure here must not block sign-in, but it is reported.
    api.recordLogin().catch((err) => console.error("[VITALNEX] login audit failed", err));
    return profile;
  }, []);

  const signUp = useCallback(async (email: string, password: string, fullName: string, language: string) => {
    // Patient self-signup only. The database always creates a 'patient' profile,
    // whatever is in the metadata; doctor and admin accounts are seeded.
    const { data, error } = await createClient().auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, preferred_language: language } },
    });
    if (error) throw error;
    if (data.session) {
      setUser(await fetchProfile(data.session));
      api.recordLogin().catch((err) => console.error("[VITALNEX] login audit failed", err));
    }
    return { signedIn: !!data.session };
  }, []);

  const logout = useCallback(async () => {
    await api.recordLogout().catch(() => undefined);
    await createClient().auth.signOut();
    setUser(null);
  }, []);

  const updateProfile = useCallback(
    async (updates: { fullName?: string; phone?: string; preferredLanguage?: string }) => {
      if (!user) return;
      const row: Record<string, string> = {};
      if (updates.fullName !== undefined) row.full_name = updates.fullName;
      if (updates.phone !== undefined) row.phone_number = updates.phone;
      if (updates.preferredLanguage !== undefined) row.preferred_language = updates.preferredLanguage;
      const { error } = await createClient().from("profiles").update(row).eq("id", user.id);
      if (error) throw error;
      setUser({ ...user, ...updates });
    },
    [user]
  );

  const value = useMemo(
    () => ({
      user,
      role: user?.role ?? null,
      isAuthenticated: !!user,
      isLoading,
      signIn,
      signUp,
      logout,
      updateProfile,
    }),
    [user, isLoading, signIn, signUp, logout, updateProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
