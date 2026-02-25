"use client";

import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Loader2,
  AlertTriangle,
  Pencil,
  Check,
  X,
  Heart,
  Minus,
  Plus,
  ChevronDown,
  ChevronUp,
  Brain,
  PenLine,
} from "lucide-react";
import CapyMascot from "@/components/CapyMascot";
import { MealHealthBanner, HealthCheckButton, HealthProfilePrompt } from "@/components/HealthVerdictCard";
import { useDescribeMeal } from "@/lib/useDescribeMeal";
import { useHealthVerdict } from "@/lib/useHealthVerdict";
import type { DishNutrition, MealTotals, MealType, LoggedMeal, DescribedDish, HealthCondition, ConfidenceLevel } from "@/lib/dishTypes";

/* ─── Props ─── */

interface DescribeMealViewProps {
  logMeal: (input: {
    mealType: MealType;
    servingsMultiplier: number;
    dishes: DishNutrition[];
    totals: MealTotals;
  }) => LoggedMeal;
  refreshStreak: () => void;
  onMealLogged?: () => void;
  correctionContext?: { scannedAs: string; mealType: MealType };
  healthContextString?: string;
  hasHealthProfile?: boolean;
  healthConditions?: HealthCondition[];
  onSetupHealthProfile?: () => void;
}

/* ─── Constants ─── */

const MEAL_TYPE_OPTIONS: MealType[] = ["breakfast", "lunch", "snack", "dinner"];

