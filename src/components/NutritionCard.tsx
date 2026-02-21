"use client";

import { useState } from "react";
import { Flame, Dumbbell, Wheat, Droplets, Leaf, BadgeCheck, ChevronDown, ChevronUp, Brain } from "lucide-react";
import type { DishNutrition } from "@/lib/dishTypes";

interface NutritionCardProps {
  dish: DishNutrition;
  servingsMultiplier: number;
}

function scale(value: number, multiplier: number): number {
  return Math.round(value * multiplier);
}

export default function NutritionCard({ dish, servingsMultiplier }: NutritionCardProps) {
  const confidenceColor =
    dish.confidence === "high"
      ? "text-accent"
      : dish.confidence === "medium"
        ? "text-orange"
        : "text-muted";

  const scaled = {
    calories: scale(dish.calories, servingsMultiplier),
    protein: scale(dish.protein_g, servingsMultiplier),
    carbs: scale(dish.carbs_g, servingsMultiplier),
    fat: scale(dish.fat_g, servingsMultiplier),
    fiber: scale(dish.fiber_g, servingsMultiplier),
  };

  const metrics = [
    {
      key: "calories",
      label: "Calories",
      value: `${scaled.calories} kcal`,
      icon: Flame,
      iconClass: "text-orange",
    },
    {
      key: "protein",
      label: "Protein",
      value: `${scaled.protein}g`,
      icon: Dumbbell,
      iconClass: "text-accent",
    },
    {
      key: "carbs",
      label: "Carbs",
      value: `${scaled.carbs}g`,
      icon: Wheat,
      iconClass: "text-yellow-400",
    },
    {
      key: "fat",
      label: "Fat",
      value: `${scaled.fat}g`,
      icon: Droplets,
      iconClass: "text-red-400",
    },
    {
      key: "fiber",
      label: "Fiber",
      value: `${scaled.fiber}g`,
      icon: Leaf,
      iconClass: "text-emerald-400",
    },
  ];

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-foreground">{dish.name}</h3>
          {dish.hindi && <p className="text-xs text-muted mt-0.5">{dish.hindi}</p>}
          <p className="text-[10px] text-muted-light mt-1">
            Estimated for: {dish.portion}
            {dish.estimated_weight_g > 0 && (
              <span className="ml-1 font-semibold">({Math.round(dish.estimated_weight_g * servingsMultiplier)}g)</span>
            )}
          </p>
        </div>
        <div className={`inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[10px] ${confidenceColor}`} title="AI confidence in dish identification">
          <BadgeCheck className="h-3 w-3" />
          {dish.confidence === "high" ? "Confident" : dish.confidence === "medium" ? "Likely" : "Unsure"}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div key={metric.key} className="rounded-xl border border-border bg-background px-3 py-2">
              <div className="flex items-center gap-1.5 text-[10px] text-muted">
                <Icon className={`h-3.5 w-3.5 ${metric.iconClass}`} />
                {metric.label}
              </div>
              <p className="mt-1 text-sm font-bold text-foreground">{metric.value}</p>
            </div>
          );
        })}
      </div>

      {dish.ingredients.length > 0 && (
        <div className="mt-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-light">Key Ingredients</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {dish.ingredients.map((ingredient) => (
              <span
                key={ingredient}
                className="rounded-full border border-border bg-background px-2 py-1 text-[10px] text-muted"
              >
                {ingredient}
              </span>
            ))}
          </div>
        </div>
      )}

      {dish.healthTip && (
        <p className="mt-3 rounded-lg border border-orange/20 bg-orange-light px-3 py-2 text-xs text-foreground">
          {dish.healthTip}
        </p>
      )}

      {dish.reasoning && <ReasoningSection reasoning={dish.reasoning} />}
    </div>
  );
}

function ReasoningSection({ reasoning }: { reasoning: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mt-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 text-[10px] text-muted hover:text-foreground transition-colors"
      >
        <Brain className="h-3 w-3" />
        Why this estimate?
        {isOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>
      {isOpen && (
        <p className="mt-1.5 rounded-lg border border-border bg-background px-3 py-2 text-[10px] text-muted leading-relaxed">
          {reasoning}
        </p>
      )}
    </div>
  );
}
