"use client";

import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { flushPendingPushes } from "@/lib/supabase/sync";
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
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      dlog(`useAuth: onAuthStateChange event=${_event} user=${user?.email ?? "null"}`);
      setState({ user, isLoggedIn: !!user, isLoading: false });
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

  const sendEmailOTP = useCallback(async (email: string) => {
    dlog(`sendOTP: START email=${email}`);
    try {
      dlog("sendOTP: creating client");
      const supabase = createClient();

      // Network connectivity test — can the device reach Supabase at all?
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
      dlog(`sendOTP: testing connectivity to ${supabaseUrl}...`);
      try {
        const pingStart = Date.now();
        const pingRes = await Promise.race([
          fetch(`${supabaseUrl}/auth/v1/settings`, { method: "GET" }),
          new Promise<never>((_, rej) => setTimeout(() => rej(new Error("ping timeout 5s")), 5000)),
        ]);
        dlog(`sendOTP: ping OK status=${pingRes.status} in ${Date.now() - pingStart}ms`);
      } catch (pingErr) {
        const msg = pingErr instanceof Error ? pingErr.message : String(pingErr);
        dlog(`sendOTP: PING FAILED — ${msg}`);
        return { error: { message: "Can't connect to auth server. Try switching from WiFi to mobile data, or check if a DNS blocker or ad-blocker is active." } };
      }

      dlog("sendOTP: calling signInWithOtp...");
      const startMs = Date.now();

      // Race against a 12s timeout so the spinner never hangs forever
      // No emailRedirectTo — OTP is verified in-app, not via link
      const otpPromise = supabase.auth.signInWithOtp({ email });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Request timed out. Try switching from WiFi to mobile data.")), 12000)
      );

      const { error } = await Promise.race([otpPromise, timeoutPromise]);
      const elapsed = Date.now() - startMs;

      if (error) {
        dlog(`sendOTP: ERROR after ${elapsed}ms — ${error.message} (status=${(error as { status?: number }).status})`);
      } else {
        dlog(`sendOTP: SUCCESS after ${elapsed}ms`);
      }
      return { error };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      dlog(`sendOTP: CATCH — ${msg}`);
      return { error: { message: msg } };
    }
  }, []);

  const verifyEmailOTP = useCallback(async (email: string, token: string) => {
    dlog(`verifyOTP: START email=${email} token=${token}`);
    try {
      const supabase = createClient();
      const startMs = Date.now();

      const verifyPromise = supabase.auth.verifyOtp({
        email,
        token,
        type: "email",
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Verification timed out. Please try again.")), 12000)
      );

      const { error } = await Promise.race([verifyPromise, timeoutPromise]);
      const elapsed = Date.now() - startMs;

      if (error) {
        dlog(`verifyOTP: ERROR after ${elapsed}ms — ${error.message}`);
      } else {
        dlog(`verifyOTP: SUCCESS after ${elapsed}ms — session established`);
      }
      return { error };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      dlog(`verifyOTP: CATCH — ${msg}`);
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
    sendEmailOTP,
    verifyEmailOTP,
    signUp,
    signInWithPassword,
    signOut,
  };
}
