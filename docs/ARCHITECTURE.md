# Architecture & Tech Stack

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16.1.6 (App Router, Turbopack) |
| **Language** | TypeScript 5 |
| **UI** | React 19.2.3, Tailwind CSS 4, Framer Motion 12 |
| **3D Graphics** | Three.js, React Three Fiber, Drei (lazy-loaded, Capy tab only) |
| **Icons** | Lucide React |
| **AI Vision** | Google Gemini 2.5 Flash (dish scan, eating analysis), Gemini 2.0 Flash-Lite (describe), OpenAI gpt-4.1-nano/mini, Groq Llama 4 Scout (fallbacks) |
| **Hindi Text Gen** | Groq (meta-llama/llama-4-scout-17b-16e-instruct) |
| **Hindi TTS** | Sarvam AI Bulbul v3 (speaker: "kabir", male North Indian) |
| **On-Device Detection** | YOLOv8n via ONNX Runtime Web (WASM) |
| **Auth** | Supabase Auth (email OTP + password) |
| **Database** | Supabase Postgres (JSONB, RLS) |
| **State** | React hooks + localStorage (offline-first) + Supabase (cloud sync with merge) |
| **Fonts** | DM Sans (400–900), JetBrains Mono (via next/font/google) |
| **Dev Tools** | local-ssl-proxy (HTTPS for mobile camera testing) |
| **Deployment** | Vercel |

## Folder Structure

