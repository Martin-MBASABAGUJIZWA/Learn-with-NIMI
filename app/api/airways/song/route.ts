export const runtime    = 'nodejs'
export const maxDuration = 30

import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/supabaseRouteAuth'
import { getServiceClient } from '@/lib/supabase/serviceClient'
import { checkRateLimit } from '@/lib/airways/rateLimiter'

const CHILD_SONGS_BUCKET = 'child-songs'

const AUDIO_MIME: Record<string, string> = {
  mp3:  'audio/mpeg',
  m4a:  'audio/mp4',
  ogg:  'audio/ogg',
  wav:  'audio/wav',
  webm: 'audio/webm',
}

function extOf(name: string): string {
  return name.split('.').pop()?.toLowerCase() ?? ''
}

export async function GET(req: NextRequest) {
  const supabase = getServiceClient()
  const user     = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!(await checkRateLimit(`song:${user.id}`, 10)))
    return NextResponse.json({ error: 'Too many requests — please wait a minute.' }, { status: 429 })

  const { searchParams } = new URL(req.url)
  const childId = searchParams.get('childId')

  if (!childId) return NextResponse.json({ error: 'childId required' }, { status: 400 })

  const [{ data: child }, { data: adminRow }] = await Promise.all([
    supabase.from('children').select('parent_id').eq('id', childId).single(),
    supabase.from('admins').select('id').eq('id', user.id).maybeSingle(),
  ])
  if (!adminRow && child?.parent_id !== user.id)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Song is a subscription-only feature (admins bypass)
  if (!adminRow) {
    const { data: sub } = await supabase
      .from('nimipiko_subscriptions')
      .select('id')
      .eq('parent_id', user.id)
      .in('status', ['active', 'trial'])
      .maybeSingle()
    if (!sub)
      return NextResponse.json({ error: 'A subscription is required to download your child\'s song.' }, { status: 403 })
  }

  // List audio files under child-songs/{childId}/
  const { data: files, error: listErr } = await supabase.storage
    .from(CHILD_SONGS_BUCKET)
    .list(childId, { sortBy: { column: 'name', order: 'asc' } })

  if (listErr) {
    console.error('[song] list error:', listErr.message)
    return NextResponse.json({ error: 'Failed to look up song files.' }, { status: 500 })
  }

  const audioFiles = (files ?? []).filter(f => Object.keys(AUDIO_MIME).includes(extOf(f.name)))

  if (audioFiles.length === 0)
    return NextResponse.json({ error: 'No song has been uploaded for this child yet.' }, { status: 404 })

  // Download the first audio file found
  const file     = audioFiles[0]
  const filePath = `${childId}/${file.name}`

  const { data: blob, error: downloadErr } = await supabase.storage
    .from(CHILD_SONGS_BUCKET)
    .download(filePath)

  if (downloadErr || !blob) {
    console.error('[song] download error:', downloadErr?.message)
    return NextResponse.json({ error: 'Failed to download song file.' }, { status: 500 })
  }

  const ext      = extOf(file.name)
  const mimeType = AUDIO_MIME[ext] ?? 'application/octet-stream'
  const buffer   = Buffer.from(await blob.arrayBuffer())

  console.log(`[song] served ${filePath} (${buffer.length} bytes) | child=${childId}`)

  return new NextResponse(buffer, {
    headers: {
      'Content-Type':        mimeType,
      'Content-Disposition': `attachment; filename="${file.name}"`,
      'Content-Length':      String(buffer.length),
      'Cache-Control':       'private, no-store',
    },
  })
}
