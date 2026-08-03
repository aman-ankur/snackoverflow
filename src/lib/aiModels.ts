/**
 * Central model registry. Keep model selection role-based so upgrades can be
 * reviewed and tested without changing the surrounding application logic.
 */
export const AI_MODELS = {
  gemini: {
    dishVision: "gemini-3.6-flash",
    fastMultimodal: "gemini-3.5-flash-lite",
    fastText: "gemini-3.5-flash-lite",
  },
  openai: {
    visionFallback: "gpt-4o-mini",
    fastTextFallback: "gpt-4.1-nano",
    balancedTextFallback: "gpt-5.6-luna",
  },
  anthropic: {
    fastTextFallback: "claude-haiku-4-5-20251001",
  },
  groq: {
    visionFallback: "qwen/qwen3.6-27b",
    fastTextFallback: "openai/gpt-oss-20b",
  },
} as const;
