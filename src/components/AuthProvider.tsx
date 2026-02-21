"use client";

import { createContext, useContext } from "react";
import { useAuth } from "@/lib/useAuth";
import type { User } from "@supabase/supabase-js";

interface AuthContextValue {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  signInWithMagicLink: (email: string) => Promise<{ error: unknown }>;
  signUp: (email: string, password: string) => Promise<{ error: unknown }>;
  signInWithPassword: (
    email: string,
    password: string
  ) => Promise<{ error: unknown }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth();

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuthContext must be used within <AuthProvider>");
  }
  return ctx;
}
