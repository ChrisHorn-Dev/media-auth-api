import type { CacheableAnalysis } from "@/lib/analysis/types";
import * as fileCache from "./fileCache";

const DEFAULT_TTL_MS = 5 * 60 * 1000;

interface CacheEntry {
  data: CacheableAnalysis;
  createdAt: number;
}

const memoryCache = new Map<string, CacheEntry>();

function isExpired(entry: CacheEntry, ttlMs: number): boolean {
  return Date.now() - entry.createdAt > ttlMs;
}

export async function get(
  hash: string,
  ttlMs: number = DEFAULT_TTL_MS
): Promise<CacheableAnalysis | undefined> {
  if (fileCache.isEnabled()) {
    return fileCache.get(hash, ttlMs);
  }
  const entry = memoryCache.get(hash);
  if (!entry) return undefined;
  if (isExpired(entry, ttlMs)) {
    memoryCache.delete(hash);
    return undefined;
  }
  return entry.data;
}

export async function set(hash: string, data: CacheableAnalysis): Promise<void> {
  if (fileCache.isEnabled()) {
    await fileCache.set(hash, data);
    return;
  }
  memoryCache.set(hash, { data, createdAt: Date.now() });
}
