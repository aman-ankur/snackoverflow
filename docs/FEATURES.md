# Current Features

## 1. Bottom Navigation (4-Tab + Fridge Overlay)
- Fixed bottom tab bar with four tabs + center FAB:
  - 🏠 **Home** — dashboard with Capy mascot, daily intake ring, meal slots, fridge scan CTA
  - 📊 **Progress** — insight-first layout: AI eating analysis, activity calendar + top dishes, calorie trend chart, stats row, meal history accordion
  - 📷 **Scan** (center FAB) — dish scanner with camera, meal context, portion adjuster
  - 👤 **Profile** — body stats, daily targets, goal setup, reset
- 🧊 **Fridge Scanner** — full-screen overlay triggered from Home CTA (not a tab)
- Animated tab transitions via framer-motion `AnimatePresence`
- Warm Sage & Cream theme (flat, light design)

## 2. Fridge Scanner (Cloud AI Mode)
- Point camera at fridge → AI identifies all food items
- Each item shows: English name, Hindi name, quantity, confidence level (high/medium/low)
- Items accumulate across multiple scans (deduplication by name, keeps highest confidence)
- User can remove incorrect items with X button
- Camera uses 65vh height when streaming (near full-screen on mobile)
- Auto-scan mode: analyzes every 4 seconds automatically
- Flip camera button (front/rear)

## 3. AI Recipe Suggestions
- Exactly **5 Indian lunch/dinner recipes** per scan
- Recipes use detected ingredients, suggest common pantry staples as "also needed"
- Each recipe card shows: name (English + Hindi), cook time, difficulty, diet badge, description
- Expandable steps section
- Tags: vegetarian, north-indian, south-indian, etc.

## 4. Dish Scanner & Nutrition Tracking (new)
- Manual scan only (no auto-scan) for low API cost
- Reuses camera UI with dish-specific labels
- Supports single dish or multi-dish plate/thali response
- **Controls Strip**: horizontal scrollable row combining meal type pills (auto-selected by time of day with green dot indicator) + portion multiplier pills (`½×`, `1×`, `1.5×`, `2×`)
- **Plate Total**: large centered calorie number with macro breakdown (protein, carbs, fat, fiber) + dish count and meal type
- **Accordion dish cards**: per-dish collapsible cards with:
  - Collapsed: dish name, Hindi name, weight, confidence badge (Confident/Likely/Unsure), inline macro pills, contextual note (tag-based positive/warning), "Tap for details" hint
  - Expanded: editable 5-col macro grid (cal/protein/carbs/fat/fiber), calorie editor, weight editor, portion display, key ingredients, health tip, tags, reasoning toggle, action buttons (Wrong dish?, Describe, Remove)
  - Single-dish results auto-expand; multi-dish uses independent accordion (tapping one collapses others)
- **Proportional editing**: changing calories scales all macros proportionally; changing weight scales everything proportionally
- Health tags: high-protein, high-carb, high-fat, low/high-calorie, fiber-rich
- **Sticky log bar**: fixed at bottom with total calories + meal type + "Log Meal" button
- "Clear analysis & re-scan" link below log bar
- **Frozen frame**: on Analyze Dish, the camera freezes to a thumbnail with status badges:
  - "Analyzing your meal..." (spinner) while API call is in progress
  - "Analysis complete" (checkmark) once results are ready
  - "Scan Again" button to restart camera and clear results
- **Provider tracking**: AI provider name displayed alongside dish count
- **Mock scan mode** (`?mock=scan`): full UI testing without camera or API — auto-switches to Scan tab, simulates 3 Indian dishes (Dal Tadka, Jeera Rice, Aloo Gobi) after 1.5s delay. See `docs/TESTING.md` for details.
- Daily summary cards with progress rings for calories/protein/carbs/fat
- Meal history with:
  - "You had this X days ago" badge
  - Weekly calorie summary
  - Repeated dish pattern insights
  - Fridge↔Dish linkage badge when ingredients match recent fridge scan

