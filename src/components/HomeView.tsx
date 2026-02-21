"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Flame, Refrigerator, ChevronRight, Plus, Coffee, Sun, Moon, Sunset } from "lucide-react";
import CapyMascot from "@/components/CapyMascot";
import { getCapyState, getGreeting } from "@/lib/capyLines";
import type { LoggedMeal, MealTotals, NutritionGoals, StreakData } from "@/lib/dishTypes";

interface HomeViewProps {
  todayMeals: LoggedMeal[];
  todayTotals: MealTotals;
  goals: NutritionGoals;
  streak: StreakData;
  onOpenFridge: () => void;
  onScanDish: () => void;
  onRemoveMeal: (id: string) => void;
}

const MEAL_ICONS: Record<string, typeof Coffee> = {
  breakfast: Coffee,
  lunch: Sun,
  snack: Sunset,
  dinner: Moon,
};

function CalorieRing({ eaten, goal }: { eaten: number; goal: number }) {
  const percent = goal > 0 ? Math.min((eaten / goal) * 100, 100) : 0;
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center">
      <svg width="140" height="140" viewBox="0 0 140 140" className="-rotate-90">
        {/* Track */}
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth="10"
        />
        {/* Progress */}
        <motion.circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-2xl font-bold text-foreground">{Math.round(eaten)}</span>
        <span className="text-[10px] text-muted">/ {goal} kcal</span>
      </div>
    </div>
  );
}

function MacroPill({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  return (
    <div className="flex-1 rounded-xl bg-card border border-border px-3 py-2.5 text-center">
      <p className="text-[10px] text-muted mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-foreground">
        {Math.round(value)}
        <span className="text-muted font-normal text-xs">/{max}g</span>
      </p>
      <div className="mt-1.5 h-1.5 w-full rounded-full bg-border overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${max > 0 ? Math.min((value / max) * 100, 100) : 0}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

export default function HomeView({
  todayMeals,
  todayTotals,
  goals,
  streak,
  onOpenFridge,
  onScanDish,
  onRemoveMeal,
}: HomeViewProps) {
  const greeting = getGreeting();
  const capyState = useMemo(
    () => getCapyState(todayTotals, goals, streak, todayMeals.length),
    [todayTotals, goals, streak, todayMeals.length]
  );

  const mealsByType = useMemo(() => {
    const grouped: Record<string, LoggedMeal[]> = {
      breakfast: [],
      lunch: [],
      snack: [],
      dinner: [],
    };
    todayMeals.forEach((meal) => {
      if (grouped[meal.mealType]) {
        grouped[meal.mealType].push(meal);
      }
    });
    return grouped;
  }, [todayMeals]);

  return (
    <div className="space-y-4">
      {/* Greeting + Capy */}
      <div className="rounded-2xl bg-card border border-border p-4">
        <div className="flex items-center gap-3">
          <motion.div
            key={capyState.mood}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", bounce: 0.4 }}
            className="shrink-0 animate-breathe"
          >
            <CapyMascot mood={capyState.mood} size={64} />
          </motion.div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted">{greeting}</p>
            <motion.div
              key={capyState.line}
              initial={{ x: 8, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="mt-1 rounded-xl bg-accent-light border border-accent/15 px-3 py-2"
            >
              <p className="text-xs text-foreground leading-relaxed">{capyState.line}</p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Calorie Ring + Macros */}
      <div className="rounded-2xl bg-card border border-border p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">Daily Intake</h3>
          {streak.currentStreak > 0 && (
            <div className="flex items-center gap-1 rounded-full bg-orange-light border border-orange/20 px-2.5 py-1">
              <Flame className="h-3 w-3 text-orange" />
              <span className="text-[10px] font-semibold text-orange">{streak.currentStreak} Day</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-center py-2">
          <CalorieRing eaten={todayTotals.calories} goal={goals.calories} />
        </div>

        <div className="flex gap-2 mt-3">
          <MacroPill label="Carbs" value={todayTotals.carbs} max={goals.carbs} color="var(--color-orange)" />
          <MacroPill label="Protein" value={todayTotals.protein} max={goals.protein} color="var(--color-accent)" />
          <MacroPill label="Fats" value={todayTotals.fat} max={goals.fat} color="#D07A3E" />
        </div>
      </div>

      {/* Today's Meals */}
      <div className="rounded-2xl bg-card border border-border overflow-hidden">
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <h3 className="text-sm font-semibold text-foreground">Today Meals</h3>
          <button
            onClick={onScanDish}
            className="flex items-center gap-1 rounded-full bg-accent-light border border-accent/20 px-2.5 py-1 text-[10px] font-medium text-accent transition-colors hover:bg-accent/15 active:scale-95"
          >
            <Plus className="h-3 w-3" />
            Add
          </button>
        </div>

        <div className="px-4 pb-4 space-y-1">
          {(["breakfast", "lunch", "snack", "dinner"] as const).map((mealType) => {
            const meals = mealsByType[mealType] || [];
            const Icon = MEAL_ICONS[mealType] || Coffee;
            const totalCal = meals.reduce((sum, m) => sum + m.totals.calories, 0);

            return (
              <div key={mealType} className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-card-hover transition-colors">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-light">
                  <Icon className="h-4 w-4 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground capitalize">{mealType}</p>
                  {meals.length > 0 ? (
                    <p className="text-[10px] text-muted truncate">
                      {meals.flatMap((m) => m.dishes.map((d) => d.name)).join(", ")}
                    </p>
                  ) : (
                    <p className="text-[10px] text-muted-light">Not logged yet</p>
                  )}
                </div>
                <div className="text-right">
                  {meals.length > 0 ? (
                    <p className="text-xs font-semibold text-foreground">{totalCal} cal</p>
                  ) : (
                    <button
                      onClick={onScanDish}
                      className="text-[10px] text-accent font-medium"
                    >
                      Add
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Fridge Scanner Card */}
      <button
        onClick={onOpenFridge}
        className="w-full rounded-2xl bg-card border border-border p-4 flex items-center gap-4 text-left transition-colors hover:bg-card-hover active:scale-[0.98]"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-light">
          <Refrigerator className="h-6 w-6 text-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">Scan Your Fridge</p>
          <p className="text-xs text-muted mt-0.5">See what&apos;s inside and get recipe ideas</p>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-light shrink-0" />
      </button>

      {/* Streak Card */}
      {streak.currentStreak >= 3 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-gradient-to-r from-accent-light to-orange-light border border-accent/15 p-4 flex items-center gap-3"
        >
          <div className="animate-breathe">
            <CapyMascot mood="excited" size={48} />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">
              {streak.currentStreak} Day Streak!
            </p>
            <p className="text-xs text-muted mt-0.5">
              {streak.currentStreak >= 7 ? "You're on fire! Keep going!" : "Great consistency!"}
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
