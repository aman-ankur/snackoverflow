# Testing Strategy

## Overview

Testing is split into two categories:

1. **Calorie Accuracy Benchmarks** — automated scripts that measure AI estimation error against ground truth
2. **UI Feature Tests** — Playwright MCP-driven browser tests with mocked API responses

---

## 1. Calorie Accuracy Benchmarks

### Scripts

| Script | Meals | Focus |
|--------|:-----:|-------|
| `scripts/benchmark-calories.ts` | 10 | Core Indian home-cooked meals (roti, dal, rice, paneer, etc.) |
| `scripts/benchmark-edge-cases.ts` | 15 | Packaged snacks, restaurant food, mixed cuisine, drinks |

### Running

```bash
# Start dev server first
npm run dev

# Core meals
npx tsx scripts/benchmark-calories.ts

# Edge cases
npx tsx scripts/benchmark-edge-cases.ts

# Save results to JSON for comparison
npx tsx scripts/benchmark-calories.ts --save before
npx tsx scripts/benchmark-calories.ts --save after
```

### What They Measure

Each script sends predefined meal descriptions to `/api/describe-meal` and compares the returned total calories against ground truth values sourced from IFCT 2017 and USDA FoodData Central.

**Metrics:**
- **Per-meal error**: `|estimated - expected| / expected * 100`
- **MAPE** (Mean Absolute Percentage Error): average of all per-meal errors
- **Pass/Fail**: a meal passes if error is within ±25%

### Result Snapshots

Saved in `scripts/benchmark-results-*.json` for historical comparison:

| Snapshot | MAPE | Context |
|----------|:----:|---------|
| `benchmark-results-before.json` | ~26% | Baseline — no reference table |
| `benchmark-results-after.json` | ~9% | After adding IFCT/USDA reference DB |
| `benchmark-results-core-final.json` | ~9% | After prompt tuning |
| `benchmark-results-edge-after.json` | ~35% | Edge cases — first pass |
| `benchmark-results-edge-final.json` | ~22% | Edge cases — after per-piece anchors |

### Custom Target URL

```bash
BENCHMARK_URL=https://your-deployment.vercel.app npx tsx scripts/benchmark-calories.ts
```

---

## 2. UI Feature Tests (Playwright MCP)

### Mock Scan Mode (`?mock=scan`)

A built-in mock mode that simulates the entire dish scan flow without a real camera or API calls. Activated by URL query parameter.

**How it works:**
- `useDishScanner` detects `?mock=scan` in the URL on mount
- `startCamera()` → sets `isStreaming=true` without calling `getUserMedia`
- `analyzeFrame()` → dynamic-imports mock data, sets a fake captured frame, waits 1.5s, returns a `DishAnalysisResult` with 3 Indian dishes and `provider: "MOCK"`
- `stopCamera()` → sets `isStreaming=false` without touching MediaStream
- `page.tsx` auto-switches to the Scan tab and skips onboarding

**Mock data** (`src/lib/mockScanData.ts`):
| Dish | Calories | Protein | Carbs | Fat | Fiber |
|------|:--------:|:-------:|:-----:|:---:|:-----:|
| Dal Tadka | 180 | 9g | 22g | 6g | 4g |
| Jeera Rice | 210 | 4g | 42g | 3g | 1g |
| Aloo Gobi | 160 | 4g | 18g | 8g | 3g |
| **Plate Total** | **550** | **17g** | **82g** | **17g** | **8g** |

**Manual testing:**
```bash
npm run dev
# Visit http://localhost:3000/?mock=scan
# Click Start Camera → Analyze Dish → see frozen frame + results → Scan Again
```

**Playwright E2E tests** (`e2e/dish-scan-mock.spec.ts`):
```bash
npm run dev                                        # Start dev server first
npx playwright test e2e/dish-scan-mock.spec.ts     # Run mock scan tests
```

Tests cover:
1. Full flow: Start Camera → Analyze Dish → frozen frame + "Analyzing your meal..." → results (3 dishes, 550 kcal) → "Analysis complete" badge → Scan Again
2. Log flow: scan → Log This Meal → "Logged" confirmation

**Production safety:** Without `?mock=scan`, the mock data module is never imported (dynamic import). No camera permissions, API calls, or env vars needed for mock mode.

