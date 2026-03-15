import type { PlatformVerdict } from "./types";
import type { DetectorResult } from "@/lib/detectors/types";

/**
 * Aggregate multiple image detector results into one platform verdict.
 * Same prediction → average confidence. Different predictions → conservative:
 * prefer likely_ai_generated, use max confidence among that side.
 */
export function aggregateImageVerdicts(results: DetectorResult[]): PlatformVerdict {
  if (results.length === 0) {
    return {
      prediction: "unknown",
      confidence: 0,
      strategy: "ensemble",
      detectorId: "ensemble",
    };
  }
  if (results.length === 1) {
    return {
      prediction: results[0].prediction,
      confidence: results[0].confidence,
      strategy: "ensemble",
      detectorId: "ensemble",
    };
  }
  const same = results.every((r) => r.prediction === results[0].prediction);
  if (same) {
    const avg =
      results.reduce((s, r) => s + r.confidence, 0) / results.length;
    return {
      prediction: results[0].prediction,
      confidence: Math.round(avg * 100) / 100,
      strategy: "ensemble",
      detectorId: "ensemble",
    };
  }
  const ai = results.filter((r) => r.prediction === "likely_ai_generated");
  const conf = ai.length > 0
    ? Math.max(...ai.map((r) => r.confidence))
    : 0.5;
  return {
    prediction: "likely_ai_generated",
    confidence: Math.round(conf * 100) / 100,
    strategy: "ensemble",
    detectorId: "ensemble",
  };
}
