import { InferenceClient } from "@huggingface/inference";
import type { Detector, DetectorResult, DetectorInput } from "@/lib/detectors/types";

const HF_MODEL = "dima806/ai_vs_real_image_detection";
const DETECTOR_ID = "huggingface-image-v1";
const DETECTOR_VERSION = "1.0.0";

export const huggingFaceImageDetector: Detector = {
  metadata: {
    id: DETECTOR_ID,
    version: DETECTOR_VERSION,
    mediaType: "image",
    name: "Hugging Face image authenticity",
  },

  supports(input: DetectorInput): boolean {
    if (input.mediaType !== "image") return false;
    const mime = input.mimeType.toLowerCase();
    return [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ].includes(mime);
  },

  async analyze(
    input: DetectorInput,
    options?: { apiKey?: string }
  ): Promise<DetectorResult> {
    const apiKey = options?.apiKey ?? process.env.HUGGINGFACE_API_KEY;
    if (!apiKey) {
      throw new Error("HUGGINGFACE_API_KEY is not set");
    }
    const client = new InferenceClient(apiKey);
    const blob = new Blob([new Uint8Array(input.buffer)], {
      type: input.mimeType || "image/jpeg",
    });

    const data = await client.imageClassification({
      model: HF_MODEL,
      data: blob,
    });

    if (!Array.isArray(data) || data.length === 0) {
      throw new Error("Invalid model response: empty or non-array");
    }

    const fakeItem = data.find((x) => x.label?.toUpperCase() === "FAKE");
    const realItem = data.find((x) => x.label?.toUpperCase() === "REAL");
    const fakeScore = fakeItem?.score ?? 0;
    const realScore = realItem?.score ?? 0;

    const isAiGenerated = fakeScore >= realScore;
    const confidence = isAiGenerated ? fakeScore : realScore;

    return {
      detectorId: DETECTOR_ID,
      detectorVersion: DETECTOR_VERSION,
      mediaType: "image",
      prediction: isAiGenerated ? "likely_ai_generated" : "likely_authentic",
      confidence: Math.round(confidence * 100) / 100,
      model: "ai-media-detector-v1",
    };
  },
};
