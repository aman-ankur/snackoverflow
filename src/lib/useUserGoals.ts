"use client";

import { useCallback, useEffect, useState } from "react";
import type { UserProfile, NutritionGoals, StreakData } from "@/lib/dishTypes";
import { calculateGoals, DEFAULT_GOALS } from "@/lib/tdeeCalculator";
import { useAuthContext } from "@/components/AuthProvider";
import { pullUserData, pushUserData } from "@/lib/supabase/sync";

const PROFILE_KEY = "snackoverflow-user-goals-v1";
const MEAL_LOG_KEY = "snackoverflow-meal-log-v1";

function todayDateKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayDateKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

interface StoredData {
  profile: UserProfile | null;
  goals: NutritionGoals;
  streak: StreakData;
}

function loadStored(): StoredData {
  const fallback: StoredData = {
    profile: null,
    goals: DEFAULT_GOALS,
    streak: { currentStreak: 0, lastLogDate: "", longestStreak: 0 },
  };

  if (typeof window === "undefined") return fallback;

  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<StoredData>;

    return {
      profile: parsed.profile ?? null,
      goals: parsed.goals ?? DEFAULT_GOALS,
      streak: parsed.streak ?? fallback.streak,
    };
  } catch {
    return fallback;
  }
}

function computeStreak(currentStreak: StreakData): StreakData {
  try {
    const raw = localStorage.getItem(MEAL_LOG_KEY);
    if (!raw) return currentStreak;

    const meals = JSON.parse(raw);
    if (!Array.isArray(meals) || meals.length === 0) return currentStreak;

    const today = todayDateKey();
    const yesterday = yesterdayDateKey();

    const mealDates = new Set<string>();
    meals.forEach((meal: { loggedAt?: string }) => {
      if (typeof meal.loggedAt === "string") {
        mealDates.add(meal.loggedAt.slice(0, 10));
      }
    });

    const hasToday = mealDates.has(today);
    const hadYesterday = mealDates.has(yesterday);

    if (hasToday && currentStreak.lastLogDate === today) {
      return currentStreak;
    }

    if (hasToday) {
      const newStreak =
        currentStreak.lastLogDate === yesterday || currentStreak.lastLogDate === today
          ? currentStreak.currentStreak + 1
          : 1;

      return {
        currentStreak: newStreak,
        lastLogDate: today,
        longestStreak: Math.max(currentStreak.longestStreak, newStreak),
      };
    }

    if (!hadYesterday && currentStreak.lastLogDate !== today) {
      return {
        currentStreak: 0,
        lastLogDate: currentStreak.lastLogDate,
        longestStreak: currentStreak.longestStreak,
      };
    }

    return currentStreak;
  } catch {
    return currentStreak;
  }
}

export function useUserGoals() {
  const [profile, setProfileState] = useState<UserProfile | null>(null);
  const [goals, setGoalsState] = useState<NutritionGoals>(DEFAULT_GOALS);
  const [streak, setStreakState] = useState<StreakData>({
    currentStreak: 0,
    lastLogDate: "",
    longestStreak: 0,
  });
  const [hasLoaded, setHasLoaded] = useState(false);
  const { user, isLoggedIn } = useAuthContext();

  useEffect(() => {
    const stored = loadStored();
    setProfileState(stored.profile);
    setGoalsState(stored.goals);
    const updatedStreak = computeStreak(stored.streak);
    setStreakState(updatedStreak);
    setHasLoaded(true);
  }, []);

  // Pull from Supabase when user logs in
  useEffect(() => {
    if (!isLoggedIn || !user || !hasLoaded) return;
    pullUserData(user.id).then((cloud) => {
      if (!cloud) return;
      if (cloud.profile) setProfileState(cloud.profile as UserProfile);
      if (cloud.goals) setGoalsState(cloud.goals as NutritionGoals);
      if (cloud.streak) {
        const cloudStreak = cloud.streak as StreakData;
        setStreakState(computeStreak(cloudStreak));
      }
    }).catch(() => {});
  }, [isLoggedIn, user, hasLoaded]);

  useEffect(() => {
    if (!hasLoaded) return;
    const data: StoredData = { profile, goals, streak };
    localStorage.setItem(PROFILE_KEY, JSON.stringify(data));

    // Sync to Supabase
    if (isLoggedIn && user) {
      pushUserData(user.id, "profile", profile);
      pushUserData(user.id, "goals", goals);
      pushUserData(user.id, "streak", streak);
    }
  }, [profile, goals, streak, hasLoaded, isLoggedIn, user]);

  const saveProfile = useCallback(
    (newProfile: UserProfile) => {
      setProfileState(newProfile);
      const computed = calculateGoals(
        newProfile.gender,
        newProfile.weightKg,
        newProfile.heightCm,
        newProfile.age,
        newProfile.activityLevel,
        newProfile.goal
      );
      setGoalsState(computed);
    },
    []
  );

  const updateGoals = useCallback((partial: Partial<NutritionGoals>) => {
    setGoalsState((prev) => ({ ...prev, ...partial, isCustom: true }));
  }, []);

  const refreshStreak = useCallback(() => {
    setStreakState((prev) => computeStreak(prev));
  }, []);

  const resetAll = useCallback(() => {
    setProfileState(null);
    setGoalsState(DEFAULT_GOALS);
    setStreakState({ currentStreak: 0, lastLogDate: "", longestStreak: 0 });
    localStorage.removeItem(PROFILE_KEY);
  }, []);

  return {
    profile,
    goals,
    streak,
    hasProfile: profile !== null,
    hasLoaded,
    saveProfile,
    updateGoals,
    refreshStreak,
    resetAll,
  };
}
