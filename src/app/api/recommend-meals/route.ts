import Groq from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";
import { AI_MODELS } from "@/lib/aiModels";
import { generateGeminiContent } from "@/lib/gemini";
import type { MealMemoryItem } from "@/lib/recommendations";
import type { MealRecommendation, MealType } from "@/lib/dishTypes";

const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "snack", "dinner"];
const DAY = 86400000;
const isMealType = (value: unknown): value is MealType => typeof value === "string" && MEAL_TYPES.includes(value as MealType);
const daysAgo = (date: string, now = Date.now()) => Math.max(0, Math.floor((now - new Date(date).getTime()) / DAY));
const title = (item: MealMemoryItem) => item.dishes.join(" + ");

export function rankFamiliar(memory: MealMemoryItem[], mealType: MealType, remainingCalories: number): MealMemoryItem[] {
  return memory.filter((m) => m.mealType === mealType && m.dishes.length > 0).sort((a, b) => {
    const calorieFit = (m: MealMemoryItem) => remainingCalories > 0 && m.totals.calories <= remainingCalories ? 1 : 0;
    return calorieFit(b) - calorieFit(a) || b.frequency - a.frequency || new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime();
  });
}

export function normalizeSimilar(raw: unknown, memory: MealMemoryItem[], mealType: MealType, excludedTitles: string[] = []): MealRecommendation[] {
  if (!Array.isArray(raw)) return [];
  const allowedIds = new Set(memory.filter((m) => m.mealType === mealType).flatMap((m) => m.basedOnMealIds));
  const seen = new Set(excludedTitles.map((value) => value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()));
  return raw.flatMap((value, index) => {
    if (!value || typeof value !== "object") return [];
    const item = value as Record<string, unknown>;
    const name = typeof item.title === "string" ? item.title.trim() : "";
    const ids = Array.isArray(item.basedOnMealIds) ? item.basedOnMealIds.filter((id): id is string => typeof id === "string" && allowedIds.has(id)) : [];
    const candidateType = item.mealType;
    const confidence = item.confidence;
    const key = name.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    if (!name || !key || seen.has(key) || candidateType !== mealType || (confidence !== "high" && confidence !== "medium") || ids.length === 0) return [];
    seen.add(key);
    const adjustments = Array.isArray(item.adjustments) ? item.adjustments.filter((v): v is string => typeof v === "string").slice(0, 2) : [];
    return [{ id: `similar-${index}-${key}`, source: "similar", mealType, kind: "similar", title: name, reason: typeof item.reason === "string" && item.reason.trim() ? item.reason.trim() : `Inspired by your ${mealType} pattern.`, adjustments, basedOnMealIds: ids }];
  });
}

function parseJson(text: string): unknown {
  const cleaned = text.replace(/```json?\s*/gi, "").replace(/```/g, "").trim();
  try { return JSON.parse(cleaned); } catch { const match = cleaned.match(/\[[\s\S]*\]/); return match ? JSON.parse(match[0]) : []; }
}

function buildPrompt(input: { mealType: MealType; memory: MealMemoryItem[]; remainingCalories: number; dietPreference?: string; healthContext?: string }) {
  const history = input.memory.filter((m) => m.mealType === input.mealType).map((m) => ({ ids: m.basedOnMealIds, dishes: m.dishes, ingredients: m.ingredients, tags: m.tags, calories: m.totals.calories, frequency: m.frequency }));
  return `Return JSON array only. Suggest at most one NEW similar food idea for ${input.mealType}. It must explicitly be suitable as ${input.mealType}, and must be grounded in the supplied ${input.mealType} history (ingredients, tags, cuisine, or nutrition pattern). Never claim the new idea was logged. Never suggest another meal type. Never invent history IDs.
Context: remaining calories today=${input.remainingCalories}; diet=${input.dietPreference || "not specified"}; health context=${input.healthContext || "not specified"}.
History (the only allowed basedOnMealIds): ${JSON.stringify(history)}
Schema: [{"title":"...","mealType":"${input.mealType}","confidence":"high|medium","reason":"Inspired by your ${input.mealType} pattern.","adjustments":["..."],"basedOnMealIds":["existing id"]}]`;
}

async function generateSimilar(prompt: string): Promise<unknown> {
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) try { return parseJson(await generateGeminiContent({ apiKey: geminiKey, model: AI_MODELS.gemini.fastText, prompt, maxOutputTokens: 400, json: true })); } catch { /* fallback */ }
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey) try {
    const result = await new Groq({ apiKey: groqKey }).chat.completions.create({ model: AI_MODELS.groq.fastTextFallback, messages: [{ role: "user", content: prompt }], temperature: 0.3, max_tokens: 400 });
    return parseJson(result.choices[0]?.message?.content || "[]");
  } catch { /* no provider available */ }
  return [];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { memory?: MealMemoryItem[]; todayTotals?: Record<string, number>; goals?: Record<string, number>; mealType?: MealType; dietPreference?: string; healthContext?: string };
    const mealType = isMealType(body.mealType) ? body.mealType : "lunch";
    const memory = Array.isArray(body.memory) ? body.memory.filter((m) => m && isMealType(m.mealType) && Array.isArray(m.dishes) && Array.isArray(m.basedOnMealIds)) : [];
    const remainingCalories = Math.max(0, Number(body.goals?.calories || 0) - Number(body.todayTotals?.calories || 0));
    const familiar = rankFamiliar(memory, mealType, remainingCalories);
    // Two occurrences support a normal familiar lane; one recent exact match supports one card only.
    const familiarCards = familiar.filter((item) => item.frequency >= 2).slice(0, 2);
    if (familiarCards.length === 0 && familiar[0] && daysAgo(familiar[0].loggedAt) <= 2) familiarCards.push(familiar[0]);
    const cards: MealRecommendation[] = familiarCards.map((item) => ({ id: `history-${item.id}`, source: "history", mealType, kind: "familiar", title: title(item), reason: `${mealType[0].toUpperCase() + mealType.slice(1)} · last had ${daysAgo(item.loggedAt)} days ago.`, adjustments: [], basedOnMealIds: item.basedOnMealIds, representativeMealId: item.id, lastHadDaysAgo: daysAgo(item.loggedAt) }));
    const currentHistory = memory.filter((m) => m.mealType === mealType);
    if (currentHistory.length > 0) {
      const generated = await generateSimilar(buildPrompt({ mealType, memory, remainingCalories, dietPreference: body.dietPreference, healthContext: body.healthContext }));
      cards.push(...normalizeSimilar(generated, memory, mealType, familiarCards.map(title)).slice(0, 1));
    }
    return NextResponse.json({ recommendations: cards.slice(0, 3) });
  } catch { return NextResponse.json({ recommendations: [] }); }
}
