"use client";

import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Pencil, X, Check, Loader2, Trash2, ChevronDown, ChevronUp, Minus, Plus, Camera, PenLine, RefreshCw, Brain } from "lucide-react";
import GeminiCameraView from "@/components/GeminiCameraView";
import CapyMascot from "@/components/CapyMascot";
import DescribeMealView from "@/components/DescribeMealView";
import CoachMark from "@/components/CoachMark";
import { MealHealthBanner, HealthCheckButton, HealthProfilePrompt } from "@/components/HealthVerdictCard";
import { DishAlternatives } from "@/components/DishAlternatives";
import type { HealthCondition } from "@/lib/dishTypes";
import { useDishScanner } from "@/lib/useDishScanner";
import { useHealthVerdict } from "@/lib/useHealthVerdict";
import type { DishNutrition, MealType, MealTotals, LoggedMeal, ConfidenceLevel } from "@/lib/dishTypes";
import type { CoachMarkId } from "@/lib/useCoachMarks";

interface ScanViewProps {
  logMeal: (input: { mealType: MealType; servingsMultiplier: number; dishes: DishNutrition[]; totals: MealTotals }) => LoggedMeal;
  meals: LoggedMeal[];
  refreshStreak: () => void;
  onMealLogged?: () => void;
  initialMode?: "camera" | "describe";
  coachMarks?: { shouldShow: (id: CoachMarkId) => boolean; dismiss: (id: CoachMarkId) => void };
  healthContextString?: string;
  hasHealthProfile?: boolean;
  healthConditions?: HealthCondition[];
  onSetupHealthProfile?: () => void;
}

const SERVING_OPTIONS = [0.5, 1, 1.5, 2] as const;
const MEAL_TYPE_OPTIONS: MealType[] = ["breakfast", "lunch", "snack", "dinner"];

/* ─── Helpers ─── */

function getProviderDisplayName(providerCode: string): string {
  const providerMap: Record<string, string> = {
    "G25F": "Gemini 2.5 Flash",
    "G20F": "Gemini 2.0 Flash",
    "OAI4m": "OpenAI GPT-4o Mini",
    "OAI41n": "OpenAI GPT-4.1 Nano",
    "GRQM": "Groq Llama 4 Maverick",
    "GRQS": "Groq Llama 4 Scout",
    "gemini-2.5-flash": "Gemini 2.5 Flash",
    "gemini-2.0-flash": "Gemini 2.0 Flash",
    "gemini-2.0-flash-lite": "Gemini 2.0 Flash Lite",
    "gpt-4o-mini": "OpenAI GPT-4o Mini",
    "gpt-4.1-nano": "OpenAI GPT-4.1 Nano",
  };

  return providerMap[providerCode] || providerCode;
}

function getAutoMealType(): MealType {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) return "breakfast";
  if (hour >= 11 && hour < 15) return "lunch";
  if (hour >= 15 && hour < 18) return "snack";
  return "dinner";
}

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

function generateDishNote(dish: DishNutrition): { text: string; type: "positive" | "warning" } | null {
  const tags = deriveTags(dish);
  const ingredients = dish.ingredients.map((i) => i.toLowerCase());

  // Warning notes
  if (ingredients.includes("maida") || ingredients.includes("refined flour")) {
    return { text: "Made with refined flour (maida)", type: "warning" };
  }
  if (tags.includes("high-fat") && (ingredients.includes("butter") || ingredients.includes("cream") || ingredients.includes("ghee"))) {
    return { text: "High cream & butter content — calorie dense", type: "warning" };
  }
  if (tags.includes("high-carb") && dish.fiber_g < 3) {
    return { text: "High in refined carbs, low fiber", type: "warning" };
  }
  if (tags.includes("high-calorie")) {
    return { text: `Calorie dense at ${dish.calories} kcal`, type: "warning" };
  }

  // Positive notes
  if (tags.includes("high-protein") && tags.includes("low-calorie")) {
    return { text: "High protein, low calorie — great choice", type: "positive" };
  }
  if (tags.includes("fiber-rich")) {
    return { text: "Good fiber source — aids digestion", type: "positive" };
  }
  if (tags.includes("high-protein")) {
    return { text: "Good protein source", type: "positive" };
  }
  if (ingredients.includes("yogurt") || ingredients.includes("curd") || ingredients.includes("dahi")) {
    return { text: "Good probiotic source — aids digestion", type: "positive" };
  }
  if (tags.includes("low-calorie")) {
    return { text: "Light and low calorie", type: "positive" };
  }

  return null;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Filter alternatives to only show genuinely useful options.
 * Hides alternatives when:
 * - ALL alternatives are "low" confidence (regardless of primary confidence)
 * - Only 1 alternative with "low" confidence
 * - All alternatives have identical calories to primary (AI glitch)
 * - Alternative names are identical to primary (trivial variants)
 */
function shouldShowAlternatives(primary: DishNutrition, alternatives: DishNutrition[]): boolean {
  if (!alternatives || alternatives.length === 0) return false;

  // Rule 1: Hide if ALL alternatives are "low" confidence (universal, not primary-dependent)
  const allLow = alternatives.every(alt => alt.confidence === "low");
  if (allLow) return false;

  // Rule 2: If only 1 alternative and it's "low" confidence, hide it
  if (alternatives.length === 1 && alternatives[0].confidence === "low") {
    return false;
  }

  // Rule 3: Hide if all alternatives have exact same calories (likely AI glitch)
  const uniqueCalories = new Set(alternatives.map(alt => alt.calories));
  if (uniqueCalories.size === 1 && alternatives[0].calories === primary.calories) {
    return false;
  }

  // Rule 4: Hide if alternative names are identical to primary (trivial variants)
  const primaryNorm = primary.name.toLowerCase().trim();
  const allSameName = alternatives.every(alt => alt.name.toLowerCase().trim() === primaryNorm);
  if (allSameName) return false;

  return true;
}

/* ─── Tiny inline components ─── */

function MacroStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="text-center">
      <p className={`text-lg font-extrabold ${color}`}>{value}g</p>
      <p className="text-[11px] text-muted mt-0.5">{label}</p>
    </div>
  );
}

