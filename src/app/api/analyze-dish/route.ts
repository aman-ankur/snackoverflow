import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";
import type { ConfidenceLevel, DishAnalysisResult, DishNutrition } from "@/lib/dishTypes";

const CACHE_TTL_MS = 2 * 60 * 1000;
const MAX_CACHE_ENTRIES = 50;

interface DishCacheEntry {
  expiresAt: number;
  data: DishAnalysisResult;
}

const dishAnalysisCache = new Map<string, DishCacheEntry>();

function getCacheKey(base64Data: string, mealType?: string): string {
  return `${mealType || "unknown"}:${base64Data.length}:${base64Data.slice(0, 160)}`;
}

function getCachedResult(cacheKey: string): DishAnalysisResult | null {
  const hit = dishAnalysisCache.get(cacheKey);
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) {
    dishAnalysisCache.delete(cacheKey);
    return null;
  }
  return hit.data;
}

function setCachedResult(cacheKey: string, data: DishAnalysisResult) {
  if (dishAnalysisCache.size >= MAX_CACHE_ENTRIES) {
    const firstKey = dishAnalysisCache.keys().next().value;
    if (firstKey) {
      dishAnalysisCache.delete(firstKey);
    }
  }

  dishAnalysisCache.set(cacheKey, {
    expiresAt: Date.now() + CACHE_TTL_MS,
    data,
  });
}

function buildDishPrompt(mealType?: string, correction?: string): string {
  const mealHint = mealType
    ? `Meal context from user: ${mealType}.`
    : "Meal context from user: unknown.";

  const correctionHint = correction
    ? `\n\nIMPORTANT CORRECTION FROM USER: ${correction}. Override your visual identification with this correction and re-estimate nutrition accordingly.`
    : "";

  return `You are an expert Indian food nutritionist analyzing a camera photo of a meal.

${mealHint}${correctionHint}

Follow these steps IN ORDER before producing JSON:

Step 1 — VISUAL DESCRIPTION:
Describe what you see in 2-3 sentences: plate/bowl type, colors, textures, visible proteins (egg pieces, meat, paneer cubes, dal), garnishes, sauces, and accompaniments.

Step 2 — VEG / NON-VEG CHECK:
Explicitly check: are there visible eggs, egg-based noodles/batter, meat, chicken, fish, or seafood? If yes, name the dish accordingly (e.g. "Egg Noodles" NOT "Veg Noodles", "Chicken Biryani" NOT "Biryani"). If egg is used in the batter or noodle dough, it is non-veg.

Step 3 — DISH IDENTIFICATION:
Identify each dish. Use specific Indian names where applicable. If multiple items are on the plate (thali), list each separately.

Step 4 — WEIGHT ESTIMATION:
Estimate portion weight in grams using visual anchors:
- Standard Indian katori (bowl) ≈ 150-200ml ≈ 150-250g depending on density
- Dinner plate ≈ 25cm diameter
- 1 roti/chapati ≈ 35-40g, 1 naan ≈ 80-100g
- 1 cup cooked rice ≈ 180-200g
- 1 dosa ≈ 80-120g
Compare the food to the plate/bowl size to estimate grams.

CRITICAL for small/countable items (chips, nuggets, biscuits, momos, pieces of fruit, etc.):
- COUNT the individual pieces visible in the image first.
- State the count explicitly in your reasoning (e.g. "I count approximately 8-10 potato chips").
- Use per-piece weight: 1 potato chip ≈ 3-5g, 1 chicken nugget ≈ 18-20g, 1 momo ≈ 25-30g, 1 samosa ≈ 50-60g, 1 pakora ≈ 20-25g.
- Multiply count × per-piece weight. Do NOT default to "1 serving" from a packet.
- For chips specifically: 8 chips ≈ 25-35g (NOT 110g which would be a full packet).

Step 5 — NUTRITION CALCULATION:
For each dish:
a) Recall the approximate per-100g macros for this dish (from standard Indian nutrition data).
b) Multiply by (estimated_weight_g / 100) to get final values.
c) Cross-check: calories should roughly equal (protein_g × 4) + (carbs_g × 4) + (fat_g × 9). If off by more than 15%, adjust your numbers.

Step 6 — OUTPUT:
Respond ONLY as strict JSON (no markdown, no extra text) in this exact shape:
{
  "dishes": [
    {
      "name": "Egg Noodles",
      "hindi": "एग नूडल्स",
      "portion": "1 plate (~250g)",
      "estimated_weight_g": 250,
      "calories": 350,
      "protein_g": 12,
      "carbs_g": 45,
      "fat_g": 14,
      "fiber_g": 2,
      "ingredients": ["Egg noodles", "Egg", "Vegetables", "Soy sauce", "Oil"],
      "confidence": "medium",
      "tags": ["high-carb"],
      "healthTip": "Good protein from eggs. Reduce oil for fewer calories.",
      "reasoning": "Yellow noodles with visible egg pieces and stir-fried vegetables on a dinner plate. Estimated ~250g based on plate coverage. Per 100g egg noodles: ~140 kcal, 5g protein, 18g carbs, 5.5g fat."
    }
  ],
  "totalCalories": 350,
  "totalProtein": 12,
  "totalCarbs": 45,
  "totalFat": 14,
  "totalFiber": 2
}

Rules:
- Return ONLY JSON. No markdown fences. No extra keys.
- "reasoning" must include: what you saw, how you estimated weight, and the per-100g reference values you used.
- "estimated_weight_g" must be a number in grams.
- If unsure about dish identity, still return best estimate and set confidence to "low".
- If no dish is visible, return empty dishes array and all totals as 0.
- Keep numeric values as numbers, not strings.
- Favor realistic Indian home-cooked nutrition estimates (not restaurant portions unless it clearly looks like restaurant food).`;
}

