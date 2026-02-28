# Custom React Hooks

All hooks are in `src/lib/`. All are `"use client"`.

---

## `useGeminiVision()` — Main Cloud AI Hook

**File**: `src/lib/useGeminiVision.ts`

### Exported Types
```ts
interface DetectedItem {
  name: string;
  hindi: string;
  quantity: string;
  confidence: "high" | "medium" | "low";
}

type DietaryFilter = "all" | "vegetarian" | "vegan" | "eggetarian" | "jain";

interface GeminiRecipe {
  name: string;
  hindi: string;
  time: string;
  difficulty: "Easy" | "Medium" | "Hard";
  description: string;
  ingredients_used: string[];
  ingredients_needed: string[];
  steps: string[];
  tags: string[];
  diet?: string;
}

interface AnalysisResult {
  items: DetectedItem[];
  recipes: GeminiRecipe[];
  tip: string;
}
```

### State
| State | Type | Description |
|---|---|---|
| `isStreaming` | boolean | Camera is active |
| `isAnalyzing` | boolean | API call in progress |
| `error` | string \| null | Current error message |
| `analysis` | AnalysisResult \| null | Latest analysis result |
| `allItems` | DetectedItem[] | Accumulated items across all scans (deduped, removed items filtered) |
| `lastAnalyzedAt` | Date \| null | Timestamp of last successful analysis |
| `autoScan` | boolean | Auto-scan mode active (every 4s) |
| `frameCount` | number | Number of successful scans |
| `dietaryFilter` | DietaryFilter | Current diet preference |
| `facingMode` | "user" \| "environment" | Camera direction (default: environment/rear) |

### Refs
- `videoRef` — HTMLVideoElement for camera feed
- `canvasRef` — HTMLCanvasElement for overlay
- `captureCanvasRef` — offscreen canvas for frame capture (512px max width, JPEG 0.6 quality)
- `streamRef` — MediaStream
- `intervalRef` — auto-scan interval

### Methods
| Method | Description |
|---|---|
| `startCamera()` | Request camera access, start streaming |
| `stopCamera()` | Stop all tracks, clear interval, reset state |
| `flipCamera()` | Toggle front/rear camera |
| `analyzeFrame()` | Capture frame → POST /api/analyze → update state |
| `toggleAutoScan()` | Start/stop 4-second auto-analysis interval |
| `removeItem(name)` | Remove item from accumulated list |
| `clearAnalysis()` | Reset all analysis state |
| `setDietaryFilter(f)` | Change dietary filter |

### Key Behaviors
- Frame capture downscales to max 512px wide (reduces API token usage)
- Items accumulate across scans — deduplication by lowercase name, keeps highest confidence
- On 429 rate limit, auto-scan is stopped automatically
- Camera restarts when facingMode changes (if already streaming)
- Stores recent fridge scan snapshots in localStorage (`snackoverflow-fridge-scan-history`) for Dish-mode linkage

---

## `useExpiryTracker()` — Freshness Tracking Hook

**File**: `src/lib/useExpiryTracker.ts`

### Exported Types
```ts
interface TrackedItem {
  name: string;
  hindi?: string;
  addedAt: string;    // ISO date
  expiresAt?: string; // ISO date
  category: "fresh" | "expiring" | "expired" | "unknown";
}
```

### localStorage Key
`snackoverflow-expiry-tracker`

### Built-in Shelf Life Estimates
Common Indian kitchen items with default days:
- milk: 3, curd: 5, paneer: 5, bread: 4, egg: 14
- tomato: 5, onion: 14, potato: 21, banana: 4
- spinach: 3, coriander: 3, mushroom: 3
- butter: 14, cheese: 14, cream: 5
- (30+ items total)

### State & Methods
| Return | Type | Description |
|---|---|---|
| `trackedItems` | TrackedItem[] | All tracked items |
| `expiringItems` | TrackedItem[] | Items with category "expiring" |
| `expiredItems` | TrackedItem[] | Items with category "expired" |
| `expiringCount` | number | Count of expiring + expired |
| `addItems(items)` | function | Add new items (skips duplicates, auto-estimates expiry) |
| `setExpiry(name, date)` | function | Manually set expiry date |
| `removeTrackedItem(name)` | function | Remove single item |
| `clearAll()` | function | Remove all items |
| `getDaysLeft(expiresAt)` | function | Calculate days until expiry |

