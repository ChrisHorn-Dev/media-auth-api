import type {
  AnalysisInput,
  AnalysisRecord,
  AnalysisRequestMode,
  CacheableAnalysis,
  PlatformVerdict,
} from "./types";
import { verdictFromDetectorResult } from "./verdict";
import { createAnalysisId } from "@/lib/ids/analysisId";
import { getCompatibleDetectors } from "@/lib/detectors/registry";
import type { DetectorInput, DetectorResult } from "@/lib/detectors/types";
import * as resultCache from "@/lib/cache/resultCache";

export interface OrchestratorOptions {
  mode?: AnalysisRequestMode;
  detectorId?: string;
  apiKey?: string;
}

export async function analyze(
  input: AnalysisInput,
  options: OrchestratorOptions = {}
): Promise<{ record: AnalysisRecord; fromCache: boolean }> {
  const mode = options.mode ?? "auto";
  const apiKey = options.apiKey ?? process.env.HUGGINGFACE_API_KEY;

  const cached = await resultCache.get(input.hash);
  if (cached) {
    const record: AnalysisRecord = {
      analysis_id: createAnalysisId(),
      timestamp: new Date().toISOString(),
      media: cached.media,
      request: cached.request,
      verdict: cached.verdict,
      detectors: cached.detectors,
      cached: true,
    };
    return { record, fromCache: true };
  }

  const detectorInput: DetectorInput = {
    mediaType: input.mediaType,
    buffer: input.buffer,
    mimeType: input.mimeType,
    fileName: input.fileName,
    sizeBytes: input.sizeBytes,
    hash: input.hash,
  };

  const compatible = getCompatibleDetectors(detectorInput);
  if (compatible.length === 0) {
    throw new Error(
      `No detector available for media type "${input.mediaType}". Image is the only supported type currently.`
    );
  }

  const detector = options.detectorId
    ? compatible.find((d) => d.metadata.id === options.detectorId) ?? compatible[0]
    : compatible[0];

  const result = await detector.analyze(detectorInput, { apiKey });
  const verdict = verdictFromDetectorResult(result);
  const detectors: DetectorResult[] = [result];

  const cacheable: CacheableAnalysis = {
    media: {
      type: input.mediaType,
      mime_type: input.mimeType,
      sha256: input.hash,
    },
    request: { mode },
    verdict,
    detectors,
  };
  await resultCache.set(input.hash, cacheable);

  const record: AnalysisRecord = {
    analysis_id: createAnalysisId(),
    timestamp: new Date().toISOString(),
    media: cacheable.media,
    request: cacheable.request,
    verdict: cacheable.verdict,
    detectors: cacheable.detectors,
    cached: false,
  };
  return { record, fromCache: false };
}
