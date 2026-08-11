import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

// Upstash distributed rate limiter — survives multi-instance serverless.
// Falls back to in-memory when env vars are absent (local dev / CI).
// Two instances so the `limit` parameter is honoured in production:
//   upstashStrict → 3/min  (passport, badge — heavy ML/PDF build)
//   upstashLight  → 5/min  (boarding-pass, stamps, kit — lighter builds)
let upstashStrict: Ratelimit | null = null
let upstashLight:  Ratelimit | null = null
if (
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_TOKEN
) {
  const redis = new Redis({
    url:   process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  })
  upstashStrict = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(3, "60 s"), prefix: "nimipiko:airways" })
  upstashLight  = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, "60 s"), prefix: "nimipiko:airways" })
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
  const upstash = limit <= 3 ? upstashStrict : upstashLight
  if (upstash) {
    try {
      const { success } = await upstash.limit(key)
      return success
    } catch {
      // Upstash unreachable — degrade to in-memory rather than blocking the request
      console.warn('[rateLimiter] Upstash error, falling back to in-memory')
    }
  }
  return inMemoryCheck(key, limit, windowMs)
}
