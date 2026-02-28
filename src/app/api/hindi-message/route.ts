import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { checkRateLimit } from "@/lib/rateLimit";
import { validateString, validateArray } from "@/lib/validateInput";

function buildHindiPrompt(servings: number): string {
  const servingHint = servings === 1
    ? "एक प्लेट / एक आदमी के लिए"
    : `${servings} लोगों के लिए`;

  return `You are a helpful Indian household assistant. Generate a SHORT, casual Hindi message (in Devanagari script) to send to a cook/bhaiya asking them to prepare a specific dish.

Rules:
- Write in natural spoken Hindi (Devanagari), like how a family member would talk to their cook
- Keep it very short — 2-3 sentences max
- Mention the dish name
- Mention it should be made for ${servingHint} (${servings} people)
- Mention key ingredients are in the fridge
- Don't include full recipe steps — the cook knows how to cook
- Be polite but casual (use "bhaiya" or respectful tone)
- Example for 2 people: "भैया, आज लंच में 2 लोगों के लिए पनीर मटर बना दीजिए। पनीर, मटर, टमाटर सब फ्रिज में है।"
- Example for 1 person: "भैया, आज एक प्लेट दाल तड़का बना दीजिए। दाल और टमाटर फ्रिज में है।"

Respond with ONLY the Hindi message text, nothing else. No quotes, no explanation.`;
}

export async function POST(request: NextRequest) {
  try {
    const blocked = await checkRateLimit(request, "light");
    if (blocked) return blocked;

    const { recipeName, recipeHindi, ingredientsUsed, servings = 2 } = await request.json();

    if (!recipeName) {
      return NextResponse.json({ error: "Recipe name required" }, { status: 400 });
    }

    const nameErr = validateString(recipeName, 200, "recipeName");
    if (nameErr) return NextResponse.json({ error: nameErr }, { status: 400 });
    const ingErr = validateArray(ingredientsUsed, 50, "ingredientsUsed");
    if (ingErr) return NextResponse.json({ error: ingErr }, { status: 400 });

    const userMsg = `Dish: ${recipeName} (${recipeHindi || ""}). For ${servings} people. Ingredients available: ${ingredientsUsed?.join(", ") || "various items"}`;

    // Use Groq (free) to generate the Hindi text
    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) {
      return NextResponse.json({ error: "No GROQ_API_KEY configured" }, { status: 500 });
    }

    const groq = new Groq({ apiKey: groqKey });
    const result = await groq.chat.completions.create({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [
        { role: "system", content: buildHindiPrompt(servings) },
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
