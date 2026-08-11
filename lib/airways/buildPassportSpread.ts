import sharp from 'sharp'  // still needed for fallback bg + composite
import { createCanvas, registerFont, loadImage } from 'canvas'
import type { CanvasRenderingContext2D, Image } from 'canvas'
import path from 'path'
import { fetchTemplate, getTemplateDimensions } from './templateFetcher'
import type { AirwaysStory } from './airwaysData'
import { mergeField } from './layoutMerge'

try {
  const dir = path.join(process.cwd(), 'public', 'fonts')
  registerFont(path.join(dir, 'DejaVuSans-Bold.ttf'), { family: 'DejaVu', weight: 'bold' })
  registerFont(path.join(dir, 'DejaVuSans.ttf'),      { family: 'DejaVu', weight: 'normal' })
} catch {}

// Must match KitLayoutEditor W/H for passport-interior — coordinates are saved at this scale
export const SPREAD_W = 2200
export const SPREAD_H = 1100

// ── Layout types ──────────────────────────────────────────────────────────────

export interface PassportSpreadLayout {
  photo?:          { x: number; y: number; w: number; h: number }
  attitude_badge?: { x: number; y: number; w: number; h: number }
  qr?:             { x: number; y: number; w: number; h: number }
  name?:           { x: number; y: number; font_size: number; w: number; color?: string }
  champion?:       { x: number; y: number; font_size: number; w: number; color?: string }
  date?:           { x: number; y: number; font_size: number; w: number; color?: string }
  dest_num?:       { x: number; y: number; font_size: number; w: number; color?: string }
  title?:          { x: number; y: number; font_size: number; w: number; color?: string }
  book_icon?:      { x: number; y: number; w: number; h: number }
  livre_num?:      { x: number; y: number; font_size: number; w: number; color?: string }
  book_cover?:     { x: number; y: number; w: number; h: number }
  cover_name?:     { x: number; y: number; font_size: number; w: number; color?: string }
  date_val?:       { x: number; y: number; font_size: number; w: number; color?: string }
  next_cover?:     { x: number; y: number; w: number; h: number }
  next_title?:     { x: number; y: number; font_size: number; w: number; color?: string }
}

const DEFAULTS: Required<PassportSpreadLayout> = {
  // Left identity page (per-kid)
  photo:          { x: 60,  y: 310, w: 210, h: 265 },
  attitude_badge: { x: 1595, y: 210, w: 455, h: 230 },
  qr:             { x: 455, y: 370, w: 148, h: 148 },
  name:           { x: 300, y: 335, font_size: 36, w: 400 },
  champion:       { x: 300, y: 410, font_size: 26, w: 300 },
  date:           { x: 300, y: 478, font_size: 22, w: 300 },
  // Right destination page (per-story)
  dest_num:   { x: 1800, y: 68,  font_size: 22, w: 150 },
  title:      { x: 1145, y: 132, font_size: 40, w: 950 },
  book_icon:  { x: 1260, y: 15,  w: 100, h: 100 },
  livre_num:  { x: 1145, y: 220, font_size: 28, w: 225 },
  book_cover: { x: 1145, y: 262, w: 225, h: 315 },
  cover_name: { x: 1145, y: 592, font_size: 22, w: 225 },
  date_val:   { x: 1145, y: 628, font_size: 28, w: 300 },
  next_cover: { x: 1148, y: 758, w: 100, h: 125 },
  next_title: { x: 1270, y: 776, font_size: 22, w: 450 },
}

function get<K extends keyof PassportSpreadLayout>(
  layout: PassportSpreadLayout, key: K
): Required<PassportSpreadLayout>[K] {
  return mergeField(
    layout[key] as Record<string, unknown> | undefined,
    DEFAULTS[key] as Record<string, unknown>,
  ) as Required<PassportSpreadLayout>[K]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function txt(
  ctx: CanvasRenderingContext2D, str: string, x: number, y: number,
  opts: { size: number; bold?: boolean; color?: string; align?: CanvasTextAlign; maxWidth?: number }
) {
  ctx.save()
  ctx.fillStyle    = opts.color ?? '#0D1B30'
  ctx.font         = `${opts.bold ? 'bold' : 'normal'} ${opts.size}px DejaVu, sans-serif`
  ctx.textAlign    = opts.align ?? 'left'
  ctx.textBaseline = 'top'
  if (opts.maxWidth) ctx.fillText(str, x, y, opts.maxWidth)
  else               ctx.fillText(str, x, y)
  ctx.restore()
}

function roundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.arcTo(x + w, y,     x + w, y + r,     r)
  ctx.lineTo(x + w, y + h - r)
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
  ctx.lineTo(x + r, y + h)
  ctx.arcTo(x,     y + h, x,     y + h - r, r)
  ctx.lineTo(x,     y + r)
  ctx.arcTo(x,     y,     x + r, y,         r)
  ctx.closePath()
}

