import type { HealthProfile, LoggedMeal, MealType } from "@/lib/dishTypes";

export type PlaybookStatus = "learning" | "early" | "unlocked" | "sparse";
export type PlaybookConfidence = "low" | "medium" | "high";

export interface PlaybookEvidence {
  title: string;
  detail: string;
  confidence: PlaybookConfidence;
  mealIds: string[];
  caveat: string;
}

export interface PlaybookExperiment {
  title: string;
  detail: string;
  checkInPrompt: string;
  safetyNote: string;
  requiresConfirmation: boolean;
}

export interface HealthPlaybookSnapshot {
  status: PlaybookStatus;
  daysLogged: number;
  mealsLogged: number;
  checkInsLogged: number;
  daysNeeded: number;
  coverage: Record<MealType, number>;
  averageProtein: number;
  averageCalories: number;
  evidence: PlaybookEvidence[];
  repeatMeal: { title: string; detail: string; mealId?: string } | null;
  upgradeMeal: { title: string; detail: string } | null;
  nextStep: string;
  experiment: PlaybookExperiment;
  safetyNote: string | null;
}

export interface PlaybookCheckIn {
  id: string;
  mealId?: string;
  kind: "energy" | "fullness" | "cravings" | "digestion";
  value: 1 | 2 | 3 | 4;
  createdAt: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "snack", "dinner"];

function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function isKidneyProfile(profile: HealthProfile | null): boolean {
  return Boolean(profile?.conditions.some((condition) => condition.id === "kidney_disease" && condition.status !== "family_history"));
}

function recentMeals(meals: LoggedMeal[], now: Date): LoggedMeal[] {
  const lowerBound = now.getTime() - 6 * DAY_MS;
  return meals.filter((meal) => {
    const timestamp = new Date(meal.loggedAt).getTime();
    return timestamp >= lowerBound && timestamp <= now.getTime();
  });
}

function getStatus(daysLogged: number, now: Date, meals: LoggedMeal[]): PlaybookStatus {
  if (daysLogged >= 7) return "unlocked";
  if (daysLogged >= 4) return "early";

  const firstMeal = meals
    .map((meal) => new Date(meal.loggedAt).getTime())
    .filter(Number.isFinite)
    .sort((a, b) => a - b)[0];
  const periodHasEnded = firstMeal !== undefined && now.getTime() - firstMeal >= 6 * DAY_MS;
  return periodHasEnded ? "sparse" : "learning";
}

function findEvidence(meals: LoggedMeal[], kidneyProfile: boolean): PlaybookEvidence[] {
  if (meals.length < 4) return [];

  const breakfastMeals = meals.filter((meal) => meal.mealType === "breakfast");
  const proteinForward = breakfastMeals.filter((meal) => meal.totals.protein >= 20);
  const evidence: PlaybookEvidence[] = [];

  if (proteinForward.length >= 2) {
    evidence.push({
      title: kidneyProfile ? "Your breakfast pattern is worth noticing" : "Protein-forward breakfasts were followed by steadier afternoons",
      detail: `${proteinForward.length} of ${breakfastMeals.length} logged breakfasts had 20g+ protein.`,
      confidence: breakfastMeals.length >= 3 ? "medium" : "low",
      mealIds: proteinForward.map((meal) => meal.id),
      caveat: kidneyProfile
        ? "Observation only. We are not recommending more protein; follow your care plan."
        : "Observation only, not proof of cause. Add a wellbeing check-in to learn more.",
    });
  }

  const repeatedMeal = new Map<string, { count: number; ids: string[]; latest: LoggedMeal }>();
  meals.forEach((meal) => {
    const key = meal.dishes.map((dish) => dish.name.trim().toLowerCase()).sort().join("|");
    if (!key) return;
    const current = repeatedMeal.get(key);
    repeatedMeal.set(key, {
      count: (current?.count ?? 0) + 1,
      ids: [...(current?.ids ?? []), meal.id],
      latest: current?.latest && current.latest.loggedAt > meal.loggedAt ? current.latest : meal,
    });
  });
  const repeated = [...repeatedMeal.values()].find((item) => item.count >= 2);
  if (repeated) {
    evidence.push({
      title: "A familiar meal is giving you a useful baseline",
      detail: `You logged ${repeated.latest.dishes.map((dish) => dish.name).join(" + ")} ${repeated.count} times.`,
      confidence: repeated.count >= 3 ? "high" : "medium",
      mealIds: repeated.ids,
      caveat: "Familiarity helps comparison; it does not mean this meal is medically right for you.",
    });
  }

  return evidence.slice(0, 2);
}

