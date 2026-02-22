import { GoogleGenerativeAI } from "@google/generative-ai";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import type { DishHealthVerdict, HealthVerdict, MealHealthAnalysis } from "@/lib/dishTypes";

/* ─── Constants ─── */

const PROVIDER_TIMEOUT_MS = 8000;

/* ─── Types ─── */

interface DishInput {
  name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  ingredients: string[];
  tags: string[];
}

interface VerdictRequest {
  dishes: DishInput[];
  healthContextString: string;
}

/* ─── Prompt Builder ─── */

function buildVerdictPrompt(dishes: DishInput[], healthContext: string): string {
  const dishList = dishes
    .map(
      (d, i) =>
        `${i + 1}. ${d.name} — ${d.calories} kcal, P:${d.protein_g}g C:${d.carbs_g}g F:${d.fat_g}g Fiber:${d.fiber_g}g | Ingredients: ${d.ingredients.join(", ")} | Tags: ${d.tags.join(", ")}`
    )
    .join("\n");

  return `You are Dr. Capy, a friendly Indian food-health advisor. Analyze this meal for a person with specific health conditions.

PATIENT HEALTH CONTEXT:
${healthContext}

MEAL DISHES:
${dishList}

For EACH dish, provide a health verdict considering the patient's conditions. Return ONLY valid JSON:
{
  "dishVerdicts": [
    {
      "dishName": "exact dish name",
      "verdict": "good|caution|avoid",
      "note": "1-2 sentence explanation specific to their conditions",
      "conditionFlags": ["condition_id that this affects"],
      "swapSuggestion": "healthier alternative if verdict is caution/avoid, null if good"
    }
  ],
  "overallSummary": "1-2 sentence overall meal assessment for this patient",
  "overallVerdict": "good|caution|avoid"
}

RULES:
- verdict: "good" = safe/beneficial, "caution" = okay in moderation/watch portion, "avoid" = strongly discouraged
- Be specific to their conditions (e.g. "High sodium content risky for your hypertension" not generic advice)
- For family history conditions, give gentle nudges not strict warnings
- swapSuggestion should be practical Indian food swaps (e.g. "brown rice instead of white rice", "curd instead of cream")
- overallVerdict = worst verdict among dishes (if any dish is "avoid", overall is "avoid")
- Keep notes concise, warm, and actionable — you're Dr. Capy, not a textbook
- Consider Indian cooking context (ghee, oil types, spice benefits, fermented foods)
- Return ONLY valid JSON, no markdown fences`;
}

/* ─── JSON Parsing ─── */

function parseJsonResponse(text: string): unknown {
  try {
    return JSON.parse(text.trim());
  } catch { /* continue */ }

  const stripped = text.replace(/```(?:json)?\s*/gi, "").replace(/```\s*/g, "").trim();
  try {
    return JSON.parse(stripped);
  } catch { /* continue */ }

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

  if (end === -1) throw new Error("Malformed JSON in AI response");

  return JSON.parse(stripped.slice(start, end + 1));
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

/* ─── Normalization ─── */

function normalizeVerdict(v: unknown): HealthVerdict {
  if (typeof v === "string") {
    const lower = v.toLowerCase().trim();
    if (lower === "good" || lower === "caution" || lower === "avoid") return lower;
  }
  return "caution";
}

function normalizeResult(raw: unknown): MealHealthAnalysis | null {
  if (!raw || typeof raw !== "object") return null;
  const input = raw as Record<string, unknown>;

  const dishVerdicts: DishHealthVerdict[] = [];
  if (Array.isArray(input.dishVerdicts)) {
    for (const dv of input.dishVerdicts) {
      if (!dv || typeof dv !== "object") continue;
      const d = dv as Record<string, unknown>;
      const dishName = typeof d.dishName === "string" ? d.dishName.trim() : "";
      if (!dishName) continue;

      dishVerdicts.push({
        dishName,
        verdict: normalizeVerdict(d.verdict),
        note: typeof d.note === "string" ? d.note.trim() : "No specific concerns.",
        conditionFlags: Array.isArray(d.conditionFlags)
          ? d.conditionFlags.filter((f): f is string => typeof f === "string")
          : [],
        swapSuggestion:
          typeof d.swapSuggestion === "string" && d.swapSuggestion.trim()
            ? d.swapSuggestion.trim()
            : undefined,
      });
    }
  }

  if (dishVerdicts.length === 0) return null;

  return {
    dishVerdicts,
    overallSummary:
      typeof input.overallSummary === "string" && input.overallSummary.trim()
        ? input.overallSummary.trim()
        : "Review the individual dish verdicts above.",
    overallVerdict: normalizeVerdict(input.overallVerdict),
  };
}

/* ─── Provider: Gemini 2.5 Flash ─── */

async function tryGemini(prompt: string): Promise<MealHealthAnalysis | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const genAI = new GoogleGenerativeAI(apiKey);

  try {
    console.log("[HealthVerdict/Gemini] Trying gemini-2.5-flash...");
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: { temperature: 0.3, maxOutputTokens: 1500 },
    });
    const resultPromise = model.generateContent([prompt]);
    const result = await Promise.race([
      resultPromise,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Gemini timeout")), PROVIDER_TIMEOUT_MS)
      ),
    ]);
    const parsed = parseJsonResponse(result.response.text());
    const normalized = normalizeResult(parsed);
    if (normalized) {
      console.log("[HealthVerdict/Gemini] Success");
      return normalized;
    }
    console.warn("[HealthVerdict/Gemini] Empty result after normalization");
    return null;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    console.error(`[HealthVerdict/Gemini] ${msg}`);
    if (isRateLimitError(msg) || msg.includes("timeout")) return null;
    throw err;
  }
}