## 5. Dietary Filters
- Filter pills at top: All, Veg, Vegan, Egg, Jain
- Selected pill has solid green accent background
- Filter is passed to AI prompt — recipes respect the constraint
- Jain = no onion, garlic, root vegetables

## 6. Send to Cook (ShareRecipe)
- "Send to Cook" button on each recipe card
- Dropdown with serving size picker (1-4 people)
- **Hindi section** (top):
  - 🎤 Hindi Audio Message — Groq generates casual Hindi text → Sarvam AI TTS converts to MP3 → share via WhatsApp
  - 💬 Hindi Text on WhatsApp — AI-generated short Hindi message sent as WhatsApp text
- **English section** (bottom):
  - WhatsApp (English recipe details)
  - Read Aloud (browser SpeechSynthesis, en-IN)
  - Share via... (Web Share API)
  - Copy Text (clipboard)
- Hindi messages are casual: "भैया, आज 2 लोगों के लिए पनीर मटर बना दीजिए। सब सामान फ्रिज में है।"
- Serving count changes regenerate the Hindi text (cache invalidated)

## 7. Freshness / Expiry Tracker
- Auto-adds detected items with estimated shelf life (e.g., milk=3d, paneer=5d, onion=14d)
- Color-coded: 🟢 Fresh, 🟡 Expiring (≤2 days), 🔴 Expired
- Tap date to manually edit expiry
- Persisted in localStorage (`snackoverflow-expiry-tracker`)
- Collapsible section, shows warning count badge

## 8. Shopping List
- Auto-generated from recipe `ingredients_needed` minus detected items
- Shows which recipe each item is needed for
- Copy to clipboard button
- Collapsible section

## 9. Meal Planner
- Weekly grid (Mon-Sun)
- Add recipes from suggestions to specific days
- Remove meals, clear day
- Copy day's meal plan to clipboard
- Persisted in localStorage (`snackoverflow-meal-plan`)
- Collapsible section

## 10. YOLO On-Device Mode
- YOLOv8n running via ONNX Runtime Web (WASM)
- Real-time bounding boxes on camera feed (5-15 FPS)
- 80 COCO object classes (limited for food)
- Matches detected items to static recipe database
- Fully offline — no API calls
- Experimental/demo mode — Cloud AI is the primary mode

## 11. Multi-Provider AI Fallback
- Fridge analysis: Gemini 2.0 Flash → Gemini 2.0 Flash Lite → Groq Llama 4 Scout
- Dish camera scan: Gemini 2.5 Flash → Gemini 2.0 Flash → Groq Llama 4 Scout
- Describe meal: Gemini 2.0 Flash-Lite → OpenAI gpt-4.1-nano + Groq Llama 4 Scout (parallel race)
- Eating habits analysis: Gemini 2.5 Flash → OpenAI gpt-4.1-mini → Groq Llama 4 Scout
- If all rate-limited, shows friendly "wait 30s" message and stops auto-scan
- Hindi text: Groq only (free, fast)
- Hindi TTS: Sarvam AI only (native Hindi voice)

