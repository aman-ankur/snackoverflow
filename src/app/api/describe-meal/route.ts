import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import type { ConfidenceLevel, DescribedDish, DescribeMealResult, PortionOption } from "@/lib/dishTypes";
import { buildReferenceTable } from "@/lib/nutritionReference";

/* ─── Constants ─── */

const MAX_DESCRIPTION_LENGTH = 200;
const CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_CACHE_ENTRIES = 100;

/* ─── Cache ─── */

interface CacheEntry {
  expiresAt: number;
  data: DescribeMealResult;
}

const cache = new Map<string, CacheEntry>();

function getCacheKey(description: string, mealType: string): string {
  return `${mealType}:${description.toLowerCase().trim()}`;
}

function getCached(key: string): DescribeMealResult | null {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) {
    cache.delete(key);
    return null;
  }
  return hit.data;
}

function setCache(key: string, data: DescribeMealResult) {
  if (cache.size >= MAX_CACHE_ENTRIES) {
    const firstKey = cache.keys().next().value;
    if (firstKey) cache.delete(firstKey);
  }
  cache.set(key, { expiresAt: Date.now() + CACHE_TTL_MS, data });
}

/* ─── Prompt ─── */

const PROVIDER_TIMEOUT_MS = 6000;

function buildPrompt(description: string, mealType: string): string {
  const refTable = buildReferenceTable();

  return `You are an expert food nutritionist. DEFAULT ASSUMPTION: home-cooked with moderate oil/ghee (1-2 tsp per dish) unless the user says "restaurant" or "outside food".

Meal: "${description}" (${mealType})

REFERENCE NUTRITION DATA (per 100g, cooked/prepared):
${refTable}

IMPORTANT: Use the reference values above as anchors for matching dishes. Multiply per-100g values by (estimated_weight_g / 100). For dishes NOT in this table, estimate independently — do NOT anchor to table values.

Return JSON: {"dishes":[{"name":"...","hindi":"...","portions":[{"label":"Small katori (~150g)","weight_g":150,"calories":120,"protein_g":5,"carbs_g":18,"fat_g":3,"fiber_g":4},{...regular...},{...large...}],"defaultIndex":1,"ingredients":[...],"confidence":"high|medium|low","tags":[...],"healthTip":"...","reasoning":"..."}]}

Rules:
- Split ONLY when the user names clearly distinct dishes: "rajma chawal" = rajma + rice, "dosa with sambar and chutney" = dosa + sambar + chutney
- Keep as ONE dish when items are naturally combined: "coffee with sugar" = 1 dish, "bread with butter" = 1 dish, "fried rice with manchurian" = 2 dishes (fried rice + manchurian), NOT 3
- CRITICAL: The total number of dish entries must match the number of distinct food items. NEVER create a combined entry AND separate entries for the same food. If you have "fried rice" and "manchurian gravy" as 2 dishes, do NOT also add a third "fried rice with manchurian" dish
- Exactly 3 portions per dish with food-specific Indian labels (katori/roti count/cup/handful etc)
- defaultIndex: match user's described quantity (0=small,1=regular,2=large). If user says "2 roti", regular portion = 2 roti
- FRACTIONAL QUANTITIES: If user says "half X" or "½ X", the REGULAR portion (defaultIndex=1) must represent HALF of a standard single serving of X. Small = slightly less than half, Large = a full one. Examples: "half croissant" → regular ~40g ~130kcal, "quarter pizza" → regular ~1 slice ~100g, "half cup rice" → regular ~100g. Similarly for "1.5 roti" → regular = 1.5 roti (~57g)
- Portion weights: 1 roti ~38g, 1 katori ~180g, 1 cup cooked rice ~200g, 1 idli ~45g, 1 dosa ~80-100g, 1 bhatura ~65g, 1 slice bread ~30g, 1 tbsp butter ~14g, 1 boiled egg ~50g
- Cross-check: cal ≈ (P×4)+(C×4)+(F×9). If off by >15%, adjust
- Sanity check: a typical Indian home meal is 400-600 kcal. If total exceeds 800 for a normal description, recheck per-100g values
- reasoning: state the per-100g reference used and weight estimate
- Return ONLY valid JSON, no markdown`;
}

