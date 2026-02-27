import { test, expect, Page } from "@playwright/test";

/**
 * Seeds localStorage with a custom calorie goal and meals totaling a specific calorie amount.
 */
function seedWithCalories(
  page: Page,
  totalCalories: number,
  goalCalories: number,
  streakDays = 0
) {
  return page.evaluate(
    ({ totalCalories, goalCalories, streakDays }) => {
      const STORAGE_KEY = "snackoverflow-meal-log-v1";
      const PROFILE_KEY = "snackoverflow-user-goals-v1";
      const now = new Date();
      const todayISO = now.toISOString();
      const todayAt = (h: number, m: number) => {
        const d = new Date(now);
        d.setHours(h, m, 0, 0);
        return d.toISOString();
      };

      const meals =
        totalCalories > 0
          ? [
              {
                id: "test-meal-1",
                mealType: "lunch",
                loggedAt: todayAt(13, 0),
                servingsMultiplier: 1,
                dishes: [
                  {
                    name: "Test Meal",
                    hindi: "",
                    portion: "1 serving",
                    calories: totalCalories,
                    protein_g: Math.round(totalCalories * 0.1),
                    carbs_g: Math.round(totalCalories * 0.15),
                    fat_g: Math.round(totalCalories * 0.05),
                    fiber_g: 5,
                    estimated_weight_g: 300,
                    ingredients: ["test"],
                    confidence: "high",
                    tags: [],
                    healthTip: "",
                    reasoning: "",
                  },
                ],
                totals: {
                  calories: totalCalories,
                  protein: Math.round(totalCalories * 0.1),
                  carbs: Math.round(totalCalories * 0.15),
                  fat: Math.round(totalCalories * 0.05),
                  fiber: 5,
                },
              },
            ]
          : [];

      const profileData = {
        profile: {
          name: "Test User",
          gender: "male",
          age: 28,
          heightCm: 175,
          weightKg: 72,
          activityLevel: "moderate",
          goal: "maintain",
          completedAt: todayISO,
        },
        goals: {
          calories: goalCalories,
          protein: 120,
          carbs: 275,
          fat: 73,
          tdee: goalCalories,
          isCustom: false,
        },
        streak: {
          currentStreak: streakDays,
          lastLogDate: todayISO.slice(0, 10),
          longestStreak: streakDays,
        },
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(meals));
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profileData));
    },
    { totalCalories, goalCalories, streakDays }
  );
}

async function seedAndGoHome(
  page: Page,
  totalCalories: number,
  goalCalories: number,
  streakDays = 0
) {
  // First navigate to set up the origin for localStorage
  await page.goto("/");
  // Wait for page to be ready
  await page.waitForLoadState("domcontentloaded");
  // Seed localStorage
  await page.evaluate(
    ({ totalCalories, goalCalories, streakDays }) => {
      // Clear any stale state first
      localStorage.clear();
      const STORAGE_KEY = "snackoverflow-meal-log-v1";
      const PROFILE_KEY = "snackoverflow-user-goals-v1";
      const now = new Date();
      const todayISO = now.toISOString();
      const todayAt = (h: number, m: number) => {
        const d = new Date(now);
        d.setHours(h, m, 0, 0);
        return d.toISOString();
      };

      const meals =
        totalCalories > 0
          ? [
              {
                id: "test-meal-1",
                mealType: "lunch",
                loggedAt: todayAt(13, 0),
                servingsMultiplier: 1,
                dishes: [
                  {
                    name: "Test Meal",
                    hindi: "",
                    portion: "1 serving",
                    calories: totalCalories,
                    protein_g: Math.round(totalCalories * 0.1),
                    carbs_g: Math.round(totalCalories * 0.15),
                    fat_g: Math.round(totalCalories * 0.05),
                    fiber_g: 5,
                    estimated_weight_g: 300,
                    ingredients: ["test"],
                    confidence: "high",
                    tags: [],
                    healthTip: "",
                    reasoning: "",
                  },
                ],
                totals: {
                  calories: totalCalories,
                  protein: Math.round(totalCalories * 0.1),
                  carbs: Math.round(totalCalories * 0.15),
                  fat: Math.round(totalCalories * 0.05),
                  fiber: 5,
                },
              },
            ]
          : [];

      const profileData = {
        profile: {
          name: "Test User",
          gender: "male",
          age: 28,
          heightCm: 175,
          weightKg: 72,
          activityLevel: "moderate",
          goal: "maintain",
          completedAt: todayISO,
        },
        goals: {
          calories: goalCalories,
          protein: 120,
          carbs: 275,
          fat: 73,
          tdee: goalCalories,
          isCustom: false,
        },
        streak: {
          currentStreak: streakDays,
          lastLogDate: todayISO.slice(0, 10),
          longestStreak: streakDays,
        },
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(meals));
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profileData));
    },
    { totalCalories, goalCalories, streakDays }
  );
  // Reload so the app reads the seeded data
  await page.reload();
  await expect(
    page.getByText(/Good (morning|afternoon|evening)/)
  ).toBeVisible({ timeout: 5000 });
}

