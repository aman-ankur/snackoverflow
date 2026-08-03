import { test, expect } from "@playwright/test";
import { seedMockMeals } from "./mock-seed";

const healthProfile = (conditionId?: string) => ({
  conditions: conditionId ? [{ id: conditionId, label: conditionId === "kidney_disease" ? "Kidney Disease" : conditionId, status: "active" }] : [],
  labValues: [],
  labHistory: [],
  freeTextNotes: "",
  dietPreference: undefined,
  healthContextString: conditionId ? "Kidney disease: follow clinician-aligned nutrition guidance" : "",
  updatedAt: new Date().toISOString(),
});

async function seedFourDays(page: import("@playwright/test").Page) {
  await page.evaluate(() => {
    const now = Date.now();
    const meals = Array.from({ length: 4 }, (_, index) => {
      const loggedAt = new Date(now - index * 24 * 60 * 60 * 1000).toISOString();
      return {
        id: `playbook-e2e-${index}`,
        mealType: "breakfast",
        loggedAt,
        updatedAt: loggedAt,
        servingsMultiplier: 1,
        dishes: [{ name: "Moong Chilla", hindi: "", portion: "1 serving", calories: 400, protein_g: 22, carbs_g: 45, fat_g: 12, fiber_g: 6, estimated_weight_g: 250, ingredients: ["lentils"], confidence: "high", tags: [], healthTip: "", reasoning: "" }],
        totals: { calories: 400, protein: 22, carbs: 45, fat: 12, fiber: 6 },
      };
    });
    localStorage.setItem("snackoverflow-meal-log-v1", JSON.stringify(meals));
  });
}

test.describe("Health Playbook", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(seedMockMeals);
    await page.reload();
  });

  test("opens from Home and shows a simple learning next step", async ({ page }) => {
    const homeEntry = page.getByTestId("health-playbook-home");
    await expect(homeEntry).toBeVisible();
    await page.getByRole("button", { name: "Open Health Playbook from Home" }).click();

    await expect(page.getByTestId("health-playbook-sheet")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Your Playbook is learning." })).toBeVisible();
    await expect(page.getByText(/more logged day.*will help us make a comparison/)).toBeVisible();
  });

  test("is also discoverable from Progress", async ({ page }) => {
    await page.getByRole("button", { name: "Progress" }).click();
    await expect(page.getByTestId("health-playbook-progress")).toBeVisible();
    await page.getByRole("button", { name: "Open Health Playbook from Progress" }).click();
    await expect(page.getByTestId("health-playbook-sheet")).toBeVisible();
  });

  test("does not recommend increasing protein for a kidney profile", async ({ page }) => {
    await seedFourDays(page);
    await page.evaluate((profile) => localStorage.setItem("snackoverflow-health-profile-v1", JSON.stringify(profile)), healthProfile("kidney_disease"));
    await page.reload();
    await page.getByRole("button", { name: "Open Health Playbook from Home" }).click();

    await expect(page.getByText(/Your kidney condition is shaping suggestions/)).toBeVisible();
    await expect(page.getByText("Repeat a familiar, clinician-approved breakfast")).toBeVisible();
    await expect(page.getByText(/does not recommend increasing protein/)).toBeVisible();
    await expect(page.getByText("Try a protein-forward breakfast")).toHaveCount(0);
  });

  test("requires confirmation before offering an optional check-in", async ({ page }) => {
    await seedFourDays(page);
    await page.reload();
    await page.getByRole("button", { name: "Open Health Playbook from Home" }).click();

    await expect(page.getByRole("button", { name: "Choose this experiment" })).toBeVisible();
    await expect(page.getByText("How did your energy feel this afternoon?")).toHaveCount(0);
    await page.getByRole("button", { name: "Choose this experiment" }).click();
    await expect(page.getByText("How did your energy feel this afternoon?")).toBeVisible();
    await page.getByRole("button", { name: "Steady" }).click();
  });
});
