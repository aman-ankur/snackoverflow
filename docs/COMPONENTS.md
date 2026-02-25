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
**Scan tab — Camera/Describe toggle, camera analysis, dish editing, and meal logging.**
- Props: `logMeal`, `meals`, `refreshStreak`, `onMealLogged?`, `initialMode?: "camera" | "describe"`, `healthContextString?`, `hasHealthProfile?`, `healthConditions?`, `onSetupHealthProfile?`
- **Camera/Describe toggle** at top — pill-style switcher between camera scan and text describe modes
- `initialMode` prop allows MealTypeSheet to open directly in Describe mode
- Syncs mode when `initialMode` prop changes (e.g. navigating from MealTypeSheet)
- Uses page-level `mealLog` and `userGoals` (passed as props, not internal hooks) so Home tab sees fresh data instantly
- **Camera mode**:
  - Auto-scrolls to results when analysis completes
  - **Controls Strip**: horizontal scrollable row of meal type pills (auto-selected by time of day via `getAutoMealType()`, green dot on auto-selected) + divider + portion multiplier pills (½×, 1×, 1.5×, 2×)
  - **Plate Total**: centered large calorie number, dish count + meal type subtitle, 4-macro row (Protein/Carbs/Fat/Fiber via `MacroStat`)
  - **AI Health Check**: prominent card (with-profile) or dashed upsell (without-profile), from `HealthVerdictCard.tsx`
  - **Capy mascot**: compact 36px avatar + speech bubble with contextual message
  - **Accordion dish cards**: per-dish collapsible cards (independent state via `expandedDishIndex`)
    - Collapsed: name + `ConfidenceBadge` + calories, Hindi name + weight, inline macro pills, contextual note via `generateDishNote()`, "Tap for details" hint
    - Expanded: **alternative dish selection** (via `DishAlternatives` component if alternatives exist), editable 5-col macro grid, CalorieEditor + WeightEditor + portion display, key ingredients, health tip, tags, `ReasoningToggle`, action buttons (CorrectionChip / Describe / Remove)
    - Single-dish auto-expands; tapping one collapses others
  - **Sticky log bar**: fixed bottom bar with total calories + meal type + "Log Meal" button
  - "Clear analysis & re-scan" link
  - After logging: 1.2s "Logged ✓" animation → clears analysis → calls `onMealLogged` (navigates to Home)
- **Describe mode**: renders `DescribeMealView` component (see below)
- **Alternative Selection Flow**:
  - When API returns alternatives, renders `DishAlternatives` component at top of expanded section
  - `handleAlternativeSelect()` performs instant swap (0s latency, no API call)
  - Swaps dish in analysis state, recalculates plate totals, clears any weight/calorie overrides for that dish
  - Uses `selectedAlternatives` Map to track which option is selected per dish (0 = primary, 1-2 = alternatives)

### `DishAlternatives.tsx` (NEW)
**Radio button UI for selecting between alternative dish identifications.**
- Props: `primaryDish: DishNutrition`, `alternatives: DishNutrition[]`, `selectedIndex: number`, `onSelect: (index: number) => void`
- **Visual Design**:
  - "Select Dish" label at top
  - Radio buttons for all options (primary + up to 2 alternatives)
  - Each option shows:
    - Radio indicator (green accent when selected)
    - Dish name + Hindi name + confidence badge (Confident/Likely/Unsure with color coding)
    - Nutrition preview: calories, P/C/F macros in small grey text
    - Reasoning: why this identification is plausible (grey text)
  - Selected option: `border-accent bg-accent/5`, unselected: `border-border bg-card hover:border-accent/50`
- **Confidence Badge Colors**:
  - High: `bg-green-100 text-green-700`
  - Medium: `bg-orange-100 text-orange-700`
  - Low: `bg-gray-100 text-gray-700`
- **Animations**: Staggered fade-in with 80ms delay between options via framer-motion
- **Interaction**: Clicking any option calls `onSelect(index)` — ScanView handles the instant swap
- **Usage**: Only rendered when `dish.alternatives && dish.alternatives.length > 0`, placed at top of expanded dish card with bottom border separator

### `DescribeMealView.tsx` (NEW)
**Text-based meal description UI — AI interprets natural language into structured nutrition data.**
- Props: `logMeal`, `refreshStreak`, `onMealLogged?`, `correctionContext?: { scannedAs: string; mealType: MealType }`, `healthContextString?`, `hasHealthProfile?`, `healthConditions?`, `onSetupHealthProfile?`
- Uses `useDescribeMeal()` hook for state management and API calls
- **Input section**:
  - Textarea with 200-char limit and live character counter
  - Meal type pills as horizontal inline strip (matches ScanView controls)
  - "Estimate Nutrition" button (disabled until text entered, shows loading state)
  - Correction banner when opened from a bad camera scan ("Scanned as X — describe what it actually is")
