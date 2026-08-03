import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = (path) => readFileSync(resolve(root, path), "utf8");

const registry = read("src/lib/aiModels.ts");
const packageJson = JSON.parse(read("package.json"));
const runtimeFiles = [
  "src/lib/aiModels.ts",
  "src/app/api/analyze-dish/route.ts",
  "src/app/api/describe-meal/route.ts",
  "src/app/api/analyze/route.ts",
  "src/app/api/analyze-habits/route.ts",
  "src/app/api/health-verdict/route.ts",
  "src/app/api/capy-motivation/route.ts",
  "src/app/api/hindi-message/route.ts",
].map(read).join("\n");

const expectedModels = [
  "gemini-3.6-flash",
  "gemini-3.5-flash-lite",
  "gpt-4o-mini",
  "gpt-4.1-nano",
  "gpt-5.6-luna",
  "claude-haiku-4-5-20251001",
  "qwen/qwen3.6-27b",
  "openai/gpt-oss-20b",
];

for (const model of expectedModels) {
  assert.ok(registry.includes(`"${model}"`), `model registry is missing ${model}`);
}

const retiredOrUnnecessaryModels = [
  "gemini-2.0",
  "gemini-2.5",
  "claude-3-5-haiku",
  "gpt-4.1-mini",
  "gpt-5.6-sol",
  "gpt-5.6-terra",
  "meta-llama/llama-4-scout-17b-16e-instruct",
  "llama-3.1-8b-instant",
];

for (const model of retiredOrUnnecessaryModels) {
  assert.ok(!runtimeFiles.includes(model), `runtime still references disallowed model ${model}`);
}

assert.equal(packageJson.dependencies["@google/generative-ai"], undefined, "legacy Gemini SDK must be removed");
assert.ok(packageJson.dependencies["@google/genai"], "maintained Gemini SDK must be installed");

const dishRoute = read("src/app/api/analyze-dish/route.ts");
const otherRoutes = runtimeFiles.replace(dishRoute, "");
assert.ok(dishRoute.includes("AI_MODELS.gemini.dishVision"), "dish analysis must use the quality vision model");
assert.ok(!otherRoutes.includes("AI_MODELS.gemini.dishVision"), "quality vision model must be limited to dish analysis");
assert.ok(dishRoute.includes("ThinkingLevel.LOW"), "dish analysis must cap Gemini thinking at low");

console.log("AI model configuration checks passed.");
