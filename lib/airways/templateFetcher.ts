/**
 * Fetches an Airways template image from the Supabase public bucket.
 * Returns a Buffer or null if the template has not been uploaded yet.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const BUCKET = 'airways-templates'
const EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp']

export async function fetchTemplate(key: string): Promise<Buffer | null> {
  for (const ext of EXTENSIONS) {
    const url = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${key}.${ext}`
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(8000), cache: 'no-store' })
      if (!res.ok) continue
      return Buffer.from(await res.arrayBuffer())
    } catch {
      continue
    }
  }
  return null
}
