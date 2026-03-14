import type { AnalysisResult } from "./aiDetector";

const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface CacheEntry {
  result: AnalysisResult;
  createdAt: number;
}

const cache = new Map<string, CacheEntry>();

function isExpired(entry: CacheEntry, ttlMs: number): boolean {
  return Date.now() - entry.createdAt > ttlMs;
}

export function get(hash: string, ttlMs: number = DEFAULT_TTL_MS): AnalysisResult | undefined {
  const entry = cache.get(hash);
  if (!entry) return undefined;
  if (isExpired(entry, ttlMs)) {
    cache.delete(hash);
    return undefined;
  }
  return entry.result;
}

export function set(hash: string, result: AnalysisResult): void {
  cache.set(hash, { result, createdAt: Date.now() });
}
