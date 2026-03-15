import type { PlatformVerdict } from "./types";
import type { DetectorResult } from "@/lib/detectors/types";

export function verdictFromDetectorResult(result: DetectorResult): PlatformVerdict {
  return {
    prediction: result.prediction,
    confidence: result.confidence,
    strategy: "single",
    detectorId: result.detectorId,
  };
}
