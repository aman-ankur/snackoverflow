"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, ChevronRight, Coffee, Sun, Sunset, Moon, Camera } from "lucide-react";
import type { LoggedMeal, MealType, DishNutrition } from "@/lib/dishTypes";

const MEAL_ICONS: Record<MealType, typeof Coffee> = {
  breakfast: Coffee,
  lunch: Sun,
  snack: Sunset,
  dinner: Moon,
};

const MEAL_EMOJI: Record<MealType, string> = {
  breakfast: "☕",
  lunch: "☀️",
  snack: "🌅",
  dinner: "🌙",
};

const SERVING_OPTIONS = [0.5, 1, 1.5, 2];
const MEAL_TYPE_OPTIONS: MealType[] = ["breakfast", "lunch", "snack", "dinner"];

interface MealTypeSheetProps {
  mealType: MealType;
  meals: LoggedMeal[];
  onClose: () => void;
  onOpenDetail: (mealId: string) => void;
  onRemoveMeal: (mealId: string) => void;
  onUpdateMeal: (mealId: string, updates: Partial<Pick<LoggedMeal, "mealType" | "servingsMultiplier" | "notes">>) => void;
  onMoveMealToType: (mealId: string, newMealType: MealType) => void;
  onScanDish: () => void;
  refreshStreak: () => void;
}

export default function MealTypeSheet({
  mealType,
  meals,
  onClose,
  onOpenDetail,
  onRemoveMeal,
  onUpdateMeal,
  onMoveMealToType,
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

          {/* Summary pills */}
          {filteredMeals.length > 0 && (
            <div className="flex gap-2 px-4 pb-4">
              <SummaryPill emoji="🔥" value={combinedTotals.calories} unit="kcal" />
              <SummaryPill emoji="💪" value={combinedTotals.protein} unit="g protein" />
              <SummaryPill emoji="🍞" value={combinedTotals.carbs} unit="g carbs" />
              <SummaryPill emoji="🧈" value={combinedTotals.fat} unit="g fat" />
            </div>
          )}

          {/* Meal cards */}
          <div className="px-4 pb-6 space-y-3">
            {filteredMeals.length === 0 ? (
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
            ) : (
              filteredMeals.map((meal, index) => (
                <MealCard
                  key={meal.id}
                  meal={meal}
                  index={filteredMeals.length - index}
                  mealType={mealType}
                  onOpenDetail={() => onOpenDetail(meal.id)}
                  onRemove={() => { onRemoveMeal(meal.id); refreshStreak(); }}
                  onUpdateMeal={onUpdateMeal}
                  onMoveMealToType={(newType) => { onMoveMealToType(meal.id, newType); refreshStreak(); }}
                  refreshStreak={refreshStreak}
                />
              ))
            )}
          </div>
        </div>
      </motion.div>
    </>
  );
}

function SummaryPill({ emoji, value, unit }: { emoji: string; value: number; unit: string }) {
  return (
    <div className="flex-1 rounded-xl border border-border bg-background px-2 py-2 text-center">
      <span className="block text-sm font-bold text-foreground">{emoji} {Math.round(value)}</span>
      <span className="text-[9px] text-muted">{unit}</span>
    </div>
  );
}

