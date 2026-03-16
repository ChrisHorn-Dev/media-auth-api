import { beforeEach, describe, expect, it } from "vitest";
import { checkRateLimit } from "./rateLimit";

beforeEach(() => {
  process.env.RATE_LIMIT_REQUESTS_PER_MINUTE = "2";
});

describe("checkRateLimit", () => {
  it("allows up to the configured number of requests, then blocks", () => {
    const id = "test-identifier";

    const first = checkRateLimit(id);
    const second = checkRateLimit(id);
    const third = checkRateLimit(id);

    expect(first.allowed).toBe(true);
    expect(second.allowed).toBe(true);
    expect(third.allowed).toBe(false);
    expect(third.retryAfterSeconds).toBeGreaterThan(0);
  });
});

