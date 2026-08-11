export const runtime    = 'nodejs'
export const maxDuration = 15

import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/supabaseRouteAuth'
import { getServiceClient } from '@/lib/supabase/serviceClient'
import { fetchAirwaysData } from '@/lib/airways/airwaysData'

export async function GET(req: NextRequest) {
  const supabase = getServiceClient()
  const user     = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const childId = searchParams.get('childId')
  if (!childId) return NextResponse.json({ error: 'childId required' }, { status: 400 })

  const [{ data: child }, { data: adminRow }] = await Promise.all([
    supabase.from('children').select('parent_id').eq('id', childId).single(),
    supabase.from('admins').select('id').eq('id', user.id).maybeSingle(),
  ])
  if (!adminRow && child?.parent_id !== user.id)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const data = await fetchAirwaysData(supabase, childId)
  if (!data) return NextResponse.json({ error: 'Child not found' }, { status: 404 })

  return NextResponse.json({
    stories: data.stories.map(s => ({
      slug:       s.slug,
      title:      s.title,
      sort_order: s.sort_order,
      is_complete: s.is_complete,
    })),
  })
}