## 12. Cost Controls
- Image downscaling to max width 512px and JPEG compression before AI requests
- Dish scan endpoint includes short-lived in-memory cache for repeated near-identical scans
- Describe-meal endpoint includes 5-minute in-memory cache (200 entries max)
- Manual-scan-only dish mode avoids uncontrolled background token usage
- Describe-meal uses Gemini 2.0 Flash-Lite (separate 15 RPM quota from camera scanner's 2.5 Flash)
- OpenAI + Groq raced in parallel (first valid response wins, no sequential waiting)
- 6-second per-provider timeout prevents slow providers from blocking the pipeline
- **Eating analysis**: client-side pre-aggregation reduces AI input from ~3000-5000 tokens (raw meals) to ~400 tokens (compact summary). 95%+ of calls use Gemini free tier ($0.00). Smart caching avoids re-generation when no new meals logged.

## 13. Goal Setting & Capy Mascot (NEW)
- **Capy** — mood-reactive capybara mascot (kawaii PNG images, 3 variants: bath/orange-hat/headphones)
- **Lottie animations** — animated mascots via `lottie-react`:
  - Fat capybara logo animation on Home greeting & streak cards
  - Cute cat animation on Progress page header
  - Cute dog animation on Home fridge scanner card
- **5-step animated onboarding wizard**:
  - Welcome screen with Capy
  - Body stats: Gender, Age (range slider), Height (cm/ft toggle), Weight (kg/lbs toggle)
  - Activity level: 5 options (Sedentary → Athlete)
  - Goal: 7 India-specific options (Lose 2-3kg, Lose 5-7kg, Lose 7-10kg, Tone Up, Maintain, Build Muscle, Lean Bulk)
  - Personalized plan: computed TDEE + calorie/macro targets (tap to edit)
- **TDEE calculator** — Mifflin-St Jeor BMR × activity multiplier + goal offset
  - Evidence-based calorie deficits/surpluses per goal
  - Protein targets: 1.6–2.2 g/kg bodyweight depending on goal
  - Fat: 25% of target calories; carbs: remainder
  - Minimum floor: 1200 kcal
- **GoalDashboard** — replaces DailySummary with:
  - Time-of-day greeting + Capy speech bubble (context-aware motivational lines)
  - Calorie progress bar with percentage and remaining
  - Macro progress bars (protein/carbs/fat)
  - Streak counter (current + longest)
  - Edit goals button re-opens onboarding
- **Streak tracking** — consecutive days with logged meals
- **Persistence** — localStorage (`snackoverflow-user-goals-v1`): UserProfile (incl. optional name), NutritionGoals, StreakData
- Auto-shows onboarding on first visit; skip uses sensible defaults (2000 kcal)
- **Personalized greetings** — if user sets a name during onboarding, Home tab greeting and Capy speech use it (e.g. "Good evening, Ankur!")

## 14. Capy's Garden — 8-Milestone Progression System (NEW)
- **2-track gamification** designed around habit formation (Duolingo/Apple Fitness inspired):
  - **Streak track** (disappear on streak break — motivates daily logging):
    - 🌱 Sapling (3-day streak) → 🦋 Butterfly (5d) → 🌲 Forest + 🌈 Rainbow (14d) → ♨️ Hot Spring (30d)
  - **Calorie goal track** (permanent — rewards nutrition quality):
    - 🌸 First Flower (3 goal days) → 🐾 Baby Capy (7d) → 🏡 Cozy Home (15d) → 🌻 Full Garden (30d)
- Calorie goal = eating within 80–120% of daily calorie target
- Thresholds are monotonically increasing — later milestones can never unlock before earlier ones
- **Your Journey** roadmap: horizontal scrollable milestone strip with check marks and "Next" hint
- **How does this work?** expandable section explains both tracks with milestone-to-unlock mapping
- **Garden Health + Talk to Capy** combined into side-by-side card row
- **Preview Garden Stages**: 8 demo presets that swap the 3D scene to show each milestone
- **Next Unlock card**: progress bar with clear hint text ("Log meals X more days in a row" or "Hit your calorie goal X more days")
- Three.js visuals map directly to milestone state (treeLevel, flowers, butterflies, hasRainbow, hasCrown, babyCapybaras, homeLevel)
- Garden health: composite 0–100% score based on streak + goal day bonuses; wilts when streak = 0

## 15. Calendar Progress View
- Apple Fitness-style concentric rings per day showing macro progress
- Rings: outer green (calories %), middle orange (protein %), inner blue (carbs %)
- Default: weekly row view (7 days)
- Expandable: full month calendar grid
- Tap a day → bottom sheet with full macro breakdown for that day
- Days with no data show empty/grey rings
- Month navigation (left/right arrows, limited to current year)
- **Top Dishes** section at bottom of calendar card:
  - Shows top 4 most-eaten dishes as compact pills (`3x Dal`, `2x Roti`)
  - Dynamically filters by visible date range (week dates or month)
  - Label changes: "Top this week" ↔ "Top this month" based on current view
  - Re-computes when toggling week/month or navigating to different months
- Integrated as slot #2 in Progress tab (after AI Eating Analysis)

## 16. Meal Type Sheet & Detail Editing (NEW)
- **Meal Type Sheet** (bottom sheet) — tap a meal slot on Home to open:
  - Lucide icons per meal type (Coffee/Sun/Sunset/Moon) — no emojis
  - Single-line macro summary (kcal · protein · carbs · fat)
  - Per-dish rows with minus-circle tap-to-confirm delete
  - Footer: "Delete meal" left, green "Details" button right
- **Meal Detail Overlay** (full-screen) — tap "Details" to open:
  - **Health rating badge** in header (Healthy/Balanced/Moderate/Heavy) via `getMealHealthRating()`
  - **Colored macro chips**: Protein (green), Carbs (orange), Fat (violet), Fiber (cyan)
  - Tap any chip → animated inline stepper row (−/value/+/Done)
  - Tap kcal value → calorie stepper (steps by 10)
  - **Fiber** added as 4th macro chip
  - **Compact portion pills** always visible (0.5x/1x/1.5x/2x), solid green active
  - **Save at bottom** — disabled until edits made, then solid green with Check icon
  - Re-scan and Delete Entire Meal alongside Save in bottom actions area
  - Meal type selector, notes textarea, per-dish remove with tap-to-confirm
  - All icons via Lucide (ShieldCheck, Trash2, Camera, Check, etc.) — no emojis

## 17. Describe Your Meal — Text-Based Nutrition (NEW)
- **Camera/Describe toggle** on Scan tab — pill-style switcher at top
- Describe mode: type what you ate in natural language (Hindi-English mix supported)
  - e.g. "rajma chawal with raita, 1 papad, and nimbu pani"
  - e.g. "2 paratha with curd and achaar"
- AI parses description into individual dishes with full nutrition breakdown
- **3 food-specific portion options per dish** — culturally relevant labels:
  - Curries/dal: "Small katori / Regular katori / Large bowl"
  - Bread: "1 roti / 2 rotis / 3 rotis"
  - Drinks: "Small cup / Regular cup / Tall glass"
  - Snacks: "Small handful / Handful / Large handful"
- **Fractional quantity support**: "half croissant", "quarter pizza", "1.5 roti" — the Regular portion represents the user's exact described amount (half a standard serving, etc.)
- **Smart defaulting**: if user says "1 papad", AI defaults to the single-papad portion
- **Accordion dish cards** (matches ScanView design):
  - Collapsed: dish name + calories, Hindi name + weight, inline macro pills (Protein/Carbs/Fat), contextual note, confidence dot, "Tap for details" hint
  - Expanded: 5-column macro grid (Cal/Protein/Carbs/Fat/Fiber), calorie editor with proportional scaling, portion picker, tags, health tip, reasoning toggle, "Wrong dish?" editor
  - Single-dish auto-expands; tapping one collapses others
- **Plate Total**: large centered card with 5xl calorie number, dish count, meal type, 4 macro stats (Protein/Carbs/Fat/Fiber)
- **Capy mascot**: compact inline capy with mood-based message (light <400kcal, heavy >700kcal)
- **Log bar**: card-style with calories + meal type on left, "Log Meal" button on right
- "Clear & re-describe" link below log bar
- **Correction flow**: if camera scan was wrong, "Describe instead" link pre-fills context
- **MealTypeSheet integration**: "Describe" button alongside "Scan" in empty meal slots
- **Button label**: "Estimate Nutrition" (distinct from scan's "Analyze Dish")
- Logs to same meal system as camera scan — appears on Home immediately
- **Provider chain**: Gemini 2.0 Flash-Lite → OpenAI gpt-4.1-nano + Groq parallel race
- **Performance**: ~1-2s when Gemini available, ~4-5s fallback (parallel race), 6s max timeout
- New files: `describe-meal/route.ts`, `useDescribeMeal.ts`, `DescribeMealView.tsx`
- New dep: `openai` (npm package)

## 21. Pull-to-Refresh (NEW)
- Custom touch-gesture pull-to-refresh on all tabs (since native PTR is disabled by `overscroll-behavior: none`)
- **PullToRefresh component** (`src/components/PullToRefresh.tsx`):
  - Detects `touchstart`/`touchmove`/`touchend` when `scrollTop === 0`
  - Dampened pull distance (logarithmic curve, max 100px)
  - Arrow icon rotates to 180° at threshold (60px), then switches to spinner
  - Triggers refresh callback, animates back when done
- Wraps `<main>` content in `page.tsx`
- Refresh action: refreshes streak data + visual confirmation spinner

## 18. Health Personalization

### Health Profile Wizard
- Multi-step Dr. Capy wizard for setting up health conditions, lab values, allergies, diet preference, and free-text notes
- **15 conditions** in registry: Diabetes (Type 1 & 2), Hypertension, High Cholesterol, Heart Disease, Kidney Disease, Thyroid, PCOS, Gout, IBS, Lactose Intolerance, Celiac Disease, Iron Deficiency, Vitamin D Deficiency, Pregnancy, Menopause
- **Gender/age filtering**: conditions like Pregnancy, Menopause, PCOS only shown for relevant genders; Menopause requires age ≥ 40
- **Condition status**: `"active"` (user has it), `"family_history"` (runs in family), or `"both"` (user has it AND family history)
- Inline "Me" (red pill) and "Family" (amber pill) toggles per condition — can select both simultaneously
- "Family" pill only shown for conditions where `hasFamilyHistory: true` (not shown for pregnancy, menopause, IBS, lactose intolerance, celiac, iron/vitamin D deficiency)
- Optional lab value inputs (HbA1c, blood pressure, cholesterol, etc.) with date tracking
- Stale lab warning (>180 days) shown in Profile view
- Review step shows cross-badges for "both" status conditions

### Health Context Builder
- Deterministic rules engine (`healthContextBuilder.ts`) — no AI needed for lab interpretation
- Builds compact context string injected into AI health verdict prompts
- Conditions with "both" status get ELEVATED RISK note for stronger dietary advice
- Severity classification based on lab values (e.g. HbA1c > 9 = "severe")
- Dietary rules generated per condition (e.g. "Limit sodium to 1500mg/day" for hypertension)

### On-Demand AI Health Check
- **Not auto-triggered** — user taps "AI Health Check" button after viewing scan/describe results
- **With profile**: full-width card with gradient icon, "AI Health Check" gradient title, condition subtitle, purple arrow button
- **Without profile**: full-width dashed-border card with "How healthy is this meal?" title, stethoscope icon, "Set up your health profile" subtitle
- Contextual subtitle: shows first 2 condition short labels separated by " · ", "+N more" if overflow
- Loading state: gradient card with spinner + "Analyzing..."
- Result: expandable `MealHealthBanner` with "Dr. Capy's Verdict" label, overall verdict (Looks Good/Needs Attention/Not Recommended) + per-dish verdicts with swap suggestions
- **Provider chain**: Gemini 2.5 Flash → Claude 3.5 Haiku → GPT-4.1-mini (tiered fallback)
- Medical disclaimer: "For informational purposes only. Consult your doctor."

### Profile View Integration
- Health Profile card shows active conditions (red pills) and family history (amber pills)
- Conditions with "both" status show in Active section with "FH" badge
- Diet preference display
- Stale labs warning with age in months
- Summary line: "2 active conditions, 1 family history — Dr. Capy personalizes every scan"

### Files
- `healthConditions.ts` — conditions registry with `ConditionDef` (id, label, shortLabel, category, icon, description, dietaryImpact, labFields, hasFamilyHistory, genderFilter, minAge)
- `healthContextBuilder.ts` — deterministic lab rules + `buildHealthContextString()` + `getStaleLabs()` + `getHealthSummaryDisplay()`
- `useHealthProfile.ts` — React hook with localStorage + Supabase sync
- `useHealthVerdict.ts` — on-demand verdict fetch hook with abort support
- `HealthProfileWizard.tsx` — multi-step wizard component
- `HealthVerdictCard.tsx` — MealHealthBanner, HealthCheckButton, HealthProfilePrompt, DishVerdictPill
- `api/health-verdict/route.ts` — POST route with tiered AI fallback

## 19. Eating Habits Analysis — AI-Powered Reports (NEW)

### Overview
AI-generated eating habits report that analyzes logged meals over a selectable time window, cross-referenced with health profile data, producing actionable insights. Optimized for minimal token cost via client-side pre-aggregation.

### Trigger Points
- **Progress tab**: Prominent "Eating Habits Analysis" card below Weekly Calories chart with time-window segmented control (Today / 7 Days / 14 Days / 30 Days) and "Analyze My Eating" button
- **Home tab**: Summary card showing latest report score + one-liner summary. Tapping navigates to Progress tab. Only visible if a report was generated in the last 7 days.

### Time Windows
- **Today** — useful after logging multiple meals in a day
- **7 Days** — weekly check-in (default selection)
- **14 Days** — bi-weekly trend analysis
- **30 Days** — monthly review

### Cost-Optimized Architecture
The key design decision: **all number crunching happens client-side** via `mealAggregator.ts`. The AI receives a compact ~400-token summary instead of raw meal JSON (~3000-5000 tokens). This reduces cost by ~10x.

Client-side pre-computation includes:
- Daily calorie/macro totals and averages
- Goal adherence rate (days within 80-105% of calorie target)
- Weekend vs weekday calorie averages
- Meal timing stats (breakfast skip count, late dinner count)
- Top 10 dishes by frequency with average calories
- Macro ratio split (protein/carbs/fat percentages)
- Protein clustering at dinner percentage
- Snack calorie percentage of total
- Fried item count (from dish tags and name matching)
- Best/worst day by distance from calorie goal
- Unique dish count (variety metric)

### AI Report Structure
The AI returns a structured JSON report with:
- **Score**: `great` | `good` | `needs_work` | `concerning`
- **Score Summary**: 1-2 sentence mixed-tone assessment (data-first with warm encouragement)
- **Macro Trends**: per-macro direction (improving / stable / declining)
- **5-7 Insights** (dynamically selected from data):
  - **Temporal**: weekend calorie spikes, breakfast skipping impact, late dinners, snack clustering
  - **Macro**: protein distribution across meals, carb-heavy days, invisible snack calories, fiber gaps
  - **Variety**: diet monotony, repeat offenders, missing food groups
  - **Goal**: calorie target adherence, protein shortfall, best/worst day
- **Health Notes**: condition-specific observations (only when health profile exists)
  - Connects eating patterns to conditions (e.g. sodium + hypertension, GI + diabetes)
- **Action Items**: 3-5 prioritized, practical Indian food swaps (paneer, makhana, brown rice, etc.)
- **Period Comparison**: week-over-week delta when previous report exists

### Tabbed Bottom Sheet UI
Report displayed in a bottom sheet (consistent with MealTypeSheet pattern) with 4 tabs:
- **Summary**: Score badge, 1-2 sentence summary, macro trend pills (arrows), comparison card (if previous report exists)
- **Patterns**: Scrollable insight cards with severity color-coding (green=positive, grey=neutral, orange=warning)
- **Health**: Condition-specific notes (tab hidden if no health profile)
- **Actions**: Numbered priority action items with related insight references

### Smart Caching
- Last 10 analyses stored per user in `user_data.meal_analyses` (Supabase JSONB)
- Cache check: if same window was analyzed and no new meals logged since, shows cached report with "Generated Xh ago" badge
- "Refresh" button available to force re-generation
- "New meals logged" indicator when cached report is stale

### Provider Chain
- **Tier 1**: Gemini 2.5 Flash (free tier, 500 req/day) — best quality for health reasoning
- **Tier 2**: OpenAI gpt-4.1-mini (~$0.0015/call) — strong fallback with good insight depth
- **Tier 3**: Groq Llama 4 Scout (free) — emergency fallback, adequate for structured reports
- Temperature: 0.3 (factual, consistent)
- Max output tokens: 1200
- Per-provider timeout: 15 seconds

### Cost Profile
- 95%+ of calls: **$0.00** (Gemini free tier)
- Rare fallback: **~$0.0015** (gpt-4.1-mini)
- Emergency: **$0.00** (Groq free tier)
- Estimated input: ~450 tokens, output: ~900 tokens per analysis

### Files
- `mealAggregator.ts` — client-side pre-aggregation engine (`aggregateMeals()` + `serializeForPrompt()`)
- `useEatingAnalysis.ts` — React hook (state, cache logic, staleness detection, Supabase sync)
- `api/analyze-habits/route.ts` — POST route with 3-tier provider chain
- `EatingAnalysisSheet.tsx` — tabbed bottom sheet (Summary / Patterns / Health / Actions)
- `EatingAnalysisCard.tsx` — trigger card with time-window picker for Progress tab
- Types in `dishTypes.ts`: `EatingAnalysis`, `EatingReport`, `ReportInsight`, `ActionItem`, `PeriodComparison`, `MacroTrends`

## 20. Progress Page Revamp (NEW)
Complete redesign of the Progress tab from information-heavy to insight-first layout.

### What Changed
- **Removed**: Total Progress card, Nutrition/Fitness 2-col cards, Today's Macros (3 progress bars), Streak Card, Weekly Calorie bar chart, Patterns section, flat Meal History list
- **Repositioned**: AI Eating Analysis moved from bottom to hero slot #1
- **Added**: Calorie Trend chart, 3-box stats row, meal history accordion, Top Dishes in calendar

### New Layout (top → bottom)
1. **AI Eating Analysis** — hero card with subtle white design, Sparkles icon in light purple, shimmer gradient CTA button matching HealthCheckButton pattern
2. **Activity Calendar + Top Dishes** — existing calendar with new "Top this week/month" dish pills at bottom, reactive to week/month toggle and month navigation
3. **Calorie Trend Card** — SVG bar chart + trend polyline with 7d/4w toggle:
   - 7d: Mon–Sun daily calorie bars, today highlighted green, future days hidden, goal dashed line
   - 4w: Last 4 ISO weeks, bars show avg kcal/day per week
   - Trend insight badge: "Up/Down X% vs last/prior week" with avg comparison
   - Green-to-blue gradient card background
4. **Stats Row** (3 compact boxes): "kcal to go" (clamped ≥0) | "kcal today" | "avg/day (7d)"
5. **Meal History Accordion** — collapsible date groups (today expanded by default), per-meal dish names + meal type + macros, "Show older meals" for dates beyond first 5

### Design Tokens
- AI card icon: `Sparkles` from Lucide, `text-violet-400`, wrapped in `bg-gradient-to-br from-violet-50 to-indigo-50`
- AI CTA shimmer: `animate-[shimmer_3s_ease-in-out_infinite]` with `from-violet-50 via-indigo-50 to-blue-50`
- Window pills active: violet gradient with `text-violet-600`
- Calorie Trend bg: `bg-gradient-to-br from-[#E8F5E0] to-[#DBEAFE]`
- Stats row: gradient card backgrounds (accent-light, orange-light)
- New CSS keyframe: `pulse-subtle` in `globals.css`
