import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

// Upstash distributed rate limiter — survives multi-instance serverless.
// Falls back to in-memory when env vars are absent (local dev / CI).
let upstash: Ratelimit | null = null
if (
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_TOKEN
) {
  upstash = new Ratelimit({
    redis: new Redis({
      url:   process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    }),
    limiter: Ratelimit.slidingWindow(3, "60 s"),
    prefix:  "nimipiko:airways",
  })
}

// ── In-memory fallback ────────────────────────────────────────────────────────
const windows = new Map<string, number[]>()

function inMemoryCheck(key: string, limit: number, windowMs: number): boolean {
  const now  = Date.now()
  const prev = (windows.get(key) ?? []).filter(t => now - t < windowMs)
  if (prev.length >= limit) { windows.set(key, prev); return false }
  prev.push(now)
  windows.set(key, prev)
  return true
}

/**
 * Returns true if the caller is within the allowed budget.
 * Distributed when Upstash env vars are set; in-memory otherwise.
 *
 * @param key      Unique per user+route, e.g. `passport:${userId}`
 * @param limit    Maximum calls per window (Upstash instance uses 3/60 s)
 * @param windowMs Used only by the in-memory fallback
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs = 60_000,
): Promise<boolean> {
  if (upstash) {
    const { success } = await upstash.limit(key)
    return success
  }
  return inMemoryCheck(key, limit, windowMs)
}
