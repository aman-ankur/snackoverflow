import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import Groq from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rateLimit";

export const maxDuration = 30;
import { validateString } from "@/lib/validateInput";
import type {
  EatingReport,
  AnalysisScore,
  TrendDirection,
  ReportInsight,
  ActionItem,
  PeriodComparison,
  InsightCategory,
  InsightSeverity,
} from "@/lib/dishTypes";

/* ─── Constants ─── */

const PROVIDER_TIMEOUT_MS = 15000;

/* ─── Types ─── */

interface AnalyzeRequest {
  aggregateSummary: string;
  healthContext: string;
  previousSummary?: string;
  goalCalories: number;
  goalProtein: number;
}

/* ─── Prompt ─── */

function buildPrompt(req: AnalyzeRequest): string {
  const healthBlock = req.healthContext
    ? `\nPATIENT HEALTH CONTEXT:\n${req.healthContext}\n`
    : "\nNo specific health conditions reported.\n";

  const comparisonBlock = req.previousSummary
    ? `\nPREVIOUS PERIOD REPORT SUMMARY:\n${req.previousSummary}\nCompare current period against this and note improvements or regressions.\n`
    : "";

  return `You are Dr. Capy, a warm but data-driven Indian nutrition coach. Analyze this pre-computed eating data and produce a structured report.

EATING DATA:
${req.aggregateSummary}
${healthBlock}${comparisonBlock}
Return ONLY valid JSON matching this exact structure:
{
  "score": "great|good|needs_work|concerning",
  "scoreSummary": "1-2 sentence overall assessment in mixed tone (data first, then warm encouragement or gentle nudge)",
  "trends": {
    "calories": "improving|stable|declining",
    "protein": "improving|stable|declining",
    "carbs": "improving|stable|declining",
    "fat": "improving|stable|declining"
  },
  "insights": [
    {
      "category": "temporal|macro|variety|goal",
      "title": "Short punchy title (e.g. 'Weekend Calorie Spike')",
      "detail": "1-2 sentence data-backed observation with specific numbers, then a warm note",
      "severity": "positive|neutral|warning"
    }
  ],
  "healthNotes": ["condition-specific dietary observations, empty array if no health context"],
  "actionItems": [
    {
      "priority": 1,
      "text": "Specific, actionable suggestion with Indian food examples",
      "relatedInsight": "title of related insight"
    }
  ],
  "comparison": {
    "caloriesDelta": 0,
    "proteinDelta": 0,
    "topImprovement": "best improvement vs previous period",
    "topRegression": "biggest regression or null"
  }
}

RULES:
- Pick the 5-7 MOST interesting insights from the data. Prioritize hidden patterns over obvious observations.
- Temporal patterns: weekend vs weekday, breakfast skipping impact, late dinners, snack clustering
- Macro patterns: protein distribution across meals, carb-heavy days, invisible snack calories, fiber gaps
- Variety: diet monotony, repeat offenders (high-frequency unhealthy items), missing food groups
- Goal: calorie target adherence rate, protein shortfall, best/worst day analysis
- For health conditions: connect specific eating patterns to condition risks (e.g. sodium + hypertension, GI + diabetes)
- Tone: data-first with warmth. "Your protein averaged 78g vs 120g target. Small wins: you nailed it on Tuesday!"
- Action items: 3-5 items, practical Indian food swaps (paneer, dal, makhana, brown rice, etc.)
- comparison: only include if previous period data was provided, otherwise omit the field
- score: "great" = on track most days, "good" = mostly fine with minor gaps, "needs_work" = significant gaps, "concerning" = multiple serious issues
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

const VALID_SCORES = new Set(["great", "good", "needs_work", "concerning"]);
const VALID_TRENDS = new Set(["improving", "stable", "declining"]);
const VALID_CATEGORIES = new Set(["temporal", "macro", "variety", "goal"]);
const VALID_SEVERITIES = new Set(["positive", "neutral", "warning"]);

function normalizeScore(v: unknown): AnalysisScore {
  if (typeof v === "string" && VALID_SCORES.has(v)) return v as AnalysisScore;
  return "needs_work";
}

function normalizeTrend(v: unknown): TrendDirection {
  if (typeof v === "string" && VALID_TRENDS.has(v)) return v as TrendDirection;
  return "stable";
}

function normalizeInsight(raw: unknown): ReportInsight | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const title = typeof r.title === "string" ? r.title.trim() : "";
  const detail = typeof r.detail === "string" ? r.detail.trim() : "";
  if (!title || !detail) return null;

  return {
    category: (typeof r.category === "string" && VALID_CATEGORIES.has(r.category)
      ? r.category
      : "macro") as InsightCategory,
    title,
    detail,
    severity: (typeof r.severity === "string" && VALID_SEVERITIES.has(r.severity)
      ? r.severity
      : "neutral") as InsightSeverity,
  };
}

function normalizeAction(raw: unknown): ActionItem | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const text = typeof r.text === "string" ? r.text.trim() : "";
  if (!text) return null;

  const priority = typeof r.priority === "number" && r.priority >= 1 && r.priority <= 3
    ? (r.priority as 1 | 2 | 3)
    : 2;

  return {
    priority,
    text,
    relatedInsight: typeof r.relatedInsight === "string" ? r.relatedInsight.trim() : undefined,
  };
}

function normalizeComparison(raw: unknown): PeriodComparison | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const r = raw as Record<string, unknown>;
  const topImprovement = typeof r.topImprovement === "string" ? r.topImprovement.trim() : "";
  if (!topImprovement) return undefined;

  return {
    caloriesDelta: typeof r.caloriesDelta === "number" ? Math.round(r.caloriesDelta) : 0,
    proteinDelta: typeof r.proteinDelta === "number" ? Math.round(r.proteinDelta) : 0,
    topImprovement,
    topRegression: typeof r.topRegression === "string" && r.topRegression.trim()
      ? r.topRegression.trim()
      : undefined,
  };
}

function normalizeReport(raw: unknown): EatingReport | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;

  const scoreSummary = typeof r.scoreSummary === "string" ? r.scoreSummary.trim() : "";
  if (!scoreSummary) return null;

  const trendsRaw = r.trends && typeof r.trends === "object" ? r.trends as Record<string, unknown> : {};

  const insights = Array.isArray(r.insights)
    ? r.insights.map(normalizeInsight).filter((i): i is ReportInsight => Boolean(i))
    : [];

  const actionItems = Array.isArray(r.actionItems)
    ? r.actionItems.map(normalizeAction).filter((a): a is ActionItem => Boolean(a))
    : [];

  const healthNotes = Array.isArray(r.healthNotes)
    ? r.healthNotes.filter((n): n is string => typeof n === "string" && n.trim().length > 0)
    : [];

  if (insights.length === 0) return null;

  return {
    score: normalizeScore(r.score),
    scoreSummary,
    trends: {
      calories: normalizeTrend(trendsRaw.calories),
      protein: normalizeTrend(trendsRaw.protein),
      carbs: normalizeTrend(trendsRaw.carbs),
      fat: normalizeTrend(trendsRaw.fat),
    },
    insights: insights.slice(0, 7),
    healthNotes,
    actionItems: actionItems.slice(0, 5).sort((a, b) => a.priority - b.priority),
    comparison: normalizeComparison(r.comparison),
  };
}

/* ─── Provider: Gemini 2.5 Flash ─── */

async function tryGemini(prompt: string): Promise<EatingReport | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const genAI = new GoogleGenerativeAI(apiKey);

  try {
    console.log("[AnalyzeHabits/Gemini] Trying gemini-2.5-flash...");
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: { temperature: 0.3, maxOutputTokens: 1200 },
    });
    const resultPromise = model.generateContent([prompt]);
    const result = await Promise.race([
      resultPromise,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Gemini timeout")), PROVIDER_TIMEOUT_MS)
      ),
    ]);
    const parsed = parseJsonResponse(result.response.text());
    const normalized = normalizeReport(parsed);
    if (normalized) {
      console.log("[AnalyzeHabits/Gemini] Success");
      return normalized;
    }
    console.warn("[AnalyzeHabits/Gemini] Empty result after normalization");
    return null;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    console.error(`[AnalyzeHabits/Gemini] ${msg}`);
    if (isRateLimitError(msg) || msg.includes("timeout")) return null;
    throw err;
  }
}

/* ─── Provider: OpenAI GPT-4.1-mini ─── */

async function tryOpenAI(prompt: string): Promise<EatingReport | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  try {
    console.log("[AnalyzeHabits/OpenAI] Trying gpt-4.1-mini...");
    const openai = new OpenAI({ apiKey });
    const resultPromise = openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 1200,
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
    const normalized = normalizeReport(parsed);
    if (normalized) {
      console.log("[AnalyzeHabits/OpenAI] Success");
      return normalized;
    }
    console.warn("[AnalyzeHabits/OpenAI] Empty result after normalization");
    return null;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    console.error(`[AnalyzeHabits/OpenAI] ${msg}`);
    if (isRateLimitError(msg) || msg.includes("timeout")) return null;
    throw err;
  }
}

/* ─── Provider: Groq Llama 4 Scout ─── */

async function tryGroq(prompt: string): Promise<EatingReport | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  try {
    console.log("[AnalyzeHabits/Groq] Trying llama-4-scout...");
    const groq = new Groq({ apiKey });
    const resultPromise = groq.chat.completions.create({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 1200,
    });
    const result = await Promise.race([
      resultPromise,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Groq timeout")), PROVIDER_TIMEOUT_MS)
      ),
    ]);
    const text = result.choices[0]?.message?.content;
    if (!text) return null;
    const parsed = parseJsonResponse(text);
    const normalized = normalizeReport(parsed);
    if (normalized) {
      console.log("[AnalyzeHabits/Groq] Success");
      return normalized;
    }
    console.warn("[AnalyzeHabits/Groq] Empty result after normalization");
    return null;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    console.error(`[AnalyzeHabits/Groq] ${msg}`);
    if (isRateLimitError(msg) || msg.includes("timeout")) return null;
    throw err;
  }
}

/* ─── POST Handler ─── */

export async function POST(request: NextRequest) {
  try {
    const blocked = await checkRateLimit(request, "medium");
    if (blocked) return blocked;

    const body = (await request.json()) as AnalyzeRequest;
    const { aggregateSummary, healthContext, previousSummary } = body;

    if (!aggregateSummary || typeof aggregateSummary !== "string" || !aggregateSummary.trim()) {
      return NextResponse.json({ error: "aggregateSummary is required" }, { status: 400 });
    }

    const summaryErr = validateString(aggregateSummary, 10_000, "aggregateSummary");
    if (summaryErr) return NextResponse.json({ error: summaryErr }, { status: 400 });
    const healthErr = validateString(healthContext, 5_000, "healthContext");
    if (healthErr) return NextResponse.json({ error: healthErr }, { status: 400 });

    const prompt = buildPrompt({
      aggregateSummary,
      healthContext: healthContext ?? "",
      previousSummary: previousSummary ?? undefined,
      goalCalories: typeof body.goalCalories === "number" ? body.goalCalories : 2000,
      goalProtein: typeof body.goalProtein === "number" ? body.goalProtein : 100,
    });

    const errors: string[] = [];
    const startTotal = Date.now();

    // Tier 1: Gemini 2.5 Flash (free)
    try {
      const t0 = Date.now();
      const result = await tryGemini(prompt);
      const elapsed = Date.now() - t0;
      if (result) {
        console.log(`[AnalyzeHabits] Gemini succeeded in ${elapsed}ms (total ${Date.now() - startTotal}ms)`);
        return NextResponse.json({ report: result, _provider: "gemini", _latencyMs: elapsed });
      }
      errors.push(`Gemini: no result (${elapsed}ms)`);
    } catch (err: unknown) {
      errors.push(`Gemini: ${err instanceof Error ? err.message : "failed"}`);
    }

    // Tier 2: OpenAI GPT-4.1-mini
    try {
      const t0 = Date.now();
      const result = await tryOpenAI(prompt);
      const elapsed = Date.now() - t0;
      if (result) {
        console.log(`[AnalyzeHabits] OpenAI succeeded in ${elapsed}ms (total ${Date.now() - startTotal}ms)`);
        return NextResponse.json({ report: result, _provider: "openai", _latencyMs: elapsed });
      }
      errors.push(`OpenAI: no result (${elapsed}ms)`);
    } catch (err: unknown) {
      errors.push(`OpenAI: ${err instanceof Error ? err.message : "failed"}`);
    }

    // Tier 3: Groq Llama 4 Scout (emergency)
    try {
      const t0 = Date.now();
      const result = await tryGroq(prompt);
      const elapsed = Date.now() - t0;
      if (result) {
        console.log(`[AnalyzeHabits] Groq succeeded in ${elapsed}ms (total ${Date.now() - startTotal}ms)`);
        return NextResponse.json({ report: result, _provider: "groq", _latencyMs: elapsed });
      }
      errors.push(`Groq: no result (${elapsed}ms)`);
    } catch (err: unknown) {
      errors.push(`Groq: ${err instanceof Error ? err.message : "failed"}`);
    }

    const hasAnyKey =
      process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY || process.env.GROQ_API_KEY;
    if (!hasAnyKey) {
      return NextResponse.json(
        { error: "No API keys configured for eating analysis." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "All AI providers failed for eating analysis.", details: errors },
      { status: 429 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Analyze habits API error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
