import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

let redis: Redis | null = null;
if (
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_TOKEN
) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

// Cache of Ratelimit instances keyed by "{prefix}:{limit}:{window}"
const limiters = new Map<string, Ratelimit>();

function getLimiter(prefix: string, limit: number, window: string): Ratelimit | null {
  if (!redis) return null;
  const key = `${prefix}:${limit}:${window}`;
  if (!limiters.has(key)) {
    limiters.set(key, new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(limit, window as `${number} ${"s" | "m" | "h" | "d"}`), prefix }));
  }
  return limiters.get(key)!;
}

// In-memory fallback — survives only within a single serverless instance.
const memWindows = new Map<string, number[]>();
function inMemoryCheck(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const prev = (memWindows.get(key) ?? []).filter(t => now - t < windowMs);
  if (prev.length >= limit) { memWindows.set(key, prev); return false; }
  prev.push(now);
  memWindows.set(key, prev);
  return true;
}

/**
 * Checks a sliding-window rate limit.
 * @returns true if the request is allowed, false if it should be rejected.
 */
export async function checkRateLimit(
  key: string,
  prefix: string,
  limit: number,
  windowSeconds: number,
): Promise<boolean> {
  const limiter = getLimiter(prefix, limit, `${windowSeconds} s`);
  if (limiter) {
    const { success } = await limiter.limit(key);
    return success;
  }
  return inMemoryCheck(key, limit, windowSeconds * 1000);
}
