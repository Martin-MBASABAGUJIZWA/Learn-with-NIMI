import { createCanvas, loadImage } from 'canvas'
import type { CanvasRenderingContext2D, Image } from 'canvas'
import sharp from 'sharp'
import { fetchTemplate } from './templateFetcher'
import { removeBackground } from '@imgly/background-removal-node'

const BADGE_W = 1080
const BADGE_H = 1080

// Fallbacks match INIT_BADGE in KitLayoutEditor.tsx and migration 185_badge_template_layout.sql
// child_photo bounding box → cx = x + w/2, cy = y + h/2, r = min(w,h)/2
const NIMI_CX = 572  // 407 + 330/2
const NIMI_CY = 693  // 503 + 380/2
const NIMI_R  = 165  // min(330,380)/2

const PIKO_X = 571
const PIKO_Y = 499
const PIKO_W = 275
const PIKO_H = 340

export interface AttitudeBadgeLayout {
  child_photo?: { x: number; y: number; w: number; h: number }
  piko?:        { x: number; y: number; w: number; h: number }
  attitude?:    { x: number; y: number; font_size: number; w: number; h?: number; color?: string }
  bottom_text?: { x: number; y: number; font_size: number; w: number; h?: number; color?: string }
}

export interface AttitudeBadgeData {
  attitude:           string
  storyTitle:         string
  bookNumber:         number
  childPhotoDataUri:  string | null
  /** Pre-cleaned photo (background already removed). When provided, skips the slow ML step. */
  cleanPhotoDataUri?: string | null
  isPersonalized?:    boolean
  layout?:            AttitudeBadgeLayout | null
}

// ── Background removal ────────────────────────────────────────────────────────

/** Exported so callers can run it once and reuse the result across multiple badge builds. */
export async function removeBg(dataUri: string): Promise<string> {
  try {
    const [header, b64] = dataUri.split(',')
    const mime    = header.match(/:(.*?);/)?.[1] ?? 'image/jpeg'
    const inBuf   = Buffer.from(b64, 'base64')
    const inBlob  = new Blob([inBuf], { type: mime })
    const outBlob = await removeBackground(inBlob)
    const outBuf  = Buffer.from(await outBlob.arrayBuffer())

    // Hard-threshold alpha to eliminate white fringe on semi-transparent edges.
    // Background removal leaves fringe pixels at partial alpha with the original
    // light/white RGB still intact. Setting any pixel below alpha 200 to fully
    // transparent removes the halo without affecting solid foreground pixels.
    const { data, info } = await sharp(outBuf)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true })
    const px = new Uint8Array(data)
    for (let i = 0; i < px.length; i += 4) {
      if (px[i + 3] < 200) {
        px[i] = px[i + 1] = px[i + 2] = px[i + 3] = 0
      }
    }
    const clean = await sharp(Buffer.from(px.buffer), {
      raw: { width: info.width, height: info.height, channels: 4 },
    }).png().toBuffer()

    return `data:image/png;base64,${clean.toString('base64')}`
  } catch (err) {
    console.error('[badge] background removal failed, using original:', err)
    return dataUri
  }
}

// ── Canvas helpers ────────────────────────────────────────────────────────────

async function tryLoad(uri: string): Promise<Image | null> {
  try { return await loadImage(uri) } catch { return null }
}

async function tryLoadBuf(buf: Buffer): Promise<Image | null> {
  try {
    return await loadImage(`data:image/png;base64,${buf.toString('base64')}`)
  } catch { return null }
}

function drawContain(ctx: CanvasRenderingContext2D, img: Image,
                     x: number, y: number, w: number, h: number) {
  const sc = Math.min(w / img.width, h / img.height)
  const sw = img.width * sc, sh = img.height * sc
  ctx.drawImage(img as unknown as Parameters<typeof ctx.drawImage>[0],
    x + (w - sw) / 2, y + (h - sh) / 2, sw, sh)
}

function drawCircleClipped(ctx: CanvasRenderingContext2D, img: Image,
                           cx: number, cy: number, r: number) {
  ctx.save()
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip()
  const sc = Math.max((r * 2) / img.width, (r * 2) / img.height)
  ctx.drawImage(img as unknown as Parameters<typeof ctx.drawImage>[0],
    cx - img.width  * sc / 2,
    cy - img.height * sc / 2,
    img.width * sc, img.height * sc)
  ctx.restore()
}

// ── Arc text via per-glyph rotation ──────────────────────────────────────────
//
// Strategy: canvas fillText at (w/2, h/2) of a tiny per-char canvas WORKS.
//           Canvas fillText after translate/rotate does NOT work on this host.
//           Sharp image rotation WORKS.
// → render each glyph flat → rotate with sharp → composite at arc position.
//
// Parabolic arc:  y = baseY + k * (x - cx)^2
//   k > 0  →  ⌢  arch (attitude text at top)
//   k < 0  →  ⌣  ribbon curve (bottom text)