- **Results section** (matches ScanView accordion design):
  - **Plate Total**: large centered card with 5xl calorie number, dish count + meal type, 4 macro stats (Protein/Carbs/Fat/Fiber) via `MacroStat`
  - **AI Health Check**: on-demand button or verdict banner (same as ScanView)
  - **Capy mascot**: compact 36px avatar + speech bubble with mood-based message
  - **Accordion dish cards**: per-dish collapsible cards (independent state via `expandedDishIndex`)
    - Collapsed: dish name + calories, Hindi name + weight, inline macro pills, contextual note via `generateDishNote()`, confidence dot, "Tap for details" hint
    - Expanded: 5-column macro grid (Cal/Protein/Carbs/Fat/Fiber), calorie editor with proportional scaling, 3-option portion picker, tags, health tip, reasoning toggle, "Wrong dish?" name editor
    - Single-dish auto-expands; tapping one collapses others
  - **Log bar**: card-style with calories + meal type on left, "Log Meal" button on right
  - "Clear & re-describe" link below log bar
- After logging: 1.2s "Logged ✓" animation → clears state → calls `onMealLogged`

### `PullToRefresh.tsx` (NEW)
**Custom touch-gesture pull-to-refresh component.**
- Props: `onRefresh: () => void | Promise<void>`, `children`, `className?`
- Detects touch gestures when `scrollTop === 0`
- Dampened pull distance (max 100px, 0.4× damping)
- Arrow icon rotates at threshold (60px), switches to spinner during refresh
- Used in `page.tsx` to wrap `<main>` content

### `HealthProfileWizard.tsx`
**Multi-step health condition wizard with Dr. Capy mascot.**
- Props: `existingProfile?`, `userProfile?`, `onComplete`, `onSkip`, `isStandalone?`
- 5-step animated wizard (conditions → labs → allergies/diet → notes → review)
- **Step 1 — Condition Selector**:
  - 15 conditions from `CONDITIONS_REGISTRY` (diabetes, hypertension, cholesterol, heart disease, kidney, thyroid, PCOS, gout, IBS, lactose intolerance, celiac, iron deficiency, vitamin D deficiency, pregnancy, menopause)
  - Conditions filtered by `userProfile.gender` and `userProfile.age` (e.g. pregnancy/menopause hidden for males, menopause hidden for age < 40)
  - Tap condition row to select (defaults to "active"), tap again to deselect
  - Inline "Me" (red) and "Family" (amber) pills appear when selected — can toggle independently
  - "Family" pill only shown when `hasFamilyHistory: true` on the condition definition
  - Status: `"active"` | `"family_history"` | `"both"` (selecting both Me + Family)
  - Search filter for conditions
  - Separated into "High Dietary Impact" and "Medium Dietary Impact" sections
- **Step 2 — Lab Values**: optional numeric inputs for conditions with lab fields (HbA1c, BP, cholesterol, etc.)
- **Step 3 — Allergies & Diet**: allergy multi-select + diet preference (veg/nonveg/vegan/eggetarian/pescatarian)
- **Step 4 — Free-text Notes**: additional health notes
- **Step 5 — Review**: summary of all selections with "both" status showing cross-badges

### `HealthVerdictCard.tsx`
**AI health verdict display components.**
- **`MealHealthBanner`** — expandable verdict card with "Dr. Capy's Verdict" label
  - Props: `analysis`, `isLoading`, `error`, `hasHealthProfile`
  - Verdict labels: "Looks Good" / "Needs Attention" / "Not Recommended" with colored icons (40px)
  - Summary bar with verdict icon + overall summary (wraps, not truncated)
  - Expandable: per-dish `DishVerdictRow` with swap suggestions + medical disclaimer
- **`HealthCheckButton`** — full-width card with gradient icon (48px), "AI Health Check" gradient title, condition subtitle, purple arrow button
  - Props: `conditions`, `isLoading`, `onCheck`
  - Loading state: gradient card with spinner + "Analyzing..."
- **`HealthProfilePrompt`** — full-width dashed-border card for no-profile upsell
  - Props: `onSetup`
  - "How healthy is this meal?" title + stethoscope icon + arrow button
- **`DishVerdictPill`** — inline verdict badge for dish cards
  - Props: `dishName`, `analysis`, `isLoading`

