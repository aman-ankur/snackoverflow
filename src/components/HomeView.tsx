"use client";

import { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Flame, Refrigerator, ChevronRight, Plus, Coffee, Sun, Moon, Sunset, ShieldCheck, CheckCircle2, AlertTriangle, Circle, Brain } from "lucide-react";
import { getMealHealthRating, type HealthRating } from "@/lib/healthRating";
import CapyMascot from "@/components/CapyMascot";
import CapyLottie from "@/components/CapyLottie";
import WhatsNewCard from "@/components/WhatsNewCard";
import QuickInsightCard from "@/components/QuickInsight";
import CoachMark from "@/components/CoachMark";
import { getCapyState, getGreeting } from "@/lib/capyLines";
import { getQuickInsight } from "@/lib/quickInsights";
import type { LoggedMeal, MealTotals, NutritionGoals, StreakData, EatingAnalysis, AnalysisScore } from "@/lib/dishTypes";
import type { CoachMarkId } from "@/lib/useCoachMarks";

interface HomeViewProps {
  todayMeals: LoggedMeal[];
  todayTotals: MealTotals;
  goals: NutritionGoals;
  streak: StreakData;
  userName?: string;
  onOpenFridge: () => void;
  onScanDish: () => void;
  onRemoveMeal: (id: string) => void;
  onMealTypeClick: (mealType: "breakfast" | "lunch" | "snack" | "dinner") => void;
  onWhatsNewTryIt: () => void;
  coachMarks: { shouldShow: (id: CoachMarkId) => boolean; dismiss: (id: CoachMarkId) => void };
  latestAnalysis: EatingAnalysis | null;
  onViewAnalysis: () => void;
}

const MEAL_ICONS: Record<string, typeof Coffee> = {
  breakfast: Coffee,
  lunch: Sun,
  snack: Sunset,
  dinner: Moon,
};

const HEALTH_ICONS: Record<HealthRating, typeof ShieldCheck> = {
  healthy: ShieldCheck,
  balanced: CheckCircle2,
  moderate: Circle,
  heavy: AlertTriangle,
};

