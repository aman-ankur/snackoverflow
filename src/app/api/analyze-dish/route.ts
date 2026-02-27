import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import type { ConfidenceLevel, DishAnalysisResult, DishNutrition } from "@/lib/dishTypes";
import { buildReferenceTable } from "@/lib/nutritionReference";

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
    ? `Meal context: ${mealType}.`
    : "";

  const correctionHint = correction
    ? `\n\nIMPORTANT CORRECTION FROM USER: ${correction}. Override your visual identification with this correction and re-estimate nutrition accordingly.`
    : "";

  const refTable = buildReferenceTable();

  return `You are an expert food nutritionist analyzing a camera photo of a meal.
DEFAULT ASSUMPTION: Home-cooked with moderate oil/ghee (1-2 tsp per dish) unless the food visibly looks oily, fried, or restaurant-style.
${mealHint}${correctionHint}

REFERENCE NUTRITION DATA (per 100g, cooked/prepared):
${refTable}

Follow these steps IN ORDER before producing JSON:

Step 1 — VISUAL DESCRIPTION:
Describe what you see in 2-3 sentences: plate/bowl type, colors, textures, visible proteins, garnishes, and accompaniments.

Step 2 — VEG / NON-VEG CHECK:
Are there visible eggs, meat, chicken, fish, or seafood? If yes, name the dish accordingly (e.g. "Egg Noodles" NOT "Veg Noodles", "Chicken Biryani" NOT "Biryani").

Step 3 — DISH IDENTIFICATION:
Identify each dish separately. Use specific names. If multiple items on the plate (thali), list each separately.

Step 4 — WEIGHT ESTIMATION:
Estimate portion weight in grams using visual anchors:
- 1 roti/chapati ≈ 35-40g, 1 naan ≈ 80-100g, 1 bhatura ≈ 60-70g
- Standard katori (bowl) ≈ 150-200ml ≈ 150-250g depending on density
- 1 cup cooked rice ≈ 180-200g
- 1 dosa ≈ 80-120g, 1 idli ≈ 35-45g
- Dinner plate ≈ 25cm diameter

For countable items (chips, nuggets, momos, etc.):
- COUNT pieces first. State count in reasoning.
- Per-piece: chip ≈ 3-5g, nugget ≈ 18-20g, momo ≈ 25-30g, samosa ≈ 50-60g.
- Multiply count × per-piece weight.

Step 5 — NUTRITION CALCULATION:
For each dish:
a) LOOK UP the per-100g macros from the REFERENCE TABLE above. If the dish matches a reference entry, USE those values.
b) If the dish is NOT in the table, estimate independently — do NOT anchor to table values.
c) Multiply per-100g values by (estimated_weight_g / 100).
d) Cross-check: calories ≈ (protein_g × 4) + (carbs_g × 4) + (fat_g × 9). If off by >15%, adjust.

Step 6 — SANITY CHECK:
A typical Indian home meal is 400-600 kcal. If your total exceeds 800 for what looks like a normal home plate, your per-100g values are likely too high — recheck against the reference table.

Step 6B — ALTERNATIVE IDENTIFICATIONS:
For EACH dish, ALWAYS generate top 2 alternatives with FULL nutrition (same format as primary) UNLESS the item is clearly unambiguous.

SKIP alternatives ONLY for these unambiguous items:
- Single whole fruit (banana, apple, orange)
- Labeled packaging with visible brand name
- Single distinctive item with no visual lookalikes (whole roti, whole idli, whole boiled egg)

GENERATE alternatives for EVERYTHING ELSE, regardless of confidence level:
- Any cooked dish, curry, sabzi, or gravy
- Any rice preparation (jeera rice, biryani, pulao, fried rice)
- Any fried or breaded item (pakora, nuggets, cutlet)
- Any beverage (tea, coffee, shake, smoothie, lassi)
- Any mixed plate or thali item
- Any dish where two similar dishes could look the same (paneer bhurji vs egg bhurji, aloo gobi vs gobi aloo)

Alternatives must be:
- Visually similar (color, texture, shape match)
- Genuinely plausible given the image
- Different dishes with meaningfully different nutrition

Examples: paneer bhurji/egg bhurji, iced tea/iced coffee, chilla/uttapam, milkshake/smoothie, dal tadka/dal fry, chicken curry/paneer curry.
Skip: banana, packaged Parle-G biscuits, single whole roti, single boiled egg.

Step 7 — OUTPUT:
Respond ONLY as strict JSON (no markdown, no extra text):
{
  "dishes": [
    {
      "name": "Paneer Bhurji",
      "hindi": "पनीर भुर्जी",
      "portion": "1 serving (~180g)",
      "estimated_weight_g": 180,
      "calories": 288,
      "protein_g": 20,
      "carbs_g": 7,
      "fat_g": 20,
      "fiber_g": 1,
      "ingredients": ["Paneer", "Onion", "Tomato", "Spices", "Oil"],
      "confidence": "high",
      "tags": ["high-protein"],
      "healthTip": "Good protein source. Reduce oil for fewer calories.",
      "reasoning": "Scrambled paneer on plate. ~180g serving. Ref: paneer bhurji 160 cal/100g. 180g × 1.6 = 288 cal.",
      "alternatives": [
        {
          "name": "Egg Bhurji",
          "hindi": "अंडा भुर्जी",
          "portion": "1 serving (~180g)",
          "estimated_weight_g": 180,
          "calories": 216,
          "protein_g": 18,
          "carbs_g": 4,
          "fat_g": 14,
          "fiber_g": 1,
          "ingredients": ["Eggs", "Onion", "Tomato", "Spices", "Oil"],
          "confidence": "medium",
          "tags": ["high-protein"],
          "healthTip": "Excellent protein source. Lower calorie than paneer version.",
          "reasoning": "Similar scrambled texture. Could be eggs instead of paneer. ~180g serving. Ref: egg bhurji 120 cal/100g."
        }
      ]
    }
  ],
  "totalCalories": 288,
  "totalProtein": 20,
  "totalCarbs": 7,
  "totalFat": 20,
  "totalFiber": 1
}

Rules:
- Return ONLY JSON. No markdown fences. No extra keys.
- "reasoning" must include: per-100g reference used, weight estimate, and calculation.
- "estimated_weight_g" must be a number in grams.
- If unsure about dish identity, still return best estimate and set confidence to "low".
- If no dish is visible, return empty dishes array and all totals as 0.
- Keep numeric values as numbers, not strings.`;
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

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs)
    ),
  ]);
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

  // Recursively normalize alternatives (limit to 2)
  if (Array.isArray(input.alternatives) && input.alternatives.length > 0) {
    const normalizedAlternatives = input.alternatives
      .slice(0, 2) // Limit to 2 alternatives
      .map(normalizeDish)
      .filter((d): d is DishNutrition => Boolean(d));

    if (normalizedAlternatives.length > 0) {
      dish.alternatives = normalizedAlternatives;
    }
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

async function tryGemini25Flash(base64Data: string, prompt: string): Promise<{ result: DishAnalysisResult; provider: string } | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const genAI = new GoogleGenerativeAI(apiKey);
  const imageContent = {
    inlineData: { mimeType: "image/jpeg" as const, data: base64Data },
  };

  try {
    console.log("[Gemini Dish] Trying gemini-2.5-flash...");
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 2560,
        thinkingConfig: { thinkingBudget: 1024 },
      } as Record<string, unknown>,
    });
    const result = await model.generateContent([prompt, imageContent]);
    const parsed = parseJsonResponse(result.response.text());
    console.log("[Gemini Dish] Success with gemini-2.5-flash");
    return { result: normalizeResult(parsed), provider: "G25F" };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    console.error(`[Gemini Dish/gemini-2.5-flash] ${msg}`);
    if (isRateLimitError(msg)) return null;
    throw err;
  }
}