function titleCaseTag(tag: string): string {
  return tag
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
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

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
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

/* ─── Sub-components ─── */

function PortionPicker({
  dish,
  dishIndex,
  selectedIndex,
  onSelect,
}: {
  dish: DescribedDish;
  dishIndex: number;
  selectedIndex: number;
  onSelect: (dishIndex: number, portionIndex: number) => void;
}) {
  return (
    <div>
      <p className="text-[10px] font-bold text-muted mb-1.5">How much?</p>
      <div className="grid grid-cols-3 gap-1.5">
        {dish.portions.map((portion, pIdx) => {
          const isSelected = pIdx === selectedIndex;
          return (
            <button
              key={pIdx}
              onClick={(e) => { e.stopPropagation(); onSelect(dishIndex, pIdx); }}
              className={`rounded-xl border p-2.5 text-center transition-all active:scale-[0.97] ${
                isSelected
                  ? "border-accent/30 bg-accent-light"
                  : "border-border bg-background hover:bg-card-hover"
              }`}
            >
              <p className={`text-[11px] font-bold ${isSelected ? "text-accent-dim" : "text-foreground"}`}>
                {portion.label.replace(/\s*\(.*?\)\s*/g, "")}
              </p>
              <p className="text-[9px] text-muted-light mt-0.5">
                {portion.label.match(/\(([^)]+)\)/)?.[1] || `~${portion.weight_g}g`}
              </p>
              <p className={`text-[10px] font-bold mt-1 ${isSelected ? "text-accent-dim" : "text-muted"}`}>
                {portion.calories} kcal
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DescribeCalorieEditor({
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
      <div className="flex items-center gap-2">
        <button
          onClick={(e) => { e.stopPropagation(); setInputVal(String(calories)); setIsEditing(true); }}
          className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold transition-colors ${
            isOverridden
              ? "border-accent/30 bg-accent-light text-accent-dim"
              : "border-border bg-background text-muted hover:text-foreground"
          }`}
        >
          <Pencil className="h-2.5 w-2.5" />
          Edit calories
        </button>
        {isOverridden && (
          <button
            onClick={(e) => { e.stopPropagation(); onReset(); }}
            className="text-[10px] text-muted hover:text-red-500 transition-colors"
          >
            Reset
          </button>
        )}
      </div>
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

function DishNameEditor({
  currentName,
  onCommit,
  onCancel,
}: {
  currentName: string;
  onCommit: (newName: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(currentName);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (trimmed && trimmed.toLowerCase() !== currentName.toLowerCase()) {
      onCommit(trimmed);
    } else {
      onCancel();
    }
  };

  return (
    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSubmit();
          if (e.key === "Escape") onCancel();
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
        onClick={onCancel}
        className="rounded-full border border-border p-1.5 text-muted hover:text-foreground transition-colors"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

/* ─── Main Component ─── */

export default function DescribeMealView({
  logMeal,
  refreshStreak,
  onMealLogged,
  correctionContext,
  healthContextString,
  hasHealthProfile,
  healthConditions,
  onSetupHealthProfile,
}: DescribeMealViewProps) {
  const dm = useDescribeMeal();
  const healthVerdict = useHealthVerdict();
  const [logSuccess, setLogSuccess] = useState(false);
  const [editingDishIndex, setEditingDishIndex] = useState<number | null>(null);
  const [expandedDishIndex, setExpandedDishIndex] = useState<number | null>(null);
  const [calorieOverrides, setCalorieOverrides] = useState<Map<number, number>>(new Map());
  const resultsRef = useRef<HTMLDivElement>(null);

  const handleCalorieChange = useCallback((dishIndex: number, newCal: number) => {
    setCalorieOverrides((prev) => {
      const next = new Map(prev);
      if (newCal <= 0) {
        next.delete(dishIndex);
      } else {
        next.set(dishIndex, newCal);
      }
      return next;
    });
  }, []);

  const finalDishes = useMemo(() => {
    return dm.scaledDishes.map((dish, i) => {
      const overrideCal = calorieOverrides.get(i);
      if (overrideCal === undefined || dish.calories <= 0) return dish;
      const ratio = overrideCal / dish.calories;
      return {
        ...dish,
        calories: overrideCal,
        protein_g: Math.round(dish.protein_g * ratio),
        carbs_g: Math.round(dish.carbs_g * ratio),
        fat_g: Math.round(dish.fat_g * ratio),
        fiber_g: Math.round(dish.fiber_g * ratio),
        estimated_weight_g: Math.round(dish.estimated_weight_g * ratio),
      };
    });
  }, [dm.scaledDishes, calorieOverrides]);

  const finalTotals = useMemo(() => {
    return finalDishes.reduce(
      (acc, d) => ({
        calories: acc.calories + d.calories,
        protein: acc.protein + d.protein_g,
        carbs: acc.carbs + d.carbs_g,
        fat: acc.fat + d.fat_g,
        fiber: acc.fiber + d.fiber_g,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
    );
  }, [finalDishes]);

  // Pre-fill from correction context
  useEffect(() => {
    if (correctionContext) {
      dm.setMealType(correctionContext.mealType);
    }
  }, [correctionContext]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll to results + reset overrides
  useEffect(() => {
    if (dm.result && dm.result.dishes.length > 0) {
      setCalorieOverrides(new Map());
      setExpandedDishIndex(dm.result.dishes.length === 1 ? 0 : null);
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 200);
    }
  }, [dm.result]);

  // On-demand health verdict trigger
  const triggerHealthCheck = useCallback(() => {
    if (!dm.result || !healthContextString || dm.result.dishes.length === 0) return;
    const dishInputs = dm.result.dishes.map((d) => {
      const portion = d.portions[dm.selectedPortions.get(0) ?? d.defaultIndex ?? 1] ?? d.portions[1] ?? d.portions[0];
      return {
        name: d.name,
        calories: portion.calories,
        protein_g: portion.protein_g,
        carbs_g: portion.carbs_g,
        fat_g: portion.fat_g,
        fiber_g: portion.fiber_g,
        ingredients: d.ingredients,
        tags: d.tags,
      };
    });
    healthVerdict.fetchVerdict(dishInputs, healthContextString);
  }, [dm.result, healthContextString]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLogMeal = () => {
    if (finalDishes.length === 0) return;
    logMeal({
      mealType: dm.mealType,
      servingsMultiplier: 1,
      dishes: finalDishes,
      totals: finalTotals,
    });
    setLogSuccess(true);
    refreshStreak();
    setTimeout(() => {
      setLogSuccess(false);
      dm.clear();
      onMealLogged?.();
    }, 1200);
  };

  const handleEditDishName = (newDescription: string) => {
    dm.setDescription(newDescription);
    setEditingDishIndex(null);
  };

  const capyMood = finalTotals.calories < 400 ? "happy" : finalTotals.calories > 700 ? "concerned" : "motivated";
  const capyMessage = finalTotals.calories < 400
    ? "Light and healthy! Great choice!"
    : finalTotals.calories > 700
    ? "That's a big meal! Maybe balance it out later?"
    : "Solid meal! Good balance of nutrients!";

  return (
    <div className="space-y-3">
      {/* Correction banner */}
      {correctionContext && (
        <div className="flex items-center gap-2 rounded-2xl bg-orange-light border border-orange/20 px-3 py-2.5">
          <AlertTriangle className="h-4 w-4 text-orange shrink-0" />
          <p className="text-[11px] text-orange-dim font-semibold leading-snug">
            Camera scanned this as <strong>&ldquo;{correctionContext.scannedAs}&rdquo;</strong> — describe what it actually is below
          </p>
        </div>
      )}

      {/* Text input */}
      <div className="rounded-2xl bg-card border border-border p-3">
        <p className="text-[10px] font-bold text-muted-light uppercase tracking-wide mb-2">
          What did you have?
        </p>
        <textarea
          value={dm.description}
          onChange={(e) => dm.setDescription(e.target.value)}
          placeholder='e.g. "2 rotis with dal and salad" or "handful of peanuts and black coffee"'
          rows={3}
          className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-[13px] text-foreground placeholder:text-muted-light outline-none focus:border-accent/40 resize-none leading-relaxed transition-colors"
        />
        <p className="text-right text-[10px] text-muted-light mt-1">
          {dm.description.length} / {dm.maxChars}
        </p>
      </div>

      {/* Meal type pills — inline strip (matches ScanView controls) */}
      <div className="flex gap-1.5 overflow-x-auto pb-0.5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {MEAL_TYPE_OPTIONS.map((option) => (
          <button
            key={option}
            onClick={() => dm.setMealType(option)}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
              dm.mealType === option
                ? "border-accent/30 bg-accent-light text-accent-dim"
                : "border-border bg-background text-muted hover:bg-card-hover"
            }`}
          >
            {capitalize(option)}
          </button>
        ))}
      </div>

      {/* Analyze button */}
      <button
        onClick={dm.analyze}
        disabled={!dm.description.trim() || dm.isAnalyzing}
        className="w-full flex items-center justify-center gap-2 rounded-2xl bg-accent px-4 py-3.5 text-[13px] font-extrabold text-white transition-all hover:bg-accent-dim active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {dm.isAnalyzing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Understanding your meal...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            {correctionContext ? "Re-estimate Nutrition" : "Estimate Nutrition"}
          </>
        )}
      </button>

      {/* Error */}
      <AnimatePresence>
        {dm.error && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-start gap-2 rounded-2xl bg-red-50 border border-red-200 px-3 py-2.5"
          >
            <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
            <p className="text-xs text-red-600 font-medium leading-snug">{dm.error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <div ref={resultsRef} />
      <AnimatePresence mode="popLayout">
        {dm.result && dm.result.dishes.length > 0 && (
          <motion.div
            key="describe-results"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="space-y-3"
          >
            {/* B. Plate Total — centered, large (matches ScanView) */}
            <div className="rounded-2xl bg-card border border-border p-5 text-center">
              <p className="text-xs text-muted font-semibold uppercase tracking-wider mb-1">Plate Total</p>
              <div>
                <span className="text-5xl font-black tracking-tighter leading-none">{finalTotals.calories}</span>
                <span className="text-base font-medium text-muted ml-1">kcal</span>
              </div>
              <p className="text-xs text-muted mt-1">
                {finalDishes.length} dish{finalDishes.length !== 1 ? "es" : ""} · {capitalize(dm.mealType)}
              </p>
              <div className="flex justify-center gap-5 mt-4">
                <MacroStat label="Protein" value={finalTotals.protein} color="text-accent-dim" />
                <MacroStat label="Carbs" value={finalTotals.carbs} color="text-orange" />
                <MacroStat label="Fat" value={finalTotals.fat} color="text-red-500" />
                <MacroStat label="Fiber" value={finalTotals.fiber} color="text-emerald-600" />
              </div>
            </div>

            {/* C. Health verdict: on-demand button or result */}
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

            {/* E. Accordion Dish Cards */}
            {dm.result.dishes.map((dish, i) => {
              const dishItem = finalDishes[i];
              if (!dishItem) return null;
              const isExpanded = expandedDishIndex === i;
              const note = generateDishNote(dishItem);
              const selectedPortionIdx = dm.selectedPortions.get(i) ?? dish.defaultIndex ?? 1;
              const tags = deriveTags(dishItem);

              return (
                <motion.div
                  key={`${dish.name}-${i}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                >
                  <div className={`rounded-2xl border border-border overflow-hidden transition-colors relative ${isExpanded ? "bg-[#fdfcfa]" : "bg-card"}`}>
                    {/* Confidence dot — bottom right of card (collapsed only) */}
                    {!isExpanded && (
                      <div className="absolute bottom-3 right-3.5">
                        <ConfidenceDot level={dishItem.confidence} />
                      </div>
                    )}

                    {/* Collapsed header — always visible */}
                    <button
                      onClick={() => setExpandedDishIndex(isExpanded ? null : i)}
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

                      {/* Row 3: contextual note */}
                      {note && (
                        <p className={`mt-2.5 text-xs leading-relaxed ${
                          note.type === "warning" ? "text-amber-600" : "text-accent-dim"
                        }`}>
                          {note.type === "warning" ? "⚠ " : "✓ "}{note.text}
                        </p>
                      )}

                      {/* Row 4: expand hint */}
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
                            {/* 5-column macro grid */}
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
                              <p className="text-[10px] text-muted text-center mt-1.5">Edit calories below — macros adjust proportionally</p>
                            </div>

                            {/* Calorie editor */}
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted font-medium">Calories</span>
                              <DescribeCalorieEditor
                                calories={dishItem.calories}
                                isOverridden={calorieOverrides.has(i)}
                                onChange={(c) => handleCalorieChange(i, c)}
                                onReset={() => handleCalorieChange(i, 0)}
                              />
                            </div>

                            {/* Portion picker */}
                            <PortionPicker
                              dish={dish}
                              dishIndex={i}
                              selectedIndex={selectedPortionIdx}
                              onSelect={(dIdx, pIdx) => {
                                dm.selectPortion(dIdx, pIdx);
                                setCalorieOverrides((prev) => { const next = new Map(prev); next.delete(dIdx); return next; });
                              }}
                            />

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

                            {/* Health Tip */}
                            {dish.healthTip && (
                              <div className="rounded-xl border border-orange/20 bg-orange-light/50 px-3.5 py-2.5">
                                <p className="text-[10px] uppercase tracking-wider text-orange font-semibold mb-1">Health Tip</p>
                                <p className="text-xs text-foreground leading-relaxed">{dish.healthTip}</p>
                              </div>
                            )}

                            {/* Reasoning */}
                            {dish.reasoning && <ReasoningToggle reasoning={dish.reasoning} />}

                            {/* Wrong dish? action */}
                            <div className="flex items-center gap-2 pt-1">
                              {editingDishIndex === i ? (
                                <DishNameEditor
                                  currentName={dish.name}
                                  onCommit={(newName) => {
                                    const corrected = dm.description.replace(
                                      new RegExp(dish.name, "i"),
                                      newName
                                    );
                                    handleEditDishName(corrected !== dm.description ? corrected : `${dm.description} (${newName})`);
                                  }}
                                  onCancel={() => setEditingDishIndex(null)}
                                />
                              ) : (
                                <button
                                  onClick={(e) => { e.stopPropagation(); setEditingDishIndex(i); }}
                                  className="flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs text-muted hover:text-foreground transition-colors"
                                >
                                  <PenLine className="h-3 w-3" />
                                  Wrong dish?
                                </button>
                              )}
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

            {/* F. Log Bar — card style (matches ScanView) */}
            <div className="rounded-2xl bg-card border border-border px-4 py-3 mt-2 flex items-center gap-2.5">
              <div className="flex-1">
                <p className="text-lg font-extrabold">{finalTotals.calories} kcal</p>
                <p className="text-xs text-muted">{capitalize(dm.mealType)} · {finalDishes.length} dish{finalDishes.length !== 1 ? "es" : ""}</p>
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

            {/* G. Clear & re-describe link */}
            <button
              onClick={() => dm.clear()}
              className="w-full text-center py-2 text-xs text-muted hover:text-foreground transition-colors"
            >
              Clear & re-describe
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state when no results yet and not analyzing */}
      {!dm.result && !dm.isAnalyzing && !dm.error && (
        <div className="rounded-2xl bg-card border border-border py-8 px-6 text-center">
          <Sparkles className="h-6 w-6 text-accent/40 mx-auto" />
          <p className="text-sm font-semibold text-muted mt-3">Describe what you ate</p>
          <p className="text-xs text-muted-light mt-1 leading-relaxed max-w-[260px] mx-auto">
            Type a description like &ldquo;2 rotis with dal&rdquo; or &ldquo;black coffee with tonic water&rdquo; and AI will estimate the nutrition.
          </p>
        </div>
      )}
    </div>
  );
}
