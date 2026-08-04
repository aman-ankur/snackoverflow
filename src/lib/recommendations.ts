import type { LoggedMeal, MealRecommendation, MealType, MealTotals, NutritionGoals } from "@/lib/dishTypes";

export interface MealMemoryItem {
  id: string; mealType: MealType; dishes: string[]; ingredients: string[]; tags: string[];
  totals: MealTotals; loggedAt: string; frequency: number; basedOnMealIds: string[];
}

export function buildMealMemory(meals: LoggedMeal[], now = Date.now()): MealMemoryItem[] {
  const groups = new Map<string, MealMemoryItem>();
  meals.filter((m) => {
    const timestamp = new Date(m.loggedAt).getTime();
    return Number.isFinite(timestamp) && timestamp <= now && now - timestamp <= 90 * 86400000;
  }).forEach((meal) => {
    const dishes = meal.dishes.map((d) => d.name.trim()).filter(Boolean);
    const key = `${meal.mealType}:${dishes.map((d) => d.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()).sort().join("|")}`;
    if (!key) return;
    const current = groups.get(key);
    const ids = [...(current?.basedOnMealIds || []), meal.id];
    const latest = !current || new Date(meal.loggedAt).getTime() > new Date(current.loggedAt).getTime();
    groups.set(key, {
      id: latest ? meal.id : current.id, mealType: meal.mealType,
      dishes: latest ? dishes : current.dishes,
      ingredients: [...new Set([...(current?.ingredients || []), ...meal.dishes.flatMap((d) => d.ingredients)])].slice(0, 20),
      tags: [...new Set([...(current?.tags || []), ...meal.dishes.flatMap((d) => d.tags)])].slice(0, 20),
      totals: latest ? meal.totals : current.totals, loggedAt: latest ? meal.loggedAt : current.loggedAt,
      frequency: ids.length, basedOnMealIds: ids,
    });
  });
  return [...groups.values()];
}

export function cacheKey(meals: LoggedMeal[], goals: NutritionGoals, mealType: MealType, health = ""): string {
  const latest = meals.map((m) => `${m.id}:${m.mealType}:${m.updatedAt}:${m.loggedAt}:${m.dishes.map((d) => d.name).join(",")}`).sort().join("|");
  return `snackoverflow-recs:v2:${new Date().toISOString().slice(0, 10)}:${mealType}:${goals.calories}:${goals.protein}:${goals.carbs}:${goals.fat}:${health}:${latest}`;
}

export async function fetchRecommendations(memory: MealMemoryItem[], context: { todayTotals: MealTotals; goals: NutritionGoals; mealType: MealType; dietPreference?: string; healthContext?: string }): Promise<MealRecommendation[]> {
  const response = await fetch("/api/recommend-meals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ memory, ...context }) });
  if (!response.ok) throw new Error("Recommendations unavailable");
  return (await response.json()).recommendations as MealRecommendation[];
}
