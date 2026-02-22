import type { LoggedMeal, MealTotals, NutritionGoals } from "@/lib/dishTypes";

/* ─── Meal Aggregator ───
 *
 * Pre-computes all patterns client-side so the AI prompt stays compact.
 * The output MealAggregate serializes to ~200-300 tokens — the AI's job
 * is insight selection and writing, not number crunching.
 */

export interface DailySnapshot {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  mealCount: number;
  isWeekend: boolean;
}

export interface DishFrequency {
  name: string;
  count: number;
  avgCalories: number;
  tags: string[];
}

export interface MealTimingStats {
  breakfastCount: number;
  lunchCount: number;
  snackCount: number;
  dinnerCount: number;
  breakfastSkipDays: number;
  lateDinnerCount: number;
  totalDays: number;
}

export interface MealAggregate {
  windowDays: number;
  totalMeals: number;
  totalDays: number;
  daysWithMeals: number;

  avgDaily: MealTotals;
  goals: { calories: number; protein: number; carbs: number; fat: number };
  goalHitDays: number;

  weekdayAvgCal: number;
  weekendAvgCal: number;

  timing: MealTimingStats;

  topDishes: DishFrequency[];
  uniqueDishCount: number;

  macroRatios: { proteinPct: number; carbsPct: number; fatPct: number };
  proteinAtDinnerPct: number;

  snackCaloriePct: number;
  friedItemCount: number;

  bestDay: { date: string; delta: number } | null;
  worstDay: { date: string; delta: number } | null;

  dailySnapshots: DailySnapshot[];
}

function getDateKey(iso: string): string {
  return iso.slice(0, 10);
}

function isWeekendDate(dateStr: string): boolean {
  const day = new Date(dateStr + "T12:00:00").getDay();
  return day === 0 || day === 6;
}

function getHour(iso: string): number {
  try {
    return new Date(iso).getHours();
  } catch {
    return 12;
  }
}

function safeDivide(numerator: number, denominator: number, fallback = 0): number {
  return denominator > 0 ? Math.round(numerator / denominator) : fallback;
}

function pct(part: number, whole: number): number {
  return whole > 0 ? Math.round((part / whole) * 100) : 0;
}