### Upload Photo Mock Mode

When `?mock=scan` or dev mode is active, `analyzeImage()` (used by the Upload tab) also returns mock data instead of calling the real API. The upload component compresses the image client-side, then passes it to `analyzeImage()` which returns `getNextMockScenario()` data after the standard mock delay.

### Calorie Warning E2E Tests (`e2e/calorie-warning.spec.ts`)

15 tests covering the calorie goal exceeded warning feature:

```bash
npx playwright test e2e/calorie-warning.spec.ts
```

**CalorieRing color thresholds:**
| Test | Eaten/Goal | Expected Ring Color |
|------|:----------:|:-------------------:|
| Under goal (50%) | 1000/2000 | Green |
| At goal (100%) | 2000/2000 | Green |
| Slightly over (105%) | 2100/2000 | Amber |
| At 109% | 2180/2000 | Amber |
| At 111% | 2220/2000 | Red |
| Way over (120%) | 2400/2000 | Red |
| Massively over (200%) | 4000/2000 | Red |
| No meals (0%) | 0/2000 | Green |

**Other tests:**
- "kcal over" text displayed when exceeding goal
- 1 kcal over edge case (amber)
- Exact over amount calculation (2388/2029 → 359)
- Progress bar turns red when over goal

**Capy message threshold bands:**
| Test | Eaten % | Expected Message Band |
|------|:-------:|:---------------------:|
| 50% | on-track | Not goal-hit messages |
| 98% | goal hit | "You did it!" etc. |
| 115% | slightly over | "A bit over today" etc. |
| 140% | over goal | "Big appetite" etc. |

### Upload Photo E2E Tests (`e2e/upload-photo.spec.ts`)

6 tests covering the upload photo scan mode:

```bash
npx playwright test e2e/upload-photo.spec.ts
```

| Test | What it verifies |
|------|-----------------|
| Tab visible + switchable | Upload button appears, click shows upload zone |
| 3-way mode switching | Camera → Upload → Describe → Camera → Upload all work |
| Upload zone hidden in camera mode | Only visible when Upload tab is active |
| Upload zone hidden in describe mode | Only visible when Upload tab is active |
| File input accepts images | `input[type="file"][accept="image/*"]` is present |
| Photo upload triggers analysis | Setting a file on the input triggers the flow |

### Approach: Mock API Responses

We intercept `fetch` calls in the browser to return deterministic mock data. This avoids AI API calls during testing, making tests fast, free, and repeatable.

### Mock Injection Pattern

**For Describe flow** (intercept via `window.fetch` override):

```javascript
// Inject before interacting with the page
const origFetch = window.fetch;
window.fetch = async function(url, opts) {
  if (typeof url === 'string' && url.includes('/api/describe-meal')) {
    const mockResponse = {
      dishes: [{
        name: 'Paneer Bhurji',
        hindi: 'पनीर भुर्जी',
        portions: [
          { label: 'Small (100g)', weight_g: 100, calories: 200, protein_g: 12, carbs_g: 6, fat_g: 14, fiber_g: 1 },
          { label: 'Regular (150g)', weight_g: 150, calories: 300, protein_g: 18, carbs_g: 9, fat_g: 21, fiber_g: 2 },
          { label: 'Large (200g)', weight_g: 200, calories: 400, protein_g: 24, carbs_g: 12, fat_g: 28, fiber_g: 3 },
        ],
        defaultIndex: 1,
        ingredients: ['paneer', 'onion', 'tomato', 'spices'],
        confidence: 'high',
        tags: ['high-protein'],
        healthTip: 'Good source of protein',
        reasoning: 'Mock data for testing',
      }]
    };
    return new Response(JSON.stringify(mockResponse), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return origFetch.apply(this, arguments);
};
```

**For Camera/Scan flow** (intercept via Playwright route):

```javascript
// Using Playwright's page.route() for server-level interception
await page.route('**/api/analyze-dish', async route => {
  const mockResponse = {
    dishes: [{
      name: 'Dal Tadka',
      portion: 'Regular (150g)',
      estimated_weight_g: 150,
      calories: 180,
      protein_g: 10,
      carbs_g: 22,
      fat_g: 6,
      fiber_g: 4,
      // ... other fields
    }],
    totalCalories: 180,
    totalProtein: 10,
    totalCarbs: 22,
    totalFat: 6,
    totalFiber: 4,
  };
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(mockResponse),
  });
});
```

