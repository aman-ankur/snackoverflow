# CLAUDE.md — SnackOverflow

## Project Overview

AI-powered nutrition tracking app for Indian food. Scan dishes or describe meals in natural language (Hindi-English mix) → get per-dish nutrition (calories, protein, carbs, fat, fiber) with portion adjustment, health verdicts, eating analysis, and a gamified 3D capybara garden.

## Tech Stack

- **Framework:** Next.js 16, App Router, TypeScript (strict), React 19
- **Styling:** Tailwind CSS 4 (@theme inline syntax, Sage & Cream palette)
- **State:** React hooks + localStorage (offline-first) + Supabase (optional cloud sync)
- **AI:** Multi-provider fallback — Gemini 2.5/2.0 Flash (primary), OpenAI gpt-4.1-nano/mini, Groq Llama 4 Scout, Sarvam AI (Hindi TTS), Anthropic Claude (health verdict fallback)
- **On-Device ML:** YOLOv8n via ONNX Runtime Web (WASM) for real-time object detection
- **3D:** Three.js + React Three Fiber + Drei (lazy-loaded capybara garden)
- **Auth:** Supabase (magic link + password)
- **Animations:** Framer Motion 12 + Lottie
- **Deploy:** Vercel | **Package manager:** npm

## File Structure

```
src/app/
  page.tsx                    — Main shell (5-tab client-side router)
  globals.css                 — Tailwind theme (Sage & Cream colors)
  layout.tsx                  — Root layout + DM Sans / JetBrains Mono fonts
  auth/callback/              — Supabase magic link callback
  api/
    analyze/route.ts          — Fridge image → ingredients + 5 Indian recipes
    analyze-dish/route.ts     — Dish photo → per-dish nutrition
    describe-meal/route.ts    — Text → structured nutrition (3 portion options)
    analyze-habits/route.ts   — Meal log → eating analysis report
    health-verdict/route.ts   — Dish + health profile → Good/Caution/Avoid verdict
    hindi-message/route.ts    — Recipe → casual Hindi WhatsApp message
    hindi-tts/route.ts        — Hindi text → MP3 audio (Sarvam Bulbul v3)
    capy-motivation/route.ts  — Context-aware motivational lines
src/components/               — ~48 React components
src/lib/                      — ~30 TypeScript utilities + custom hooks
  supabase/                   — client.ts, server.ts, sync.ts (pull/push), merge.ts (offline→online merge)
  mealAggregator.ts           — Client-side pre-aggregation (~400 vs ~4000 raw tokens)
  tdeeCalculator.ts           — TDEE + BMR (Mifflin-St Jeor formula)
  healthContextBuilder.ts     — Deterministic health → AI prompt builder
  healthRating.ts             — Evidence-based meal health classification
  nutritionReference.ts       — IFCT 2017 + USDA reference table
  capyBehaviors.ts            — Capybara FSM (states, transitions, animations)
  dishTypes.ts                — Shared TypeScript domain types
  yoloInference.ts            — ONNX Runtime YOLO inference
scripts/                      — Calorie accuracy benchmark scripts
e2e/                          — Playwright E2E test seeds
docs/                         — 15+ documentation files
certs/                        — SSL certs for local HTTPS (mobile camera testing)
public/model/                 — 3D models, animations, assets
```

## API Architecture

### POST `/api/analyze-dish` — Dish nutrition scan
**Input:** `{ image: string, mealType: string }` (base64, compressed to 512px JPEG 0.6)
**Output:** Per-dish nutrition + confidence level
**Providers:** Gemini 2.5 Flash → Gemini 2.0 Flash → OpenAI → Groq

### POST `/api/describe-meal` — Text to nutrition
**Input:** `{ description: string, mealType: string }` (Hindi-English mix supported)
**Output:** Structured nutrition with 3 portion options
**Providers:** Gemini 2.0 Flash-Lite → OpenAI + Groq (parallel race)

### POST `/api/analyze-habits` — Eating analysis
**Input:** Meal log + time window + health profile (client pre-aggregated)
**Output:** Score + trends + insights + action items
**Providers:** Gemini 2.5 Flash → OpenAI gpt-4.1-mini → Groq

### POST `/api/health-verdict` — Per-dish health check
**Input:** Dish nutrition + health conditions + lab values
**Output:** Verdict (Good/Caution/Avoid) + swap suggestions
**Providers:** Gemini 2.5 Flash → Claude 3.5 Haiku → GPT-4.1-mini

