"use client";

import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { migrateLocalStorageToCloud, flushPendingPushes } from "@/lib/supabase/sync";
import { dlog } from "@/lib/debugLog";

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
    dlog("useAuth: mounting, creating client");
    const supabase = createClient();
    dlog("useAuth: client created, calling getSession");

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const user = session?.user ?? null;
      dlog(`useAuth: getSession done, user=${user?.email ?? "null"}`);
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
      dlog(`useAuth: onAuthStateChange event=${_event} user=${user?.email ?? "null"}`);
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
    dlog(`magicLink: START email=${email}`);
    try {
      dlog("magicLink: creating client");
      const supabase = createClient();
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
      const redirectTo = `${siteUrl}/auth/callback`;
      dlog(`magicLink: origin=${window.location.origin} siteUrl=${siteUrl} redirectTo=${redirectTo}`);

      dlog("magicLink: calling signInWithOtp...");
      const startMs = Date.now();

      // Race against a 12s timeout so the spinner never hangs forever
      const otpPromise = supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirectTo },
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Supabase signInWithOtp timed out after 12s")), 12000)
      );

      const { error } = await Promise.race([otpPromise, timeoutPromise]);
      const elapsed = Date.now() - startMs;

      if (error) {
        dlog(`magicLink: ERROR after ${elapsed}ms — ${error.message} (status=${(error as { status?: number }).status})`);
      } else {
        dlog(`magicLink: SUCCESS after ${elapsed}ms`);
      }
      return { error };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      dlog(`magicLink: CATCH — ${msg}`);
      return { error: { message: msg } };
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    dlog(`signUp: START email=${email}`);
    try {
      const supabase = createClient();
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
      const redirectTo = `${siteUrl}/auth/callback`;
      dlog(`signUp: calling supabase.auth.signUp...`);
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: redirectTo },
      });
      dlog(`signUp: done, error=${error?.message ?? "none"}`);
      return { error };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      dlog(`signUp: CATCH — ${msg}`);
      return { error: { message: msg } };
    }
  }, []);

  const signInWithPassword = useCallback(
    async (email: string, password: string) => {
      dlog(`signInPassword: START email=${email}`);
      try {
        const supabase = createClient();
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        dlog(`signInPassword: done, error=${error?.message ?? "none"}`);
        return { error };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        dlog(`signInPassword: CATCH — ${msg}`);
        return { error: { message: msg } };
      }
    },
    []
  );

  const signOut = useCallback(async () => {
    dlog("signOut: START");
    const supabase = createClient();
    await supabase.auth.signOut();
    setState({ user: null, isLoggedIn: false, isLoading: false });
    dlog("signOut: done");
  }, []);

  return {
    ...state,
    signInWithMagicLink,
    signUp,
    signInWithPassword,
    signOut,
  };
}
