export const runtime    = 'nodejs'
export const maxDuration = 60

import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/supabaseRouteAuth'
import { getServiceClient } from '@/lib/supabase/serviceClient'
import { PDFDocument } from 'pdf-lib'
import sharp from 'sharp'
import { fetchAirwaysData, championNumber } from '@/lib/airways/airwaysData'
import { buildCertificateImage, type CertLayout } from '@/lib/airways/buildCertificateImage'
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

async function pngToPdf(png: Buffer): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const img = await doc.embedPng(png)
  // A4 landscape
  const pw = 842, ph = 595
  const scale = Math.min(pw / img.width, ph / img.height)
  const page = doc.addPage([pw, ph])
  page.drawImage(img, {
    x: (pw - img.width * scale) / 2,
    y: (ph - img.height * scale) / 2,
    width:  img.width  * scale,
    height: img.height * scale,
  })
  return doc.save()
}

export async function GET(req: NextRequest) {
  const supabase = getServiceClient()
  const user     = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!(await checkRateLimit(`certificate:${user.id}`, 5)))
    return NextResponse.json({ error: 'Too many requests — please wait a minute.' }, { status: 429 })

  const { searchParams } = new URL(req.url)
  const childId = searchParams.get('childId')
  const format  = searchParams.get('format') === 'png' ? 'png' : 'pdf'

  if (!childId) return NextResponse.json({ error: 'childId required' }, { status: 400 })

  const [{ data: child }, { data: adminRow }] = await Promise.all([
    supabase.from('children').select('parent_id').eq('id', childId).single(),
    supabase.from('admins').select('id').eq('id', user.id).maybeSingle(),
  ])
  if (!adminRow && child?.parent_id !== user.id)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

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

  const data = await fetchAirwaysData(supabase, childId)
  if (!data) return NextResponse.json({ error: 'Child not found' }, { status: 404 })

  // Certificate is awarded for the most recently completed story.
  // Fall back to story[0] only if nothing is complete yet (preview / admin use).
  const lastCompleted = data.stories
    .filter(s => s.is_complete)
    .sort((a, b) => b.sort_order - a.sort_order)[0] ?? null
  const currentStory = lastCompleted ?? data.stories[0] ?? null
  if (!currentStory)
    return NextResponse.json({ error: 'No story available for this child' }, { status: 404 })

  // Load layout for the correct tier
  const certLayoutKey = isPersonalized ? 'certificate' : 'certificate-free'
  const { data: layoutRows } = await supabase
    .from('template_layout')
    .select('field,x,y,w,h,font_size,bold,color')
    .eq('template', certLayoutKey)
  const layout: CertLayout = {}
  for (const row of layoutRows ?? []) {
    layout[row.field] = { x: row.x, y: row.y, w: row.w, h: row.h, font_size: row.font_size, bold: row.bold, color: row.color }
  }

  const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''

  // Photo only for personalized users
  let photoBuffer: Buffer | null = null
  if (isPersonalized && data.avatar_url) {
    if (isAvatarConfig(data.avatar_url)) {
      photoBuffer = await avatarUrlToBuffer(data.avatar_url, 200)
    } else {
      const photoUrl = data.avatar_url.startsWith('http')
        ? data.avatar_url
        : `${supaUrl}/storage/v1/object/public/${data.avatar_url}`
      const raw = await fetchPhotoBuffer(photoUrl)
      if (raw) photoBuffer = await sharp(raw).png().toBuffer()
    }
  }

  const displayName  = isPersonalized ? data.name : 'PETIT CHAMPION'
  const champNum     = isPersonalized
    ? championNumber(data.name, currentStory.sort_order, data.sibling_rank)
    : ''

  const t0 = Date.now()
  try {
    const png = await buildCertificateImage({
      childName:      displayName,
      storyTitle:     currentStory.title,
      storyNumber:    currentStory.sort_order,
      completedAt:    currentStory.completed_at ?? null,
      championNumber: champNum,
      photoBuffer,
      isPersonalized,
      layout,
    })

    const safeName = safeFilename(displayName)
    console.log(`[certificate] total ${Date.now() - t0}ms | child=${childId}`)

    if (format === 'png') {
      return new NextResponse(new Uint8Array(png), {
        headers: {
          'Content-Type':        'image/png',
          'Content-Disposition': `attachment; filename="${safeName}_certificat_nimipiko.png"`,
        },
      })
    }

    const pdfBytes = await pngToPdf(png)
    return new NextResponse(new Uint8Array(pdfBytes), {
      headers: {
        'Content-Type':        'application/pdf',
        'Content-Disposition': `attachment; filename="${safeName}_certificat_nimipiko.pdf"`,
      },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[certificate] build error:', msg)
    return NextResponse.json({ error: `Certificate build failed: ${msg}` }, { status: 500 })
  }
}