/* ─── Parsing & Normalization ─── */

function parseJsonResponse(text: string): unknown {
  // 1. Try direct parse
  try {
    return JSON.parse(text.trim());
  } catch { /* continue */ }

  // 2. Strip markdown fences
  const stripped = text.replace(/```(?:json)?\s*/gi, "").replace(/```\s*/g, "").trim();
  try {
    return JSON.parse(stripped);
  } catch { /* continue */ }

  // 3. Brace-counting extraction — string-aware
  const start = stripped.indexOf("{");
  if (start === -1) throw new Error("No JSON found in AI response");

  let depth = 0;
  let end = -1;
  let inString = false;
  let escape = false;
  for (let i = start; i < stripped.length; i++) {
    const ch = stripped[i];
    if (escape) { escape = false; continue; }
    if (ch === "\\") { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) { end = i; break; }
    }
  }

  if (end === -1) {
    console.error("[Describe] Failed to extract JSON. Raw text (first 500 chars):", stripped.slice(0, 500));
    throw new Error("Malformed JSON in AI response");
  }

  try {
    return JSON.parse(stripped.slice(start, end + 1));
  } catch (e) {
    console.error("[Describe] JSON.parse failed on extracted block (first 500 chars):", stripped.slice(start, Math.min(start + 500, end + 1)));
    throw e;
  }
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
  if (normalized === "high" || normalized === "medium" || normalized === "low") return normalized;
  return "medium";
}

function normalizePortion(raw: unknown): PortionOption | null {
  if (!raw || typeof raw !== "object") return null;
  const input = raw as Record<string, unknown>;
  const label = typeof input.label === "string" && input.label.trim() ? input.label.trim() : null;
  if (!label) return null;

  return {
    label,
    weight_g: Math.max(1, Math.round(toNumber(input.weight_g))),
    calories: Math.max(0, Math.round(toNumber(input.calories))),
    protein_g: Math.max(0, Math.round(toNumber(input.protein_g))),
    carbs_g: Math.max(0, Math.round(toNumber(input.carbs_g))),
    fat_g: Math.max(0, Math.round(toNumber(input.fat_g))),
    fiber_g: Math.max(0, Math.round(toNumber(input.fiber_g))),
  };
}

function deriveTags(p: PortionOption): string[] {
  const tags: string[] = [];
  if (p.protein_g > 20) tags.push("high-protein");
  if (p.carbs_g > 50) tags.push("high-carb");
  if (p.fat_g > 30) tags.push("high-fat");
  if (p.calories < 300) tags.push("low-calorie");
  if (p.calories > 600) tags.push("high-calorie");
  if (p.fiber_g > 5) tags.push("fiber-rich");
  return tags;
}

function normalizeDish(raw: unknown): DescribedDish | null {
  if (!raw || typeof raw !== "object") return null;
  const input = raw as Record<string, unknown>;

  const name = typeof input.name === "string" && input.name.trim() ? input.name.trim() : null;
  if (!name) return null;

  const rawPortions = Array.isArray(input.portions) ? input.portions : [];
  const portions = rawPortions.map(normalizePortion).filter((p): p is PortionOption => Boolean(p));

  // Must have exactly 3 portions; if not, try to pad or reject
  if (portions.length === 0) return null;
  while (portions.length < 3) {
    const last = portions[portions.length - 1];
    const scale = portions.length === 1 ? 1.5 : 2;
    portions.push({
      label: `Larger (~${Math.round(last.weight_g * scale)}g)`,
      weight_g: Math.round(last.weight_g * scale),
      calories: Math.round(last.calories * scale),
      protein_g: Math.round(last.protein_g * scale),
      carbs_g: Math.round(last.carbs_g * scale),
      fat_g: Math.round(last.fat_g * scale),
      fiber_g: Math.round(last.fiber_g * scale),
    });
  }

  const defaultIndex = Math.min(2, Math.max(0, Math.round(toNumber(input.defaultIndex))));
  const defaultPortion = portions[defaultIndex];

  const rawTags = Array.isArray(input.tags)
    ? input.tags.filter((v): v is string => typeof v === "string" && v.trim().length > 0)
    : [];

  return {
    name,
    hindi: typeof input.hindi === "string" ? input.hindi.trim() : "",
    portions: [portions[0], portions[1], portions[2]] as [PortionOption, PortionOption, PortionOption],
    defaultIndex,
    ingredients: Array.isArray(input.ingredients)
      ? input.ingredients.filter((v): v is string => typeof v === "string" && v.trim().length > 0)
      : [],
    confidence: normalizeConfidence(input.confidence),
    tags: rawTags.length > 0 ? rawTags : deriveTags(defaultPortion),
    healthTip:
      typeof input.healthTip === "string" && input.healthTip.trim().length > 0
        ? input.healthTip.trim()
        : "Balance this with vegetables and hydration.",
    reasoning:
      typeof input.reasoning === "string" && input.reasoning.trim().length > 0
        ? input.reasoning.trim()
        : "",
  };
}

