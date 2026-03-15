import type { CacheableAnalysis } from "@/lib/analysis/types";

const DEFAULT_TTL_MS = 5 * 60 * 1000;

interface CacheEntry {
  data: CacheableAnalysis;
  createdAt: number;
}

const cache = new Map<string, CacheEntry>();

function isExpired(entry: CacheEntry, ttlMs: number): boolean {
  return Date.now() - entry.createdAt > ttlMs;
}

export function get(
  hash: string,
  ttlMs: number = DEFAULT_TTL_MS
): CacheableAnalysis | undefined {
  const entry = cache.get(hash);
  if (!entry) return undefined;
  if (isExpired(entry, ttlMs)) {
    cache.delete(hash);
    return undefined;
  }
  return entry.data;
}

export function set(hash: string, data: CacheableAnalysis): void {
  cache.set(hash, { data, createdAt: Date.now() });
}