### Category Logic
- `expired`: daysLeft < 0
- `expiring`: daysLeft ≤ 2
- `fresh`: daysLeft > 2
- `unknown`: no expiresAt set

---

## `useDishScanner()` — Dish Nutrition Scanner Hook

**File**: `src/lib/useDishScanner.ts`

### Purpose
- Camera lifecycle for Dish mode (manual scan only)
- Captures frame and calls `POST /api/analyze-dish`
- Normalizes API output to typed `DishAnalysisResult`

### State & Methods
| Return | Type | Description |
|---|---|---|
| `isStreaming` | boolean | Camera active state |
| `isAnalyzing` | boolean | In-flight dish analysis request |
| `error` | string \| null | Current scanner error |
| `analysis` | DishAnalysisResult \| null | Latest dish analysis result |
| `mealType` | MealType | Meal context sent to API |
| `setMealType` | function | Update meal context |
| `scanCount` | number | Successful manual scans count |
| `lastAnalyzedAt` | Date \| null | Last successful analysis time |
| `capturedFrame` | string \| null | Base64 JPEG of the last captured frame (frozen thumbnail) |
| `mockMode` | boolean | Whether mock scan mode is active (`?mock=scan` in URL) |
| `startCamera()` | function | Start camera (no-op in mock mode) |
| `stopCamera()` | function | Stop camera (no-op in mock mode) |
| `flipCamera()` | function | Toggle front/rear camera |
| `analyzeFrame()` | function | Capture frame and call `/api/analyze-dish` (uses mock data in mock mode) |
| `analyzeImage(base64)` | function | Analyze a provided base64 image (used by upload mode; uses mock data in mock mode) |
| `correctDish()` | function | Re-analyze with dish name correction |
| `clearAnalysis()` | function | Reset analysis state and captured frame |

### Key Behaviors
- Frame capture downscales to max 512px wide with JPEG 0.6 compression
- Manual-scan-only pattern (no auto-scan interval)
- Defensive normalization for malformed AI responses
- **Frozen frame**: `capturedFrame` is set on analyze, displayed as thumbnail while analyzing/after results
- **Mock mode** (`?mock=scan`): dynamic-imports `mockScanData.ts`, bypasses camera and API, returns fake results after 1.5s delay. Works for both `analyzeFrame()` and `analyzeImage()`. Mock data module is never bundled in production.

---

## `useMealLog()` — Dish Meal Logging + Insights Hook

**File**: `src/lib/useMealLog.ts`

### localStorage Keys
- `snackoverflow-meal-log-v1`
- Reads optional fridge snapshot linkage from `snackoverflow-fridge-scan-history`

### State & Methods
| Return | Type | Description |
|---|---|---|
| `meals` | LoggedMeal[] | All logged meals (latest first) |
| `todayMeals` | LoggedMeal[] | Meals logged today |
| `todayTotals` | MealTotals | Aggregated macros for today |
| `weeklyByDate` | array | Last 7-day calorie/macro summary by date |
| `insights` | object | Weekly calories + repeated dish patterns |
| `logMeal(input)` | function | Add a meal log entry |
| `removeMeal(id)` | function | Remove single meal |
| `clearAllMeals()` | function | Clear full meal log |

### Key Behaviors
- Adds optional fridge→dish linkage metadata when dish ingredients match recent fridge scan items
- Parses/normalizes persisted data defensively
- Computes repeated dish insights for Meal History UI
- If logged in, pulls meals from Supabase on mount and **merges by meal ID** (newer `loggedAt` wins) — no data loss on offline→online transition
- Syncs on every change (debounced)

---

## `useAuth()` — Supabase Auth Hook

**File**: `src/lib/useAuth.ts`

### State & Methods
| Return | Type | Description |
|---|---|---|
| `user` | User \| null | Supabase user object (includes `id`, `email`) |
| `isLoggedIn` | boolean | Whether a session exists |
| `isLoading` | boolean | Whether initial session check is in progress |
| `sendEmailOTP(email)` | function | Send 6-digit OTP code to email |
| `verifyEmailOTP(email, token)` | function | Verify OTP code and establish session |
| `signUp(email, password)` | function | Create account with password |
| `signInWithPassword(email, password)` | function | Sign in with existing password |
| `signOut()` | function | End session |

