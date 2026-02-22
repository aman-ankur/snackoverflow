"use client";

import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Trash2, Camera, Check, Minus, Plus, UtensilsCrossed, StickyNote, ShieldCheck } from "lucide-react";
import type { LoggedMeal, MealType, DishNutrition } from "@/lib/dishTypes";
import { getMealHealthRating } from "@/lib/healthRating";

const MEAL_TYPE_OPTIONS: MealType[] = ["breakfast", "lunch", "snack", "dinner"];
const SERVING_OPTIONS = [0.5, 1, 1.5, 2];

type MacroKey = "calories" | "protein_g" | "carbs_g" | "fat_g" | "fiber_g";

const MACRO_CHIPS: { key: MacroKey; label: string; unit: string; color: string; bg: string }[] = [
  { key: "protein_g", label: "Protein", unit: "g", color: "text-green-600", bg: "bg-green-50" },
  { key: "carbs_g", label: "Carbs", unit: "g", color: "text-orange-500", bg: "bg-orange-50" },
  { key: "fat_g", label: "Fat", unit: "g", color: "text-violet-500", bg: "bg-violet-50" },
  { key: "fiber_g", label: "Fiber", unit: "g", color: "text-cyan-500", bg: "bg-cyan-50" },
];

const HEALTH_BADGE_STYLES: Record<string, string> = {
  healthy: "bg-green-50 text-green-600",
  balanced: "bg-blue-50 text-blue-500",
  moderate: "bg-yellow-50 text-yellow-600",
  heavy: "bg-orange-50 text-orange-500",
};

interface MealDetailOverlayProps {
  meal: LoggedMeal;
  mealIndex: number;
  onClose: () => void;
  onUpdateMeal: (mealId: string, updates: Partial<Pick<LoggedMeal, "mealType" | "servingsMultiplier" | "notes">>) => void;
  onUpdateDish: (mealId: string, dishIndex: number, updatedDish: DishNutrition) => void;
  onRemoveDish: (mealId: string, dishIndex: number) => void;
  onRemoveMeal: (mealId: string) => void;
  onMoveMealToType: (mealId: string, newMealType: MealType) => void;
  onRescan: (mealType: MealType) => void;
  refreshStreak: () => void;
}