/* ─── Provider: Claude 3.5 Haiku ─── */

async function tryClaude(prompt: string): Promise<MealHealthAnalysis | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  try {
    console.log("[HealthVerdict/Claude] Trying claude-3-5-haiku...");
    const anthropic = new Anthropic({ apiKey });
    const resultPromise = anthropic.messages.create({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    });
    const result = await Promise.race([
      resultPromise,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Claude timeout")), PROVIDER_TIMEOUT_MS)
      ),
    ]);
    const textBlock = result.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") return null;
    const parsed = parseJsonResponse(textBlock.text);
    const normalized = normalizeResult(parsed);
    if (normalized) {
      console.log("[HealthVerdict/Claude] Success");
      return normalized;
    }
    console.warn("[HealthVerdict/Claude] Empty result after normalization");
    return null;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    console.error(`[HealthVerdict/Claude] ${msg}`);
    if (isRateLimitError(msg) || msg.includes("timeout")) return null;
    throw err;
  }
}

/* ─── Provider: OpenAI GPT-4.1-mini ─── */

async function tryOpenAI(prompt: string): Promise<MealHealthAnalysis | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  try {
    console.log("[HealthVerdict/OpenAI] Trying gpt-4.1-mini...");
    const openai = new OpenAI({ apiKey });
    const resultPromise = openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 1500,
    });
    const result = await Promise.race([
      resultPromise,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("OpenAI timeout")), PROVIDER_TIMEOUT_MS)
      ),
    ]);
    const text = result.choices[0]?.message?.content;
    if (!text) return null;
    const parsed = parseJsonResponse(text);
    const normalized = normalizeResult(parsed);
    if (normalized) {
      console.log("[HealthVerdict/OpenAI] Success");
      return normalized;
    }
    console.warn("[HealthVerdict/OpenAI] Empty result after normalization");
    return null;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    console.error(`[HealthVerdict/OpenAI] ${msg}`);
    if (isRateLimitError(msg) || msg.includes("timeout")) return null;
    throw err;
  }
}

/* ─── POST Handler ─── */

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as VerdictRequest;
    const { dishes, healthContextString } = body;

    if (!dishes || !Array.isArray(dishes) || dishes.length === 0) {
      return NextResponse.json({ error: "dishes array is required" }, { status: 400 });
    }

    if (!healthContextString || typeof healthContextString !== "string" || !healthContextString.trim()) {
      return NextResponse.json({ error: "healthContextString is required" }, { status: 400 });
    }

    const prompt = buildVerdictPrompt(dishes, healthContextString);
    const errors: string[] = [];
    const startTotal = Date.now();

    // Tier 1: Gemini 2.5 Flash
    try {
      const t0 = Date.now();
      const result = await tryGemini(prompt);
      const elapsed = Date.now() - t0;
      if (result) {
        console.log(`[HealthVerdict] Gemini succeeded in ${elapsed}ms (total ${Date.now() - startTotal}ms)`);
        return NextResponse.json({ ...result, _provider: "gemini", _latencyMs: elapsed });
      }
      errors.push(`Gemini: no result (${elapsed}ms)`);
    } catch (err: unknown) {
      errors.push(`Gemini: ${err instanceof Error ? err.message : "failed"}`);
    }

    // Tier 2: Claude 3.5 Haiku
    try {
      const t0 = Date.now();
      const result = await tryClaude(prompt);
      const elapsed = Date.now() - t0;
      if (result) {
        console.log(`[HealthVerdict] Claude succeeded in ${elapsed}ms (total ${Date.now() - startTotal}ms)`);
        return NextResponse.json({ ...result, _provider: "claude", _latencyMs: elapsed });
      }
      errors.push(`Claude: no result (${elapsed}ms)`);
    } catch (err: unknown) {
      errors.push(`Claude: ${err instanceof Error ? err.message : "failed"}`);
    }

    // Tier 3: OpenAI GPT-4.1-mini
    try {
      const t0 = Date.now();
      const result = await tryOpenAI(prompt);
      const elapsed = Date.now() - t0;
      if (result) {
        console.log(`[HealthVerdict] OpenAI succeeded in ${elapsed}ms (total ${Date.now() - startTotal}ms)`);
        return NextResponse.json({ ...result, _provider: "openai", _latencyMs: elapsed });
      }
      errors.push(`OpenAI: no result (${elapsed}ms)`);
    } catch (err: unknown) {
      errors.push(`OpenAI: ${err instanceof Error ? err.message : "failed"}`);
    }

    const hasAnyKey =
      process.env.GEMINI_API_KEY || process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY;
    if (!hasAnyKey) {
      return NextResponse.json(
        { error: "No API keys configured for health verdicts." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "All AI providers failed for health verdict.", details: errors },
      { status: 429 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Health verdict API error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
