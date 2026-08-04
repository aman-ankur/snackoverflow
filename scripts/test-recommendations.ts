import assert from "node:assert/strict";
import { buildMealMemory } from "@/lib/recommendations";
import { normalizeSimilar, rankFamiliar } from "@/app/api/recommend-meals/route";
import type { DishNutrition, LoggedMeal } from "@/lib/dishTypes";

const now = Date.now();
const dish = (name: string): DishNutrition => ({ name, hindi: name, portion: "1 serving", calories: 400, protein_g: 20, carbs_g: 40, fat_g: 12, fiber_g: 5, ingredients: [name, "onion"], confidence: "high", tags: ["home-cooked"], healthTip: "", estimated_weight_g: 250, reasoning: "" });
const meal = (id: string, mealType: LoggedMeal["mealType"], name: string, days: number): LoggedMeal => ({ id, mealType, loggedAt: new Date(now - days * 86400000).toISOString(), updatedAt: new Date(now - days * 86400000).toISOString(), servingsMultiplier: 1, dishes: [dish(name)], totals: { calories: 400, protein: 20, carbs: 40, fat: 12, fiber: 5 } });

const memory = buildMealMemory([
  meal("b1", "breakfast", "Poha", 1),
  meal("l1", "lunch", "Rajma Rice", 3),
  meal("l2", "lunch", "Rajma Rice", 8),
  meal("l3", "lunch", "Dal Roti", 5),
]);
assert.equal(memory.find((m) => m.dishes[0] === "Rajma Rice")?.frequency, 2);
assert.equal(memory.find((m) => m.dishes[0] === "Rajma Rice")?.basedOnMealIds.length, 2);
assert.equal(memory.find((m) => m.dishes[0] === "Poha")?.mealType, "breakfast");
assert.equal(rankFamiliar(memory, "lunch", 500)[0].dishes[0], "Rajma Rice");

const similar = normalizeSimilar([
  { title: "Poha", mealType: "breakfast", confidence: "high", basedOnMealIds: ["b1"] },
  { title: "Rajma Wrap", mealType: "dinner", confidence: "high", basedOnMealIds: ["l1"] },
  { title: "Rajma Dal Bowl", mealType: "lunch", confidence: "high", basedOnMealIds: ["unsupported"] },
  { title: "Rajma Dal Bowl", mealType: "lunch", confidence: "high", basedOnMealIds: ["l1"] },
], memory, "lunch");
assert.deepEqual(similar.map((item) => item.title), ["Rajma Dal Bowl"]);
console.log("Recommendation checks passed");