export function aggregateMeals(
  meals: LoggedMeal[],
  windowDays: number,
  goals: NutritionGoals
): MealAggregate {
  const now = new Date();
  const cutoff = windowDays === 0
    ? getDateKey(now.toISOString())
    : null;
  const cutoffMs = windowDays > 0
    ? now.getTime() - windowDays * 24 * 60 * 60 * 1000
    : 0;

  const filtered = meals.filter((m) => {
    if (cutoff) return getDateKey(m.loggedAt) === cutoff;
    return new Date(m.loggedAt).getTime() >= cutoffMs;
  });

  // Group by date
  const byDate = new Map<string, LoggedMeal[]>();
  for (const meal of filtered) {
    const key = getDateKey(meal.loggedAt);
    const bucket = byDate.get(key) ?? [];
    bucket.push(meal);
    byDate.set(key, bucket);
  }

  // Daily snapshots
  const snapshots: DailySnapshot[] = [];
  for (const [date, dayMeals] of byDate) {
    const totals = dayMeals.reduce(
      (acc, m) => ({
        calories: acc.calories + m.totals.calories,
        protein: acc.protein + m.totals.protein,
        carbs: acc.carbs + m.totals.carbs,
        fat: acc.fat + m.totals.fat,
        fiber: acc.fiber + m.totals.fiber,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
    );
    snapshots.push({
      date,
      ...totals,
      mealCount: dayMeals.length,
      isWeekend: isWeekendDate(date),
    });
  }
  snapshots.sort((a, b) => a.date.localeCompare(b.date));

  const daysWithMeals = snapshots.length;
  const totalDays = windowDays === 0 ? 1 : windowDays;

  // Averages
  const sumCal = snapshots.reduce((s, d) => s + d.calories, 0);
  const sumPro = snapshots.reduce((s, d) => s + d.protein, 0);
  const sumCarb = snapshots.reduce((s, d) => s + d.carbs, 0);
  const sumFat = snapshots.reduce((s, d) => s + d.fat, 0);
  const sumFiber = snapshots.reduce((s, d) => s + d.fiber, 0);

  const avgDaily: MealTotals = {
    calories: safeDivide(sumCal, daysWithMeals),
    protein: safeDivide(sumPro, daysWithMeals),
    carbs: safeDivide(sumCarb, daysWithMeals),
    fat: safeDivide(sumFat, daysWithMeals),
    fiber: safeDivide(sumFiber, daysWithMeals),
  };

  // Goal hit days
  const goalHitDays = snapshots.filter(
    (d) => d.calories <= goals.calories * 1.05 && d.calories >= goals.calories * 0.8
  ).length;

  // Weekend vs weekday
  const weekdayDays = snapshots.filter((d) => !d.isWeekend);
  const weekendDays = snapshots.filter((d) => d.isWeekend);
  const weekdayAvgCal = safeDivide(
    weekdayDays.reduce((s, d) => s + d.calories, 0),
    weekdayDays.length
  );
  const weekendAvgCal = safeDivide(
    weekendDays.reduce((s, d) => s + d.calories, 0),
    weekendDays.length
  );

  // Timing
  const mealTypeCounts = { breakfast: 0, lunch: 0, snack: 0, dinner: 0 };
  let lateDinnerCount = 0;
  const daysWithBreakfast = new Set<string>();

  for (const meal of filtered) {
    mealTypeCounts[meal.mealType]++;
    if (meal.mealType === "breakfast") {
      daysWithBreakfast.add(getDateKey(meal.loggedAt));
    }
    if (meal.mealType === "dinner" && getHour(meal.loggedAt) >= 21) {
      lateDinnerCount++;
    }
  }

  const timing: MealTimingStats = {
    breakfastCount: mealTypeCounts.breakfast,
    lunchCount: mealTypeCounts.lunch,
    snackCount: mealTypeCounts.snack,
    dinnerCount: mealTypeCounts.dinner,
    breakfastSkipDays: Math.max(0, daysWithMeals - daysWithBreakfast.size),
    lateDinnerCount,
    totalDays: daysWithMeals,
  };

  // Dish frequency
  const dishMap = new Map<string, { count: number; totalCal: number; tags: Set<string> }>();
  for (const meal of filtered) {
    for (const dish of meal.dishes) {
      const key = dish.name.toLowerCase();
      const entry = dishMap.get(key) ?? { count: 0, totalCal: 0, tags: new Set<string>() };
      entry.count++;
      entry.totalCal += dish.calories;
      dish.tags.forEach((t) => entry.tags.add(t));
      dishMap.set(key, entry);
    }
  }

  const topDishes: DishFrequency[] = Array.from(dishMap.entries())
    .map(([name, data]) => ({
      name,
      count: data.count,
      avgCalories: safeDivide(data.totalCal, data.count),
      tags: Array.from(data.tags),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Macro ratios (from total)
  const totalMacroCal = sumPro * 4 + sumCarb * 4 + sumFat * 9;
  const macroRatios = {
    proteinPct: pct(sumPro * 4, totalMacroCal),
    carbsPct: pct(sumCarb * 4, totalMacroCal),
    fatPct: pct(sumFat * 9, totalMacroCal),
  };

  // Protein at dinner percentage
  const dinnerProtein = filtered
    .filter((m) => m.mealType === "dinner")
    .reduce((s, m) => s + m.totals.protein, 0);
  const proteinAtDinnerPct = pct(dinnerProtein, sumPro);

  // Snack calorie percentage
  const snackCal = filtered
    .filter((m) => m.mealType === "snack")
    .reduce((s, m) => s + m.totals.calories, 0);
  const snackCaloriePct = pct(snackCal, sumCal);

  // Fried item count (from tags)
  let friedItemCount = 0;
  for (const meal of filtered) {
    for (const dish of meal.dishes) {
      const lowerTags = dish.tags.map((t) => t.toLowerCase());
      const lowerName = dish.name.toLowerCase();
      if (
        lowerTags.some((t) => t.includes("fried") || t.includes("deep-fried")) ||
        lowerName.includes("fried") ||
        lowerName.includes("pakora") ||
        lowerName.includes("samosa") ||
        lowerName.includes("bhaji")
      ) {
        friedItemCount++;
      }
    }
  }

  // Best / worst day by distance from calorie goal
  let bestDay: MealAggregate["bestDay"] = null;
  let worstDay: MealAggregate["worstDay"] = null;

  if (snapshots.length > 0) {
    let minDelta = Infinity;
    let maxDelta = -Infinity;

    for (const snap of snapshots) {
      const delta = Math.abs(snap.calories - goals.calories);
      if (delta < minDelta) {
        minDelta = delta;
        bestDay = { date: snap.date, delta: snap.calories - goals.calories };
      }
      if (delta > maxDelta) {
        maxDelta = delta;
        worstDay = { date: snap.date, delta: snap.calories - goals.calories };
      }
    }
  }

  return {
    windowDays,
    totalMeals: filtered.length,
    totalDays,
    daysWithMeals,
    avgDaily,
    goals: {
      calories: goals.calories,
      protein: goals.protein,
      carbs: goals.carbs,
      fat: goals.fat,
    },
    goalHitDays,
    weekdayAvgCal,
    weekendAvgCal,
    timing,
    topDishes,
    uniqueDishCount: dishMap.size,
    macroRatios,
    proteinAtDinnerPct,
    snackCaloriePct,
    friedItemCount,
    bestDay,
    worstDay,
    dailySnapshots: snapshots,
  };
}

/**
 * Serialize the aggregate into a compact string for the AI prompt.
 * Strips daily snapshots (AI doesn't need per-day rows) and keeps
 * only the pre-computed stats to minimize token usage.
 */
export function serializeForPrompt(agg: MealAggregate): string {
  const lines: string[] = [];

  const w = agg.windowDays === 0 ? "Today" : `Last ${agg.windowDays} days`;
  lines.push(`Period: ${w} | ${agg.totalMeals} meals across ${agg.daysWithMeals} days`);

  lines.push(
    `Avg daily: ${agg.avgDaily.calories} cal, P:${agg.avgDaily.protein}g, C:${agg.avgDaily.carbs}g, F:${agg.avgDaily.fat}g, Fiber:${agg.avgDaily.fiber}g`
  );
  lines.push(
    `Goals: ${agg.goals.calories} cal, P:${agg.goals.protein}g, C:${agg.goals.carbs}g, F:${agg.goals.fat}g`
  );
  lines.push(`Goal hit days: ${agg.goalHitDays}/${agg.daysWithMeals}`);

  if (agg.weekendAvgCal > 0 && agg.weekdayAvgCal > 0) {
    lines.push(`Weekday avg: ${agg.weekdayAvgCal} cal | Weekend avg: ${agg.weekendAvgCal} cal`);
  }

  lines.push(
    `Meals: ${agg.timing.breakfastCount}B ${agg.timing.lunchCount}L ${agg.timing.snackCount}S ${agg.timing.dinnerCount}D`
  );
  if (agg.timing.breakfastSkipDays > 0) {
    lines.push(`Breakfast skipped: ${agg.timing.breakfastSkipDays}/${agg.timing.totalDays} days`);
  }
  if (agg.timing.lateDinnerCount > 0) {
    lines.push(`Late dinners (after 9pm): ${agg.timing.lateDinnerCount}`);
  }

  lines.push(`Macro split: P:${agg.macroRatios.proteinPct}% C:${agg.macroRatios.carbsPct}% F:${agg.macroRatios.fatPct}%`);
  if (agg.proteinAtDinnerPct > 40) {
    lines.push(`Protein clustering: ${agg.proteinAtDinnerPct}% at dinner`);
  }
  if (agg.snackCaloriePct > 15) {
    lines.push(`Snack calories: ${agg.snackCaloriePct}% of total`);
  }
  if (agg.friedItemCount > 0) {
    lines.push(`Fried items: ${agg.friedItemCount}`);
  }

  lines.push(`Unique dishes: ${agg.uniqueDishCount}`);
  if (agg.topDishes.length > 0) {
    const top = agg.topDishes
      .slice(0, 5)
      .map((d) => `${d.name}(${d.count}x,${d.avgCalories}cal)`)
      .join(", ");
    lines.push(`Top dishes: ${top}`);
  }

  if (agg.bestDay) {
    const sign = agg.bestDay.delta >= 0 ? "+" : "";
    lines.push(`Best day: ${agg.bestDay.date} (${sign}${agg.bestDay.delta} cal vs goal)`);
  }
  if (agg.worstDay) {
    const sign = agg.worstDay.delta >= 0 ? "+" : "";
    lines.push(`Worst day: ${agg.worstDay.date} (${sign}${agg.worstDay.delta} cal vs goal)`);
  }

  return lines.join("\n");
}