### Key Behaviors
- On mount, checks for existing session via `supabase.auth.getSession()`
- Listens to `onAuthStateChange` for login/logout events
- Registers `beforeunload` and `visibilitychange` listeners to flush pending debounced Supabase writes before the page unloads
- Used via `useAuthContext()` from `AuthProvider.tsx` (React context)
- **No migration on login** — each domain hook handles its own merge (see Sync Merge Strategy below)

### Network Resilience (Email OTP)
`sendEmailOTP` includes two layers of protection against network-level failures (e.g. WiFi DNS blocking `supabase.co`):
1. **Pre-flight ping** (5s timeout): `GET ${SUPABASE_URL}/auth/v1/settings` — if this fails, returns a user-friendly error immediately ("Can't connect to auth server. Try switching from WiFi to mobile data, or check if a DNS blocker or ad-blocker is active.")
2. **OTP timeout** (12s): wraps `signInWithOtp` in `Promise.race` so the spinner never hangs forever — returns "Request timed out. Try switching from WiFi to mobile data."

`verifyEmailOTP` also uses a 12s timeout for the same reason.

### Debug Logging
All auth methods emit timestamped `dlog()` calls (from `debugLog.ts`) at every step — visible in the on-screen DebugPanel when Dev Mode is enabled. Useful for diagnosing mobile-specific auth issues where browser DevTools aren't accessible.

---

## `useUserGoals()` — Goal Setting & Streak Hook

**File**: `src/lib/useUserGoals.ts`

### localStorage Key
`snackoverflow-user-goals-v1`

### Supabase Columns
`profile`, `goals`, `streak` in `user_data` table

### State & Methods
| Return | Type | Description |
|---|---|---|
| `profile` | UserProfile \| null | Saved user profile (includes optional `name` field) |
| `goals` | NutritionGoals | Active nutrition goals (computed or custom) |
| `streak` | StreakData | Current streak, last log date, longest streak |
| `hasLoaded` | boolean | Whether localStorage has been read |
| `hasProfile` | boolean | Whether a profile exists |
| `saveProfile(p)` | function | Save profile and compute goals from TDEE |
| `updateGoals(g)` | function | Override computed goals with custom values |
| `refreshStreak()` | function | Update streak based on today's meal log |

### Key Behaviors
- On mount, reads profile/goals/streak from localStorage
- If logged in, pulls from Supabase and **merges** with local state (newer timestamp wins via `mergeObject`)
- Uses `hasPulledCloud` ref to prevent re-pulling on every re-render
- `saveProfile` and `updateGoals` set `updatedAt` timestamps for merge conflict resolution
- On state change, saves to localStorage + debounced push to Supabase
- If no profile, returns DEFAULT_GOALS (2000 kcal, 120g P, 250g C, 70g F)
- `saveProfile` computes goals via `calculateGoals()` and persists both
- `profile.name` is optional; used for personalized greetings in HomeView and capyLines
- `refreshStreak` checks today's date against `lastLogDate` to increment/reset streak

---

## `useDescribeMeal()` — Text-Based Meal Description Hook (NEW)

**File**: `src/lib/useDescribeMeal.ts`

### Purpose
- Manages state for the "Describe Your Meal" feature
- Calls `POST /api/describe-meal` with natural language description
- Parses AI response into structured dishes with portion options
- Converts described dishes to `DishNutrition[]` for `logMeal` compatibility

### State & Methods
| Return | Type | Description |
|---|---|---|
| `description` | string | Current text input |
| `setDescription` | function | Update description text |
| `mealType` | MealType | Selected meal type |
| `setMealType` | function | Update meal type |
| `isAnalyzing` | boolean | API call in progress |
| `error` | string \| null | Error message |
| `result` | DescribeMealResult \| null | Parsed AI response with dishes |
| `selectedPortions` | Record<number, number> | Per-dish portion index selection |
| `selectPortion(dishIndex, portionIndex)` | function | Update portion for a dish |
| `analyze()` | function | Call API with current description + mealType |
| `getDishNutrition()` | DishNutrition[] | Convert described dishes to loggable format |
| `reset()` | function | Clear all state |

### Key Behaviors
- Portion selection defaults to each dish's `defaultIndex` from AI response
- `getDishNutrition()` maps the selected portion's macros to `DishNutrition` format
- Handles API errors gracefully with user-friendly messages
- Supports correction context (pre-fills description from bad camera scan)

---

## Utility Modules (NEW)