/** Get the CalorieRing's progress circle stroke color via the SVG in "Daily Intake" section */
async function getRingStroke(page: Page): Promise<string | null> {
  // The CalorieRing SVG is inside the section with "Daily Intake" heading
  // It's a motion.circle with strokeDasharray (the progress arc, 2nd circle in SVG)
  return page.evaluate(() => {
    // Find all SVG circles - the CalorieRing has specific dimensions (140x140)
    const svgs = document.querySelectorAll('svg[width="140"][height="140"]');
    if (svgs.length === 0) return null;
    const svg = svgs[0];
    // Second circle is the progress arc
    const circles = svg.querySelectorAll('circle');
    if (circles.length < 2) return null;
    return circles[1].getAttribute('stroke');
  });
}

/** Get the "kcal left" or "kcal over" label text from the header area */
async function getKcalLabel(page: Page): Promise<string> {
  // The header area has: <p>number</p> <p>kcal left/over</p>
  const el = page.locator('text=/kcal (left|over)/').first();
  return (await el.textContent()) || "";
}

test.describe("Calorie Goal Warning — HomeView", () => {
  test("under goal (50%): green ring, 'kcal left'", async ({ page }) => {
    await seedAndGoHome(page, 1000, 2000);

    await expect(page.getByText("kcal left")).toBeVisible();
    const stroke = await getRingStroke(page);
    expect(stroke).toBe("var(--color-accent)");
  });

  test("at goal (100%): green ring, 'kcal left'", async ({ page }) => {
    await seedAndGoHome(page, 2000, 2000);

    await expect(page.getByText("kcal left")).toBeVisible();
    const stroke = await getRingStroke(page);
    expect(stroke).toBe("var(--color-accent)");
  });

  test("slightly over (105%): amber ring + 'kcal over'", async ({ page }) => {
    await seedAndGoHome(page, 2100, 2000);

    await expect(page.getByText("kcal over")).toBeVisible();
    const stroke = await getRingStroke(page);
    expect(stroke).toBe("#F0A030");
  });

  test("way over (120%): red ring + 'kcal over'", async ({ page }) => {
    await seedAndGoHome(page, 2400, 2000);

    await expect(page.getByText("kcal over")).toBeVisible();
    const stroke = await getRingStroke(page);
    expect(stroke).toBe("#E05050");
  });

  test("at 109%: amber (below red threshold)", async ({ page }) => {
    await seedAndGoHome(page, 2180, 2000);

    await expect(page.getByText("kcal over")).toBeVisible();
    const stroke = await getRingStroke(page);
    expect(stroke).toBe("#F0A030");
  });

  test("at 111%: red", async ({ page }) => {
    await seedAndGoHome(page, 2220, 2000);

    const stroke = await getRingStroke(page);
    expect(stroke).toBe("#E05050");
  });

  test("massively over (200%): red ring + 'kcal over'", async ({ page }) => {
    await seedAndGoHome(page, 4000, 2000);

    await expect(page.getByText("kcal over")).toBeVisible();
    const stroke = await getRingStroke(page);
    expect(stroke).toBe("#E05050");
  });

  test("no meals: green ring, 'kcal left'", async ({ page }) => {
    await seedAndGoHome(page, 0, 2000);

    await expect(page.getByText("kcal left")).toBeVisible();
    const stroke = await getRingStroke(page);
    expect(stroke).toBe("var(--color-accent)");
  });

  test("progress bar turns red when over goal", async ({ page }) => {
    await seedAndGoHome(page, 2400, 2000);

    const progressBar = page.locator("div.bg-red-500").first();
    await expect(progressBar).toBeVisible();
  });

  test("1 kcal over: amber ring, 'kcal over'", async ({ page }) => {
    await seedAndGoHome(page, 2001, 2000);

    await expect(page.getByText("kcal over")).toBeVisible();
    const stroke = await getRingStroke(page);
    expect(stroke).toBe("#F0A030");
  });

  test("over amount is correct (2388/2029 → 359 over)", async ({ page }) => {
    await seedAndGoHome(page, 2388, 2029);

    // 2388 - 2029 = 359 over
    // The header shows the number then "kcal over"
    // Find the paragraph right before "kcal over"
    const overLabel = page.getByText("kcal over");
    await expect(overLabel).toBeVisible();

    // Check the number displayed is 359
    const numberEl = page.locator('p.text-lg.font-bold.text-red-500').first();
    const text = await numberEl.textContent();
    expect(text).toBe("359");
  });
});

test.describe("Capy Messages — Threshold Bands", () => {
  test("50% eaten: on-track messages (not goal hit)", async ({ page }) => {
    await seedAndGoHome(page, 1000, 2000);

    const text = (await page.locator(".max-w-\\[200px\\]").textContent()) || "";
    expect(text).not.toMatch(/did it|100%|Goals crushed|unstoppable/i);
  });

  test("98% eaten: goal hit messages", async ({ page }) => {
    await seedAndGoHome(page, 1960, 2000);

    const text = (await page.locator(".max-w-\\[200px\\]").textContent()) || "";
    expect(text).toMatch(/did it|100%|Goals crushed|unstoppable|proud/i);
  });

  test("115% eaten: slightly over messages (gentle nudge)", async ({ page }) => {
    await seedAndGoHome(page, 2300, 2000);

    const text = (await page.locator(".max-w-\\[200px\\]").textContent()) || "";
    expect(text).toMatch(/bit over|Slightly past|little over/i);
  });

  test("140% eaten: over goal / concerned messages", async ({ page }) => {
    await seedAndGoHome(page, 2800, 2000);

    const text = (await page.locator(".max-w-\\[200px\\]").textContent()) || "";
    expect(text).toMatch(/Big appetite|over target|a lot|fresh start/i);
  });
});
