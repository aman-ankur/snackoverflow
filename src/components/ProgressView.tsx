"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Flame, TrendingUp, Utensils, Link2, History } from "lucide-react";
import CapyMascot from "@/components/CapyMascot";
import type { LoggedMeal, MealTotals, NutritionGoals, StreakData } from "@/lib/dishTypes";

interface ProgressViewProps {
  todayTotals: MealTotals;
  goals: NutritionGoals;
  streak: StreakData;
  meals: LoggedMeal[];
  weeklyByDate: { date: string; totals: MealTotals }[];
  repeatedDishes: { dish: string; count: number }[];
}

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const percent = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="h-2.5 w-full rounded-full bg-border overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${percent}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="h-full rounded-full"
        style={{ backgroundColor: color }}
      />
    </div>
  );
}

function daysAgo(isoDate: string): number {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

export default function ProgressView({
  todayTotals,
  goals,
  streak,
  meals,
  weeklyByDate,
  repeatedDishes,
}: ProgressViewProps) {
  const calPercent = goals.calories > 0 ? Math.min(Math.round((todayTotals.calories / goals.calories) * 100), 100) : 0;

  const weeklyAvgCalories = useMemo(() => {
    if (weeklyByDate.length === 0) return 0;
    const total = weeklyByDate.reduce((sum, d) => sum + d.totals.calories, 0);
    return Math.round(total / weeklyByDate.length);
  }, [weeklyByDate]);

  const maxDayCal = useMemo(() => {
    return Math.max(goals.calories, ...weeklyByDate.map((d) => d.totals.calories), 1);
  }, [weeklyByDate, goals.calories]);

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
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-lg font-extrabold text-foreground">Progress</h2>
        <p className="text-xs text-muted mt-0.5">Track your nutrition journey</p>
      </div>

      {/* Total Progress Card */}
      <div className="rounded-2xl bg-gradient-to-br from-[#E8F5E0] to-white border border-accent/10 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-extrabold text-foreground">Total Progress</h3>
          <div className="rounded-full bg-accent-light border border-accent/20 px-2.5 py-1">
            <span className="text-[10px] font-bold text-accent-dim">{calPercent}%</span>
          </div>
        </div>

        <ProgressBar value={todayTotals.calories} max={goals.calories} color="var(--color-accent)" />

        <p className="text-xs text-muted mt-2 leading-relaxed">
          Balanced meals fuel energy, boost focus, and drive consistent progress by {calPercent}%.
        </p>
      </div>

      {/* Nutrition & Fitness Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-gradient-to-br from-accent-light/40 to-white border border-accent/10 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-light">
              <Flame className="h-3.5 w-3.5 text-accent" />
            </div>
            <span className="text-xs font-extrabold text-foreground">Nutrition</span>
          </div>
          <p className="text-xl font-bold text-foreground">{Math.round(todayTotals.calories)}</p>
          <p className="text-[10px] text-muted">kcal today</p>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-orange-light/40 to-white border border-orange/10 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-light">
              <TrendingUp className="h-3.5 w-3.5 text-orange" />
            </div>
            <span className="text-xs font-extrabold text-foreground">Average</span>
          </div>
          <p className="text-xl font-bold text-foreground">{weeklyAvgCalories}</p>
          <p className="text-[10px] text-muted">kcal / day (7d)</p>
        </div>
      </div>

      {/* Macro Breakdown */}
      <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
        <h3 className="text-sm font-extrabold text-foreground">Today&apos;s Macros</h3>
        <div className="space-y-2.5">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-accent-dim font-bold">Protein</span>
              <span className="text-[10px] text-muted">{Math.round(todayTotals.protein)}/{goals.protein}g</span>
            </div>
            <ProgressBar value={todayTotals.protein} max={goals.protein} color="var(--color-accent)" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-orange font-bold">Carbs</span>
              <span className="text-[10px] text-muted">{Math.round(todayTotals.carbs)}/{goals.carbs}g</span>
            </div>
            <ProgressBar value={todayTotals.carbs} max={goals.carbs} color="var(--color-orange)" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold" style={{ color: "#D87A30" }}>Fat</span>
              <span className="text-[10px] text-muted">{Math.round(todayTotals.fat)}/{goals.fat}g</span>
            </div>
            <ProgressBar value={todayTotals.fat} max={goals.fat} color="#D07A3E" />
          </div>
        </div>
      </div>

      {/* Streak Card */}
      {streak.currentStreak > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl bg-gradient-to-r from-accent-light to-orange-light border border-accent/15 p-4 flex items-center gap-3 overflow-hidden relative"
        >
          <div className="animate-breathe shrink-0">
            <CapyMascot mood="excited" size={56} />
          </div>
          <div>
            <p className="text-lg font-extrabold text-foreground">
              {streak.currentStreak} Day Streak
            </p>
            <p className="text-xs text-muted">
              {streak.currentStreak >= 7
                ? "Keep Going! You're unstoppable!"
                : streak.currentStreak >= 3
                ? "Nice consistency!"
                : "Great start!"}
            </p>
            {streak.longestStreak > streak.currentStreak && (
              <p className="text-[10px] text-muted-light mt-0.5">Best: {streak.longestStreak} days</p>
            )}
          </div>
        </motion.div>
      )}

      {/* Weekly Calorie Chart */}
      <div className="rounded-2xl bg-card border border-border p-4">
        <h3 className="text-sm font-extrabold text-foreground">Weekly Calories</h3>
        {weeklyByDate.length === 0 ? (
          <p className="text-xs text-muted text-center py-4">No data yet. Start logging meals!</p>
        ) : (
          <div className="flex items-end gap-1.5 h-28">
            {weeklyByDate.map((day) => {
              const heightPercent = maxDayCal > 0 ? (day.totals.calories / maxDayCal) * 100 : 0;
              const isOverGoal = day.totals.calories > goals.calories;
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[9px] text-muted">{Math.round(day.totals.calories)}</span>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${heightPercent}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className={`w-full rounded-t-lg min-h-[4px] ${
                      isOverGoal ? "bg-orange" : "bg-accent"
                    }`}
                  />
                  <span className="text-[9px] text-muted-light">{day.date.slice(8)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Patterns */}
      {repeatedDishes.length > 0 && (
        <div className="rounded-2xl bg-card border border-border p-4">
          <div className="flex items-center gap-2 mb-3">
            <Utensils className="h-4 w-4 text-accent" />
            <h3 className="text-sm font-extrabold text-foreground">Patterns</h3>
          </div>
          <div className="space-y-1.5">
            {repeatedDishes.map((item) => (
              <p key={item.dish} className="text-xs text-muted capitalize">
                {item.count}× {item.dish}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Meal History */}
      <div className="rounded-2xl bg-card border border-border overflow-hidden">
        <div className="flex items-center gap-2 px-4 pt-4 pb-2">
          <History className="h-4 w-4 text-accent" />
          <h3 className="text-sm font-extrabold text-foreground">Meal History</h3>
        </div>
        <div className="px-4 pb-4 space-y-2">
          {groupedByDate.length === 0 ? (
            <p className="text-xs text-muted text-center py-4">No meal history yet.</p>
          ) : (
            groupedByDate.slice(0, 7).map(([date, dayMeals]) => (
              <div key={date} className="rounded-xl bg-background border border-border p-3">
                <p className="text-[10px] uppercase tracking-wide text-muted-light mb-2">{date}</p>
                <div className="space-y-1.5">
                  {dayMeals.map((meal) => {
                    const mainDish = meal.dishes[0]?.name || "Meal";
                    const ago = daysAgo(meal.loggedAt);
                    return (
                      <div key={meal.id} className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate">{mainDish}</p>
                          <p className="text-[10px] text-muted">
                            {meal.totals.calories} kcal • P {meal.totals.protein}g • C {meal.totals.carbs}g
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-[10px] text-muted-light">
                            {ago === 0 ? "Today" : `${ago}d ago`}
                          </span>
                          {meal.fridgeLink && meal.fridgeLink.matchedItems.length > 0 && (
                            <div className="flex items-center gap-0.5 mt-0.5">
                              <Link2 className="h-2.5 w-2.5 text-accent" />
                              <span className="text-[9px] text-accent">Fridge</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
