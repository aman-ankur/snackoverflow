"use client";

import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import type { MealTotals, NutritionGoals, StreakData } from "@/lib/dishTypes";
import { useAuthContext } from "@/components/AuthProvider";
import { pullUserData, pushUserData } from "@/lib/supabase/sync";
import { mergeGarden } from "@/lib/supabase/merge";

const STORAGE_KEY = "snackoverflow-garden-v1";
const MEAL_LOG_KEY = "snackoverflow-meal-log-v1";

export interface GardenState {
  flowers: number;
  treeLevel: number;
  pondLevel: number;
  butterflies: number;
  hasRainbow: boolean;
  hasCrown: boolean;
  gardenHealth: number;
  totalMealsLogged: number;
  daysGoalHit: number;
  lastComputedDate: string;
  journal: GardenEvent[];
  // New homestead elements
  babyCapybaras: number;
  homeLevel: number;
}

export interface GardenEvent {
  id: string;
  text: string;
  icon: string;
  date: string;
}

const DEFAULT_STATE: GardenState = {
  flowers: 0,
  treeLevel: 0,
  pondLevel: 0,
  butterflies: 0,
  hasRainbow: false,
  hasCrown: false,
  gardenHealth: 50,
  totalMealsLogged: 0,
  daysGoalHit: 0,
  lastComputedDate: "",
  journal: [],
  babyCapybaras: 0,
  homeLevel: 0,
};

function loadGarden(): GardenState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    return { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_STATE;
  }
}

function saveGarden(state: GardenState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function addEvent(journal: GardenEvent[], text: string, icon: string): GardenEvent[] {
  const event: GardenEvent = {
    id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    text,
    icon,
    date: new Date().toISOString(),
  };
  return [event, ...journal].slice(0, 20);
}

function countMealDates(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(MEAL_LOG_KEY);
    if (!raw) return new Set();
    const meals = JSON.parse(raw);
    if (!Array.isArray(meals)) return new Set();
    const dates = new Set<string>();
    meals.forEach((m: { loggedAt?: string }) => {
      if (typeof m.loggedAt === "string") dates.add(m.loggedAt.slice(0, 10));
    });
    return dates;
  } catch {
    return new Set();
  }
}

/** Sum calories for a specific date from the meal log */
function getCaloriesForDate(date: string): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = localStorage.getItem(MEAL_LOG_KEY);
    if (!raw) return 0;
    const meals = JSON.parse(raw);
    if (!Array.isArray(meals)) return 0;
    let total = 0;
    meals.forEach((m: { loggedAt?: string; calories?: number }) => {
      if (typeof m.loggedAt === "string" && m.loggedAt.slice(0, 10) === date) {
        total += m.calories || 0;
      }
    });
    return total;
  } catch {
    return 0;
  }
}

/** Count how many past days hit the 80-120% calorie goal from the full meal history */
function countAllGoalDays(calorieGoal: number): number {
  if (typeof window === "undefined" || calorieGoal <= 0) return 0;
  try {
    const raw = localStorage.getItem(MEAL_LOG_KEY);
    if (!raw) return 0;
    const meals = JSON.parse(raw);
    if (!Array.isArray(meals)) return 0;
    const dailyTotals = new Map<string, number>();
    meals.forEach((m: { loggedAt?: string; calories?: number }) => {
      if (typeof m.loggedAt === "string") {
        const date = m.loggedAt.slice(0, 10);
        dailyTotals.set(date, (dailyTotals.get(date) || 0) + (m.calories || 0));
      }
    });
    // Don't count today — it's still in progress
    const today = todayKey();
    let count = 0;
    dailyTotals.forEach((cals, date) => {
      if (date === today) return;
      const pct = cals / calorieGoal;
      if (pct >= 0.8 && pct <= 1.2) count++;
    });
    return count;
  } catch {
    return 0;
  }
}

function countTotalMeals(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = localStorage.getItem(MEAL_LOG_KEY);
    if (!raw) return 0;
    const meals = JSON.parse(raw);
    return Array.isArray(meals) ? meals.length : 0;
  } catch {
    return 0;
  }
}

