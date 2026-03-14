import { createHash } from "crypto";

// SHA256 of buffer for cache key
export function sha256Hex(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}
