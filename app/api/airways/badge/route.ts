export const runtime    = 'nodejs'
export const maxDuration = 90

import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/supabaseRouteAuth'
import { getServiceClient } from '@/lib/supabase/serviceClient'
import sharp from 'sharp'
import { fetchAirwaysData } from '@/lib/airways/airwaysData'
import { buildAttitudeBadge, type AttitudeBadgeLayout } from '@/lib/airways/buildAttitudeBadge'
import { avatarUrlToBuffer } from '@/lib/airways/avatarToBuffer'
import { isAvatarConfig } from '@/lib/avatarConfig'
import { checkRateLimit } from '@/lib/airways/rateLimiter'
import { safeFilename } from '@/lib/airways/safeFilename'

const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''

async function fetchAsDataUri(url: string, w: number, h: number): Promise<string | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) return null
    const buf     = Buffer.from(await res.arrayBuffer())
    const resized = await sharp(buf).resize(w, h, { fit: 'cover' }).png().toBuffer()
    return `data:image/png;base64,${resized.toString('base64')}`
  } catch { return null }
}

function publicUrl(raw: string): string {
  return raw.startsWith('http') ? raw : `${supaUrl}/storage/v1/object/public/${raw}`
}

export async function GET(req: NextRequest) {
  const supabase = getServiceClient()
  const user     = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!checkRateLimit(`badge:${user.id}`, 3))
    return NextResponse.json({ error: 'Too many requests — please wait a minute before generating another badge.' }, { status: 429 })

  const { searchParams } = new URL(req.url)
  const childId = searchParams.get('childId')
  if (!childId) return NextResponse.json({ error: 'childId required' }, { status: 400 })

  const [{ data: child }, { data: adminRow }] = await Promise.all([
    supabase.from('children').select('parent_id').eq('id', childId).single(),
    supabase.from('admins').select('id').eq('id', user.id).maybeSingle(),
  ])
  if (!adminRow && child?.parent_id !== user.id)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (!adminRow) {
    const { data: sub } = await supabase
      .from('nimipiko_subscriptions')
      .select('id')
      .eq('parent_id', user.id)
      .in('status', ['active', 'trial'])
      .maybeSingle()
    if (!sub) return NextResponse.json({ error: 'Subscription required' }, { status: 402 })
  }

  const [data, story1Row] = await Promise.all([
    fetchAirwaysData(supabase, childId),
    supabase
      .from('stories')
      .select('id, title, sort_order, attitude')
      .eq('sort_order', 1)
      .maybeSingle()
      .then(r => r.data),
  ])

  if (!data) return NextResponse.json({ error: 'Child not found' }, { status: 404 })

  const attitude = data.attitude
    ?? story1Row?.attitude
    ?? data.stories.find(s => s.sort_order === 1)?.attitude
    ?? null

  if (!attitude)
    return NextResponse.json({
      error: 'No attitude found — set attitude on Story 1 via Admin → Curriculum → Stories',
    }, { status: 422 })

  const book1Title = story1Row?.title      ?? data.stories.find(s => s.sort_order === 1)?.title ?? ''
  const book1Order = story1Row?.sort_order ?? 1

  const { data: layoutRows } = await supabase
    .from('template_layout')
    .select('field,x,y,w,h,font_size,color')
    .eq('template', 'badge-template')

  const layout: AttitudeBadgeLayout = {}
  for (const row of layoutRows ?? []) {
    (layout as Record<string, unknown>)[row.field] = {
      x: row.x, y: row.y, w: row.w, h: row.h,
      font_size: row.font_size, color: row.color ?? undefined,
    }
  }

  // Avatar stored as "ava:{…json…}" → render to PNG data URI; real URLs → fetch normally
  let photoUri: string | null = null
  if (data.avatar_url) {
    if (isAvatarConfig(data.avatar_url)) {
      const buf = await avatarUrlToBuffer(data.avatar_url, 320)
      if (buf) photoUri = `data:image/png;base64,${buf.toString('base64')}`
    } else {
      photoUri = await fetchAsDataUri(publicUrl(data.avatar_url), 320, 320)
    }
  }

  try {
    const badgeBuf = await buildAttitudeBadge({
      attitude,
      storyTitle:        book1Title,
      bookNumber:        book1Order,
      childPhotoDataUri: photoUri,
      layout,
    })

    const safeName = safeFilename(data.name)
    return new NextResponse(new Uint8Array(badgeBuf), {
      headers: {
        'Content-Type':        'image/png',
        'Content-Disposition': `attachment; filename="${safeName}_attitude_badge.png"`,
      },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[badge] build error:', msg)
    return NextResponse.json({ error: `Badge build failed: ${msg}` }, { status: 500 })
  }
}
