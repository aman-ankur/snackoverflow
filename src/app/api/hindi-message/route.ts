import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const HINDI_PROMPT = `You are a helpful Indian household assistant. Generate a SHORT, casual Hindi message (in Devanagari script) to send to a cook/bhaiya asking them to prepare a specific dish.

Rules:
- Write in natural spoken Hindi (Devanagari), like how a family member would talk to their cook
- Keep it very short — 1-2 sentences max
- Mention the dish name and key ingredients they should use
- Don't include full recipe steps — the cook knows how to cook
- Be polite but casual (use "bhaiya" or respectful tone)
- Example: "भैया, आज लंच में पनीर मटर बना दीजिए। पनीर, मटर, टमाटर सब फ्रिज में है।"

Respond with ONLY the Hindi message text, nothing else. No quotes, no explanation.`;

export async function POST(request: NextRequest) {
  try {
    const { recipeName, recipeHindi, ingredientsUsed } = await request.json();

    if (!recipeName) {
      return NextResponse.json({ error: "Recipe name required" }, { status: 400 });
    }

    const userMsg = `Dish: ${recipeName} (${recipeHindi || ""}). Ingredients available: ${ingredientsUsed?.join(", ") || "various items"}`;

    // Use Groq (free) to generate the Hindi text
    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) {
      return NextResponse.json({ error: "No GROQ_API_KEY configured" }, { status: 500 });
    }

    const groq = new Groq({ apiKey: groqKey });
    const result = await groq.chat.completions.create({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [
        { role: "system", content: HINDI_PROMPT },
        { role: "user", content: userMsg },
      ],
      temperature: 0.7,
      max_tokens: 200,
    });

    const hindiText = result.choices[0]?.message?.content?.trim() || "";

    if (!hindiText) {
      return NextResponse.json({ error: "Failed to generate Hindi message" }, { status: 500 });
    }

    return NextResponse.json({ hindiText });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Hindi message error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
