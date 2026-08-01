import sharp from 'sharp'
import { createCanvas, registerFont, loadImage } from 'canvas'
import type { CanvasRenderingContext2D, Image } from 'canvas'
import path from 'path'
import { fetchTemplate } from './templateFetcher'
import type { AirwaysStory } from './airwaysData'

try {
  const dir = path.join(process.cwd(), 'public', 'fonts')
  registerFont(path.join(dir, 'DejaVuSans-Bold.ttf'), { family: 'DejaVu', weight: 'bold' })
  registerFont(path.join(dir, 'DejaVuSans.ttf'),      { family: 'DejaVu', weight: 'normal' })
} catch {}

// Spread canvas size — matches template image proportions (landscape 2:1)
export const SPREAD_W = 2200
export const SPREAD_H = 1100

// ── Layout types ─────────────────────────────────────────────────────────────

export interface PassportSpreadLayout {
  // Left (identity) fields
  photo?:    { x: number; y: number; w: number; h: number }
  name?:     { x: number; y: number; font_size: number }
  champion?: { x: number; y: number; font_size: number }
  date?:     { x: number; y: number; font_size: number }
  qr?:       { x: number; y: number; w: number; h: number }
  // Right (destination) fields
  dest_num?:  { x: number; y: number; font_size: number }
  title?:     { x: number; y: number; font_size: number }
  book_cover?:{ x: number; y: number; w: number; h: number }
  date_val?:  { x: number; y: number; font_size: number }
  next_cover?:{ x: number; y: number; w: number; h: number }
  next_title?:{ x: number; y: number; font_size: number }
}

const DEFAULTS: Required<PassportSpreadLayout> = {
  // Left identity side
  photo:    { x: 76,  y: 330, w: 210, h: 265 },
  name:     { x: 326, y: 370, font_size: 36 },
  champion: { x: 326, y: 445, font_size: 26 },
  date:     { x: 326, y: 515, font_size: 22 },
  qr:       { x: 450, y: 395, w: 148, h: 148 },
  // Right destination side (right half starts at x≈1100)
  dest_num:   { x: 1560, y: 68,  font_size: 22 },
  title:      { x: 1540, y: 148, font_size: 40 },
  book_cover: { x: 1220, y: 240, w: 198, h: 310 },
  date_val:   { x: 1280, y: 748, font_size: 28 },
  next_cover: { x: 1145, y: 878, w: 100, h: 130 },
  next_title: { x: 1640, y: 890, font_size: 22 },
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
  ctx.fillStyle = opts.color ?? '#0D1B30'
  ctx.font      = `${opts.bold ? 'bold' : 'normal'} ${opts.size}px DejaVu, sans-serif`
  ctx.textAlign = opts.align ?? 'left'
  ctx.textBaseline = 'top'
  if (opts.maxWidth) ctx.fillText(str, x, y, opts.maxWidth)
  else               ctx.fillText(str, x, y)
  ctx.restore()
}

async function drawImg(
  ctx: CanvasRenderingContext2D, dataUri: string,
  x: number, y: number, w: number, h: number, clip = false
) {
  try {
    const img: Image = await loadImage(dataUri)
    if (clip) {
      ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip()
    }
    ctx.drawImage(img as unknown as Parameters<typeof ctx.drawImage>[0], x, y, w, h)
    if (clip) ctx.restore()
  } catch {}
}

// ── Main builder ──────────────────────────────────────────────────────────────

export interface PassportSpreadData {
  // Identity (left side — same every page)
  childName:      string
  championNumber: string
  createdAt:      string
  photoDataUri:   string | null
  qrDataUri:      string | null
  // Destination (right side — changes per story)
  story:          AirwaysStory
  bookNum:        number
  coverDataUri:   string | null
  nextStory:      AirwaysStory | null
  nextCoverDataUri: string | null
  layout?:        PassportSpreadLayout | null
}

