import type { LoggedMeal, MealRecommendation, MealType, MealTotals, NutritionGoals } from "@/lib/dishTypes";

export interface MealMemoryItem {
  id: string; mealType: MealType; dishes: string[]; ingredients: string[]; tags: string[];
  totals: MealTotals; loggedAt: string; frequency: number;
}

export function buildMealMemory(meals: LoggedMeal[], now = Date.now()): MealMemoryItem[] {
  const groups = new Map<string, MealMemoryItem>();
  meals.filter((m) => now - new Date(m.loggedAt).getTime() <= 90 * 86400000).forEach((meal) => {
    const dishes = meal.dishes.map((d) => d.name.trim()).filter(Boolean);
    const key = dishes.map((d) => d.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()).sort().join("|");
    if (!key) return;
    const current = groups.get(key);
    const item = { id: meal.id, mealType: meal.mealType, dishes, ingredients: [...new Set(meal.dishes.flatMap((d) => d.ingredients).slice(0, 20))], tags: [...new Set(meal.dishes.flatMap((d) => d.tags).slice(0, 20))], totals: meal.totals, loggedAt: meal.loggedAt, frequency: (current?.frequency || 0) + 1 };
    if (!current || new Date(meal.loggedAt).getTime() > new Date(current.loggedAt).getTime()) groups.set(key, item);
    else groups.set(key, { ...current, frequency: item.frequency });
  });
  return [...groups.values()];
}

export function cacheKey(meals: LoggedMeal[], goals: NutritionGoals, mealType: MealType, health = ""): string {
  const latest = meals.reduce((v, m) => `${v}|${m.id}:${m.updatedAt}`, "");
  return `snackoverflow-recs:${new Date().toISOString().slice(0, 10)}:${mealType}:${goals.calories}:${goals.protein}:${health}:${latest}`;
}

export async function fetchRecommendations(memory: MealMemoryItem[], context: { todayTotals: MealTotals; goals: NutritionGoals; mealType: MealType; dietPreference?: string; healthContext?: string }): Promise<MealRecommendation[]> {
  const response = await fetch("/api/recommend-meals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ memory, ...context }) });
  if (!response.ok) throw new Error("Recommendations unavailable");
  return (await response.json()).recommendations as MealRecommendation[];
}