type Composite = { input: Buffer; left: number; top: number }

async function buildArcComposites(
  text: string,
  cx: number, baseY: number, kLeft: number, kRight: number,
  fontSize: number,
  fillColor: string, strokeColor: string, strokeWidth: number,
): Promise<Composite[]> {
  const chars = text.split('')

  // Measure each glyph with canvas — more accurate than a fixed 0.52× estimate,
  // especially for narrow characters (i, l, 1) and wide ones (M, W, emoji).
  const measCtx = createCanvas(10, 10).getContext('2d')
  measCtx.font  = `bold ${fontSize}px sans-serif`
  const widths = chars.map(c =>
    c === ' ' ? fontSize * 0.22 : measCtx.measureText(c).width
  )
  const totalW = widths.reduce((a, b) => a + b, 0)

  const pad   = Math.ceil(strokeWidth) + 6
  const cellH = Math.ceil(fontSize * 1.5) + pad * 2

  type Entry = { buf: Buffer; x: number; y: number; angleDeg: number; cw: number; ch: number }
  const entries: Entry[] = []
  let xi = cx - totalW / 2

  for (let i = 0; i < chars.length; i++) {
    const cw   = Math.ceil(widths[i]) + pad * 2
    const x    = xi + widths[i] / 2
    const dx   = x - cx
    // Use left or right k depending on which side of centre
    const k    = dx < 0 ? kLeft : kRight
    const y    = baseY + k * dx * dx
    const deg  = Math.atan(2 * k * dx) * (180 / Math.PI)

    if (chars[i] !== ' ') {
      const c   = createCanvas(cw, cellH)
      const ctx = c.getContext('2d')
      ctx.font         = `bold ${fontSize}px sans-serif`
      ctx.textAlign    = 'center'
      ctx.textBaseline = 'middle'
      ctx.lineJoin     = 'round'
      if (strokeWidth > 0) {
        ctx.strokeStyle = strokeColor
        ctx.lineWidth   = strokeWidth
        ctx.strokeText(chars[i], cw / 2, cellH / 2)
      }
      ctx.fillStyle = fillColor
      ctx.fillText(chars[i], cw / 2, cellH / 2)
      entries.push({ buf: c.toBuffer('image/png'), x, y, angleDeg: deg, cw, ch: cellH })
    }
    xi += widths[i]
  }

  // Rotate all glyphs in parallel with sharp
  const composites = await Promise.all(entries.map(async e => {
    const rotated = await sharp(e.buf)
      .rotate(e.angleDeg, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer()

    // Compute bounding box of rotated rectangle analytically
    const rad = Math.abs(e.angleDeg * Math.PI / 180)
    const rw  = Math.ceil(e.cw * Math.cos(rad) + e.ch * Math.sin(rad))
    const rh  = Math.ceil(e.ch * Math.cos(rad) + e.cw * Math.sin(rad))

    return {
      input: rotated,
      left:  Math.max(0, Math.round(e.x - rw / 2)),
      top:   Math.max(0, Math.round(e.y - rh / 2)),
    }
  }))

  return composites
}

// ── Piko defringe cache ────────────────────────────────────────────────────────
// The defringe pass (alpha-threshold) is deterministic and expensive relative to
// its input. Cache keyed by source buffer reference: invalidates automatically
// when fetchTemplate returns a new buffer after its 10-min TTL expires.
// Inflight dedup: concurrent calls with the same source share one computation
// (prevents N parallel badge builds from each running their own defringe).
let pikoCache:    { source: Buffer; clean: Buffer } | null = null
let pikoInflight: { source: Buffer; promise: Promise<Buffer> } | null = null

async function getCleanPiko(pikoBuf: Buffer): Promise<Buffer> {
  if (pikoCache?.source === pikoBuf) return pikoCache.clean
  if (pikoInflight?.source === pikoBuf) return pikoInflight.promise

  const promise = (async (): Promise<Buffer> => {
    try {
      const { data, info } = await sharp(pikoBuf).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
      const px = new Uint8Array(data)
      for (let i = 0; i < px.length; i += 4) {
        if (px[i + 3] < 200) px[i] = px[i + 1] = px[i + 2] = px[i + 3] = 0
      }
      const clean = await sharp(Buffer.from(px.buffer), {
        raw: { width: info.width, height: info.height, channels: 4 },
      }).png().toBuffer()
      pikoCache = { source: pikoBuf, clean }
      return clean
    } catch { return pikoBuf }
    finally { if (pikoInflight?.source === pikoBuf) pikoInflight = null }
  })()

  pikoInflight = { source: pikoBuf, promise }
  return promise
}

// ── Main builder ──────────────────────────────────────────────────────────────

export async function buildAttitudeBadge(data: AttitudeBadgeData): Promise<Buffer> {
  const L = data.layout ?? {}

  const badgeTemplateKey = data.isPersonalized === false ? 'badge-template-free' : 'badge-template'
  const [templateBuf, pikoBuf] = await Promise.all([
    fetchTemplate(badgeTemplateKey),
    fetchTemplate('piko-character'),
  ])

  const base = templateBuf ?? await sharp({
    create: { width: BADGE_W, height: BADGE_H, channels: 4,
               background: { r: 30, g: 20, b: 60, alpha: 1 } },
  }).png().toBuffer()

  // ── Canvas layer: Piko + child photo (images only, no transforms needed) ──
  const canvas = createCanvas(BADGE_W, BADGE_H)
  const ctx    = canvas.getContext('2d')
  ctx.clearRect(0, 0, BADGE_W, BADGE_H)  // ensure fully transparent — no white fill

  if (pikoBuf) {
    const img = await tryLoadBuf(await getCleanPiko(pikoBuf))
    if (img) {
      const p = L.piko
      drawContain(ctx, img,
        p?.x ?? PIKO_X, p?.y ?? PIKO_Y, p?.w ?? PIKO_W, p?.h ?? PIKO_H)
    }
  }

  if (data.cleanPhotoDataUri ?? data.childPhotoDataUri) {
    // cleanPhotoDataUri = string  → caller already ran ML, use it
    // cleanPhotoDataUri = null    → caller tried ML but it failed; use raw photo, don't retry
    // cleanPhotoDataUri = undefined → standalone call; run ML now
    const cleanUri = data.cleanPhotoDataUri !== undefined
      ? (data.cleanPhotoDataUri ?? data.childPhotoDataUri!)
      : await removeBg(data.childPhotoDataUri!)
    const img = await tryLoad(cleanUri)
    if (img) {
      const cp = L.child_photo
      const cx = cp ? cp.x + cp.w / 2 : NIMI_CX
      const cy = cp ? cp.y + cp.h / 2 : NIMI_CY
      const r  = cp ? Math.min(cp.w, cp.h) / 2 : NIMI_R
      // Clip directly — no white border fill so badge template background shows through
      drawCircleClipped(ctx, img, cx, cy, r)
    }
  }

  const imgOverlay = canvas.toBuffer('image/png')

  // ── Arc text: per-glyph rotate + composite (the only approach that works) ──
  // Curvature is hardcoded to match the reference badge.
  // k > 0  → arch upward ⌢  (attitude)
  // k < 0  → ribbon curve ⌣ (bottom)
  const attL      = L.attitude
  const attFontSz = attL?.font_size ?? 85
  const attY      = attL?.y         ?? 362
  const attCx     = attL?.x         ?? 630
  const attWL     = Math.max(50, attL?.w || 1500)
  const attKL     =  1 / (2 * attWL)
  const attKR     = attKL  // symmetric arc — w controls both sides
  const attStroke = Math.max(6, attFontSz * 0.12)
  const attFill   = attL?.color ?? '#FDFEFD'

  const botL      = L.bottom_text
  const botFontSz = botL?.font_size ?? 36
  const botY      = botL?.y         ?? 960
  const botCx     = botL?.x         ?? 637
  const botWL     = Math.max(50, botL?.w || 1800)
  const botKL     = -1 / (2 * botWL)
  const botKR     = botKL  // symmetric arc — w controls both sides
  const titleSlug = data.storyTitle.length > 22
    ? data.storyTitle.slice(0, 20).toUpperCase() + '…'
    : data.storyTitle.toUpperCase()
  const botText   = `* ${titleSlug} * CHAMPION DU LIVRE ${data.bookNumber} *`
  const botStroke = Math.max(4, botFontSz * 0.14)
  const botFill   = botL?.color ?? '#C9A227'

  const [attComposites, botComposites] = await Promise.all([
    buildArcComposites(
      data.attitude.toUpperCase(),
      attCx, attY, attKL, attKR,
      attFontSz, attFill, '#1A237E', attStroke,
    ),
    buildArcComposites(
      botText,
      botCx, botY, botKL, botKR,
      botFontSz, botFill, '#1A237E', botStroke,
    ),
  ])

  return sharp(base)
    .composite([
      { input: imgOverlay },
      ...attComposites,
      ...botComposites,
    ])
    .png()
    .toBuffer()
}