export async function buildPassportSpread(data: PassportSpreadData): Promise<Buffer> {
  const L = { ...DEFAULTS, ...(data.layout ?? {}) }

  const canvas = createCanvas(SPREAD_W, SPREAD_H)
  const ctx    = canvas.getContext('2d')

  // ── Load template background ──────────────────────────────────────────────
  const templateBuf = await fetchTemplate('passport-interior')
  if (templateBuf) {
    const resized = await sharp(templateBuf)
      .resize(SPREAD_W, SPREAD_H, { fit: 'fill' })
      .png().toBuffer()
    const bgImg = await loadImage(resized)
    ctx.drawImage(bgImg, 0, 0, SPREAD_W, SPREAD_H)
  } else {
    // Fallback: cream background
    ctx.fillStyle = '#F5EDDA'
    ctx.fillRect(0, 0, SPREAD_W, SPREAD_H)
  }

  // ══════════════════════════════════
  // LEFT PAGE — Identity
  // ══════════════════════════════════

  // Photo
  const ph = get(L, 'photo')
  if (data.photoDataUri) {
    await drawImg(ctx, data.photoDataUri, ph.x, ph.y, ph.w, ph.h, true)
  }

  // QR code
  const qr = get(L, 'qr')
  if (data.qrDataUri) {
    await drawImg(ctx, data.qrDataUri, qr.x, qr.y, qr.w, qr.h)
  }

  // Name
  const nm = get(L, 'name')
  txt(ctx, data.childName.toUpperCase(), nm.x, nm.y,
    { size: nm.font_size, bold: true, color: '#0D1B30', maxWidth: 400 })

  // Champion number
  const ch = get(L, 'champion')
  txt(ctx, data.championNumber, ch.x, ch.y,
    { size: ch.font_size, bold: true, color: '#0D1B30' })

  // Creation date
  const dt = get(L, 'date')
  const dateStr = data.createdAt
    ? new Date(data.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, ' / ')
    : '__  /  __  /  ____'
  txt(ctx, dateStr, dt.x, dt.y,
    { size: dt.font_size, bold: false, color: '#0D1B30' })

  // ══════════════════════════════════
  // RIGHT PAGE — Destination
  // ══════════════════════════════════

  // Destination number pill text
  const dn = get(L, 'dest_num')
  txt(ctx, String(data.bookNum), dn.x, dn.y,
    { size: dn.font_size, bold: true, color: '#1A7A3E', align: 'center' })

  // Story title
  const ti = get(L, 'title')
  const titleStr = data.story.title.toUpperCase()
  txt(ctx, titleStr, ti.x, ti.y,
    { size: ti.font_size, bold: true, color: '#0D1B30', align: 'center', maxWidth: 900 })

  // Book cover (in the oval placeholder)
  const bc = get(L, 'book_cover')
  if (data.coverDataUri) {
    await drawImg(ctx, data.coverDataUri, bc.x, bc.y, bc.w, bc.h, true)
  }

  // Validation date
  const dv = get(L, 'date_val')
  const valDate = data.story.completed_at
    ? new Date(data.story.completed_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, ' / ')
    : '__  /  __  /  ____'
  txt(ctx, valDate, dv.x, dv.y,
    { size: dv.font_size, bold: true, color: '#0D1B30', align: 'center' })

  // Visa section — next story cover + title
  if (data.nextStory) {
    const nc = get(L, 'next_cover')
    if (data.nextCoverDataUri) {
      await drawImg(ctx, data.nextCoverDataUri, nc.x, nc.y, nc.w, nc.h, true)
    }
    const nt = get(L, 'next_title')
    const nextTitle = data.nextStory.title.length > 28
      ? data.nextStory.title.slice(0, 26) + '…'
      : data.nextStory.title
    txt(ctx, nextTitle.toUpperCase(), nt.x, nt.y,
      { size: nt.font_size, bold: true, color: '#0D1B30', align: 'center', maxWidth: 420 })
  }

  // ── Composite onto template via sharp ─────────────────────────────────────
  const overlay = canvas.toBuffer('image/png')

  if (templateBuf) {
    return sharp(templateBuf)
      .resize(SPREAD_W, SPREAD_H, { fit: 'fill' })
      .composite([{ input: overlay, left: 0, top: 0 }])
      .png()
      .toBuffer()
  }

  return overlay
}