export function computeGarden(
  prev: GardenState,
  streak: StreakData,
  todayTotals: MealTotals,
  goals: NutritionGoals
): GardenState {
  const today = todayKey();
  const totalMeals = countTotalMeals();
  const mealDates = countMealDates();

  let state = { ...prev, totalMealsLogged: totalMeals };
  let journal = [...prev.journal];
  const s = streak.currentStreak;

  // ── Calorie goal days (permanent, never decreases) ──
  // Backfill: scan full history to recover missed goal days (one-time migration)
  let daysGoalHit = prev.daysGoalHit;
  if (goals.calories > 0) {
    const historicalCount = countAllGoalDays(goals.calories);
    if (historicalCount > daysGoalHit) {
      daysGoalHit = historicalCount;
    }
  }

  // ── Milestone 1: 🌱 Sapling — 3-day streak (streak-based, disappears) ──
  // treeLevel: 0 → 1 (streak≥3) → 2 (streak≥14, Forest) → 3 (streak≥30)
  let treeLevel = 0;
  if (s >= 30) treeLevel = 3;
  else if (s >= 14) treeLevel = 2;
  else if (s >= 3) treeLevel = 1;

  if (treeLevel > 0 && prev.treeLevel === 0) {
    journal = addEvent(journal, "A sapling sprouted in your garden!", "�");
  }
  if (treeLevel >= 2 && prev.treeLevel < 2) {
    journal = addEvent(journal, "Your garden has grown into a forest!", "🌲");
  }

  // ── Milestone 2: 🌸 First Flower — 3 calorie goal days (permanent) ──
  // flowers: min(daysGoalHit, 30)
  const newFlowers = Math.min(daysGoalHit, 30);
  if (newFlowers > prev.flowers && newFlowers >= 3 && prev.flowers < 3) {
    journal = addEvent(journal, "Flowers are blooming in your garden!", "🌸");
  } else if (newFlowers > prev.flowers) {
    journal = addEvent(journal, "A new flower bloomed!", "🌸");
  }

  // ── Milestone 3: 🦋 Butterfly — 5-day streak (streak-based, disappears) ──
  // butterflies: streak≥5 → scale up, max 5
  const butterflies = s >= 5 ? Math.min(Math.floor((s - 3) / 2), 5) : 0;
  if (butterflies > 0 && prev.butterflies === 0) {
    journal = addEvent(journal, "Butterflies arrived in your garden!", "🦋");
  }

  // ── Milestone 4: 🐾 Baby Capy — 7 calorie goal days (permanent) ──
  let babyCapybaras = 0;
  if (daysGoalHit >= 20) babyCapybaras = 3;
  else if (daysGoalHit >= 12) babyCapybaras = 2;
  else if (daysGoalHit >= 7) babyCapybaras = 1;

  if (babyCapybaras > prev.babyCapybaras) {
    const babyNames = ["", "A baby capybara joined the family!", "Another baby capybara appeared!", "The capybara family is complete!"];
    journal = addEvent(journal, babyNames[babyCapybaras] || "New baby!", "🐾");
  }

  // ── Milestone 5: 🌲 Forest — 14-day streak (streak-based, disappears) ──
  // Rainbow appears as visual bonus with Forest
  const hasRainbow = s >= 14;
  if (hasRainbow && !prev.hasRainbow) {
    journal = addEvent(journal, "A rainbow appeared over your forest!", "🌈");
  }

  // ── Milestone 6: 🏡 Cozy Home — 15 calorie goal days (permanent) ──
  let homeLevel = 0;
  if (daysGoalHit >= 25) homeLevel = 3;
  else if (daysGoalHit >= 20) homeLevel = 2;
  else if (daysGoalHit >= 15) homeLevel = 1;

  if (homeLevel > prev.homeLevel) {
    const homeNames = ["", "A small shelter appeared in the garden!", "The cabin is growing cozier!", "A beautiful home with a chimney!"];
    journal = addEvent(journal, homeNames[homeLevel] || "Home upgraded!", "🏡");
  }

  // ── Milestone 7: ♨️ Hot Spring — 30-day streak (streak-based, disappears) ──
  const hasCrown = s >= 30;
  if (hasCrown && !prev.hasCrown) {
    journal = addEvent(journal, "A hot spring appeared — paradise unlocked!", "♨️");
  }

  // ── Milestone 8: 🌻 Full Garden — 30 calorie goal days (permanent) ──
  if (daysGoalHit >= 30 && prev.daysGoalHit < 30) {
    journal = addEvent(journal, "Your garden is complete — nutrition mastery!", "�");
  }

  // Keep pondLevel for backward compat
  const pondLevel = homeLevel;

  // ── Garden health: composite score 0-100 ──
  let health = 50;
  if (s >= 1) health += 10;
  if (s >= 3) health += 10;   // Sapling
  if (s >= 7) health += 10;
  if (s >= 14) health += 5;   // Forest
  if (s >= 30) health += 5;   // Hot Spring
  if (daysGoalHit >= 3) health += 5;  // First Flower
  if (daysGoalHit >= 15) health += 5; // Cozy Home

  // Wilting: missed days reduce health
  if (s === 0 && prev.gardenHealth > 0) {
    health = Math.max(10, prev.gardenHealth - 15);
    if (health < prev.gardenHealth && prev.lastComputedDate !== today) {
      journal = addEvent(journal, "Your garden is wilting... log a meal to help!", "🥀");
    }
  }

  health = Math.min(100, Math.max(0, health));

  state = {
    ...state,
    flowers: newFlowers,
    treeLevel,
    pondLevel,
    butterflies,
    hasRainbow,
    hasCrown,
    gardenHealth: health,
    daysGoalHit,
    lastComputedDate: today,
    journal,
    babyCapybaras,
    homeLevel,
  };

  return state;
}

