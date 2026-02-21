# React Components

All components are in `src/components/`. All are `"use client"` components.

---

## Core — Cloud AI Mode

### `BottomTabBar.tsx`
**Sticky bottom navigation for app-level mode switching.**
- Props: `activeTab: AppTab`, `onTabChange`
- AppTab: `"home" | "progress" | "scan" | "capy" | "profile"`
- 5-column grid with center Scan FAB (h-16 w-16, white ring, green glow shadow)
- Capy tab uses PawPrint icon from Lucide

### `FridgeTab.tsx`
**Fridge workspace container under the Fridge tab.**
- Keeps existing YOLO/Cloud AI switcher behavior via `ModeSwitcher`
- Lazy-loads `YoloMode` so ONNX model doesn’t load when not needed
- Renders mode-specific footer text

### `DishMode.tsx`
**Main Dish scanner orchestrator (manual scan).**
- Uses `useDishScanner()` for camera + API analysis flow
- Uses `useMealLog()` for local meal logging + daily/weekly insights
- Uses `useUserGoals()` for goal tracking + streak management
- Renders sequence:
  - GoalOnboarding overlay (if no profile exists),
  - camera (manual analyze only),
  - meal type context picker,
  - portion adjuster,
  - per-dish nutrition cards,
  - log-this-meal action,
  - GoalDashboard (replaces DailySummary), meal log, and history insights
- Adds "You had this X days ago" badges for previously logged dishes
- Refreshes streak on meal log

### `ScanView.tsx`
**Scan tab — camera, analysis, dish editing, and meal logging.**
- Props: `logMeal`, `meals`, `refreshStreak`, `onMealLogged?`
- Uses page-level `mealLog` and `userGoals` (passed as props, not internal hooks) so Home tab sees fresh data instantly
- Auto-scrolls to results when analysis completes
- Plate Total card lists individual dishes with calories and weight
- Collapsed/expanded view: multi-dish plates show summary + "Show N dishes · Edit quantities" toggle
- Per-dish controls:
  - **WeightEditor**: tap grams → inline +/- stepper or direct input → macros recalculate proportionally
  - **CorrectionChip**: "Wrong dish?" → re-analyze with user correction
  - **Remove button**: red pill to delete a dish from the plate
- After logging: 1.2s "Logged ✓" animation → clears analysis → calls `onMealLogged` (navigates to Home)
- Health tags derived per dish (High Protein, High Carb, High Fat, Low Calorie, Fiber Rich)

### `NutritionCard.tsx`
**Per-dish nutrition presentation card.**
- Props: `dish`, `servingsMultiplier`
- Displays calories, protein, carbs, fat, fiber with icons
- Shows portion, confidence badge ("Confident" / "Likely" / "Unsure" with tooltip), ingredients, and health tip

### `DailySummary.tsx`
**Today-level nutrition summary for logged dish meals.** *(Replaced by GoalDashboard in DishMode)*
- Props: `totals`, `mealsCount`
- Shows calories/protein/carbs/fat with compact ring progress visuals

