# Backlog — Future Features

## Priority: High (Next Up)

### ~~Dish Scanner & Calorie Tracker~~ ✅ SHIPPED
See [PRD-DISH-SCANNER.md](./PRD-DISH-SCANNER.md) for full spec.
- ~~Bottom tab bar (Fridge / Dish)~~
- ~~Point camera at dish → instant calorie/macro breakdown~~
- ~~Meal logging, daily summary, history~~
- ~~Cross-tab intelligence (fridge ↔ dish linking)~~

### ~~Typography Overhaul~~ ✅ SHIPPED
- ~~Switched from Geist to DM Sans (weights 400–900) for bolder, punchier text~~
- ~~Mono font: Geist Mono → JetBrains Mono~~
- ~~Base body font-weight set to 500 (medium) — all text thicker by default~~
- ~~Foreground darkened: #1A1A1A → #0D0D0D (near-black)~~
- ~~Muted text darkened: #6B6560 → #4A4540 (better readability)~~
- ~~All headings bumped to font-extrabold (800) across Home, Progress, Profile, Scan~~
- ~~Labels/badges: font-medium → font-semibold, font-semibold → font-bold~~
- ~~Bottom tab labels bumped to font-bold~~

### ~~Scan UX Improvements~~ ✅ SHIPPED
- ~~Auto-scroll to results after analysis completes (no more stuck on camera)~~
- ~~Plate Total card now lists individual dish names with calories and weight~~
- ~~Improved portion accuracy: AI prompt counts individual pieces for chips/nuggets/momos~~
- ~~Editable weight per dish: tap grams → +/- buttons or type directly → macros recalculate~~
- ~~Delete button per dish card (red "Remove" pill)~~
- ~~Collapsed/expanded card view: multi-dish plates show summary + "Show N dishes · Edit quantities" toggle~~
- ~~Confidence badge redesigned: "Confident" / "Likely" / "Unsure" instead of raw "high/medium/low"~~
- ~~Shared state: ScanView uses page-level mealLog (no stale data on Home after logging)~~
- ~~Auto-navigate to Home tab after meal is logged (1.2s "Logged ✓" → Home with fresh data)~~
- ~~Analysis cleared after logging so Scan tab is ready for next scan~~

### ~~Scan Results Redesign~~ ✅ SHIPPED
- ~~Controls Strip: horizontal scrollable row combining meal type (auto-selected by time of day) + portion multiplier pills~~
- ~~Plate Total: large centered calorie number with macro breakdown~~
- ~~AI Health Check: prominent full-width card (with-profile: gradient + conditions, without-profile: dashed card + "How healthy?")~~
- ~~Verdict labels updated: "Looks Good" / "Needs Attention" / "Not Recommended" with "Dr. Capy's Verdict" tag~~
- ~~Accordion dish cards: per-dish collapsible cards with collapsed view (name, confidence badge, calories, macro pills, contextual note) and expanded view (editable macro grid, editors, ingredients, health tip, reasoning, actions)~~
- ~~Contextual dish notes: tag-based positive/warning one-liners (e.g. "High cream & butter — calorie dense", "Good protein source")~~
- ~~Sticky log bar: fixed bottom with total + "Log Meal" button~~
- ~~Compact capy mascot: 36px avatar + speech bubble~~
- ~~Replaced NutritionCard usage in ScanView with inline accordion cards~~
- ~~HealthCheckButton and HealthProfilePrompt redesigned as full-width prominent cards~~

