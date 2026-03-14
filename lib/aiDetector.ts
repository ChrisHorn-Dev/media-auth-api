import { InferenceClient } from "@huggingface/inference";

const HF_MODEL = "dima806/ai_vs_real_image_detection";

export type PredictionLabel = "likely_ai_generated" | "likely_authentic";

export interface AnalysisResult {
  prediction: PredictionLabel;
  confidence: number;
  model: string;
}

export async function analyzeImage(
  imageBuffer: Buffer,
  apiKey: string,
  contentType: string = "image/jpeg"
): Promise<AnalysisResult> {
  const client = new InferenceClient(apiKey);
  const blob = new Blob([new Uint8Array(imageBuffer)], { type: contentType });

  const data = await client.imageClassification({
    model: HF_MODEL,
    data: blob,
  });

  if (!Array.isArray(data) || data.length === 0) {
    throw new Error("Invalid model response: empty or non-array");
  }

  // REAL / FAKE from model; FAKE = AI-generated
  const fakeItem = data.find((x) => x.label?.toUpperCase() === "FAKE");
  const realItem = data.find((x) => x.label?.toUpperCase() === "REAL");
  const fakeScore = fakeItem?.score ?? 0;
  const realScore = realItem?.score ?? 0;

  const isAiGenerated = fakeScore >= realScore;
  const confidence = isAiGenerated ? fakeScore : realScore;

  return {
    prediction: isAiGenerated ? "likely_ai_generated" : "likely_authentic",
    confidence: Math.round(confidence * 100) / 100,
    model: "ai-media-detector-v1",
  };
}
