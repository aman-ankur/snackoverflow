"use client";

import { Flame, Dumbbell, Wheat, Droplets } from "lucide-react";
import type { MealTotals } from "@/lib/dishTypes";

interface DailySummaryProps {
  totals: MealTotals;
  mealsCount: number;
}

interface MacroMetric {
  key: "calories" | "protein" | "carbs" | "fat";
  label: string;
  value: number;
  unit: string;
  baseline: number;
  colorClass: string;
  icon: React.ComponentType<{ className?: string }>;
}

function Ring({ value, baseline, colorClass }: { value: number; baseline: number; colorClass: string }) {
  const radius = 11;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(value / baseline, 1);
  const dashOffset = circumference * (1 - progress);

  return (
    <svg width="28" height="28" viewBox="0 0 28 28" className="shrink-0">
      <circle cx="14" cy="14" r={radius} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="3" />
      <circle
        cx="14"
        cy="14"
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
        className={colorClass}
        transform="rotate(-90 14 14)"
      />
    </svg>
  );
}

export default function DailySummary({ totals, mealsCount }: DailySummaryProps) {
  const metrics: MacroMetric[] = [
    {
      key: "calories",
      label: "Calories",
      value: Math.round(totals.calories),
      unit: "kcal",
      baseline: 2000,
      colorClass: "text-orange",
      icon: Flame,
    },
    {
      key: "protein",
      label: "Protein",
      value: Math.round(totals.protein),
      unit: "g",
      baseline: 120,
      colorClass: "text-accent",
      icon: Dumbbell,
    },
    {
      key: "carbs",
      label: "Carbs",
      value: Math.round(totals.carbs),
      unit: "g",
      baseline: 250,
      colorClass: "text-yellow-400",
      icon: Wheat,
    },
    {
      key: "fat",
      label: "Fat",
      value: Math.round(totals.fat),
      unit: "g",
      baseline: 70,
      colorClass: "text-red-400",
      icon: Droplets,
    },
  ];

  return (
    <div className="rounded-2xl border border-border bg-surface px-3 py-2.5">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold text-foreground/70">Today&apos;s Summary</h3>
        <span className="rounded-full bg-accent/10 border border-accent/20 px-2 py-0.5 text-[10px] font-medium text-accent">
          {mealsCount} meal{mealsCount === 1 ? "" : "s"}
        </span>
      </div>

      <div className="flex items-center justify-between gap-1">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div key={metric.key} className="flex flex-col items-center gap-0.5 flex-1 min-w-0">
              <div className="relative">
                <Ring value={metric.value} baseline={metric.baseline} colorClass={metric.colorClass} />
                <Icon className={`h-3 w-3 ${metric.colorClass} absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2`} />
              </div>
              <p className="text-xs font-semibold text-foreground/85 leading-tight">
                {metric.value}
                <span className="text-[9px] font-normal text-foreground/40 ml-0.5">{metric.unit}</span>
              </p>
              <p className="text-[9px] text-foreground/35 leading-tight">{metric.label}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
