# Environment Variables

All keys go in `.env.local` (gitignored). See `.env.example` for template.

---

## Required Keys

### `GEMINI_API_KEY`
- **Purpose**: Primary AI provider for fridge/dish analysis and meal description
- **Get it**: [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
- **Cost**: Usage-priced; Gemini 3.6 Flash is reserved for dish vision and Flash-Lite handles routine requests
- **Models used**: `gemini-3.6-flash` (dish scan), `gemini-3.5-flash-lite` (describe-meal, fridge, habits, health, capy)
- **Used in**: `/api/analyze` (fridge), `/api/analyze-dish` (camera scan), `/api/describe-meal` (text describe), `/api/capy-motivation`

### `GROQ_API_KEY`
- **Purpose**: Fallback AI for fridge/dish analysis, meal description, and Hindi text generation
- **Get it**: [console.groq.com/keys](https://console.groq.com/keys)
- **Cost**: Free tier — 30 RPM, 14,400 RPD
- **Models used**: `qwen/qwen3.6-27b` (vision), `openai/gpt-oss-20b` (text)
- **Used in**: `/api/analyze` (fallback), `/api/analyze-dish` (fallback), `/api/describe-meal` (parallel race fallback), `/api/hindi-message` (Hindi text gen)

### `SARVAM_API_KEY`
- **Purpose**: Hindi text-to-speech (natural Indian voice)
- **Get it**: [dashboard.sarvam.ai](https://dashboard.sarvam.ai)
- **Cost**: ₹15/10K characters. **₹1000 free credits on signup** (~600+ messages free)
- **Model**: Bulbul v3, speaker "kabir" (male North Indian)
- **Used in**: `/api/hindi-tts`

---

## Supabase (Auth + Cloud Sync)

### `NEXT_PUBLIC_SUPABASE_URL`
- **Purpose**: Supabase project URL for auth and database
- **Get it**: [supabase.com/dashboard](https://supabase.com/dashboard) → Settings → API → Project URL
- **Cost**: Free tier — 500MB DB, 50K MAU
- **Prefix**: `NEXT_PUBLIC_` — safe to expose (identifies project only, RLS protects data)
- **Used in**: Browser Supabase client (`src/lib/supabase/client.ts`)

### `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Purpose**: Supabase anonymous (public) API key
- **Get it**: Same dashboard → Settings → API → `anon` `public` key
- **Cost**: Free (included with project)
- **Prefix**: `NEXT_PUBLIC_` — safe to expose (Row Level Security protects data, not this key)
- **Used in**: Browser Supabase client (`src/lib/supabase/client.ts`)

> **Note**: Both Supabase keys are optional. Without them, the app works in guest mode (localStorage only). With them, users can sign in and sync data across devices.

---

## Feature Flags

### `DISABLE_NUTRITION_REF`
- **Purpose**: Kill switch to disable the IFCT/USDA nutrition reference table injection into AI prompts
- **Values**: `"true"` to disable, absent or any other value to keep enabled
- **Default**: Not set (reference table enabled)
- **Effect**: When `"true"`, `buildReferenceTable()` returns an empty string — AI models estimate calories without reference anchoring (pre-improvement behavior)
- **Used in**: `src/lib/nutritionReference.ts` → `buildReferenceTable()`
- **Vercel**: Flip in Dashboard → Settings → Environment Variables → restart. No code redeploy needed.

---

## Rate Limiting (Vercel KV / Upstash Redis)

### `KV_REST_API_URL` / `UPSTASH_REDIS_REST_URL`
- **Purpose**: Persistent rate limiting across deploys
- **Setup**: Vercel Dashboard → Storage → Create KV Store → link to project (auto-provisions `KV_REST_API_*` env vars). Or use Upstash directly with `UPSTASH_REDIS_REST_*` vars.
- **Cost**: Free tier — 10K commands/day
- **Used in**: `src/lib/rateLimit.ts` (shared by all API routes)
- **Note**: Optional. Without this, rate limiting is skipped — all requests allowed.

### `KV_REST_API_TOKEN` / `UPSTASH_REDIS_REST_TOKEN`
- **Purpose**: Auth token for the Redis REST API
- **Setup**: Auto-provisioned when linking Vercel KV store to project
- **Used in**: `src/lib/rateLimit.ts`

> **Rate limit tiers**: Heavy (10 req/60s) — image analysis routes. Medium (20 req/60s) — text analysis routes. Light (30 req/60s) — small generation routes. Uses sliding window algorithm. Supports both Vercel KV and direct Upstash env var names.

---

## Optional

### `OPENAI_API_KEY`
- **Purpose**: Fallback AI for dish vision, meal description, eating analysis, and health verdicts
- **Get it**: [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
- **Cost**: Prepaid credits — $20 loaded = ~10,000+ describe-meal calls with gpt-4.1-nano
- **Models used**: `gpt-4o-mini` (vision), `gpt-4.1-nano` (fast structured text), `gpt-5.6-luna` (balanced fallback with reasoning disabled)
- **Used in**: `/api/analyze-dish`, `/api/describe-meal`, `/api/analyze-habits`, `/api/health-verdict`
- **Note**: Not required — Gemini + Groq handle most calls. OpenAI adds redundancy.

---

## Provider Fallback Chain

### Fridge Analysis (`/api/analyze`)
```
1. Gemini 3.5 Flash-Lite (GEMINI_API_KEY)
   ↓ rate limited?
2. Groq Qwen 3.6 (GROQ_API_KEY)
   ↓ rate limited?
3. Return 429 "All providers rate limited, wait 30s"
```

### Dish Camera Scan (`/api/analyze-dish`)
```
1. Gemini 3.6 Flash (GEMINI_API_KEY) — quality vision model, low thinking
   ↓ rate limited?
2. OpenAI GPT-4o-mini (OPENAI_API_KEY) — vision-capable fallback
   ↓ rate limited?
3. Groq Qwen 3.6 (GROQ_API_KEY) — reasoning disabled
   ↓ rate limited?
4. Return 429
```

### Describe Meal (`/api/describe-meal`)
```
1. Gemini 3.5 Flash-Lite (GEMINI_API_KEY) — low-cost primary
   ↓ rate limited or timeout (6s)?
2. OpenAI gpt-4.1-nano + Groq GPT-OSS 20B — RACED IN PARALLEL
   → First valid response wins (typically Groq at ~2-3s)
   → 6s timeout per provider
   ↓ both fail?
3. Return 429
```

### Hindi Text (`/api/hindi-message`)
```
1. Groq GPT-OSS 20B (GROQ_API_KEY) — only provider, low reasoning
```

### Hindi Audio (`/api/hindi-tts`)
```
1. Sarvam AI Bulbul v3 (SARVAM_API_KEY) — only provider
```

---

## Cost Summary (Monthly Estimates)

| Service | Free Tier | After Free Tier |
|---|---|---|
| Gemini | Provider-dependent free allowance | Pay-as-you-go by model |
| Groq | Provider-dependent free allowance | Pay-as-you-go by model |
| Sarvam AI | ₹1000 free credits (~600 msgs) | ₹15/10K characters |
| Supabase | 500MB DB, 50K MAU free | Pay-as-you-go |
| **Total for typical use** | Depends on provider quotas | Usage-dependent |

Primary calls use lower-cost Flash-Lite; the higher-cost vision model is limited to dish photos.
