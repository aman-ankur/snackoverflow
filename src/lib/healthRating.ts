import type { MealTotals } from "@/lib/dishTypes";

export type HealthRating = "healthy" | "balanced" | "moderate" | "heavy";

interface HealthBadge {
  rating: HealthRating;
  label: string;
  color: string;
  bgColor: string;
}

const BADGES: Record<HealthRating, HealthBadge> = {
  healthy: {
    rating: "healthy",
    label: "Healthy",
    color: "#16a34a",
    bgColor: "#dcfce7",
  },
  balanced: {
    rating: "balanced",
    label: "Balanced",
    color: "#2563eb",
    bgColor: "#dbeafe",
  },
  moderate: {
    rating: "moderate",
    label: "Moderate",
    color: "#ca8a04",
    bgColor: "#fef9c3",
  },
  heavy: {
    rating: "heavy",
    label: "Heavy",
    color: "#ea580c",
    bgColor: "#ffedd5",
  },
};

/**
 * Evidence-based meal health classification using WHO/ICMR-aligned thresholds.
 *
 * Heavy: Excessive calories, fat, or unbalanced macros
 * Healthy: Good protein, moderate calories, low fat, adequate fiber
 * Balanced: Reasonable macros within moderate ranges
 * Moderate: Everything else
 */
export function getMealHealthRating(totals: MealTotals): HealthBadge {
  const { calories, protein, carbs, fat, fiber } = totals;

  // Heavy — flag first (worst case)
  if (
    calories > 700 ||
    fat > 35 ||
    (carbs > 80 && protein < 10)
  ) {
    return BADGES.heavy;
  }

  // Healthy — high protein, moderate cal, low fat, decent fiber
  if (
    protein >= 15 &&
    calories <= 500 &&
    fat <= 20 &&
    fiber >= 3
  ) {
    return BADGES.healthy;
  }

  // Balanced — reasonable macros
  if (
    calories >= 200 &&
    calories <= 600 &&
    protein >= 10 &&
    fat <= 25
  ) {
    return BADGES.balanced;
  }

  // Moderate — everything else
  return BADGES.moderate;
}

export { BADGES };
