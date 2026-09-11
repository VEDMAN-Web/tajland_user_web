export type RateLimitResult =
  { ok: true; remaining: number } | { ok: false; retryAfterMs: number };

type RateLimiterOptions = {
  windowMs: number;
  max: number;
  now?: () => number;
};

export function createInMemoryRateLimiter({
  windowMs,
  max,
  now = () => Date.now(),
}: RateLimiterOptions) {
  const hits = new Map<string, number[]>();

  return {
    check(key: string): RateLimitResult {
      const current = now();
      const recent = (hits.get(key) ?? []).filter((stamp) => current - stamp < windowMs);

      if (recent.length >= max) {
        const retryAfterMs = windowMs - (current - (recent[0] ?? current));
        hits.set(key, recent);
        return { ok: false, retryAfterMs: Math.max(retryAfterMs, 1) };
      }

      recent.push(current);
      hits.set(key, recent);
      return { ok: true, remaining: max - recent.length };
    },
  };
}
