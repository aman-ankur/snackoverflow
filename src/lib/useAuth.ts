"use client";

import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { migrateLocalStorageToCloud, flushPendingPushes } from "@/lib/supabase/sync";

interface AuthState {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoggedIn: false,
    isLoading: true,
  });

  useEffect(() => {
    const supabase = createClient();

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const user = session?.user ?? null;
      setState({ user, isLoggedIn: !!user, isLoading: false });

      // Migrate localStorage to cloud on first detection of logged-in user
      if (user) {
        migrateLocalStorageToCloud(user.id).catch(() => {});
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      setState({ user, isLoggedIn: !!user, isLoading: false });

      if (_event === "SIGNED_IN" && user) {
        migrateLocalStorageToCloud(user.id).catch(() => {});
      }
    });

    // Flush pending Supabase writes on tab close / navigation
    const handleUnload = () => flushPendingPushes();
    window.addEventListener("beforeunload", handleUnload);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") flushPendingPushes();
    });

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, []);

  const signInWithMagicLink = useCallback(async (email: string) => {
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback`;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    });
    return { error };
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectTo },
    });
    return { error };
  }, []);

  const signInWithPassword = useCallback(
    async (email: string, password: string) => {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    },
    []
  );

  const signOut = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setState({ user: null, isLoggedIn: false, isLoading: false });
  }, []);

  return {
    ...state,
    signInWithMagicLink,
    signUp,
    signInWithPassword,
    signOut,
  };
}
