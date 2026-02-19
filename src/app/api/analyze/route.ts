import { GoogleGenerativeAI } from "@google/generative-ai";
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

export async function POST(request: NextRequest) {
  try {
    const { image } = await request.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY not set in .env.local" },
        { status: 500 }
      );
    }

    if (!image) {
      return NextResponse.json(
        { error: "Image data is required" },
        { status: 400 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");

    const imageContent = {
      inlineData: {
        mimeType: "image/jpeg" as const,
        data: base64Data,
      },
    };

    // Try primary model, fallback to lite on rate limit
    const models = ["gemini-2.0-flash", "gemini-2.0-flash-lite"];
    let lastError: string = "";

    for (const modelName of models) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent([SYSTEM_PROMPT, imageContent]);
        const responseText = result.response.text();

        // Parse JSON from response (handle potential markdown wrapping)
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          return NextResponse.json(
            { error: "Failed to parse AI response" },
            { status: 500 }
          );
        }

        const parsed = JSON.parse(jsonMatch[0]);
        return NextResponse.json(parsed);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "";
        console.error(`[${modelName}] error:`, msg);

        // If rate limited, try next model
        if (msg.includes("429") || msg.includes("quota") || msg.includes("RESOURCE_EXHAUSTED")) {
          lastError = msg;
          continue;
        }

        // Non-rate-limit error, return immediately
        return NextResponse.json({ error: msg || "Analysis failed" }, { status: 500 });
      }
    }

    // All models rate limited — extract retry delay if available
    const retryMatch = lastError.match(/retry in ([\d.]+)/i);
    const retrySec = retryMatch ? Math.ceil(parseFloat(retryMatch[1])) : 30;

    return NextResponse.json(
      { error: `Rate limited. Please wait ${retrySec}s and try again.` },
      { status: 429 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Gemini API error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