### `EatingAnalysisCard.tsx`
**Subtle, sleek AI eating habits analysis hero card — positioned at top of Progress tab.**
- Props: `meals`, `goals`, `healthProfile`, `latestAnalysis`, `isGenerating`, `error`, `onGenerate`, `onViewReport`
- **Design**: White card (`bg-card`) with Sparkles icon in light purple (`text-violet-400`) inside gradient icon wrap (`bg-gradient-to-br from-violet-50 to-indigo-50`). Sparkle icon has subtle pulse animation.
- **Title row**: "Eating Analysis" heading + inline score badge pill (color-coded) + subtitle "AI-powered insights into your eating habits"
- **Time-window segmented control**: Today / 7 Days / 14 Days / 30 Days (pill-style, active = violet gradient `from-violet-50 via-indigo-50 to-blue-50` with `text-violet-600`)
- **State-aware CTA button**:
  - No cached report → shimmer gradient CTA matching HealthCheckButton pattern (`animate-[shimmer_3s]`), gradient text "Analyze My Eating" with Sparkles icon
  - Cached report (fresh) → solid purple "View Report" + violet refresh button
  - Cached report (stale) → solid purple "View Report" with "(new meals logged)" hint
  - Generating → shimmer bg + spinner + gradient text "Analyzing..."
  - Error → red error message with retry
- **Cache freshness indicator**: "Generated 2h ago" or "New meals logged — refresh recommended"
- **Score badge**: color-coded (green=great, lime=good, orange=needs_work, red=concerning)
- Animated with framer-motion (fade in)

### `EatingAnalysisSheet.tsx` (NEW)
**Tabbed bottom sheet for displaying AI eating habits report.**
- Props: `report`, `onClose`
- Backdrop overlay with slide-up animation (consistent with MealTypeSheet pattern)
- **4 tabs** with horizontal scrollable tab bar:
  - **Summary**: Score badge (large, color-coded), 1-2 sentence summary, macro trend pills (arrows: ↑ improving, → stable, ↓ declining), comparison card (if previous report exists with delta percentages)
  - **Patterns**: Scrollable insight cards (5-7), each with category icon, title, detail text, severity color (green/grey/orange border)
  - **Health**: Condition-specific health notes (tab hidden when no health profile). Medical disclaimer at bottom.
  - **Actions**: Numbered priority action items with related insight reference. Practical Indian food swaps (paneer, makhana, brown rice, etc.)
- Swipe-to-close gesture
- Max height 85vh, scrollable content per tab

### `NutritionCard.tsx`
**Per-dish nutrition presentation card.** *(No longer used by ScanView — replaced by inline accordion cards. Still used by DishMode.)*
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
  - **Flowers**: Spiral pattern, count = calorie goal days hit (max 30), droop when wilting
  - **Trees**: Level 0→1 (3d streak) → 2 (14d streak) → 3 (30d streak)
  - **HotSpring**: Steam + warm water (streak ≥30)
  - **CozyHome**: Cabin with chimney smoke (15+ calorie goal days)
  - **Butterflies**: Wing-flap animation on circular paths (streak ≥5, max 5), chased by capybaras
  - **Rainbow**: Semi-transparent torus arc (14+ day streak, visual bonus with Forest milestone)
  - **BabyCapybaras**: Up to 3 small capybaras (7+ calorie goal days)
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
  - **Your Journey** roadmap: horizontal scrollable 8-milestone strip with check marks, "Next" hint, and expandable "How does this work?" section
  - Center: Three.js canvas (55vh) with motivation bubble overlay
  - **Garden Health + Talk to Capy** side-by-side cards (health bar with %, motivation button)
  - **Preview Garden Stages**: expandable panel with 8 demo presets that swap the 3D scene
  - **Next Unlock card**: Shows next milestone with clear description (e.g. "Log meals 3 more days in a row"), progress bar, and current/target count with unit (streak days, goal days)
  - Garden Journal (last 5 events with timestamps)
- **8 Milestones (2 tracks)**:
  - Streak track (disappear on streak break): 🌱 Sapling (3d), 🦋 Butterfly (5d), 🌲 Forest + 🌈 Rainbow (14d), ♨️ Hot Spring (30d)
  - Calorie goal track (permanent): 🌸 First Flower (3 goals), 🐾 Baby Capy (7 goals), 🏡 Cozy Home (15 goals), 🌻 Full Garden (30 goals)
- All 4 milestone lists unified: DEMO_PRESETS, ROADMAP_MILESTONES, achievements (removed from UI), NextUnlockCard

### `CalendarProgressView.tsx`
**Calendar-based progress visualization with Apple Fitness-style rings + integrated Top Dishes.**
- Props: `meals: LoggedMeal[]`, `goals: NutritionGoals`
- Default view: weekly row (7 days) with concentric rings per day
- Expandable: full month calendar grid
- Rings: outer green (calories %), middle orange (protein %), inner blue (carbs %)
- Tap a day → bottom sheet with full macro breakdown
- Days with no data show empty/grey rings
- Month navigation with left/right arrows (limited to current year)
- **Top Dishes section** (bottom of card, below legend):
  - Computes top 4 dishes by frequency from meals within the visible date range
  - **Week view**: filters by current week's 7 dates → label "Top this week"
  - **Month view**: filters by `viewYear`/`viewMonth` → label "Top this month"
  - Reactive: re-computes when toggling week↔month or navigating months
  - Rendered as compact pills: `{count}x {dish name}` with count color-coded (≥3 = green, <3 = orange)