### `tdeeCalculator.ts`
Pure functions for nutrition math:
- `calculateBMR(gender, weight, height, age)` — Mifflin-St Jeor formula
- `calculateTDEE(bmr, activityLevel)` — BMR × activity multiplier (1.2–1.9)
- `calculateGoals(gender, weight, height, age, activity, goal)` — full pipeline → NutritionGoals
- `DEFAULT_GOALS` — fallback when no profile exists

### `capyLines.ts`
Motivational line picker for Capy mascot:
- `getCapyState(totals, goals, streak, mealsCount)` → `{ mood: CapyMood, line: string }`
- Context-aware: time of day, calorie %, protein %, streak milestones
- `getGreeting()` → "Good morning/afternoon/evening!"

---

## `useGardenState()` — Garden State & Milestone Hook

**File**: `src/lib/useGardenState.ts`

### Exported Types
```ts
interface GardenState {
  flowers: number;        // 0-30 (= calorie goal days hit)
  treeLevel: number;      // 0-3 (streak: 0→1 at 3d, →2 at 14d, →3 at 30d)
  pondLevel: number;      // backward compat (= homeLevel)
  butterflies: number;    // 0-5 (streak ≥5)
  hasRainbow: boolean;    // streak ≥14 (visual bonus with Forest)
  hasCrown: boolean;      // streak ≥30 (Hot Spring)
  gardenHealth: number;   // 0-100 composite score
  totalMealsLogged: number;
  daysGoalHit: number;    // permanent counter (80-120% of calorie target)
  lastComputedDate: string;
  journal: GardenEvent[];
  babyCapybaras: number;  // 0-3 (goal days: 7→1, 12→2, 20→3)
  homeLevel: number;      // 0-3 (goal days: 15→1, 20→2, 25→3)
}
```

### 8-Milestone Progression (2 tracks)
| # | Icon | Name | Track | Threshold | On streak loss |
|---|------|------|-------|-----------|----------------|
| 1 | 🌱 | Sapling | Streak | 3-day streak | Disappears |
| 2 | 🌸 | First Flower | Goal | 3 calorie goal days | Permanent |
| 3 | 🦋 | Butterfly | Streak | 5-day streak | Disappears |
| 4 | 🐾 | Baby Capy | Goal | 7 calorie goal days | Permanent |
| 5 | 🌲 | Forest | Streak | 14-day streak | Disappears |
| 6 | 🏡 | Cozy Home | Goal | 15 calorie goal days | Permanent |
| 7 | ♨️ | Hot Spring | Streak | 30-day streak | Disappears |
| 8 | 🌻 | Full Garden | Goal | 30 calorie goal days | Permanent |

### Key Functions
| Function | Description |
|---|---|
| `computeGarden(prev, streak, todayTotals, goals)` | Computes new GardenState from 2 inputs: `streak.currentStreak` + `daysGoalHit`. Maps to Three.js props. |
| `countAllGoalDays(calorieGoal)` | Scans full meal history in localStorage, groups by date, counts past days where calories were 80-120% of goal. Reads `m.totals.calories` (with fallback to `m.calories` for legacy entries). |
| `getCaloriesForDate(date)` | Sums calories for a single date from meal log. Reads `m.totals.calories` (with fallback to `m.calories`). |
| `getNextUnlock(state, streak)` | Returns next milestone in exact 8-milestone order with current/target progress |
| `useGardenState(streak, todayTotals, goals)` | React hook — loads from localStorage, recomputes on input change, persists |

### Known Bug Fix (PR #41)
`countAllGoalDays()` and `getCaloriesForDate()` originally read `m.calories` from each meal entry, but `LoggedMeal` stores calories at `m.totals.calories`. This caused `daysGoalHit` to always remain 0, preventing flowers, baby capybaras, cozy home, and full garden from ever unlocking. Fixed to read `m.totals?.calories || m.calories || 0`.

### Garden Health Formula
- Base 50 + streak bonuses (1d: +10, 3d: +10, 7d: +10, 14d: +5, 30d: +5) + goal bonuses (3 goals: +5, 15 goals: +5)
- Wilting: streak=0 → health drops by 15/day (min 10)

