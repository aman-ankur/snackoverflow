# Environment Variables

All keys go in `.env.local` (gitignored). See `.env.example` for template.

---

## Required Keys

### `GEMINI_API_KEY`
- **Purpose**: Primary AI provider for fridge/dish analysis and meal description
- **Get it**: [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
- **Cost**: Free tier — 10 RPM for 2.5 Flash, 15 RPM for 2.0 Flash-Lite, 5 RPM for 2.0 Flash
- **Models used**: `gemini-2.5-flash` (dish scan), `gemini-2.0-flash-lite` (describe-meal, capy), `gemini-2.0-flash` (fridge scan)
- **Used in**: `/api/analyze` (fridge), `/api/analyze-dish` (camera scan), `/api/describe-meal` (text describe), `/api/capy-motivation`

### `GROQ_API_KEY`
- **Purpose**: Fallback AI for fridge/dish analysis, meal description, and Hindi text generation
- **Get it**: [console.groq.com/keys](https://console.groq.com/keys)
- **Cost**: Free tier — 30 RPM, 14,400 RPD
- **Models used**: `meta-llama/llama-4-scout-17b-16e-instruct`
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

## Optional

### `OPENAI_API_KEY`
- **Purpose**: Fallback AI for text-based meal description (parallel race with Groq)
- **Get it**: [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
- **Cost**: Prepaid credits — $20 loaded = ~10,000+ describe-meal calls with gpt-4.1-nano
- **Models used**: `gpt-4.1-nano` (fastest OpenAI model for structured JSON)
- **Used in**: `/api/describe-meal` (parallel race fallback with Groq)
- **Note**: Not required — Gemini + Groq handle most calls. OpenAI adds redundancy.

---

## Provider Fallback Chain

### Fridge Analysis (`/api/analyze`)
```
1. Gemini 2.0 Flash (GEMINI_API_KEY)
   ↓ rate limited?
2. Gemini 2.0 Flash Lite (GEMINI_API_KEY)
   ↓ rate limited?
3. Groq Llama 4 Scout (GROQ_API_KEY)
   ↓ rate limited?
4. Return 429 "All providers rate limited, wait 30s"
```

### Dish Camera Scan (`/api/analyze-dish`)
```
1. Gemini 2.5 Flash (GEMINI_API_KEY) — most accurate for vision
   ↓ rate limited?
2. Gemini 2.0 Flash (GEMINI_API_KEY)
   ↓ rate limited?
3. OpenAI GPT-4o-mini (OPENAI_API_KEY) — vision-capable fallback
   ↓ rate limited?
4. Groq Llama 4 Scout (GROQ_API_KEY)
   ↓ rate limited?
5. Return 429
```

### Describe Meal (`/api/describe-meal`)
```
1. Gemini 2.0 Flash-Lite (GEMINI_API_KEY) — 15 RPM, separate quota from dish scan
   ↓ rate limited or timeout (6s)?
2. OpenAI gpt-4.1-nano + Groq Llama 4 Scout — RACED IN PARALLEL
   → First valid response wins (typically Groq at ~2-3s)
   → 6s timeout per provider
   ↓ both fail?
3. Return 429
```

### Hindi Text (`/api/hindi-message`)
```
1. Groq Llama 4 Scout (GROQ_API_KEY) — only provider
```

### Hindi Audio (`/api/hindi-tts`)
```
1. Sarvam AI Bulbul v3 (SARVAM_API_KEY) — only provider
```

---

## Cost Summary (Monthly Estimates)

| Service | Free Tier | After Free Tier |
|---|---|---|
| Gemini | 1M tokens/day free | $0.075/M input tokens |
| Groq | 14,400 requests/day free | Pay-as-you-go |
| Sarvam AI | ₹1000 free credits (~600 msgs) | ₹15/10K characters |
| Supabase | 500MB DB, 50K MAU free | Pay-as-you-go |
| **Total for typical use** | **₹0/month** | **< ₹100/month** |

For personal/household use, free tiers are more than sufficient.
