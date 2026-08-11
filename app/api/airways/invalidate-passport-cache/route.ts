export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/supabaseRouteAuth'
import { getServiceClient } from '@/lib/supabase/serviceClient'

const BUCKET = 'passport-cache'

/**
 * POST /api/airways/invalidate-passport-cache?childId=<uuid>
 *
 * Deletes the cached passport PDF for a child so the next download
 * regenerates from current progress. Called fire-and-forget from
 * completeCurriculumMission whenever a child completes a mission —
 * the completion may have finished a story, making the cached passport stale.
 *
 * Auth: caller must be the parent of the child (or an admin).
 * Errors are swallowed on the client — a stale cache is better than
 * blocking the mission-complete flow.
 */
export async function POST(req: NextRequest) {
  const supabase = getServiceClient()
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const childId = new URL(req.url).searchParams.get('childId')
  if (!childId) return NextResponse.json({ error: 'childId required' }, { status: 400 })

  // Ownership check — parent or admin
  const [{ data: child }, { data: admin }] = await Promise.all([
    supabase.from('children').select('parent_id').eq('id', childId).maybeSingle(),
    supabase.from('admins').select('id').eq('id', user.id).maybeSingle(),
  ])
  if (!admin && child?.parent_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { error } = await supabase.storage
    .from(BUCKET)
    .remove([`${childId}.pdf`])

  if (error) {
    // Not found (ENOENT) is not a real error — cache was already cold
    const notFound = error.message?.toLowerCase().includes('not found') || error.message?.toLowerCase().includes('no such')
    if (!notFound) {
      console.error('[invalidate-passport-cache] storage error:', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  return NextResponse.json({ ok: true, childId })
}
