export type ConfidenceLevel = "high" | "medium" | "low";

export type MealType = "breakfast" | "lunch" | "snack" | "dinner";

export interface DishNutrition {
  name: string;
  hindi: string;
  portion: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  ingredients: string[];
  confidence: ConfidenceLevel;
  tags: string[];
  healthTip: string;
  estimated_weight_g: number;
  reasoning: string;
}

export interface DishAnalysisResult {
  dishes: DishNutrition[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalFiber: number;
}

export interface MealTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export interface LoggedMeal {
  id: string;
  mealType: MealType;
  loggedAt: string;
  servingsMultiplier: number;
  dishes: DishNutrition[];
  totals: MealTotals;
  fridgeLink?: {
    fromScanAt: string;
    matchedItems: string[];
  };
}

export type Gender = "male" | "female" | "other";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "very_active" | "athlete";
export type FitnessGoal =
  | "lose_mild"
  | "lose_moderate"
  | "lose_aggressive"
  | "maintain"
  | "tone_up"
  | "build_muscle"
  | "lean_bulk";
export type CapyMood = "happy" | "excited" | "sleepy" | "motivated" | "concerned";

export interface UserProfile {
  gender: Gender;
  age: number;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  goal: FitnessGoal;
  completedAt: string;
}

export interface NutritionGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  tdee: number;
  isCustom: boolean;
}

export interface StreakData {
  currentStreak: number;
  lastLogDate: string;
  longestStreak: number;
}
