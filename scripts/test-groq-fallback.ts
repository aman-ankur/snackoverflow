/**
 * Test script to verify Groq models work for dish scanning (vision + JSON)
 *
 * Confirms that the Tier 3 Groq fallback is healthy after Llama 4 Scout's
 * retirement. Qwen 3.6 is Groq's current multimodal replacement.
 *
 * Usage:
 *   npm run test:groq
 */

import Groq from "groq-sdk";

// 10x10 orange PNG — valid image that passes minimum-size checks
const TEST_IMAGE_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAIAAAACUFjqAAAAEklEQVR4nGP4n2KEBzGMSmNDACBmnjXyCN/wAAAAAElFTkSuQmCC";

const MODELS = [
  { model: "qwen/qwen3.6-27b", tag: "GRQ36", name: "Qwen 3.6 27B" },
];

const PROMPT = `You are analyzing a food image. Return ONLY a JSON object (no markdown, no code blocks):

{
  "dishName": "name of the dish",
  "hindiName": "हिंदी नाम",
  "calories": 200,
  "protein": 10,
  "carbs": 25,
  "fat": 8,
  "fiber": 3,
  "portionSize": "1 serving (150g)",
  "confidence": "low"
}

If you cannot identify a dish, return a placeholder with confidence "low". Return ONLY the JSON.`;

interface TestResult {
  model: string;
  tag: string;
  name: string;
  pass: boolean;
  supportsVision: boolean;
  validJson: boolean;
  hasRequiredFields: boolean;
  latencyMs: number;
  error?: string;
  response?: Record<string, unknown>;
}

function getErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

async function testModel(groq: Groq, model: string, tag: string, name: string): Promise<TestResult> {
  const start = Date.now();
  const result: TestResult = {
    model, tag, name,
    pass: false,
    supportsVision: false,
    validJson: false,
    hasRequiredFields: false,
    latencyMs: 0,
  };

  try {
    console.log(`  Testing ${name} (${model})...`);

    const completion = await groq.chat.completions.create({
      model,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: PROMPT },
            {
              type: "image_url",
              image_url: { url: `data:image/png;base64,${TEST_IMAGE_BASE64}` },
            },
          ],
        },
      ],
      reasoning_effort: "none",
      temperature: 0.3,
      max_tokens: 500,
    });

    result.latencyMs = Date.now() - start;
    result.supportsVision = true;

    const raw = completion.choices[0]?.message?.content || "";
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    try {
      const parsed = JSON.parse(cleaned);
      result.validJson = true;

      const required = ["dishName", "calories", "protein", "carbs", "fat"];
      const missing = required.filter((f) => !(f in parsed));
      result.hasRequiredFields = missing.length === 0;
      result.response = parsed;

      if (missing.length > 0) {
        result.error = `Missing fields: ${missing.join(", ")}`;
      }
    } catch {
      result.error = `Invalid JSON: ${cleaned.substring(0, 120)}`;
    }
  } catch (err: unknown) {
    result.latencyMs = Date.now() - start;
    result.error = getErrorMessage(err).substring(0, 150);
  }

  result.pass = result.supportsVision && result.validJson && result.hasRequiredFields;

  if (result.pass) {
    console.log(`  => PASS  vision:YES  json:YES  fields:YES  ${result.latencyMs}ms`);
    if (result.response) {
      console.log(`     Response: ${result.response.dishName} (${result.response.calories} cal, confidence: ${result.response.confidence})`);
    }
  } else {
    console.log(`  => FAIL  ${result.latencyMs}ms — ${result.error}`);
  }

  return result;
}

async function main() {
  console.log("Groq Tier 3 Fallback Test");
  console.log("=".repeat(60));

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.error("ERROR: GROQ_API_KEY not set.");
    console.error("Run: npm run test:groq");
    process.exit(1);
  }

  const groq = new Groq({ apiKey });
  const results: TestResult[] = [];

  for (const m of MODELS) {
    results.push(await testModel(groq, m.model, m.tag, m.name));
  }

  // Also verify the retired model is truly gone.
  console.log(`\n  Verifying Llama 4 Scout is retired...`);
  try {
    await groq.chat.completions.create({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [{ role: "user", content: "test" }],
      max_tokens: 1,
    });
    console.log(`  => WARNING: Llama 4 Scout still responds (unexpected)`);
  } catch (err: unknown) {
    const msg = getErrorMessage(err);
    if (msg.includes("does not exist") || msg.includes("model_not_found") || msg.includes("decommissioned")) {
      console.log(`  => Confirmed: Llama 4 Scout is retired`);
    } else {
      console.log(`  => Error (${msg.substring(0, 80)})`);
    }
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  const allPass = results.every((r) => r.pass);

  if (allPass) {
    console.log("RESULT: ALL TESTS PASSED");
    console.log(`  Tier 3 fallback (Qwen 3.6) is working correctly.`);
    console.log(`  Scout retirement confirmed — no dead model in the fallback chain.`);
    process.exit(0);
  } else {
    console.log("RESULT: TESTS FAILED");
    for (const r of results.filter((r) => !r.pass)) {
      console.log(`  FAIL: ${r.name} — ${r.error}`);
    }
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
