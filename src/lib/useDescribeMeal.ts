"use client";

import { useState, useCallback, useMemo } from "react";
import type {
  DescribeMealResult,
  DescribedDish,
  DishNutrition,
  MealTotals,
  MealType,
} from "@/lib/dishTypes";

const MAX_CHARS = 200;

export interface UseDescribeMealReturn {
  description: string;
  setDescription: (value: string) => void;
  mealType: MealType;
  setMealType: (value: MealType) => void;
  isAnalyzing: boolean;
  error: string | null;
  result: DescribeMealResult | null;
  selectedPortions: Map<number, number>;
  selectPortion: (dishIndex: number, portionIndex: number) => void;
  analyze: () => Promise<void>;
  clear: () => void;
  scaledDishes: DishNutrition[];
  scaledTotals: MealTotals;
  maxChars: number;
}

export function useDescribeMeal(): UseDescribeMealReturn {
  const [description, setDescriptionRaw] = useState("");
  const [mealType, setMealType] = useState<MealType>("lunch");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DescribeMealResult | null>(null);
  const [selectedPortions, setSelectedPortions] = useState<Map<number, number>>(new Map());

  const setDescription = useCallback((value: string) => {
    if (value.length <= MAX_CHARS) {
      setDescriptionRaw(value);
    }
  }, []);

  const selectPortion = useCallback((dishIndex: number, portionIndex: number) => {
    setSelectedPortions((prev) => {
      const next = new Map(prev);
      next.set(dishIndex, Math.min(2, Math.max(0, portionIndex)));
      return next;
    });
  }, []);

  const analyze = useCallback(async () => {
    const trimmed = description.trim();
    if (!trimmed || isAnalyzing) return;

    setIsAnalyzing(true);
    setError(null);
    setResult(null);
    setSelectedPortions(new Map());

    try {
      // Dev mode: return mock data instantly
      const { getDevMode } = await import("@/lib/useDevMode");
      if (getDevMode()) {
        const { MOCK_DESCRIBE_RESULT, DEV_MOCK_DELAY_MS } = await import("@/lib/mockDevData");
        await new Promise((r) => setTimeout(r, DEV_MOCK_DELAY_MS));
        const defaults = new Map<number, number>();
        MOCK_DESCRIBE_RESULT.dishes.forEach((dish, i) => {
          defaults.set(i, dish.defaultIndex ?? 1);
        });
        setResult(MOCK_DESCRIBE_RESULT);
        setSelectedPortions(defaults);
        setIsAnalyzing(false);
        return;
      }

      const res = await fetch("/api/describe-meal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: trimmed, mealType }),
      });

      const data: unknown = await res.json();

      if (!res.ok) {
        const message =
          data && typeof data === "object" && "error" in data && typeof data.error === "string"
            ? data.error
            : "Failed to analyze meal description";
        throw new Error(message);
      }

      const parsed = data as DescribeMealResult;

      if (!parsed.dishes || parsed.dishes.length === 0) {
        throw new Error("Could not identify any food items. Try describing more specifically.");
      }

      // Set default portion selections
      const defaults = new Map<number, number>();
      parsed.dishes.forEach((dish: DescribedDish, i: number) => {
        defaults.set(i, dish.defaultIndex ?? 1);
      });

      setResult(parsed);
      setSelectedPortions(defaults);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to analyze meal description";
      setError(message);
    } finally {
      setIsAnalyzing(false);
    }
  }, [description, mealType, isAnalyzing]);

  const clear = useCallback(() => {
    setResult(null);
    setError(null);
    setSelectedPortions(new Map());
  }, []);

  // Convert DescribedDish + selected portion → DishNutrition (compatible with logMeal)
  const scaledDishes: DishNutrition[] = useMemo(() => {
    if (!result) return [];
    return result.dishes.map((dish, i) => {
      const portionIdx = selectedPortions.get(i) ?? dish.defaultIndex ?? 1;
      const portion = dish.portions[portionIdx] ?? dish.portions[1] ?? dish.portions[0];
      return {
        name: dish.name,
        hindi: dish.hindi,
        portion: portion.label,
        estimated_weight_g: portion.weight_g,
        calories: portion.calories,
        protein_g: portion.protein_g,
        carbs_g: portion.carbs_g,
        fat_g: portion.fat_g,
        fiber_g: portion.fiber_g,
        ingredients: dish.ingredients,
        confidence: dish.confidence,
        tags: dish.tags,
        healthTip: dish.healthTip,
        reasoning: dish.reasoning,
      };
    });
  }, [result, selectedPortions]);

  const scaledTotals: MealTotals = useMemo(() => {
    return scaledDishes.reduce(
      (acc, d) => ({
        calories: acc.calories + d.calories,
        protein: acc.protein + d.protein_g,
        carbs: acc.carbs + d.carbs_g,
        fat: acc.fat + d.fat_g,
        fiber: acc.fiber + d.fiber_g,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
    );
  }, [scaledDishes]);

  return {
    description,
    setDescription,
    mealType,
    setMealType,
    isAnalyzing,
    error,
    result,
    selectedPortions,
    selectPortion,
    analyze,
    clear,
    scaledDishes,
    scaledTotals,
    maxChars: MAX_CHARS,
  };
}