### Why Two Mock Methods

| Method | When to Use | Pros | Cons |
|--------|-------------|------|------|
| `window.fetch` override | Describe flow (client triggers fetch) | Simple, no Playwright API needed | Doesn't survive page reload |
| `page.route()` | Camera flow or any flow | Survives reload, intercepts at network level | Requires Playwright `run_code` |

### Scaling Logic Verification

The proportional scaling logic (`scaleDish` and calorie override ratio) can be verified purely in the browser console without any UI interaction:

```javascript
// Run via browser_evaluate
function scaleDish(dish, multiplier) {
  return {
    ...dish,
    calories: Math.round(dish.calories * multiplier),
    protein_g: Math.round(dish.protein_g * multiplier),
    carbs_g: Math.round(dish.carbs_g * multiplier),
    fat_g: Math.round(dish.fat_g * multiplier),
    fiber_g: Math.round(dish.fiber_g * multiplier),
    estimated_weight_g: Math.round(dish.estimated_weight_g * multiplier),
  };
}

const dish = { calories: 180, protein_g: 10, carbs_g: 22, fat_g: 6, fiber_g: 4, estimated_weight_g: 150 };

// Test: calorie override 180 -> 120
const ratio = 120 / 180; // 0.667
const result = scaleDish(dish, ratio);
// Expected: calories=120, protein_g=7, carbs_g=15, fat_g=4, weight=100
```

---

## 3. Test Results — Calorie Editing Feature

**Date:** 2026-02-23
**Tool:** Playwright MCP (headless Chromium)
**Mock data:** Deterministic (no AI calls)

### Describe Flow (Text-Based Meal)

| Test | Input | Expected | Actual | Status |
|------|-------|----------|--------|:------:|
| Edit calories (direct input) | Paneer Bhurji 300→200 kcal | P:12g C:6g F:14g | P:12g C:6g F:14g | PASS |
| Plate total updates | 2 dishes after override | 296 kcal | 296 kcal | PASS |
| Reset to AI estimate | Click Reset on Paneer Bhurji | 300 kcal, P:18g C:9g F:21g | 300 kcal, P:18g C:9g F:21g | PASS |
| Minus button (-10) | Roti 96→86→76 kcal | P:2g C:13g | P:2g C:13g | PASS |
| Portion change resets override | Roti override 76, switch to Large | 120 kcal (Large), no override | 120 kcal, Reset button gone | PASS |

### Scaling Logic (Console Unit Tests)

| Test | Input | Expected | Actual | Status |
|------|-------|----------|--------|:------:|
| Calorie override ratio | 180→120 (×0.667) | P:7 C:15 F:4 W:100 | P:7 C:15 F:4 W:100 | PASS |
| Servings 2x | ×2.0 | cal:360 P:20 | cal:360 P:20 | PASS |
| Servings 2x + calorie override | 360→300 | P:17 C:37 | P:17 C:37 | PASS |
| Weight override | 150g→200g | cal:240 P:13 | cal:240 P:13 | PASS |

### Camera/Scan Flow

Camera flow uses the same `CalorieEditor` component and identical `calorieOverrides` + `scaledDishes` logic as the Describe flow. The scaling math was verified via console unit tests above. Full E2E camera test requires a real camera or canvas injection (not covered in automated tests).

---

## 4. Running Tests Manually

### Describe Flow E2E (Playwright MCP)

1. Navigate to `http://localhost:3000`
2. Dismiss onboarding/coach marks
3. Go to Scan tab → Describe mode
4. Inject fetch mock via `browser_evaluate` (see pattern above)
5. Type a meal description → click "Analyze with AI"
6. Verify mock data renders correctly
7. Click "Edit calories" → modify → verify macros scale
8. Click "Reset" → verify original values restored
9. Change portion → verify override cleared

### Benchmark Suite

```bash
npm run dev
npx tsx scripts/benchmark-calories.ts
npx tsx scripts/benchmark-edge-cases.ts
```

Compare MAPE against baseline snapshots in `scripts/benchmark-results-*.json`.