async function drawImg(
  ctx: CanvasRenderingContext2D, dataUri: string,
  x: number, y: number, w: number, h: number,
  clip: boolean | 'oval' | 'rounded' = false,
  fit: 'cover' | 'contain' = 'cover',
  focalY = 0.5   // 0 = top, 0.5 = center, 1 = bottom
) {
  try {
    const img: Image = await loadImage(dataUri)
    ctx.save()
    if (clip) {
      if (clip === 'oval') {
        ctx.beginPath()
        ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2)
        ctx.clip()
      } else if (clip === 'rounded') {
        const r = Math.min(w, h) * 0.12
        roundedRectPath(ctx, x, y, w, h, r)
        ctx.clip()
      } else {
        ctx.beginPath()
        ctx.rect(x, y, w, h)
        ctx.clip()
      }
    }
    // scale preserving aspect ratio
    const scale = fit === 'cover'
      ? Math.max(w / img.width, h / img.height)
      : Math.min(w / img.width, h / img.height)
    const sw = img.width  * scale
    const sh = img.height * scale
    const dx = x + (w - sw) / 2
    // focalY controls vertical crop — 0 = show top, 0.5 = center, 1 = bottom
    const dy = y + (h - sh) * focalY
    ctx.drawImage(img as unknown as Parameters<typeof ctx.drawImage>[0], dx, dy, sw, sh)
    ctx.restore()
  } catch {}
}

// ── Main builder ──────────────────────────────────────────────────────────────

export interface PassportSpreadData {
  childName:             string
  championNumber:        string
  createdAt:             string
  photoDataUri:          string | null
  attitudeBadgeDataUri:  string | null
  qrDataUri:             string | null
  story:                 AirwaysStory
  bookNum:               number
  coverDataUri:          string | null
  nextStory:             AirwaysStory | null
  nextCoverDataUri:      string | null
  isPersonalized?:       boolean
  layout?:               PassportSpreadLayout | null
}

