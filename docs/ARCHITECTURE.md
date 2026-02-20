# Architecture & Tech Stack

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16.1.6 (App Router, Turbopack) |
| **Language** | TypeScript 5 |
| **UI** | React 19.2.3, Tailwind CSS 4, Framer Motion 12 |
| **Icons** | Lucide React |
| **AI Vision** | Google Gemini 2.0 Flash (primary), Groq Llama 4 Scout (fallback) |
| **Hindi Text Gen** | Groq (meta-llama/llama-4-scout-17b-16e-instruct) |
| **Hindi TTS** | Sarvam AI Bulbul v3 (speaker: "kabir", male North Indian) |
| **On-Device Detection** | YOLOv8n via ONNX Runtime Web (WASM) |
| **State** | React hooks + localStorage (no database) |
| **Fonts** | Geist Sans, Geist Mono (via next/font/google) |
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
│   │   │   ├── hindi-message/route.ts # Hindi text generation (Groq)
│   │   │   └── hindi-tts/route.ts     # Hindi audio generation (Sarvam AI)
│   │   ├── globals.css                # Tailwind theme, CSS vars, animations
│   │   ├── layout.tsx                 # Root layout, fonts, metadata
│   │   └── page.tsx                   # Main page — header, tab switcher, mode rendering
│   ├── components/
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
│       ├── recipes.ts                # Static recipe database (YOLO mode fallback)
│       ├── useDetection.ts           # (Legacy) Generic detection hook
│       ├── useExpiryTracker.ts       # Expiry tracker hook (localStorage)
│       ├── useGeminiVision.ts        # Main Cloud AI hook (camera, analysis, state)
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
User opens app → page.tsx renders header + ModeSwitcher + active mode

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
