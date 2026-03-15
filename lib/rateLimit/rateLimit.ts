const WINDOW_MS = 60 * 1000; // 1 minute
const DEFAULT_MAX_PER_MINUTE = 60;

const store = new Map<string, number[]>();

function getMaxPerMinute(): number {
  const n = process.env.RATE_LIMIT_REQUESTS_PER_MINUTE;
  if (n === undefined || n === "") return DEFAULT_MAX_PER_MINUTE;
  const parsed = parseInt(n, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_MAX_PER_MINUTE;
}

function prune(ts: number[]): number[] {
  const cutoff = Date.now() - WINDOW_MS;
  return ts.filter((t) => t > cutoff);
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds?: number;
}

export function checkRateLimit(identifier: string): RateLimitResult {
  const max = getMaxPerMinute();
  const now = Date.now();
  let timestamps = store.get(identifier) ?? [];
  timestamps = prune(timestamps);
  if (timestamps.length >= max) {
    const oldestInWindow = Math.min(...timestamps);
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((oldestInWindow + WINDOW_MS - now) / 1000),
    };
  }
  timestamps.push(now);
  store.set(identifier, timestamps);
  return { allowed: true };
}

export function getRateLimitIdentifier(
  request: Request,
  apiKey: string | null
): string {
  if (apiKey) return `key:${apiKey}`;
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? "unknown";
  return `ip:${ip}`;
}
