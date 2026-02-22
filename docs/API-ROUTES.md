# API Routes

All routes are Next.js App Router API routes in `src/app/api/`.

---

## POST `/api/analyze`

**Purpose**: Analyze a fridge image to identify food items and suggest recipes.

**File**: `src/app/api/analyze/route.ts`

**Input**:
```json
{
  "image": "data:image/jpeg;base64,...",
  "dietaryFilter": "all" | "vegetarian" | "vegan" | "eggetarian" | "jain"
}
```

**Output**:
```json
{
  "items": [
    { "name": "Tomato", "hindi": "टमाटर", "quantity": "4", "confidence": "high" }
  ],
  "recipes": [
    {
      "name": "Aloo Gobi",
      "hindi": "आलू गोभी",
      "time": "30 min",
      "difficulty": "Easy",
      "description": "Classic dry curry...",
      "ingredients_used": ["Potato", "Cauliflower"],
      "ingredients_needed": ["Cumin seeds"],
      "steps": ["Heat oil...", "Add onions..."],
      "tags": ["vegetarian", "north-indian"],
      "diet": "vegetarian"
    }
  ],
  "tip": "A short cooking tip"
}
```

**Provider chain**: Gemini 2.0 Flash → Gemini 2.0 Flash Lite → Groq Llama 4 Scout  
**Rate limit handling**: Returns 429 with friendly message if all providers exhausted  
**Image preprocessing**: Base64 stripped of data URL prefix, sent as inline data to Gemini or as image_url to Groq  
**Prompt**: `buildSystemPrompt(dietaryFilter)` — requests exactly 5 Indian lunch/dinner recipes, respects dietary constraints

---

## POST `/api/analyze-dish`

**Purpose**: Analyze a plated meal (single dish or thali) and return nutrition estimates.

**File**: `src/app/api/analyze-dish/route.ts`

**Input**:
```json
{
  "image": "data:image/jpeg;base64,...",
  "mealType": "lunch"
}
```

**Output**:
```json
{
  "dishes": [
    {
      "name": "Paneer Butter Masala",
      "hindi": "पनीर बटर मसाला",
      "portion": "1 katori (~200g)",
      "calories": 380,
      "protein_g": 18,
      "carbs_g": 12,
      "fat_g": 28,
      "fiber_g": 2,
      "ingredients": ["Paneer", "Butter", "Cream", "Tomato", "Cashew"],
      "confidence": "medium",
      "tags": ["high-fat", "high-protein"],
      "healthTip": "High in fat due to butter/cream. Pair with roti instead of naan."
    }
  ],
  "totalCalories": 380,
  "totalProtein": 18,
  "totalCarbs": 12,
  "totalFat": 28,
  "totalFiber": 2
}
```

**Provider chain**: Gemini 2.5 Flash → Gemini 2.0 Flash → Groq Llama 4 Maverick/Scout  
**Safety/normalization**: Strict JSON parsing + numeric normalization + confidence/tag fallback defaults  
**Cost control**: 2-minute in-memory response cache for repeated near-identical dish scans  
**Rate limit handling**: Returns 429 with friendly message when providers are exhausted  
**Prompt improvements**: 6-step chain-of-thought (visual description → veg/non-veg check → dish ID → weight estimation → nutrition calc → JSON output). Weight estimation includes per-piece counting for small items (chips ≈ 3-5g each, nuggets ≈ 18-20g, momos ≈ 25-30g) to avoid defaulting to packet sizes.

---

## POST `/api/capy-motivation`

**Purpose**: Generate a motivational message from Capy based on current garden/streak state. Used as LLM fallback when pre-built lines are exhausted.

**File**: `src/app/api/capy-motivation/route.ts`

**Input**:
```json
{
  "streak": 7,
  "flowers": 5,
  "treeLevel": 2,
  "todayCalories": 1200,
  "calorieGoal": 1750,
  "todayProtein": 80,
  "proteinGoal": 150,
  "gardenHealth": 75,
  "timeOfDay": "afternoon"
}
```

**Output**:
```json
{
  "message": "7 days! Look at our beautiful garden growing! 🌸",
  "mood": "excited"
}
```

**Provider chain**: Gemini 2.0 Flash Lite → Groq Llama 3.1 8B Instant  
**Prompt**: Capy persona, 1-2 sentence max, warm/playful, references garden state  
**Fallback**: Returns a generic motivational message if both providers fail  
**Cost**: Free (uses free tier models)

---

## POST `/api/hindi-message`

**Purpose**: Generate a short, casual Hindi message for a cook.

**File**: `src/app/api/hindi-message/route.ts`

**Input**:
```json
{
  "recipeName": "Paneer Matar",
  "recipeHindi": "पनीर मटर",
  "ingredientsUsed": ["Paneer", "Peas", "Tomato"],
  "servings": 2
}
```

**Output**:
```json
{
  "hindiText": "भैया, आज लंच में 2 लोगों के लिए पनीर मटर बना दीजिए। पनीर, मटर, टमाटर सब फ्रिज में है।"
}
```

**Provider**: Groq (meta-llama/llama-4-scout-17b-16e-instruct)  
**Prompt**: `buildHindiPrompt(servings)` — casual Hindi, 2-3 sentences, mentions dish name + serving count + ingredients in fridge  
**Cost**: Free (Groq free tier)

---

## POST `/api/hindi-tts`

**Purpose**: Convert Hindi text to natural-sounding MP3 audio.

**File**: `src/app/api/hindi-tts/route.ts`

**Input**:
```json
{
  "text": "भैया, आज लंच में पनीर मटर बना दीजिए।"
}
```

**Output**: Binary MP3 audio (`Content-Type: audio/mpeg`)

