"use client";

import { useState, useCallback } from "react";

const STORAGE_KEY = "snackoverflow-dev-mode-v1";

/**
 * Reactive hook for Dev Mode toggle in UI (Profile settings).
 */
export function useDevMode(): [boolean, (v: boolean) => void] {
  const [enabled, setEnabled] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem(STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });

  const toggle = useCallback((v: boolean) => {
    setEnabled(v);
    try {
      localStorage.setItem(STORAGE_KEY, String(v));
    } catch {
      // localStorage unavailable
    }
  }, []);

  return [enabled, toggle];
}

/**
 * Standalone (non-reactive) getter for use inside async callbacks
 * in hooks that don't need to re-render on dev mode changes.
 */
export function getDevMode(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}