```
snackoverflow/
├── docs/                          # ← You are here. Project documentation
├── certs/                         # SSL certs for local HTTPS proxy
│   ├── local.pem
│   └── local-key.pem
├── public/                        # Static assets + ONNX WASM files (copied by postinstall)
│   └── rootCA.pem
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── analyze/route.ts       # Fridge image analysis (Gemini → Groq)
│   │   │   ├── analyze-dish/route.ts  # Dish nutrition analysis (Gemini → Groq)
│   │   │   ├── describe-meal/route.ts # Text meal description → nutrition (Gemini → OpenAI+Groq parallel)
│   │   │   ├── capy-motivation/route.ts # Capy LLM motivation (Gemini → Groq)
│   │   │   ├── analyze-habits/route.ts  # Eating habits analysis (Gemini → GPT-4.1-mini → Groq)
    │   │   │   ├── health-verdict/route.ts  # AI health verdict (Gemini → Claude → GPT fallback)
    │   │   │   ├── hindi-message/route.ts # Hindi text generation (Groq)
    │   │   │   └── hindi-tts/route.ts     # Hindi audio generation (Sarvam AI)
│   │   ├── globals.css                # Tailwind theme, CSS vars, animations
│   │   ├── layout.tsx                 # Root layout, fonts, metadata
│   │   └── page.tsx                   # Main page — 5-tab router (Home/Progress/Scan/Capy/Profile)
│   ├── components/
│   │   ├── BottomTabBar.tsx           # 5-tab bottom nav (Home/Progress/Scan FAB/Capy/Profile)
│   │   ├── CapyGarden.tsx             # Three.js 3D garden scene (lazy-loaded)
│   │   ├── CalendarProgressView.tsx   # Calendar with Apple Fitness rings (weekly/monthly)
│   │   ├── CapyView.tsx               # Capy's Garden tab (garden stats, 3D canvas, milestones)
│   │   ├── HomeView.tsx               # Home dashboard (Capy, intake ring, meal slots, health badges)
│   │   ├── ScanView.tsx               # Dish scanner view (Camera/Describe toggle, portion adjuster)
│   │   ├── DescribeMealView.tsx       # Text-based meal description UI (AI nutrition from text)
│   │   ├── ProgressView.tsx           # Progress tracking (macros, weekly, history)
│   │   ├── ProfileView.tsx            # Profile & settings (body stats, targets, reset)
│   │   ├── FridgeOverlay.tsx          # Full-screen fridge scanner overlay (from Home CTA)
│   │   ├── FridgeTab.tsx              # Fridge workspace container (YOLO + Cloud AI switcher)
│   │   ├── DishMode.tsx               # Dish scanner orchestrator (+ goal integration)
│   │   ├── NutritionCard.tsx          # Per-dish calorie/macro card
│   │   ├── DailySummary.tsx           # Today's nutrition summary (legacy, replaced by GoalDashboard)
│   │   ├── CapyMascot.tsx             # SVG capybara mascot with 5 moods + animations
│   │   ├── GoalOnboarding.tsx         # 5-step animated onboarding wizard
│   │   ├── GoalDashboard.tsx          # Daily progress card with Capy
│   │   ├── HealthProfileWizard.tsx    # Multi-step health condition wizard (Dr. Capy)
│   │   ├── HealthVerdictCard.tsx      # MealHealthBanner + HealthCheckButton + DishVerdictPill
    │   │   ├── EatingAnalysisCard.tsx    # Trigger card for eating analysis (time-window picker)
    │   │   ├── EatingAnalysisSheet.tsx   # Tabbed bottom sheet report (Summary/Patterns/Health/Actions)
    │   │   ├── MealLog.tsx                # Logged meals list
│   │   ├── MealHistory.tsx            # History + weekly insights
│   │   ├── MealTypeSheet.tsx          # Bottom sheet per meal type (dish list, delete, details)
│   │   ├── MealDetailOverlay.tsx      # Full-screen meal editor (macro chips, health badge, fiber)
│   │   ├── ApiKeyInput.tsx            # (Legacy) API key input field
│   │   ├── CameraView.tsx            # Generic camera view (used by YOLO mode)
│   │   ├── DetectedItems.tsx         # Generic detected items display (YOLO mode)
│   │   ├── DietaryFilter.tsx         # Diet preference pills (Veg/Vegan/Egg/Jain)
│   │   ├── ExpiryTracker.tsx         # Freshness/expiry tracker UI
│   │   ├── GeminiCameraView.tsx      # Camera view for Cloud AI mode (65vh when streaming)
│   │   ├── GeminiDetectedItems.tsx   # Detected items with Hindi names + confidence
│   │   ├── GeminiMode.tsx            # Main Cloud AI mode orchestrator
│   │   ├── GeminiRecipeCard.tsx      # Recipe card with diet badges + share button
│   │   ├── MealPlanner.tsx           # Weekly meal planner (localStorage)
│   │   ├── ModeSwitcher.tsx          # YOLO/Cloud AI toggle
│   │   ├── RecipeCard.tsx            # (Legacy) Recipe card for YOLO mode
│   │   ├── RecipeSuggestions.tsx     # (Legacy) Recipe suggestions for YOLO mode
│   │   ├── ShareRecipe.tsx           # "Send to Cook" dropdown (Hindi audio/text + English)
│   │   ├── ShoppingList.tsx          # Auto-generated shopping list from recipes
│   │   ├── YoloCameraView.tsx        # Camera view for YOLO mode
│   │   └── YoloMode.tsx              # YOLO on-device mode orchestrator
│   └── lib/
│       ├── dishTypes.ts              # Shared domain types (incl. UserProfile, NutritionGoals, StreakData)
│       ├── tdeeCalculator.ts         # TDEE/BMR/macro calculation (Mifflin-St Jeor) (NEW)
│       ├── capyBehaviors.ts           # Capybara FSM: states, transitions, animation helpers
│       ├── capyLines.ts              # Motivational line picker + mood logic
│       ├── capyMotivation.ts         # 60+ contextual motivation lines + LLM fallback
│       ├── healthRating.ts           # Evidence-based meal health classification
│       ├── useGardenState.ts         # Garden state hook (2-track: streak + calorie goal days)
│       ├── useUserGoals.ts           # Goal setting + streak hook (localStorage)
│       ├── recipes.ts                # Static recipe database (YOLO mode fallback)
│       ├── useDetection.ts           # (Legacy) Generic detection hook
│       ├── useDescribeMeal.ts        # Text meal description hook (API + portion state)
│       ├── useDishScanner.ts         # Dish camera + analysis hook
│       ├── useEatingAnalysis.ts       # Eating habits analysis hook (generate + cache + sync)
    │       ├── mealAggregator.ts         # Client-side meal pre-aggregation for AI cost reduction
    │       ├── useHealthProfile.ts       # Health profile hook (localStorage + Supabase sync)
    │       ├── useHealthVerdict.ts       # AI health verdict hook (on-demand fetch + abort)
│       ├── healthConditions.ts       # Conditions registry (15 conditions, gender/age filtering)
│       ├── healthContextBuilder.ts   # Deterministic lab rules + AI prompt context builder
│       ├── useExpiryTracker.ts       # Expiry tracker hook (localStorage)
│       ├── useGeminiVision.ts        # Main Cloud AI hook (camera, analysis, state)
│       ├── useMealLog.ts             # Dish meal logging + insights hook
│       ├── useYoloDetection.ts       # YOLO detection hook
│       ├── yoloInference.ts          # ONNX Runtime YOLO inference logic
│       └── yoloLabels.ts             # COCO class labels for YOLO
│       ├── supabase/
│       │   ├── client.ts                # Browser Supabase client (createBrowserClient)
│       │   ├── server.ts                # Server Supabase client (for auth callback)
│       │   └── sync.ts                  # Pull/push + debounced cloud sync
│       │   └── merge.ts                 # Pure merge functions (mergeArrayById, mergeObject, mergeGarden)
│       ├── useAuth.ts                   # Auth hook (email OTP, password, sign out, network resilience)
│       └── debugLog.ts                  # In-memory debug log buffer (on-screen diagnostics, dev mode only)
├── .env.example                      # Template for API keys
├── .env.local                        # Actual API keys (gitignored)
├── next.config.ts                    # Next.js config (reactCompiler: true)
├── package.json                      # Dependencies and scripts
└── tsconfig.json                     # TypeScript config
```

