"use client";

import { useState, useEffect, useSyncExternalStore } from "react";
import { Mail, Lock, ArrowRight, CheckCircle, AlertCircle, Bug } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import CapyMascot from "@/components/CapyMascot";
import { dlog, getDebugLogs, subscribeDebugLogs } from "@/lib/debugLog";

interface AuthScreenProps {
  onMagicLink: (email: string) => Promise<{ error: unknown }>;
  onSignUp: (email: string, password: string) => Promise<{ error: unknown }>;
  onSignInPassword: (email: string, password: string) => Promise<{ error: unknown }>;
}

type Mode = "magic" | "password-login" | "password-signup";

/** Floating on-screen debug log panel — tap the bug icon to toggle. */
function DebugPanel() {
  const [open, setOpen] = useState(false);
  // Re-render when new logs arrive
  const logs = useSyncExternalStore(
    subscribeDebugLogs,
    () => getDebugLogs(),
    () => getDebugLogs()
  );
  const [, setTick] = useState(0);
  useEffect(() => subscribeDebugLogs(() => setTick((t) => t + 1)), []);

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-20 right-3 z-[9999] h-9 w-9 flex items-center justify-center rounded-full bg-violet-600 text-white shadow-lg active:scale-90 transition-transform"
        aria-label="Toggle debug logs"
      >
        <Bug className="h-4 w-4" />
      </button>
      {/* Panel */}
      {open && (
        <div className="fixed inset-x-2 bottom-32 z-[9999] max-h-[50vh] overflow-y-auto rounded-xl bg-gray-900/95 border border-violet-400/40 p-3 shadow-2xl backdrop-blur">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-violet-300 uppercase tracking-wider">
              Auth Debug Log ({logs.length})
            </span>
            <button
              onClick={() => setOpen(false)}
              className="text-[10px] text-gray-400 font-bold"
            >
              Close
            </button>
          </div>
          {logs.length === 0 ? (
            <p className="text-[10px] text-gray-500">No logs yet. Tap &quot;Send Magic Link&quot; to start.</p>
          ) : (
            <div className="space-y-0.5">
              {logs.map((entry, i) => (
                <div key={i} className="flex gap-2 text-[9px] font-mono leading-tight">
                  <span className="text-gray-500 shrink-0">{entry.t}</span>
                  <span className={
                    entry.msg.includes("ERROR") || entry.msg.includes("CATCH")
                      ? "text-red-400"
                      : entry.msg.includes("SUCCESS")
                        ? "text-green-400"
                        : "text-gray-300"
                  }>
                    {entry.msg}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default function AuthScreen({
  onMagicLink,
  onSignUp,
  onSignInPassword,
}: AuthScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<Mode>("magic");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    dlog(`AuthScreen: handleSubmit mode=${mode} email=${email.trim()}`);
    setLoading(true);
    setError(null);

    try {
      let result: { error: unknown };

      if (mode === "magic") {
        dlog("AuthScreen: calling onMagicLink...");
        result = await onMagicLink(email.trim());
        dlog(`AuthScreen: onMagicLink returned, error=${result.error ? "YES" : "no"}`);
      } else if (mode === "password-signup") {
        if (password.length < 6) {
          setError("Password must be at least 6 characters");
          setLoading(false);
          return;
        }
        result = await onSignUp(email.trim(), password);
      } else {
        result = await onSignInPassword(email.trim(), password);
      }

      if (result.error) {
        const err = result.error as { message?: string };
        const msg = err.message || "Something went wrong";
        dlog(`AuthScreen: showing error — ${msg}`);
        setError(msg);
      } else if (mode === "magic" || mode === "password-signup") {
        dlog("AuthScreen: success → showing sent state");
        setSent(true);
      }
    } catch (catchErr) {
      const msg = catchErr instanceof Error ? catchErr.message : String(catchErr);
      dlog(`AuthScreen: CATCH — ${msg}`);
      setError("Something went wrong. Please try again.");
    } finally {
      dlog("AuthScreen: finally → setLoading(false)");
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <>
        <DebugPanel />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl bg-card border border-border p-6 text-center"
        >
          <div className="animate-breathe inline-block mb-3">
            <CapyMascot mood="happy" size={80} />
          </div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <h3 className="text-base font-extrabold text-foreground">Check your email!</h3>
          </div>
          <p className="text-xs text-muted mt-1">
            We sent a {mode === "magic" ? "magic link" : "confirmation email"} to{" "}
            <span className="font-bold text-foreground">{email}</span>
          </p>
          <p className="text-[10px] text-muted-light mt-3">
            Click the link in the email to sign in. You can close this screen.
          </p>
          <button
            onClick={() => {
              setSent(false);
              setEmail("");
              setPassword("");
            }}
            className="mt-4 text-xs text-accent font-semibold hover:text-accent-dim transition-colors"
          >
            Try a different email
          </button>
        </motion.div>
      </>
    );
  }

  return (
    <>
      <DebugPanel />
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-card border border-border p-5"
      >
        <div className="text-center mb-4">
          <div className="animate-breathe inline-block mb-2">
            <CapyMascot mood="motivated" size={64} />
          </div>
          <h3 className="text-sm font-extrabold text-foreground">
            Sign in to sync your data
          </h3>
          <p className="text-[10px] text-muted-light mt-0.5">
            Access your meals & progress from any device
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Email */}
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl bg-background border border-border pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-light focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
            />
          </div>

          {/* Password (conditional) */}
          <AnimatePresence>
            {mode !== "magic" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="relative overflow-hidden"
              >
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                <input
                  type="password"
                  placeholder={mode === "password-signup" ? "Create password (6+ chars)" : "Password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full rounded-xl bg-background border border-border pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-light focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2"
              >
                <AlertCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                <p className="text-[11px] text-red-600">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-accent text-white font-bold text-sm py-2.5 hover:bg-accent-dim transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                {mode === "magic" && "Send Magic Link"}
                {mode === "password-login" && "Sign In"}
                {mode === "password-signup" && "Create Account"}
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* Mode switcher */}
        <div className="mt-4 pt-3 border-t border-border text-center space-y-1.5">
          {mode === "magic" && (
            <>
              <button
                onClick={() => { setMode("password-login"); setError(null); }}
                className="text-[11px] text-accent font-semibold hover:text-accent-dim transition-colors"
              >
                Sign in with password instead
              </button>
              <p className="text-[10px] text-muted-light">
                or{" "}
                <button
                  onClick={() => { setMode("password-signup"); setError(null); }}
                  className="text-accent font-semibold hover:text-accent-dim transition-colors"
                >
                  create an account
                </button>
              </p>
            </>
          )}
          {mode === "password-login" && (
            <>
              <button
                onClick={() => { setMode("magic"); setError(null); }}
                className="text-[11px] text-accent font-semibold hover:text-accent-dim transition-colors"
              >
                Use magic link instead
              </button>
              <p className="text-[10px] text-muted-light">
                No account?{" "}
                <button
                  onClick={() => { setMode("password-signup"); setError(null); }}
                  className="text-accent font-semibold hover:text-accent-dim transition-colors"
                >
                  Sign up
                </button>
              </p>
            </>
          )}
          {mode === "password-signup" && (
            <>
              <button
                onClick={() => { setMode("magic"); setError(null); }}
                className="text-[11px] text-accent font-semibold hover:text-accent-dim transition-colors"
              >
                Use magic link instead
              </button>
              <p className="text-[10px] text-muted-light">
                Already have an account?{" "}
                <button
                  onClick={() => { setMode("password-login"); setError(null); }}
                  className="text-accent font-semibold hover:text-accent-dim transition-colors"
                >
                  Sign in
                </button>
              </p>
            </>
          )}
        </div>
      </motion.div>
    </>
  );
}