async function tryGemini20Flash(base64Data: string, prompt: string): Promise<{ result: DishAnalysisResult; provider: string } | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const genAI = new GoogleGenerativeAI(apiKey);
  const imageContent = {
    inlineData: { mimeType: "image/jpeg" as const, data: base64Data },
  };

  try {
    console.log("[Gemini Dish] Trying gemini-2.0-flash...");
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 2560,
      } as Record<string, unknown>,
    });
    const result = await model.generateContent([prompt, imageContent]);
    const parsed = parseJsonResponse(result.response.text());
    console.log("[Gemini Dish] Success with gemini-2.0-flash");
    return { result: normalizeResult(parsed), provider: "G20F" };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    console.error(`[Gemini Dish/gemini-2.0-flash] ${msg}`);
    if (isRateLimitError(msg)) return null;
    throw err;
  }
}

async function tryOpenAI(base64Data: string, prompt: string): Promise<{ result: DishAnalysisResult; provider: string } | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const openai = new OpenAI({ apiKey });

  try {
    console.log("[OpenAI Dish] Trying gpt-4o-mini...");
    const result = await openai.chat.completions.create({
      model: "gpt-4o-mini",
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
      max_tokens: 2560,
      response_format: { type: "json_object" },
    });

    const text = result.choices[0]?.message?.content || "";
    const parsed = parseJsonResponse(text);
    console.log("[OpenAI Dish] Success with gpt-4o-mini");
    return { result: normalizeResult(parsed), provider: "OAI4m" };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    console.error(`[OpenAI Dish] ${msg}`);
    if (isRateLimitError(msg)) return null;
    throw err;
  }
}