### Three.js Visual Mapping (no changes to CapyGarden.tsx)
| Milestone | GardenState prop | Three.js Component |
|-----------|-----------------|-------------------|
| Sapling | `treeLevel: 1` | `Trees` |
| First Flower | `flowers: 3+` | `Flowers` |
| Butterfly | `butterflies: 1+` | `Butterflies` |
| Baby Capy | `babyCapybaras: 1+` | `BabyCapybaras` |
| Forest | `treeLevel: 2`, `hasRainbow: true` | `Trees` + `Rainbow` |
| Cozy Home | `homeLevel: 1+` | `CozyHome` |
| Hot Spring | `hasCrown: true` | `HotSpring` |
| Full Garden | `flowers: 30` | `Flowers` (max) |

---

## `useHealthProfile()` — Health Profile Hook

**File**: `src/lib/useHealthProfile.ts`

Manages health profile state (conditions, lab values, allergies, diet preference, notes) with localStorage persistence and Supabase cloud sync.

### Returns
```ts
{
  healthProfile: HealthProfile | null;
  hasHealthProfile: boolean;
  healthContextString: string;       // Pre-built AI prompt context
  saveHealthProfile: (conditions, labValues, notes, diet?) => void;
  clearHealthProfile: () => void;
}
```

### Key Types
```ts
type ConditionStatus = "active" | "family_history" | "both";

interface HealthCondition {
  id: string;
  label: string;
  status: ConditionStatus;
}

interface HealthProfile {
  conditions: HealthCondition[];
  labValues: LabValue[];
  freeTextNotes: string;
  dietPreference?: DietPreference;
  healthContextString: string;
}
```

### Behavior
- On save: builds `healthContextString` via `buildHealthContextString()` (deterministic, no AI)
- Conditions with `"both"` status appear in both active and family history sections of the context
- Elevated risk note added for "both" conditions
- Syncs to Supabase `health_profile` domain when authenticated
- **Merge on pull**: uses `mergeObject` with `updatedAt` — newer timestamp wins, preventing offline edits from being overwritten

---

## `useHealthVerdict()` — AI Health Verdict Hook

**File**: `src/lib/useHealthVerdict.ts`

On-demand AI health verdict fetcher with abort support.

### Returns
```ts
{
  verdict: MealHealthAnalysis | null;
  status: "idle" | "loading" | "done" | "error";
  error: string | null;
  fetchVerdict: (dishes, healthContextString) => void;
  reset: () => void;
}
```

### Behavior
- **Not auto-triggered** — called explicitly when user taps "AI Health Check" button
- Sends dish nutrition + health context to `/api/health-verdict`
- API uses tiered fallback: Gemini 2.5 Flash → Claude 3.5 Haiku → GPT-4.1-mini
- Returns per-dish verdicts (good/caution/avoid) with notes and swap suggestions
- Supports abort via AbortController when component unmounts

---

## `useEatingAnalysis()` — Eating Habits Analysis Hook (NEW)

**File**: `src/lib/useEatingAnalysis.ts`

### Purpose
- Manages eating analysis state (generation, caching, staleness detection)
- Orchestrates client-side pre-aggregation → API call → storage
- Syncs analyses to Supabase `meal_analyses` domain

### localStorage Key
`snackoverflow-meal-analyses-v1`

### State & Methods
| Return | Type | Description |
|---|---|---|
| `analyses` | EatingAnalysis[] | All stored analyses (max 10, latest first) |
| `isGenerating` | boolean | API call in progress |
| `error` | string \| null | Error message from last attempt |
| `generate(windowDays, meals, goals, healthProfile)` | async function | Full pipeline: aggregate → cache check → API → store |
| `getLatest(windowDays?)` | function | Most recent analysis (optionally filtered by window) |
| `isCacheFresh(windowDays, meals)` | function | Whether cached report is still valid (no new meals since) |

### Key Behaviors
- On generate: calls `aggregateMeals()` + `serializeForPrompt()` client-side, then POSTs compact summary to `/api/analyze-habits`
- Includes previous report's `scoreSummary` in API call for week-over-week comparison
- Stores last 10 analyses (FIFO eviction)
- Cache freshness: compares newest meal's `loggedAt` against analysis `generatedAt`
- If logged in, pulls from Supabase on mount and **merges by analysis ID** (newer `generatedAt` wins) — preserves offline-generated reports
- Syncs on every change (debounced)

---

## Utility: `mealAggregator.ts` (NEW)

**File**: `src/lib/mealAggregator.ts`

Pure functions for client-side meal data pre-aggregation. Reduces AI prompt size from ~3000-5000 tokens (raw meals) to ~200-300 tokens (compact summary).