## Data Flow

```
User opens app → layout.tsx wraps with AuthProvider → page.tsx renders BottomTabBar + active view (5 tabs)

Auth Flow:
  Guest mode (default): app works fully with localStorage only, no login required
  Profile tab → AuthScreen → email OTP (6-digit code) or password signup/login
  → Pre-flight ping to Supabase auth API (5s timeout) — catches DNS/network blocks early
  → signInWithOtp wrapped in 12s timeout — prevents infinite spinner on network failures
  → OTP code verified client-side via verifyOtp — no redirect/callback needed
  → User-friendly error messages for network issues ("Try switching from WiFi to mobile data")
  → On-screen debug panel (dev mode only) logs every auth step for mobile diagnostics
  → Supabase Auth → /auth/callback → session established
  → All hooks pull cloud data → merge with local state (by ID/timestamp) → sync merged result back
  → Debounced pushes (800ms) to avoid hammering Supabase, flushed on beforeunload/visibilitychange

Home Tab (HomeView.tsx):
  Capy mascot + personalized greeting ("Good evening, Ankur!") + speech bubble (context-aware from capyLines.ts)
  → userName prop from profile.name (optional, set during onboarding)
  → Daily Intake ring (calorie progress) + macro breakdown
  → Today Meals (4 meal slots: breakfast/lunch/snack/dinner)
    → Tap meal slot → MealTypeSheet (bottom sheet: dish list, macro summary, per-dish delete)
    → Tap "Details" → MealDetailOverlay (full-screen editor):
       Health badge (getMealHealthRating) + colored macro chips (tap to edit)
       + tappable kcal + compact portions + notes + bottom actions (Save/Re-scan/Delete)
  → "Scan Your Fridge" CTA → opens FridgeOverlay

Scan Tab (ScanView.tsx — center FAB):
  First visit → GoalOnboarding (useUserGoals checks localStorage)
  → 5-step wizard (name, body stats, activity, goal, plan with rotary calorie dial)
  → TDEE calculation → save profile (incl. optional name) + goals
  → Camera/Describe toggle at top (pill switcher)
  
  Camera mode:
    Camera → captureFrame() → /api/analyze-dish → Gemini 2.5 Flash/Groq → nutrition JSON
    → Auto-scroll to Plate Total (items list + macro summary)
    → Collapsed view for multi-dish plates ("Show N dishes · Edit quantities")
    → Per-dish: WeightEditor (±10g stepper / direct input → proportional recalc),
      CorrectionChip ("Wrong dish?"), "Describe instead" link, Remove button
    → Portion adjuster (0.5x–2x) + Meal context picker
  
  Describe mode (DescribeMealView.tsx):
    Textarea (200 char limit) + meal type pills → "Analyze with AI"
    → /api/describe-meal → Gemini 2.0 Flash-Lite / OpenAI+Groq parallel race → nutrition JSON
    → Per-dish cards with 3 food-specific portion options (katori/roti count/cup/handful)
    → Portion picker updates macros + plate total in real-time
    → Correction context: if opened from bad camera scan, pre-fills with scanned dish name
  
  Both modes:
    → After results: "AI Health Check" button (on-demand, not auto-triggered)
      → Tap → /api/health-verdict → Gemini 2.5 Flash / Claude 3.5 Haiku / GPT-4.1-mini fallback
      → Result replaces button with expandable MealHealthBanner (Good/Caution/Avoid per dish)
      → If no health profile: muted "Get AI health advice — set up your profile" link → opens wizard
    → Log This Meal → page-level useMealLog.logMeal() (shared state, not internal hook)
    → 1.2s "Logged ✓" → clearAnalysis → auto-navigate to Home tab
    → Home immediately shows fresh data (same mealLog instance)
    → Capy mood + motivational lines based on progress vs goals
  
  MealTypeSheet can open Scan tab directly in Describe mode via initialMode prop

Health Personalization (HealthProfileWizard.tsx):
  Profile tab or scan prompt → HealthProfileWizard (multi-step Dr. Capy wizard)
  → Step 1: Condition selector — 15 conditions with inline "Me"/"Family" pills
    → Conditions filtered by gender + age from UserProfile
    → Family pill only shown where hasFamilyHistory is true
    → Status: "active" | "family_history" | "both" (can select both simultaneously)
  → Step 2: Lab values (optional, for conditions with lab fields)
  → Step 3: Allergies + diet preference
  → Step 4: Free-text notes
  → Step 5: Review summary
  → Save → useHealthProfile (localStorage + Supabase sync)
  → healthContextBuilder.ts builds deterministic AI prompt string
  → "both" status generates ELEVATED RISK note in prompt

Progress Tab (ProgressView.tsx):
  CalendarProgressView (top) — weekly row with Apple Fitness rings (expandable to month)
  → Rings per day: calories (green), protein (orange), carbs (blue)
  → Tap day → bottom sheet with full macro breakdown
  → Total progress bar (% of calorie goal)
  → Nutrition + Average stat cards
  → Today's Macros (protein/carbs/fat bars)
  → Weekly Calories chart
  → **Eating Habits Analysis** (EatingAnalysisCard):
    → Time-window picker (Today / 7d / 14d / 30d)
    → "Analyze My Eating" button → triggers pipeline:
      1. Client-side: mealAggregator.ts computes compact summary (~400 tokens)
      2. Cache check: if same window + no new meals → show cached report
      3. API call: POST /api/analyze-habits with aggregate + health context
      4. Provider chain: Gemini 2.5 Flash → gpt-4.1-mini → Groq Llama 4 Scout
      5. Response stored in localStorage + Supabase (last 10 analyses)
    → Opens EatingAnalysisSheet (tabbed bottom sheet):
      Tab 1 — Summary: score badge, trend pills, comparison card
      Tab 2 — Patterns: 5-7 AI-selected insight cards (temporal, macro, variety, goal)
      Tab 3 — Health: condition-specific notes (hidden if no health profile)
      Tab 4 — Actions: prioritized action items with Indian food swaps
    → Cached report shown with "Generated Xh ago" badge + Refresh button
  → Meal History with insights

Capy Tab (CapyView.tsx — lazy-loaded with next/dynamic, ssr: false):
  Garden stats bar (flowers, tree level, butterflies, streak)
  → Your Journey roadmap (8-milestone horizontal strip with check marks + "Next" hint)
  → Expandable "How does this work?" (explains streak + calorie goal tracks)
  → Three.js Canvas (CapyGarden.tsx — 55vh, frameloop pauses when inactive)
     → 3D capybara (GLB model) with full behavior FSM (capyBehaviors.ts):
       States: idle, wander, eat, splash, chase_butterfly, tapped, dance
       Tap reactions (random per tap): squash, wiggle, nuzzle, look-at-camera
       Dance on double-tap, waddle animation during movement
     → PlantInPot balanced on capybara's head (terracotta pot + growing plant)
     → BabyCapy: up to 3 babies (7+ calorie goal days), same FSM, follow main capy
     → Ground island (plain green surface, color lerps with garden health)
     → Flowers (spiral pattern, count = calorie goal days hit, max 30)
     → Trees (level 0→1 at 3d streak, →2 at 14d, →3 at 30d)
     → HotSpring (streak ≥30), CozyHome (15+ goal days), Butterflies (streak ≥5)
     → Rainbow (14+ day streak, visual bonus with Forest milestone)
     → Sparkles, FallingLeaves, DynamicSkyDome (time-of-day lighting)
     → Particle effects: hearts (tap), sparkles (dance), nibble (eat), splash
  → Garden Health + Talk to Capy (side-by-side cards)
  → Preview Garden Stages (8 demo presets that swap 3D scene)
  → Next Unlock card ("Log meals X more days in a row" or "Hit calorie goal X more days")
  → Garden Journal (last 5 events with timestamps)
  State: useGardenState() — 2 inputs: streak.currentStreak + daysGoalHit → localStorage
  8 milestones, 2 tracks:
    Streak (disappear on break): 🌱 Sapling (3d), 🦋 Butterfly (5d), 🌲 Forest (14d), ♨️ Hot Spring (30d)
    Goal (permanent): 🌸 Flower (3 goals), 🐾 Baby Capy (7), 🏡 Home (15), 🌻 Full Garden (30)
  Motivation: 60+ pre-built lines (capyMotivation.ts) → LLM fallback (/api/capy-motivation)

Profile Tab (ProfileView.tsx):
  Capy avatar + app branding
  → Auth section: sign-in CTA (when logged out) or email + sign-out (when logged in)
  → Cloud sync status badge (green "Synced to cloud" or grey "Data stored locally")
  → Body Stats card (gender, age, height, weight, activity, goal)
  → Daily Targets card (calories, protein, carbs, fat, TDEE)
  → Re-run Goal Setup / Reset All Data actions

Fridge Overlay (FridgeOverlay.tsx — from Home CTA):
  ModeSwitcher (YOLO or Cloud AI) → fridge scanner flows

Cloud AI Mode (GeminiMode.tsx):
  Camera → captureFrame() → /api/analyze → Gemini/Groq → JSON response
  → items displayed in GeminiDetectedItems
  → items auto-added to ExpiryTracker (useExpiryTracker)
  → recipes displayed as GeminiRecipeCard (with ShareRecipe button)
  → missing ingredients shown in ShoppingList
  → recipes available in MealPlanner

Send to Cook flow:
  ShareRecipe → /api/hindi-message (Groq) → Hindi text
  → /api/hindi-tts (Sarvam AI) → MP3 audio
  → Web Share API → WhatsApp

YOLO Mode (YoloMode.tsx):
  Camera → ONNX Runtime (YOLOv8n WASM) → bounding boxes on canvas
  → items matched to static recipe database (recipes.ts)
```

## Two Detection Modes

| | Cloud AI (Gemini/Groq) | YOLO On-Device |
|---|---|---|
| **Accuracy** | High — identifies Indian groceries specifically | Limited — 80 COCO classes only |
| **Speed** | 2-6s per analysis | Real-time (5-15 FPS) |
| **Cost** | Free tier API keys | Free (runs on device) |
| **Recipes** | AI-generated, context-aware | Static database matching |
| **Offline** | No | Yes |
| **Primary use** | Main mode — what users should use | Experimental/demo |
