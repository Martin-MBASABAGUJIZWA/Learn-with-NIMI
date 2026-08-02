import sharp from 'sharp'  // still needed for fallback bg + composite
import { createCanvas, registerFont, loadImage } from 'canvas'
import type { CanvasRenderingContext2D, Image } from 'canvas'
import path from 'path'
import { fetchTemplate, getTemplateDimensions } from './templateFetcher'
import type { AirwaysStory } from './airwaysData'

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
  photo?:      { x: number; y: number; w: number; h: number }
  qr?:         { x: number; y: number; w: number; h: number }
  name?:       { x: number; y: number; font_size: number; w: number }
  champion?:   { x: number; y: number; font_size: number; w: number }
  date?:       { x: number; y: number; font_size: number; w: number }
  dest_num?:   { x: number; y: number; font_size: number; w: number }
  title?:      { x: number; y: number; font_size: number; w: number }
  book_cover?: { x: number; y: number; w: number; h: number }
  date_val?:   { x: number; y: number; font_size: number; w: number }
  next_cover?: { x: number; y: number; w: number; h: number }
  next_title?: { x: number; y: number; font_size: number; w: number }
}

const DEFAULTS: Required<PassportSpreadLayout> = {
  // Left identity page
  photo:    { x: 115, y: 350, w: 230, h: 295 },
  qr:       { x: 560, y: 340, w: 155, h: 155 },
  name:     { x: 350, y: 325, font_size: 38, w: 420 },
  champion: { x: 350, y: 405, font_size: 28, w: 300 },
  date:     { x: 350, y: 470, font_size: 24, w: 300 },
  // Right destination page
  dest_num:   { x: 1860, y: 75,  font_size: 24, w: 200 },
  title:      { x: 1860, y: 145, font_size: 44, w: 800 },
  book_cover: { x: 1380, y: 245, w: 210, h: 320 },
  date_val:   { x: 1455, y: 750, font_size: 30, w: 300 },
  next_cover: { x: 1290, y: 895, w: 110, h: 140 },
  next_title: { x: 1860, y: 910, font_size: 24, w: 430 },
}

function get<K extends keyof PassportSpreadLayout>(
  layout: PassportSpreadLayout, key: K
): Required<PassportSpreadLayout>[K] {
  return (layout[key] ?? DEFAULTS[key]) as Required<PassportSpreadLayout>[K]
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
  childName:        string
  championNumber:   string
  createdAt:        string
  photoDataUri:     string | null
  qrDataUri:        string | null
  story:            AirwaysStory
  bookNum:          number
  coverDataUri:     string | null
  nextStory:        AirwaysStory | null
  nextCoverDataUri: string | null
  layout?:          PassportSpreadLayout | null
}

export async function buildPassportSpread(data: PassportSpreadData): Promise<Buffer> {
  const L = { ...DEFAULTS, ...(data.layout ?? {}) }

  // Fetch template (cached after first call) — use its ACTUAL pixel dimensions
  const templateBuf = await fetchTemplate('passport-interior')
  const dims = getTemplateDimensions('passport-interior')
  const TW = dims?.width  ?? SPREAD_W
  const TH = dims?.height ?? SPREAD_H

  // Canvas matches the real template dimensions exactly — no stretch
  const canvas = createCanvas(TW, TH)
  const ctx    = canvas.getContext('2d')

  function sx(v: number) { return v }
  function sy(v: number) { return v }
  function sf(v: number) { return v }

  // ── Left page — Identity ──────────────────────────────────────────────────

  const ph = get(L, 'photo')
  if (data.photoDataUri) {
    // rounded clip + cover + top-bias (face stays at top of frame)
    await drawImg(ctx, data.photoDataUri, sx(ph.x), sy(ph.y), sx(ph.w), sy(ph.h), 'rounded', 'cover', 0.2)
  }

  const qr = get(L, 'qr')
  if (data.qrDataUri) {
    await drawImg(ctx, data.qrDataUri, sx(qr.x), sy(qr.y), sx(qr.w), sy(qr.h))
  }

  const nm = get(L, 'name')
  txt(ctx, data.childName.toUpperCase(), sx(nm.x), sy(nm.y),
    { size: sf(nm.font_size), bold: true, color: '#0D1B30', maxWidth: sx(nm.w) })

  const ch = get(L, 'champion')
  txt(ctx, data.championNumber, sx(ch.x), sy(ch.y),
    { size: sf(ch.font_size), bold: true, color: '#0D1B30', maxWidth: sx(ch.w) })

  const dt = get(L, 'date')
  const dateStr = data.createdAt
    ? new Date(data.createdAt).toLocaleDateString('fr-FR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
      }).replace(/\//g, '  ')
    : ''
  txt(ctx, dateStr, sx(dt.x), sy(dt.y),
    { size: sf(dt.font_size), bold: false, color: '#0D1B30', maxWidth: sx(dt.w) })

  // ── Right page — Destination ──────────────────────────────────────────────

  const dn = get(L, 'dest_num')
  txt(ctx, String(data.bookNum), sx(dn.x), sy(dn.y),
    { size: sf(dn.font_size), bold: true, color: '#1A7A3E', maxWidth: sx(dn.w) })

  const ti = get(L, 'title')
  txt(ctx, data.story.title.toUpperCase(), sx(ti.x), sy(ti.y),
    { size: sf(ti.font_size), bold: true, color: '#0D1B30', maxWidth: sx(ti.w) })

  const bc = get(L, 'book_cover')
  if (data.coverDataUri) {
    await drawImg(ctx, data.coverDataUri, sx(bc.x), sy(bc.y), sx(bc.w), sy(bc.h), 'oval')
  }

  const dv = get(L, 'date_val')
  const valDate = data.story.completed_at
    ? new Date(data.story.completed_at).toLocaleDateString('fr-FR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
      }).replace(/\//g, '  ')
    : ''
  txt(ctx, valDate, sx(dv.x), sy(dv.y),
    { size: sf(dv.font_size), bold: true, color: '#0D1B30', maxWidth: sx(dv.w) })

  if (data.nextStory) {
    const nc = get(L, 'next_cover')
    if (data.nextCoverDataUri) {
      await drawImg(ctx, data.nextCoverDataUri, sx(nc.x), sy(nc.y), sx(nc.w), sy(nc.h), true)
    }
    const nt = get(L, 'next_title')
    const nextTitle = data.nextStory.title.length > 28
      ? data.nextStory.title.slice(0, 26) + '…'
      : data.nextStory.title
    txt(ctx, nextTitle.toUpperCase(), sx(nt.x), sy(nt.y),
      { size: sf(nt.font_size), bold: true, color: '#0D1B30', maxWidth: sx(nt.w) })
  }

  // ── Composite overlay onto template ───────────────────────────────────────

  const overlay = canvas.toBuffer('image/png')

  if (templateBuf) {
    // Composite overlay directly — no resize, template used at native resolution
    return sharp(templateBuf)
      .composite([{ input: overlay, left: 0, top: 0 }])
      .png()
      .toBuffer()
  }

  // No template: cream fallback background at template dimensions
  const bg = await sharp({
    create: { width: TW, height: TH, channels: 4, background: { r: 245, g: 237, b: 218, alpha: 1 } },
  }).png().toBuffer()
  return sharp(bg).composite([{ input: overlay, left: 0, top: 0 }]).png().toBuffer()
}
