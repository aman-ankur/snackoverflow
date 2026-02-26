<div align="center">

<img src="public/model/capy-logo.gif" width="160" alt="SnackOverflow Capy" />

# SnackOverflow

**Your Nutrition Co-Pilot — powered by AI & a capybara** 🐾

Scan meals, track macros, get health-aware eating reports, and grow a 3D garden — all guided by your capybara companion.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://typescriptlang.org)
[![Three.js](https://img.shields.io/badge/Three.js-3D_Garden-green?logo=three.js)](https://threejs.org)
[![Supabase](https://img.shields.io/badge/Supabase-Auth_&_DB-3ECF8E?logo=supabase)](https://supabase.com)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)](https://vercel.com)

</div>

---

## Hero Features

### 📸 Scan Any Dish — Instant Nutrition
Point your camera at a plate and get per-dish calorie, protein, carbs, fat, and fiber breakdown in seconds. Works with Indian food out of the box — dal, roti, biryani, thali plates, street food, everything.

### 💬 Describe Your Meal in Words
Don't have a camera? Type what you ate in natural language — Hindi-English mix works ("2 paratha with curd and achaar"). AI returns structured nutrition with 3 culturally relevant portion options per dish (katori, roti count, cup size).

### 🧠 AI Eating Habits Analysis
Select a time window (Today / 7 Days / 14 Days / 30 Days) and get an AI-generated report on your eating patterns. Detects hidden habits you don't notice — weekend calorie spikes, breakfast skipping, protein clustering at dinner, snack calorie creep, fried food frequency, diet monotony. Cross-references your health conditions for personalized notes.

### 🏥 Health-Aware Nutrition
Set up your health profile (diabetes, hypertension, cholesterol, PCOS, thyroid, 15 conditions total) with optional lab values. Every scan gets an on-demand AI health verdict — "Good / Caution / Avoid" per dish with swap suggestions. Eating analysis reports connect patterns to your conditions.

### 🧊 Fridge Scanner + Recipe Engine
Photograph your fridge → AI identifies all ingredients (with Hindi names) → generates 5 Indian recipes using what you have → "Send to Cook" via WhatsApp with Hindi audio message. Auto-tracks freshness with expiry alerts.

### 🌿 Capy's Garden — Gamified Habit Building
A 3D interactive garden that grows when you log meals and hit calorie goals. 8 milestones across two tracks — streak-based (disappear if you stop) and goal-based (permanent). Flowers bloom, trees grow, butterflies appear, baby capybaras join, a cozy home builds, and a hot spring unlocks at 30-day streaks.

### 🐾 Capy — Your Nutrition Companion
A mood-reactive capybara mascot with 60+ context-aware motivational lines. Knows your name, your progress, your streak, and the time of day. Animated with Lottie across every page.

---

## All Features

| Category | What It Does |
|----------|-------------|
| **Dish Scanner** | Camera → per-dish nutrition (calories, protein, carbs, fat, fiber). Portion adjuster (0.5x–2x), weight editor, multi-dish plate support |
| **Describe Meal** | Natural language → structured nutrition. Hindi-English mix. 3 food-specific portion options per dish |
| **Eating Analysis** | AI report for any time window. Score + trends + 5-7 insights + health notes + action items. Client-side pre-aggregation for minimal cost |
| **Health Profile** | 15 conditions (diabetes, BP, cholesterol, PCOS, etc.) + lab values + family history. Gender/age-filtered |
| **AI Health Verdict** | On-demand per-dish verdict (Good/Caution/Avoid) with swap suggestions. Condition-aware |
| **Goal Setting** | 5-step onboarding. TDEE calculator (Mifflin-St Jeor). 7 India-specific goals. Editable calorie/macro targets |
| **Fridge Scanner** | AI ingredient detection → 5 Indian recipes → Send to Cook (Hindi audio via Sarvam AI) |
| **Freshness Tracker** | Auto-estimated expiry dates. Color-coded: Fresh / Expiring / Expired |
| **Meal Logging** | 4 meal slots (Breakfast/Lunch/Snack/Dinner). Per-dish editing. Health rating badges |
| **Progress Tracking** | Apple Fitness-style calendar rings. Weekly calorie chart. Macro bars. Meal history |
| **Capy's Garden** | 3D Three.js scene. 8 milestones, 2 tracks. Garden health score. Wilts on neglect |
| **Streak System** | Consecutive days logged. Drives garden growth + Capy mood |
| **Dietary Filters** | Veg, Vegan, Eggetarian, Jain (no onion/garlic/root veg) |
| **Shopping List** | Auto-generated from missing recipe ingredients |
| **Meal Planner** | Weekly grid. Assign recipes to days |
| **Cloud Sync** | Optional Supabase auth. Works fully offline with localStorage. Sign in to sync across devices |

---

## AI Architecture

SnackOverflow uses a **multi-provider fallback strategy** — no single point of failure, and 95%+ of calls are free.

| Feature | Primary (Free) | Fallback 1 | Fallback 2 |
|---------|---------------|------------|------------|
| **Dish Scan** | Gemini 2.5 Flash | Gemini 2.0 Flash | Groq Llama 4 Scout |
| **Describe Meal** | Gemini 2.0 Flash-Lite | OpenAI gpt-4.1-nano | Groq (parallel race) |
| **Eating Analysis** | Gemini 2.5 Flash | OpenAI gpt-4.1-mini | Groq Llama 4 Scout |
| **Health Verdict** | Gemini 2.5 Flash | Claude 3.5 Haiku | GPT-4.1-mini |
| **Fridge Scan** | Gemini 2.0 Flash | Gemini 2.0 Flash-Lite | Groq Llama 4 Scout |
| **Hindi Text** | Groq Llama 4 Scout | — | — |
| **Hindi Audio** | Sarvam AI Bulbul v3 | — | — |
| **Capy Motivation** | Gemini 2.0 Flash-Lite | Groq Llama 3.1 8B | — |

### Cost Controls
- Images downscaled to 512px + JPEG 0.6 before AI calls
- Eating analysis uses client-side pre-aggregation (~400 tokens vs ~4000 raw)
- In-memory caches on dish scan (2 min) and describe meal (5 min, 200 entries)
- Smart report caching — no re-generation if no new meals logged
- Per-provider timeouts (6s scan, 15s analysis) prevent slow providers from blocking

**Estimated cost for daily personal use: ₹0/month** (all primary providers have generous free tiers)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16.1.6 (App Router, Turbopack) |
| **Language** | TypeScript 5, React 19.2 |
| **Styling** | Tailwind CSS 4 (Sage & Cream theme) |
| **3D Graphics** | Three.js, React Three Fiber, Drei |
| **Animations** | Framer Motion 12, Lottie (`lottie-react`) |
| **AI Vision** | Google Gemini 2.5/2.0 Flash, OpenAI gpt-4.1-nano/mini, Groq Llama 4 |
| **Hindi TTS** | Sarvam AI Bulbul v3 |
| **Auth & DB** | Supabase (Postgres JSONB + RLS + email OTP auth) |
| **State** | React hooks + localStorage (offline) + Supabase (cloud sync) |
| **Icons** | Lucide React |
| **Deploy** | Vercel |

---

## Quick Start

```bash
git clone https://github.com/aman-ankur/snackoverflow.git
cd snackoverflow
npm install

cp .env.example .env.local
# Edit .env.local with your API keys (see below)

npm run dev
# → http://localhost:3000
```

### Mobile Testing (HTTPS required for camera)

```bash
npx local-ssl-proxy --source 3443 --target 3000 \
  --cert certs/local.pem --key certs/local-key.pem
# → https://<your-local-ip>:3443
```

---

## Environment Variables

Create `.env.local`:

| Variable | Purpose | Get it |
|----------|---------|--------|
| `GEMINI_API_KEY` | Primary AI (scans, analysis, verdicts) | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) |
| `GROQ_API_KEY` | Fallback AI + Hindi text | [console.groq.com/keys](https://console.groq.com/keys) |
| `OPENAI_API_KEY` | Fallback for describe meal + eating analysis | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) |
| `SARVAM_API_KEY` | Hindi text-to-speech | [dashboard.sarvam.ai](https://dashboard.sarvam.ai) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | [supabase.com/dashboard](https://supabase.com/dashboard) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | Same dashboard → Settings → API |

All have generous free tiers — **₹0/month for personal use**.

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
│   │   └── capy-motivation/   # LLM motivation lines
│   ├── auth/callback/         # Supabase password signup confirmation callback
│   └── page.tsx               # Main app shell (5-tab router)
├── components/
│   ├── HomeView.tsx           # Dashboard — intake ring, meals, Capy greeting
│   ├── ScanView.tsx           # Dish scanner — camera + describe toggle
│   ├── ProgressView.tsx       # Weekly trends, calendar rings, eating analysis
│   ├── ProfileView.tsx        # Body stats, targets, health profile, auth
│   ├── CapyView.tsx           # 3D garden, milestones, journal
│   ├── CapyGarden.tsx         # Three.js scene (flowers, trees, capybaras)
│   ├── EatingAnalysisCard.tsx # Analysis trigger (time-window picker)
│   ├── EatingAnalysisSheet.tsx# Tabbed report (Summary/Patterns/Health/Actions)
│   ├── HealthProfileWizard.tsx# Multi-step health condition setup
│   ├── HealthVerdictCard.tsx  # Per-dish health verdict display
│   └── ...                    # 25+ more components
├── lib/
│   ├── mealAggregator.ts     # Client-side meal pre-aggregation for AI
│   ├── useEatingAnalysis.ts   # Eating analysis hook (generate + cache)
│   ├── useMealLog.ts          # Meal logging & aggregation
│   ├── useUserGoals.ts        # Goal persistence & streak tracking
│   ├── useHealthProfile.ts    # Health conditions + lab values
│   ├── useGardenState.ts      # Garden state from activity
│   ├── healthContextBuilder.ts# Deterministic health → AI prompt builder
│   ├── tdeeCalculator.ts      # TDEE + macro calculation
│   ├── supabase/              # Client, server, sync utilities
│   └── ...
└── public/model/              # 3D models, mascot PNGs, Lottie JSONs
```

---

## Design Philosophy

- **Mobile-first** — designed for phone use; camera takes 65vh when streaming
- **Indian food context** — Hindi names, katori portions, Indian recipes, Hindi voice for cook
- **Warm Sage & Cream theme** — flat, light design with green accent throughout
- **Multi-provider AI** — never depends on one provider; graceful fallbacks
- **Offline-first** — works fully without login via localStorage; optional cloud sync
- **Cost-conscious** — client-side pre-computation, image compression, smart caching
- **Gamification for habit building** — garden grows with consistency, wilts with neglect

---

## Deploy on Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import `aman-ankur/snackoverflow` from GitHub
3. Add the 6 environment variables (4 AI keys + 2 Supabase keys)
4. Click Deploy

---

## Documentation

Detailed docs in [`/docs`](./docs/):

| Doc | Contents |
|-----|----------|
| [Architecture](./docs/ARCHITECTURE.md) | Tech stack, folder structure, data flow diagrams |
| [Features](./docs/FEATURES.md) | Complete feature list with implementation details |
| [API Routes](./docs/API-ROUTES.md) | All server endpoints with input/output schemas |
| [Components](./docs/COMPONENTS.md) | Every React component with props and behavior |
| [Hooks](./docs/HOOKS.md) | Custom React hooks with state and methods |
| [Design System](./docs/DESIGN-SYSTEM.md) | Colors, typography, spacing |
| [Environment Variables](./docs/ENV-VARS.md) | API keys and configuration |
| [Deployment](./docs/DEPLOYMENT.md) | Vercel + Supabase setup guide |
| [Backlog](./docs/BACKLOG.md) | Shipped features and future ideas |

---

## License

MIT

---

<div align="center">
  <sub>Made with 🐾 by Capy & Ankur</sub>
</div>
