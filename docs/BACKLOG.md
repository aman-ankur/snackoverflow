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

### ~~UI Redesign — Sage & Cream Theme~~ ✅ SHIPPED
- ~~4-tab navigation (Home / Progress / Scan FAB / Profile) + Fridge Overlay~~
- ~~Warm flat light theme replacing dark theme (bg-card, text-muted, border-border)~~
- ~~HomeView dashboard with Capy mascot, calorie ring, meal slots~~
- ~~ProgressView with macro bars, weekly calories, meal history~~
- ~~ProfileView with body stats, daily targets, reset actions~~
- ~~Capy SVG overhaul with breathing, blinking, tail wag, floating, sleep animations~~
- ~~All 25+ components restyled — zero dark-theme remnants~~
- See [TEST-RESULTS.md](./TEST-RESULTS.md) for E2E verification

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

### Health Categorization
- Categorize detected items as healthy/unhealthy
- Show macros per item (protein, carbs, fat, calories)
- Nutrition data per ingredient
- Color-coded health scores
- Partially addressed by upcoming Dish Scanner feature

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