function MealCard({
  meal,
  index,
  mealType,
  onOpenDetail,
  onRemove,
  onUpdateMeal,
  onMoveMealToType,
  refreshStreak,
}: {
  meal: LoggedMeal;
  index: number;
  mealType: MealType;
  onOpenDetail: () => void;
  onRemove: () => void;
  onUpdateMeal: (mealId: string, updates: Partial<Pick<LoggedMeal, "mealType" | "servingsMultiplier" | "notes">>) => void;
  onMoveMealToType: (newType: MealType) => void;
  refreshStreak: () => void;
}) {
  const [showPortionPicker, setShowPortionPicker] = useState(false);
  const [showMealTypePicker, setShowMealTypePicker] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const time = new Date(meal.loggedAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const handlePortionChange = (value: number) => {
    const ratio = value / meal.servingsMultiplier;
    const newDishes = meal.dishes.map((d) => ({
      ...d,
      calories: Math.round(d.calories * ratio),
      protein_g: Math.round(d.protein_g * ratio),
      carbs_g: Math.round(d.carbs_g * ratio),
      fat_g: Math.round(d.fat_g * ratio),
      fiber_g: Math.round(d.fiber_g * ratio),
      estimated_weight_g: Math.round(d.estimated_weight_g * ratio),
    }));
    const newTotals = newDishes.reduce(
      (acc, d) => ({
        calories: acc.calories + d.calories,
        protein: acc.protein + d.protein_g,
        carbs: acc.carbs + d.carbs_g,
        fat: acc.fat + d.fat_g,
        fiber: acc.fiber + d.fiber_g,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
    );
    onUpdateMeal(meal.id, { servingsMultiplier: value });
    refreshStreak();
    setShowPortionPicker(false);
  };

  return (
    <div className="rounded-2xl border border-border bg-background overflow-hidden">
      {/* Card header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <div>
          <p className="text-xs font-bold text-foreground capitalize">
            {mealType} #{index}
          </p>
          <p className="text-[10px] text-muted">
            {time} · {meal.servingsMultiplier}x serving
          </p>
        </div>
        <span className="text-sm font-bold text-foreground">{meal.totals.calories} kcal</span>
      </div>

      {/* Dish rows */}
      <div className="px-4 pb-2">
        {meal.dishes.map((dish, i) => (
          <div key={`${meal.id}-dish-${i}`} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-b-0">
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-foreground truncate">{dish.name}</p>
              <p className="text-[10px] text-muted-light">{dish.portion} · {dish.estimated_weight_g}g</p>
            </div>
            <span className="text-[11px] text-muted shrink-0 ml-2">{dish.calories} kcal</span>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="flex items-center gap-1.5 px-3 py-2.5 border-t border-border/50 bg-card/50">
        {/* Portion */}
        <button
          onClick={() => { setShowPortionPicker(!showPortionPicker); setShowMealTypePicker(false); }}
          className={`text-[10px] font-bold px-2.5 py-1.5 rounded-full border flex items-center gap-1 transition-colors ${
            showPortionPicker
              ? "border-accent/30 bg-accent-light text-accent-dim"
              : "border-border bg-background text-muted hover:bg-card-hover"
          }`}
        >
          {meal.servingsMultiplier}x ▾
        </button>

        {/* Meal type */}
        <button
          onClick={() => { setShowMealTypePicker(!showMealTypePicker); setShowPortionPicker(false); }}
          className={`text-[10px] font-bold px-2.5 py-1.5 rounded-full border flex items-center gap-1 transition-colors capitalize ${
            showMealTypePicker
              ? "border-orange/30 bg-orange-light text-orange"
              : "border-border bg-background text-muted hover:bg-card-hover"
          }`}
        >
          {MEAL_EMOJI[meal.mealType]} {meal.mealType} ▾
        </button>

        {/* Delete */}
        {confirmDelete ? (
          <div className="flex items-center gap-1 ml-auto">
            <button
              onClick={onRemove}
              className="text-[10px] font-bold px-2.5 py-1.5 rounded-full border border-red-200 bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
            >
              Confirm
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="text-[10px] font-bold px-2.5 py-1.5 rounded-full border border-border bg-background text-muted hover:bg-card-hover transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="text-[10px] font-bold px-2.5 py-1.5 rounded-full border border-red-200 bg-red-50 text-red-500 hover:bg-red-100 transition-colors flex items-center gap-1"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        )}

        {/* Details */}
        <button
          onClick={onOpenDetail}
          className="text-[10px] font-bold px-2.5 py-1.5 rounded-full border border-accent/20 bg-accent-light text-accent-dim hover:bg-accent/15 transition-colors flex items-center gap-1 ml-auto"
        >
          Details <ChevronRight className="h-3 w-3" />
        </button>
      </div>

      {/* Portion picker */}
      <AnimatePresence>
        {showPortionPicker && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-border/50"
          >
            <div className="flex gap-1.5 px-3 py-2.5">
              {SERVING_OPTIONS.map((val) => (
                <button
                  key={val}
                  onClick={() => handlePortionChange(val)}
                  className={`flex-1 rounded-full border px-2 py-1.5 text-[10px] font-bold transition-colors ${
                    meal.servingsMultiplier === val
                      ? "border-accent/30 bg-accent-light text-accent-dim"
                      : "border-border bg-background text-muted hover:bg-card-hover"
                  }`}
                >
                  {val}x
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Meal type picker */}
      <AnimatePresence>
        {showMealTypePicker && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-border/50"
          >
            <div className="flex gap-1.5 px-3 py-2.5">
              {MEAL_TYPE_OPTIONS.map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    if (type !== meal.mealType) onMoveMealToType(type);
                    setShowMealTypePicker(false);
                  }}
                  className={`flex-1 rounded-full border px-2 py-1.5 text-[10px] font-bold capitalize transition-colors ${
                    meal.mealType === type
                      ? "border-orange/30 bg-orange-light text-orange"
                      : "border-border bg-background text-muted hover:bg-card-hover"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
