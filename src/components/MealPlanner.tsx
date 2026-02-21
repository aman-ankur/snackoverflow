"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  Plus,
  X,
  Trash2,
  Copy,
  Check,
  ShoppingCart,
} from "lucide-react";
import type { GeminiRecipe } from "@/lib/useGeminiVision";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const STORAGE_KEY = "fridgenius-meal-plan";

interface MealPlan {
  [day: string]: { name: string; hindi: string; ingredients_needed: string[] }[];
}

interface MealPlannerProps {
  availableRecipes: GeminiRecipe[];
  detectedItemNames: string[];
}

export default function MealPlanner({
  availableRecipes,
  detectedItemNames,
}: MealPlannerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [plan, setPlan] = useState<MealPlan>(() => {
    if (typeof window === "undefined") return {};
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return {};
      const parsed = JSON.parse(stored);
      return parsed && typeof parsed === "object" ? (parsed as MealPlan) : {};
    } catch {
      return {};
    }
  });
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
  }, [plan]);

  const addRecipeToDay = useCallback(
    (day: string, recipe: GeminiRecipe) => {
      setPlan((prev) => {
        const dayMeals = prev[day] || [];
        // Don't add duplicates
        if (dayMeals.some((m) => m.name === recipe.name)) return prev;
        return {
          ...prev,
          [day]: [
            ...dayMeals,
            {
              name: recipe.name,
              hindi: recipe.hindi,
              ingredients_needed: recipe.ingredients_needed || [],
            },
          ],
        };
      });
      setAddingTo(null);
    },
    []
  );

  const removeRecipeFromDay = useCallback((day: string, recipeName: string) => {
    setPlan((prev) => ({
      ...prev,
      [day]: (prev[day] || []).filter((m) => m.name !== recipeName),
    }));
  }, []);

  const clearPlan = useCallback(() => {
    setPlan({});
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Consolidated shopping list for the week
  const weeklyNeeded = new Map<string, string[]>();
  const detectedLower = new Set(detectedItemNames.map((n) => n.toLowerCase()));

  Object.entries(plan).forEach(([day, meals]) => {
    meals.forEach((meal) => {
      meal.ingredients_needed.forEach((ing) => {
        const key = ing.toLowerCase();
        if (detectedLower.has(key)) return;
        const existing = weeklyNeeded.get(key);
        if (existing) {
          if (!existing.includes(`${day}: ${meal.name}`))
            existing.push(`${day}: ${meal.name}`);
        } else {
          weeklyNeeded.set(key, [`${day}: ${meal.name}`]);
        }
      });
    });
  });

  const totalMeals = Object.values(plan).reduce((sum, d) => sum + d.length, 0);

  const handleCopyWeeklyList = async () => {
    const items = Array.from(weeklyNeeded.keys()).map(
      (k) => `• ${k.charAt(0).toUpperCase() + k.slice(1)}`
    );
    const text = `🗓️ Weekly Shopping List\n${items.join("\n")}`;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl bg-card border border-border overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-accent" />
          <h2 className="text-sm font-semibold">Meal Planner</h2>
          {totalMeals > 0 && (
            <span className="rounded-full bg-accent/20 px-2 py-0.5 text-xs font-medium text-accent">
              {totalMeals} meal{totalMeals !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-muted" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 border-t border-border pt-3">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] text-muted-light px-1">
                  Plan meals for the week using scanned recipes
                </p>
                {totalMeals > 0 && (
                  <button
                    onClick={clearPlan}
                    className="flex items-center gap-1 text-[10px] text-muted hover:text-red-400 transition-colors shrink-0"
                  >
                    <Trash2 className="h-3 w-3" />
                    Clear
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {DAYS.map((day) => {
                  const meals = plan[day] || [];
                  return (
                    <div
                      key={day}
                      className="rounded-lg bg-background border border-border px-3 py-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-foreground w-8">
                          {day}
                        </span>
                        <div className="flex items-center gap-1.5 flex-1 ml-2 flex-wrap">
                          {meals.map((meal) => (
                            <span
                              key={meal.name}
                              className="inline-flex items-center gap-1 rounded-full bg-accent/10 border border-accent/20 px-2 py-0.5 text-[10px] font-medium text-accent"
                            >
                              {meal.name}
                              <button
                                onClick={() => removeRecipeFromDay(day, meal.name)}
                                className="opacity-40 hover:opacity-100"
                              >
                                <X className="h-2.5 w-2.5" />
                              </button>
                            </span>
                          ))}
                          {meals.length === 0 && (
                            <span className="text-[10px] text-muted-light">
                              No meals planned
                            </span>
                          )}
                        </div>
                        {availableRecipes.length > 0 && (
                          <button
                            onClick={() =>
                              setAddingTo(addingTo === day ? null : day)
                            }
                            className="ml-2 p-1 rounded-full hover:bg-accent/10 transition-colors shrink-0"
                          >
                            <Plus className="h-3.5 w-3.5 text-muted" />
                          </button>
                        )}
                      </div>

                      {/* Recipe picker dropdown */}
                      <AnimatePresence>
                        {addingTo === day && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="mt-2 space-y-1 overflow-hidden"
                          >
                            {availableRecipes.map((recipe) => (
                              <button
                                key={recipe.name}
                                onClick={() => addRecipeToDay(day, recipe)}
                                disabled={meals.some(
                                  (m) => m.name === recipe.name
                                )}
                                className="flex items-center gap-2 w-full rounded-md bg-card hover:bg-card-hover border border-border px-2.5 py-1.5 text-left transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                              >
                                <span className="text-[10px] font-medium text-foreground truncate">
                                  {recipe.name}
                                </span>
                                <span className="text-[10px] text-muted shrink-0">
                                  {recipe.time}
                                </span>
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>

              {/* Weekly shopping list */}
              {weeklyNeeded.size > 0 && (
                <div className="mt-3 rounded-lg bg-orange/5 border border-orange/15 p-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <ShoppingCart className="h-3.5 w-3.5 text-orange" />
                    <span className="text-xs font-semibold text-orange">
                      Weekly Shopping ({weeklyNeeded.size} items)
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {Array.from(weeklyNeeded.keys()).map((item) => (
                      <span
                        key={item}
                        className="rounded-full bg-orange/10 border border-orange/20 px-2 py-0.5 text-[10px] text-orange"
                      >
                        {item.charAt(0).toUpperCase() + item.slice(1)}
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={handleCopyWeeklyList}
                    className="flex items-center gap-1.5 rounded-full bg-orange/10 border border-orange/20 px-3 py-1.5 text-[10px] font-medium text-orange transition-all hover:bg-orange/20 active:scale-95 w-full justify-center"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3 w-3" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        Copy Weekly List
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
