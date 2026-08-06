import type { SupabaseClient } from "@supabase/supabase-js"

const BUCKET = "passport-cache"
const TTL_MS = 60 * 60 * 1000  // 1 hour — short enough to pick up layout changes

function key(childId: string) {
  return `${childId}.pdf`
}

/**
 * Returns the cached PDF for this child if one exists and is < 1 hour old.
 * Returns null on any miss or error — callers must generate on null.
 */
export async function getCachedPassport(
  supabase: SupabaseClient,
  childId: string,
): Promise<Buffer | null> {
  try {
    const { data: files } = await supabase.storage
      .from(BUCKET)
      .list("", { search: childId, limit: 1 })
    const file = files?.find(f => f.name === key(childId))
    if (!file) return null

    const modifiedAt = new Date(file.updated_at ?? file.created_at ?? 0).getTime()
    if (Date.now() - modifiedAt > TTL_MS) return null

    const { data } = await supabase.storage.from(BUCKET).download(key(childId))
    if (!data) return null

    return Buffer.from(await data.arrayBuffer())
  } catch {
    return null
  }
}

/**
 * Stores a generated passport PDF in the cache. Errors are swallowed — a
 * failed cache write does not affect the response already sent to the client.
 */
export async function setCachedPassport(
  supabase: SupabaseClient,
  childId: string,
  pdf: Uint8Array,
): Promise<void> {
  try {
    await supabase.storage.from(BUCKET).upload(key(childId), pdf, {
      contentType: "application/pdf",
      upsert: true,
    })
  } catch { /* non-fatal */ }
}
