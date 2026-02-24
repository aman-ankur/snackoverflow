import { test, expect } from "@playwright/test";
import { seedMockMeals } from "./mock-seed";

test.describe("Dish Scan Mock Mode", () => {
  test.beforeEach(async ({ page }) => {
    // Seed profile so onboarding is skipped
    await page.goto("/");
    await page.evaluate(seedMockMeals);
  });

  test("full mock scan flow: start camera → analyze → results → scan again", async ({ page }) => {
    await page.goto("/?mock=scan");

    // Should land on scan tab
    await expect(page.getByText("Point your camera at your plate")).toBeVisible();

    // Click Start Camera
    await page.getByRole("button", { name: "Start Camera" }).click();

    // Analyze Dish button should appear
    const analyzeBtn = page.getByRole("button", { name: "Analyze Dish" });
    await expect(analyzeBtn).toBeVisible();

    // Click Analyze Dish
    await analyzeBtn.click();

    // Should show analyzing state with frozen frame
    await expect(page.getByText("Analyzing your meal...")).toBeVisible();
    await expect(page.getByText("Photo captured")).toBeVisible();

    // Wait for results (~1.5s mock delay)
    await expect(page.getByText("Plate Total")).toBeVisible({ timeout: 5000 });

    // Check dish names appear
    await expect(page.getByText("Dal Tadka")).toBeVisible();
    await expect(page.getByText("Jeera Rice")).toBeVisible();
    await expect(page.getByText("Aloo Gobi")).toBeVisible();

    // Check total calories
    await expect(page.getByText("550 kcal")).toBeVisible();

    // Check analysis complete badge
    await expect(page.getByText("Analysis complete")).toBeVisible();

    // Click Scan Again
    await page.getByRole("button", { name: "Scan Again" }).click();

    // Should return to camera-ready state with Analyze Dish button
    await expect(page.getByRole("button", { name: "Analyze Dish" })).toBeVisible({ timeout: 3000 });
  });

  test("mock scan → log meal", async ({ page }) => {
    await page.goto("/?mock=scan");

    // Start camera and analyze
    await page.getByRole("button", { name: "Start Camera" }).click();
    await page.getByRole("button", { name: "Analyze Dish" }).click();

    // Wait for results
    await expect(page.getByText("Plate Total")).toBeVisible({ timeout: 5000 });

    // Click Log This Meal
    await page.getByRole("button", { name: "Log This Meal" }).click();

    // Should show logged confirmation
    await expect(page.getByText("Logged")).toBeVisible({ timeout: 3000 });
  });
});
