export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/supabaseRouteAuth'
import { getServiceClient } from '@/lib/supabase/serviceClient'
import { invalidateTemplate } from '@/lib/airways/templateFetcher'

/**
 * POST /api/airways/invalidate-template?key=<template-key>
 *
 * Admin-only. Clears the in-process template cache so the next PDF generation
 * fetches the freshly uploaded image rather than serving a stale (or negatively
 * cached miss) entry. Called by AirwaysTemplatesManager after every upload/delete.
 *
 * Note: in a multi-instance serverless deployment only THIS instance's cache is
 * cleared. The 10-min hit TTL and 60-s miss TTL are low enough that the residual
 * risk is acceptable; the main practical benefit is admin QA on the same instance.
 */
export async function POST(req: NextRequest) {
  const supabase = getServiceClient()
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: admin } = await supabase
    .from('admins').select('id').eq('id', user.id).maybeSingle()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const key = new URL(req.url).searchParams.get('key')
  if (!key) return NextResponse.json({ error: 'key param required' }, { status: 400 })

  invalidateTemplate(key)
  return NextResponse.json({ ok: true, key })
}
