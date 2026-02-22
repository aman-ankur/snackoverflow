"use client";

import { useState, useCallback, useEffect } from "react";

const STORAGE_KEY = "snackoverflow-coach-marks";

export type CoachMarkId =
  | "scan-toggle"
  | "empty-meals"
  | "meal-details"
  | "capy-garden"
  | "progress-rings"
  | "send-to-cook";

function loadSeen(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function persistSeen(seen: Record<string, boolean>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seen));
  } catch { /* quota exceeded — ignore */ }
}

export function useCoachMarks() {
  const [seen, setSeen] = useState<Record<string, boolean>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setSeen(loadSeen());
    setLoaded(true);
  }, []);

  const dismiss = useCallback((id: CoachMarkId) => {
    setSeen((prev) => {
      const next = { ...prev, [id]: true };
      persistSeen(next);
      return next;
    });
  }, []);

  const shouldShow = useCallback(
    (id: CoachMarkId) => loaded && !seen[id],
    [seen, loaded]
  );

  const resetAll = useCallback(() => {
    setSeen({});
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  }, []);

  return { shouldShow, dismiss, resetAll };
}
