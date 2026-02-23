/**
 * Calorie Estimation Benchmark
 *
 * Calls the describe-meal API with 10 known meals and compares
 * the returned calories against IFCT/NIN/USDA ground truth.
 *
 * Usage:
 *   1. Start the dev server: npm run dev
 *   2. Run: npx tsx scripts/benchmark-calories.ts
 *   3. Optionally save results: npx tsx scripts/benchmark-calories.ts --save before
 */

const BASE_URL = process.env.BENCHMARK_URL || "http://localhost:3000";

interface GroundTruthMeal {
  description: string;
  mealType: string;
  expectedCalories: number;
  breakdown: string;
  source: string;
}

interface BenchmarkResult {
  meal: string;
  expected: number;
  got: number;
  error: number;
  errorPct: number;
  dishes: Array<{ name: string; calories: number }>;
}

const TEST_MEALS: GroundTruthMeal[] = [
  {
    description: "2 roti, 1 katori dal tadka, 1 serving paneer bhurji",
    mealType: "dinner",
    expectedCalories: 480,
    breakdown: "Roti 2x80=160, Dal tadka 170, Paneer bhurji 150",
    source: "IFCT 2017",
  },
  {
    description: "1 plate rajma chawal, 1 cup rice and 1 katori rajma",
    mealType: "lunch",
    expectedCalories: 470,
    breakdown: "Rice 1 cup cooked 230, Rajma 1 katori 240",
    source: "IFCT 2017",
  },
  {
    description: "2 plain dosa with coconut chutney and sambar",
    mealType: "breakfast",
    expectedCalories: 400,
    breakdown: "Dosa 2x130=260, Coconut chutney 60, Sambar 80",
    source: "IFCT 2017",
  },
  {
    description: "1 plate chicken biryani, about 300g serving",
    mealType: "lunch",
    expectedCalories: 480,
    breakdown: "Chicken biryani ~160 kcal/100g x 300g",
    source: "IFCT 2017 + USDA",
  },
  {
    description: "1 bowl poha with peanuts and lemon",
    mealType: "breakfast",
    expectedCalories: 280,
    breakdown: "Poha ~250g at ~112 kcal/100g",
    source: "IFCT 2017",
  },
  {
    description: "2 slices white bread with butter and 1 boiled egg",
    mealType: "breakfast",
    expectedCalories: 330,
    breakdown: "Bread 2x80=160, Butter 1 tbsp 70, Boiled egg 80",
    source: "USDA FoodData Central",
  },
  {
    description: "1 plate chole bhature, 2 bhature and 1 katori chole",
    mealType: "lunch",
    expectedCalories: 680,
    breakdown: "Bhature 2x200=400, Chole 1 katori 280",
    source: "IFCT 2017",
  },
  {
    description: "1 cup vanilla ice cream, about 130g",
    mealType: "snack",
    expectedCalories: 270,
    breakdown: "Ice cream ~207 kcal/100g x 130g",
    source: "USDA FoodData Central",
  },
  {
    description: "1 masala dosa with sambar and coconut chutney",
    mealType: "breakfast",
    expectedCalories: 370,
    breakdown: "Masala dosa 250, Sambar 60, Chutney 60",
    source: "IFCT 2017",
  },
  {
    description: "3 idli with sambar and coconut chutney",
    mealType: "breakfast",
    expectedCalories: 290,
    breakdown: "Idli 3x60=180, Sambar 60, Chutney 50",
    source: "IFCT 2017",
  },
];

async function callDescribeMeal(
  description: string,
  mealType: string,
): Promise<{ totalCalories: number; dishes: Array<{ name: string; calories: number }> }> {
  const res = await fetch(`${BASE_URL}/api/describe-meal`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ description, mealType }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }

  const data = await res.json();

  if (!data.dishes || !Array.isArray(data.dishes)) {
    throw new Error(`Unexpected response shape: ${JSON.stringify(data).slice(0, 200)}`);
  }

  let totalCalories = 0;
  const dishes: Array<{ name: string; calories: number }> = [];

  for (const dish of data.dishes) {
    const portions = dish.portions;
    const defaultIdx = dish.defaultIndex ?? 1;
    const portion = portions?.[defaultIdx] ?? portions?.[1] ?? portions?.[0];
    if (portion) {
      totalCalories += portion.calories;
      dishes.push({ name: dish.name, calories: portion.calories });
    }
  }

  return { totalCalories, dishes };
}

