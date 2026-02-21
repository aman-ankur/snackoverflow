# Environment Variables

All keys go in `.env.local` (gitignored). See `.env.example` for template.

---

## Required Keys

### `GEMINI_API_KEY`
- **Purpose**: Primary AI provider for fridge image analysis
- **Get it**: [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
- **Cost**: Free tier — 15 RPM, 1M tokens/day for Flash, 30 RPM for Flash Lite
- **Models used**: `gemini-2.0-flash`, `gemini-2.0-flash-lite` (fallback)
- **Used in**: `/api/analyze` (fridge scanner)

### `GROQ_API_KEY`
- **Purpose**: Fallback AI for fridge analysis + Hindi text generation
- **Get it**: [console.groq.com/keys](https://console.groq.com/keys)
- **Cost**: Free tier — 30 RPM, 14,400 RPD
- **Models used**: `meta-llama/llama-4-scout-17b-16e-instruct`
- **Used in**: `/api/analyze` (fallback), `/api/hindi-message` (Hindi text gen)

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

## Optional / Legacy

### `OPENAI_API_KEY`
- **Not currently used** — was previously used for TTS before switching to Sarvam AI
- Can be removed from `.env.local` if present

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
