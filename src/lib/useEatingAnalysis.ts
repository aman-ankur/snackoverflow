"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import type {
  EatingAnalysis,
  EatingReport,
  LoggedMeal,
  NutritionGoals,
  HealthProfile,
} from "@/lib/dishTypes";
import { aggregateMeals, serializeForPrompt } from "@/lib/mealAggregator";
import { useAuthContext } from "@/components/AuthProvider";
import { pullUserData, pushUserData } from "@/lib/supabase/sync";

const STORAGE_KEY = "snackoverflow-meal-analyses-v1";
const MAX_STORED = 10;

function loadStored(): EatingAnalysis[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function useEatingAnalysis() {
  const [analyses, setAnalyses] = useState<EatingAnalysis[]>(loadStored);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, isLoggedIn } = useAuthContext();
  const hasPulledCloud = useRef(false);

  // Pull from Supabase on login
  useEffect(() => {
    if (!isLoggedIn || !user || hasPulledCloud.current) return;
    hasPulledCloud.current = true;
    pullUserData(user.id)
      .then((cloud) => {
        if (!cloud?.meal_analyses) return;
        const cloudAnalyses = cloud.meal_analyses;
        if (Array.isArray(cloudAnalyses) && cloudAnalyses.length > 0) {
          setAnalyses(cloudAnalyses as EatingAnalysis[]);
        }
      })
      .catch(() => {});
  }, [isLoggedIn, user]);

  // Persist to localStorage + Supabase
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(analyses));
    if (isLoggedIn && user) {
      pushUserData(user.id, "meal_analyses", analyses);
    }
  }, [analyses, isLoggedIn, user]);

  /**
   * Find the most recent analysis for a given window.
   */
  const getLatest = useCallback(
    (windowDays?: number): EatingAnalysis | null => {
      const candidates = windowDays !== undefined
        ? analyses.filter((a) => a.windowDays === windowDays)
        : analyses;
      if (candidates.length === 0) return null;
      return candidates.reduce((latest, a) =>
        a.generatedAt > latest.generatedAt ? a : latest
      );
    },
    [analyses]
  );

  /**
   * Check if a cached report is still fresh (no new meals since generation).
   */
  const isCacheFresh = useCallback(
    (windowDays: number, meals: LoggedMeal[]): boolean => {
      const latest = getLatest(windowDays);
      if (!latest) return false;

      const newestMealTime = meals.reduce((max, m) => {
        const t = new Date(m.loggedAt).getTime();
        return t > max ? t : max;
      }, 0);

      const generatedTime = new Date(latest.generatedAt).getTime();
      return newestMealTime <= generatedTime;
    },
    [getLatest]
  );

  /**
   * Generate a new eating analysis. Orchestrates:
   * 1. Client-side aggregation
   * 2. API call
   * 3. Storage
   */
  const generate = useCallback(
    async (
      windowDays: number,
      meals: LoggedMeal[],
      goals: NutritionGoals,
      healthProfile: HealthProfile | null
    ): Promise<EatingAnalysis | null> => {
      setIsGenerating(true);
      setError(null);

      try {
        // Dev mode: return mock analysis instantly
        const { getDevMode } = await import("@/lib/useDevMode");
        if (getDevMode()) {
          const { MOCK_EATING_ANALYSIS, DEV_MOCK_DELAY_MS } = await import("@/lib/mockDevData");
          await new Promise((r) => setTimeout(r, DEV_MOCK_DELAY_MS));
          const mockAnalysis = { ...MOCK_EATING_ANALYSIS, windowDays, generatedAt: new Date().toISOString() };
          setAnalyses((prev) => [mockAnalysis, ...prev].slice(0, MAX_STORED));
          setIsGenerating(false);
          return mockAnalysis;
        }

        const aggregate = aggregateMeals(meals, windowDays, goals);

        if (aggregate.totalMeals === 0) {
          setError("No meals logged for this period.");
          setIsGenerating(false);
          return null;
        }

        const aggregateSummary = serializeForPrompt(aggregate);
        const healthContext = healthProfile?.healthContextString ?? "";

        // Find previous report for same window (for comparison)
        const previousReport = getLatest(windowDays);
        const previousSummary = previousReport
          ? previousReport.report.scoreSummary
          : undefined;

        const response = await fetch("/api/analyze-habits", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            aggregateSummary,
            healthContext,
            previousSummary,
            goalCalories: goals.calories,
            goalProtein: goals.protein,
          }),
        });

        if (!response.ok) {
          const errBody = await response.json().catch(() => ({}));
          throw new Error(
            (errBody as { error?: string }).error ?? `API error ${response.status}`
          );
        }

        const data = await response.json() as {
          report: EatingReport;
          _provider: string;
        };

        const analysis: EatingAnalysis = {
          id: `analysis-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          windowDays,
          generatedAt: new Date().toISOString(),
          mealsCount: aggregate.totalMeals,
          report: data.report,
          previousReportId: previousReport?.id,
          provider: data._provider,
        };

        setAnalyses((prev) => {
          const updated = [analysis, ...prev].slice(0, MAX_STORED);
          return updated;
        });

        setIsGenerating(false);
        return analysis;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Analysis failed";
        setError(msg);
        setIsGenerating(false);
        return null;
      }
    },
    [getLatest]
  );

  return {
    analyses,
    isGenerating,
    error,
    generate,
    getLatest,
    isCacheFresh,
  };
}