function normalizeResult(raw: unknown): DescribeMealResult {
  if (!raw || typeof raw !== "object") return { dishes: [] };
  const input = raw as Record<string, unknown>;
  const dishes = Array.isArray(input.dishes)
    ? input.dishes.map(normalizeDish).filter((d): d is DescribedDish => Boolean(d))
    : [];
  return { dishes };
}

/* ─── Provider: Gemini ─── */

async function tryGemini(prompt: string): Promise<DescribeMealResult | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const genAI = new GoogleGenerativeAI(apiKey);
  const models = ["gemini-2.0-flash-lite"];

  for (const modelName of models) {
    try {
      console.log(`[Describe/Gemini] Trying ${modelName}...`);
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: { temperature: 0.2, maxOutputTokens: 1500 },
      });
      const resultPromise = model.generateContent([prompt]);
      const result = await Promise.race([
        resultPromise,
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Gemini timeout")), PROVIDER_TIMEOUT_MS)),
      ]);
      const parsed = parseJsonResponse(result.response.text());
      console.log(`[Describe/Gemini] Success with ${modelName}`);
      return normalizeResult(parsed);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      console.error(`[Describe/Gemini/${modelName}] ${msg}`);
      if (isRateLimitError(msg) || msg.includes("timeout")) continue;
      throw err;
    }
  }

  console.log("[Describe/Gemini] Rate limited, falling back...");
  return null;
}

/* ─── Provider: OpenAI ─── */

async function tryOpenAI(prompt: string): Promise<DescribeMealResult | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const openai = new OpenAI({ apiKey });

  try {
    console.log("[Describe/OpenAI] Trying gpt-4.1-nano...");
    const resultPromise = openai.chat.completions.create({
      model: "gpt-4.1-nano",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      max_tokens: 1500,
      response_format: { type: "json_object" },
    });
    const result = await Promise.race([
      resultPromise,
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("OpenAI timeout")), PROVIDER_TIMEOUT_MS)),
    ]);

    const text = result.choices[0]?.message?.content || "";
    console.log("[Describe/OpenAI] Raw response length:", text.length);
    const parsed = parseJsonResponse(text);
    console.log("[Describe/OpenAI] Success");
    return normalizeResult(parsed);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    console.error(`[Describe/OpenAI] ${msg}`);
    if (isRateLimitError(msg) || msg.includes("timeout")) return null;
    throw err;
  }
}

/* ─── Provider: Groq ─── */

async function tryGroq(prompt: string): Promise<DescribeMealResult | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  const groq = new Groq({ apiKey });
  const models = [
    "meta-llama/llama-4-scout-17b-16e-instruct",
  ];

  for (const groqModel of models) {
    try {
      console.log(`[Describe/Groq] Trying ${groqModel}...`);
      const resultPromise = groq.chat.completions.create({
        model: groqModel,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
        max_tokens: 1500,
      });
      const result = await Promise.race([
        resultPromise,
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Groq timeout")), PROVIDER_TIMEOUT_MS)),
      ]);

      const text = result.choices[0]?.message?.content || "";
      console.log(`[Describe/Groq] Raw response length:`, text.length);
      const parsed = parseJsonResponse(text);
      console.log(`[Describe/Groq] Success with ${groqModel}`);
      return normalizeResult(parsed);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      console.error(`[Describe/Groq/${groqModel}] ${msg}`);
      if (isRateLimitError(msg) || msg.includes("timeout")) continue;
      throw err;
    }
  }

  console.log("[Describe/Groq] Rate limited");
  return null;
}

