import {
  createPartFromBase64,
  createPartFromText,
  GoogleGenAI,
  ThinkingLevel,
} from "@google/genai";

interface GenerateGeminiContentOptions {
  apiKey: string;
  model: string;
  prompt: string;
  imageBase64?: string;
  imageMimeType?: string;
  maxOutputTokens?: number;
  thinkingLevel?: ThinkingLevel;
  json?: boolean;
}

export { ThinkingLevel };

export async function generateGeminiContent({
  apiKey,
  model,
  prompt,
  imageBase64,
  imageMimeType = "image/jpeg",
  maxOutputTokens,
  thinkingLevel,
  json = false,
}: GenerateGeminiContentOptions): Promise<string> {
  const ai = new GoogleGenAI({ apiKey });
  const contents = imageBase64
    ? [createPartFromText(prompt), createPartFromBase64(imageBase64, imageMimeType)]
    : prompt;

  const response = await ai.models.generateContent({
    model,
    contents,
    config: {
      ...(maxOutputTokens ? { maxOutputTokens } : {}),
      ...(thinkingLevel ? { thinkingConfig: { thinkingLevel } } : {}),
      ...(json ? { responseMimeType: "application/json" } : {}),
    },
  });

  return response.text ?? "";
}
