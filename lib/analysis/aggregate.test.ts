import { describe, expect, it } from "vitest";
import { aggregateImageVerdicts } from "./aggregate";
import type { DetectorResult } from "@/lib/detectors/types";

function makeResult(overrides: Partial<DetectorResult> = {}): DetectorResult {
  return {
    detectorId: "huggingface-image-v1",
    detectorVersion: "1.0.0",
    mediaType: "image",
    prediction: "likely_authentic",
    confidence: 0.9,
    model: "test-model",
    ...overrides,
  };
}

describe("aggregateImageVerdicts", () => {
  it("returns unknown when there are no results", () => {
    const verdict = aggregateImageVerdicts([]);
    expect(verdict.prediction).toBe("unknown");
    expect(verdict.strategy).toBe("ensemble");
    expect(verdict.detectorId).toBe("ensemble");
  });

  it("passes through a single result", () => {
    const result = makeResult({ prediction: "likely_ai_generated", confidence: 0.8 });
    const verdict = aggregateImageVerdicts([result]);
    expect(verdict.prediction).toBe("likely_ai_generated");
    expect(verdict.confidence).toBeCloseTo(0.8);
    expect(verdict.strategy).toBe("ensemble");
    expect(verdict.detectorId).toBe("ensemble");
  });

  it("averages confidence when all predictions agree", () => {
    const verdict = aggregateImageVerdicts([
      makeResult({ prediction: "likely_authentic", confidence: 0.8 }),
      makeResult({ prediction: "likely_authentic", confidence: 0.9 }),
      makeResult({ prediction: "likely_authentic", confidence: 0.7 }),
    ]);
    expect(verdict.prediction).toBe("likely_authentic");
    expect(verdict.confidence).toBeCloseTo(0.8);
    expect(verdict.strategy).toBe("ensemble");
  });

  it("returns conservative AI verdict when predictions differ", () => {
    const verdict = aggregateImageVerdicts([
      makeResult({ prediction: "likely_authentic", confidence: 0.9 }),
      makeResult({ prediction: "likely_ai_generated", confidence: 0.7 }),
      makeResult({ prediction: "likely_ai_generated", confidence: 0.85 }),
    ]);
    expect(verdict.prediction).toBe("likely_ai_generated");
    expect(verdict.confidence).toBeCloseTo(0.85);
    expect(verdict.strategy).toBe("ensemble");
  });
});

