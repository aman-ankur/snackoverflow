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
| `startCamera()` | function | Start camera |
| `stopCamera()` | function | Stop camera |
| `flipCamera()` | function | Toggle front/rear camera |
| `analyzeFrame()` | function | Capture frame and call `/api/analyze-dish` |
| `clearAnalysis()` | function | Reset analysis state |

### Key Behaviors
- Frame capture downscales to max 512px wide with JPEG 0.6 compression
- Manual-scan-only pattern (no auto-scan interval)
- Defensive normalization for malformed AI responses

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
- If logged in, pulls meals from Supabase on mount and syncs on every change (debounced)

---

## `useAuth()` — Supabase Auth Hook

**File**: `src/lib/useAuth.ts`

### State & Methods
| Return | Type | Description |
|---|---|---|
| `user` | User \| null | Supabase user object (includes `id`, `email`) |
| `isLoggedIn` | boolean | Whether a session exists |
| `isLoading` | boolean | Whether initial session check is in progress |
| `signInWithMagicLink(email)` | function | Send magic link email |
| `signUp(email, password)` | function | Create account with password |
| `signInWithPassword(email, password)` | function | Sign in with existing password |
| `signOut()` | function | End session |

### Key Behaviors
- On mount, checks for existing session via `supabase.auth.getSession()`
- Listens to `onAuthStateChange` for login/logout events
- On `SIGNED_IN` event, triggers `migrateLocalStorageToCloud()` to push local data to Supabase (only if cloud row is empty)
- Used via `useAuthContext()` from `AuthProvider.tsx` (React context)

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
| `profile` | UserProfile \| null | Saved user profile |
| `goals` | NutritionGoals | Active nutrition goals (computed or custom) |
| `streak` | StreakData | Current streak, last log date, longest streak |
| `hasLoaded` | boolean | Whether localStorage has been read |
| `hasProfile` | boolean | Whether a profile exists |
| `saveProfile(p)` | function | Save profile and compute goals from TDEE |
| `updateGoals(g)` | function | Override computed goals with custom values |
| `refreshStreak()` | function | Update streak based on today's meal log |

### Key Behaviors
- On mount, reads profile/goals/streak from localStorage
- If logged in, pulls from Supabase and overrides localStorage (cloud is source of truth)
- On state change, saves to localStorage + debounced push to Supabase
- If no profile, returns DEFAULT_GOALS (2000 kcal, 120g P, 250g C, 70g F)
- `saveProfile` computes goals via `calculateGoals()` and persists both
- `refreshStreak` checks today's date against `lastLogDate` to increment/reset streak

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

## `useYoloDetection()` — YOLO On-Device Hook

**File**: `src/lib/useYoloDetection.ts`

Manages ONNX Runtime Web inference with YOLOv8n model. Handles model loading, camera stream, real-time inference loop, and bounding box drawing on canvas.

Not actively developed — YOLO mode is experimental.

---

## `useDetection()` — Legacy Detection Hook

**File**: `src/lib/useDetection.ts`

Legacy hook, not actively used. Was for TensorFlow.js COCO-SSD detection.