function parseJsonResponse(text: string) {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON found in AI response");
  return JSON.parse(jsonMatch[0]);
}

function isRateLimitError(msg: string): boolean {
  return (
    msg.includes("429") ||
    msg.includes("quota") ||
    msg.includes("RESOURCE_EXHAUSTED") ||
    msg.includes("rate") ||
    msg.includes("limit")
  );
}

function toNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value.replace(/[^\d.-]/g, ""));
    if (Number.isFinite(n)) return n;
  }
  return 0;
}

function normalizeConfidence(value: unknown): ConfidenceLevel {
  if (typeof value !== "string") return "medium";
  const normalized = value.toLowerCase().trim();
  if (normalized === "high" || normalized === "medium" || normalized === "low") {
    return normalized;
  }
  return "medium";
}

function deriveTags(dish: Pick<DishNutrition, "calories" | "protein_g" | "carbs_g" | "fat_g" | "fiber_g">): string[] {
  const tags: string[] = [];
  if (dish.protein_g > 20) tags.push("high-protein");
  if (dish.carbs_g > 50) tags.push("high-carb");
  if (dish.fat_g > 30) tags.push("high-fat");
  if (dish.calories < 300) tags.push("low-calorie");
  if (dish.calories > 600) tags.push("high-calorie");
  if (dish.fiber_g > 5) tags.push("fiber-rich");
  return tags;
}

function normalizeDish(raw: unknown): DishNutrition | null {
  if (!raw || typeof raw !== "object") return null;
  const input = raw as Record<string, unknown>;

  const name = typeof input.name === "string" ? input.name.trim() : "Unknown Dish";
  const hindi = typeof input.hindi === "string" ? input.hindi.trim() : "";
  const portion = typeof input.portion === "string" ? input.portion.trim() : "1 serving";

  const dish: DishNutrition = {
    name: name || "Unknown Dish",
    hindi,
    portion,
    estimated_weight_g: Math.max(0, Math.round(toNumber(input.estimated_weight_g))),
    calories: Math.max(0, Math.round(toNumber(input.calories))),
    protein_g: Math.max(0, Math.round(toNumber(input.protein_g))),
    carbs_g: Math.max(0, Math.round(toNumber(input.carbs_g))),
    fat_g: Math.max(0, Math.round(toNumber(input.fat_g))),
    fiber_g: Math.max(0, Math.round(toNumber(input.fiber_g))),
    ingredients: Array.isArray(input.ingredients)
      ? input.ingredients.filter((v): v is string => typeof v === "string" && v.trim().length > 0)
      : [],
    confidence: normalizeConfidence(input.confidence),
    tags: Array.isArray(input.tags)
      ? input.tags.filter((v): v is string => typeof v === "string" && v.trim().length > 0)
      : [],
    healthTip:
      typeof input.healthTip === "string" && input.healthTip.trim().length > 0
        ? input.healthTip.trim()
        : "Balance this meal with vegetables and hydration.",
    reasoning:
      typeof input.reasoning === "string" && input.reasoning.trim().length > 0
        ? input.reasoning.trim()
        : "",
  };

  if (dish.tags.length === 0) {
    dish.tags = deriveTags(dish);
  }

  return dish;
}

