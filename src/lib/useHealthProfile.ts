"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import type { HealthProfile, HealthCondition, LabValue, LabHistoryEntry, DietPreference } from "@/lib/dishTypes";
import { buildHealthContextString } from "@/lib/healthContextBuilder";
import { useAuthContext } from "@/components/AuthProvider";
import { pullUserData, pushUserData } from "@/lib/supabase/sync";

const STORAGE_KEY = "snackoverflow-health-profile-v1";

const EMPTY_PROFILE: HealthProfile = {
  conditions: [],
  labValues: [],
  labHistory: [],
  freeTextNotes: "",
  dietPreference: undefined,
  healthContextString: "",
  updatedAt: "",
};

function loadStored(): HealthProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<HealthProfile>;
    return {
      conditions: Array.isArray(parsed.conditions) ? parsed.conditions : [],
      labValues: Array.isArray(parsed.labValues) ? parsed.labValues : [],
      labHistory: Array.isArray(parsed.labHistory) ? parsed.labHistory : [],
      freeTextNotes: typeof parsed.freeTextNotes === "string" ? parsed.freeTextNotes : "",
      dietPreference: parsed.dietPreference,
      healthContextString: typeof parsed.healthContextString === "string" ? parsed.healthContextString : "",
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : "",
    };
  } catch {
    return null;
  }
}

export function useHealthProfile() {
  const [healthProfile, setHealthProfileState] = useState<HealthProfile | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const { user, isLoggedIn } = useAuthContext();
  const hasPulledCloud = useRef(false);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = loadStored();
    setHealthProfileState(stored);
    setHasLoaded(true);
  }, []);

  // Pull from Supabase when user logs in
  useEffect(() => {
    if (!isLoggedIn || !user || !hasLoaded || hasPulledCloud.current) return;
    hasPulledCloud.current = true;
    pullUserData(user.id)
      .then((cloud) => {
        if (!cloud || !cloud.health_profile) return;
        const cloudProfile = cloud.health_profile as Partial<HealthProfile>;
        const merged: HealthProfile = {
          conditions: Array.isArray(cloudProfile.conditions) ? cloudProfile.conditions : [],
          labValues: Array.isArray(cloudProfile.labValues) ? cloudProfile.labValues : [],
          labHistory: Array.isArray(cloudProfile.labHistory) ? cloudProfile.labHistory : [],
          freeTextNotes: typeof cloudProfile.freeTextNotes === "string" ? cloudProfile.freeTextNotes : "",
          dietPreference: cloudProfile.dietPreference,
          healthContextString: typeof cloudProfile.healthContextString === "string" ? cloudProfile.healthContextString : "",
          updatedAt: typeof cloudProfile.updatedAt === "string" ? cloudProfile.updatedAt : "",
        };
        setHealthProfileState(merged);
      })
      .catch(() => {});
  }, [isLoggedIn, user, hasLoaded]);

  // Persist to localStorage + Supabase on change
  useEffect(() => {
    if (!hasLoaded || !healthProfile) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(healthProfile));

    if (isLoggedIn && user) {
      pushUserData(user.id, "health_profile", healthProfile);
    }
  }, [healthProfile, hasLoaded, isLoggedIn, user]);

  /**
   * Save a complete health profile. Recomputes the context string
   * and archives any changed lab values into history.
   */
  const saveHealthProfile = useCallback(
    (
      conditions: HealthCondition[],
      labValues: LabValue[],
      freeTextNotes: string,
      dietPreference?: DietPreference
    ) => {
      setHealthProfileState((prev) => {
        const now = new Date().toISOString();

        // Archive changed lab values into history
        const newHistory: LabHistoryEntry[] = [...(prev?.labHistory ?? [])];
        const prevLabMap = new Map((prev?.labValues ?? []).map((l) => [l.key, l]));

        for (const lab of labValues) {
          const prevLab = prevLabMap.get(lab.key);
          // Archive if value changed or is new
          if (!prevLab || prevLab.value !== lab.value || prevLab.testedAt !== lab.testedAt) {
            newHistory.push({
              key: lab.key,
              value: lab.value,
              unit: lab.unit,
              testedAt: lab.testedAt,
              recordedAt: now,
            });
          }
        }

        // Keep history capped at 100 entries
        const trimmedHistory = newHistory.slice(-100);

        const draft: HealthProfile = {
          conditions,
          labValues,
          labHistory: trimmedHistory,
          freeTextNotes,
          dietPreference,
          healthContextString: "",
          updatedAt: now,
        };

        // Generate the AI context string
        draft.healthContextString = buildHealthContextString(draft);

        return draft;
      });
    },
    []
  );

  /**
   * Clear the health profile entirely.
   */
  const clearHealthProfile = useCallback(() => {
    setHealthProfileState(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    healthProfile,
    hasHealthProfile: healthProfile !== null && healthProfile.conditions.length > 0,
    healthContextString: healthProfile?.healthContextString ?? "",
    hasLoaded,
    saveHealthProfile,
    clearHealthProfile,
  };
}
