import assert from "node:assert/strict";
import { buildHealthPlaybook } from "../src/lib/healthPlaybook";
import type { HealthProfile, LoggedMeal } from "../src/lib/dishTypes";

const NOW = new Date("2026-08-03T12:00:00.000Z");

function meal(dayOffset: number, id: string, mealType: LoggedMeal["mealType"] = "breakfast", protein = 22): LoggedMeal {
  const loggedAt = new Date(NOW.getTime() - dayOffset * 24 * 60 * 60 * 1000).toISOString();
  return {
    id,
    mealType,
    loggedAt,
    updatedAt: loggedAt,
    servingsMultiplier: 1,
    dishes: [{
      name: id.startsWith("repeat") ? "Moong Chilla" : `Meal ${id}`,
      hindi: "",
      portion: "1 serving",
      calories: 400,
      protein_g: protein,
      carbs_g: 45,
      fat_g: 12,
      fiber_g: 6,
      ingredients: ["lentils"],
      confidence: "high",
      tags: [],
      healthTip: "",
      estimated_weight_g: 250,
      reasoning: "",
    }],
    totals: { calories: 400, protein, carbs: 45, fat: 12, fiber: 6 },
  };
}

const kidneyProfile: HealthProfile = {
  conditions: [{ id: "kidney_disease", label: "Kidney Disease", status: "active" }],
  labValues: [], labHistory: [], freeTextNotes: "", healthContextString: "", updatedAt: NOW.toISOString(),
};

const days = (count: number) => Array.from({ length: count }, (_, index) => meal(index, `meal-${index}`));

const learning = buildHealthPlaybook(days(3), null, [], NOW);
assert.equal(learning.status, "learning");
assert.equal(learning.daysLogged, 3);
assert.equal(learning.daysNeeded, 1);

const early = buildHealthPlaybook(days(4), null, [], NOW);
assert.equal(early.status, "early");
assert.equal(early.evidence.length > 0, true);
assert.equal(early.experiment.requiresConfirmation, true);

const unlocked = buildHealthPlaybook([...days(7), meal(0, "repeat-today", "lunch")], null, [], NOW);
assert.equal(unlocked.status, "unlocked");
assert.equal(unlocked.daysLogged, 7);
assert.equal(unlocked.coverage.breakfast, 7);

const sparse = buildHealthPlaybook([meal(6, "sparse-meal")], null, [], NOW);
assert.equal(sparse.status, "sparse");
assert.match(sparse.nextStep, /not fill gaps/);

const kidney = buildHealthPlaybook(days(7), kidneyProfile, [], NOW);
assert.equal(kidney.status, "unlocked");
assert.match(kidney.experiment.title, /familiar|approved/i);
assert.doesNotMatch(kidney.experiment.title, /protein-forward/i);
assert.match(kidney.experiment.safetyNote, /does not recommend increasing protein/i);
assert.match(kidney.safetyNote ?? "", /renal dietitian/i);

console.log("Health Playbook domain tests passed");