export default function MealDetailOverlay({
  meal,
  mealIndex,
  onClose,
  onUpdateMeal,
  onUpdateDish,
  onRemoveDish,
  onRemoveMeal,
  onMoveMealToType,
  onRescan,
  refreshStreak,
}: MealDetailOverlayProps) {
  const [localMealType, setLocalMealType] = useState<MealType>(meal.mealType);
  const [localNotes, setLocalNotes] = useState(meal.notes || "");
  const [confirmDeleteMeal, setConfirmDeleteMeal] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const time = new Date(meal.loggedAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const healthBadge = useMemo(() => getMealHealthRating(meal.totals), [meal.totals]);

  const handleMealTypeChange = useCallback((newType: MealType) => {
    setLocalMealType(newType);
    setHasChanges(true);
  }, []);

  const handleNotesChange = useCallback((value: string) => {
    setLocalNotes(value);
    setHasChanges(true);
  }, []);

  const markChanged = useCallback(() => {
    setHasChanges(true);
  }, []);

  const handleSave = useCallback(() => {
    if (localMealType !== meal.mealType) {
      onMoveMealToType(meal.id, localMealType);
    }
    if (localNotes !== (meal.notes || "")) {
      onUpdateMeal(meal.id, { notes: localNotes || undefined });
    }
    refreshStreak();
    setHasChanges(false);
    onClose();
  }, [meal, localMealType, localNotes, onMoveMealToType, onUpdateMeal, refreshStreak, onClose]);

  const handleDeleteMeal = useCallback(() => {
    onRemoveMeal(meal.id);
    refreshStreak();
    onClose();
  }, [meal.id, onRemoveMeal, refreshStreak, onClose]);

  const handleRescan = useCallback(() => {
    onRescan(localMealType);
  }, [localMealType, onRescan]);

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 28, stiffness: 300 }}
      className="fixed inset-0 z-[90] bg-background overflow-y-auto"
    >
      {/* Header — no save button */}
      <div className="sticky top-0 z-10 border-b border-border bg-card">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors active:scale-95 w-12"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <div className="flex flex-col items-center gap-1">
            <h2 className="text-sm font-extrabold text-foreground capitalize">
              {meal.mealType} #{mealIndex} · {time}
            </h2>
            <span
              className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full ${
                HEALTH_BADGE_STYLES[healthBadge.rating] || "bg-gray-100 text-gray-500"
              }`}
            >
              <ShieldCheck className="h-2.5 w-2.5" />
              {healthBadge.label}
            </span>
          </div>
          <div className="w-12" />
        </div>
      </div>

      <div className="mx-auto max-w-lg px-4 py-4 pb-24 space-y-4">
        {/* Meal type selector */}
        <div className="rounded-2xl border border-border bg-card p-4">
          <h4 className="text-xs font-extrabold text-foreground mb-3 flex items-center gap-1.5">
            <UtensilsCrossed className="h-3.5 w-3.5 text-muted" /> Meal Type
          </h4>
          <div className="grid grid-cols-4 gap-1.5">
            {MEAL_TYPE_OPTIONS.map((type) => (
              <button
                key={type}
                onClick={() => handleMealTypeChange(type)}
                className={`rounded-full border px-2 py-2 text-[11px] font-bold capitalize transition-colors ${
                  localMealType === type
                    ? "border-accent/30 bg-accent-light text-accent-dim"
                    : "border-border bg-background text-muted hover:bg-card-hover"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Per-dish cards */}
        {meal.dishes.map((dish, dishIndex) => (
          <DishEditCard
            key={`${meal.id}-dish-${dishIndex}`}
            dish={dish}
            mealId={meal.id}
            dishIndex={dishIndex}
            onUpdateDish={onUpdateDish}
            onRemoveDish={onRemoveDish}
            refreshStreak={refreshStreak}
            markChanged={markChanged}
          />
        ))}

        {/* Notes */}
        <div className="rounded-2xl border border-border bg-card p-4">
          <h4 className="text-xs font-extrabold text-foreground mb-3 flex items-center gap-1.5">
            <StickyNote className="h-3.5 w-3.5 text-muted" /> Notes
          </h4>
          <textarea
            value={localNotes}
            onChange={(e) => handleNotesChange(e.target.value)}
            placeholder="Add notes about this meal... (e.g. 'homemade sourdough', 'felt great after')"
            className="w-full min-h-[80px] rounded-xl border border-border bg-background px-3 py-2.5 text-xs text-foreground placeholder:text-muted-light resize-y focus:outline-none focus:ring-1 focus:ring-accent/30"
          />
        </div>

        {/* Bottom actions */}
        <div className="flex flex-col gap-2 mt-1">
          <button
            onClick={hasChanges ? handleSave : undefined}
            className={`w-full rounded-2xl p-3.5 flex items-center justify-center gap-2 text-sm font-bold transition-all active:scale-[0.98] ${
              hasChanges
                ? "bg-accent text-white"
                : "bg-card border border-border text-muted-light opacity-50 cursor-default"
            }`}
          >
            <Check className="h-4 w-4" />
            Save Changes
          </button>

          <button
            onClick={handleRescan}
            className="w-full rounded-2xl border border-dashed border-accent/40 bg-accent-light p-3.5 flex items-center justify-center gap-2 text-sm font-bold text-accent-dim hover:bg-accent/15 transition-colors active:scale-[0.98]"
          >
            <Camera className="h-4 w-4" />
            Re-scan This Meal
          </button>

          {confirmDeleteMeal ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-center space-y-3">
              <p className="text-sm font-bold text-red-600">Delete this entire meal?</p>
              <p className="text-xs text-red-400">This cannot be undone.</p>
              <div className="flex gap-2 justify-center">
                <button
                  onClick={handleDeleteMeal}
                  className="rounded-full border border-red-300 bg-red-500 px-4 py-2 text-xs font-bold text-white hover:bg-red-600 transition-colors active:scale-95"
                >
                  Yes, Delete
                </button>
                <button
                  onClick={() => setConfirmDeleteMeal(false)}
                  className="rounded-full border border-border bg-background px-4 py-2 text-xs font-bold text-muted hover:bg-card-hover transition-colors active:scale-95"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDeleteMeal(true)}
              className="w-full rounded-2xl border border-red-200 bg-red-50 p-3.5 text-sm font-bold text-red-500 hover:bg-red-100 transition-colors active:scale-[0.98]"
            >
              Delete Entire Meal
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ── Per-dish edit card ─────────────────────────────────────────────── */

