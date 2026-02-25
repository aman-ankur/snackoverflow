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
  alternatives?: DishNutrition[]; // Full nutrition for up to 2 alternative identifications
}

export interface DishAnalysisResult {
  dishes: DishNutrition[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalFiber: number;
  provider?: string;
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
  notes?: string;
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
  name?: string;
  gender: Gender;
  age: number;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  goal: FitnessGoal;
  completedAt: string;
  updatedAt?: string;
}

export interface NutritionGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  tdee: number;
  isCustom: boolean;
  updatedAt?: string;
}

export interface StreakData {
  currentStreak: number;
  lastLogDate: string;
  longestStreak: number;
}

export interface PortionOption {
  label: string;
  weight_g: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
}

export interface DescribedDish {
  name: string;
  hindi: string;
  portions: [PortionOption, PortionOption, PortionOption];
  defaultIndex: number;
  ingredients: string[];
  confidence: ConfidenceLevel;
  tags: string[];
  healthTip: string;
  reasoning: string;
}

export interface DescribeMealResult {
  dishes: DescribedDish[];
}

/* ─── Health Personalization ─── */

export type ConditionStatus = "active" | "family_history" | "both";
export type ConditionSeverity = "mild" | "moderate" | "severe";
export type HealthVerdict = "good" | "caution" | "avoid";
export type DietPreference = "veg" | "nonveg" | "vegan" | "eggetarian" | "pescatarian";

export interface HealthCondition {
  id: string;
  label: string;
  status: ConditionStatus;
  severity?: ConditionSeverity;
}

export interface LabValue {
  key: string;
  label: string;
  value: number;
  unit: string;
  testedAt: string;
}

export interface LabHistoryEntry {
  key: string;
  value: number;
  unit: string;
  testedAt: string;
  recordedAt: string;
}

export interface HealthProfile {
  conditions: HealthCondition[];
  labValues: LabValue[];
  labHistory: LabHistoryEntry[];
  freeTextNotes: string;
  dietPreference?: DietPreference;
  healthContextString: string;
  updatedAt: string;
}

export interface DishHealthVerdict {
  dishName: string;
  verdict: HealthVerdict;
  note: string;
  conditionFlags: string[];
  swapSuggestion?: string;
}

export interface MealHealthAnalysis {
  dishVerdicts: DishHealthVerdict[];
  overallSummary: string;
  overallVerdict: HealthVerdict;
}

/* ─── Eating Habits Analysis ─── */

export type AnalysisScore = "great" | "good" | "needs_work" | "concerning";
export type TrendDirection = "improving" | "stable" | "declining";
export type InsightCategory = "temporal" | "macro" | "variety" | "goal";
export type InsightSeverity = "positive" | "neutral" | "warning";

export interface MacroTrends {
  calories: TrendDirection;
  protein: TrendDirection;
  carbs: TrendDirection;
  fat: TrendDirection;
}

export interface ReportInsight {
  category: InsightCategory;
  title: string;
  detail: string;
  severity: InsightSeverity;
}

export interface ActionItem {
  priority: 1 | 2 | 3;
  text: string;
  relatedInsight?: string;
}

export interface PeriodComparison {
  caloriesDelta: number;
  proteinDelta: number;
  topImprovement: string;
  topRegression?: string;
}

export interface EatingReport {
  score: AnalysisScore;
  scoreSummary: string;
  trends: MacroTrends;
  insights: ReportInsight[];
  healthNotes: string[];
  actionItems: ActionItem[];
  comparison?: PeriodComparison;
}

export interface EatingAnalysis {
  id: string;
  windowDays: number;
  generatedAt: string;
  mealsCount: number;
  report: EatingReport;
  previousReportId?: string;
  provider: string;
}