export async function buildPassportSpread(data: PassportSpreadData): Promise<Buffer> {
  const L = { ...DEFAULTS, ...(data.layout ?? {}) }

  // Fetch template (cached after first call) — use its ACTUAL pixel dimensions
  const spreadTemplateKey = data.isPersonalized === false ? 'passport-interior-free' : 'passport-interior'
  const templateBuf = await fetchTemplate(spreadTemplateKey)
  const dims = getTemplateDimensions(spreadTemplateKey)
  const TW = dims?.width  ?? SPREAD_W
  const TH = dims?.height ?? SPREAD_H

  // Canvas matches the real template dimensions exactly — no stretch
  const canvas = createCanvas(TW, TH)
  const ctx    = canvas.getContext('2d')

  // ── Left page — Identity ──────────────────────────────────────────────────

  const ph = get(L, 'photo')
  if (data.photoDataUri) {
    // rounded clip + cover + top-bias (face stays at top of frame)
    await drawImg(ctx, data.photoDataUri, ph.x, ph.y, ph.w, ph.h, 'rounded', 'cover', 0.2)
  }

  const ab = get(L, 'attitude_badge')
  if (data.attitudeBadgeDataUri) {
    // No clip — badge has its own holographic frame; contain so rainbow edges aren't cropped
    await drawImg(ctx, data.attitudeBadgeDataUri, ab.x, ab.y, ab.w, ab.h, false, 'contain')
  }

  const qr = get(L, 'qr')
  if (data.qrDataUri) {
    await drawImg(ctx, data.qrDataUri, qr.x, qr.y, qr.w, qr.h)
  }

  const nm = get(L, 'name')
  txt(ctx, data.childName.toUpperCase(), nm.x, nm.y,
    { size: nm.font_size, bold: true, color: nm.color ?? '#0D1B30', maxWidth: nm.w })

  const ch = get(L, 'champion')
  txt(ctx, data.championNumber, ch.x, ch.y,
    { size: ch.font_size, bold: true, color: ch.color ?? '#0D1B30', maxWidth: ch.w })

  const dt = get(L, 'date')
  const dateStr = data.createdAt
    ? new Date(data.createdAt).toLocaleDateString('fr-FR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
      }).replace(/\//g, '  ')
    : ''
  txt(ctx, dateStr, dt.x, dt.y,
    { size: dt.font_size, bold: false, color: dt.color ?? '#0D1B30', maxWidth: dt.w })

  // ── Right page — Destination ──────────────────────────────────────────────

  const dn = get(L, 'dest_num')
  txt(ctx, String(data.bookNum), dn.x, dn.y,
    { size: dn.font_size, bold: true, color: dn.color ?? '#1A7A3E', maxWidth: dn.w })

  const ti = get(L, 'title')
  // Measure rendered width so cover rect matches the actual title footprint
  ctx.save()
  ctx.font = `bold ${ti.font_size}px DejaVu, sans-serif`
  const titleRenderW = Math.min(ctx.measureText(data.story.title.toUpperCase()).width, ti.w)
  ctx.restore()
  txt(ctx, data.story.title.toUpperCase(), ti.x, ti.y,
    { size: ti.font_size, bold: true, color: ti.color ?? '#0D1B30', maxWidth: ti.w })

  const bi = get(L, 'book_icon')
  if (data.coverDataUri) {
    await drawImg(ctx, data.coverDataUri, bi.x, bi.y, bi.w, bi.h, 'oval', 'cover')
  }

  const ln = get(L, 'livre_num')
  const livreText = `LIVRE ${data.bookNum}`
  ctx.save()
  ctx.font = `bold ${ln.font_size}px DejaVu, sans-serif`
  const livreRenderW = Math.min(ctx.measureText(livreText).width, ln.w)
  ctx.restore()
  txt(ctx, livreText, ln.x + ln.w / 2, ln.y,
    { size: ln.font_size, bold: true, color: ln.color ?? '#1A7A3E', maxWidth: ln.w, align: 'center' })

  const bc = get(L, 'book_cover')
  if (data.coverDataUri) {
    await drawImg(ctx, data.coverDataUri, bc.x, bc.y, bc.w, bc.h, 'oval')
  }

  const cn = get(L, 'cover_name')
  const coverNameText = data.story.title.toUpperCase()
  ctx.save()
  ctx.font = `bold ${cn.font_size}px DejaVu, sans-serif`
  const coverNameRenderW = Math.min(ctx.measureText(coverNameText).width, cn.w)
  ctx.restore()
  txt(ctx, coverNameText, cn.x + cn.w / 2, cn.y,
    { size: cn.font_size, bold: true, color: cn.color ?? '#1A7A3E', maxWidth: cn.w, align: 'center' })

  const dv = get(L, 'date_val')
  const valDate = data.story.completed_at
    ? new Date(data.story.completed_at).toLocaleDateString('fr-FR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
      }).replace(/\//g, '  ')
    : ''
  txt(ctx, valDate, dv.x, dv.y,
    { size: dv.font_size, bold: true, color: dv.color ?? '#0D1B30', maxWidth: dv.w })

  if (data.nextStory) {
    const nc = get(L, 'next_cover')
    const nt = get(L, 'next_title')
    const nextBookNum = data.nextStory.sort_order

    // "LIVRE X" label directly above the thumbnail
    const nextLivreLabel = `LIVRE ${nextBookNum}`
    txt(ctx, nextLivreLabel, nc.x + nc.w / 2, nc.y - 30,
      { size: 20, bold: true, color: '#1A7A3E', align: 'center' })

    if (data.nextCoverDataUri) {
      await drawImg(ctx, data.nextCoverDataUri, nc.x, nc.y, nc.w, nc.h, true, 'cover', 0.2)
    }

    const nextTitle = data.nextStory.title.length > 36
      ? data.nextStory.title.slice(0, 34) + '…'
      : data.nextStory.title
    txt(ctx, nextTitle.toUpperCase(), nt.x, nt.y,
      { size: nt.font_size, bold: true, color: nt.color ?? '#0D1B30', maxWidth: nt.w })
  }

  // ── Composite overlay onto template ───────────────────────────────────────

  const overlay = canvas.toBuffer('image/png')

  if (templateBuf) {
    const BG = { r: 252, g: 228, b: 196 } // #FCE4C4 — passport background

    // Helper: build a solid cover rect buffer
    async function coverRect(x: number, y: number, w: number, h: number) {
      const buf = await sharp({
        create: { width: Math.max(1, Math.ceil(w)), height: Math.max(1, Math.ceil(h)),
                  channels: 3, background: BG },
      }).png().toBuffer()
      return { input: buf, left: Math.round(x), top: Math.round(y) }
    }

    // 1. Story title at top (covers baked "NIMI À L'ÉCOLE" / template default title)
    const titleCoverY = Math.max(0, Math.round(ti.y) - Math.round(ti.font_size))
    const titleCoverH = Math.round(ti.font_size) * 2 + 6

    // 2. "LIVRE X" above the oval — rect sized to the actual rendered text
    const livreH = Math.round(ln.font_size) + 10
    const livreCoverX = ln.x + ln.w / 2 - livreRenderW / 2  // centre-aligned

    // 3. Story title below the oval — rect sized to the actual rendered text
    const nameH = Math.round(cn.font_size) + 10
    const nameCoverX = cn.x + cn.w / 2 - coverNameRenderW / 2  // centre-aligned

    const [titleCover, livreCover, nameCover] = await Promise.all([
      coverRect(ti.x, titleCoverY, titleRenderW + 4, titleCoverH),
      coverRect(livreCoverX, Math.max(0, ln.y - 4), livreRenderW + 4, livreH),
      coverRect(nameCoverX,  Math.max(0, cn.y - 4), coverNameRenderW + 4, nameH),
    ])

    return sharp(templateBuf)
      .composite([titleCover, livreCover, nameCover, { input: overlay, left: 0, top: 0 }])
      .png()
      .toBuffer()
  }

  // No template: cream fallback background at template dimensions
  const bg = await sharp({
    create: { width: TW, height: TH, channels: 4, background: { r: 245, g: 237, b: 218, alpha: 1 } },
  }).png().toBuffer()
  return sharp(bg).composite([{ input: overlay, left: 0, top: 0 }]).png().toBuffer()
}
