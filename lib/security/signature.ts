import { createHmac, timingSafeEqual } from "crypto";
import type { AnalysisRecord, SignedAnalysisRecord } from "@/lib/analysis/types";

export interface SignedPayload {
  analysis_id: string;
  prediction: string;
  confidence: number;
  model: string;
  timestamp: string;
}

function getSigningSecret(): string {
  const secret = process.env.SIGNING_SECRET;
  if (!secret || secret.length === 0) {
    throw new Error("SIGNING_SECRET is not set or empty");
  }
  return secret;
}

function canonicalString(payload: SignedPayload): string {
  return [
    payload.analysis_id,
    payload.timestamp,
    payload.prediction,
    String(payload.confidence),
    payload.model,
  ].join("\n");
}

export function signPayload(payload: SignedPayload): string {
  const secret = getSigningSecret();
  const message = canonicalString(payload);
  return createHmac("sha256", secret).update(message).digest("hex");
}

export function verifyPayload(payload: SignedPayload, signature: string): boolean {
  if (!signature || signature.length === 0) return false;
  try {
    const expected = signPayload(payload);
    if (expected.length !== signature.length) return false;
    const a = Buffer.from(expected, "hex");
    const b = Buffer.from(signature, "hex");
    if (a.length !== b.length || a.length === 0) return false;
    return timingSafeEqual(a, b); // constant-time compare
  } catch {
    return false;
  }
}

export function signRecord(record: AnalysisRecord): SignedAnalysisRecord {
  const model =
    record.detectors[0]?.model ?? record.verdict.detectorId ?? "unknown";
  const payload: SignedPayload = {
    analysis_id: record.analysis_id,
    timestamp: record.timestamp,
    prediction: record.verdict.prediction,
    confidence: record.verdict.confidence,
    model,
  };
  const signature = signPayload(payload);
  return { ...record, signature };
}
