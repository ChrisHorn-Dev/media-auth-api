/** Structured log entry for a single analysis (no PII). */
export interface AnalysisLogEntry {
  event: "analysis";
  analysis_id: string;
  mediaType: string;
  cacheHit: boolean;
  detectorId: string;
  strategy: "single" | "ensemble";
  latencyMs: number;
}

export function logAnalysis(entry: AnalysisLogEntry): void {
  console.log(JSON.stringify(entry));
}
