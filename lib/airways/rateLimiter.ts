/**
 * Sliding-window in-memory rate limiter for expensive PDF routes.
 * Not distributed — one counter per server instance, which is fine for
 * serverless (each instance's budget is per-user, not global).
 */

interface Window {
  timestamps: number[]
}

const windows = new Map<string, Window>()

/**
 * Returns true if the caller is within the allowed budget.
 * @param key      Typically `${userId}:${routeName}`
 * @param limit    Maximum calls allowed in `windowMs`
 * @param windowMs Sliding window duration in milliseconds (default 60 000)
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs = 60_000,
): boolean {
  const now = Date.now()
  const entry = windows.get(key) ?? { timestamps: [] }

  // Evict timestamps outside the window
  entry.timestamps = entry.timestamps.filter(t => now - t < windowMs)

  if (entry.timestamps.length >= limit) {
    windows.set(key, entry)
    return false
  }

  entry.timestamps.push(now)
  windows.set(key, entry)
  return true
}
