import type { MealTotals, NutritionGoals, StreakData, LoggedMeal } from "@/lib/dishTypes";

export interface QuickInsight {
  text: string;
  icon: "streak" | "protein" | "fiber" | "calories" | "consistency";
}

/**
 * Deterministic quick insights from user data.
 * Returns the single most relevant insight, or null if nothing interesting.
 */
export function getQuickInsight(
  todayTotals: MealTotals,
  goals: NutritionGoals,
  streak: StreakData,
  todayMeals: LoggedMeal[]
): QuickInsight | null {
  // Streak milestones
  if (streak.currentStreak >= 14) {
    return { text: `${streak.currentStreak}-day streak! You're building a real habit.`, icon: "streak" };
  }
  if (streak.currentStreak >= 7) {
    return { text: "One full week of tracking — consistency pays off!", icon: "streak" };
  }

  // Protein check (if meals logged)
  if (todayMeals.length >= 2) {
    const proteinPct = goals.protein > 0 ? todayTotals.protein / goals.protein : 0;
    if (proteinPct >= 1.0) {
      return { text: "Protein goal hit already — great choices today!", icon: "protein" };
    }
    if (proteinPct < 0.3) {
      return { text: "Protein is low so far — add dal, eggs, or paneer next.", icon: "protein" };
    }
  }

  // Fiber nudge
  if (todayMeals.length >= 2 && todayTotals.fiber < 5) {
    return { text: "Fiber is low today — try adding a salad or fruit.", icon: "fiber" };
  }

  // Calorie pacing
  const hour = new Date().getHours();
  if (todayMeals.length >= 1 && hour >= 14) {
    const calPct = goals.calories > 0 ? todayTotals.calories / goals.calories : 0;
    if (calPct > 0.85) {
      return { text: "You've used 85%+ of your calories — go light for dinner.", icon: "calories" };
    }
  }

  // Streak encouragement for lower streaks
  if (streak.currentStreak >= 3) {
    return { text: `${streak.currentStreak} days in a row — don't break the chain!`, icon: "consistency" };
  }

  return null;
}