### POST `/api/analyze` — Fridge scanner
**Input:** `{ image: string, dietaryFilter: string }` (base64)
**Output:** Detected items + 5 Indian recipes
**Providers:** Gemini 2.0 Flash → Gemini 2.0 Flash Lite → Groq

### POST `/api/hindi-message` — Hindi text for WhatsApp
### POST `/api/hindi-tts` — Hindi audio (Sarvam AI)
### POST `/api/capy-motivation` — Motivational lines

## AI Provider Fallback Strategy

| Feature | Primary (Free) | Fallback 1 | Fallback 2 |
|---------|---|---|---|
| Dish Scan | Gemini 2.5 Flash | Gemini 2.0 Flash | Groq Llama 4 Scout |
| Describe Meal | Gemini 2.0 Flash-Lite | OpenAI gpt-4.1-nano | Groq (parallel race) |
| Eating Analysis | Gemini 2.5 Flash | OpenAI gpt-4.1-mini | Groq Llama 4 Scout |
| Health Verdict | Gemini 2.5 Flash | Claude 3.5 Haiku | GPT-4.1-mini |
| Fridge Scan | Gemini 2.0 Flash | Gemini 2.0 Flash-Lite | Groq Llama 4 Scout |
| Hindi TTS | Sarvam AI Bulbul v3 | — | — |

**Cost Controls:** Images downscaled to 512px + JPEG 0.6; client-side pre-aggregation for eating analysis; in-memory caches (2 min dish scan, 5 min / 200 entries describe meal); smart report caching (no re-gen if no new meals); per-provider timeouts (6s scan, 15s analysis). Estimated cost: ₹0/month for daily personal use.

## Component Hierarchy (5-Tab Router)

```
page.tsx (main shell)
├── BottomTabBar (5-tab sticky nav)
├── HomeView (Capy, intake ring, meals, fridge CTA)
├── ScanView (camera/describe toggle, dish editing, logging)
├── ProgressView (weekly trends, calendar rings, eating analysis)
├── CapyView (3D garden, milestones, journal)
├── ProfileView (body stats, targets, health profile, auth)
└── Overlays
    ├── FridgeOverlay, MealTypeSheet, MealDetailOverlay
    ├── GoalOnboarding, HealthProfileWizard, WelcomeTour
    └── EatingAnalysisSheet
```

## Environment Variables (.env.local)

| Variable | Purpose | Required |
|----------|---------|----------|
| `GEMINI_API_KEY` | Primary AI (scans, analysis) | Yes |
| `GROQ_API_KEY` | Fallback AI + Hindi text | Yes |
| `OPENAI_API_KEY` | Fallback for describe meal | Yes |
| `SARVAM_API_KEY` | Hindi TTS | Yes |
| `NEXT_PUBLIC_SUPABASE_URL` | Auth + DB | For cloud sync |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase public key | For cloud sync |
| `ANTHROPIC_API_KEY` | Health verdict fallback | Optional |
| `DISABLE_NUTRITION_REF` | Kill switch for IFCT/USDA table injection | Optional |

## Learnings & Gotchas

### AI & Cost
- All providers have generous free tiers — multi-provider fallback ensures zero cost
- Images MUST be compressed (512px, JPEG 0.6) before sending to AI — saves bandwidth and tokens
- Client-side pre-aggregation reduces eating analysis tokens from ~4000 to ~400
- In-memory caches prevent redundant AI calls on rapid re-scans
- Per-provider timeouts prevent hanging on slow responses

### Calorie Accuracy
- IFCT 2017 + USDA reference table injected into prompts for Indian food accuracy
- Calorie editing uses proportional macro scaling (change calories → macros scale proportionally)
- Benchmark scripts measure Mean Absolute Percentage Error against ground truth
- Current best: ~9% MAPE on core Indian meals, ~22% on edge cases (packaged/restaurant)

### React / Next.js
- **Hydration errors:** Any component reading localStorage must use a `mounted` state guard
- React Compiler enabled (`reactCompiler: true` in next.config.ts) — avoid patterns that break compilation
- Turbopack used for dev builds
- `postinstall` script copies ONNX WASM files to `public/` — required for YOLO mode
- Path alias: `@/*` maps to `src/*`

