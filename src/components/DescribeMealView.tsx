"use client";

import { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  PlusCircle,
  Loader2,
  AlertTriangle,
  Pencil,
  Check,
  X,
  Flame,
  Dumbbell,
  Wheat,
  Droplets,
  Heart,
} from "lucide-react";
import { MealHealthBanner } from "@/components/HealthVerdictCard";
import { useDescribeMeal } from "@/lib/useDescribeMeal";
import { useHealthVerdict } from "@/lib/useHealthVerdict";
import type { DishNutrition, MealTotals, MealType, LoggedMeal, DescribedDish } from "@/lib/dishTypes";

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
              onClick={() => onSelect(dishIndex, pIdx)}
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

function DishResultCard({
  dish,
  dishIndex,
  selectedPortionIndex,
  onSelectPortion,
}: {
  dish: DescribedDish;
  dishIndex: number;
  selectedPortionIndex: number;
  onSelectPortion: (dishIndex: number, portionIndex: number) => void;
}) {
  const [showReasoning, setShowReasoning] = useState(false);
  const portion = dish.portions[selectedPortionIndex] ?? dish.portions[1] ?? dish.portions[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-card border border-border p-4 space-y-3"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h4 className="text-sm font-extrabold text-foreground">{dish.name}</h4>
          {dish.hindi && (
            <p className="text-[10px] text-muted-light mt-0.5">{dish.hindi}</p>
          )}
        </div>
        {dish.confidence === "low" && (
          <span className="shrink-0 rounded-full bg-orange-light border border-orange/20 px-2 py-0.5 text-[9px] font-bold text-orange">
            Low confidence
          </span>
        )}
      </div>

      {/* Macro row */}
      <div className="grid grid-cols-4 gap-1.5">
        <div className="rounded-lg bg-background p-2 text-center">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <Flame className="h-3 w-3 text-accent" />
          </div>
          <p className="text-xs font-extrabold text-foreground">{portion.calories}</p>
          <p className="text-[9px] text-muted-light">kcal</p>
        </div>
        <div className="rounded-lg bg-background p-2 text-center">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <Dumbbell className="h-3 w-3 text-orange" />
          </div>
          <p className="text-xs font-extrabold text-foreground">{portion.protein_g}g</p>
          <p className="text-[9px] text-muted-light">Protein</p>
        </div>
        <div className="rounded-lg bg-background p-2 text-center">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <Wheat className="h-3 w-3" style={{ color: "#E8B931" }} />
          </div>
          <p className="text-xs font-extrabold text-foreground">{portion.carbs_g}g</p>
          <p className="text-[9px] text-muted-light">Carbs</p>
        </div>
        <div className="rounded-lg bg-background p-2 text-center">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <Droplets className="h-3 w-3 text-amber-600" />
          </div>
          <p className="text-xs font-extrabold text-foreground">{portion.fat_g}g</p>
          <p className="text-[9px] text-muted-light">Fat</p>
        </div>
      </div>

      {/* Portion picker */}
      <PortionPicker
        dish={dish}
        dishIndex={dishIndex}
        selectedIndex={selectedPortionIndex}
        onSelect={onSelectPortion}
      />

      {/* Tags */}
      {dish.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {dish.tags.map((tag) => (
            <span
              key={tag}
              className={`rounded-full border px-2 py-0.5 text-[9px] font-semibold ${getHealthTagColor(tag)}`}
            >
              {titleCaseTag(tag)}
            </span>
          ))}
        </div>
      )}

      {/* Health tip */}
      {dish.healthTip && (
        <div className="flex items-start gap-1.5 rounded-lg bg-accent-light p-2">
          <Heart className="h-3 w-3 text-accent-dim shrink-0 mt-0.5" />
          <p className="text-[10px] text-accent-dim leading-relaxed">{dish.healthTip}</p>
        </div>
      )}

      {/* Reasoning toggle */}
      {dish.reasoning && (
        <button
          onClick={() => setShowReasoning((v) => !v)}
          className="text-[10px] text-muted-light hover:text-muted transition-colors"
        >
          {showReasoning ? "Hide reasoning" : "How was this estimated?"}
        </button>
      )}
      <AnimatePresence>
        {showReasoning && dish.reasoning && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="text-[10px] text-muted-light leading-relaxed rounded-lg bg-background p-2 italic"
          >
            {dish.reasoning}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
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
    <div className="flex items-center gap-1.5">
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
}: DescribeMealViewProps) {
  const dm = useDescribeMeal();
  const healthVerdict = useHealthVerdict();
  const [logSuccess, setLogSuccess] = useState(false);
  const [editingDishIndex, setEditingDishIndex] = useState<number | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Pre-fill from correction context
  useEffect(() => {
    if (correctionContext) {
      dm.setMealType(correctionContext.mealType);
    }
  }, [correctionContext]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll to results
  useEffect(() => {
    if (dm.result && dm.result.dishes.length > 0) {
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 200);
    }
  }, [dm.result]);

  // Auto-trigger health verdict (pass 2) when describe results arrive
  useEffect(() => {
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
    if (dm.scaledDishes.length === 0) return;
    logMeal({
      mealType: dm.mealType,
      servingsMultiplier: 1,
      dishes: dm.scaledDishes,
      totals: dm.scaledTotals,
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
    // Re-analyze with the corrected description appended
    dm.setDescription(newDescription);
    setEditingDishIndex(null);
    // User will need to tap Analyze again
  };

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

      {/* Meal type */}
      <div className="rounded-2xl bg-card border border-border p-3">
        <p className="text-[10px] font-bold text-muted-light uppercase tracking-wide mb-2">
          Meal context
        </p>
        <div className="grid grid-cols-4 gap-1.5">
          {MEAL_TYPE_OPTIONS.map((option) => (
            <button
              key={option}
              onClick={() => dm.setMealType(option)}
              className={`rounded-full border px-2 py-1.5 text-[10px] font-semibold capitalize transition-colors ${
                dm.mealType === option
                  ? "border-accent/30 bg-accent-light text-accent-dim"
                  : "border-border bg-background text-muted hover:bg-card-hover"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
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
            {correctionContext ? "Re-analyze with AI" : "Analyze with AI"}
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
            {/* Dish cards */}
            {dm.result.dishes.map((dish, i) => (
              <div key={`${dish.name}-${i}`} className="space-y-1.5">
                <DishResultCard
                  dish={dish}
                  dishIndex={i}
                  selectedPortionIndex={dm.selectedPortions.get(i) ?? dish.defaultIndex ?? 1}
                  onSelectPortion={dm.selectPortion}
                />
                {/* Edit dish name */}
                {editingDishIndex === i ? (
                  <div className="px-1">
                    <DishNameEditor
                      currentName={dish.name}
                      onCommit={(newName) => {
                        // Append correction to description and re-analyze
                        const corrected = dm.description.replace(
                          new RegExp(dish.name, "i"),
                          newName
                        );
                        handleEditDishName(corrected !== dm.description ? corrected : `${dm.description} (${newName})`);
                      }}
                      onCancel={() => setEditingDishIndex(null)}
                    />
                  </div>
                ) : (
                  <button
                    onClick={() => setEditingDishIndex(i)}
                    className="flex items-center gap-1 px-1 text-[10px] text-muted-light hover:text-muted transition-colors"
                  >
                    <Pencil className="h-3 w-3" />
                    Wrong dish?
                  </button>
                )}
              </div>
            ))}

            {/* Health verdict banner */}
            <MealHealthBanner
              analysis={healthVerdict.verdict}
              isLoading={healthVerdict.status === "loading"}
              error={healthVerdict.error}
              hasHealthProfile={!!hasHealthProfile}
            />

            {/* Total bar */}
            <div className="rounded-2xl bg-accent-light border border-accent/15 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-foreground">
                    Plate Total
                    {dm.scaledDishes.length > 1 && (
                      <span className="text-muted font-normal ml-1">
                        — {dm.scaledDishes.length} items
                      </span>
                    )}
                  </h3>
                  <p className="text-[10px] text-muted mt-0.5">
                    {dm.scaledTotals.protein}g protein · {dm.scaledTotals.carbs}g carbs · {dm.scaledTotals.fat}g fat
                  </p>
                </div>
                <p className="text-lg font-black text-accent-dim">{dm.scaledTotals.calories} kcal</p>
              </div>
            </div>

            {/* Log button */}
            <button
              onClick={handleLogMeal}
              disabled={logSuccess}
              className={`w-full flex items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-[13px] font-extrabold transition-all active:scale-[0.98] ${
                logSuccess
                  ? "bg-accent text-white"
                  : "bg-accent-light border border-accent/20 text-accent-dim hover:bg-accent/15"
              }`}
            >
              <PlusCircle className="h-4 w-4" />
              {logSuccess ? "Logged" : "Log This Meal"}
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
