# Architecture & Tech Stack

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16.1.6 (App Router, Turbopack) |
| **Language** | TypeScript 5 |
| **UI** | React 19.2.3, Tailwind CSS 4, Framer Motion 12 |
| **3D Graphics** | Three.js, React Three Fiber, Drei (lazy-loaded, Capy tab only) |
| **Icons** | Lucide React |
| **AI Vision** | Google Gemini 2.0 Flash (primary), Groq Llama 4 Scout (fallback) |
| **Hindi Text Gen** | Groq (meta-llama/llama-4-scout-17b-16e-instruct) |
| **Hindi TTS** | Sarvam AI Bulbul v3 (speaker: "kabir", male North Indian) |
| **On-Device Detection** | YOLOv8n via ONNX Runtime Web (WASM) |
| **State** | React hooks + localStorage (no database) |
| **Fonts** | DM Sans (400–900), JetBrains Mono (via next/font/google) |
| **Dev Tools** | local-ssl-proxy (HTTPS for mobile camera testing) |
| **Deployment** | Vercel |

## Folder Structure

```
fridgenius/
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
│   │   │   ├── capy-motivation/route.ts # Capy LLM motivation (Gemini → Groq)
│   │   │   ├── hindi-message/route.ts # Hindi text generation (Groq)
│   │   │   └── hindi-tts/route.ts     # Hindi audio generation (Sarvam AI)
│   │   ├── globals.css                # Tailwind theme, CSS vars, animations
│   │   ├── layout.tsx                 # Root layout, fonts, metadata
│   │   └── page.tsx                   # Main page — 5-tab router (Home/Progress/Scan/Capy/Profile)
│   ├── components/
│   │   ├── BottomTabBar.tsx           # 5-tab bottom nav (Home/Progress/Scan FAB/Capy/Profile)
│   │   ├── CapyGarden.tsx             # Three.js 3D garden scene (lazy-loaded)
│   │   ├── CapyView.tsx               # Capy's Garden tab (garden stats, 3D canvas, motivation)
│   │   ├── HomeView.tsx               # Home dashboard (Capy, intake ring, meal slots, health badges)
│   │   ├── ScanView.tsx               # Dish scanner view (camera, meal context, portion adjuster)
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
│   │   ├── MealLog.tsx                # Logged meals list
│   │   ├── MealHistory.tsx            # History + weekly insights
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
│       ├── capyLines.ts              # Motivational line picker + mood logic
│       ├── capyMotivation.ts         # 60+ contextual motivation lines + LLM fallback
│       ├── healthRating.ts           # Evidence-based meal health classification
│       ├── useGardenState.ts         # Garden state hook (flowers, trees, pond, streak-based)
│       ├── useUserGoals.ts           # Goal setting + streak hook (localStorage)
│       ├── recipes.ts                # Static recipe database (YOLO mode fallback)
│       ├── useDetection.ts           # (Legacy) Generic detection hook
│       ├── useDishScanner.ts         # Dish camera + analysis hook
│       ├── useExpiryTracker.ts       # Expiry tracker hook (localStorage)
│       ├── useGeminiVision.ts        # Main Cloud AI hook (camera, analysis, state)
│       ├── useMealLog.ts             # Dish meal logging + insights hook
│       ├── useYoloDetection.ts       # YOLO detection hook
│       ├── yoloInference.ts          # ONNX Runtime YOLO inference logic
│       └── yoloLabels.ts             # COCO class labels for YOLO
├── .env.example                      # Template for API keys
├── .env.local                        # Actual API keys (gitignored)
├── next.config.ts                    # Next.js config (reactCompiler: true)
├── package.json                      # Dependencies and scripts
└── tsconfig.json                     # TypeScript config
```

## Data Flow

```
User opens app → page.tsx renders BottomTabBar + active view (5 tabs)

Home Tab (HomeView.tsx):
  Capy mascot + greeting + speech bubble (context-aware from capyLines.ts)
  → Daily Intake ring (calorie progress) + macro breakdown
  → Today Meals (4 meal slots: breakfast/lunch/snack/dinner)
  → "Scan Your Fridge" CTA → opens FridgeOverlay

Scan Tab (ScanView.tsx — center FAB):
  First visit → GoalOnboarding (useUserGoals checks localStorage)
  → 5-step wizard → TDEE calculation → save profile + goals
  Camera → captureFrame() → /api/analyze-dish → Gemini/Groq → nutrition JSON
  → Auto-scroll to Plate Total (items list + macro summary)
  → Collapsed view for multi-dish plates ("Show N dishes · Edit quantities")
  → Per-dish: WeightEditor (±10g stepper / direct input → proportional recalc),
    CorrectionChip ("Wrong dish?"), Remove button
  → Portion adjuster (0.5x–2x) + Meal context picker
  → Log This Meal → page-level useMealLog.logMeal() (shared state, not internal hook)
  → 1.2s "Logged ✓" → clearAnalysis → auto-navigate to Home tab
  → Home immediately shows fresh data (same mealLog instance)
  → Capy mood + motivational lines based on progress vs goals

Progress Tab (ProgressView.tsx):
  Total progress bar (% of calorie goal)
  → Nutrition + Average stat cards
  → Today's Macros (protein/carbs/fat bars)
  → Weekly Calories chart
  → Meal History with insights

Capy Tab (CapyView.tsx — lazy-loaded with next/dynamic, ssr: false):
  Garden stats bar (flowers, tree level, butterflies, streak)
  → Three.js Canvas (CapyGarden.tsx — 55vh, frameloop pauses when inactive)
     → 3D capybara with sprout, idle breathing, tap-to-bounce
     → Ground island (grass color lerps with garden health)
     → Flowers (spiral pattern, count = days goal hit, max 30)
     → Trees (1-2, level 0-4 based on protein goals)
     → Pond (appears at 7-day streak, fish at 21 days)
     → Butterflies (flutter paths, count based on streak)
     → Rainbow (14+ day streak), Crown (30+ day streak)
     → Sparkles (golden when healthy, grey when wilting)
     → Falling leaves (when garden health < 30)
     → SkyDome (canvas gradient, no external assets)
  → Motivation speech bubble overlay (tap Capy or "Talk to Capy")
  → "Talk to Capy" button → getContextualMotivation()
  → Next Unlock progress card (butterfly → pond → rainbow → crown)
  → Achievements grid (8 milestones, greyed when locked)
  → Garden Journal (last 5 events with timestamps)
  → Garden Health bar (0-100%, color-coded)
  State: useGardenState() computes from meals + streak + goals → localStorage
  Motivation: 60+ pre-built lines (capyMotivation.ts) → LLM fallback (/api/capy-motivation)

Profile Tab (ProfileView.tsx):
  Capy avatar + app branding
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