export interface NextUnlock {
  label: string;
  icon: string;
  current: number;
  target: number;
}

// Follows the 8-milestone order exactly
export function getNextUnlock(state: GardenState, streak: StreakData): NextUnlock | null {
  const s = streak.currentStreak;
  const g = state.daysGoalHit;

  // 1. 🌱 Sapling — 3-day streak
  if (s < 3) return { label: "Sapling", icon: "🌱", current: s, target: 3 };
  // 2. 🌸 First Flower — 3 calorie goal days
  if (g < 3) return { label: "First Flower", icon: "🌸", current: g, target: 3 };
  // 3. 🦋 Butterfly — 5-day streak
  if (s < 5) return { label: "Butterfly", icon: "🦋", current: s, target: 5 };
  // 4. 🐾 Baby Capy — 7 calorie goal days
  if (g < 7) return { label: "Baby Capy", icon: "🐾", current: g, target: 7 };
  // 5. 🌲 Forest — 14-day streak
  if (s < 14) return { label: "Forest", icon: "�", current: s, target: 14 };
  // 6. 🏡 Cozy Home — 15 calorie goal days
  if (g < 15) return { label: "Cozy Home", icon: "🏡", current: g, target: 15 };
  // 7. ♨️ Hot Spring — 30-day streak
  if (s < 30) return { label: "Hot Spring", icon: "♨️", current: s, target: 30 };
  // 8. 🌻 Full Garden — 30 calorie goal days
  if (g < 30) return { label: "Full Garden", icon: "�", current: g, target: 30 };

  return null; // All milestones unlocked!
}

export function useGardenState(
  streak: StreakData,
  todayTotals: MealTotals,
  goals: NutritionGoals
) {
  const [garden, setGarden] = useState<GardenState>(DEFAULT_STATE);
  const [hasLoaded, setHasLoaded] = useState(false);
  const { user, isLoggedIn } = useAuthContext();
  const hasPulledCloud = useRef(false);

  useEffect(() => {
    setGarden(loadGarden());
    setHasLoaded(true);
  }, []);

  // Pull from Supabase when user logs in
  useEffect(() => {
    if (!isLoggedIn || !user || !hasLoaded || hasPulledCloud.current) return;
    hasPulledCloud.current = true;
    pullUserData(user.id).then((cloud) => {
      if (!cloud || !cloud.garden) return;
      const cloudGarden = { ...DEFAULT_STATE, ...(cloud.garden as Partial<GardenState>) };
      setGarden((local) => mergeGarden(local, cloudGarden));
    }).catch(() => {});
  }, [isLoggedIn, user, hasLoaded]);

  useEffect(() => {
    if (!hasLoaded) return;
    const updated = computeGarden(garden, streak, todayTotals, goals);
    if (JSON.stringify(updated) !== JSON.stringify(garden)) {
      setGarden(updated);
      saveGarden(updated);

      // Sync to Supabase
      if (isLoggedIn && user) {
        pushUserData(user.id, "garden", updated);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasLoaded, streak.currentStreak, todayTotals.calories, todayTotals.protein]);

  const nextUnlock = useMemo(() => getNextUnlock(garden, streak), [garden, streak]);

  const refresh = useCallback(() => {
    const updated = computeGarden(garden, streak, todayTotals, goals);
    setGarden(updated);
    saveGarden(updated);

    if (isLoggedIn && user) {
      pushUserData(user.id, "garden", updated);
    }
  }, [garden, streak, todayTotals, goals, isLoggedIn, user]);

  return { garden, nextUnlock, hasLoaded, refresh };
}
