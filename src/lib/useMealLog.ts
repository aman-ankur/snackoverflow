"use client";

import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import type { DishNutrition, LoggedMeal, MealTotals, MealType } from "@/lib/dishTypes";
import { useAuthContext } from "@/components/AuthProvider";
import { pullUserData, pushUserData } from "@/lib/supabase/sync";

const STORAGE_KEY = "snackoverflow-meal-log-v1";
const FRIDGE_SCAN_HISTORY_KEY = "snackoverflow-fridge-scan-history";

interface FridgeScanSnapshot {
  scannedAt: string;
  itemNames: string[];
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function toNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return 0;
}

function normalizeDish(raw: unknown): DishNutrition | null {
  if (!isObject(raw)) return null;

  const confidence =
    typeof raw.confidence === "string" && ["high", "medium", "low"].includes(raw.confidence)
      ? (raw.confidence as DishNutrition["confidence"])
      : "medium";

  return {
    name: typeof raw.name === "string" && raw.name.trim() ? raw.name.trim() : "Unknown Dish",
    hindi: typeof raw.hindi === "string" ? raw.hindi : "",
    portion: typeof raw.portion === "string" && raw.portion.trim() ? raw.portion : "1 serving",
    estimated_weight_g: Math.max(0, Math.round(toNumber(raw.estimated_weight_g))),
    calories: Math.max(0, Math.round(toNumber(raw.calories))),
    protein_g: Math.max(0, Math.round(toNumber(raw.protein_g))),
    carbs_g: Math.max(0, Math.round(toNumber(raw.carbs_g))),
    fat_g: Math.max(0, Math.round(toNumber(raw.fat_g))),
    fiber_g: Math.max(0, Math.round(toNumber(raw.fiber_g))),
    ingredients: Array.isArray(raw.ingredients)
      ? raw.ingredients.filter((v): v is string => typeof v === "string")
      : [],
    confidence,
    tags: Array.isArray(raw.tags) ? raw.tags.filter((v): v is string => typeof v === "string") : [],
    healthTip: typeof raw.healthTip === "string" ? raw.healthTip : "",
    reasoning: typeof raw.reasoning === "string" ? raw.reasoning : "",
  };
}

function normalizeMeal(raw: unknown): LoggedMeal | null {
  if (!isObject(raw)) return null;

  const dishes = Array.isArray(raw.dishes)
    ? raw.dishes.map(normalizeDish).filter((d): d is DishNutrition => Boolean(d))
    : [];

  const totalsInput = isObject(raw.totals) ? raw.totals : {};

  const mealTypeRaw = typeof raw.mealType === "string" ? raw.mealType : "lunch";
  const mealType: MealType =
    mealTypeRaw === "breakfast" ||
    mealTypeRaw === "lunch" ||
    mealTypeRaw === "snack" ||
    mealTypeRaw === "dinner"
      ? mealTypeRaw
      : "lunch";

  const fridgeLink = isObject(raw.fridgeLink)
    ? {
        fromScanAt:
          typeof raw.fridgeLink.fromScanAt === "string"
            ? raw.fridgeLink.fromScanAt
            : new Date().toISOString(),
        matchedItems: Array.isArray(raw.fridgeLink.matchedItems)
          ? raw.fridgeLink.matchedItems.filter((item): item is string => typeof item === "string")
          : [],
      }
    : undefined;

  return {
    id: typeof raw.id === "string" && raw.id.trim() ? raw.id : `meal-${Date.now()}`,
    mealType,
    loggedAt:
      typeof raw.loggedAt === "string" && raw.loggedAt.trim()
        ? raw.loggedAt
        : new Date().toISOString(),
    servingsMultiplier: Math.max(0.5, toNumber(raw.servingsMultiplier) || 1),
    dishes,
    totals: {
      calories: Math.max(0, Math.round(toNumber(totalsInput.calories))),
      protein: Math.max(0, Math.round(toNumber(totalsInput.protein))),
      carbs: Math.max(0, Math.round(toNumber(totalsInput.carbs))),
      fat: Math.max(0, Math.round(toNumber(totalsInput.fat))),
      fiber: Math.max(0, Math.round(toNumber(totalsInput.fiber))),
    },
    fridgeLink,
    notes: typeof raw.notes === "string" ? raw.notes : undefined,
  };
}

