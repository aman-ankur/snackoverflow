import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are a smart Indian kitchen assistant AI. You analyze images of food items, groceries, and fridge contents.

Your job:
1. Identify ALL food items, ingredients, vegetables, fruits, dairy products, packaged goods, condiments, and beverages visible in the image.
2. Be very specific — say "paneer" not "cheese block", say "green chili" not "pepper", say "toor dal" not "lentils" if you can tell.
3. Include quantities/amounts if visible (e.g., "3 tomatoes", "1 bottle of milk").
4. Based on the identified items, suggest 3-5 Indian recipes that can be made TODAY with these ingredients.
5. For each recipe, include: name (English + Hindi), time to cook, difficulty, brief description, and key steps.

Respond ONLY in this exact JSON format (no markdown, no backticks):
{
  "items": [
    { "name": "Tomato", "hindi": "टमाटर", "quantity": "4", "confidence": "high" },
    { "name": "Onion", "hindi": "प्याज़", "quantity": "2", "confidence": "high" }
  ],
  "recipes": [
    {
      "name": "Aloo Gobi",
      "hindi": "आलू गोभी",
      "time": "30 min",
      "difficulty": "Easy",
      "description": "Classic dry curry with potatoes and cauliflower",
      "ingredients_used": ["Potato", "Cauliflower", "Onion", "Tomato"],
      "ingredients_needed": ["Cumin seeds", "Turmeric"],
      "steps": ["Heat oil, add cumin seeds", "Add onions and sauté", "Add vegetables and spices", "Cook covered for 20 min"],
      "tags": ["vegetarian", "north-indian"]
    }
  ],
  "tip": "A short fun cooking tip or suggestion based on what you see"
}

Rules:
- If the image is blurry or unclear, still try your best and set confidence to "low".
- If no food items are visible, return empty items array and explain in the tip field.
- Always suggest Indian recipes (North Indian, South Indian, street food, etc.)
- Prioritize recipes that use MOST of the detected ingredients.
- ingredients_needed should list common Indian pantry staples the user likely already has.`;

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

// --- Provider: Gemini ---
async function tryGemini(base64Data: string): Promise<object | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const genAI = new GoogleGenerativeAI(apiKey);
  const imageContent = {
    inlineData: { mimeType: "image/jpeg" as const, data: base64Data },
  };

  const models = ["gemini-2.0-flash", "gemini-2.0-flash-lite"];

  for (const modelName of models) {
    try {
      console.log(`[Gemini] Trying ${modelName}...`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent([SYSTEM_PROMPT, imageContent]);
      const parsed = parseJsonResponse(result.response.text());
      console.log(`[Gemini] Success with ${modelName}`);
      return parsed;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      console.error(`[Gemini/${modelName}] ${msg}`);
      if (isRateLimitError(msg)) continue;
      throw err; // non-rate-limit error, bubble up
    }
  }

  console.log("[Gemini] All models rate limited, falling back...");
  return null; // all rate limited
}

// --- Provider: Groq (Llama Vision - free) ---
async function tryGroq(base64Data: string): Promise<object | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  const groq = new Groq({ apiKey });

  try {
    console.log("[Groq] Trying llama-4-scout-17b-16e-instruct...");
    const result = await groq.chat.completions.create({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: SYSTEM_PROMPT },
            {
              type: "image_url",
              image_url: { url: `data:image/jpeg;base64,${base64Data}` },
            },
          ],
        },
      ],
      temperature: 0.3,
      max_tokens: 2048,
    });

    const text = result.choices[0]?.message?.content || "";
    const parsed = parseJsonResponse(text);
    console.log("[Groq] Success");
    return parsed;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    console.error(`[Groq] ${msg}`);
    if (isRateLimitError(msg)) return null;
    throw err;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { image } = await request.json();

    if (!image) {
      return NextResponse.json(
        { error: "Image data is required" },
        { status: 400 }
      );
    }

    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");

    // Try providers in order: Gemini → Groq
    const errors: string[] = [];

    // 1. Try Gemini
    try {
      const result = await tryGemini(base64Data);
      if (result) return NextResponse.json(result);
      errors.push("Gemini rate limited");
    } catch (err: unknown) {
      errors.push(`Gemini: ${err instanceof Error ? err.message : "failed"}`);
    }

    // 2. Try Groq
    try {
      const result = await tryGroq(base64Data);
      if (result) return NextResponse.json(result);
      errors.push("Groq rate limited or no key");
    } catch (err: unknown) {
      errors.push(`Groq: ${err instanceof Error ? err.message : "failed"}`);
    }

    // All providers failed
    const hasAnyKey = process.env.GEMINI_API_KEY || process.env.GROQ_API_KEY;
    if (!hasAnyKey) {
      return NextResponse.json(
        { error: "No API keys configured. Add GEMINI_API_KEY or GROQ_API_KEY to .env.local" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "All AI providers are rate limited. Please wait 30s and try again." },
      { status: 429 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("API error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
