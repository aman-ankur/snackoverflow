"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calculator, PlusCircle, Sparkles, Pencil, X, Check, Loader2 } from "lucide-react";
import GeminiCameraView from "@/components/GeminiCameraView";
import NutritionCard from "@/components/NutritionCard";
import CapyMascot from "@/components/CapyMascot";
import { useDishScanner } from "@/lib/useDishScanner";
import { useMealLog } from "@/lib/useMealLog";
import { useUserGoals } from "@/lib/useUserGoals";
import type { DishNutrition, MealType } from "@/lib/dishTypes";

const SERVING_OPTIONS = [0.5, 1, 1.5, 2] as const;
const MEAL_TYPE_OPTIONS: MealType[] = ["breakfast", "lunch", "snack", "dinner"];

function getHealthTagColor(tag: string): string {
  if (tag.includes("protein") || tag.includes("fiber") || tag.includes("low")) {
    return "bg-accent-light border-accent/20 text-accent-dim";
  }
  if (tag.includes("carb")) {
    return "bg-orange-light border-orange/20 text-orange";
  }
  if (tag.includes("fat") || tag.includes("high-calorie")) {
    return "bg-red-50 border-red-200 text-red-500";
  }
  return "bg-card border-border text-muted";
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

export default function ScanView() {
  const dish = useDishScanner();
  const mealLog = useMealLog();
  const userGoals = useUserGoals();

  const [servingsMultiplier, setServingsMultiplier] = useState<number>(1);
  const [logMealType, setLogMealType] = useState<MealType>("lunch");
  const [logSuccess, setLogSuccess] = useState(false);

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

  return (
    <div className="space-y-4">
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

      {/* Meal context */}
      <div className="rounded-2xl bg-card border border-border p-3">
        <p className="text-[10px] text-muted mb-2 px-1">Meal context</p>
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
                  ? "border-accent/30 bg-accent-light text-accent-dim"
                  : "border-border bg-background text-muted hover:bg-card-hover"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {/* Portion adjuster */}
      <div className="rounded-2xl bg-card border border-border p-3">
        <div className="flex items-center gap-2 mb-2">
          <Calculator className="h-4 w-4 text-accent" />
          <h3 className="text-sm font-semibold text-foreground">Portion Adjuster</h3>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {SERVING_OPTIONS.map((value) => (
            <button
              key={value}
              onClick={() => setServingsMultiplier(value)}
              className={`rounded-full border px-2 py-1.5 text-[10px] font-semibold transition-colors ${
                servingsMultiplier === value
                  ? "border-accent/30 bg-accent-light text-accent-dim"
                  : "border-border bg-background text-muted hover:bg-card-hover"
              }`}
            >
              {value}x
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <AnimatePresence mode="popLayout">
        {scaledDishes.length === 0 ? (
          <motion.div
            key="dish-empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-2xl bg-card border border-border py-10 px-6 text-center"
          >
            <Sparkles className="h-7 w-7 text-accent/50 mx-auto" />
            <p className="text-sm font-medium text-muted mt-3">No dish analysis yet</p>
            <p className="text-xs text-muted mt-1">
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
            {/* Plate total */}
            <div className="rounded-2xl bg-accent-light border border-accent/15 p-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-foreground">Plate Total</h3>
                <span className="text-[10px] text-muted">
                  {scaledDishes.length} dish{scaledDishes.length === 1 ? "" : "es"}
                </span>
              </div>
              <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
                <p className="text-xs text-foreground">🔥 {scaledTotals.calories} kcal</p>
                <p className="text-xs text-foreground">💪 {scaledTotals.protein}g</p>
                <p className="text-xs text-foreground">🍞 {scaledTotals.carbs}g</p>
                <p className="text-xs text-foreground">🧈 {scaledTotals.fat}g</p>
              </div>
            </div>

            {/* Capy reaction */}
            <div className="flex items-center gap-3 px-1">
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", bounce: 0.5, delay: 0.3 }}
                className="shrink-0"
              >
                <CapyMascot
                  mood={scaledTotals.calories < 400 ? "happy" : scaledTotals.calories > 700 ? "concerned" : "motivated"}
                  size={48}
                />
              </motion.div>
              <motion.p
                initial={{ x: 8, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-xs text-muted leading-relaxed rounded-xl bg-accent-light border border-accent/10 px-3 py-2"
              >
                {scaledTotals.calories < 400
                  ? "Light and healthy! Great choice! 🌿"
                  : scaledTotals.calories > 700
                  ? "That's a big meal! Maybe balance it out later? 😊"
                  : "Solid meal! Good balance of nutrients! 💪"}
              </motion.p>
            </div>

            {/* Individual dishes */}
            {scaledDishes.map((dishItem, index) => {
              const tags = deriveTags(dishItem);
              const seenAgo = dishLastSeenDays.get(dishItem.name.toLowerCase());
              return (
                <div key={`${dishItem.name}-${index}`} className="space-y-2">
                  {typeof seenAgo === "number" && seenAgo > 0 && (
                    <div className="inline-flex items-center rounded-full border border-accent/20 bg-accent-light px-2.5 py-1 text-[10px] text-accent-dim">
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

            {/* Log meal */}
            <div className="rounded-2xl bg-card border border-border p-3">
              <div className="flex items-center justify-between gap-2 mb-2">
                <p className="text-xs text-muted">Log this scan as a meal</p>
                <button
                  onClick={dish.clearAnalysis}
                  className="text-[10px] text-muted hover:text-foreground transition-colors"
                >
                  Clear analysis
                </button>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={logMealType}
                  onChange={(event) => setLogMealType(event.target.value as MealType)}
                  className="flex-1 rounded-full border border-border bg-background px-3 py-2 text-xs text-foreground"
                >
                  {MEAL_TYPE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleLogMeal}
                  className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-all active:scale-95 ${
                    logSuccess
                      ? "bg-accent text-white"
                      : "bg-accent-light border border-accent/20 text-accent-dim hover:bg-accent/15"
                  }`}
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                  {logSuccess ? "Logged ✓" : "Log This Meal"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
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
      <div className="flex items-center gap-1.5 px-1 text-[10px] text-muted">
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
        className="flex items-center gap-1 px-1 text-[10px] text-muted hover:text-foreground transition-colors"
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
        className="flex-1 rounded-full border border-border bg-background px-3 py-1.5 text-xs text-foreground outline-none focus:border-accent/40"
      />
      <button
        onClick={handleSubmit}
        className="rounded-full bg-accent-light border border-accent/20 p-1.5 text-accent-dim hover:bg-accent/15 transition-colors"
      >
        <Check className="h-3 w-3" />
      </button>
      <button
        onClick={() => {
          setIsEditing(false);
          setValue("");
        }}
        className="rounded-full border border-border p-1.5 text-muted hover:text-foreground transition-colors"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
