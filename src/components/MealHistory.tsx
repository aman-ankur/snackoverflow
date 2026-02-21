"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { History, ChevronDown, ChevronUp, Link2 } from "lucide-react";
import type { LoggedMeal } from "@/lib/dishTypes";

interface MealHistoryProps {
  meals: LoggedMeal[];
  weeklyByDate: { date: string; totals: { calories: number; protein: number; carbs: number; fat: number; fiber: number } }[];
  repeatedDishes: { dish: string; count: number }[];
}

function daysAgo(isoDate: string): number {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

export default function MealHistory({ meals, weeklyByDate, repeatedDishes }: MealHistoryProps) {
  const [isOpen, setIsOpen] = useState(false);

  const groupedByDate = useMemo(() => {
    const map = new Map<string, LoggedMeal[]>();
    meals.forEach((meal) => {
      const date = meal.loggedAt.slice(0, 10);
      const bucket = map.get(date) || [];
      bucket.push(meal);
      map.set(date, bucket);
    });
    return Array.from(map.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [meals]);

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-orange" />
          <h3 className="text-sm font-semibold">Meal History & Insights</h3>
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
            <div className="p-3 space-y-3">
              <div className="rounded-xl border border-orange/20 bg-orange/5 p-3">
                <p className="text-[10px] uppercase tracking-wide text-muted mb-1">Weekly calories</p>
                <div className="flex flex-wrap gap-1.5">
                  {weeklyByDate.length === 0 ? (
                    <span className="text-xs text-muted">No data yet.</span>
                  ) : (
                    weeklyByDate.map((day) => (
                      <span
                        key={day.date}
                        className="rounded-full border border-orange/20 bg-orange/10 px-2 py-0.5 text-[10px] text-orange"
                      >
                        {day.date.slice(5)}: {Math.round(day.totals.calories)} kcal
                      </span>
                    ))
                  )}
                </div>
              </div>

              {repeatedDishes.length > 0 && (
                <div className="rounded-xl border border-border bg-background p-3">
                  <p className="text-[10px] uppercase tracking-wide text-muted mb-1">Patterns</p>
                  <div className="space-y-1">
                    {repeatedDishes.map((item) => (
                      <p key={item.dish} className="text-xs text-foreground">
                        {item.count} {item.dish} dish{item.count === 1 ? "" : "es"} logged
                      </p>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {groupedByDate.length === 0 ? (
                  <p className="text-xs text-muted text-center py-2">No meal history yet.</p>
                ) : (
                  groupedByDate.map(([date, dayMeals]) => (
                    <div key={date} className="rounded-xl border border-border bg-background p-3">
                      <p className="text-[10px] uppercase tracking-wide text-muted mb-2">{date}</p>
                      <div className="space-y-2">
                        {dayMeals.map((meal) => {
                          const mainDish = meal.dishes[0]?.name || "Meal";
                          const ago = daysAgo(meal.loggedAt);

                          return (
                            <div key={meal.id} className="rounded-lg border border-border px-2.5 py-2">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-xs font-medium text-foreground">{mainDish}</p>
                                <span className="text-[10px] text-muted">
                                  {ago === 0 ? "Today" : `${ago}d ago`}
                                </span>
                              </div>
                              <p className="text-[10px] text-muted mt-1">
                                {meal.totals.calories} kcal • P {meal.totals.protein}g • C {meal.totals.carbs}g • F {meal.totals.fat}g
                              </p>
                              {meal.fridgeLink && meal.fridgeLink.matchedItems.length > 0 && (
                                <div className="mt-1.5 inline-flex items-center gap-1 rounded-full border border-accent/20 bg-accent/10 px-2 py-0.5 text-[10px] text-accent">
                                  <Link2 className="h-2.5 w-2.5" />
                                  Cooked from fridge scan ({meal.fridgeLink.matchedItems.length} match)
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
