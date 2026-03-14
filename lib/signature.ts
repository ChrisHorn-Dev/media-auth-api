import { createHmac, randomUUID } from "crypto";

export interface SignedPayload {
  analysis_id: string;
  prediction: string;
  confidence: number;
  model: string;
  timestamp: string;
}

export interface SignedAnalysisResponse extends SignedPayload {
  signature: string;
  cached: boolean;
}

function getSigningSecret(): string {
  const secret = process.env.SIGNING_SECRET;
  if (!secret || secret.length === 0) {
    throw new Error("SIGNING_SECRET is not set or empty");
  }
  return secret;
}

/** Canonical string used for HMAC; order and format must match in verify. */
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
    const secret = getSigningSecret();
    const message = canonicalString(payload);
    const expected = createHmac("sha256", secret).update(message).digest("hex");
    return expected.length === signature.length && expected === signature;
  } catch {
    return false;
  }
}

export function createSignedResult(
  result: { prediction: string; confidence: number; model: string },
  cached: boolean
): SignedAnalysisResponse {
  const analysis_id = randomUUID();
  const timestamp = new Date().toISOString();
  const payload: SignedPayload = {
    analysis_id,
    prediction: result.prediction,
    confidence: result.confidence,
    model: result.model,
    timestamp,
  };
  const signature = signPayload(payload);
  return { ...payload, signature, cached };
}
