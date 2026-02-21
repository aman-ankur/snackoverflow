import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";

function buildPrompt(input: {
  streak: number;
  flowers: number;
  treeLevel: number;
  todayCalories: number;
  calorieGoal: number;
  todayProtein: number;
  proteinGoal: number;
  gardenHealth: number;
  timeOfDay: string;
}): string {
  return `You are Capy, a cute capybara mascot in a nutrition tracking app. You live in a virtual garden that grows when the user logs meals and hits their goals.

Current state:
- Streak: ${input.streak} days
- Garden: ${input.flowers} flowers, tree level ${input.treeLevel}, health ${input.gardenHealth}%
- Today: ${input.todayCalories}/${input.calorieGoal} kcal, ${input.todayProtein}/${input.proteinGoal}g protein
- Time: ${input.timeOfDay}

Generate a SHORT (1-2 sentences max) motivational message from Capy to the user. Be warm, playful, and encouraging. Reference the garden state when relevant. Use 1-2 emojis max. Do NOT use hashtags.

Also pick a mood from: happy, excited, sleepy, motivated, concerned

Respond in JSON only: {"message": "...", "mood": "..."}`;
}

function parseJsonResponse(text: string) {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON found");
  return JSON.parse(jsonMatch[0]);
}

async function tryGemini(prompt: string): Promise<{ message: string; mood: string } | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });
    const result = await model.generateContent(prompt);
    return parseJsonResponse(result.response.text());
  } catch (err) {
    console.error("[Capy/Gemini]", err instanceof Error ? err.message : err);
    return null;
  }
}

async function tryGroq(prompt: string): Promise<{ message: string; mood: string } | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  try {
    const groq = new Groq({ apiKey });
    const result = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 150,
    });
    const text = result.choices[0]?.message?.content || "";
    return parseJsonResponse(text);
  } catch (err) {
    console.error("[Capy/Groq]", err instanceof Error ? err.message : err);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const input = await request.json();
    const prompt = buildPrompt(input);

    // Try Gemini first, then Groq
    const result = (await tryGemini(prompt)) || (await tryGroq(prompt));

    if (result) {
      return NextResponse.json(result);
    }

    // Fallback
    return NextResponse.json({
      message: "Keep going! Every meal logged helps your garden grow! 🌱",
      mood: "happy",
    });
  } catch (err) {
    console.error("[Capy API]", err instanceof Error ? err.message : err);
    return NextResponse.json({
      message: "Let's grow our garden together! 🌿",
      mood: "happy",
    });
  }
}
