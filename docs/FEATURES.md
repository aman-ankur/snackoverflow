# Current Features

## 1. Bottom Navigation (4-Tab + Fridge Overlay)
- Fixed bottom tab bar with four tabs + center FAB:
  - 🏠 **Home** — dashboard with Capy mascot, daily intake ring, meal slots, fridge scan CTA
  - 📊 **Progress** — nutrition tracking, macro bars, weekly calories, meal history
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
- Per-dish nutrition card: calories, protein, carbs, fat, fiber
- Portion adjuster: `0.5x`, `1x`, `1.5x`, `2x` (client-side scaling)
- Health tags: high-protein, high-carb, high-fat, low/high-calorie, fiber-rich
- "Log This Meal" flow with meal type picker (Breakfast/Lunch/Snack/Dinner)
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
- Persisted in localStorage (`fridgenius-expiry-tracker`)
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
- Persisted in localStorage (`fridgenius-meal-plan`)
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
- Dish analysis: Gemini 2.0 Flash → Gemini 2.0 Flash Lite → Groq Llama 4 Scout
- If all rate-limited, shows friendly "wait 30s" message and stops auto-scan
- Hindi text: Groq only (free, fast)
- Hindi TTS: Sarvam AI only (native Hindi voice)

## 12. Cost Controls
- Image downscaling to max width 512px and JPEG compression before AI requests
- Dish scan endpoint includes short-lived in-memory cache for repeated near-identical scans
- Manual-scan-only dish mode avoids uncontrolled background token usage

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
- **Persistence** — localStorage (`fridgenius-user-goals-v1`): UserProfile, NutritionGoals, StreakData
- Auto-shows onboarding on first visit; skip uses sensible defaults (2000 kcal)
