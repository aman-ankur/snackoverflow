"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { MealTotals, NutritionGoals, StreakData } from "@/lib/dishTypes";

const STORAGE_KEY = "fridgenius-garden-v1";
const MEAL_LOG_KEY = "fridgenius-meal-log-v1";

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

  // Count days where calorie goal was approximately hit (within 80-120%)
  let daysGoalHit = 0;
  if (goals.calories > 0) {
    // Simple heuristic: count dates with meals logged as potential goal-hit days
    // For a more accurate count we'd need per-day totals, but this is a reasonable proxy
    daysGoalHit = Math.min(mealDates.size, prev.daysGoalHit);

    // Check if today's totals hit the goal
    const todayPercent = todayTotals.calories / goals.calories;
    if (todayPercent >= 0.8 && todayPercent <= 1.2) {
      if (prev.lastComputedDate !== today) {
        daysGoalHit = prev.daysGoalHit + 1;
      }
    }
  }

  // Flowers: based on days goal hit (max 30)
  const newFlowers = Math.min(daysGoalHit, 30);
  if (newFlowers > prev.flowers && prev.lastComputedDate !== today) {
    journal = addEvent(journal, "A new flower bloomed in your garden!", "🌸");
  }

  // Tree level: based on protein goal hits
  const proteinPercent = goals.protein > 0 ? todayTotals.protein / goals.protein : 0;
  let treeLevel = prev.treeLevel;
  if (proteinPercent >= 0.9 && prev.lastComputedDate !== today) {
    treeLevel = Math.min(prev.treeLevel + 1, 4);
    if (treeLevel > prev.treeLevel) {
      const treeNames = ["", "Sapling planted!", "Tree is growing!", "Tree is getting tall!", "Tree is fully grown!"];
      journal = addEvent(journal, treeNames[treeLevel] || "Tree grew!", "🌳");
    }
  }

  // Pond: based on streak (7+ days)
  let pondLevel = 0;
  if (streak.currentStreak >= 21) pondLevel = 3;
  else if (streak.currentStreak >= 14) pondLevel = 2;
  else if (streak.currentStreak >= 7) pondLevel = 1;

  if (pondLevel > prev.pondLevel) {
    const pondNames = ["", "A pond appeared in your garden!", "The pond is filling up!", "Fish are swimming in your pond!"];
    journal = addEvent(journal, pondNames[pondLevel] || "Pond grew!", "🌊");
  }

  // Butterflies: based on streak (3+ days, max 5)
  const butterflies = Math.min(Math.max(0, Math.floor((streak.currentStreak - 1) / 2)), 5);
  if (butterflies > prev.butterflies) {
    journal = addEvent(journal, "A butterfly arrived in your garden!", "🦋");
  }

  // Rainbow: 14+ day streak
  const hasRainbow = streak.currentStreak >= 14;
  if (hasRainbow && !prev.hasRainbow) {
    journal = addEvent(journal, "A rainbow appeared over your garden!", "🌈");
  }

  // Crown: 30+ day streak
  const hasCrown = streak.currentStreak >= 30;
  if (hasCrown && !prev.hasCrown) {
    journal = addEvent(journal, "Capy earned a golden crown!", "👑");
  }

  // Garden health: composite score 0-100
  let health = 50;
  if (streak.currentStreak >= 1) health += 10;
  if (streak.currentStreak >= 3) health += 10;
  if (streak.currentStreak >= 7) health += 10;
  if (newFlowers >= 5) health += 5;
  if (newFlowers >= 15) health += 5;
  if (treeLevel >= 2) health += 5;
  if (pondLevel >= 1) health += 5;

  // Wilting: missed days reduce health
  if (streak.currentStreak === 0 && prev.gardenHealth > 0) {
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
  };

  return state;
}

export interface NextUnlock {
  label: string;
  icon: string;
  current: number;
  target: number;
}

export function getNextUnlock(state: GardenState, streak: StreakData): NextUnlock | null {
  if (!state.hasCrown && streak.currentStreak < 30) {
    if (!state.hasRainbow && streak.currentStreak < 14) {
      if (state.pondLevel < 1 && streak.currentStreak < 7) {
        if (state.butterflies < 1 && streak.currentStreak < 3) {
          return { label: "First Butterfly", icon: "🦋", current: streak.currentStreak, target: 3 };
        }
        return { label: "Pond Appears", icon: "🌊", current: streak.currentStreak, target: 7 };
      }
      return { label: "Rainbow Arc", icon: "🌈", current: streak.currentStreak, target: 14 };
    }
    return { label: "Golden Crown", icon: "👑", current: streak.currentStreak, target: 30 };
  }
  if (state.flowers < 30) {
    return { label: "Full Garden (30 flowers)", icon: "🌸", current: state.flowers, target: 30 };
  }
  if (state.treeLevel < 4) {
    return { label: "Max Tree Growth", icon: "🌳", current: state.treeLevel, target: 4 };
  }
  return null;
}

export function useGardenState(
  streak: StreakData,
  todayTotals: MealTotals,
  goals: NutritionGoals
) {
  const [garden, setGarden] = useState<GardenState>(DEFAULT_STATE);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    setGarden(loadGarden());
    setHasLoaded(true);
  }, []);

  useEffect(() => {
    if (!hasLoaded) return;
    const updated = computeGarden(garden, streak, todayTotals, goals);
    if (JSON.stringify(updated) !== JSON.stringify(garden)) {
      setGarden(updated);
      saveGarden(updated);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasLoaded, streak.currentStreak, todayTotals.calories, todayTotals.protein]);

  const nextUnlock = useMemo(() => getNextUnlock(garden, streak), [garden, streak]);

  const refresh = useCallback(() => {
    const updated = computeGarden(garden, streak, todayTotals, goals);
    setGarden(updated);
    saveGarden(updated);
  }, [garden, streak, todayTotals, goals]);

  return { garden, nextUnlock, hasLoaded, refresh };
}