async function runBenchmark(): Promise<void> {
  const saveLabel = process.argv.includes("--save")
    ? process.argv[process.argv.indexOf("--save") + 1]
    : null;

  console.log("=".repeat(70));
  console.log("CALORIE ESTIMATION BENCHMARK");
  console.log(`Target: ${BASE_URL}`);
  console.log(`Time: ${new Date().toISOString()}`);
  console.log("=".repeat(70));
  console.log();

  const results: BenchmarkResult[] = [];
  let totalAbsErrorPct = 0;

  for (let i = 0; i < TEST_MEALS.length; i++) {
    const meal = TEST_MEALS[i];
    process.stdout.write(`[${i + 1}/${TEST_MEALS.length}] ${meal.description.slice(0, 50)}... `);

    try {
      const { totalCalories, dishes } = await callDescribeMeal(meal.description, meal.mealType);
      const error = totalCalories - meal.expectedCalories;
      const errorPct = Math.round((Math.abs(error) / meal.expectedCalories) * 100);

      results.push({
        meal: meal.description,
        expected: meal.expectedCalories,
        got: totalCalories,
        error,
        errorPct,
        dishes,
      });

      totalAbsErrorPct += Math.abs(error) / meal.expectedCalories;

      const sign = error >= 0 ? "+" : "";
      const status = errorPct <= 15 ? "PASS" : errorPct <= 25 ? "WARN" : "FAIL";
      console.log(
        `${totalCalories} kcal (expected ${meal.expectedCalories}, ${sign}${error}, ${errorPct}% off) [${status}]`,
      );

      for (const d of dishes) {
        console.log(`    - ${d.name}: ${d.calories} kcal`);
      }
    } catch (err) {
      console.log(`ERROR: ${err instanceof Error ? err.message : err}`);
      results.push({
        meal: meal.description,
        expected: meal.expectedCalories,
        got: 0,
        error: -meal.expectedCalories,
        errorPct: 100,
        dishes: [],
      });
      totalAbsErrorPct += 1;
    }

    // Small delay to avoid rate limiting
    if (i < TEST_MEALS.length - 1) {
      await new Promise((r) => setTimeout(r, 1500));
    }
  }

  const mape = Math.round((totalAbsErrorPct / TEST_MEALS.length) * 100);
  const passing = results.filter((r) => r.errorPct <= 15).length;
  const warning = results.filter((r) => r.errorPct > 15 && r.errorPct <= 25).length;
  const failing = results.filter((r) => r.errorPct > 25).length;

  console.log();
  console.log("=".repeat(70));
  console.log("RESULTS SUMMARY");
  console.log("=".repeat(70));
  console.log(`MAPE (Mean Absolute Percentage Error): ${mape}%`);
  console.log(`PASS (<=15% off): ${passing}/${TEST_MEALS.length}`);
  console.log(`WARN (16-25% off): ${warning}/${TEST_MEALS.length}`);
  console.log(`FAIL (>25% off): ${failing}/${TEST_MEALS.length}`);
  console.log();

  console.log("Per-meal breakdown:");
  console.log("-".repeat(70));
  for (const r of results) {
    const sign = r.error >= 0 ? "+" : "";
    const status = r.errorPct <= 15 ? "PASS" : r.errorPct <= 25 ? "WARN" : "FAIL";
    console.log(
      `[${status}] ${r.meal.slice(0, 45).padEnd(45)} | exp ${String(r.expected).padStart(4)} | got ${String(r.got).padStart(4)} | ${sign}${String(r.error).padStart(4)} (${r.errorPct}%)`,
    );
  }

  if (saveLabel) {
    const fs = await import("fs");
    const path = await import("path");
    const outPath = path.join(__dirname, `benchmark-results-${saveLabel}.json`);
    const output = {
      label: saveLabel,
      timestamp: new Date().toISOString(),
      mape,
      passing,
      warning,
      failing,
      results,
    };
    fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
    console.log(`\nResults saved to ${outPath}`);
  }
}

runBenchmark().catch((err) => {
  console.error("Benchmark failed:", err);
  process.exit(1);
});
