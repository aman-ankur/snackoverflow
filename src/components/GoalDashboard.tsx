"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Flame, Settings2 } from "lucide-react";
import CapyMascot from "@/components/CapyMascot";
import { getCapyState, getGreeting } from "@/lib/capyLines";
import type { MealTotals, NutritionGoals, StreakData } from "@/lib/dishTypes";

interface GoalDashboardProps {
  totals: MealTotals;
  goals: NutritionGoals;
  streak: StreakData;
  mealsCount: number;
  onEditGoals: () => void;
}

function ProgressBar({
  value,
  max,
  colorClass,
  bgClass,
}: {
  value: number;
  max: number;
  colorClass: string;
  bgClass: string;
}) {
  const percent = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className={`h-2.5 w-full rounded-full ${bgClass} overflow-hidden`}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${percent}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className={`h-full rounded-full ${colorClass}`}
      />
    </div>
  );
}

function MacroRow({
  label,
  value,
  max,
  unit,
  colorClass,
  barColorClass,
  barBgClass,
}: {
  label: string;
  value: number;
  max: number;
  unit: string;
  colorClass: string;
  barColorClass: string;
  barBgClass: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className={`text-[10px] font-medium ${colorClass}`}>{label}</span>
        <span className="text-[10px] text-muted">
          {value}/{max}{unit}
        </span>
      </div>
      <ProgressBar value={value} max={max} colorClass={barColorClass} bgClass={barBgClass} />
    </div>
  );
}

export default function GoalDashboard({
  totals,
  goals,
  streak,
  mealsCount,
  onEditGoals,
}: GoalDashboardProps) {
  const greeting = getGreeting();
  const capyState = useMemo(
    () => getCapyState(totals, goals, streak, mealsCount),
    [totals, goals, streak, mealsCount]
  );

  const calPercent = goals.calories > 0 ? Math.min(Math.round((totals.calories / goals.calories) * 100), 999) : 0;
  const calRemaining = Math.max(0, goals.calories - Math.round(totals.calories));

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* Header with greeting + Capy */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted">{greeting}</p>
            <h3 className="text-sm font-bold mt-0.5">Your Daily Progress</h3>
          </div>
          <button
            onClick={onEditGoals}
            className="rounded-full border border-border p-2 text-muted hover:text-foreground hover:bg-card-hover transition-all active:scale-95"
            title="Edit goals"
          >
            <Settings2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Capy + speech bubble */}
      <div className="flex items-center gap-3 px-4 py-2">
        <motion.div
          key={capyState.mood}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", bounce: 0.4 }}
          className="shrink-0"
        >
          <CapyMascot mood={capyState.mood} size={64} />
        </motion.div>
        <motion.div
          key={capyState.line}
          initial={{ x: 10, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="rounded-xl border border-border bg-accent-light px-3 py-2 flex-1"
        >
          <p className="text-xs text-foreground leading-relaxed">{capyState.line}</p>
        </motion.div>
      </div>

      {/* Calorie progress — big bar */}
      <div className="px-4 py-3 space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Flame className="h-3.5 w-3.5 text-orange" />
            <span className="text-xs font-semibold">Calories</span>
          </div>
          <span className="text-xs text-muted">
            <span className="font-semibold text-foreground">{Math.round(totals.calories)}</span>
            <span className="text-muted-light"> / {goals.calories} kcal</span>
          </span>
        </div>
        <ProgressBar
          value={totals.calories}
          max={goals.calories}
          colorClass="bg-gradient-to-r from-orange to-orange-dim"
          bgClass="bg-orange/10"
        />
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-light">{calPercent}% of daily goal</span>
          {calRemaining > 0 && (
            <span className="text-[10px] text-muted-light">{calRemaining} kcal remaining</span>
          )}
        </div>
      </div>

      {/* Macro bars */}
      <div className="px-4 pb-3 space-y-2.5">
        <MacroRow
          label="💪 Protein"
          value={Math.round(totals.protein)}
          max={goals.protein}
          unit="g"
          colorClass="text-accent"
          barColorClass="bg-accent"
          barBgClass="bg-accent/10"
        />
        <MacroRow
          label="🍞 Carbs"
          value={Math.round(totals.carbs)}
          max={goals.carbs}
          unit="g"
          colorClass="text-yellow-400"
          barColorClass="bg-yellow-400"
          barBgClass="bg-yellow-400/10"
        />
        <MacroRow
          label="🧈 Fat"
          value={Math.round(totals.fat)}
          max={goals.fat}
          unit="g"
          colorClass="text-red-400"
          barColorClass="bg-red-400"
          barBgClass="bg-red-400/10"
        />
      </div>

      {/* Streak */}
      {streak.currentStreak > 0 && (
        <div className="mx-4 mb-3 rounded-xl bg-gradient-to-r from-orange/15 to-accent/10 border border-orange/20 px-3 py-2 flex items-center gap-2">
          <Flame className="h-4 w-4 text-orange shrink-0" />
          <p className="text-xs font-semibold text-foreground">
            {streak.currentStreak} Day Streak
            {streak.currentStreak >= 7 && " — Keep Going!"}
            {streak.currentStreak >= 3 && streak.currentStreak < 7 && " — Nice!"}
          </p>
        </div>
      )}

      {/* Meals count */}
      <div className="border-t border-border px-4 py-2 flex items-center justify-between">
        <span className="text-[10px] text-muted">
          {mealsCount} meal{mealsCount === 1 ? "" : "s"} logged today
        </span>
        {streak.longestStreak > streak.currentStreak && (
          <span className="text-[10px] text-muted-light">
            Best: {streak.longestStreak} days
          </span>
        )}
      </div>
    </div>
  );
}
