import type { AnalysisInput } from "./types";
import type { SignedAnalysisRecord } from "./types";
import { analyze } from "./orchestrator";
import { signRecord } from "@/lib/security/signature";
import { validateImageFile } from "@/lib/media/validation";
import { mediaTypeFromMimeOrImage } from "@/lib/media/sniff";
import { sha256Hex } from "@/lib/hashing/fileHash";

export async function runSingleAnalysis(
  file: File
): Promise<
  | { record: SignedAnalysisRecord }
  | { error: string }
> {
  const validationError = validateImageFile(file);
  if (validationError) {
    return { error: validationError };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
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
    const { record } = await analyze(input);
    return { record: signRecord(record) };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Analysis failed";
    return { error: message };
  }
}

export type BatchItemResult =
  | { filename: string; record: SignedAnalysisRecord }
  | { filename: string; error: string };

export async function runBatchAnalysis(
  files: File[]
): Promise<{ results: BatchItemResult[] }> {
  const results: BatchItemResult[] = [];
  for (const file of files) {
    const filename = file.name || "unknown";
    const out = await runSingleAnalysis(file);
    if ("error" in out) {
      results.push({ filename, error: out.error });
    } else {
      results.push({ filename, record: out.record });
    }
  }
  return { results };
}