### `CapyGarden.tsx`
**Three.js 3D garden scene — lazy-loaded, renders only on Capy tab.**
- Props: `garden: GardenState`, `isActive: boolean`, `onCapyTap?: () => void`
- Loaded via `next/dynamic` with `ssr: false` — zero impact on other tabs
- `frameloop` set to `"always"` when active, `"never"` when inactive
- Scene elements:
  - **Ground**: Circular island (radius 5.5), plain green surface. Color lerps green↔olive based on health. Earth-brown sides.
  - **InteractiveCapy**: GLB model capybara with full behavior FSM (`capyBehaviors.ts`). States: idle, wander, eat, splash, chase_butterfly, tapped, dance. Wanders with slow waddle animation, eats with forward tilt (Y offset prevents ground clipping), chases butterflies, splashes in hot spring. **Random tap reactions** (one per tap): squash-and-stretch, body wiggle, nose nuzzle, look-at-camera with ear perk. Dance on double-tap. Emits particle effects per state.
  - **BabyCapy**: Up to 3 baby capybaras (scaled 0.55×) using same behavior system + random tap reactions. Smaller wander radius (1.5), 20% chance to follow main capy. Tappable with heart particles.
  - **PlantInPot**: Terracotta pot with growing plant balanced on capybara's head. Gentle wobble animation.
  - **Flowers**: Spiral pattern, count = days goal hit (max 30), droop when wilting
  - **Trees**: Multiple tree types (Oak, Pine, Spruce, Birch, Willow, Cherry), level 0-4
  - **HotSpring**: Steam + warm water (streak ≥30), capybaras splash here
  - **CozyHome**: Cabin with chimney smoke (based on total meals logged)
  - **Butterflies**: Wing-flap animation on circular paths (max 5), chased by capybaras
  - **Rainbow**: Semi-transparent torus arc (14+ day streak)
  - **Sparkles**: Points geometry, golden when healthy, grey when wilting
  - **FallingLeaves**: Drift-down particles when garden health < 30
  - **DynamicSkyDome**: Canvas-gradient sphere with time-of-day lighting
  - **Particle effects**: HeartParticles (tap), SparkleParticles (dance), NibbleParticles (eat), SplashParticles (splash)
- Camera: low angle (Y=1.2), FOV 38, slightly below capybara eye level
- OrbitControls: pan disabled, zoom disabled, tight azimuth/polar limits
- Performance: low-power GPU preference, dpr [1, 1.5], 512px shadow maps

### `CapyView.tsx` (NEW)
**Capy's Garden tab — the main container for the garden experience.**
- Props: `streak: StreakData`, `todayTotals: MealTotals`, `goals: NutritionGoals`, `isActive: boolean`
- Uses `useGardenState()` hook for garden state computation
- Uses `getContextualMotivation()` for pre-built motivation lines
- Layout:
  - Top: Garden stats bar (🌸 count · 🌳 level · 🦋 count · 🔥 streak)
  - Center: Three.js canvas (55vh) with motivation bubble overlay
  - "Talk to Capy" button → cycles motivation lines
  - **Next Unlock card**: Shows next milestone with clear description (e.g. "Log meals 3 more days in a row"), progress bar, and current/target count with unit (streak days, goal days, protein days)
  - Achievements grid (8 milestones: First Flower, Sapling, Rainbow, Forest, Baby Capy, Cozy Home, Hot Spring, Full Garden)
  - Garden Journal (last 5 events with timestamps)
  - Garden Health bar (0-100%, color-coded green/yellow/red)
  - **How It Works** (collapsible): Explains streaks, lists all milestones with exact requirements, FAQ (streak loss, what counts as logging, wilting)

### `CapyMascot.tsx`
**Image-based capybara mascot with mood-reactive variants.**
- Props: `mood: CapyMood`, `size?: number`, `className?: string`, `animate?: boolean`
- 5 moods mapped to 3 kawaii capybara images (transparent PNGs):
  - `happy`, `excited`, `sleepy` → `capy-happy.png` (bath capy with rubber duck)
  - `motivated` → `capy-motivated.png` (headphones capy with laptop)
  - `concerned`, default → `capy-default.png` (orange hat capy)
- Mood overlays: ✨ bounce for excited, 💤 pulse for sleepy
- Images at `/public/model/capy-{happy,default,motivated}.png` (300px, transparent background)
- Uses plain `<img>` tag (not Next.js Image) to preserve PNG alpha channel

### `CapyLottie.tsx` (NEW)
**Lottie animation player for animated mascots.**
- Props: `src?: string`, `size?: number`, `className?: string`, `speed?: number`
- Default src: `/model/capy-mascot.json` (fat capybara logo animation)
- Also used with `/model/cute-cat.json` and `/model/cute-dog.json`
- Fetches JSON at runtime, shows fallback 🐹 emoji while loading
- Uses `lottie-react` library, loops and autoplays
- Deployed on:
  - HomeView greeting card (capy Lottie)
  - HomeView fridge scanner card (dog Lottie)
  - ProgressView header (cat Lottie)
  - HomeView streak card (capy Lottie)