function ConfidenceDot({ level }: { level: ConfidenceLevel }) {
  const color = {
    high: "bg-accent",
    medium: "bg-orange",
    low: "bg-muted/40",
  }[level];
  const title = { high: "High confidence", medium: "Medium confidence", low: "Low confidence" }[level];
  return (
    <span title={title} className={`inline-block h-2 w-2 rounded-full ${color} shrink-0`} />
  );
}

type ScanMode = "camera" | "describe";

export default function ScanView({ logMeal, meals, refreshStreak, onMealLogged, initialMode, coachMarks, healthContextString, hasHealthProfile, healthConditions, onSetupHealthProfile }: ScanViewProps) {
  const dish = useDishScanner();
  const healthVerdict = useHealthVerdict();
  const [mode, setMode] = useState<ScanMode>(initialMode || "camera");
  const [correctionContext, setCorrectionContext] = useState<{ scannedAs: string; mealType: MealType } | undefined>(undefined);

  const [servingsMultiplier, setServingsMultiplier] = useState<number>(1);
  const [autoMealType] = useState<MealType>(getAutoMealType);
  const [logMealType, setLogMealType] = useState<MealType>(getAutoMealType);
  const [logSuccess, setLogSuccess] = useState(false);
  const [removedIndices, setRemovedIndices] = useState<Set<number>>(new Set());
  const [weightOverrides, setWeightOverrides] = useState<Map<number, number>>(new Map());
  const [calorieOverrides, setCalorieOverrides] = useState<Map<number, number>>(new Map());
  const [expandedDishIndex, setExpandedDishIndex] = useState<number | null>(null);
  const [selectedAlternatives, setSelectedAlternatives] = useState<Map<number, number>>(new Map()); // Map<dishIndex, selectedOptionIndex>
  const resultsRef = useRef<HTMLDivElement>(null);
  const prevAnalysisRef = useRef<typeof dish.analysis>(null);

  // Sync mode when initialMode prop changes
  useEffect(() => {
    if (initialMode) setMode(initialMode);
  }, [initialMode]);

  const switchToDescribe = useCallback((scannedAs?: string) => {
    if (scannedAs) {
      setCorrectionContext({ scannedAs, mealType: logMealType });
    } else {
      setCorrectionContext(undefined);
    }
    setMode("describe");
  }, [logMealType]);

  // Auto-scroll to results when analysis completes
  useEffect(() => {
    if (dish.analysis && dish.analysis !== prevAnalysisRef.current && dish.analysis.dishes.length > 0) {
      setRemovedIndices(new Set());
      setWeightOverrides(new Map());
      setCalorieOverrides(new Map());
      // Auto-expand if single dish
      setExpandedDishIndex(dish.analysis.dishes.length === 1 ? 0 : null);
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 200);
    }
    prevAnalysisRef.current = dish.analysis;
  }, [dish.analysis]);

  // On-demand health verdict trigger
  const triggerHealthCheck = useCallback(() => {
    if (!dish.analysis || !healthContextString || dish.analysis.dishes.length === 0) return;
    const dishInputs = dish.analysis.dishes.map((d) => ({
      name: d.name,
      calories: d.calories,
      protein_g: d.protein_g,
      carbs_g: d.carbs_g,
      fat_g: d.fat_g,
      fiber_g: d.fiber_g,
      ingredients: d.ingredients,
      tags: d.tags,
    }));
    healthVerdict.fetchVerdict(dishInputs, healthContextString);
  }, [dish.analysis, healthContextString]); // eslint-disable-line react-hooks/exhaustive-deps

  const activeDishes = useMemo(() => {
    const raw = dish.analysis?.dishes || [];
    return raw
      .map((item, i) => ({ item, originalIndex: i }))
      .filter(({ originalIndex }) => !removedIndices.has(originalIndex));
  }, [dish.analysis?.dishes, removedIndices]);

  const scaledDishes = useMemo(
    () =>
      activeDishes.map(({ item, originalIndex }) => {
        const overrideWeight = weightOverrides.get(originalIndex);
        const overrideCal = calorieOverrides.get(originalIndex);

        let scaled: DishNutrition;
        if (overrideWeight !== undefined && item.estimated_weight_g > 0) {
          const ratio = overrideWeight / item.estimated_weight_g;
          scaled = scaleDish(item, servingsMultiplier * ratio);
        } else {
          scaled = scaleDish(item, servingsMultiplier);
        }

        if (overrideCal !== undefined && scaled.calories > 0) {
          const calRatio = overrideCal / scaled.calories;
          return {
            ...scaled,
            calories: overrideCal,
            protein_g: Math.round(scaled.protein_g * calRatio),
            carbs_g: Math.round(scaled.carbs_g * calRatio),
            fat_g: Math.round(scaled.fat_g * calRatio),
            fiber_g: Math.round(scaled.fiber_g * calRatio),
            estimated_weight_g: Math.round(scaled.estimated_weight_g * calRatio),
          };
        }

        return scaled;
      }),
    [activeDishes, servingsMultiplier, weightOverrides, calorieOverrides]
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
    meals.forEach((meal) => {
      meal.dishes.forEach((loggedDish) => {
        const key = loggedDish.name.toLowerCase();
        if (lookup.has(key)) return;
        lookup.set(key, getDaysAgo(meal.loggedAt));
      });
    });
    return lookup;
  }, [meals]);

  const handleRemoveDish = useCallback((originalIndex: number) => {
    setRemovedIndices((prev) => new Set(prev).add(originalIndex));
    setExpandedDishIndex(null);
  }, []);

  const handleWeightChange = useCallback((originalIndex: number, newWeight: number) => {
    setWeightOverrides((prev) => {
      const next = new Map(prev);
      next.set(originalIndex, Math.max(1, newWeight));
      return next;
    });
    setCalorieOverrides((prev) => {
      const next = new Map(prev);
      next.delete(originalIndex);
      return next;
    });
  }, []);

  const handleCalorieChange = useCallback((originalIndex: number, newCal: number) => {
    setCalorieOverrides((prev) => {
      const next = new Map(prev);
      if (newCal <= 0) {
        next.delete(originalIndex);
      } else {
        next.set(originalIndex, newCal);
      }
      return next;
    });
  }, []);

  const handleMealTypeChange = useCallback((mt: MealType) => {
    dish.setMealType(mt);
    setLogMealType(mt);
  }, [dish]);

  const handleAlternativeSelect = useCallback((dishIndex: number, optionIndex: number) => {
    if (!dish.analysis) return;

    // Update selection tracking
    setSelectedAlternatives(prev => new Map(prev).set(dishIndex, optionIndex));

    // If primary selected (index 0), nothing to swap
    if (optionIndex === 0) return;

    // Swap dish with selected alternative (instant, no API call)
    const updatedDishes = [...dish.analysis.dishes];
    const currentDish = updatedDishes[dishIndex];

    if (!currentDish.alternatives || optionIndex - 1 >= currentDish.alternatives.length) {
      return;
    }

    const selectedAlt = currentDish.alternatives[optionIndex - 1];

    // Replace current dish with alternative (keep alternatives for potential reselection)
    updatedDishes[dishIndex] = {
      ...selectedAlt,
      alternatives: [currentDish, ...currentDish.alternatives.filter((_, i) => i !== optionIndex - 1)]
    };

    // Recalculate plate totals
    const totals = updatedDishes.reduce((acc, d) => ({
      calories: acc.calories + d.calories,
      protein: acc.protein + d.protein_g,
      carbs: acc.carbs + d.carbs_g,
      fat: acc.fat + d.fat_g,
      fiber: acc.fiber + d.fiber_g
    }), { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });

    // Update analysis state (triggers re-render)
    dish.setAnalysis({
      ...dish.analysis,
      dishes: updatedDishes,
      totalCalories: totals.calories,
      totalProtein: totals.protein,
      totalCarbs: totals.carbs,
      totalFat: totals.fat,
      totalFiber: totals.fiber
    });

    // Clear any overrides for this dish
    setWeightOverrides(prev => {
      const next = new Map(prev);
      next.delete(dishIndex);
      return next;
    });
    setCalorieOverrides(prev => {
      const next = new Map(prev);
      next.delete(dishIndex);
      return next;
    });
  }, [dish]);

  const handleLogMeal = () => {
    if (scaledDishes.length === 0) return;
    logMeal({
      mealType: logMealType,
      servingsMultiplier,
      dishes: scaledDishes,
      totals: scaledTotals,
    });
    setLogSuccess(true);
    refreshStreak();
    setTimeout(() => {
      setLogSuccess(false);
      dish.clearAnalysis();
      onMealLogged?.();
    }, 1200);
  };

  const capyMood = scaledTotals.calories < 400 ? "happy" : scaledTotals.calories > 700 ? "concerned" : "motivated";
  const capyMessage = scaledTotals.calories < 400
    ? "Light and healthy! Great choice!"
    : scaledTotals.calories > 700
    ? "That's a big meal! Maybe balance it out later?"
    : "Solid meal! Good balance of nutrients!";

  return (
    <div className="space-y-4">
      {/* Mode Toggle */}
      <div className="relative">
      <div className="flex gap-1 rounded-2xl bg-card border border-border p-1">
        <button
          onClick={() => { setMode("camera"); setCorrectionContext(undefined); }}
          className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold transition-all ${
            mode === "camera"
              ? "bg-accent-light text-accent-dim border border-accent/20"
              : "text-muted border border-transparent hover:bg-card-hover"
          }`}
        >
          <Camera className="h-4 w-4" />
          Camera
        </button>
        <button
          onClick={() => switchToDescribe()}
          className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold transition-all ${
            mode === "describe"
              ? "bg-accent-light text-accent-dim border border-accent/20"
              : "text-muted border border-transparent hover:bg-card-hover"
          }`}
        >
          <PenLine className="h-4 w-4" />
          Describe
        </button>
      </div>

      </div>
      {/* Coach mark for scan toggle */}
      {coachMarks?.shouldShow("scan-toggle") && (
        <CoachMark
          id="scan-toggle"
          text="Tap Describe to type your meal instead of scanning"
          visible={true}
          onDismiss={coachMarks.dismiss}
        />
      )}

      {mode === "describe" ? (
        <DescribeMealView
          logMeal={logMeal}
          refreshStreak={refreshStreak}
          onMealLogged={onMealLogged}
          correctionContext={correctionContext}
          healthContextString={healthContextString}
          hasHealthProfile={hasHealthProfile}
          healthConditions={healthConditions}
          onSetupHealthProfile={onSetupHealthProfile}
        />
      ) : (
      <>
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
        capturedFrame={dish.capturedFrame}
        hasResults={scaledDishes.length > 0}
        onScanAgain={() => { dish.clearAnalysis(); dish.startCamera(); }}
      />

      {/* Status badge - shows provider being attempted */}
      <AnimatePresence>
        {dish.isAnalyzing && dish.scanStatus && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-3 mx-auto w-fit flex items-center gap-2 rounded-full bg-white/90 backdrop-blur-md px-4 py-2 border border-border shadow-sm"
          >
            <RefreshCw className="h-3.5 w-3.5 text-accent animate-spin" />
            <span className="text-xs font-medium text-foreground">
              {dish.scanStatus}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <div ref={resultsRef} />
      <AnimatePresence mode="popLayout">
        {scaledDishes.length === 0 && !dish.analysis ? (
          <motion.div
            key="dish-empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-2xl bg-card border border-border py-10 px-6 text-center"
          >
            <Sparkles className="h-7 w-7 text-accent/50 mx-auto" />
            <p className="text-sm font-semibold text-muted mt-3">No dish analysis yet</p>
            <p className="text-xs text-muted mt-1">
              Start camera and tap Analyze Dish to get calorie and macro estimates.
            </p>
          </motion.div>
        ) : scaledDishes.length === 0 && dish.analysis ? (
          <motion.div
            key="dish-all-removed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-2xl bg-card border border-border py-8 px-6 text-center"
          >
            <Trash2 className="h-6 w-6 text-muted/50 mx-auto" />
            <p className="text-sm font-semibold text-muted mt-3">All dishes removed</p>
            <button
              onClick={dish.clearAnalysis}
              className="mt-2 text-xs text-accent font-semibold"
            >
              Clear & re-scan
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="dish-results"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="space-y-3"
          >
            {/* A. Controls Strip — meal type + portion selector */}
            <div className="flex gap-1.5 overflow-x-auto pb-0.5 mb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {MEAL_TYPE_OPTIONS.map((option) => (
                <button
                  key={option}
                  onClick={() => handleMealTypeChange(option)}
                  className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                    logMealType === option
                      ? "border-accent/30 bg-accent-light text-accent-dim"
                      : "border-border bg-background text-muted hover:bg-card-hover"
                  }`}
                >
                  {capitalize(option)}
                  {logMealType === option && option === autoMealType && (
                    <span className="h-1.5 w-1.5 rounded-full bg-accent inline-block" />
                  )}
                </button>
              ))}
              {/* Divider */}
              <div className="w-px bg-border shrink-0 my-1 mx-0.5" />
              {/* Portion multiplier buttons */}
              {SERVING_OPTIONS.map((value) => (
                <button
                  key={value}
                  onClick={() => setServingsMultiplier(value)}
                  className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    servingsMultiplier === value
                      ? "border-accent/30 bg-accent-light text-accent-dim"
                      : "border-border bg-background text-muted hover:bg-card-hover"
                  }`}
                >
                  {value === 0.5 ? "½×" : value === 1.5 ? "1.5×" : `${value}×`}
                </button>
              ))}
            </div>

            {/* B. Plate Total — centered, large */}
            <div className="rounded-2xl bg-card border border-border p-5 text-center">
              <p className="text-xs text-muted font-semibold uppercase tracking-wider mb-1">Plate Total</p>
              <div>
                <span className="text-5xl font-black tracking-tighter leading-none">{scaledTotals.calories}</span>
                <span className="text-base font-medium text-muted ml-1">kcal</span>
              </div>
              <p className="text-xs text-muted mt-1">
                {scaledDishes.length} dish{scaledDishes.length !== 1 ? "es" : ""} · {capitalize(logMealType)}
              </p>
              <div className="flex justify-center gap-5 mt-4">
                <MacroStat label="Protein" value={scaledTotals.protein} color="text-accent-dim" />
                <MacroStat label="Carbs" value={scaledTotals.carbs} color="text-orange" />
                <MacroStat label="Fat" value={scaledTotals.fat} color="text-red-500" />
                <MacroStat label="Fiber" value={scaledTotals.fiber} color="text-emerald-600" />
              </div>
            </div>

            {/* C. AI Health Check */}
            {hasHealthProfile && healthVerdict.verdict ? (
              <MealHealthBanner
                analysis={healthVerdict.verdict}
                isLoading={false}
                error={healthVerdict.error}
                hasHealthProfile={true}
              />
            ) : hasHealthProfile && healthConditions && healthConditions.length > 0 ? (
              <HealthCheckButton
                conditions={healthConditions}
                isLoading={healthVerdict.status === "loading"}
                onCheck={triggerHealthCheck}
              />
            ) : !hasHealthProfile && onSetupHealthProfile ? (
              <HealthProfilePrompt onSetup={onSetupHealthProfile} />
            ) : null}

            {/* D. Capy Mascot — compact inline */}
            <div className="flex items-start gap-2.5">
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", bounce: 0.5, delay: 0.3 }}
                className="shrink-0"
              >
                <CapyMascot
                  mood={capyMood}
                  size={36}
                  animate={false}
                  className="rounded-full bg-accent-light border border-accent/20 p-0.5"
                />
              </motion.div>
              <motion.div
                initial={{ x: 8, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="flex-1 bg-card border border-border rounded-xl rounded-bl-sm px-3 py-2"
              >
                <p className="text-[13px] text-muted leading-relaxed">{capyMessage}</p>
              </motion.div>
            </div>

            {/* E. Individual Dishes — Accordion Cards */}
            {activeDishes.map(({ item: rawDish, originalIndex }, displayIndex) => {
              const dishItem = scaledDishes[displayIndex];
              if (!dishItem) return null;
              const isExpanded = expandedDishIndex === displayIndex;
              const note = generateDishNote(dishItem);
              const seenAgo = dishLastSeenDays.get(dishItem.name.toLowerCase());
              const currentWeight = weightOverrides.get(originalIndex) ?? rawDish.estimated_weight_g;
              const tags = deriveTags(dishItem);

              return (
                <motion.div
                  key={`${dishItem.name}-${originalIndex}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: displayIndex * 0.08 }}
                >
                  {/* Seen before tag */}
                  {typeof seenAgo === "number" && seenAgo > 0 && (
                    <div className="inline-flex items-center rounded-full border border-accent/20 bg-accent-light px-2.5 py-1 text-[10px] text-accent-dim mb-1.5">
                      You had this {seenAgo} day{seenAgo === 1 ? "" : "s"} ago
                    </div>
                  )}

                  <div className={`rounded-2xl border border-border overflow-hidden transition-colors relative ${isExpanded ? "bg-[#fdfcfa]" : "bg-card"}`}>
                    {/* Confidence dot — bottom right of card */}
                    {!isExpanded && (
                      <div className="absolute bottom-3 right-3.5">
                        <ConfidenceDot level={dishItem.confidence} />
                      </div>
                    )}
                    {/* Collapsed header — always visible */}
                    <button
                      onClick={() => setExpandedDishIndex(isExpanded ? null : displayIndex)}
                      className="w-full text-left p-4"
                    >
                      {/* Row 1: name + calories */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-base font-bold text-foreground truncate">{dishItem.name}</h4>
                          <p className="text-xs text-muted mt-0.5">
                            {dishItem.hindi && `${dishItem.hindi} · `}{dishItem.estimated_weight_g}g
                          </p>
                        </div>
                        <span className="text-base font-extrabold text-foreground shrink-0">{dishItem.calories} kcal</span>
                      </div>

                      {/* Row 2: inline macro pills */}
                      <div className="flex flex-wrap gap-1.5 mt-2.5">
                        <span className="inline-flex items-center gap-1 rounded-full bg-accent-light/60 border border-accent/15 px-2 py-0.5 text-[11px] font-semibold text-accent-dim">
                          <span className="h-1.5 w-1.5 rounded-full bg-accent inline-block" />
                          Protein {dishItem.protein_g}g
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-orange-light/60 border border-orange/15 px-2 py-0.5 text-[11px] font-semibold text-orange">
                          <span className="h-1.5 w-1.5 rounded-full bg-orange inline-block" />
                          Carbs {dishItem.carbs_g}g
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-50/60 border border-red-200/30 px-2 py-0.5 text-[11px] font-semibold text-red-500">
                          <span className="h-1.5 w-1.5 rounded-full bg-red-400 inline-block" />
                          Fat {dishItem.fat_g}g
                        </span>
                      </div>

                      {/* Row 3: Alternative pills preview (collapsed state only) */}
                      {!isExpanded && rawDish.alternatives && rawDish.alternatives.length > 0 && shouldShowAlternatives(rawDish, rawDish.alternatives) && (
                        <div className="flex flex-col gap-1.5 mt-3">
                          <p className="text-[10px] text-muted uppercase tracking-wide font-semibold flex items-center gap-1">
                            <svg className="w-3 h-3 text-purple-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path d="M8 7h12M8 12h12M8 17h12M3 7h.01M3 12h.01M3 17h.01" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            Or tap to select:
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {rawDish.alternatives.map((alt, altIndex) => (
                              <span
                                key={`${dishItem.name}-alt-${altIndex}`}
                                className="inline-flex items-center gap-1.5 rounded-full border-2 border-purple-300 bg-purple-50 px-3 py-1.5 text-[11px] text-purple-700 font-medium shadow-sm hover:shadow-md hover:border-purple-400 transition-all cursor-pointer"
                              >
                                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <path d="M8 7h12M8 12h12M8 17h12M3 7h.01M3 12h.01M3 17h.01" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                {alt.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Row 4: contextual note */}
                      {note && (
                        <p className={`mt-2.5 text-xs leading-relaxed ${
                          note.type === "warning" ? "text-amber-600" : "text-accent-dim"
                        }`}>
                          {note.type === "warning" ? "⚠ " : "✓ "}{note.text}
                        </p>
                      )}

                      {/* Row 5: expand hint */}
                      {!isExpanded && (
                        <div className="flex items-center justify-center gap-1 mt-3 text-[11px] text-muted">
                          <ChevronDown className="h-3 w-3" />
                          Tap for details & editing
                        </div>
                      )}
                    </button>

                    {/* Expanded section */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="border-t border-border px-4 pb-4 pt-3 space-y-4">
                            {/* Alternative dish selection */}
                            {rawDish.alternatives && rawDish.alternatives.length > 0 && shouldShowAlternatives(rawDish, rawDish.alternatives) && (
                              <div className="pb-4 border-b border-border">
                                <DishAlternatives
                                  primaryDish={rawDish}
                                  alternatives={rawDish.alternatives}
                                  selectedIndex={selectedAlternatives.get(originalIndex) ?? 0}
                                  onSelect={(optionIndex) => handleAlternativeSelect(originalIndex, optionIndex)}
                                />
                              </div>
                            )}

                            {/* Editable macro grid */}
                            <div>
                              <div className="grid grid-cols-5 gap-1.5">
                                {[
                                  { label: "Cal", value: dishItem.calories, unit: "", color: "text-foreground" },
                                  { label: "Protein", value: dishItem.protein_g, unit: "g", color: "text-accent-dim" },
                                  { label: "Carbs", value: dishItem.carbs_g, unit: "g", color: "text-orange" },
                                  { label: "Fat", value: dishItem.fat_g, unit: "g", color: "text-red-500" },
                                  { label: "Fiber", value: dishItem.fiber_g, unit: "g", color: "text-emerald-600" },
                                ].map((m) => (
                                  <div key={m.label} className="rounded-xl border border-border bg-card p-2 text-center">
                                    <p className={`text-sm font-bold ${m.color}`}>{m.value}{m.unit}</p>
                                    <p className="text-[10px] text-muted mt-0.5">{m.label}</p>
                                  </div>
                                ))}
                              </div>
                              <p className="text-[10px] text-muted text-center mt-1.5">Edit calories or weight below — macros adjust proportionally</p>
                            </div>

                            {/* Calorie + weight editors */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-muted font-medium">Calories</span>
                                <CalorieEditor
                                  calories={dishItem.calories}
                                  isOverridden={calorieOverrides.has(originalIndex)}
                                  onChange={(c) => handleCalorieChange(originalIndex, c)}
                                  onReset={() => handleCalorieChange(originalIndex, 0)}
                                />
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-muted font-medium">Portion</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-foreground">{dishItem.portion}</span>
                                </div>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-muted font-medium">Weight</span>
                                <WeightEditor
                                  weight={currentWeight}
                                  onChange={(w) => handleWeightChange(originalIndex, w)}
                                />
                              </div>
                            </div>

                            {/* Key Ingredients */}
                            {dishItem.ingredients.length > 0 && (
                              <div>
                                <p className="text-[10px] uppercase tracking-wider text-muted font-semibold mb-1.5">Key Ingredients</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {dishItem.ingredients.map((ingredient) => (
                                    <span
                                      key={ingredient}
                                      className="rounded-full border border-border bg-background px-2.5 py-1 text-xs text-muted"
                                    >
                                      {ingredient}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Health Tip */}
                            {dishItem.healthTip && (
                              <div className="rounded-xl border border-orange/20 bg-orange-light/50 px-3.5 py-2.5">
                                <p className="text-[10px] uppercase tracking-wider text-orange font-semibold mb-1">Health Tip</p>
                                <p className="text-xs text-foreground leading-relaxed">{dishItem.healthTip}</p>
                              </div>
                            )}

                            {/* Tags */}
                            {tags.length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
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

                            {/* Reasoning */}
                            {dishItem.reasoning && <ReasoningToggle reasoning={dishItem.reasoning} />}

                            {/* Action buttons */}
                            <div className="flex items-center gap-2 pt-1">
                              <CorrectionChip
                                dishIndex={originalIndex}
                                currentName={dishItem.name}
                                isAnalyzing={dish.isAnalyzing}
                                onCorrect={dish.correctDish}
                              />
                              <button
                                onClick={(e) => { e.stopPropagation(); switchToDescribe(dishItem.name); }}
                                className="flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs text-muted hover:text-foreground transition-colors"
                              >
                                <PenLine className="h-3 w-3" />
                                Describe
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleRemoveDish(originalIndex); }}
                                className="ml-auto flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs text-red-500 hover:bg-red-100 transition-colors"
                              >
                                <Trash2 className="h-3 w-3" />
                                Remove
                              </button>
                            </div>

                            {/* Collapse hint */}
                            <button
                              onClick={() => setExpandedDishIndex(null)}
                              className="w-full flex items-center justify-center gap-1 text-[11px] text-muted pt-1"
                            >
                              <ChevronUp className="h-3 w-3" />
                              Collapse
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })}

            {/* F. Log Bar */}
            <div className="rounded-2xl bg-card border border-border px-4 py-3 mt-2 flex items-center gap-2.5">
              <div className="flex-1">
                <p className="text-lg font-extrabold">{scaledTotals.calories} kcal</p>
                <p className="text-xs text-muted">{capitalize(logMealType)} · {scaledDishes.length} dish{scaledDishes.length !== 1 ? "es" : ""}</p>
              </div>
              <button
                onClick={handleLogMeal}
                className={`rounded-xl px-6 py-3 text-sm font-bold transition-all active:scale-95 ${
                  logSuccess
                    ? "bg-accent text-white"
                    : "bg-accent text-white hover:bg-accent/90"
                }`}
              >
                {logSuccess ? "Logged ✓" : "Log Meal"}
              </button>
            </div>

            {/* G. Provider attribution badge */}
            {dish.analysis?.provider && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="flex items-center justify-center gap-1.5 py-2"
              >
                <span className="text-[10px] text-muted/60 font-medium tracking-wide">
                  Analyzed by {getProviderDisplayName(dish.analysis.provider)}
                </span>
              </motion.div>
            )}

            {/* H. Clear link */}
            <button
              onClick={dish.clearAnalysis}
              className="w-full text-center py-2 text-xs text-muted hover:text-foreground transition-colors"
            >
              Clear analysis & re-scan
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
    )}
    </div>
  );
}

/* ─── Sub-components ─── */

function ReasoningToggle({ reasoning }: { reasoning: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <button
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
        className="flex items-center gap-1.5 text-xs text-muted hover:text-foreground transition-colors"
      >
        <Brain className="h-3.5 w-3.5" />
        Why this estimate?
        {isOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <p className="mt-1.5 rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs text-muted leading-relaxed">
              {reasoning}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function WeightEditor({ weight, onChange }: { weight: number; onChange: (w: number) => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputVal, setInputVal] = useState(String(weight));
  const containerRef = useRef<HTMLDivElement>(null);

  if (!isEditing) {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          setInputVal(String(weight));
          setIsEditing(true);
        }}
        className="flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-xs text-muted hover:text-foreground transition-colors"
      >
        <Pencil className="h-3 w-3" />
        {weight}g
      </button>
    );
  }

  const commitAndClose = () => {
    const n = parseInt(inputVal, 10);
    if (n > 0) onChange(n);
    setIsEditing(false);
  };

  return (
    <div ref={containerRef} className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => {
          const next = Math.max(1, weight - 10);
          onChange(next);
          setInputVal(String(next));
        }}
        className="rounded-full border border-border bg-background p-1 text-muted hover:text-foreground"
      >
        <Minus className="h-3 w-3" />
      </button>
      <input
        autoFocus
        type="number"
        value={inputVal}
        onChange={(e) => setInputVal(e.target.value)}
        onBlur={(e) => {
          if (containerRef.current?.contains(e.relatedTarget as Node)) return;
          commitAndClose();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") commitAndClose();
          if (e.key === "Escape") setIsEditing(false);
        }}
        className="w-14 rounded-full border border-accent/30 bg-background px-2 py-1 text-center text-xs font-semibold text-foreground outline-none"
      />
      <span className="text-xs text-muted">g</span>
      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => {
          const next = weight + 10;
          onChange(next);
          setInputVal(String(next));
        }}
        className="rounded-full border border-border bg-background p-1 text-muted hover:text-foreground"
      >
        <Plus className="h-3 w-3" />
      </button>
      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={commitAndClose}
        className="rounded-full border border-border p-1 text-muted hover:text-foreground"
      >
        <Check className="h-3 w-3" />
      </button>
    </div>
  );
}

function CalorieEditor({
  calories,
  isOverridden,
  onChange,
  onReset,
}: {
  calories: number;
  isOverridden: boolean;
  onChange: (c: number) => void;
  onReset: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputVal, setInputVal] = useState(String(calories));
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isEditing) setInputVal(String(calories));
  }, [calories, isEditing]);

  if (!isEditing) {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          setInputVal(String(calories));
          setIsEditing(true);
        }}
        className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-colors ${
          isOverridden
            ? "border-accent/30 bg-accent-light text-accent-dim"
            : "border-border bg-background text-muted hover:text-foreground"
        }`}
      >
        <Pencil className="h-3 w-3" />
        {calories} kcal
      </button>
    );
  }

  const commitAndClose = () => {
    const n = parseInt(inputVal, 10);
    if (n > 0) onChange(n);
    setIsEditing(false);
  };

  return (
    <div ref={containerRef} className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => {
          const next = Math.max(1, calories - 10);
          onChange(next);
          setInputVal(String(next));
        }}
        className="rounded-full border border-border bg-background p-1 text-muted hover:text-foreground"
      >
        <Minus className="h-3 w-3" />
      </button>
      <input
        autoFocus
        type="number"
        value={inputVal}
        onChange={(e) => setInputVal(e.target.value)}
        onBlur={(e) => {
          if (containerRef.current?.contains(e.relatedTarget as Node)) return;
          commitAndClose();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") commitAndClose();
          if (e.key === "Escape") setIsEditing(false);
        }}
        className="w-14 rounded-full border border-accent/30 bg-background px-2 py-1 text-center text-xs font-semibold text-foreground outline-none"
      />
      <span className="text-xs text-muted">kcal</span>
      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => {
          const next = calories + 10;
          onChange(next);
          setInputVal(String(next));
        }}
        className="rounded-full border border-border bg-background p-1 text-muted hover:text-foreground"
      >
        <Plus className="h-3 w-3" />
      </button>
      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={commitAndClose}
        className="rounded-full border border-border p-1 text-muted hover:text-foreground"
      >
        <Check className="h-3 w-3" />
      </button>
      {isOverridden && (
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => { onReset(); setIsEditing(false); }}
          className="rounded-full border border-border p-1 text-muted hover:text-red-500"
          title="Reset to AI estimate"
        >
          <X className="h-3 w-3" />
        </button>
      )}
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
      <div className="flex items-center gap-1.5 text-xs text-muted">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Re-analyzing…
      </div>
    );
  }

  if (!isEditing) {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          setValue(currentName);
          setIsEditing(true);
        }}
        className="flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs text-muted hover:text-foreground transition-colors"
      >
        <RefreshCw className="h-3 w-3" />
        Wrong dish?
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
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