function CalorieRing({ eaten, goal }: { eaten: number; goal: number }) {
  const rawPercent = goal > 0 ? (eaten / goal) * 100 : 0;
  const percent = Math.min(rawPercent, 100);
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  // Color changes based on overflow
  const strokeColor =
    rawPercent > 110 ? "#E05050" : rawPercent > 100 ? "#F0A030" : "var(--color-accent)";

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
          stroke={strokeColor}
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
  const tintMap: Record<string, string> = {
    Carbs: "bg-orange-light/60",
    Protein: "bg-accent-light/60",
    Fats: "bg-[#FFF0E0]/60",
  };
  return (
    <div className={`flex-1 rounded-xl border border-border px-3 py-2.5 text-center ${tintMap[label] || "bg-card"}`}>
      <p className="text-[10px] font-semibold text-muted mb-0.5">{label}</p>
      <p className="text-sm font-bold text-foreground">
        {Math.round(value)}
        <span className="text-muted font-medium text-xs">/{max}g</span>
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

const SCORE_LABELS: Record<AnalysisScore, { label: string; color: string }> = {
  great: { label: "Great", color: "text-accent" },
  good: { label: "Good", color: "text-accent-dim" },
  needs_work: { label: "Needs Work", color: "text-orange" },
  concerning: { label: "Concerning", color: "text-red-600" },
};

export default function HomeView({
  todayMeals,
  todayTotals,
  goals,
  streak,
  userName,
  onOpenFridge,
  onScanDish,
  onRemoveMeal,
  onMealTypeClick,
  onWhatsNewTryIt,
  coachMarks,
  latestAnalysis,
  onViewAnalysis,
}: HomeViewProps) {
  const greeting = getGreeting(userName);
  const capyState = useMemo(
    () => getCapyState(todayTotals, goals, streak, todayMeals.length, userName),
    [todayTotals, goals, streak, todayMeals.length, userName]
  );

  const quickInsight = useMemo(
    () => getQuickInsight(todayTotals, goals, streak, todayMeals),
    [todayTotals, goals, streak, todayMeals]
  );

  // Track WhatsNewCard dismissed state for QuickInsight visibility
  const [whatsNewDismissed, setWhatsNewDismissed] = useState(false);
  useEffect(() => {
    try {
      const seen = localStorage.getItem("snackoverflow-whats-new-seen");
      setWhatsNewDismissed(seen === "v1");
    } catch {
      setWhatsNewDismissed(false);
    }
  }, []);

  const calRemaining = Math.round(goals.calories - todayTotals.calories);
  const calPercent = goals.calories > 0 ? Math.min((todayTotals.calories / goals.calories) * 100, 100) : 0;
  const isOverGoal = calRemaining < 0;

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
      {/* Clean Row Header */}
      <div className="px-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <CapyMascot mood={capyState.mood} size={72} animate={false} randomize />
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-extrabold text-foreground">{greeting}</p>
                {streak.currentStreak > 0 && (
                  <div className="flex items-center gap-0.5 rounded-full bg-orange-light border border-orange/20 px-2 py-0.5">
                    <Flame className="h-3 w-3 text-orange" />
                    <span className="text-[10px] font-bold text-orange">{streak.currentStreak}</span>
                  </div>
                )}
              </div>
              <p className="text-[11px] text-muted mt-0.5 leading-snug max-w-[200px] truncate">{capyState.line}</p>
            </div>
          </div>
          <div className="text-right">
            <p className={`text-lg font-bold ${isOverGoal ? "text-red-500" : "text-foreground"}`}>{isOverGoal ? Math.abs(calRemaining) : calRemaining}</p>
            <p className={`text-[10px] -mt-0.5 ${isOverGoal ? "text-red-500" : "text-muted"}`}>{isOverGoal ? "kcal over" : "kcal left"}</p>
            <div className="mt-1 h-1.5 w-20 rounded-full bg-border overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${isOverGoal ? "bg-red-500" : "bg-accent"}`}
                initial={{ width: 0 }}
                animate={{ width: `${calPercent}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* What's New (dismissable) */}
      <WhatsNewCard onTryIt={onWhatsNewTryIt} />

      {/* Quick Insight (shows after WhatsNew dismissed) */}
      <QuickInsightCard insight={quickInsight} whatsNewDismissed={whatsNewDismissed} />

      {/* Latest Eating Analysis */}
      {latestAnalysis && (() => {
        const daysSince = Math.floor(
          (Date.now() - new Date(latestAnalysis.generatedAt).getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysSince > 7) return null;
        const scoreInfo = SCORE_LABELS[latestAnalysis.report.score];
        return (
          <button
            onClick={onViewAnalysis}
            className="w-full rounded-2xl bg-gradient-to-br from-[#F0E8FF] to-white border border-purple-200/40 p-3.5 flex items-center gap-3 text-left transition-colors hover:bg-purple-50 active:scale-[0.98]"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-100 shrink-0">
              <Brain className="h-4 w-4 text-purple-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-xs font-extrabold text-foreground">Eating Analysis</p>
                <span className={`text-[10px] font-bold ${scoreInfo.color}`}>
                  {scoreInfo.label}
                </span>
              </div>
              <p className="text-[10px] text-muted mt-0.5 line-clamp-1">
                {latestAnalysis.report.scoreSummary}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-light shrink-0" />
          </button>
        );
      })()}

      {/* Calorie Ring + Macros */}
      <div className="rounded-2xl bg-gradient-to-br from-[#E8F5E0] to-white border border-accent/10 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-extrabold text-foreground">Daily Intake</h3>
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
          <h3 className="text-base font-extrabold text-foreground">Today Meals</h3>
          <button
            onClick={onScanDish}
            className="flex items-center gap-1 rounded-full bg-accent-light border border-accent/20 px-2.5 py-1 text-[10px] font-semibold text-accent transition-colors hover:bg-accent/15 active:scale-95"
          >
            <Plus className="h-3 w-3" />
            Add
          </button>
        </div>

        <div className="px-4 pb-4 space-y-1 relative">
          {(["breakfast", "lunch", "snack", "dinner"] as const).map((mealType) => {
            const meals = mealsByType[mealType] || [];
            const Icon = MEAL_ICONS[mealType] || Coffee;
            const totalCal = meals.reduce((sum, m) => sum + m.totals.calories, 0);
            const totalProtein = meals.reduce((sum, m) => sum + m.totals.protein, 0);
            const totalCarbs = meals.reduce((sum, m) => sum + m.totals.carbs, 0);
            const totalFat = meals.reduce((sum, m) => sum + m.totals.fat, 0);
            const mealTotals = { calories: totalCal, protein: totalProtein, carbs: totalCarbs, fat: totalFat, fiber: meals.reduce((sum, m) => sum + m.totals.fiber, 0) };
            const badge = meals.length > 0 ? getMealHealthRating(mealTotals) : null;
            const BadgeIcon = badge ? HEALTH_ICONS[badge.rating] : null;

            return (
              <div
                key={mealType}
                onClick={() => meals.length > 0 ? onMealTypeClick(mealType) : onScanDish()}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-card-hover transition-colors cursor-pointer active:scale-[0.98]"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-light">
                  <Icon className="h-4 w-4 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-extrabold text-foreground capitalize">{mealType}</p>
                  {meals.length > 0 ? (
                    <>
                      <p className="text-[10px] text-muted truncate">
                        {meals.flatMap((m) => m.dishes.map((d) => d.name)).join(", ")}
                      </p>
                      <p className="text-[10px] text-muted mt-0.5">
                        {totalCal} cal · P {Math.round(totalProtein)}g · C {Math.round(totalCarbs)}g · F {Math.round(totalFat)}g
                      </p>
                    </>
                  ) : (
                    <p className="text-[10px] text-muted-light">Not logged yet</p>
                  )}
                </div>
                <div className="text-right shrink-0 flex items-center gap-1.5">
                  {meals.length > 0 && badge && BadgeIcon ? (
                    <>
                      <div className="flex items-center gap-1 rounded-full px-2 py-0.5" style={{ backgroundColor: badge.bgColor }}>
                        <BadgeIcon className="h-3 w-3" style={{ color: badge.color }} />
                        <span className="text-[10px] font-bold" style={{ color: badge.color }}>{badge.label}</span>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-muted-light" />
                    </>
                  ) : (
                    <span className="text-[10px] text-accent font-semibold">Add</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Coach mark for empty meals */}
        {todayMeals.length === 0 && coachMarks.shouldShow("empty-meals") && (
          <div className="px-4 pb-3">
            <CoachMark
              id="empty-meals"
              text="Tap any meal slot to scan or describe what you ate"
              visible={true}
              onDismiss={coachMarks.dismiss}
            />
          </div>
        )}
      </div>

      {/* Fridge Scanner Card */}
      <button
        onClick={onOpenFridge}
        className="w-full rounded-2xl bg-card border border-border p-4 flex items-center gap-4 text-left transition-colors hover:bg-card-hover active:scale-[0.98]"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-light shrink-0">
          <CapyLottie src="/model/cute-dog.json" size={40} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-extrabold text-foreground">Scan Your Fridge</p>
          <p className="text-xs text-muted mt-0.5">See what&apos;s inside and get recipe ideas</p>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-light shrink-0" />
      </button>

      {/* Streak Card */}
      {streak.currentStreak >= 7 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-gradient-to-r from-accent-light to-orange-light border border-accent/15 p-4 flex items-center gap-3"
        >
          <div className="animate-breathe">
            <CapyLottie size={48} speed={1.3} />
          </div>
          <div>
            <p className="text-sm font-extrabold text-foreground">
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