### Mobile
- Camera requires HTTPS — use local-ssl-proxy with certs in `certs/` for mobile testing
- `npx local-ssl-proxy --source 3443 --target 3000 --cert certs/local.pem --key certs/local-key.pem`

### Supabase
- Offline-first: app works fully with localStorage, cloud sync is optional
- Auth: magic link + password via Supabase
- Sync: pull/push with debouncing in `lib/supabase/sync.ts`; merge functions in `lib/supabase/merge.ts`
- **Merge strategy**: on login, each hook merges local + cloud by ID/timestamp (not "cloud wins"). Array domains use `mergeArrayById`; object domains use `mergeObject`; garden uses `mergeGarden` with `max()` for monotonic counters. No data silently lost during offline→online.
- RLS enabled on all tables
- **Auth on mobile**: Some WiFi networks DNS-block `supabase.co` — auth hangs forever since `fetch` has no timeout. Fixed with pre-flight ping (5s) + OTP timeout (12s) + user-friendly error messages. Debug overlay (dev mode only) logs every auth step for mobile diagnostics via `debugLog.ts`.

## Testing

### Calorie Accuracy Benchmarks
```bash
npx tsx scripts/benchmark-calories.ts           # 10 core Indian meals
npx tsx scripts/benchmark-edge-cases.ts         # 15 packaged/restaurant foods
npx tsx scripts/benchmark-calories.ts --save    # Save results for comparison
```
Measures MAPE against ground truth (IFCT 2017 + USDA). Results saved to `scripts/benchmark-results-*.json`.

### Playwright E2E
```bash
npm run dev                                      # Start dev server first
npx playwright test                              # Run E2E tests
```
- Mock seeds in `e2e/mock-seed.ts`
- Tests: Describe flow, Scan flow, calorie editing with proportional macro scaling
- Config: Chromium only, single worker, traces on retry

### General
- Always verify with `npm run build` before merging to main
- React Strict Mode causes double effects in dev — normal, doesn't happen in prod

## Design System

**Theme:** Sage & Cream (warm, light, accessible)

| Token | Value | Usage |
|-------|-------|-------|
| Background | `#F5F2EB` | Warm cream base |
| Foreground | `#0D0D0D` | Warm charcoal text |
| Accent | `#5AAC5A` | Sage green — primary actions |
| Secondary | `#F08C42` | Warm amber — recipes, tips |
| Card | `#FFFFFF` | White with subtle hover |
| Border | `#DDD8CC` | Warm taupe |
| Muted | `#4A4540` | Secondary text |

**Typography:** DM Sans (400-900) + JetBrains Mono (via next/font/google)

**Component Patterns:**
- Cards: `rounded-2xl bg-card border border-border`
- Primary buttons: `rounded-full bg-accent px-6 py-2.5 text-white`
- Staggered animations: `delay: index * 0.08`

## Git Workflow

- `main` is protected — always deployable (auto-deploys to Vercel)
- Feature branches: `feat/<name>`, `fix/<name>`, `refactor/<name>`, `improve/<name>`
- Merge only after `npm run build` passes
- **For every new bug fix or feature request:**
  1. Always create a new branch from `main` first (`git checkout -b feat/<name>` or `fix/<name>`)
  2. Make all code changes on the branch
  3. Update any relevant existing docs in `docs/` (FEATURES.md, HOOKS.md, TESTING.md, etc.) or create new ones if needed — this ensures full context is available in the next chat session
  4. Commit, push, and create a PR/MR before merging to `main`

## Commands

```bash
npm run dev       # Dev server (localhost:3000, Turbopack)
npm run build     # Production build
npm run start     # Start production server
npm run lint      # ESLint (Next.js core web vitals + TypeScript)
```

## Key Rules

- Never hardcode API keys — use env vars
- All AI routes must implement multi-provider fallback
- Compress images client-side before upload (512px, JPEG 0.6)
- Offline-first: localStorage is the source of truth, cloud sync is optional
- Keep bundle small — 3D garden is lazy-loaded, ONNX WASM loaded on demand
- Indian food focus: Hindi names, culturally relevant portions, IFCT 2017 reference data
- Backlog tracked in `docs/BACKLOG.md`
- Documentation lives in `docs/` (15+ files covering architecture, features, API routes, components, hooks, design system, deployment, testing)
