/**
 * Edge Case Calorie Benchmark
 *
 * Tests foods that are NOT in the prompt reference table:
 * - Packaged/branded snacks
 * - Office/work food
 * - Restaurant/takeout
 * - Mixed cuisine
 * - Street food not in reference
 * - Fruits and drinks
 *
 * Ground truth from USDA FoodData Central, IFCT 2017, and manufacturer labels.
 *
 * Usage:
 *   1. Start dev server: npm run dev
 *   2. Run: npx tsx scripts/benchmark-edge-cases.ts
 *   3. Save: npx tsx scripts/benchmark-edge-cases.ts --save edge-before
 */

const BASE_URL = process.env.BENCHMARK_URL || "http://localhost:3000";

interface GroundTruthMeal {
  description: string;
  mealType: string;
  expectedCalories: number;
  breakdown: string;
  source: string;
  category: string;
}

interface BenchmarkResult {
  meal: string;
  category: string;
  expected: number;
  got: number;
  error: number;
  errorPct: number;
  dishes: Array<{ name: string; calories: number }>;
}

const EDGE_CASES: GroundTruthMeal[] = [
  // ─── PACKAGED SNACKS (not in reference) ───
  {
    description: "1 small packet Lays chips, 30g",
    mealType: "snack",
    expectedCalories: 160,
    breakdown: "Lays classic 30g pack = ~160 kcal (label)",
    source: "Manufacturer label",
    category: "Packaged snack",
  },
  {
    description: "1 packet Maggi noodles, 70g pack cooked",
    mealType: "snack",
    expectedCalories: 310,
    breakdown: "Maggi 70g pack = ~310 kcal (label: 206 noodles + 104 tastemaker)",
    source: "Manufacturer label",
    category: "Packaged snack",
  },
  {
    description: "2 Parle-G biscuits with chai",
    mealType: "snack",
    expectedCalories: 100,
    breakdown: "2 Parle-G biscuits ~18g = ~80 kcal + chai ~20 kcal",
    source: "Manufacturer label + IFCT",
    category: "Packaged snack",
  },

  // ─── OFFICE / WORK FOOD ───
  {
    description: "1 veg sandwich from canteen with mayo and cheese",
    mealType: "lunch",
    expectedCalories: 350,
    breakdown: "2 slices bread 160 + cheese 50 + mayo 50 + veggies 30 + butter 60",
    source: "USDA + estimates",
    category: "Office food",
  },
  {
    description: "1 cup black coffee with 2 sugar packets",
    mealType: "snack",
    expectedCalories: 30,
    breakdown: "Black coffee ~2 kcal + 2 sugar packets (8g) ~28 kcal",
    source: "USDA",
    category: "Office food",
  },

  // ─── RESTAURANT / TAKEOUT (not in reference) ───
  {
    description: "1 plate hakka noodles with vegetables, restaurant style",
    mealType: "dinner",
    expectedCalories: 450,
    breakdown: "Hakka noodles ~300g at ~150 kcal/100g (restaurant oil levels)",
    source: "IFCT + restaurant estimates",
    category: "Restaurant",
  },
  {
    description: "1 plate paneer tikka, 6 pieces with mint chutney",
    mealType: "dinner",
    expectedCalories: 350,
    breakdown: "6 paneer tikka pieces ~180g at ~180 kcal/100g + chutney 20",
    source: "IFCT",
    category: "Restaurant",
  },
  {
    description: "1 shawarma roll, chicken",
    mealType: "lunch",
    expectedCalories: 400,
    breakdown: "Chicken shawarma wrap ~250g at ~160 kcal/100g",
    source: "USDA + estimates",
    category: "Restaurant",
  },

  // ─── FRUITS / DRINKS (partially in reference) ───
  {
    description: "1 medium mango, about 200g flesh",
    mealType: "snack",
    expectedCalories: 120,
    breakdown: "Mango flesh 200g at ~60 kcal/100g",
    source: "IFCT",
    category: "Fruit",
  },
  {
    description: "1 glass mango shake with milk and sugar, 300ml",
    mealType: "snack",
    expectedCalories: 210,
    breakdown: "Mango 100g=60 + milk 200ml=120 + sugar 1tbsp=30",
    source: "IFCT + USDA",
    category: "Drink",
  },

  // ─── MIXED / UNUSUAL COMBOS ───
  {
    description: "1 plate fried rice with manchurian gravy",
    mealType: "lunch",
    expectedCalories: 550,
    breakdown: "Fried rice 250g at ~170/100g=425 + manchurian gravy 100g=125",
    source: "IFCT + restaurant estimates",
    category: "Indo-Chinese",
  },
  {
    description: "2 slices Dominos cheese pizza with garlic bread 2 pieces",
    mealType: "dinner",
    expectedCalories: 650,
    breakdown: "2 pizza slices ~200g at 266/100g=530 + 2 garlic bread ~120",
    source: "USDA + Dominos nutrition",
    category: "Fast food",
  },

  // ─── SOUTH INDIAN / REGIONAL ───
  {
    description: "1 plate lemon rice with papad and pickle",
    mealType: "lunch",
    expectedCalories: 380,
    breakdown: "Lemon rice 250g at ~140/100g=350 + papad 20 + pickle 10",
    source: "IFCT",
    category: "South Indian",
  },
  {
    description: "1 plate pongal with coconut chutney and sambar",
    mealType: "breakfast",
    expectedCalories: 350,
    breakdown: "Pongal 200g at ~130/100g=260 + chutney 50 + sambar 40",
    source: "IFCT",
    category: "South Indian",
  },

  // ─── SWEETS / DESSERTS ───
  {
    description: "2 pieces gulab jamun",
    mealType: "snack",
    expectedCalories: 300,
    breakdown: "2 gulab jamun ~100g at ~300 kcal/100g",
    source: "IFCT",
    category: "Indian sweet",
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
  console.log("EDGE CASE CALORIE BENCHMARK");
  console.log(`Target: ${BASE_URL}`);
  console.log(`Time: ${new Date().toISOString()}`);
  console.log("=".repeat(70));
  console.log();

  const results: BenchmarkResult[] = [];
  let totalAbsErrorPct = 0;

  for (let i = 0; i < EDGE_CASES.length; i++) {
    const meal = EDGE_CASES[i];
    process.stdout.write(
      `[${i + 1}/${EDGE_CASES.length}] (${meal.category}) ${meal.description.slice(0, 45)}... `,
    );

    try {
      const { totalCalories, dishes } = await callDescribeMeal(meal.description, meal.mealType);
      const error = totalCalories - meal.expectedCalories;
      const errorPct = Math.round((Math.abs(error) / meal.expectedCalories) * 100);

      results.push({
        meal: meal.description,
        category: meal.category,
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
        category: meal.category,
        expected: meal.expectedCalories,
        got: 0,
        error: -meal.expectedCalories,
        errorPct: 100,
        dishes: [],
      });
      totalAbsErrorPct += 1;
    }

    if (i < EDGE_CASES.length - 1) {
      await new Promise((r) => setTimeout(r, 1500));
    }
  }

  const mape = Math.round((totalAbsErrorPct / EDGE_CASES.length) * 100);
  const passing = results.filter((r) => r.errorPct <= 15).length;
  const warning = results.filter((r) => r.errorPct > 15 && r.errorPct <= 25).length;
  const failing = results.filter((r) => r.errorPct > 25).length;

  console.log();
  console.log("=".repeat(70));
  console.log("RESULTS SUMMARY");
  console.log("=".repeat(70));
  console.log(`MAPE (Mean Absolute Percentage Error): ${mape}%`);
  console.log(`PASS (<=15% off): ${passing}/${EDGE_CASES.length}`);
  console.log(`WARN (16-25% off): ${warning}/${EDGE_CASES.length}`);
  console.log(`FAIL (>25% off): ${failing}/${EDGE_CASES.length}`);
  console.log();

  // Group by category
  const byCategory = new Map<string, BenchmarkResult[]>();
  for (const r of results) {
    const list = byCategory.get(r.category) || [];
    list.push(r);
    byCategory.set(r.category, list);
  }

  console.log("By category:");
  console.log("-".repeat(70));
  for (const [cat, items] of byCategory) {
    const catMape = Math.round(
      (items.reduce((s, r) => s + Math.abs(r.error) / r.expected, 0) / items.length) * 100,
    );
    const catPass = items.filter((r) => r.errorPct <= 15).length;
    console.log(`  ${cat}: MAPE ${catMape}%, ${catPass}/${items.length} pass`);
  }

  console.log();
  console.log("Per-meal breakdown:");
  console.log("-".repeat(70));
  for (const r of results) {
    const sign = r.error >= 0 ? "+" : "";
    const status = r.errorPct <= 15 ? "PASS" : r.errorPct <= 25 ? "WARN" : "FAIL";
    console.log(
      `[${status}] (${r.category.padEnd(15)}) ${r.meal.slice(0, 40).padEnd(40)} | exp ${String(r.expected).padStart(4)} | got ${String(r.got).padStart(4)} | ${sign}${String(r.error).padStart(4)} (${r.errorPct}%)`,
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
      byCategory: Object.fromEntries(
        [...byCategory].map(([cat, items]) => [
          cat,
          {
            mape: Math.round(
              (items.reduce((s, r) => s + Math.abs(r.error) / r.expected, 0) / items.length) * 100,
            ),
            pass: items.filter((r) => r.errorPct <= 15).length,
            total: items.length,
          },
        ]),
      ),
    };
    fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
    console.log(`\nResults saved to ${outPath}`);
  }
}

runBenchmark().catch((err) => {
  console.error("Benchmark failed:", err);
  process.exit(1);
});
