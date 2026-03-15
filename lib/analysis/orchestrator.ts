import type {
  AnalysisInput,
  AnalysisRecord,
  AnalysisRequestMode,
  CacheableAnalysis,
  PlatformVerdict,
} from "./types";
import { verdictFromDetectorResult } from "./verdict";
import { aggregateImageVerdicts } from "./aggregate";
import { createAnalysisId } from "@/lib/ids/analysisId";
import { getCompatibleDetectors } from "@/lib/detectors/registry";
import type { DetectorInput, DetectorResult } from "@/lib/detectors/types";
import * as resultCache from "@/lib/cache/resultCache";

export interface OrchestratorOptions {
  mode?: AnalysisRequestMode;
  detectorId?: string;
  apiKey?: string;
}

function effectiveMode(mode: AnalysisRequestMode, compatibleCount: number): "single" | "ensemble" {
  if (mode === "ensemble" && compatibleCount > 1) return "ensemble";
  return "single";
}

export async function analyze(
  input: AnalysisInput,
  options: OrchestratorOptions = {}
): Promise<{ record: AnalysisRecord; fromCache: boolean }> {
  const mode = options.mode ?? "auto";
  const apiKey = options.apiKey ?? process.env.HUGGINGFACE_API_KEY;

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

  if (options.detectorId != null && options.detectorId !== "") {
    const found = compatible.find((d) => d.metadata.id === options.detectorId);
    if (!found) {
      const ids = compatible.map((d) => d.metadata.id).join(", ");
      throw new Error(`Unknown detector_id: "${options.detectorId}". Use one of: ${ids}`);
    }
  }

  const useMode = effectiveMode(mode === "auto" ? "single" : mode, compatible.length);
  const cacheKey = `${input.hash}:${useMode}`;
  const cached = await resultCache.get(cacheKey);
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

  let verdict: PlatformVerdict;
  let detectors: DetectorResult[];

  if (useMode === "ensemble") {
    const results = await Promise.all(
      compatible.map((d) => d.analyze(detectorInput, { apiKey }))
    );
    verdict = aggregateImageVerdicts(results);
    detectors = results;
  } else {
    const detector = options.detectorId
      ? compatible.find((d) => d.metadata.id === options.detectorId) ?? compatible[0]
      : compatible[0];
    const result = await detector.analyze(detectorInput, { apiKey });
    verdict = verdictFromDetectorResult(result);
    detectors = [result];
  }

  const requestMode: AnalysisRequestMode = useMode === "ensemble" ? "ensemble" : "single";
  const cacheable: CacheableAnalysis = {
    media: {
      type: input.mediaType,
      mime_type: input.mimeType,
      sha256: input.hash,
    },
    request: { mode: requestMode },
    verdict,
    detectors,
  };
  await resultCache.set(cacheKey, cacheable);

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