function DishEditCard({
  dish,
  mealId,
  dishIndex,
  onUpdateDish,
  onRemoveDish,
  refreshStreak,
  markChanged,
}: {
  dish: DishNutrition;
  mealId: string;
  dishIndex: number;
  onUpdateDish: (mealId: string, dishIndex: number, updatedDish: DishNutrition) => void;
  onRemoveDish: (mealId: string, dishIndex: number) => void;
  refreshStreak: () => void;
  markChanged: () => void;
}) {
  const [localDish, setLocalDish] = useState<DishNutrition>({ ...dish });
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editingMacro, setEditingMacro] = useState<MacroKey | null>(null);

  const updateField = useCallback(
    (field: MacroKey, value: number) => {
      const updated = { ...localDish, [field]: Math.max(0, Math.round(value)) };
      setLocalDish(updated);
      onUpdateDish(mealId, dishIndex, updated);
      refreshStreak();
      markChanged();
    },
    [localDish, mealId, dishIndex, onUpdateDish, refreshStreak, markChanged]
  );

  const handlePortionChange = useCallback(
    (multiplier: number) => {
      const updated: DishNutrition = {
        ...dish,
        calories: Math.round(dish.calories * multiplier),
        protein_g: Math.round(dish.protein_g * multiplier),
        carbs_g: Math.round(dish.carbs_g * multiplier),
        fat_g: Math.round(dish.fat_g * multiplier),
        fiber_g: Math.round(dish.fiber_g * multiplier),
        estimated_weight_g: Math.round(dish.estimated_weight_g * multiplier),
      };
      setLocalDish(updated);
      onUpdateDish(mealId, dishIndex, updated);
      refreshStreak();
      markChanged();
    },
    [dish, mealId, dishIndex, onUpdateDish, refreshStreak, markChanged]
  );

  const handleRemove = useCallback(() => {
    onRemoveDish(mealId, dishIndex);
    refreshStreak();
  }, [mealId, dishIndex, onRemoveDish, refreshStreak]);

  const toggleEditMacro = useCallback((key: MacroKey) => {
    setEditingMacro((prev) => (prev === key ? null : key));
  }, []);

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* Dish header */}
      <div className="px-4 pt-4 pb-2.5">
        <div className="flex items-baseline justify-between">
          <h4 className="text-sm font-extrabold text-foreground">{localDish.name}</h4>
          <button
            onClick={() => toggleEditMacro("calories")}
            className={`text-[13px] font-extrabold rounded-md px-1.5 py-0.5 -mr-1.5 transition-colors ${
              editingMacro === "calories"
                ? "text-accent-dim bg-accent-light"
                : "text-muted hover:text-accent-dim hover:bg-accent-light"
            }`}
          >
            {localDish.calories} kcal
          </button>
        </div>
        <p className="text-[11px] text-muted mt-1 leading-relaxed">
          {localDish.portion} · {localDish.estimated_weight_g}g · {localDish.confidence} confidence
        </p>
      </div>

      {/* Macro chips */}
      <div className="px-4 pb-2.5">
        <div className="flex gap-1.5">
          {MACRO_CHIPS.map(({ key, label, color, bg }) => (
            <button
              key={key}
              onClick={() => toggleEditMacro(key)}
              className={`flex-1 flex flex-col items-center py-2 rounded-[10px] transition-all ${bg} ${
                editingMacro === key
                  ? "ring-2 ring-current " + color
                  : editingMacro && editingMacro !== key
                  ? "opacity-50"
                  : ""
              }`}
            >
              <span className={`text-sm font-extrabold leading-none ${color}`}>
                {Math.round(localDish[key] as number)}g
              </span>
              <span className="text-[8px] font-semibold text-muted-light mt-1 uppercase tracking-wide">
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Inline edit row */}
      <AnimatePresence>
        {editingMacro && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <MacroEditRow
              macroKey={editingMacro}
              value={editingMacro === "calories" ? localDish.calories : (localDish[editingMacro] as number)}
              onChange={(v) => updateField(editingMacro, v)}
              onDone={() => setEditingMacro(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Portion (always visible, compact) */}
      <div className="flex items-center gap-1 px-4 pb-3 pt-1">
        <span className="text-[9px] font-bold text-muted-light uppercase tracking-wide mr-1">Portion</span>
        {SERVING_OPTIONS.map((val) => (
          <button
            key={val}
            onClick={() => handlePortionChange(val)}
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold transition-all ${
              localDish.estimated_weight_g === Math.round(dish.estimated_weight_g * val)
                ? "bg-accent text-white font-bold"
                : "border border-border text-muted-light hover:border-muted hover:text-muted"
            }`}
          >
            {val}x
          </button>
        ))}
      </div>

      {/* Remove dish */}
      <div className="px-4 pb-3 flex">
        {confirmDelete ? (
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleRemove}
              className="text-[10px] font-bold px-2.5 py-1.5 rounded-full border border-red-200 bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
            >
              Confirm
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="text-[10px] font-bold px-2.5 py-1.5 rounded-full border border-border bg-background text-muted hover:bg-card-hover transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="flex items-center gap-1 text-[10px] font-semibold text-muted-light/50 hover:text-red-500 transition-colors"
          >
            <Trash2 className="h-3 w-3" />
            Remove
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Macro inline edit row ──────────────────────────────────────────── */

function MacroEditRow({
  macroKey,
  value,
  onChange,
  onDone,
}: {
  macroKey: MacroKey;
  value: number;
  onChange: (value: number) => void;
  onDone: () => void;
}) {
  const isCalories = macroKey === "calories";
  const step = isCalories ? 10 : 1;
  const label = isCalories
    ? "Calories"
    : MACRO_CHIPS.find((c) => c.key === macroKey)?.label || "";
  const unit = isCalories ? "kcal" : "g";
  const labelColor = isCalories
    ? "text-foreground"
    : MACRO_CHIPS.find((c) => c.key === macroKey)?.color || "text-muted";

  return (
    <div className="flex items-center justify-center gap-2 px-4 py-2 bg-card-hover border-t border-border">
      <span className={`text-[10px] font-bold min-w-[48px] ${labelColor}`}>{label}</span>
      <div className="flex items-center gap-0.5 bg-card border border-border rounded-[10px] p-0.5">
        <button
          onClick={() => onChange(Math.max(0, value - step))}
          className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-card-hover active:bg-border transition-colors"
        >
          <Minus className="h-3.5 w-3.5 text-muted" />
        </button>
        <input
          type="number"
          value={Math.round(value)}
          onChange={(e) => {
            const n = parseInt(e.target.value, 10);
            if (Number.isFinite(n)) onChange(Math.max(0, n));
          }}
          className="w-11 text-center text-[13px] font-extrabold text-foreground bg-transparent border-none outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <span className="text-[10px] font-semibold text-muted-light">{unit}</span>
        <button
          onClick={() => onChange(value + step)}
          className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-card-hover active:bg-border transition-colors"
        >
          <Plus className="h-3.5 w-3.5 text-muted" />
        </button>
      </div>
      <button
        onClick={onDone}
        className="text-[10px] font-bold text-accent-dim bg-accent-light rounded-lg px-2.5 py-1.5 hover:bg-accent/20 transition-colors"
      >
        Done
      </button>
    </div>
  );
}
