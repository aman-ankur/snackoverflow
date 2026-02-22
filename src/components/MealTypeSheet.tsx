"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, ChevronRight, Clock, Coffee, Sun, Sunset, Moon, Camera, Minus } from "lucide-react";
import type { LoggedMeal, MealType } from "@/lib/dishTypes";

const MEAL_ICONS: Record<MealType, typeof Coffee> = {
  breakfast: Coffee,
  lunch: Sun,
  snack: Sunset,
  dinner: Moon,
};

interface MealTypeSheetProps {
  mealType: MealType;
  meals: LoggedMeal[];
  onClose: () => void;
  onOpenDetail: (mealId: string) => void;
  onRemoveMeal: (mealId: string) => void;
  onRemoveDish: (mealId: string, dishIndex: number) => void;
  onScanDish: () => void;
  refreshStreak: () => void;
}

export default function MealTypeSheet({
  mealType,
  meals,
  onClose,
  onOpenDetail,
  onRemoveMeal,
  onRemoveDish,
  onScanDish,
  refreshStreak,
}: MealTypeSheetProps) {
  const filteredMeals = useMemo(
    () => meals.filter((m) => m.mealType === mealType).sort((a, b) => (a.loggedAt < b.loggedAt ? 1 : -1)),
    [meals, mealType]
  );

  const combinedTotals = useMemo(() => {
    return filteredMeals.reduce(
      (acc, m) => ({
        calories: acc.calories + m.totals.calories,
        protein: acc.protein + m.totals.protein,
        carbs: acc.carbs + m.totals.carbs,
        fat: acc.fat + m.totals.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }, [filteredMeals]);

  const Icon = MEAL_ICONS[mealType];

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[80] bg-black/40"
      />

      {/* Sheet */}
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="fixed inset-x-0 bottom-0 z-[85] max-h-[85vh] overflow-y-auto rounded-t-[20px] bg-card"
      >
        <div className="mx-auto max-w-lg">
          {/* Handle */}
          <div className="flex justify-center pt-2.5 pb-1">
            <div className="h-1 w-9 rounded-full bg-border" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-4 pb-3 pt-1">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-light">
                <Icon className="h-4 w-4 text-accent" />
              </div>
              <h3 className="text-lg font-extrabold text-foreground capitalize">{mealType}</h3>
              {filteredMeals.length > 0 && (
                <span className="rounded-full bg-accent-light border border-accent/20 px-2 py-0.5 text-[10px] font-bold text-accent-dim">
                  {filteredMeals.length} meal{filteredMeals.length === 1 ? "" : "s"}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border hover:bg-card-hover transition-colors active:scale-95"
            >
              <X className="h-4 w-4 text-muted" />
            </button>
          </div>

          {/* Summary line */}
          {filteredMeals.length > 0 && (
            <div className="flex items-center gap-1.5 px-4 pb-3.5 text-[11px] font-semibold text-muted-light">
              <span className="font-bold text-foreground">{Math.round(combinedTotals.calories)}</span> kcal
              <span className="text-border">·</span>
              <span className="font-bold text-foreground">{Math.round(combinedTotals.protein)}</span>g protein
              <span className="text-border">·</span>
              <span className="font-bold text-foreground">{Math.round(combinedTotals.carbs)}</span>g carbs
              <span className="text-border">·</span>
              <span className="font-bold text-foreground">{Math.round(combinedTotals.fat)}</span>g fat
            </div>
          )}

          {/* Meal sections */}
          {filteredMeals.length === 0 ? (
            <div className="px-4 pb-6">
              <div className="rounded-2xl border border-border bg-background py-10 px-6 text-center">
                <p className="text-sm font-semibold text-muted">No {mealType} logged today</p>
                <p className="text-xs text-muted-light mt-1">Scan a dish to get started</p>
                <button
                  onClick={() => { onClose(); onScanDish(); }}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-accent-light border border-accent/20 px-4 py-2 text-xs font-bold text-accent-dim transition-colors hover:bg-accent/15 active:scale-95"
                >
                  <Camera className="h-3.5 w-3.5" />
                  Scan a Dish
                </button>
              </div>
            </div>
          ) : (
            <div className="pb-4">
              {filteredMeals.map((meal) => (
                <MealSection
                  key={meal.id}
                  meal={meal}
                  onOpenDetail={() => onOpenDetail(meal.id)}
                  onRemoveMeal={() => { onRemoveMeal(meal.id); refreshStreak(); }}
                  onRemoveDish={(dishIndex) => { onRemoveDish(meal.id, dishIndex); refreshStreak(); }}
                />
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
}

/* ── Meal section (flat, not boxed) ─────────────────────────────────── */

function MealSection({
  meal,
  onOpenDetail,
  onRemoveMeal,
  onRemoveDish,
}: {
  meal: LoggedMeal;
  onOpenDetail: () => void;
  onRemoveMeal: () => void;
  onRemoveDish: (dishIndex: number) => void;
}) {
  const [confirmDeleteMeal, setConfirmDeleteMeal] = useState(false);
  const [confirmDishIndex, setConfirmDishIndex] = useState<number | null>(null);

  const time = new Date(meal.loggedAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="border-t border-border">
      {/* Time header */}
      <div className="flex items-center px-4 pt-3 pb-1.5">
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-muted-light">
          <Clock className="h-3 w-3 opacity-50" />
          {time}
          <span className="text-border">·</span>
          <span className="text-foreground">{meal.totals.calories} kcal</span>
        </div>
      </div>

      {/* Dish rows */}
      {meal.dishes.map((dish, i) => (
        <div key={`${meal.id}-dish-${i}`}>
          <div
            className={`flex items-center gap-2 py-2 px-4 transition-colors ${
              confirmDishIndex === i ? "bg-red-50" : ""
            }`}
          >
            {/* Minus circle */}
            <button
              onClick={() => setConfirmDishIndex(confirmDishIndex === i ? null : i)}
              className={`flex h-[14px] w-[14px] items-center justify-center rounded-full border-[1.5px] flex-shrink-0 transition-all ${
                confirmDishIndex === i
                  ? "border-red-500 bg-red-500"
                  : "border-red-400 bg-white opacity-40 hover:opacity-100 hover:bg-red-500 hover:border-red-500"
              }`}
            >
              <Minus className={`h-2 w-2 ${confirmDishIndex === i ? "text-white" : "text-red-500"}`}
                style={{ strokeWidth: 3 }}
              />
            </button>

            {/* Dish info */}
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-foreground truncate">{dish.name}</p>
              <p className="text-[10px] text-muted-light">{dish.portion} · {dish.estimated_weight_g}g</p>
            </div>

            {/* Kcal or confirm pills */}
            <AnimatePresence mode="wait">
              {confirmDishIndex === i ? (
                <motion.div
                  key="confirm"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ duration: 0.12 }}
                  className="flex items-center gap-1 shrink-0"
                >
                  <button
                    onClick={() => { onRemoveDish(i); setConfirmDishIndex(null); }}
                    className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
                  >
                    Remove
                  </button>
                  <button
                    onClick={() => setConfirmDishIndex(null)}
                    className="text-[10px] font-bold px-2.5 py-1 rounded-full border border-border bg-white text-muted hover:bg-card-hover transition-colors"
                  >
                    Cancel
                  </button>
                </motion.div>
              ) : (
                <motion.span
                  key="kcal"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-[11px] font-semibold text-muted shrink-0"
                >
                  {dish.calories} kcal
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>
      ))}

      {/* Section footer: Delete meal (left) · Details (right) */}
      <div className="flex items-center justify-between px-4 pt-1.5 pb-3">
        {confirmDeleteMeal ? (
          <div className="flex items-center gap-1">
            <button
              onClick={onRemoveMeal}
              className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
            >
              Confirm
            </button>
            <button
              onClick={() => setConfirmDeleteMeal(false)}
              className="text-[10px] font-bold px-2.5 py-1 rounded-full border border-border bg-white text-muted hover:bg-card-hover transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDeleteMeal(true)}
            className="flex items-center gap-1 text-[10px] font-semibold text-muted-light opacity-50 hover:opacity-100 hover:text-red-500 transition-all"
          >
            <Trash2 className="h-3 w-3" />
            Delete meal
          </button>
        )}
        <button
          onClick={onOpenDetail}
          className="flex items-center gap-1 rounded-full bg-accent-light border border-accent/20 px-3 py-1.5 text-[11px] font-bold text-accent-dim hover:bg-accent/15 transition-colors active:scale-95"
        >
          Details
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
