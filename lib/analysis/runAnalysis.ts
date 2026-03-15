import type { AnalysisInput } from "./types";
import type { SignedAnalysisRecord } from "./types";
import { analyze } from "./orchestrator";
import { signRecord } from "@/lib/security/signature";
import { validateImageFile, validateImageDimensions } from "@/lib/media/validation";
import { mediaTypeFromMimeOrImage } from "@/lib/media/sniff";
import { sha256Hex } from "@/lib/hashing/fileHash";
import { logAnalysis } from "@/lib/logging/analysisLog";

export interface RunAnalysisOptions {
  detectorId?: string;
  mode?: import("./types").AnalysisRequestMode;
}

export async function runSingleAnalysis(
  file: File,
  options: RunAnalysisOptions = {}
): Promise<
  | { record: SignedAnalysisRecord }
  | { error: string }
> {
  const validationError = validateImageFile(file);
  if (validationError) {
    return { error: validationError };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const dimensionError = validateImageDimensions(buffer);
  if (dimensionError) {
    return { error: dimensionError };
  }
  const mimeType = (file.type ?? "").toLowerCase() || "application/octet-stream";
  const mediaType = mediaTypeFromMimeOrImage(mimeType);
  const hash = sha256Hex(buffer);
  const input: AnalysisInput = {
    mediaType,
    buffer,
    mimeType,
    fileName: file.name || "unknown",
    sizeBytes: file.size,
    hash,
  };

  try {
    const start = Date.now();
    const { record, fromCache } = await analyze(input, {
      detectorId: options.detectorId,
      mode: options.mode,
    });
    const latencyMs = Date.now() - start;
    const signed = signRecord(record);
    logAnalysis({
      event: "analysis",
      analysis_id: signed.analysis_id,
      mediaType: record.media.type,
      cacheHit: fromCache,
      detectorId: record.verdict.detectorId,
      strategy: record.verdict.strategy,
      latencyMs,
    });
    return { record: signed };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Analysis failed";
    return { error: message };
  }
}

export type BatchItemResult =
  | { filename: string; record: SignedAnalysisRecord }
  | { filename: string; error: string };

export async function runBatchAnalysis(
  files: File[],
  options: RunAnalysisOptions = {}
): Promise<{ results: BatchItemResult[] }> {
  const results: BatchItemResult[] = [];
  for (const file of files) {
    const filename = file.name || "unknown";
    const out = await runSingleAnalysis(file, options);
    if ("error" in out) {
      results.push({ filename, error: out.error });
    } else {
      results.push({ filename, record: out.record });
    }
  }
  return { results };
}
