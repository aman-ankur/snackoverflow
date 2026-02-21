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

**Provider chain**: Gemini 2.0 Flash → Gemini 2.0 Flash Lite → Groq Llama 4 Scout  
**Safety/normalization**: Strict JSON parsing + numeric normalization + confidence/tag fallback defaults  
**Cost control**: 2-minute in-memory response cache for repeated near-identical dish scans  
**Rate limit handling**: Returns 429 with friendly message when providers are exhausted

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
