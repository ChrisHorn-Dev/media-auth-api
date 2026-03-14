import type { AnalysisResult } from "./aiDetector";

// In-memory cache keyed by file hash
const cache = new Map<string, AnalysisResult>();

export function get(hash: string): AnalysisResult | undefined {
  return cache.get(hash);
}

export function set(hash: string, result: AnalysisResult): void {
  cache.set(hash, result);
}