function normalizeResult(raw: unknown): DishAnalysisResult {
  if (!raw || typeof raw !== "object") {
    return {
      dishes: [],
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFat: 0,
      totalFiber: 0,
    };
  }

  const input = raw as Record<string, unknown>;
  const dishes = Array.isArray(input.dishes)
    ? input.dishes.map(normalizeDish).filter((d): d is DishNutrition => Boolean(d))
    : [];

  const fromDishes = {
    totalCalories: dishes.reduce((sum, d) => sum + d.calories, 0),
    totalProtein: dishes.reduce((sum, d) => sum + d.protein_g, 0),
    totalCarbs: dishes.reduce((sum, d) => sum + d.carbs_g, 0),
    totalFat: dishes.reduce((sum, d) => sum + d.fat_g, 0),
    totalFiber: dishes.reduce((sum, d) => sum + d.fiber_g, 0),
  };

  return {
    dishes,
    totalCalories: Math.max(0, Math.round(toNumber(input.totalCalories) || fromDishes.totalCalories)),
    totalProtein: Math.max(0, Math.round(toNumber(input.totalProtein) || fromDishes.totalProtein)),
    totalCarbs: Math.max(0, Math.round(toNumber(input.totalCarbs) || fromDishes.totalCarbs)),
    totalFat: Math.max(0, Math.round(toNumber(input.totalFat) || fromDishes.totalFat)),
    totalFiber: Math.max(0, Math.round(toNumber(input.totalFiber) || fromDishes.totalFiber)),
  };
}

async function tryGemini(base64Data: string, prompt: string): Promise<DishAnalysisResult | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const genAI = new GoogleGenerativeAI(apiKey);
  const imageContent = {
    inlineData: { mimeType: "image/jpeg" as const, data: base64Data },
  };

  const models = ["gemini-2.5-flash", "gemini-2.0-flash"];

  for (const modelName of models) {
    try {
      console.log(`[Gemini Dish] Trying ${modelName}...`);
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 2048,
          ...(modelName === "gemini-2.5-flash" ? { thinkingConfig: { thinkingBudget: 1024 } } : {}),
        } as Record<string, unknown>,
      });
      const result = await model.generateContent([prompt, imageContent]);
      const parsed = parseJsonResponse(result.response.text());
      console.log(`[Gemini Dish] Success with ${modelName}`);
      return normalizeResult(parsed);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      console.error(`[Gemini Dish/${modelName}] ${msg}`);
      if (isRateLimitError(msg)) continue;
      throw err;
    }
  }

  console.log("[Gemini Dish] All models rate limited, falling back...");
  return null;
}

async function tryGroq(base64Data: string, prompt: string): Promise<DishAnalysisResult | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  const groq = new Groq({ apiKey });

  const groqModels = [
    "meta-llama/llama-4-maverick-17b-128e-instruct",
    "meta-llama/llama-4-scout-17b-16e-instruct",
  ];

  for (const groqModel of groqModels) {
    try {
      console.log(`[Groq Dish] Trying ${groqModel}...`);
      const result = await groq.chat.completions.create({
        model: groqModel,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: { url: `data:image/jpeg;base64,${base64Data}` },
              },
            ],
          },
        ],
        temperature: 0.2,
        max_tokens: 1800,
      });

      const text = result.choices[0]?.message?.content || "";
      const parsed = parseJsonResponse(text);
      console.log(`[Groq Dish] Success with ${groqModel}`);
      return normalizeResult(parsed);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      console.error(`[Groq Dish/${groqModel}] ${msg}`);
      if (isRateLimitError(msg)) continue;
      throw err;
    }
  }

  console.log("[Groq Dish] All models rate limited");
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const { image, mealType, correction } = await request.json();

    if (!image || typeof image !== "string") {
      return NextResponse.json({ error: "Image data is required" }, { status: 400 });
    }

    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    const correctionStr = typeof correction === "string" && correction.trim() ? correction.trim() : undefined;
    const prompt = buildDishPrompt(
      typeof mealType === "string" ? mealType : undefined,
      correctionStr,
    );
    const cacheKey = correctionStr
      ? `fix:${correctionStr}:${getCacheKey(base64Data, typeof mealType === "string" ? mealType : undefined)}`
      : getCacheKey(base64Data, typeof mealType === "string" ? mealType : undefined);

    const cached = getCachedResult(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const errors: string[] = [];

    try {
      const result = await tryGemini(base64Data, prompt);
      if (result) {
        setCachedResult(cacheKey, result);
        return NextResponse.json(result);
      }
      errors.push("Gemini rate limited");
    } catch (err: unknown) {
      errors.push(`Gemini: ${err instanceof Error ? err.message : "failed"}`);
    }

    try {
      const result = await tryGroq(base64Data, prompt);
      if (result) {
        setCachedResult(cacheKey, result);
        return NextResponse.json(result);
      }
      errors.push("Groq rate limited or no key");
    } catch (err: unknown) {
      errors.push(`Groq: ${err instanceof Error ? err.message : "failed"}`);
    }

    const hasAnyKey = process.env.GEMINI_API_KEY || process.env.GROQ_API_KEY;
    if (!hasAnyKey) {
      return NextResponse.json(
        { error: "No API keys configured. Add GEMINI_API_KEY or GROQ_API_KEY to .env.local" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: "All AI providers are rate limited. Please wait 30s and try again.",
        details: errors,
      },
      { status: 429 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Analyze dish API error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
