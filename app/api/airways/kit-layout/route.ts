export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase/serviceClient'
import { getAuthUser } from '@/lib/supabaseRouteAuth'

export async function POST(req: NextRequest) {
  const supabase = getServiceClient()

  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Only admins can save layout
  const { data: admin } = await supabase.from('admins').select('id').eq('id', user.id).maybeSingle()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const rows = await req.json()
  if (!Array.isArray(rows)) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

  const { error } = await supabase.from('kit_layout').upsert(rows, { onConflict: 'field' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
