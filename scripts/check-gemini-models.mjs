import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("❌ GEMINI_API_KEY not found in environment");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

console.log("🔍 Checking available Gemini models...\n");

// Test models
const modelsToTest = [
  "gemini-2.5-flash",
  "gemini-2.0-flash-exp",
  "gemini-2.0-flash-lite",
  "gemini-1.5-flash",
  "gemini-1.5-pro"
];

for (const modelName of modelsToTest) {
  try {
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent("test");
    console.log(`✅ ${modelName}: AVAILABLE`);
  } catch (err) {
    const msg = err.message || String(err);
    if (msg.includes("limit: 0") || msg.includes("not found") || msg.includes("Model not found")) {
      console.log(`❌ ${modelName}: NOT AVAILABLE`);
    } else if (msg.includes("quota") || msg.includes("429")) {
      console.log(`⚠️  ${modelName}: RATE LIMITED (available but quota exhausted)`);
    } else {
      console.log(`❓ ${modelName}: ERROR - ${msg.slice(0, 80)}`);
    }
  }
}

console.log("\n✨ Check complete!");