### Exported Functions
| Function | Description |
|---|---|
| `aggregateMeals(meals, windowDays, goals)` | Computes `MealAggregate` from raw meals for a time window |
| `serializeForPrompt(aggregate)` | Converts aggregate to compact multi-line string for AI prompt |

### MealAggregate Fields
- `avgDaily` — average daily calories, protein, carbs, fat, fiber
- `goalHitDays` — days within 80-105% of calorie target
- `weekdayAvgCal` / `weekendAvgCal` — weekend vs weekday comparison
- `timing` — breakfast/lunch/snack/dinner counts, breakfast skip days, late dinner count
- `topDishes` — top 10 dishes by frequency with average calories and tags
- `macroRatios` — protein/carbs/fat percentage split
- `proteinAtDinnerPct` — protein clustering signal
- `snackCaloriePct` — snack calorie percentage of total
- `friedItemCount` — count of fried items (from tags + name matching)
- `bestDay` / `worstDay` — by distance from calorie goal

---

## `useYoloDetection()` — YOLO On-Device Hook

**File**: `src/lib/useYoloDetection.ts`

Manages ONNX Runtime Web inference with YOLOv8n model. Handles model loading, camera stream, real-time inference loop, and bounding box drawing on canvas.

Not actively developed — YOLO mode is experimental.

---

## `useDetection()` — Legacy Detection Hook

**File**: `src/lib/useDetection.ts`

Legacy hook, not actively used. Was for TensorFlow.js COCO-SSD detection.

---

## Sync Merge Strategy (Offline→Online)

**File**: `src/lib/supabase/merge.ts`

When a user goes offline, makes changes, then logs in (or syncs), each hook merges local + cloud data instead of replacing local with cloud. This prevents silent data loss.

### Merge Functions

| Function | Used By | Strategy |
|----------|---------|----------|
| `mergeArrayById(local, cloud, getId, getTimestamp)` | meals, expiry_tracker, meal_analyses | Union by unique ID; same ID → newer timestamp wins |
| `mergeObject(local, cloud, getUpdatedAt)` | profile, goals, streak, health_profile | Compare `updatedAt` timestamps; newer wins; graceful fallback when timestamps missing |
| `mergeGarden(local, cloud)` | garden | `max()` for monotonic counters (flowers, daysGoalHit, totalMealsLogged, babyCapybaras, homeLevel); `lastComputedDate` for streak-dependent fields; journal merged by event ID |

### Per-Hook Merge Details

| Hook | Domain | Merge Key | Timestamp Field |
|------|--------|-----------|-----------------|
| `useMealLog` | meals | `meal.id` | `loggedAt` |
| `useUserGoals` (profile) | profile | object-level | `updatedAt ?? completedAt` |
| `useUserGoals` (goals) | goals | object-level | `updatedAt` |
| `useUserGoals` (streak) | streak | object-level | `lastLogDate` |
| `useHealthProfile` | health_profile | object-level | `updatedAt` |
| `useGardenState` | garden | custom merge | `lastComputedDate` + `max()` counters |
| `useExpiryTracker` | expiry_tracker | `name.toLowerCase()` | `addedAt` |
| `useEatingAnalysis` | meal_analyses | `analysis.id` | `generatedAt` |

### Key Design Decisions

1. **No centralized migration** — removed `migrateLocalStorageToCloud()`. Each hook handles its own merge, which also covers the first-login case (merging against empty cloud returns local data unchanged; the persist effect then pushes it).
2. **Functional updaters** — all merge calls inside `.then()` callbacks use React's `setState(prev => ...)` form to guarantee they merge against the latest local state, avoiding stale closure bugs.
3. **Persist effects push automatically** — after merging, the updated state triggers each hook's existing persist `useEffect`, which pushes the merged result to cloud. No explicit push needed after merge.
4. **`hasPulledCloud` ref** — every hook uses a ref to ensure cloud pull + merge happens exactly once per session, not on every re-render.

### Edge Cases & Limitations

- **Object-level merging** (profile, goals, health_profile): last-write-wins based on timestamp. If user edits different fields on two devices, the entire newer object wins (field-level merge is not implemented).
- **Garden counters**: monotonic counters can never decrease across devices, but streak-dependent visual fields (treeLevel, butterflies, hasRainbow) use the device with the more recent `lastComputedDate`.
- **No conflict UI**: there is no user-facing conflict resolution. The merge is automatic and silent. This is acceptable because the app's data model is additive (meals are appended, counters only increase).