**Provider**: Sarvam AI Bulbul v3  
**Endpoint**: `https://api.sarvam.ai/text-to-speech`  
**Auth header**: `api-subscription-key: <SARVAM_API_KEY>`  
**Parameters**:
- `model`: `bulbul:v3`
- `speaker`: `kabir` (male North Indian voice)
- `target_language_code`: `hi-IN`
- `pace`: 1.0
- `response_format`: `mp3`
- `sample_rate`: 24000

**Response handling**: Sarvam returns `{ audios: ["<base64>"] }` — we decode and return as binary MP3  
**Cost**: ₹15/10K characters (~₹0.15 per message). ₹1000 free credits on signup.

**Note**: Bulbul v3 does NOT support `pitch` or `loudness` parameters — will return 400 if included.

---

## POST `/api/describe-meal`

**Purpose**: Parse a natural-language meal description into structured dishes with nutrition estimates and food-specific portion options.

**File**: `src/app/api/describe-meal/route.ts`

**Input**:
```json
{
  "description": "chole bhature with raita, 1 papad, and lassi meethi",
  "mealType": "lunch"
}
```

**Output**:
```json
{
  "dishes": [
    {
      "name": "Chole Bhature",
      "hindi": "छोले भटूरे",
      "portions": [
        { "label": "Small katori (~150g)", "weight_g": 150, "calories": 250, "protein_g": 10, "carbs_g": 40, "fat_g": 7, "fiber_g": 6 },
        { "label": "Regular katori (~300g)", "weight_g": 300, "calories": 500, "protein_g": 20, "carbs_g": 80, "fat_g": 14, "fiber_g": 12 },
        { "label": "Large bowl (~450g)", "weight_g": 450, "calories": 750, "protein_g": 30, "carbs_g": 120, "fat_g": 21, "fiber_g": 18 }
      ],
      "defaultIndex": 1,
      "ingredients": ["Chickpeas", "Onions", "Tomatoes", "Spices", "Oil", "Flour"],
      "confidence": "high",
      "tags": ["high-carb", "vegetarian"],
      "healthTip": "Pair with salad for added fiber and nutrients.",
      "reasoning": "Chole bhature is typically served in katori sizes. Estimated regular portion is ~300g."
    }
  ],
  "_provider": "gemini",
  "_latencyMs": 1823
}
```

**Provider chain**: Gemini 2.0 Flash-Lite (Tier 1) → OpenAI gpt-4.1-nano + Groq Llama 4 Scout **raced in parallel** (Tier 2+3)  
**Parallel race**: When Gemini fails, OpenAI and Groq fire simultaneously — first valid response wins  
**Per-provider timeout**: 6 seconds (prevents slow providers from blocking the pipeline)  
**Cost control**: 5-minute in-memory cache (200 entries max), 200-char input limit  
**Prompt**: Compact ~350-token prompt with Indian food context (Hindi-English code-switching, katori/roti/cup portion labels)  
**OpenAI optimization**: `response_format: { type: "json_object" }` for guaranteed structured output  
**JSON parsing**: 3-tier parser (direct parse → strip markdown fences → string-aware brace-counting extraction)  
**Normalization**: Strict type coercion for all numeric fields, confidence level validation, portion array padding to exactly 3 items  
**Debug fields**: `_provider` and `_latencyMs` included in response for performance monitoring

---

## POST `/api/analyze-habits`

**Purpose**: Generate an AI-powered eating habits analysis report from pre-aggregated meal data, cross-referenced with health conditions.

**File**: `src/app/api/analyze-habits/route.ts`

**Input**:
```json
{
  "aggregateSummary": "Period: Last 7 days | 26 meals across 7 days\nAvg daily: 1784 cal, P:68g...",
  "healthContext": "Active conditions: Pre-diabetic (borderline). Dietary rules: Prefer low-GI options...",
  "previousSummary": "Your average calories were slightly above target...",
  "goalCalories": 2000,
  "goalProtein": 120
}
```

**Output**:
```json
{
  "report": {
    "score": "needs_work",
    "scoreSummary": "Your average calories are slightly below target at 1784 vs 2000...",
    "trends": { "calories": "stable", "protein": "declining", "carbs": "stable", "fat": "stable" },
    "insights": [
      {
        "category": "macro",
        "title": "Protein Concentration at Dinner",
        "detail": "Over half (53%) of your daily protein is consumed at dinner...",
        "severity": "warning"
      }
    ],
    "healthNotes": ["Focus on low-GI carbohydrate sources to manage blood sugar."],
    "actionItems": [
      {
        "priority": 1,
        "text": "Distribute protein more evenly by adding paneer or dal to breakfast and lunch.",
        "relatedInsight": "Protein Concentration at Dinner"
      }
    ],
    "comparison": {
      "caloriesDelta": -5,
      "proteinDelta": 18,
      "topImprovement": "Protein intake improved 18% vs last period",
      "topRegression": null
    }
  },
  "_provider": "gemini",
  "_latencyMs": 4523
}
```

**Provider chain**: Gemini 2.5 Flash (free, primary) → OpenAI gpt-4.1-mini ($0.0015/call) → Groq Llama 4 Scout (free, emergency)  
**Cost optimization**: Input is a pre-aggregated summary (~400 tokens) computed client-side by `mealAggregator.ts`, not raw meal data  
**Per-provider timeout**: 15 seconds  
**Temperature**: 0.3 (factual, consistent)  
**Max output tokens**: 1200  
**Normalization**: Strict validation of score/trend/category/severity enums, insight/action array capping (7 insights, 5 actions)  
**JSON parsing**: 3-tier parser (direct → strip markdown → brace-counting extraction)  
**Debug fields**: `_provider` and `_latencyMs` included in response
