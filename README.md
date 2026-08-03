<div align="center">

<img src="public/model/capy-logo.gif" width="160" alt="SnackOverflow Capy" />

# SnackOverflow

**AI-Powered Nutrition Tracking for Indian Food** 🐾

Scan meals, track macros, get personalized health insights, and grow a 3D garden — all guided by your capybara companion.

[![Next.js 16](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://typescriptlang.org)
[![React 19](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![Three.js](https://img.shields.io/badge/Three.js-3D_Garden-green?logo=three.js)](https://threejs.org)
[![Supabase](https://img.shields.io/badge/Supabase-Auth_&_DB-3ECF8E?logo=supabase)](https://supabase.com)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)](https://vercel.com)

[Live Demo](#) · [Features](#hero-features) · [Quick Start](#quick-start) · [Documentation](#documentation)

</div>

---

## What is SnackOverflow?

SnackOverflow is a mobile-first nutrition tracking app designed specifically for **Indian food** with AI that understands dal, roti, biryani, thali plates, and street food. Built with Next.js 16, React 19, and powered by multi-provider AI (Gemini, OpenAI, Claude, Groq), it offers:

- 📸 **Camera dish scanning** with per-dish nutrition breakdown
- 💬 **Natural language meal entry** (Hindi-English mix supported)
- 🏥 **Health-aware verdicts** for 15 medical conditions
- 🧠 **AI eating habits analysis** with actionable insights
- 🌿 **Gamified 3D garden** that grows with your consistency
- 🧊 **Fridge scanner** + Indian recipe suggestions + Hindi voice for cooks
- 🐾 **Capy mascot** with 60+ context-aware motivational messages

**Offline-first** — works fully without login. Optional cloud sync via Supabase.

---

## Hero Features

### 📸 Scan Any Dish — Instant Nutrition

Point your camera at a plate and get **per-dish** calorie, protein, carbs, fat, and fiber breakdown in 3-4 seconds.

**Multi-dish thali support** — Each item analyzed separately with:
- Portion adjustment (0.5×, 1×, 1.5×, 2×)
- Weight editing with proportional macro scaling
- Alternative dish suggestions for ambiguous items (iced tea vs coffee, oats chilla vs besan chilla)
- Confidence levels (Confident/Likely/Unsure)
- Health tags (high-protein, fiber-rich, etc.)

**Works with:** Dal, roti, biryani, thali plates, street food, packaged snacks, restaurant meals.

**AI:** Gemini 3.6 Flash → OpenAI gpt-4o-mini → Groq Qwen 3.6 (tiered fallback)

---

### 💬 Describe Your Meal in Words

No camera? Type what you ate in natural language — **Hindi-English mix works**.

**Examples:**
- "2 paratha with curd and achaar"
- "rajma chawal with raita, 1 papad, nimbu pani"
- "half croissant and large coffee"

**Returns:** Structured nutrition with **3 culturally relevant portion options** per dish:
- Curries: Small katori / Regular katori / Large bowl
- Bread: 1 roti / 2 rotis / 3 rotis
- Drinks: Small cup / Regular cup / Tall glass

**Fractional quantity support** — "half croissant", "quarter pizza", "1.5 roti" parsed correctly.

**AI:** Gemini 3.5 Flash-Lite → OpenAI gpt-4.1-nano + Groq GPT-OSS 20B parallel race

---

### 🧠 AI Eating Habits Analysis

Select a time window (**Today** / **7 Days** / **14 Days** / **30 Days**) and get an AI-generated report analyzing your eating patterns.

**Detects hidden habits:**
- Weekend calorie spikes
- Breakfast skipping impact
- Protein clustering at dinner
- Snack calorie creep
- Fried food frequency
- Diet monotony

**Structured report:**
- Overall score (Great / Good / Needs Work / Concerning)
- Macro trends (Improving / Stable / Declining)
- 5-7 actionable insights categorized by severity
- Health notes cross-referenced to your conditions
- 3-5 priority action items with Indian food swaps

**Cost-optimized:** Client-side pre-aggregation reduces AI input from ~4000 tokens to ~400 tokens (10× savings).

**Smart caching:** No re-generation if no new meals logged since last report.

**AI:** Gemini 3.5 Flash-Lite → OpenAI GPT-5.6 Luna → Groq GPT-OSS 20B

---

### 🏥 Health-Aware Nutrition

Set up your health profile with:
- **15 conditions** (Diabetes, Hypertension, High Cholesterol, PCOS, Thyroid, Heart Disease, Kidney Disease, Gout, IBS, Lactose Intolerance, Celiac, Iron/Vitamin D Deficiency, Pregnancy, Menopause)
- **Family history tracking** for genetic risk conditions
- **Optional lab values** (HbA1c, BP, cholesterol) with date tracking
- **Stale lab warnings** (>180 days)

**On-demand AI health verdict** for every meal:
- **Per-dish verdict** (Good / Caution / Avoid)
- Condition-specific reasoning ("High sodium risky for your hypertension")
- **Healthier swap suggestions** (paneer → grilled paneer, white rice → brown rice)
- Medical disclaimer included

**Eating analysis integration:** Reports connect patterns to your conditions (e.g., "High sodium intake — watch for hypertension flare-ups").

**AI:** Gemini 3.5 Flash-Lite → Claude Haiku 4.5 → OpenAI GPT-5.6 Luna

---

### 🧊 Fridge Scanner + Recipe Engine

1. **Photograph your fridge** → AI identifies all ingredients (with Hindi names)
2. **Get 5 Indian recipes** using what you have
3. **"Send to Cook"** via WhatsApp:
   - 🎤 **Hindi audio message** (Sarvam AI Bulbul v3 TTS)
   - 💬 **Hindi text message** (casual tone: "भैया, आज 2 लोगों के लिए पनीर मटर बना दीजिए")
   - 📱 English text, Read Aloud, Copy, Share

**Auto-freshness tracking** with expiry dates (color-coded: Fresh / Expiring / Expired).

**Dietary filters:** Veg, Vegan, Eggetarian, Jain (no onion/garlic/root veg).

**AI:** Gemini 3.5 Flash-Lite → Groq Qwen 3.6

---

### 🌿 Capy's Garden — Gamified Habit Building

A **3D interactive garden** (Three.js + React Three Fiber) that grows when you log meals and hit calorie goals.

**8 milestones across 2 tracks:**

**Streak Track** (disappear on break — motivates daily logging):
- 🌱 Sapling (3-day streak)
- 🦋 Butterflies (5 days)
- 🌲 Forest + 🌈 Rainbow (14 days)
- ♨️ Hot Spring (30 days)

**Goal Track** (permanent — rewards nutrition quality):
- 🌸 First Flower (3 goal days)
- 🐾 Baby Capy (7 days)
- 🏡 Cozy Home (15 days)
- 🌻 Full Garden + 👑 Crown (30 days)

**Goal day** = eating within 80-120% of daily calorie target.

**Garden health score** (0-100%) based on streak + goal day bonuses. **Wilts when streak breaks.**

**Animations:** Flower bloom, butterfly flutter, capy breathing, steam particles.

**Lazy-loaded** — doesn't block initial page load.

---

### 🐾 Capy — Your Nutrition Companion

A **mood-reactive capybara mascot** with:
- **3 PNG mood variants** (happy, motivated, default)
- **Lottie animation** (fat capy logo on Home greeting)
- **60+ context-aware messages** based on:
  - Your name (if provided)
  - Time of day
  - Calorie intake (on-track / over / under)
  - Streak status
  - Meal logging frequency

**Personality:** Warm, supportive, never judgmental. Celebrates wins, gently nudges on struggles.

---

## All Features

| Category | What It Does |
|----------|-------------|
| **Dish Scanner** | Camera → per-dish nutrition. Multi-dish thali support, portion adjuster, alternative dish selection, weight/calorie editing with proportional macro scaling |
| **Upload Photo Mode** | Analyze food photos from gallery (same pipeline as camera) |
| **Describe Meal** | Natural language → structured nutrition. Hindi-English mix. 3 food-specific portion options per dish, fractional quantity support |
| **Eating Analysis** | AI report for any time window. Score + trends + 5-7 insights + health notes + action items. Client-side pre-aggregation for minimal cost (~400 tokens vs ~4000) |
| **Health Profile** | 15 conditions + lab values + family history. Gender/age-filtered. Stale lab warnings |
| **AI Health Verdict** | On-demand per-dish verdict (Good/Caution/Avoid) with condition-specific reasoning and swap suggestions |
| **Goal Setting** | 5-step onboarding. TDEE calculator (Mifflin-St Jeor). 7 India-specific goals (Lose 2-3kg, Maintain, Build Muscle, etc.). Editable calorie/macro targets |
| **Fridge Scanner** | AI ingredient detection → 5 Indian recipes → Send to Cook (Hindi audio + text via WhatsApp) |
| **Freshness Tracker** | Auto-estimated expiry dates. Color-coded (Fresh / Expiring / Expired) |
| **Meal Logging** | 4 meal slots (Breakfast/Lunch/Snack/Dinner). Per-dish editing. Health rating badges (Healthy/Balanced/Moderate/Heavy) |
| **Progress Tracking** | Apple Fitness-style calendar rings. Weekly calorie trend chart. Macro bars. Meal history accordion. Top dishes by frequency |
| **Capy's Garden** | 3D Three.js scene with 8 milestones, 2 tracks. Garden health score. Preview stages feature |
| **Streak System** | Consecutive days logged. Drives garden growth + Capy mood |
| **Dietary Filters** | Veg, Vegan, Eggetarian, Jain (no onion/garlic/root veg) |
| **Shopping List** | Auto-generated from missing recipe ingredients |
| **Meal Planner** | Weekly grid. Assign recipes to days |
| **Cloud Sync** | Optional Supabase auth. Works fully offline with localStorage. Sign in to sync across devices |
| **Pull-to-Refresh** | Custom touch-gesture PTR on all tabs (native PTR disabled) |
| **Auth Network Resilience** | Pre-flight connectivity check (5s ping) + OTP timeout (12s) + user-friendly DNS block errors. Debug overlay (dev mode) for mobile diagnostics |
| **Rate Limiting** | Upstash Redis-based rate limiting on all API routes (10-15 req/min per IP) |
| **Input Validation** | Server-side validation (base64 images, string lengths, array sizes) prevents injection attacks |
| **Mock Scan Mode** | `?mock=scan` for UI testing without camera/API (auto-switches to Scan tab, simulates 3 Indian dishes) |

---

## AI Architecture

**Multi-provider fallback strategy** — No single point of failure. 95%+ of calls use free tiers.

### Model Versions by Feature

| Feature | Primary (Tier 1) | Fallback 1 (Tier 2) | Fallback 2 (Tier 3) |
|---------|------------------|---------------------|---------------------|
| **Dish Scan** | Gemini 3.6 Flash (15s) | OpenAI gpt-4o-mini (10s) | Groq Qwen 3.6 (5s) |
| **Describe Meal** | Gemini 3.5 Flash-Lite (6s) | OpenAI gpt-4.1-nano + Groq GPT-OSS 20B (parallel race, 6s each) | — |
| **Eating Analysis** | Gemini 3.5 Flash-Lite (15s) | OpenAI GPT-5.6 Luna (15s) | Groq GPT-OSS 20B (15s) |
| **Health Verdict** | Gemini 3.5 Flash-Lite (8s) | Claude Haiku 4.5 (8s) | OpenAI GPT-5.6 Luna (8s) |
| **Fridge Scan** | Gemini 3.5 Flash-Lite (10s) | Groq Qwen 3.6 (10s) | — |
| **Hindi Text** | Groq GPT-OSS 20B | — | — |
| **Hindi Audio** | Sarvam AI Bulbul v3 | — | — |
| **Capy Motivation** | Gemini 3.5 Flash-Lite | Groq GPT-OSS 20B | — |

### Exact Model IDs

- **Gemini 3.6 Flash**: `gemini-3.6-flash`
- **Gemini 3.5 Flash-Lite**: `gemini-3.5-flash-lite`
- **OpenAI gpt-4o-mini**: `gpt-4o-mini`
- **OpenAI GPT-5.6 Luna**: `gpt-5.6-luna`
- **OpenAI gpt-4.1-nano**: `gpt-4.1-nano`
- **Claude Haiku 4.5**: `claude-haiku-4-5-20251001`
- **Groq Qwen 3.6**: `qwen/qwen3.6-27b` (vision fallback)
- **Groq GPT-OSS 20B**: `openai/gpt-oss-20b` (low-cost text fallback)

### Cost Controls

1. **Image compression**: 768px @ 0.7 JPEG for dish scan (~60-80KB), 512px @ 0.6 for fridge scan (~40-60KB)
2. **Client-side pre-aggregation**: Eating analysis input reduced from ~4000 tokens to ~400 tokens (10× savings)
3. **In-memory caches**:
   - Dish scan: 2 min TTL, 50 entries
   - Describe meal: 5 min TTL, 100 entries
4. **Smart report caching**: Eating analysis reports cached per time window; no re-generation if no new meals logged
5. **Tiered timeouts**: Quality-first fallback (15s Gemini → 10s OpenAI → 5s Groq for dish scan)
6. **IFCT 2017 + USDA reference table injection**: Indian food calorie accuracy improves by ~30% (current: 9% MAPE on core meals)

**Estimated cost for personal daily use: ₹0/month** (all primary providers have generous free tiers)

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Framework** | Next.js (App Router, Turbopack) | 16.1.6 |
| **Language** | TypeScript, React | 5.x, 19.2 |
| **Styling** | Tailwind CSS (Sage & Cream theme) | 4.x |
| **3D Graphics** | Three.js, React Three Fiber, Drei | 0.183, 9.5, 10.7 |
| **Animations** | Framer Motion, Lottie | 12.34, 2.4 |
| **AI Vision** | Google Gemini, OpenAI, Anthropic Claude, Groq | Latest |
| **Hindi TTS** | Sarvam AI Bulbul v3 | — |
| **Auth & DB** | Supabase (Postgres JSONB + RLS) | 2.97 |
| **State** | React hooks + localStorage (offline) + Supabase (cloud sync) | — |
| **Icons** | Lucide React (tree-shakeable) | 0.575 |
| **Rate Limiting** | Upstash Redis + Ratelimit | 1.36, 2.0 |
| **On-Device ML** | YOLOv8n via ONNX Runtime Web (WASM) | 1.24 |
| **Testing** | Playwright E2E + calorie accuracy benchmarks | 1.58 |
| **Deploy** | Vercel | — |

### Package Sizes

| Package | Gzipped | Purpose |
|---------|---------|---------|
| `framer-motion` | ~87 KB | UI transitions, layout animations |
| `lottie-react` | ~30 KB | Mascot animations |
| `three` + `@react-three/fiber` + `drei` | ~150 KB | 3D garden (lazy-loaded) |
| `onnxruntime-web` | ~2 MB | YOLO mode (lazy-loaded, WASM) |

**Initial bundle (before lazy loading):** ~280 KB

---

## Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/aman-ankur/snackoverflow.git
cd snackoverflow
npm install
```

### 2. Environment Variables

Create `.env.local`:

```bash
cp .env.example .env.local
```

Fill in the following:

| Variable | Purpose | Get it | Required |
|----------|---------|--------|----------|
| `GEMINI_API_KEY` | Primary AI (scans, analysis, verdicts) | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) | ✅ Yes |
| `GROQ_API_KEY` | Fallback AI + Hindi text | [console.groq.com/keys](https://console.groq.com/keys) | ✅ Yes |
| `OPENAI_API_KEY` | Fallback for describe meal + eating analysis | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) | ✅ Yes |
| `SARVAM_API_KEY` | Hindi text-to-speech | [dashboard.sarvam.ai](https://dashboard.sarvam.ai) | ✅ Yes |
| `ANTHROPIC_API_KEY` | Health verdict fallback | [console.anthropic.com](https://console.anthropic.com) | ⚠️ Optional |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | [supabase.com/dashboard](https://supabase.com/dashboard) | ⚠️ For cloud sync |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | Same dashboard → Settings → API | ⚠️ For cloud sync |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis URL | [console.upstash.com](https://console.upstash.com) | ⚠️ For rate limiting |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis token | Same Upstash console | ⚠️ For rate limiting |

**All have generous free tiers — ₹0/month for personal use.**

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 4. Mobile Testing (HTTPS required for camera)

```bash
npx local-ssl-proxy --source 3443 --target 3000 \
  --cert certs/local.pem --key certs/local-key.pem
```

Open `https://<your-local-ip>:3443` on your phone.

---

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── analyze/           # Fridge scanner AI
│   │   ├── analyze-dish/      # Dish scanner AI
│   │   ├── analyze-habits/    # Eating habits analysis AI
│   │   ├── describe-meal/     # Text → nutrition AI
│   │   ├── health-verdict/    # Health-aware dish verdict AI
│   │   ├── hindi-message/     # Hindi text generation
│   │   ├── hindi-tts/         # Hindi audio generation
│   │   └── capy-motivation/   # Context-aware motivational lines
│   ├── auth/callback/         # Supabase password signup callback
│   ├── page.tsx               # Main app shell (5-tab router)
│   ├── layout.tsx             # Root layout + fonts (DM Sans, JetBrains Mono)
│   └── globals.css            # Tailwind theme (Sage & Cream) + custom animations
├── components/                # 52 React components
│   ├── HomeView.tsx           # Dashboard — intake ring, meals, Capy greeting
│   ├── ScanView.tsx           # Dish scanner — camera/describe/upload toggle
│   ├── ProgressView.tsx       # Weekly trends, calendar rings, eating analysis
│   ├── CapyView.tsx           # 3D garden, milestones, journal
│   ├── ProfileView.tsx        # Body stats, targets, health profile, auth
│   ├── CapyGarden.tsx         # Three.js 3D scene (flowers, trees, capybaras)
│   ├── EatingAnalysisCard.tsx # Analysis trigger (time-window picker)
│   ├── EatingAnalysisSheet.tsx# Tabbed report (Summary/Patterns/Health/Actions)
│   ├── HealthProfileWizard.tsx# Multi-step health condition setup
│   ├── HealthVerdictCard.tsx  # Per-dish health verdict display
│   ├── CapyLottie.tsx         # Reusable Lottie animation wrapper
│   └── ...                    # 41+ more components
├── lib/                       # 34 TypeScript utilities + custom hooks
│   ├── mealAggregator.ts      # Client-side meal pre-aggregation for AI
│   ├── useEatingAnalysis.ts   # Eating analysis hook (generate + cache)
│   ├── useMealLog.ts          # Meal logging & aggregation
│   ├── useUserGoals.ts        # Goal persistence & streak tracking
│   ├── useHealthProfile.ts    # Health conditions + lab values
│   ├── useGardenState.ts      # Garden state from activity
│   ├── useDishScanner.ts      # Dish scan with caching + correction flow
│   ├── useDescribeMeal.ts     # Text → nutrition with portion selection
│   ├── healthContextBuilder.ts# Deterministic health → AI prompt builder
│   ├── healthConditions.ts    # 15 condition definitions (registry)
│   ├── tdeeCalculator.ts      # TDEE + macro calculation (Mifflin-St Jeor)
│   ├── nutritionReference.ts  # IFCT 2017 + USDA reference table
│   ├── capyBehaviors.ts       # Capybara FSM (states, transitions, animations)
│   ├── capyLines.ts           # 60+ context-aware motivational messages
│   ├── rateLimit.ts           # Upstash Redis rate limiting
│   ├── validateInput.ts       # Server-side input validation
│   ├── debugLog.ts            # In-memory circular buffer for auth debug
│   ├── supabase/              # client.ts, server.ts, sync.ts, merge.ts
│   └── ...
├── public/
│   └── model/                 # 3D models, mascot PNGs, Lottie JSONs, ONNX WASM
├── scripts/                   # Calorie accuracy benchmark scripts
├── e2e/                       # Playwright E2E test seeds
├── docs/                      # 20+ documentation files
└── certs/                     # SSL certs for local HTTPS (mobile camera)
```

---

## Design Philosophy

- **Mobile-first** — Optimized for phone use; camera takes 65vh when streaming
- **Indian food context** — Hindi names, katori portions, IFCT 2017 data, Indian recipes, culturally relevant portions
- **Warm Sage & Cream theme** — Flat, light design with green accent (accessible, warm)
- **Multi-provider AI** — Never depends on one provider; graceful fallbacks with tiered timeouts
- **Offline-first** — Works fully without login via localStorage; optional cloud sync
- **Cost-conscious** — Client-side pre-computation, image compression, smart caching, free tier prioritization
- **Gamification for habit building** — Garden grows with consistency, wilts with neglect (2-track milestone system)
- **Privacy-first** — No tracking, no analytics, data stays local unless you explicitly enable cloud sync
- **Quality-first fallback** — Longer timeouts (15s/10s/5s) prioritize accuracy over speed

---

## Animations & Visual Assets

SnackOverflow uses **5 types** of animations:

| Type | Use Case | Examples | Bundle Impact |
|------|----------|----------|---------------|
| **Static PNG** | Mood variants | 3 capy moods | 15-18 KB each |
| **Lottie JSON** | Looping mascots | Fat capy, cute cat, cute dog | 28-53 KB each |
| **Framer Motion** | UI transitions | Tab switching, overlays, accordions | 87 KB lib |
| **CSS Animations** | Simple loops | Breathing, pulsing, scan lines | 0 KB (native) |
| **Three.js 3D** | Interactive garden | Capybara garden scene | 150 KB (lazy-loaded) |

**See also:**
- [ANIMATIONS-AND-ASSETS-GUIDE.md](./docs/ANIMATIONS-AND-ASSETS-GUIDE.md) — Comprehensive technical guide
- [VISUAL-ASSETS-INVENTORY.md](./docs/VISUAL-ASSETS-INVENTORY.md) — Asset inventory and usage

---

## Testing

### Calorie Accuracy Benchmarks

Measure AI estimation error against ground truth (IFCT 2017 + USDA):

```bash
npm run dev  # Start dev server first

# Core Indian meals (10 dishes)
npx tsx scripts/benchmark-calories.ts

# Edge cases (15 packaged/restaurant items)
npx tsx scripts/benchmark-edge-cases.ts

# Save results for comparison
npx tsx scripts/benchmark-calories.ts --save baseline
```

**Current accuracy:** ~9% MAPE on core Indian meals, ~22% on edge cases.

### Playwright E2E Tests

```bash
npm run dev  # Start dev server
npx playwright test
```

Tests cover: Describe flow, scan flow, calorie editing with proportional macro scaling, alternative dish selection.

**See also:** [TESTING.md](./docs/TESTING.md)

---

## Deploy on Vercel

1. Fork this repo
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your forked repo
4. Add all environment variables from `.env.local`
5. Click **Deploy**

**Deployment notes:**
- Set `maxDuration = 30` on all AI routes (prevents Vercel 504 timeouts)
- Vercel auto-detects Next.js 16 and uses correct build command
- Static assets (Lottie, ONNX WASM) served from `/public`

**See also:** [DEPLOYMENT.md](./docs/DEPLOYMENT.md)

---

## Documentation

Comprehensive docs in [`/docs`](./docs/):

| Doc | Contents |
|-----|----------|
| [ARCHITECTURE.md](./docs/ARCHITECTURE.md) | System design, data flow, component hierarchy |
| [FEATURES.md](./docs/FEATURES.md) | Complete feature list with implementation details (30KB) |
| [API-ROUTES.md](./docs/API-ROUTES.md) | All server endpoints with schemas, provider chains, timeouts |
| [COMPONENTS.md](./docs/COMPONENTS.md) | Every React component with props, state, behavior (31KB) |
| [HOOKS.md](./docs/HOOKS.md) | Custom React hooks with APIs and examples (24KB) |
| [DESIGN-SYSTEM.md](./docs/DESIGN-SYSTEM.md) | Colors, typography, component patterns, animations |
| [ANIMATIONS-AND-ASSETS-GUIDE.md](./docs/ANIMATIONS-AND-ASSETS-GUIDE.md) | How images, Lottie, Framer Motion, CSS, Three.js are used (14KB) |
| [VISUAL-ASSETS-INVENTORY.md](./docs/VISUAL-ASSETS-INVENTORY.md) | Asset inventory, file sizes, loading strategy |
| [ANIMATION-QUICK-START-FOR-FRIENDS.md](./docs/ANIMATION-QUICK-START-FOR-FRIENDS.md) | Beginner guide to animations |
| [ENV-VARS.md](./docs/ENV-VARS.md) | Environment variables, API keys, configuration |
| [DEPLOYMENT.md](./docs/DEPLOYMENT.md) | Vercel + Supabase setup guide |
| [TESTING.md](./docs/TESTING.md) | Calorie benchmarks + Playwright E2E tests |
| [API-LOGGING-GUIDE.md](./docs/API-LOGGING-GUIDE.md) | Debug logging strategy for AI routes |
| [BACKLOG.md](./docs/BACKLOG.md) | Shipped features and future ideas |

---

## Contributing

Contributions welcome! Please:

1. Fork the repo
2. Create a feature branch (`git checkout -b feat/amazing-feature`)
3. Commit with clear messages (`git commit -m 'feat: add amazing feature'`)
4. Push to your branch (`git push origin feat/amazing-feature`)
5. Open a Pull Request

**Development workflow:**
- Always create a branch from `main`
- Update relevant docs in `/docs` when adding features
- Run `npm run build` before merging to verify no build errors
- Follow the Git Workflow section in [CLAUDE.md](./CLAUDE.md)

---

## License

MIT License — see [LICENSE](./LICENSE)

---

## Acknowledgments

- **IFCT 2017** (Indian Food Composition Tables) — Calorie reference data
- **USDA FoodData Central** — International food data
- **Gemini, OpenAI, Claude, Groq** — Multi-provider AI
- **Sarvam AI** — Hindi TTS
- **LottieFiles** — Free animations (fat capy, cute cat, cute dog)
- **Supabase** — Auth + DB with generous free tier
- **Vercel** — Seamless Next.js deployment

---

<div align="center">
  <sub>Built with 🐾 by Capy & Ankur</sub>
  <br />
  <sub>AI-Powered Nutrition Tracking • Made in India 🇮🇳</sub>
</div>
