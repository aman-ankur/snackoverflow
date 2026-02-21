"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calculator, PlusCircle, Sparkles, Pencil, X, Check, Loader2 } from "lucide-react";
import GeminiCameraView from "@/components/GeminiCameraView";
import NutritionCard from "@/components/NutritionCard";
import MealLog from "@/components/MealLog";
import GoalDashboard from "@/components/GoalDashboard";
import GoalOnboarding from "@/components/GoalOnboarding";
import MealHistory from "@/components/MealHistory";
import { useDishScanner } from "@/lib/useDishScanner";
import { useMealLog } from "@/lib/useMealLog";
import { useUserGoals } from "@/lib/useUserGoals";
import type { DishNutrition, MealType, UserProfile, NutritionGoals } from "@/lib/dishTypes";

const SERVING_OPTIONS = [0.5, 1, 1.5, 2] as const;
const MEAL_TYPE_OPTIONS: MealType[] = ["breakfast", "lunch", "snack", "dinner"];

function getHealthTagColor(tag: string): string {
  if (tag.includes("protein") || tag.includes("fiber") || tag.includes("low")) {
    return "bg-accent/10 border-accent/20 text-accent";
  }
  if (tag.includes("carb")) {
    return "bg-yellow-400/10 border-yellow-400/20 text-yellow-400";
  }
  if (tag.includes("fat") || tag.includes("high-calorie")) {
    return "bg-red-500/10 border-red-500/20 text-red-400";
  }
  return "bg-foreground/8 border-border text-foreground/50";
}