function buildExperiment(kidneyProfile: boolean): PlaybookExperiment {
  if (kidneyProfile) {
    return {
      title: "Repeat a familiar, clinician-approved breakfast",
      detail: "Choose a breakfast already approved for you on 3 days. We will compare your own check-ins without setting a protein target.",
      checkInPrompt: "How did your energy feel this afternoon?",
      safetyNote: "Kidney nutrition varies by stage, labs, medication, and care plan. This Playbook does not recommend increasing protein.",
      requiresConfirmation: true,
    };
  }
  return {
    title: "Try a protein-forward breakfast",
    detail: "Repeat a familiar protein-forward breakfast on 3 days, then add a one-tap afternoon energy check-in.",
    checkInPrompt: "How did your energy feel this afternoon?",
    safetyNote: "This is a personal experiment, not medical advice or proof of cause.",
    requiresConfirmation: true,
  };
}

export function buildHealthPlaybook(
  meals: LoggedMeal[],
  healthProfile: HealthProfile | null,
  checkIns: PlaybookCheckIn[] = [],
  now = new Date(),
): HealthPlaybookSnapshot {
  const scopedMeals = recentMeals(meals, now);
  const kidneyProfile = isKidneyProfile(healthProfile);
  const dates = new Set(scopedMeals.map((meal) => dateKey(new Date(meal.loggedAt))));
  const daysLogged = dates.size;
  const status = getStatus(daysLogged, now, scopedMeals);
  const coverage = MEAL_TYPES.reduce((result, mealType) => {
    result[mealType] = scopedMeals.filter((meal) => meal.mealType === mealType).length;
    return result;
  }, {} as Record<MealType, number>);
  const totalCalories = scopedMeals.reduce((sum, meal) => sum + meal.totals.calories, 0);
  const totalProtein = scopedMeals.reduce((sum, meal) => sum + meal.totals.protein, 0);
  const evidence = findEvidence(scopedMeals, kidneyProfile);
  const repeated = evidence.find((item) => item.title.includes("familiar meal"));
  const mostRecentRepeatedMeal = repeated?.mealIds[repeated.mealIds.length - 1];
  const firstMealWithProtein = scopedMeals.find((meal) => meal.totals.protein >= 20);

  return {
    status,
    daysLogged,
    mealsLogged: scopedMeals.length,
    checkInsLogged: checkIns.filter((checkIn) => new Date(checkIn.createdAt).getTime() >= now.getTime() - 6 * DAY_MS).length,
    daysNeeded: Math.max(0, 4 - daysLogged),
    coverage,
    averageProtein: scopedMeals.length ? Math.round(totalProtein / scopedMeals.length) : 0,
    averageCalories: scopedMeals.length ? Math.round(totalCalories / scopedMeals.length) : 0,
    evidence,
    repeatMeal: repeated
      ? { title: repeated.title.replace("A familiar meal is giving you a useful baseline", "Repeat a familiar meal"), detail: repeated.detail, mealId: mostRecentRepeatedMeal }
      : firstMealWithProtein
        ? { title: kidneyProfile ? "Repeat a familiar breakfast approved for you" : "Repeat a protein-forward breakfast", detail: firstMealWithProtein.dishes.map((dish) => dish.name).join(" + "), mealId: firstMealWithProtein.id }
        : null,
    upgradeMeal: kidneyProfile
      ? { title: "Choose a clinician-approved option", detail: "The Playbook will not infer a protein target from your logs." }
      : { title: "Add a familiar protein anchor", detail: "Dal, eggs, paneer, or another food you already eat." },
    nextStep: status === "learning"
      ? `${Math.max(1, 4 - daysLogged)} more logged day${Math.max(1, 4 - daysLogged) === 1 ? "" : "s"} will help us make a comparison.`
      : status === "early"
        ? "Add one wellbeing check-in to make the early pattern more useful."
        : status === "sparse"
          ? "Log a few more meals next week; we will not fill gaps with guesses."
          : "Choose one experiment for this week. You can change it any time.",
    experiment: buildExperiment(kidneyProfile),
    safetyNote: kidneyProfile ? "Your kidney condition is shaping suggestions. Confirm food and portions with your clinician or renal dietitian." : null,
  };
}

export function isKidneyCondition(profile: HealthProfile | null): boolean {
  return isKidneyProfile(profile);
}
