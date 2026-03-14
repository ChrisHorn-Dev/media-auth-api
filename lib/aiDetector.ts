/**
 * AI-generated media detection via HuggingFace Inference API.
 * Uses a pretrained image classification model (real vs AI-generated).
 */

const HF_MODEL = "dima806/ai_vs_real_image_detection";
const HF_API_BASE = "https://api-inference.huggingface.co/models";

export type PredictionLabel = "likely_ai_generated" | "likely_authentic";

export interface AnalysisResult {
  prediction: PredictionLabel;
  confidence: number;
  model: string;
}

export interface HuggingFaceClassificationItem {
  label: string;
  score: number;
}

/**
 * Analyzes an image buffer using HuggingFace Inference API.
 * @param imageBuffer - Raw image bytes (e.g. from multipart upload)
 * @param apiKey - HuggingFace API token (required for inference)
 */
export async function analyzeImage(
  imageBuffer: Buffer,
  apiKey: string
): Promise<AnalysisResult> {
  const response = await fetch(`${HF_API_BASE}/${HF_MODEL}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/octet-stream",
    },
    body: imageBuffer,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Model request failed (${response.status}): ${text || response.statusText}`
    );
  }

  const data = (await response.json()) as HuggingFaceClassificationItem[];
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error("Invalid model response: empty or non-array");
  }

  // Model labels: REAL | FAKE (FAKE = AI-generated)
  const fakeItem = data.find((x) => x.label.toUpperCase() === "FAKE");
  const realItem = data.find((x) => x.label.toUpperCase() === "REAL");
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