function titleCaseTag(tag: string): string {
  return tag
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getDaysAgo(isoDate: string): number {
  const nowMs = new Date().getTime();
  const mealMs = new Date(isoDate).getTime();
  if (!Number.isFinite(mealMs)) return 0;
  const diffMs = nowMs - mealMs;
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

function scaleDish(dish: DishNutrition, multiplier: number): DishNutrition {
  return {
    ...dish,
    estimated_weight_g: Math.round(dish.estimated_weight_g * multiplier),
    calories: Math.round(dish.calories * multiplier),
    protein_g: Math.round(dish.protein_g * multiplier),
    carbs_g: Math.round(dish.carbs_g * multiplier),
    fat_g: Math.round(dish.fat_g * multiplier),
    fiber_g: Math.round(dish.fiber_g * multiplier),
  };
}

function deriveTags(dish: DishNutrition): string[] {
  const tags = new Set<string>(dish.tags);
  if (dish.protein_g > 20) tags.add("high-protein");
  if (dish.carbs_g > 50) tags.add("high-carb");
  if (dish.fat_g > 30) tags.add("high-fat");
  if (dish.calories < 300) tags.add("low-calorie");
  if (dish.calories > 600) tags.add("high-calorie");
  if (dish.fiber_g > 5) tags.add("fiber-rich");
  return Array.from(tags);
}

export default function DishMode() {
  const dish = useDishScanner();
  const mealLog = useMealLog();
  const userGoals = useUserGoals();

  const [servingsMultiplier, setServingsMultiplier] = useState<number>(1);
  const [logMealType, setLogMealType] = useState<MealType>("lunch");
  const [logSuccess, setLogSuccess] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (userGoals.hasLoaded && !userGoals.hasProfile) {
      setShowOnboarding(true);
    }
  }, [userGoals.hasLoaded, userGoals.hasProfile]);

  const scaledDishes = useMemo(
    () => (dish.analysis?.dishes || []).map((item) => scaleDish(item, servingsMultiplier)),
    [dish.analysis?.dishes, servingsMultiplier]
  );

  const scaledTotals = useMemo(() => {
    return scaledDishes.reduce(
      (acc, item) => ({
        calories: acc.calories + item.calories,
        protein: acc.protein + item.protein_g,
        carbs: acc.carbs + item.carbs_g,
        fat: acc.fat + item.fat_g,
        fiber: acc.fiber + item.fiber_g,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
    );
  }, [scaledDishes]);

  const dishLastSeenDays = useMemo(() => {
    const lookup = new Map<string, number>();

    mealLog.meals.forEach((meal) => {
      meal.dishes.forEach((loggedDish) => {
        const key = loggedDish.name.toLowerCase();
        if (lookup.has(key)) return;
        lookup.set(key, getDaysAgo(meal.loggedAt));
      });
    });

    return lookup;
  }, [mealLog.meals]);

  const handleLogMeal = () => {
    if (scaledDishes.length === 0) return;

    mealLog.logMeal({
      mealType: logMealType,
      servingsMultiplier,
      dishes: scaledDishes,
      totals: scaledTotals,
    });

    setLogSuccess(true);
    userGoals.refreshStreak();
    setTimeout(() => setLogSuccess(false), 1800);
  };

  const handleOnboardingComplete = (profile: UserProfile, goals: NutritionGoals) => {
    userGoals.saveProfile(profile);
    if (goals.isCustom) {
      userGoals.updateGoals(goals);
    }
    setShowOnboarding(false);
  };

  return (
    <>
      <AnimatePresence>
        {showOnboarding && (
          <GoalOnboarding
            existingProfile={userGoals.profile}
            onComplete={handleOnboardingComplete}
            onSkip={() => setShowOnboarding(false)}
          />
        )}
      </AnimatePresence>

      <GeminiCameraView
        videoRef={dish.videoRef}
        canvasRef={dish.canvasRef}
        isStreaming={dish.isStreaming}
        isAnalyzing={dish.isAnalyzing}
        autoScan={false}
        error={dish.error}
        onStart={dish.startCamera}
        onStop={dish.stopCamera}
        onFlip={dish.flipCamera}
        onAnalyze={dish.analyzeFrame}
        onToggleAutoScan={() => undefined}
        hasApiKey={true}
        showAutoScan={false}
        analyzeButtonLabel="Analyze Dish"
        readyLabel="Ready — tap Analyze Dish"
        placeholderTitle="Point your camera at your plate"
        placeholderSubtitle="AI will estimate calories and macros"
      />

      <div className="rounded-2xl border border-border bg-surface p-3">
        <p className="text-[10px] text-foreground/30 mb-2 px-1">Meal context</p>
        <div className="grid grid-cols-4 gap-1.5">
          {MEAL_TYPE_OPTIONS.map((option) => (
            <button
              key={option}
              onClick={() => {
                dish.setMealType(option);
                setLogMealType(option);
              }}
              className={`rounded-full border px-2 py-1.5 text-[10px] font-medium capitalize transition-colors ${
                dish.mealType === option
                  ? "border-orange/30 bg-orange/15 text-orange"
                  : "border-border bg-background/50 text-foreground/45 hover:bg-background/70"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-3">
        <div className="flex items-center gap-2 mb-2">
          <Calculator className="h-4 w-4 text-orange" />
          <h3 className="text-sm font-semibold">Portion Adjuster</h3>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {SERVING_OPTIONS.map((value) => (
            <button
              key={value}
              onClick={() => setServingsMultiplier(value)}
              className={`rounded-full border px-2 py-1.5 text-[10px] font-semibold transition-colors ${
                servingsMultiplier === value
                  ? "border-accent/30 bg-accent/15 text-accent"
                  : "border-border bg-background/50 text-foreground/45 hover:bg-background/70"
              }`}
            >
              {value}x
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="popLayout">
        {scaledDishes.length === 0 ? (
          <motion.div
            key="dish-empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-2xl border border-border bg-surface py-10 px-6 text-center"
          >
            <Sparkles className="h-7 w-7 text-orange/60 mx-auto" />
            <p className="text-sm font-medium text-foreground/55 mt-3">No dish analysis yet</p>
            <p className="text-xs text-foreground/35 mt-1">
              Start camera and tap Analyze Dish to get calorie and macro estimates.
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="dish-results"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="space-y-3"
          >
            <div className="rounded-2xl border border-accent/20 bg-accent/5 p-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold">Plate Total</h3>
                <span className="text-[10px] text-foreground/35">
                  {scaledDishes.length} dish{scaledDishes.length === 1 ? "" : "es"}
                </span>
              </div>
              <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
                <p className="text-xs text-foreground/70">🔥 {scaledTotals.calories} kcal</p>
                <p className="text-xs text-foreground/70">💪 {scaledTotals.protein}g</p>
                <p className="text-xs text-foreground/70">🍞 {scaledTotals.carbs}g</p>
                <p className="text-xs text-foreground/70">🧈 {scaledTotals.fat}g</p>
              </div>
            </div>

            {scaledDishes.map((dishItem, index) => {
              const tags = deriveTags(dishItem);
              const seenAgo = dishLastSeenDays.get(dishItem.name.toLowerCase());
              return (
                <div key={`${dishItem.name}-${index}`} className="space-y-2">
                  {typeof seenAgo === "number" && seenAgo > 0 && (
                    <div className="inline-flex items-center rounded-full border border-accent/20 bg-accent/10 px-2.5 py-1 text-[10px] text-accent">
                      You had this {seenAgo} day{seenAgo === 1 ? "" : "s"} ago
                    </div>
                  )}
                  <NutritionCard dish={dishItem} servingsMultiplier={1} />
                  <CorrectionChip
                    dishIndex={index}
                    currentName={dishItem.name}
                    isAnalyzing={dish.isAnalyzing}
                    onCorrect={dish.correctDish}
                  />
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 px-1">
                      {tags.map((tag) => (
                        <span
                          key={`${dishItem.name}-${tag}`}
                          className={`rounded-full border px-2 py-0.5 text-[10px] ${getHealthTagColor(tag)}`}
                        >
                          {titleCaseTag(tag)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            <div className="rounded-2xl border border-border bg-surface p-3">
              <div className="flex items-center justify-between gap-2 mb-2">
                <p className="text-xs text-foreground/55">Log this scan as a meal</p>
                <button
                  onClick={dish.clearAnalysis}
                  className="text-[10px] text-foreground/35 hover:text-foreground/60 transition-colors"
                >
                  Clear analysis
                </button>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={logMealType}
                  onChange={(event) => setLogMealType(event.target.value as MealType)}
                  className="flex-1 rounded-full border border-border bg-background/60 px-3 py-2 text-xs text-foreground/75"
                >
                  {MEAL_TYPE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </option>
                  ))}
                </select>

                <button
                  onClick={handleLogMeal}
                  className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/15 px-4 py-2 text-xs font-semibold text-accent transition-colors hover:bg-accent/20"
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                  {logSuccess ? "Logged" : "Log This Meal"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <GoalDashboard
        totals={mealLog.todayTotals}
        goals={userGoals.goals}
        streak={userGoals.streak}
        mealsCount={mealLog.todayMeals.length}
        onEditGoals={() => setShowOnboarding(true)}
      />
      <MealLog meals={mealLog.todayMeals} onRemoveMeal={mealLog.removeMeal} onClearAll={mealLog.clearAllMeals} />
      <MealHistory
        meals={mealLog.meals}
        weeklyByDate={mealLog.weeklyByDate}
        repeatedDishes={mealLog.insights.repeatedDishes}
      />
    </>
  );
}

function CorrectionChip({
  dishIndex,
  currentName,
  isAnalyzing,
  onCorrect,
}: {
  dishIndex: number;
  currentName: string;
  isAnalyzing: boolean;
  onCorrect: (dishIndex: number, correctedName: string) => Promise<void>;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState("");

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed || trimmed.toLowerCase() === currentName.toLowerCase()) {
      setIsEditing(false);
      setValue("");
      return;
    }
    onCorrect(dishIndex, trimmed);
    setIsEditing(false);
    setValue("");
  };

  if (isAnalyzing) {
    return (
      <div className="flex items-center gap-1.5 px-1 text-[10px] text-foreground/35">
        <Loader2 className="h-3 w-3 animate-spin" />
        Re-analyzing…
      </div>
    );
  }

  if (!isEditing) {
    return (
      <button
        onClick={() => {
          setValue(currentName);
          setIsEditing(true);
        }}
        className="flex items-center gap-1 px-1 text-[10px] text-foreground/35 hover:text-foreground/55 transition-colors"
      >
        <Pencil className="h-3 w-3" />
        Wrong dish?
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1.5 px-1">
      <input
        autoFocus
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSubmit();
          if (e.key === "Escape") {
            setIsEditing(false);
            setValue("");
          }
        }}
        placeholder="Correct dish name"
        className="flex-1 rounded-full border border-border bg-background/60 px-3 py-1.5 text-xs text-foreground/75 outline-none focus:border-accent/40"
      />
      <button
        onClick={handleSubmit}
        className="rounded-full border border-accent/30 bg-accent/15 p-1.5 text-accent hover:bg-accent/25 transition-colors"
      >
        <Check className="h-3 w-3" />
      </button>
      <button
        onClick={() => {
          setIsEditing(false);
          setValue("");
        }}
        className="rounded-full border border-border p-1.5 text-foreground/40 hover:text-foreground/60 transition-colors"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
