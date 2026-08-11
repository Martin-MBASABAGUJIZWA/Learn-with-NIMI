export const runtime = 'nodejs'
export const maxDuration = 60

import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/supabaseRouteAuth'
import { getServiceClient } from '@/lib/supabase/serviceClient'
import { PDFDocument } from 'pdf-lib'
import sharp from 'sharp'
import { fetchAirwaysData } from '@/lib/airways/airwaysData'
import { buildBoardingPassImage, type BPLayout } from '@/lib/airways/buildBoardingPassImage'
import { avatarUrlToBuffer } from '@/lib/airways/avatarToBuffer'
import { safeFilename } from '@/lib/airways/safeFilename'
import { checkRateLimit } from '@/lib/airways/rateLimiter'

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
  const pw = 595, ph = 842
  const scale = Math.min(pw / img.width, ph / img.height)
  const page = doc.addPage([pw, ph])
  page.drawImage(img, {
    x: (pw - img.width * scale) / 2,
    y: (ph - img.height * scale) / 2,
    width: img.width * scale,
    height: img.height * scale,
  })
  return doc.save()
}

export async function GET(req: NextRequest) {
  const supabase = getServiceClient()

  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!(await checkRateLimit(`boarding-pass:${user.id}`, 5)))
    return NextResponse.json({ error: 'Too many requests — please wait a minute.' }, { status: 429 })

  const { searchParams } = new URL(req.url)
  const childId = searchParams.get('childId')
  const format = searchParams.get('format') === 'png' ? 'png' : 'pdf'

  if (!childId) return NextResponse.json({ error: 'childId required' }, { status: 400 })

  const [{ data: child }, { data: adminRow }] = await Promise.all([
    supabase.from('children').select('parent_id').eq('id', childId).single(),
    supabase.from('admins').select('id').eq('id', user.id).maybeSingle(),
  ])
  if (!adminRow && child?.parent_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
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

  const currentStory = data.current_story ?? data.stories[0] ?? null
  if (!currentStory) return NextResponse.json({ error: 'No story available' }, { status: 404 })

  // Load layout for the correct tier's template
  const bpLayoutKey = isPersonalized ? 'boarding-pass' : 'boarding-pass-free'
  const { data: layoutRows } = await supabase
    .from('template_layout').select('field,x,y,w,h,font_size,bold,color').eq('template', bpLayoutKey)
  const layout: BPLayout = {}
  for (const row of layoutRows ?? []) {
    layout[row.field] = { x: row.x, y: row.y, w: row.w, h: row.h, font_size: row.font_size, bold: row.bold, color: row.color }
  }

  const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  let photoBuffer: Buffer | null = null

  // Photo only fetched for personalized (subscribed) users
  if (isPersonalized) {
    const avatarBuf = await avatarUrlToBuffer(data.avatar_url, 295)
    if (avatarBuf) {
      photoBuffer = avatarBuf
    } else if (data.avatar_url && !data.avatar_url.startsWith('ava:')) {
      const photoUrl = data.avatar_url.startsWith('http')
        ? data.avatar_url
        : `${supaUrl}/storage/v1/object/public/${data.avatar_url}`
      const raw = await fetchPhotoBuffer(photoUrl)
      if (raw) photoBuffer = await sharp(raw).png().toBuffer()
    }
  }

  const displayName = isPersonalized ? data.name : 'PETIT CHAMPION'

  const png = await buildBoardingPassImage({
    childName:      displayName,
    age:            data.age,
    storyTitle:     currentStory.title,
    storyNumber:    currentStory.sort_order,
    storySlug:      currentStory.slug ?? String(currentStory.sort_order),
    childId:        data.id,
    photoBuffer,
    isPersonalized,
    layout,
  })

  const safeName = safeFilename(displayName)

  if (format === 'png') {
    return new NextResponse(new Uint8Array(png), {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="${safeName}_boarding_pass.png"`,
      },
    })
  }

  const pdfBytes = await pngToPdf(png)
  return new NextResponse(new Uint8Array(pdfBytes), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${safeName}_boarding_pass.pdf"`,
    },
  })
}
