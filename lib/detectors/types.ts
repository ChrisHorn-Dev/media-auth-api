import type { MediaType } from "@/lib/media/types";

export interface DetectorInput {
  mediaType: MediaType;
  buffer: Buffer;
  mimeType: string;
  fileName: string;
  sizeBytes: number;
  hash: string;
}

export type DetectorPrediction =
  | "authentic"
  | "synthetic"
  | "manipulated"
  | "unknown"
  | "likely_authentic"
  | "likely_ai_generated";

export interface DetectorResult {
  detectorId: string;
  detectorVersion: string;
  mediaType: MediaType;
  prediction: DetectorPrediction;
  confidence: number;
  model?: string;
  raw?: unknown;
}

export interface DetectorMetadata {
  id: string;
  version: string;
  mediaType: MediaType;
  name: string;
}

export interface Detector {
  readonly metadata: DetectorMetadata;
  supports(input: DetectorInput): boolean;
  analyze(input: DetectorInput, options?: { apiKey?: string }): Promise<DetectorResult>;
}