function sumTotals(meals: LoggedMeal[]): MealTotals {
  return meals.reduce(
    (acc, meal) => ({
      calories: acc.calories + meal.totals.calories,
      protein: acc.protein + meal.totals.protein,
      carbs: acc.carbs + meal.totals.carbs,
      fat: acc.fat + meal.totals.fat,
      fiber: acc.fiber + meal.totals.fiber,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
  );
}

function getDateKey(isoDate: string): string {
  return isoDate.slice(0, 10);
}

function findFridgeLink(dishes: DishNutrition[]): LoggedMeal["fridgeLink"] {
  try {
    const raw = localStorage.getItem(FRIDGE_SCAN_HISTORY_KEY);
    if (!raw) return undefined;

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return undefined;

    const snapshots = parsed.filter(
      (item): item is FridgeScanSnapshot =>
        isObject(item) &&
        typeof item.scannedAt === "string" &&
        Array.isArray(item.itemNames) &&
        item.itemNames.every((name) => typeof name === "string")
    );
    if (snapshots.length === 0) return undefined;

    const latest = snapshots[snapshots.length - 1];
    if (!latest || !Array.isArray(latest.itemNames) || !latest.scannedAt) return undefined;

    const itemSet = new Set(latest.itemNames.map((name) => name.toLowerCase()));
    const matchedItems = new Set<string>();

    dishes.forEach((dish) => {
      dish.ingredients.forEach((ingredient) => {
        if (itemSet.has(ingredient.toLowerCase())) {
          matchedItems.add(ingredient);
        }
      });
    });

    if (matchedItems.size === 0) return undefined;

    return {
      fromScanAt: latest.scannedAt,
      matchedItems: Array.from(matchedItems),
    };
  } catch {
    return undefined;
  }
}

export function useMealLog() {
  const [meals, setMeals] = useState<LoggedMeal[]>(() => {
    if (typeof window === "undefined") return [];

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];

      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) return [];

      return parsed
        .map(normalizeMeal)
        .filter((meal): meal is LoggedMeal => Boolean(meal))
        .sort((a, b) => (a.loggedAt < b.loggedAt ? 1 : -1));
    } catch {
      return [];
    }
  });

  const { user, isLoggedIn } = useAuthContext();
  const hasPulledCloud = useRef(false);

  // Pull from Supabase when user logs in
  useEffect(() => {
    if (!isLoggedIn || !user || hasPulledCloud.current) return;
    hasPulledCloud.current = true;
    pullUserData(user.id).then((cloud) => {
      if (!cloud) return;
      const cloudMeals = cloud.meals;
      if (Array.isArray(cloudMeals) && cloudMeals.length > 0) {
        const normalized = cloudMeals
          .map(normalizeMeal)
          .filter((m): m is LoggedMeal => Boolean(m))
          .sort((a, b) => (a.loggedAt < b.loggedAt ? 1 : -1));
        if (normalized.length > 0) setMeals(normalized);
      }
    }).catch(() => {});
  }, [isLoggedIn, user]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(meals));

    // Sync to Supabase
    if (isLoggedIn && user) {
      pushUserData(user.id, "meals", meals);
    }
  }, [meals, isLoggedIn, user]);

  const logMeal = useCallback(
    (input: {
      mealType: MealType;
      servingsMultiplier: number;
      dishes: DishNutrition[];
      totals: MealTotals;
    }) => {
      const nextMeal: LoggedMeal = {
        id: `meal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        mealType: input.mealType,
        loggedAt: new Date().toISOString(),
        servingsMultiplier: input.servingsMultiplier,
        dishes: input.dishes,
        totals: input.totals,
        fridgeLink: findFridgeLink(input.dishes),
      };

      setMeals((prev) => [nextMeal, ...prev]);
      return nextMeal;
    },
    []
  );

  const removeMeal = useCallback((mealId: string) => {
    setMeals((prev) => prev.filter((meal) => meal.id !== mealId));
  }, []);

  const updateMeal = useCallback(
    (mealId: string, updates: Partial<Pick<LoggedMeal, "mealType" | "servingsMultiplier" | "notes">>) => {
      setMeals((prev) =>
        prev.map((meal) => {
          if (meal.id !== mealId) return meal;
          return { ...meal, ...updates };
        })
      );
    },
    []
  );

  const updateDishInMeal = useCallback(
    (mealId: string, dishIndex: number, updatedDish: DishNutrition) => {
      setMeals((prev) =>
        prev.map((meal) => {
          if (meal.id !== mealId) return meal;
          const newDishes = [...meal.dishes];
          if (dishIndex < 0 || dishIndex >= newDishes.length) return meal;
          newDishes[dishIndex] = updatedDish;
          const totals = newDishes.reduce(
            (acc, d) => ({
              calories: acc.calories + d.calories,
              protein: acc.protein + d.protein_g,
              carbs: acc.carbs + d.carbs_g,
              fat: acc.fat + d.fat_g,
              fiber: acc.fiber + d.fiber_g,
            }),
            { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
          );
          return { ...meal, dishes: newDishes, totals };
        })
      );
    },
    []
  );

  const removeDishFromMeal = useCallback(
    (mealId: string, dishIndex: number) => {
      setMeals((prev) => {
        const result: LoggedMeal[] = [];
        for (const meal of prev) {
          if (meal.id !== mealId) {
            result.push(meal);
            continue;
          }
          const newDishes = meal.dishes.filter((_, i) => i !== dishIndex);
          if (newDishes.length === 0) continue; // remove entire meal
          const totals = newDishes.reduce(
            (acc, d) => ({
              calories: acc.calories + d.calories,
              protein: acc.protein + d.protein_g,
              carbs: acc.carbs + d.carbs_g,
              fat: acc.fat + d.fat_g,
              fiber: acc.fiber + d.fiber_g,
            }),
            { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
          );
          result.push({ ...meal, dishes: newDishes, totals });
        }
        return result;
      });
    },
    []
  );

  const moveMealToType = useCallback(
    (mealId: string, newMealType: MealType) => {
      setMeals((prev) =>
        prev.map((meal) => {
          if (meal.id !== mealId) return meal;
          return { ...meal, mealType: newMealType };
        })
      );
    },
    []
  );

  const clearAllMeals = useCallback(() => {
    setMeals([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const todayDateKey = getDateKey(new Date().toISOString());
  const todayMeals = useMemo(
    () => meals.filter((meal) => getDateKey(meal.loggedAt) === todayDateKey),
    [meals, todayDateKey]
  );

  const todayTotals = useMemo(() => sumTotals(todayMeals), [todayMeals]);

  const weeklyByDate = useMemo(() => {
    const map = new Map<string, MealTotals>();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

    const latestMealTime = meals.reduce((max, meal) => {
      const timestamp = new Date(meal.loggedAt).getTime();
      if (!Number.isFinite(timestamp)) return max;
      return Math.max(max, timestamp);
    }, 0);

    if (!latestMealTime) return [];

    meals.forEach((meal) => {
      const mealTime = new Date(meal.loggedAt).getTime();
      if (!Number.isFinite(mealTime) || latestMealTime - mealTime > sevenDaysMs) return;

      const key = getDateKey(meal.loggedAt);
      const existing = map.get(key) || { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
      map.set(key, {
        calories: existing.calories + meal.totals.calories,
        protein: existing.protein + meal.totals.protein,
        carbs: existing.carbs + meal.totals.carbs,
        fat: existing.fat + meal.totals.fat,
        fiber: existing.fiber + meal.totals.fiber,
      });
    });

    return Array.from(map.entries())
      .map(([date, totals]) => ({ date, totals }))
      .sort((a, b) => (a.date > b.date ? 1 : -1));
  }, [meals]);

  const insights = useMemo(() => {
    const nameCount = new Map<string, number>();

    meals.forEach((meal) => {
      meal.dishes.forEach((dish) => {
        const key = dish.name.toLowerCase();
        nameCount.set(key, (nameCount.get(key) || 0) + 1);
      });
    });

    const repeated = Array.from(nameCount.entries())
      .filter(([, count]) => count > 1)
      .sort((a, b) => b[1] - a[1]);

    return {
      weeklyCalories: weeklyByDate.reduce((sum, item) => sum + item.totals.calories, 0),
      repeatedDishes: repeated.slice(0, 3).map(([dish, count]) => ({ dish, count })),
    };
  }, [meals, weeklyByDate]);

  return {
    meals,
    todayMeals,
    todayTotals,
    weeklyByDate,
    insights,
    logMeal,
    removeMeal,
    updateMeal,
    updateDishInMeal,
    removeDishFromMeal,
    moveMealToType,
    clearAllMeals,
  };
}
