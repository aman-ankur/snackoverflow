"use client";

import { Flame, Drumstick, Wheat, Droplets } from "lucide-react";
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
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(value / baseline, 1);
  const dashOffset = circumference * (1 - progress);

  return (
    <svg width="44" height="44" viewBox="0 0 44 44" className="shrink-0">
      <circle cx="22" cy="22" r={radius} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="4" />
      <circle
        cx="22"
        cy="22"
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
        className={colorClass}
        transform="rotate(-90 22 22)"
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
      icon: Drumstick,
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
    <div className="rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">Today&apos;s Summary</h3>
        <span className="rounded-full bg-accent/10 border border-accent/20 px-2 py-0.5 text-[10px] font-medium text-accent">
          {mealsCount} meal{mealsCount === 1 ? "" : "s"}
        </span>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div key={metric.key} className="rounded-xl border border-border/70 bg-background/40 px-3 py-2.5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 text-[10px] text-foreground/35">
                  <Icon className={`h-3.5 w-3.5 ${metric.colorClass}`} />
                  {metric.label}
                </div>
                <Ring value={metric.value} baseline={metric.baseline} colorClass={metric.colorClass} />
              </div>
              <p className="text-sm font-semibold mt-1.5 text-foreground/85">
                {metric.value}
                <span className="text-xs font-normal text-foreground/40 ml-1">{metric.unit}</span>
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
