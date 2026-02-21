"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Clock3, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import type { LoggedMeal } from "@/lib/dishTypes";

interface MealLogProps {
  meals: LoggedMeal[];
  onRemoveMeal: (mealId: string) => void;
  onClearAll: () => void;
}

export default function MealLog({ meals, onRemoveMeal, onClearAll }: MealLogProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <Clock3 className="h-4 w-4 text-accent" />
          <h3 className="text-sm font-semibold">Today&apos;s Meal Log</h3>
          {meals.length > 0 && (
            <span className="rounded-full bg-accent/20 px-2 py-0.5 text-xs font-medium text-accent">
              {meals.length}
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
            className="overflow-hidden border-t border-border"
          >
            <div className="p-3 space-y-2">
              {meals.length === 0 ? (
                <p className="text-xs text-muted py-2 text-center">No meals logged today.</p>
              ) : (
                <>
                  <div className="flex justify-end">
                    <button
                      onClick={onClearAll}
                      className="text-[10px] text-muted-light hover:text-red-400 transition-colors"
                    >
                      Clear all
                    </button>
                  </div>
                  {meals.map((meal) => {
                    const time = new Date(meal.loggedAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    });
                    return (
                      <div
                        key={meal.id}
                        className="rounded-xl border border-border bg-background px-3 py-2"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-[10px] uppercase tracking-wide text-muted-light">
                              {meal.mealType} • {time}
                            </p>
                            <p className="text-xs text-foreground mt-1">
                              {meal.dishes.map((dish) => dish.name).join(" • ")}
                            </p>
                            <p className="text-[10px] text-muted mt-1">
                              {meal.totals.calories} kcal • P {meal.totals.protein}g • C {meal.totals.carbs}g • F {meal.totals.fat}g
                            </p>
                          </div>
                          <button
                            onClick={() => onRemoveMeal(meal.id)}
                            className="rounded-full p-1.5 text-muted-light hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            aria-label="Remove meal"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
