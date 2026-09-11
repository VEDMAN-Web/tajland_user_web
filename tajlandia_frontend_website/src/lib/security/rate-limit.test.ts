import { describe, expect, it } from "vitest";
import { createInMemoryRateLimiter } from "./rate-limit";

describe("createInMemoryRateLimiter", () => {
  it("allows requests under the limit and blocks afterwards", () => {
    const now = 1_000;
    const limiter = createInMemoryRateLimiter({
      windowMs: 1_000,
      max: 2,
      now: () => now,
    });

    expect(limiter.check("ip-1").ok).toBe(true);
    expect(limiter.check("ip-1").ok).toBe(true);
    expect(limiter.check("ip-1")).toMatchObject({ ok: false });
    expect(limiter.check("ip-2").ok).toBe(true);
  });

  it("resets after the window", () => {
    let now = 1_000;
    const limiter = createInMemoryRateLimiter({
      windowMs: 500,
      max: 1,
      now: () => now,
    });

    expect(limiter.check("a").ok).toBe(true);
    expect(limiter.check("a").ok).toBe(false);
    now = 1_600;
    expect(limiter.check("a").ok).toBe(true);
  });

  it("uses the system clock and blocks immediately when max is zero", () => {
    const defaultClock = createInMemoryRateLimiter({ windowMs: 1_000, max: 1 });
    expect(defaultClock.check("clock").ok).toBe(true);
    expect(defaultClock.check("clock").ok).toBe(false);

    const closed = createInMemoryRateLimiter({
      windowMs: 1_000,
      max: 0,
      now: () => 1_000,
    });
    expect(closed.check("anyone")).toMatchObject({ ok: false, retryAfterMs: 1_000 });

    const zeroWindow = createInMemoryRateLimiter({
      windowMs: 0,
      max: 0,
      now: () => 1_000,
    });
    expect(zeroWindow.check("anyone")).toMatchObject({ ok: false, retryAfterMs: 1 });
  });
});