### ~~UI Refresh + Capy's Garden~~ ✅ SHIPPED
- ~~Punchier color palette (richer greens, darker foreground, warmer orange)~~
- ~~Bolder fonts across all views (extrabold headings, bold labels)~~
- ~~Colored gradient card backgrounds (green tint Daily Intake, accent tint Capy card)~~
- ~~Tinted macro pills (Carbs=orange, Protein=green, Fats=warm)~~
- ~~Health badges on meal rows (Healthy/Balanced/Moderate/Heavy with Lucide icons)~~
- ~~Macro mini-pills per meal (P/C/F grams)~~
- ~~Redesigned Scan FAB (larger h-16, white ring, green glow shadow)~~
- ~~New "Capy" tab — 5-tab bottom nav (Home/Progress/Scan/Capy/Profile)~~
- ~~Three.js garden scene: 3D capybara, flowers, trees, pond, butterflies, rainbow, sparkles~~
- ~~Garden state system tied to meal logging, streaks, and goal achievement~~
- ~~60+ pre-built motivational lines with context-aware selection~~
- ~~LLM fallback API for motivation (Gemini → Groq)~~
- ~~Achievements grid, Garden Journal, Garden Health bar, Next Unlock progress~~
- ~~Lazy loaded with next/dynamic, frameloop pauses when tab inactive~~
- New files: `healthRating.ts`, `useGardenState.ts`, `capyMotivation.ts`, `CapyGarden.tsx`, `CapyView.tsx`, `api/capy-motivation/route.ts`
- New deps: `three`, `@react-three/fiber`, `@react-three/drei`, `@types/three`

### ~~Garden Visuals & Mascot Refinement~~ ✅ SHIPPED
- ~~Reordered achievement unlocks: First Flower → Sapling → Rainbow → Forest → Baby Capy → Cozy Home → Hot Spring → Full Garden~~
- ~~Added coniferous/varied tree shapes in forest levels~~
- ~~Butterflies appear at Sapling stage~~
- ~~Rainbow position fixed (fully visible, softer colors)~~
- ~~Full Garden icon changed to 🌻 sunflower~~
- ~~30-second auto-revert for garden stage previews (+ tab-change detection)~~
- ~~Replaced SVG mascot with kawaii PNG images (3 mood variants: bath/orange-hat/headphones)~~
- ~~Transparent backgrounds on all mascot PNGs~~
- ~~Integrated Lottie animations: fat capybara (Home), cute cat (Progress), cute dog (Home fridge card)~~
- ~~Different mascot images used contextually across pages~~
- New deps: `lottie-react`
- New assets: `capy-{happy,default,motivated}.png`, `capy-mascot.json`, `cute-cat.json`, `cute-dog.json`

### ~~UI Redesign — Sage & Cream Theme~~ ✅ SHIPPED
- ~~4-tab navigation (Home / Progress / Scan FAB / Profile) + Fridge Overlay~~
- ~~Warm flat light theme replacing dark theme (bg-card, text-muted, border-border)~~
- ~~HomeView dashboard with Capy mascot, calorie ring, meal slots~~
- ~~ProgressView with macro bars, weekly calories, meal history~~
- ~~ProfileView with body stats, daily targets, reset actions~~
- ~~Capy SVG overhaul with breathing, blinking, tail wag, floating, sleep animations~~
- ~~All 25+ components restyled — zero dark-theme remnants~~
- See [TEST-RESULTS.md](./TEST-RESULTS.md) for E2E verification

### ~~Describe Your Meal — Text-Based Nutrition~~ ✅ SHIPPED
- ~~Camera/Describe toggle on Scan tab~~
- ~~Natural language meal description → AI-parsed nutrition with food-specific portion options~~
- ~~3-tier provider chain: Gemini 3.5 Flash-Lite → OpenAI gpt-4.1-nano + Groq GPT-OSS 20B parallel race~~
- ~~Correction flow from bad camera scans ("Describe instead")~~
- ~~MealTypeSheet "Describe" button alongside "Scan"~~
- ~~Hindi-English code-switching support (aloo, dal, roti, sabzi, katori)~~
- ~~Performance optimized: ~1-2s Gemini, ~4-5s fallback, 6s max timeout~~
- New files: `describe-meal/route.ts`, `useDescribeMeal.ts`, `DescribeMealView.tsx`
- New dep: `openai`
- New types: `PortionOption`, `DescribedDish`, `DescribeMealResult` in `dishTypes.ts`

