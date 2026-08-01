/**
 * Fetches Airways template images from the Supabase public bucket.
 * Caches buffer + dimensions in memory for 10 minutes.
 */

import sharp from 'sharp'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const BUCKET = 'airways-templates'
const EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp']
const TTL_MS = 10 * 60 * 1000

interface CacheEntry {
  buf:       Buffer
  width:     number
  height:    number
  expiresAt: number
}

const cache = new Map<string, CacheEntry>()

export async function fetchTemplate(key: string): Promise<Buffer | null> {
  const cached = cache.get(key)
  if (cached && cached.expiresAt > Date.now()) return cached.buf

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
        expiresAt: Date.now() + TTL_MS,
      })
      return buf
    } catch {
      continue
    }
  }
  return null
}

export function getTemplateDimensions(key: string): { width: number; height: number } | null {
  const cached = cache.get(key)
  if (cached && cached.expiresAt > Date.now()) {
    return { width: cached.width, height: cached.height }
  }
  return null
}
