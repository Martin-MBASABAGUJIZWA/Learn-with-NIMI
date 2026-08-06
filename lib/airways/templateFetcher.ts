/**
 * Fetches Airways template images from the Supabase public bucket.
 * - Hit: cached buffer for 10 minutes.
 * - Miss: negative-cached for 60 seconds (stops 4×network per miss on cold paths).
 * - In-flight deduplication: concurrent callers for the same key share one fetch.
 */

import sharp from 'sharp'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const BUCKET = 'airways-templates'
const EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp']
const TTL_HIT_MS  = 10 * 60 * 1000   // 10 min for found templates
const TTL_MISS_MS =      60 * 1000   // 60 s  for missing templates

interface CacheEntry {
  buf:       Buffer | null   // null = confirmed missing
  width:     number
  height:    number
  expiresAt: number
}

const cache    = new Map<string, CacheEntry>()
const inflight = new Map<string, Promise<Buffer | null>>()

export async function fetchTemplate(key: string): Promise<Buffer | null> {
  // Serve from cache (hit or confirmed miss)
  const cached = cache.get(key)
  if (cached && cached.expiresAt > Date.now()) return cached.buf

  // Deduplicate concurrent fetches for the same key
  const existing = inflight.get(key)
  if (existing) return existing

  const promise = (async (): Promise<Buffer | null> => {
    for (const ext of EXTENSIONS) {
      const url = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${key}.${ext}`
      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
        if (!res.ok) continue
        const buf  = Buffer.from(await res.arrayBuffer())
        const meta = await sharp(buf).metadata()
        cache.set(key, {
          buf,
          width:     meta.width  ?? 0,
          height:    meta.height ?? 0,
          expiresAt: Date.now() + TTL_HIT_MS,
        })
        return buf
      } catch {
        continue
      }
    }
    // Negative cache — don't hammer storage on every request for missing templates
    cache.set(key, { buf: null, width: 0, height: 0, expiresAt: Date.now() + TTL_MISS_MS })
    return null
  })()

  inflight.set(key, promise)
  try {
    return await promise
  } finally {
    inflight.delete(key)
  }
}

export function getTemplateDimensions(key: string): { width: number; height: number } | null {
  const cached = cache.get(key)
  if (cached && cached.expiresAt > Date.now() && cached.buf !== null) {
    return { width: cached.width, height: cached.height }
  }
  return null
}

/** Clears a single template from cache (e.g. after admin upload/delete). */
export function invalidateTemplate(key: string): void {
  cache.delete(key)
}
