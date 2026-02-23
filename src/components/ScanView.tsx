"use client";

import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calculator, PlusCircle, Sparkles, Pencil, X, Check, Loader2, Trash2, ChevronDown, ChevronUp, Minus, Plus, Camera, PenLine } from "lucide-react";
import GeminiCameraView from "@/components/GeminiCameraView";
import NutritionCard from "@/components/NutritionCard";
import CapyMascot from "@/components/CapyMascot";
import DescribeMealView from "@/components/DescribeMealView";
import CoachMark from "@/components/CoachMark";
import { MealHealthBanner, HealthCheckButton, HealthProfilePrompt } from "@/components/HealthVerdictCard";
import type { HealthCondition } from "@/lib/dishTypes";
import { useDishScanner } from "@/lib/useDishScanner";
import { useHealthVerdict } from "@/lib/useHealthVerdict";
import type { DishNutrition, MealType, MealTotals, LoggedMeal } from "@/lib/dishTypes";
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

type ScanMode = "camera" | "describe";

export default function ScanView({ logMeal, meals, refreshStreak, onMealLogged, initialMode, coachMarks, healthContextString, hasHealthProfile, healthConditions, onSetupHealthProfile }: ScanViewProps) {
  const dish = useDishScanner();
  const healthVerdict = useHealthVerdict();
  const [mode, setMode] = useState<ScanMode>(initialMode || "camera");
  const [correctionContext, setCorrectionContext] = useState<{ scannedAs: string; mealType: MealType } | undefined>(undefined);

  const [servingsMultiplier, setServingsMultiplier] = useState<number>(1);
  const [logMealType, setLogMealType] = useState<MealType>("lunch");
  const [logSuccess, setLogSuccess] = useState(false);
  const [removedIndices, setRemovedIndices] = useState<Set<number>>(new Set());
  const [weightOverrides, setWeightOverrides] = useState<Map<number, number>>(new Map());
  const [calorieOverrides, setCalorieOverrides] = useState<Map<number, number>>(new Map());
  const [expandedView, setExpandedView] = useState(false);
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
      setExpandedView(false);
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
              className={`rounded-full border px-2 py-1.5 text-[10px] font-semibold capitalize transition-colors ${
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
          <h3 className="text-sm font-extrabold text-foreground">Portion Adjuster</h3>
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
            {/* Plate total with items list */}
            <div className="rounded-2xl bg-accent-light border border-accent/15 p-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-extrabold text-foreground">Plate Total</h3>
                <span className="text-[10px] text-muted">
                  {scaledDishes.length} dish{scaledDishes.length === 1 ? "" : "es"}
                </span>
              </div>
              <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
                <p className="text-xs font-bold text-foreground">🔥 {scaledTotals.calories} kcal</p>
                <p className="text-xs font-bold text-foreground">💪 {scaledTotals.protein}g protein</p>
                <p className="text-xs font-bold text-foreground">🍞 {scaledTotals.carbs}g carbs</p>
                <p className="text-xs font-bold text-foreground">🧈 {scaledTotals.fat}g fat</p>
              </div>
              {/* Items list */}
              <div className="mt-3 pt-3 border-t border-accent/10 space-y-1.5">
                {scaledDishes.map((d, i) => (
                  <div key={`plate-item-${i}`} className="flex items-center justify-between text-xs">
                    <span className="text-foreground">{d.name}</span>
                    <span className="text-muted">{d.calories} kcal · {d.estimated_weight_g}g</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Health verdict: on-demand button or result */}
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

            {/* Expand/Collapse toggle for individual dishes */}
            {scaledDishes.length > 1 && (
              <button
                onClick={() => setExpandedView(!expandedView)}
                className="w-full flex items-center justify-center gap-1.5 rounded-2xl border border-border bg-card py-2.5 text-xs font-bold text-muted hover:text-foreground transition-colors"
              >
                {expandedView ? (
                  <>
                    <ChevronUp className="h-3.5 w-3.5" />
                    Hide individual dishes
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3.5 w-3.5" />
                    Show {scaledDishes.length} dishes · Edit quantities
                  </>
                )}
              </button>
            )}

            {/* Individual dishes — expanded view or single dish always shown */}
            {(expandedView || scaledDishes.length === 1) &&
              activeDishes.map(({ item: rawDish, originalIndex }, displayIndex) => {
                const dishItem = scaledDishes[displayIndex];
                if (!dishItem) return null;
                const tags = deriveTags(dishItem);
                const seenAgo = dishLastSeenDays.get(dishItem.name.toLowerCase());
                const currentWeight = weightOverrides.get(originalIndex) ?? rawDish.estimated_weight_g;
                return (
                  <motion.div
                    key={`${dishItem.name}-${originalIndex}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2"
                  >
                    {typeof seenAgo === "number" && seenAgo > 0 && (
                      <div className="inline-flex items-center rounded-full border border-accent/20 bg-accent-light px-2.5 py-1 text-[10px] text-accent-dim">
                        You had this {seenAgo} day{seenAgo === 1 ? "" : "s"} ago
                      </div>
                    )}
                    <NutritionCard dish={dishItem} servingsMultiplier={1} />

                    {/* Calorie + weight editors + delete row */}
                    <div className="flex items-center gap-2 px-1">
                      <CalorieEditor
                        calories={dishItem.calories}
                        isOverridden={calorieOverrides.has(originalIndex)}
                        onChange={(c) => handleCalorieChange(originalIndex, c)}
                        onReset={() => handleCalorieChange(originalIndex, 0)}
                      />
                      <WeightEditor
                        weight={currentWeight}
                        onChange={(w) => handleWeightChange(originalIndex, w)}
                      />
                      <CorrectionChip
                        dishIndex={originalIndex}
                        currentName={dishItem.name}
                        isAnalyzing={dish.isAnalyzing}
                        onCorrect={dish.correctDish}
                      />
                      <button
                        onClick={() => switchToDescribe(dishItem.name)}
                        className="flex items-center gap-1 px-1 text-[10px] text-muted-light hover:text-accent transition-colors"
                      >
                        <PenLine className="h-3 w-3" />
                        Describe instead
                      </button>
                      <button
                        onClick={() => handleRemoveDish(originalIndex)}
                        className="ml-auto flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2 py-1 text-[10px] text-red-500 hover:bg-red-100 transition-colors"
                      >
                        <Trash2 className="h-3 w-3" />
                        Remove
                      </button>
                    </div>

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
                  </motion.div>
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
                  className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-all active:scale-95 ${
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
    </>
    )}
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
        onClick={() => {
          setInputVal(String(weight));
          setIsEditing(true);
        }}
        className="flex items-center gap-1 rounded-full border border-border bg-background px-2 py-1 text-[10px] text-muted hover:text-foreground transition-colors"
      >
        <Pencil className="h-2.5 w-2.5" />
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
    <div ref={containerRef} className="flex items-center gap-1">
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
        className="w-14 rounded-full border border-accent/30 bg-background px-2 py-1 text-center text-[10px] font-semibold text-foreground outline-none"
      />
      <span className="text-[10px] text-muted">g</span>
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
        onClick={() => {
          setInputVal(String(calories));
          setIsEditing(true);
        }}
        className={`flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] transition-colors ${
          isOverridden
            ? "border-accent/30 bg-accent-light text-accent-dim"
            : "border-border bg-background text-muted hover:text-foreground"
        }`}
      >
        <Pencil className="h-2.5 w-2.5" />
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
    <div ref={containerRef} className="flex items-center gap-1">
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
        className="w-14 rounded-full border border-accent/30 bg-background px-2 py-1 text-center text-[10px] font-semibold text-foreground outline-none"
      />
      <span className="text-[10px] text-muted">kcal</span>
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
