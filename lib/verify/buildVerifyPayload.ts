import type { SignedAnalysisRecord } from "@/lib/analysis/types";

/** Flat response shape (pre-structure). */
interface LegacyRecord {
  analysis_id: string;
  timestamp: string;
  prediction: string;
  confidence: number;
  model: string;
  signature: string;
}

/** Batch items may use a record with optional fields. */
export interface LegacyBatchRecord {
  analysis_id?: string;
  timestamp?: string;
  prediction?: string;
  confidence?: number;
  model?: string;
  signature?: string;
}

export type VerifiableRecord = SignedAnalysisRecord | LegacyRecord | LegacyBatchRecord;

export interface VerifyRequestBody {
  analysis_id: string;
  prediction: string;
  confidence: number;
  model: string;
  timestamp: string;
  signature: string;
}

function getPrediction(r: VerifiableRecord): string | undefined {
  if ("verdict" in r) return r.verdict.prediction;
  return (r as LegacyBatchRecord).prediction;
}
function getConfidence(r: VerifiableRecord): number | undefined {
  if ("verdict" in r) return r.verdict.confidence;
  return (r as LegacyBatchRecord).confidence;
}
function getModel(r: VerifiableRecord): string | undefined {
  if ("detectors" in r && r.detectors?.[0]?.model) return r.detectors[0].model;
  if ("verdict" in r) return r.verdict.detectorId;
  return (r as LegacyRecord & LegacyBatchRecord).model;
}

/**
 * Builds the request body for POST /api/verify from a signed analysis record.
 * Returns null if the record has no signature or missing required fields.
 */
export function buildVerifyPayload(record: VerifiableRecord | undefined | null): VerifyRequestBody | null {
  if (!record || !("signature" in record) || typeof record.signature !== "string" || !record.signature) {
    return null;
  }
  const analysis_id = record.analysis_id;
  const timestamp = record.timestamp;
  if (typeof analysis_id !== "string" || typeof timestamp !== "string") return null;
  const prediction = getPrediction(record);
  const confidence = getConfidence(record);
  const model = getModel(record);
  if (typeof prediction !== "string" || model == null || typeof model !== "string" || typeof confidence !== "number" || !Number.isFinite(confidence)) {
    return null;
  }
  return {
    analysis_id,
    prediction,
    confidence,
    model,
    timestamp,
    signature: record.signature,
  };
}