### `ProgressView.tsx`
**Main Progress tab — insight-first layout with 5 sections.**
- Props: `todayTotals`, `goals`, `streak`, `meals`, `weeklyByDate`, `repeatedDishes`, `coachMarks`, `healthProfile`, `hasHealthProfile`, `eatingAnalysis`, `onViewAnalysisReport`
- **Layout (top → bottom)**:
  1. **Header**: "Progress" + subtitle "Your nutrition insights" + cat Lottie mascot
  2. **AI Eating Analysis** (`EatingAnalysisCard`) — hero position at top
  3. **Activity Calendar** (`CalendarProgressView`) — week/month toggle with integrated Top Dishes
  4. **Calorie Trend Card** (inline `CalorieTrendCard`):
     - **7d view**: Mon–Sun bars from `weeklyByDate`, today highlighted, future days hidden
     - **4w view**: Last 4 ISO weeks grouped from `meals`, bars show avg kcal/day per week
     - SVG chart with animated bars (`motion.rect`), trend polyline, goal dashed line
     - **Trend insight badge**: "Up/Down X% vs last/prior week" comparing current vs previous period avg
     - Green-to-blue gradient background (`from-[#E8F5E0] to-[#DBEAFE]`)
     - Handles edge cases: no data, single week (4w), zero prior data
  5. **Stats Row** (3 boxes): kcal to go | kcal today | avg/day (7d)
     - Gradient card backgrounds (green, green-light, orange-light)
     - "kcal to go" clamped to ≥0
  6. **Meal History Accordion**: grouped by date, expandable/collapsible per date
     - Today's entry expanded by default
     - Shows meal count + total kcal per date
     - Expanded: per-meal dish names, meal type, kcal, protein, carbs
     - "Show older meals" button loads beyond first 5 dates
- **Removed sections** (from previous version): Total Progress card, Nutrition/Fitness 2-col cards, Today's Macros bars, Streak Card, Weekly Calorie bar chart, Patterns section, old flat Meal History

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

### `MealTypeSheet.tsx` (NEW)
**Bottom sheet for a meal type slot — flat sections, per-dish management.**
- Props: `mealType`, `meals`, `onClose`, `onOpenDetail`, `onRemoveMeal`, `onRemoveDish`, `onScanDish`, `onDescribeMeal?`, `refreshStreak`
- Lucide icons per meal type (Coffee/Sun/Sunset/Moon) — no emojis
- Empty state shows both "Scan" and "Describe" buttons side-by-side (Describe navigates to Scan tab in describe mode)
- Single-line macro summary (kcal · protein · carbs · fat)
- Per-dish rows with minus-circle for tap-to-confirm delete (Remove/Cancel pills)
- Footer: left-aligned "Delete meal" text link, right-aligned green "Details" button
- Animated with framer-motion (slide up, AnimatePresence for delete confirmation)

### `MealDetailOverlay.tsx` (NEW)
**Full-screen overlay for editing meal details — modern macro chip design.**
- Props: `meal`, `mealIndex`, `onClose`, `onUpdateMeal`, `onUpdateDish`, `onRemoveDish`, `onRemoveMeal`, `onMoveMealToType`, `onRescan`, `refreshStreak`
- **Header**: Back button + centered title + health rating badge (Healthy/Balanced/Moderate/Heavy via `getMealHealthRating`)
- **Meal type selector**: 4-pill grid (breakfast/lunch/snack/dinner)
- **Per-dish cards** (`DishEditCard`):
  - Dish name + tappable kcal value (tap to edit calories with ±10 stepper)
  - Dish meta line at 11px (portion · weight · confidence)
  - **Colored macro chips**: 4 tappable pills — Protein (green), Carbs (orange), Fat (violet), Fiber (cyan)
  - Tap a chip → animated inline stepper row slides in (label + −/value/+ + Done button)
  - Active chip gets colored ring, others dim to 50%
  - **Compact portion pills**: always visible row (0.5x/1x/1.5x/2x), solid green active state
  - Remove link: subtle left-aligned text with Trash2 icon, tap-to-confirm
- **Notes**: textarea for meal notes
- **Bottom actions area** (no save in header):
  - Save Changes — disabled/greyed until edits made, then solid green with Check icon
  - Re-scan This Meal — dashed accent border
  - Delete Entire Meal — red with tap-to-confirm
- Uses `AnimatePresence` for stepper row animation
- Imports `getMealHealthRating` from `@/lib/healthRating`

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