### `GoalOnboarding.tsx` (NEW)
**5-step animated onboarding wizard with Capy.**
- Props: `existingProfile?`, `onComplete`, `onSkip`
- Steps: Welcome → About You → Activity → Goal → Plan
- Framer Motion slide transitions between steps
- Step 1 (About You): optional name field ("What should Capy call you?"), gender, age slider (14-80), height/weight with unit toggles
- Step 2 (Activity): 5 options with **Lucide icons** (Sofa, Footprints, Bike, Dumbbell, Flame) in circular icon backgrounds
- Step 3 (Goal): 7 India-specific options with **Lucide icons** (Target, TrendingDown, Zap, RotateCcw, Scale, Dumbbell, ArrowUpCircle) + Check icon on selected
- Step 4 (Plan): **CalorieRingDial** — rotary drag gesture to adjust calories by rotating the ring, tap number to type directly, ±25 kcal stepper buttons, progress arc + draggable thumb, clamped 800–5000 kcal. Editable macro pills (protein/carbs/fat).
- All headings use `font-extrabold text-foreground` for consistency with rest of app
- Locks body scroll when open (`fixed inset-0 z-[100]`)

### `GoalDashboard.tsx` (NEW)
**Daily progress card with Capy mascot — replaces DailySummary.**
- Props: `totals`, `goals`, `streak`, `mealsCount`, `onEditGoals`
- Time-of-day greeting + Capy with speech bubble
- Calorie progress bar (percentage + remaining)
- Macro bars (protein/carbs/fat)
- Streak counter
- Edit goals gear button

### `MealLog.tsx`
**Collapsible list of today’s logged meals.**
- Props: `meals`, `onRemoveMeal`, `onClearAll`
- Displays meal type, timestamp, dishes, and macro totals per entry

### `MealHistory.tsx`
**Historical nutrition log with weekly insights.**
- Props: `meals`, `weeklyByDate`, `repeatedDishes`
- Shows grouped history by date, repeated-dish patterns, and weekly calorie chips
- Displays Fridge↔Dish linkage badge when a logged dish matches recent fridge scan ingredients

### `GeminiMode.tsx`
**The main orchestrator for Cloud AI mode.** Wires together camera, detected items, recipes, filters, expiry tracker, shopping list, and meal planner.
- Uses `useGeminiVision()` hook for camera + analysis state
- Uses `useExpiryTracker()` hook for freshness tracking
- Auto-adds detected items to expiry tracker when new items appear
- Renders all sub-components in order: Camera → Diet Filter → Detected Items → Expiry → Tip → Shopping List → Meal Planner → Recipes

### `GeminiCameraView.tsx`
**Camera feed with controls for Cloud AI mode.**
- Props: `videoRef`, `canvasRef`, `isStreaming`, `isAnalyzing`, `autoScan`, `error`, `onStart`, `onStop`, `onFlip`, `onAnalyze`, `onToggleAutoScan`, `hasApiKey`
- Optional props now support UI reuse in Dish mode: `showAutoScan`, custom labels/title/subtitle
- Camera height: `h-[65vh]` when streaming, `aspect-[4/3]` when idle
- Overlay: corner brackets, analyzing pulse animation, status badge (Analyzing/Auto-scanning/Ready)
- Controls: Start Camera, Flip, Analyze, Auto-scan toggle, Stop
- Placeholder: camera icon + "Point your camera at your fridge"

### `GeminiDetectedItems.tsx`
**Displays items detected by AI with Hindi names and confidence badges.**
- Props: `items: DetectedItem[]`, `onClear`, `onRemoveItem`, `frameCount`, `lastAnalyzedAt`
- Shows scan count and time since last scan
- Each item: name, Hindi name, confidence badge (green/yellow/red), X to remove
- Animated with framer-motion popLayout

### `GeminiRecipeCard.tsx`
**Individual recipe card with full details.**
- Props: `recipe: GeminiRecipe`, `index: number`
- Shows: name (EN + Hindi), description, cook time, difficulty, diet badge, tags
- "You have" ingredients (green) and "Also need" ingredients (orange)
- Expandable steps section
- `ShareRecipe` button in top-right corner
- Staggered entrance animation (delay based on index)