/* ─── Route Handler ─── */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const description = typeof body.description === "string" ? body.description.trim() : "";
    const mealType = typeof body.mealType === "string" ? body.mealType.trim() : "unknown";

    if (!description) {
      return NextResponse.json({ error: "Description is required" }, { status: 400 });
    }

    if (description.length > MAX_DESCRIPTION_LENGTH) {
      return NextResponse.json(
        { error: `Description must be ${MAX_DESCRIPTION_LENGTH} characters or less` },
        { status: 400 }
      );
    }

    const cacheKey = getCacheKey(description, mealType);
    const cached = getCached(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const prompt = buildPrompt(description, mealType);
    const errors: string[] = [];
    const startTotal = Date.now();

    // Tier 1: Gemini
    try {
      const t0 = Date.now();
      const result = await tryGemini(prompt);
      const elapsed = Date.now() - t0;
      if (result && result.dishes.length > 0) {
        console.log(`[Describe] Gemini succeeded in ${elapsed}ms (total ${Date.now() - startTotal}ms)`);
        setCache(cacheKey, result);
        return NextResponse.json({ ...result, _provider: "gemini", _latencyMs: elapsed });
      }
      if (result) errors.push(`Gemini returned empty dishes (${elapsed}ms)`);
      else errors.push(`Gemini rate limited or no key (${elapsed}ms)`);
    } catch (err: unknown) {
      errors.push(`Gemini: ${err instanceof Error ? err.message : "failed"}`);
    }

    // Tier 2+3: Race OpenAI and Groq in parallel (fastest valid response wins)
    {
      type ProviderResult = { result: DescribeMealResult; provider: string; elapsed: number };

      const runners: Promise<ProviderResult | null>[] = [];

      if (process.env.OPENAI_API_KEY) {
        runners.push(
          (async () => {
            const t0 = Date.now();
            try {
              const r = await tryOpenAI(prompt);
              const elapsed = Date.now() - t0;
              if (r && r.dishes.length > 0) return { result: r, provider: "openai", elapsed };
              errors.push(`OpenAI returned empty dishes (${elapsed}ms)`);
            } catch (err: unknown) {
              errors.push(`OpenAI: ${err instanceof Error ? err.message : "failed"} (${Date.now() - t0}ms)`);
            }
            return null;
          })()
        );
      }

      if (process.env.GROQ_API_KEY) {
        runners.push(
          (async () => {
            const t0 = Date.now();
            try {
              const r = await tryGroq(prompt);
              const elapsed = Date.now() - t0;
              if (r && r.dishes.length > 0) return { result: r, provider: "groq", elapsed };
              errors.push(`Groq returned empty dishes (${elapsed}ms)`);
            } catch (err: unknown) {
              errors.push(`Groq: ${err instanceof Error ? err.message : "failed"} (${Date.now() - t0}ms)`);
            }
            return null;
          })()
        );
      }

      // First-success race: resolve as soon as ANY provider returns valid data
      if (runners.length > 0) {
        const winner = await new Promise<ProviderResult | null>((resolve) => {
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

        if (winner) {
          const { result, provider, elapsed } = winner;
          console.log(`[Describe] ${provider} won race in ${elapsed}ms (total ${Date.now() - startTotal}ms)`);
          setCache(cacheKey, result);
          return NextResponse.json({ ...result, _provider: provider, _latencyMs: elapsed });
        }
      }
    }

    const hasAnyKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY || process.env.GROQ_API_KEY;
    if (!hasAnyKey) {
      return NextResponse.json(
        { error: "No API keys configured. Add GEMINI_API_KEY, OPENAI_API_KEY, or GROQ_API_KEY to .env.local" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "All AI providers failed. Please try again in a moment.", details: errors },
      { status: 429 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Describe meal API error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
