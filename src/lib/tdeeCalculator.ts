import type { ActivityLevel, FitnessGoal, Gender, NutritionGoals } from "@/lib/dishTypes";

const ACTIVITY_MULTIPLIER: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  very_active: 1.725,
  athlete: 1.9,
};

// Calorie offset from TDEE — evidence-based ranges
// lose_mild: ~0.25 kg/week loss (250 kcal deficit)
// lose_moderate: ~0.5 kg/week loss (500 kcal deficit)
// lose_aggressive: ~0.75-1 kg/week loss (750 kcal deficit, safe with high protein)
// tone_up: slight deficit + high protein to recomp
const GOAL_OFFSET: Record<FitnessGoal, number> = {
  lose_mild: -250,
  lose_moderate: -500,
  lose_aggressive: -750,
  maintain: 0,
  tone_up: -150,
  build_muscle: 300,
  lean_bulk: 200,
};

// Protein targets per kg bodyweight — higher during deficit to preserve muscle
const PROTEIN_PER_KG: Record<FitnessGoal, number> = {
  lose_mild: 1.8,
  lose_moderate: 2.0,
  lose_aggressive: 2.2,
  maintain: 1.6,
  tone_up: 2.0,
  build_muscle: 2.2,
  lean_bulk: 2.0,
};

export function calculateBMR(gender: Gender, weightKg: number, heightCm: number, age: number): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  if (gender === "male") return base + 5;
  if (gender === "female") return base - 161;
  return base - 78; // "other" — average of male & female
}

export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  return Math.round(bmr * ACTIVITY_MULTIPLIER[activityLevel]);
}

export function calculateGoals(
  gender: Gender,
  weightKg: number,
  heightCm: number,
  age: number,
  activityLevel: ActivityLevel,
  goal: FitnessGoal
): NutritionGoals {
  const bmr = calculateBMR(gender, weightKg, heightCm, age);
  const tdee = calculateTDEE(bmr, activityLevel);
  const targetCalories = Math.max(1200, Math.round(tdee + GOAL_OFFSET[goal]));

  const proteinG = Math.round(weightKg * PROTEIN_PER_KG[goal]);
  const fatCalories = targetCalories * 0.25;
  const fatG = Math.round(fatCalories / 9);
  const proteinCalories = proteinG * 4;
  const carbCalories = Math.max(0, targetCalories - proteinCalories - fatCalories);
  const carbsG = Math.round(carbCalories / 4);

  return {
    calories: targetCalories,
    protein: proteinG,
    carbs: carbsG,
    fat: fatG,
    tdee,
    isCustom: false,
  };
}

export const DEFAULT_GOALS: NutritionGoals = {
  calories: 2000,
  protein: 120,
  carbs: 250,
  fat: 70,
  tdee: 2000,
  isCustom: false,
};
