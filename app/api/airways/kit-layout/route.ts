export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase/serviceClient'
import { getAuthUser } from '@/lib/supabaseRouteAuth'

export async function GET(req: NextRequest) {
  const supabase = getServiceClient()
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: admin } = await supabase.from('admins').select('id').eq('id', user.id).maybeSingle()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const template = new URL(req.url).searchParams.get('template') ?? 'kit'

  const { data, error } = await supabase
    .from('template_layout')
    .select('field,x,y,w,h,font_size,bold,color')
    .eq('template', template)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const supabase = getServiceClient()
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: admin } = await supabase.from('admins').select('id').eq('id', user.id).maybeSingle()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const template = new URL(req.url).searchParams.get('template') ?? 'kit'

  const rows = await req.json()
  if (!Array.isArray(rows)) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

  const upsertRows = rows.map((r: Record<string, unknown>) => ({ ...r, template }))

  const { error } = await supabase
    .from('template_layout')
    .upsert(upsertRows, { onConflict: 'template,field' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
