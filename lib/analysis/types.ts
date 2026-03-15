import type { MediaType } from "@/lib/media/types";
import type { DetectorResult } from "@/lib/detectors/types";

export type AnalysisRequestMode = "auto" | "single" | "ensemble";

export interface AnalysisInput {
  mediaType: MediaType;
  buffer: Buffer;
  mimeType: string;
  fileName: string;
  sizeBytes: number;
  hash: string;
}

export type PlatformPrediction =
  | "authentic"
  | "synthetic"
  | "manipulated"
  | "unknown"
  | "likely_authentic"
  | "likely_ai_generated";

export interface PlatformVerdict {
  prediction: PlatformPrediction;
  confidence: number;
  strategy: "single" | "ensemble";
  detectorId: string;
}

export interface AnalysisRecord {
  analysis_id: string;
  timestamp: string;
  media: {
    type: MediaType;
    mime_type: string;
    sha256: string;
  };
  request: {
    mode: AnalysisRequestMode;
  };
  verdict: PlatformVerdict;
  detectors: DetectorResult[];
  cached: boolean;
}

export interface SignedAnalysisRecord extends AnalysisRecord {
  signature: string;
}

export interface CacheableAnalysis {
  media: AnalysisRecord["media"];
  request: AnalysisRecord["request"];
  verdict: PlatformVerdict;
  detectors: DetectorResult[];
}
