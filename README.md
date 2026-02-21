<div align="center">

<img src="public/model/capy-logo.gif" width="160" alt="SnackOverflow Capy" />

# SnackOverflow

**Your Smart Kitchen Assistant — powered by AI & a capybara** 🐾

Track meals, scan your fridge, hit nutrition goals, and grow a virtual garden — all with your friendly Capy mascot cheering you on.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://typescriptlang.org)
[![Three.js](https://img.shields.io/badge/Three.js-3D_Garden-green?logo=three.js)](https://threejs.org)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)](https://vercel.com)

</div>

---

## What is SnackOverflow?

SnackOverflow is a **mobile-first meal tracker and nutrition assistant** built for Indian households. It combines AI-powered food scanning with goal tracking, a gamified garden, and a lovable capybara mascot.

<div align="center">

| <img src="public/model/capy-happy.png" width="80" /> | <img src="public/model/capy-default.png" width="80" /> | <img src="public/model/capy-motivated.png" width="80" /> |
|:---:|:---:|:---:|
| Happy Capy | Orange Capy | Motivated Capy |

</div>

## Features

### 🍽️ Meal Tracking
- **Scan any dish** — point your camera, get instant calorie & macro breakdown
- **Log meals** by type (Breakfast, Lunch, Snack, Dinner)
- **Daily intake dashboard** — calories, protein, carbs, fat with progress rings
- **Meal history** — weekly trends, repeated dish patterns, per-meal health ratings
- **Portion editing** — adjust weight per dish, macros recalculate live

### 🧊 Fridge Scanner
- **AI identifies ingredients** from your fridge photo (with Hindi names)
- **5 Indian recipe suggestions** using what you have
- **Send to Cook** — Hindi audio (Sarvam AI) or text via WhatsApp
- **Freshness tracker** — auto-estimated expiry dates, color-coded alerts
- **Shopping list** — auto-generated from missing recipe ingredients
- **Dietary filters** — Veg, Vegan, Eggetarian, Jain

### 🎯 Goal Setting & Nutrition
- **5-step onboarding** — gender, age, height, weight, activity, goal
- **TDEE calculator** — Mifflin-St Jeor with India-specific goals (Lose 2-3kg to Lean Bulk)
- **Personalized targets** — calories, protein, carbs, fat (editable)
- **Streak tracking** — consecutive days with logged meals

### 🌿 Capy's Garden (Gamification)
- **3D interactive garden** — grows as you track meals and hit goals
- **8 achievement milestones**: First Flower → Sapling → Rainbow → Forest → Baby Capy → Cozy Home → Hot Spring → Full Garden
- **Living elements**: flowers, trees, butterflies, pond with fish, rainbow, sparkles
- **Garden health** — wilts if you stop logging, blooms when consistent
- **Motivational Capy** — 60+ context-aware lines + LLM fallback

### 🐾 Capy Mascot
- **Kawaii capybara** images with mood variants (happy, motivated, concerned)
- **Lottie animations** — animated capy, cat, and dog companions across pages
- **Mood-reactive** — changes based on your nutrition progress

## Tech Stack

| Layer | Tech |
|-------|------|
| **Framework** | Next.js 16 (App Router, Turbopack) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS (Sage & Cream theme) |
| **3D** | Three.js, React Three Fiber, Drei |
| **Animations** | Framer Motion, Lottie (`lottie-react`) |
| **AI — Vision** | Gemini 2.0 Flash → Gemini Flash Lite → Groq Llama 4 Scout |
| **AI — Hindi TTS** | Sarvam AI Bulbul v3 |
| **AI — Hindi Text** | Groq Llama 4 Scout |
| **Auth** | Supabase Auth (email magic link + password) |
| **Database** | Supabase Postgres (JSONB + RLS) |
| **Storage** | localStorage (cache) + Supabase (cloud sync) |
| **Deploy** | Vercel |

## Quick Start

```bash
# Clone
git clone https://github.com/aman-ankur/snackoverflow.git
cd snackoverflow

# Install
npm install

# Add API keys
cp .env.example .env.local
# Edit .env.local with your keys (see below)

# Run
npm run dev
# → http://localhost:3000
```

### Mobile Testing (HTTPS required for camera)

```bash
npx local-ssl-proxy --source 3443 --target 3000 \
  --cert certs/local.pem --key certs/local-key.pem
# → https://<your-local-ip>:3443
```

## Environment Variables

Create `.env.local` with these keys:

| Variable | Purpose | Get it |
|----------|---------|--------|
| `GEMINI_API_KEY` | Primary AI (fridge + dish analysis) | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) |
| `GROQ_API_KEY` | Fallback AI + Hindi text | [console.groq.com/keys](https://console.groq.com/keys) |
| `SARVAM_API_KEY` | Hindi text-to-speech | [dashboard.sarvam.ai](https://dashboard.sarvam.ai) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | [supabase.com/dashboard](https://supabase.com/dashboard) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon (public) key | Same dashboard → Settings → API |

All have generous free tiers — **₹0/month for personal use**.

## Project Structure

```
src/
├── app/                    # Next.js App Router pages & API routes
│   ├── api/
│   │   ├── analyze/        # Fridge scanner AI endpoint
│   │   ├── analyze-dish/   # Dish scanner AI endpoint
│   │   ├── hindi-message/  # Hindi text generation
│   │   ├── hindi-tts/      # Hindi audio generation
│   │   └── capy-motivation/# LLM motivation lines
│   ├── auth/callback/      # Supabase magic link callback
│   └── page.tsx            # Main app shell
├── components/
│   ├── HomeView.tsx        # Dashboard — intake ring, meals, Capy greeting
│   ├── ScanView.tsx        # Dish scanner — camera, nutrition, logging
│   ├── ProgressView.tsx    # Weekly trends, macros, meal history
│   ├── ProfileView.tsx     # Body stats, daily targets, settings
│   ├── CapyView.tsx        # Garden tab — 3D scene, achievements, journal
│   ├── CapyGarden.tsx      # Three.js garden (flowers, trees, pond, rainbow)
│   ├── CapyMascot.tsx      # Kawaii PNG mascot with mood variants
│   ├── CapyLottie.tsx      # Lottie animation player (capy, cat, dog)
│   ├── GoalOnboarding.tsx  # 5-step goal setup wizard
│   ├── GoalDashboard.tsx   # Daily progress with Capy speech bubble
│   ├── AuthProvider.tsx    # Auth context provider (wraps app)
│   ├── AuthScreen.tsx      # Email magic link + password login UI
│   └── ...                 # 15+ more components
├── lib/
│   ├── useMealLog.ts       # Meal logging & daily/weekly aggregation
│   ├── useUserGoals.ts     # Goal persistence & streak tracking (+ Supabase sync)
│   ├── useGardenState.ts   # Garden state computation from activity (+ Supabase sync)
│   ├── useAuth.ts          # Supabase auth hook
│   ├── supabase/           # Supabase client, server, sync utilities
│   ├── tdeeCalculator.ts   # TDEE + macro calculation
│   ├── capyLines.ts        # Capy mood & greeting logic
│   └── ...
└── public/model/           # 3D models, mascot PNGs, Lottie JSONs
```

## Design Decisions

- **Mobile-first** — designed for phone use, camera takes 65vh when streaming
- **Warm Sage & Cream theme** — flat, light design with green accent
- **Indian food focus** — recipes, Hindi names, Hindi voice for cook communication
- **Multi-provider AI** — Gemini primary → Groq fallback, never depends on one provider
- **Optional auth** — app works fully without login; sign in to sync across devices via Supabase
- **Gamification** — garden grows with consistency, wilts with neglect

## Deploy on Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import `aman-ankur/snackoverflow` from GitHub
3. Add the 5 environment variables (3 AI keys + 2 Supabase keys)
4. Click Deploy

## Documentation

Detailed docs in [`/docs`](./docs/):
- [Architecture](./docs/ARCHITECTURE.md)
- [Components](./docs/COMPONENTS.md)
- [Features](./docs/FEATURES.md)
- [API Routes](./docs/API-ROUTES.md)
- [Environment Variables](./docs/ENV-VARS.md)
- [Backlog](./docs/BACKLOG.md)

## License

MIT

---

<div align="center">
  <sub>Made with 🐾 by Capy</sub>
</div>