### `DietaryFilter.tsx`
**Diet preference pill selector.**
- Props: `value: DietaryFilter`, `onChange`
- Options: All 🍽️, Veg 🥬, Vegan 🌱, Egg 🥚, Jain 🙏
- Active pill: solid green accent background with spring animation (layoutId="diet-pill")
- Inactive: subtle border

### `ShareRecipe.tsx`
**"Send to Cook" dropdown with Hindi audio/text and English sharing options.**
- Props: `recipe: GeminiRecipe`
- State: `isOpen`, `copied`, `isSpeaking`, `hindiLoading`, `audioLoading`, `hindiText`, `servings`
- Serving size picker: 1🧑 2🧑 3🧑 4🧑 (default: 2)
- Hindi section: Audio Message (Sarvam TTS), Text on WhatsApp (Groq)
- English section: WhatsApp, Read Aloud, Share via, Copy
- Backdrop overlay when open
- Animated dropdown with framer-motion

### `ShoppingList.tsx`
**Auto-generated shopping list from recipe ingredients_needed.**
- Props: `recipes: GeminiRecipe[]`, `detectedItemNames: string[]`
- Deduplicates needed items across all recipes
- Excludes items user already has (detected)
- Shows which recipe each item is for
- Copy to clipboard button
- Collapsible (hidden when no items needed)

### `ExpiryTracker.tsx`
**Freshness/expiry tracker for detected items.**
- Props: `items: TrackedItem[]`, `expiringCount`, `onSetExpiry`, `onRemove`, `onClearAll`, `getDaysLeft`
- Color-coded: green (fresh), yellow (expiring ≤2d), red (expired)
- Icons per category: Leaf, Clock, AlertTriangle, CalendarClock
- Tap date label to edit expiry with date picker
- Clear all button
- Collapsible, shows warning badge count

### `MealPlanner.tsx`
**Weekly meal planner with recipe assignment.**
- Props: `availableRecipes: GeminiRecipe[]`, `detectedItemNames: string[]`
- 7-day grid (Mon-Sun)
- Add recipes to days from available suggestions
- Remove individual meals or clear day
- Copy day's plan to clipboard
- Persisted in localStorage (`snackoverflow-meal-plan`)
- Collapsible

---

## Core — YOLO Mode

### `YoloMode.tsx`
Orchestrator for on-device YOLO detection mode. Uses `useYoloDetection()` hook.

### `YoloCameraView.tsx`
Camera view for YOLO mode with real-time bounding box overlay on canvas.

### `CameraView.tsx`
Generic camera view component (used by YOLO mode). Similar to GeminiCameraView but simpler.

### `DetectedItems.tsx`
Generic detected items display for YOLO mode. Shows item name + count as a Map.

### `RecipeCard.tsx` / `RecipeSuggestions.tsx`
Legacy recipe display components for YOLO mode. Uses static recipe database.

---

## Utility

### `ModeSwitcher.tsx`
**Toggle between YOLO On-Device and Cloud AI modes.**
- Props: `mode: DetectionMode`, `onModeChange`
- Two buttons with spring-animated background (layoutId="mode-bg")
- Description text below changes per mode
- `DetectionMode = "yolo" | "gemini"`

### `AuthProvider.tsx`
**Auth context provider — wraps the entire app in `layout.tsx`.**
- Provides `useAuthContext()` hook to all components
- Exposes: `user`, `isLoggedIn`, `isLoading`, `signInWithMagicLink`, `signUp`, `signInWithPassword`, `signOut`
- Uses `useAuth()` hook internally

### `AuthScreen.tsx`
**Capy-themed login UI with magic link + password modes.**
- Props: `onMagicLink`, `onSignUp`, `onSignInPassword`
- Three modes: `magic` (default), `password-login`, `password-signup`
- States: email input → loading → "Check your email" success (for magic link/signup)
- Error display with AlertCircle icon
- Mode switcher links at bottom to toggle between magic link / password / signup
- Animated with Framer Motion
- Rendered in ProfileView when user is not logged in

### `ApiKeyInput.tsx`
Legacy API key input component. Currently not used (API keys are in .env.local server-side).
