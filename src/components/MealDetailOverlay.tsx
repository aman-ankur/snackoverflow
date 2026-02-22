"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Trash2, Camera, Save, Minus, Plus, UtensilsCrossed, StickyNote } from "lucide-react";
import type { LoggedMeal, MealType, DishNutrition } from "@/lib/dishTypes";

const MEAL_TYPE_OPTIONS: MealType[] = ["breakfast", "lunch", "snack", "dinner"];
const SERVING_OPTIONS = [0.5, 1, 1.5, 2];

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

  const handleMealTypeChange = useCallback((newType: MealType) => {
    setLocalMealType(newType);
    setHasChanges(true);
  }, []);

  const handleNotesChange = useCallback((value: string) => {
    setLocalNotes(value);
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
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-border bg-card">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors active:scale-95"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <h2 className="text-sm font-extrabold text-foreground capitalize">
            {meal.mealType} #{mealIndex} · {time}
          </h2>
          <button
            onClick={handleSave}
            className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold transition-all active:scale-95 ${
              hasChanges
                ? "bg-accent text-white"
                : "bg-accent-light border border-accent/20 text-accent-dim"
            }`}
          >
            <Save className="h-3 w-3" />
            Save
          </button>
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

        {/* Re-scan */}
        <button
          onClick={handleRescan}
          className="w-full rounded-2xl border border-dashed border-accent/40 bg-accent-light p-3.5 flex items-center justify-center gap-2 text-sm font-bold text-accent-dim hover:bg-accent/15 transition-colors active:scale-[0.98]"
        >
          <Camera className="h-4 w-4" />
          Re-scan This Meal
        </button>

        {/* Delete meal */}
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
}: {
  dish: DishNutrition;
  mealId: string;
  dishIndex: number;
  onUpdateDish: (mealId: string, dishIndex: number, updatedDish: DishNutrition) => void;
  onRemoveDish: (mealId: string, dishIndex: number) => void;
  refreshStreak: () => void;
}) {
  const [localDish, setLocalDish] = useState<DishNutrition>({ ...dish });
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showPortionPicker, setShowPortionPicker] = useState(false);

  const updateField = useCallback(
    (field: keyof DishNutrition, value: number) => {
      const updated = { ...localDish, [field]: Math.max(0, Math.round(value)) };
      setLocalDish(updated);
      onUpdateDish(mealId, dishIndex, updated);
      refreshStreak();
    },
    [localDish, mealId, dishIndex, onUpdateDish, refreshStreak]
  );

  const handlePortionChange = useCallback(
    (multiplier: number) => {
      const ratio = multiplier;
      const updated: DishNutrition = {
        ...dish,
        calories: Math.round(dish.calories * ratio),
        protein_g: Math.round(dish.protein_g * ratio),
        carbs_g: Math.round(dish.carbs_g * ratio),
        fat_g: Math.round(dish.fat_g * ratio),
        fiber_g: Math.round(dish.fiber_g * ratio),
        estimated_weight_g: Math.round(dish.estimated_weight_g * ratio),
      };
      setLocalDish(updated);
      onUpdateDish(mealId, dishIndex, updated);
      refreshStreak();
      setShowPortionPicker(false);
    },
    [dish, mealId, dishIndex, onUpdateDish, refreshStreak]
  );

  const handleRemove = useCallback(() => {
    onRemoveDish(mealId, dishIndex);
    refreshStreak();
  }, [mealId, dishIndex, onRemoveDish, refreshStreak]);

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* Dish header */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-extrabold text-foreground">{localDish.name}</h4>
          <span className="text-xs font-bold text-muted">{localDish.calories} kcal</span>
        </div>
        <p className="text-[10px] text-muted mt-0.5">
          {localDish.portion} · {localDish.estimated_weight_g}g · {localDish.confidence} confidence
        </p>
      </div>

      {/* Macro grid */}
      <div className="px-4 pb-3">
        <div className="grid grid-cols-2 gap-2">
          <MacroStepper label="Calories" value={localDish.calories} unit="" onChange={(v) => updateField("calories", v)} />
          <MacroStepper label="Protein" value={localDish.protein_g} unit="g" onChange={(v) => updateField("protein_g", v)} />
          <MacroStepper label="Carbs" value={localDish.carbs_g} unit="g" onChange={(v) => updateField("carbs_g", v)} />
          <MacroStepper label="Fat" value={localDish.fat_g} unit="g" onChange={(v) => updateField("fat_g", v)} />
        </div>
      </div>

      {/* Portion adjuster */}
      <div className="px-4 pb-3">
        <button
          onClick={() => setShowPortionPicker(!showPortionPicker)}
          className="text-[10px] font-bold text-muted mb-2"
        >
          Portion {showPortionPicker ? "▴" : "▾"}
        </button>
        {showPortionPicker && (
          <div className="grid grid-cols-4 gap-1.5">
            {SERVING_OPTIONS.map((val) => (
              <button
                key={val}
                onClick={() => handlePortionChange(val)}
                className="rounded-full border border-border bg-background px-2 py-1.5 text-[10px] font-bold text-muted hover:bg-card-hover transition-colors"
              >
                {val}x
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Remove dish */}
      <div className="px-4 pb-3 flex justify-end">
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
            className="text-[10px] font-bold px-2.5 py-1.5 rounded-full border border-red-200 bg-red-50 text-red-500 hover:bg-red-100 transition-colors flex items-center gap-1"
          >
            <Trash2 className="h-3 w-3" />
            Remove Dish
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Macro stepper input ────────────────────────────────────────────── */

function MacroStepper({
  label,
  value,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  unit: string;
  onChange: (value: number) => void;
}) {
  const step = label === "Calories" ? 10 : 1;

  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-background px-3 py-2">
      <span className="text-[10px] font-semibold text-muted">{label}</span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(value - step)}
          className="flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card hover:bg-card-hover transition-colors active:scale-90"
        >
          <Minus className="h-3 w-3 text-muted" />
        </button>
        <input
          type="number"
          value={Math.round(value)}
          onChange={(e) => {
            const n = parseInt(e.target.value, 10);
            if (Number.isFinite(n)) onChange(n);
          }}
          className="w-12 text-center text-xs font-bold text-foreground bg-transparent border-none outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <span className="text-[10px] text-muted">{unit}</span>
        <button
          onClick={() => onChange(value + step)}
          className="flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card hover:bg-card-hover transition-colors active:scale-90"
        >
          <Plus className="h-3 w-3 text-muted" />
        </button>
      </div>
    </div>
  );
}