### Eating Habits Analysis — AI-Powered Reports ✅ SHIPPED
- AI-generated eating habits report with time-window selection (Today / 7d / 14d / 30d)
- Client-side pre-aggregation for minimal token cost (~400 input tokens, ~700 output tokens)
- Provider chain: Gemini 3.5 Flash-Lite → GPT-5.6 Luna → Groq GPT-OSS 20B
- Tabbed bottom sheet report: Summary (score + trends + comparison), Patterns (5-7 AI-selected insights), Health (condition-specific notes), Actions (prioritized items)
- Hidden pattern detection: weekend vs weekday calorie spikes, breakfast skipping impact, protein clustering at dinner, snack calorie percentage, fried food frequency, diet monotony
- Health-condition-aware: connects eating patterns to diabetes, hypertension, cholesterol, etc.
- Week-over-week comparison with delta tracking
- Smart caching: shows cached report with "Refresh" option, detects new meals since last analysis
- Trigger card on Progress tab + summary card on Home tab
- Stored in Supabase `user_data.meal_analyses` (JSONB, last 10 analyses)
- New files: `mealAggregator.ts`, `useEatingAnalysis.ts`, `analyze-habits/route.ts`, `EatingAnalysisSheet.tsx`, `EatingAnalysisCard.tsx`
- New types: `EatingAnalysis`, `EatingReport`, `ReportInsight`, `ActionItem`, `PeriodComparison` in `dishTypes.ts`

### Progress Page Revamp ✅ SHIPPED
- Complete redesign from information-heavy to insight-first layout
- **Removed**: Total Progress card, Nutrition/Fitness 2-col cards, Today's Macros bars, Streak Card, Weekly Calorie bar chart, Patterns section, flat Meal History
- **New layout**: AI Eating Analysis (hero) → Activity Calendar + Top Dishes → Calorie Trend (7d/4w SVG chart) → 3-box Stats Row → Meal History Accordion
- EatingAnalysisCard restyled: subtle white card, Sparkles icon in light purple, shimmer gradient CTA
- CalendarProgressView: integrated Top Dishes section reactive to week/month toggle + month navigation
- CalorieTrendCard: animated SVG bar chart + trend polyline, "Up/Down X% vs last week" insight badge
- Green-to-blue gradient background on Calorie Trend card
- Meal History: collapsible accordion by date, today expanded by default
- New CSS keyframe: `pulse-subtle`
- Modified files: `ProgressView.tsx`, `EatingAnalysisCard.tsx`, `CalendarProgressView.tsx`, `globals.css`

---

## Priority: Medium

### Low Stock Reminders
- Notify when items are finishing or expired
- In-app alerts (banner or badge)
- Optional push notifications (requires service worker)
- Trigger: expiry tracker detects items in "expiring" or "expired" state

### "What Else Should I Buy" — AI Suggestions
- AI-powered suggestions based on what's in the fridge
- Complementary items (e.g., "you have paneer but no cream")
- Staples running low (e.g., "no onions detected in 3 scans")
- Could use Groq/Gemini with fridge history context

### ~~Health Categorization~~ ✅ SHIPPED (as Health Personalization)
- ~~Categorize detected items as healthy/unhealthy~~
- ~~Show macros per item (protein, carbs, fat, calories)~~
- ~~Nutrition data per ingredient~~
- ~~Color-coded health scores~~
- Shipped as full Health Personalization feature: 15-condition wizard with gender/age filtering, inline Me/Family pills, on-demand AI Health Check button, per-dish Good/Caution/Avoid verdicts with swap suggestions
- See FEATURES.md §18 for full details

### Duplicate from Past Meal
- When logging a new meal, option to "Log again" from meal history
- Shows recent unique meals with thumbnails (if photo storage is implemented)
- One-tap re-log with option to adjust portions
- Saves a full re-scan for repeated meals (e.g. daily breakfast)

### Scan Photo Storage
- Capture dish photo thumbnail during scan and persist it
- Hybrid storage: IndexedDB (offline, ~20KB thumbnail) + Supabase Storage (cloud, ~150KB full-res)
- New `photoId` field on `LoggedMeal` to link to stored image
- Display: IndexedDB first → Supabase URL fallback → placeholder icon
- Requires Supabase Storage bucket setup (`meal-photos/{userId}/{photoId}.jpg`)

---

## Priority: Medium (UX Improvements)

