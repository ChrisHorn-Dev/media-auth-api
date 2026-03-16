import { describe, expect, it, beforeEach } from "vitest";
import { signRecord, verifyPayload, type SignedPayload } from "./signature";
import type { AnalysisRecord } from "./types";

const FIXED_SECRET = "test-signing-secret-1234567890";

beforeEach(() => {
  process.env.SIGNING_SECRET = FIXED_SECRET;
});

function makeRecord(overrides: Partial<AnalysisRecord> = {}): AnalysisRecord {
  return {
    analysis_id: "test-analysis-id",
    timestamp: "2025-03-15T12:00:00.000Z",
    media: {
      type: "image",
      mime_type: "image/jpeg",
      sha256: "abc123",
    },
    request: {
      mode: "single",
    },
    verdict: {
      prediction: "likely_authentic",
      confidence: 0.9,
      strategy: "single",
      detectorId: "huggingface-image-v1",
    },
    detectors: [],
    cached: false,
    ...overrides,
  };
}

function toSignedPayload(rec: AnalysisRecord): SignedPayload {
  return {
    analysis_id: rec.analysis_id,
    timestamp: rec.timestamp,
    prediction: rec.verdict.prediction,
    confidence: rec.verdict.confidence,
    model: rec.verdict.strategy === "ensemble" ? "ensemble" : (rec.detectors[0]?.model ?? rec.verdict.detectorId),
  };
}

describe("signature signing and verification", () => {
  it("accepts an untampered signed record", () => {
    const record = makeRecord();
    const signed = signRecord(record);
    const payload = toSignedPayload(signed);

    const ok = verifyPayload(payload, signed.signature);
    expect(ok).toBe(true);
  });

  it("rejects a tampered prediction", () => {
    const record = makeRecord();
    const signed = signRecord(record);
    const payload = { ...toSignedPayload(signed), prediction: "likely_ai_generated" as const };

    const ok = verifyPayload(payload, signed.signature);
    expect(ok).toBe(false);
  });

  it("rejects a tampered confidence", () => {
    const record = makeRecord();
    const signed = signRecord(record);
    const payload = { ...toSignedPayload(signed), confidence: 0.1 };

    const ok = verifyPayload(payload, signed.signature);
    expect(ok).toBe(false);
  });
});

