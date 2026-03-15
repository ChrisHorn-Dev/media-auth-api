import { mkdir, readFile, writeFile } from "fs/promises";
import { join } from "path";
import type { CacheableAnalysis } from "@/lib/analysis/types";

const DEFAULT_TTL_MS = 5 * 60 * 1000;

interface StoredEntry {
  data: CacheableAnalysis;
  createdAt: number;
}

function getCacheDir(): string {
  const dir = process.env.CACHE_DIR ?? process.env.CACHE_PERSISTENCE_PATH ?? ".cache/media-auth";
  return dir;
}

function safeHashFilename(hash: string): string {
  return hash.replace(/[^a-fA-F0-9]/g, "") || "unknown";
}

async function ensureDir(dir: string): Promise<void> {
  await mkdir(dir, { recursive: true });
}

export async function get(
  hash: string,
  ttlMs: number = DEFAULT_TTL_MS
): Promise<CacheableAnalysis | undefined> {
  const dir = getCacheDir();
  const file = join(dir, `${safeHashFilename(hash)}.json`);
  try {
    const raw = await readFile(file, "utf-8");
    const entry: StoredEntry = JSON.parse(raw);
    if (Date.now() - entry.createdAt > ttlMs) {
      return undefined;
    }
    return entry.data;
  } catch {
    return undefined;
  }
}

export async function set(hash: string, data: CacheableAnalysis): Promise<void> {
  const dir = getCacheDir();
  await ensureDir(dir);
  const file = join(dir, `${safeHashFilename(hash)}.json`);
  const entry: StoredEntry = { data, createdAt: Date.now() };
  await writeFile(file, JSON.stringify(entry), "utf-8");
}

export function isEnabled(): boolean {
  return Boolean(process.env.CACHE_DIR ?? process.env.CACHE_PERSISTENCE_PATH);
}