### Smart Portion Size Selection
- **Current**: Describe meal flow shows 3 fixed portion options (e.g., "small handful with grams")
- **Improvement**: Expand to 4-5 more granular options with better intelligence
- **Goal**: More flexible and accurate portion estimation
- **Context**: Users need finer control over portion sizes when describing meals via text

### ~~Upload Photo Mode for Scan~~ ✅ SHIPPED
- ~~**Current**: Scan tab only supports live camera capture~~
- ~~**Improvement**: Add "Upload Photo" option alongside camera mode~~
- ~~**Use case**: Users want to analyze food photos from gallery (screenshots, shared images, etc.)~~
- ~~**Implementation**: File input picker → same analyze-dish API flow~~
- Shipped: 3-way mode toggle (Camera / Describe / Upload), `UploadPhotoView.tsx` component with drop zone + image compression (768px, JPEG 0.7), mock mode support in dev
- New file: `UploadPhotoView.tsx`
- Modified: `ScanView.tsx` (3-way toggle), `useDishScanner.ts` (`analyzeImage()` method)

### Extended Macro Tracking
- **Current**: Tracks only Protein, Carbs, Fats, Calories
- **Improvement**: Add commonly tracked micronutrients
- **Suggested additions**: Calcium, Sodium, Fiber, Sugar, Saturated Fat, Cholesterol
- **UI**: Expandable macro section or dedicated "Nutrition Details" view per meal
- **API**: Update AI prompts to extract additional nutrients from dishes

### Smart Meal Type Auto-Selection
- **Current**: Meal type defaults to "Lunch" regardless of time of day
- **Improvement**: Auto-select meal type based on current time
  - Morning (5am-11am) → Breakfast
  - Midday (11am-3pm) → Lunch
  - Afternoon (3pm-5pm) → Snack
  - Evening (5pm-9pm) → Dinner
  - Night (9pm-5am) → Snack
- **UX**: Still allow manual override, but start with smart default
- **Files**: Update `MealTypeSheet.tsx` and meal logging flows

### ~~Calorie Goal Exceeded Warning~~ ✅ SHIPPED
- ~~**Current**: Shows green "Goal achieved" even when calories exceed target (e.g., 2388/2029 cal)~~
- ~~**Issue**: Misleading positive feedback when user has overeaten~~
- ~~**Fix**:~~
  - ~~Ring color: Green (under goal) → Orange (5-10% over) → Red (>10% over)~~
  - ~~Message: "Daily goal complete!" → "Over goal by X cal" when exceeded~~
  - ~~Visual: Progress ring should show overflow state~~
- Shipped: CalorieRing dynamic color (green ≤100%, amber 100-110%, red >110%), "X kcal over" red text, progress bar turns red, new "slightly over" capy message band (105-130%)
- Modified: `HomeView.tsx` (CalorieRing, calRemaining display), `capyLines.ts` (new SLIGHTLY_OVER band)
- 21 E2E tests in `e2e/calorie-warning.spec.ts` + `e2e/upload-photo.spec.ts`

---

## Priority: Low

### Item Ordering
- Section to order items that are finishing
- Integration with grocery delivery APIs (BigBasket, Blinkit, Zepto)
- Or simple "copy list to clipboard" for manual ordering

### Barcode Scanner
- Scan packaged food barcodes for exact nutrition data
- Use Open Food Facts API or similar
- Complement the AI-based dish scanning

### ~~Goal Setting~~ ✅ SHIPPED (feat/goal-setting-capy)
- ~~Daily calorie/protein targets~~
- ~~Progress tracking against goals~~
- ~~Weekly/monthly trends~~
- See implementation: TDEE calculator, Capy mascot onboarding, GoalDashboard

### Share Daily Log
- Share day's meal log as formatted text/image
- WhatsApp, Instagram Stories format

### Multi-Language Support
- Currently: English UI + Hindi cook messages
- Future: Tamil, Telugu, Bengali, Marathi UI options
- Sarvam AI already supports 11 Indian languages for TTS

### Offline Mode Improvements
- Cache last scan results
- Service worker for offline access
- Sync when back online

### Recipe Favorites
- Save favorite recipes across sessions
- Quick re-access without re-scanning
- "Cook again" button