async function tryGroq(base64Data: string, prompt: string): Promise<{ result: DishAnalysisResult; provider: string } | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  const groq = new Groq({ apiKey });

  const groqModels: Array<{ model: string; tag: string }> = [
    { model: "meta-llama/llama-4-maverick-17b-128e-instruct", tag: "GRQM" },
    { model: "meta-llama/llama-4-scout-17b-16e-instruct", tag: "GRQS" },
  ];

  for (const { model: groqModel, tag } of groqModels) {
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
        max_tokens: 2400,
      });

      const text = result.choices[0]?.message?.content || "";
      const parsed = parseJsonResponse(text);
      console.log(`[Groq Dish] Success with ${groqModel}`);
      return { result: normalizeResult(parsed), provider: tag };
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
    const startTotal = Date.now();

    // Staggered parallel fallback strategy:
    // 1. Try Gemini 2.5 Flash first (4s timeout)
    // 2. If no response after 2s, start parallel race with all other providers
    // 3. First valid result from any provider wins

    type ProviderResult = { result: DishAnalysisResult; provider: string; latencyMs: number };

    // Primary provider: Gemini 2.5 Flash
    const gemini25Promise = (async (): Promise<ProviderResult | null> => {
      const t0 = Date.now();
      console.log(`[Dish Scan] 🚀 Starting Gemini 2.5 Flash (primary, 4s timeout)...`);
      try {
        const hit = await withTimeout(tryGemini25Flash(base64Data, prompt), 4000);
        if (hit) {
          const latencyMs = Date.now() - t0;
          console.log(`[Dish Scan] ✅ Gemini 2.5 Flash succeeded in ${latencyMs}ms (model: gemini-2.5-flash)`);
          return { result: hit.result, provider: hit.provider, latencyMs };
        }
        const failTime = Date.now() - t0;
        console.log(`[Dish Scan] ⚠️ Gemini 2.5 Flash rate limited after ${failTime}ms`);
        errors.push(`Gemini 2.5 Flash rate limited (${failTime}ms)`);
      } catch (err: unknown) {
        const failTime = Date.now() - t0;
        const msg = err instanceof Error ? err.message : "failed";
        const isTimeout = msg.includes("Timeout");
        console.log(`[Dish Scan] ${isTimeout ? '⏱️ ' : '❌'} Gemini 2.5 Flash ${isTimeout ? 'timeout' : 'error'} after ${failTime}ms: ${msg}`);
        errors.push(`Gemini 2.5 Flash: ${msg} (${failTime}ms)`);
      }
      return null;
    })();

    // Stagger trigger: wait 2s before starting parallel race
    const staggerDelay = new Promise<null>((resolve) => setTimeout(() => resolve(null), 2000));

    // Parallel race with all other providers
    const parallelRace = (async (): Promise<ProviderResult | null> => {
      await staggerDelay; // Wait 2s before starting
      console.log("[Dish Scan] ⏳ 2s elapsed, starting staggered parallel race (Gemini 2.5 still running)...");

      const runners: Promise<ProviderResult | null>[] = [];

      // OpenAI
      if (process.env.OPENAI_API_KEY) {
        runners.push(
          (async () => {
            const t0 = Date.now();
            console.log(`[Dish Scan] 🚀 Starting OpenAI gpt-4o-mini (4s timeout)...`);
            try {
              const hit = await withTimeout(tryOpenAI(base64Data, prompt), 4000);
              if (hit) {
                const latencyMs = Date.now() - t0;
                console.log(`[Dish Scan] ✅ OpenAI succeeded in ${latencyMs}ms (model: gpt-4o-mini)`);
                return { result: hit.result, provider: hit.provider, latencyMs };
              }
              const failTime = Date.now() - t0;
              console.log(`[Dish Scan] ⚠️ OpenAI rate limited after ${failTime}ms`);
              errors.push(`OpenAI rate limited (${failTime}ms)`);
            } catch (err: unknown) {
              const failTime = Date.now() - t0;
              const msg = err instanceof Error ? err.message : "failed";
              const isTimeout = msg.includes("Timeout");
              console.log(`[Dish Scan] ${isTimeout ? '⏱️ ' : '❌'} OpenAI ${isTimeout ? 'timeout' : 'error'} after ${failTime}ms: ${msg}`);
              errors.push(`OpenAI: ${msg} (${failTime}ms)`);
            }
            return null;
          })()
        );
      }

      // Gemini 2.0 Flash
      if (process.env.GEMINI_API_KEY) {
        runners.push(
          (async () => {
            const t0 = Date.now();
            console.log(`[Dish Scan] 🚀 Starting Gemini 2.0 Flash (4s timeout)...`);
            try {
              const hit = await withTimeout(tryGemini20Flash(base64Data, prompt), 4000);
              if (hit) {
                const latencyMs = Date.now() - t0;
                console.log(`[Dish Scan] ✅ Gemini 2.0 Flash succeeded in ${latencyMs}ms (model: gemini-2.0-flash)`);
                return { result: hit.result, provider: hit.provider, latencyMs };
              }
              const failTime = Date.now() - t0;
              console.log(`[Dish Scan] ⚠️ Gemini 2.0 Flash rate limited after ${failTime}ms`);
              errors.push(`Gemini 2.0 Flash rate limited (${failTime}ms)`);
            } catch (err: unknown) {
              const failTime = Date.now() - t0;
              const msg = err instanceof Error ? err.message : "failed";
              const isTimeout = msg.includes("Timeout");
              console.log(`[Dish Scan] ${isTimeout ? '⏱️ ' : '❌'} Gemini 2.0 Flash ${isTimeout ? 'timeout' : 'error'} after ${failTime}ms: ${msg}`);
              errors.push(`Gemini 2.0 Flash: ${msg} (${failTime}ms)`);
            }
            return null;
          })()
        );
      }

      // Groq
      if (process.env.GROQ_API_KEY) {
        runners.push(
          (async () => {
            const t0 = Date.now();
            console.log(`[Dish Scan] 🚀 Starting Groq Llama 4 Scout (4s timeout)...`);
            try {
              const hit = await withTimeout(tryGroq(base64Data, prompt), 4000);
              if (hit) {
                const latencyMs = Date.now() - t0;
                console.log(`[Dish Scan] ✅ Groq succeeded in ${latencyMs}ms (model: ${hit.provider})`);
                return { result: hit.result, provider: hit.provider, latencyMs };
              }
              const failTime = Date.now() - t0;
              console.log(`[Dish Scan] ⚠️ Groq rate limited after ${failTime}ms`);
              errors.push(`Groq rate limited (${failTime}ms)`);
            } catch (err: unknown) {
              const failTime = Date.now() - t0;
              const msg = err instanceof Error ? err.message : "failed";
              const isTimeout = msg.includes("Timeout");
              console.log(`[Dish Scan] ${isTimeout ? '⏱️ ' : '❌'} Groq ${isTimeout ? 'timeout' : 'error'} after ${failTime}ms: ${msg}`);
              errors.push(`Groq: ${msg} (${failTime}ms)`);
            }
            return null;
          })()
        );
      }

      if (runners.length === 0) return null;

      // First-success race: resolve as soon as ANY provider returns valid data
      return new Promise<ProviderResult | null>((resolve) => {
        let pending = runners.length;
        for (const runner of runners) {
          runner.then((val) => {
            if (val) resolve(val);
            else if (--pending === 0) resolve(null);
          }).catch(() => {
            if (--pending === 0) resolve(null);
          });
        }
      });
    })();

    // Race primary vs parallel race (primary still gets first chance)
    const allProviders = [gemini25Promise, parallelRace];
    const winner = await new Promise<ProviderResult | null>((resolve) => {
      let pending = allProviders.length;
      for (const runner of allProviders) {
        runner.then((val) => {
          if (val) resolve(val);
          else if (--pending === 0) resolve(null);
        }).catch(() => {
          if (--pending === 0) resolve(null);
        });
      }
    });

    if (winner) {
      const { result, provider, latencyMs } = winner;
      const totalMs = Date.now() - startTotal;
      console.log(`\n[Dish Scan] 🏆 WINNER: ${provider} in ${latencyMs}ms (total request: ${totalMs}ms)\n`);
      const data = { ...result, _provider: provider, _latencyMs: latencyMs };
      setCachedResult(cacheKey, data);
      return NextResponse.json(data);
    }

    const hasAnyKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY || process.env.GROQ_API_KEY;
    if (!hasAnyKey) {
      return NextResponse.json(
        { error: "No API keys configured. Add GEMINI_API_KEY, OPENAI_API_KEY, or GROQ_API_KEY to .env.local" },
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
