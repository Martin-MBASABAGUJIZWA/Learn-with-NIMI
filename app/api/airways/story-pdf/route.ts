export const runtime    = 'nodejs'
export const maxDuration = 120

import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/supabaseRouteAuth'
import { getServiceClient } from '@/lib/supabase/serviceClient'
import sharp from 'sharp'
import { fetchAirwaysData } from '@/lib/airways/airwaysData'
import { buildPersonalizedStoryPdf, type StoryPageLayout } from '@/lib/airways/buildPersonalizedStoryPdf'
import { avatarUrlToBuffer } from '@/lib/airways/avatarToBuffer'
import { isAvatarConfig } from '@/lib/avatarConfig'
import { checkRateLimit } from '@/lib/airways/rateLimiter'
import { safeFilename } from '@/lib/airways/safeFilename'

async function fetchPhotoBuffer(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) return null
    return Buffer.from(await res.arrayBuffer())
  } catch {
    return null
  }
}

export async function GET(req: NextRequest) {
  const supabase = getServiceClient()
  const user     = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!(await checkRateLimit(`story-pdf:${user.id}`, 5)))
    return NextResponse.json({ error: 'Too many requests — please wait a minute.' }, { status: 429 })

  const { searchParams } = new URL(req.url)
  const childId   = searchParams.get('childId')
  const storySlug = searchParams.get('storySlug')

  if (!childId)   return NextResponse.json({ error: 'childId required' },   { status: 400 })
  if (!storySlug) return NextResponse.json({ error: 'storySlug required' }, { status: 400 })

  const [{ data: child }, { data: adminRow }] = await Promise.all([
    supabase.from('children').select('parent_id').eq('id', childId).single(),
    supabase.from('admins').select('id').eq('id', user.id).maybeSingle(),
  ])
  if (!adminRow && child?.parent_id !== user.id)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Personalized story PDF is a subscription-only feature
  let isPersonalized = !!adminRow
  if (!adminRow) {
    const { data: sub } = await supabase
      .from('nimipiko_subscriptions')
      .select('id')
      .eq('parent_id', user.id)
      .in('status', ['active', 'trial'])
      .maybeSingle()
    isPersonalized = !!sub
  }

  if (!isPersonalized)
    return NextResponse.json({ error: 'A subscription is required to download personalized story PDFs.' }, { status: 403 })

  const data = await fetchAirwaysData(supabase, childId)
  if (!data) return NextResponse.json({ error: 'Child not found' }, { status: 404 })

  // Load per-page layout from DB (one row per story-page template, shared across pages)
  const { data: layoutRows } = await supabase
    .from('template_layout')
    .select('field,x,y,w,h,font_size,bold,color')
    .eq('template', 'story-page')
  const rawLayout: Record<string, { x: number; y: number; w: number | null; h: number | null; font_size: number | null; color: string | null }> = {}
  for (const row of layoutRows ?? []) {
    rawLayout[row.field] = row
  }

  const layout: StoryPageLayout | null = rawLayout.photo && rawLayout.name
    ? {
        photo_x:        rawLayout.photo.x,
        photo_y:        rawLayout.photo.y,
        photo_w:        rawLayout.photo.w  ?? 220,
        photo_h:        rawLayout.photo.h  ?? 280,
        name_x:         rawLayout.name.x,
        name_y:         rawLayout.name.y,
        name_font_size: rawLayout.name.font_size ?? 48,
        name_color:     rawLayout.name.color ?? '#1a1a2e',
      }
    : null

  const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''

  let photoBuffer: Buffer | null = null
  if (data.avatar_url) {
    if (isAvatarConfig(data.avatar_url)) {
      photoBuffer = await avatarUrlToBuffer(data.avatar_url, 220)
    } else {
      const photoUrl = data.avatar_url.startsWith('http')
        ? data.avatar_url
        : `${supaUrl}/storage/v1/object/public/${data.avatar_url}`
      const raw = await fetchPhotoBuffer(photoUrl)
      if (raw) photoBuffer = await sharp(raw).png().toBuffer()
    }
  }

  const t0 = Date.now()
  try {
    const pdfBytes = await buildPersonalizedStoryPdf(supabase, {
      storySlug,
      childName:   data.name,
      photoBuffer,
      layout,
    })

    if (!pdfBytes)
      return NextResponse.json({ error: 'Story pages have not been uploaded yet. Please check back later.' }, { status: 404 })

    const safeName = safeFilename(data.name)
    const safeSlug = storySlug.replace(/[^a-z0-9-]/gi, '_').toLowerCase()
    console.log(`[story-pdf] total ${Date.now() - t0}ms | child=${childId} | story=${storySlug}`)

    return new NextResponse(new Uint8Array(pdfBytes), {
      headers: {
        'Content-Type':        'application/pdf',
        'Content-Disposition': `attachment; filename="${safeName}_${safeSlug}_nimipiko.pdf"`,
        'Cache-Control':       'private, no-store',
      },
    })
  } catch (err) {
    console.error('[story-pdf] build error:', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: 'Story PDF generation failed. Please try again.' }, { status: 500 })
  }
}
