import sharp from 'sharp'
import { fetchTemplate } from './templateFetcher'
import { barcodeBuffer } from './barcode'
import { qrPngBuffer } from './qrCode'

// ── Canvas size ───────────────────────────────────────────────────
const W = 1254
const H = 1254

// ── Layout types ─────────────────────────────────────────────────
export interface KitFieldLayout {
  x: number
  y: number
  w?: number | null
  h?: number | null
  font_size?: number | null
  bold?: boolean | null
  color?: string | null
}

export type KitLayout = Record<string, KitFieldLayout>

// ── Defaults measured from the 1254×1254 template ────────────────
// Boarding pass panel:  x 703–1079, y 339–790
// Photo box:            x 703–840,  y 428–723   (137 × 295)
// Field value column:   x 918,      y 428 + 33 × row
// Barcode:              x 703,      y 735,  w 376, h 35
// QR (bottom-right):    x 1068,     y 905,  w 120, h 120
const DEFAULTS: KitLayout = {
  photo:        { x: 710,  y: 440, w: 133, h: 195 },
  handle_photo: { x: 490,  y: 30,  w: 270, h: 170 },  // oval frame in suitcase handle
  champion:     { x: 918,  y: 428, font_size: 24, bold: true,  color: '#1a1a2e' },
  age:          { x: 918,  y: 461, font_size: 20, bold: true,  color: '#1a1a2e' },
  statut:       { x: 918,  y: 494, font_size: 20, bold: true,  color: '#16a34a' },
  vol:          { x: 918,  y: 527, font_size: 20, bold: true,  color: '#1a1a2e' },
  destination:  { x: 918,  y: 560, font_size: 18, bold: true,  color: '#1a1a2e' },
  livre:        { x: 918,  y: 593, font_size: 20, bold: true,  color: '#1a1a2e' },
  siege:        { x: 918,  y: 626, font_size: 20, bold: true,  color: '#1a1a2e' },
  porte:        { x: 918,  y: 659, font_size: 20, bold: true,  color: '#1a1a2e' },
  embarquement: { x: 918,  y: 692, font_size: 20, bold: true,  color: '#16a34a' },
  barcode:      { x: 703,  y: 735, w: 376, h: 35 },
  qr:           { x: 1068, y: 905, w: 120, h: 120 },
}

function get(layout: KitLayout, key: string): KitFieldLayout {
  const saved = layout[key]
  const def   = DEFAULTS[key]
  if (!saved) return def
  return {
    x:         saved.x         ?? def.x,
    y:         saved.y         ?? def.y,
    w:         saved.w         ?? def.w,
    h:         saved.h         ?? def.h,
    font_size: saved.font_size ?? def.font_size,
    bold:      saved.bold      ?? def.bold,
    color:     saved.color     ?? def.color,
  }
}

function svgText(text: string, pos: KitFieldLayout, maxWidth?: number): string {
  // Auto-shrink font when text is wide; hard-clip with clipPath if still too wide
  const baseSize = pos.font_size ?? 14
  // Estimate: each char ≈ 0.65 × fontSize wide
  const estWidth = text.length * baseSize * 0.65
  const size = maxWidth && estWidth > maxWidth
    ? Math.max(8, Math.round(baseSize * maxWidth / estWidth))
    : baseSize
  const fw    = pos.bold !== false ? 'font-weight="700"' : ''
  const color = pos.color ?? '#1a1a2e'
  const safe  = text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  if (maxWidth) {
    const id = `cl_${pos.x}_${pos.y}`
    return `<defs><clipPath id="${id}"><rect x="${pos.x}" y="${pos.y}" width="${maxWidth}" height="${size + 4}"/></clipPath></defs>
    <text x="${pos.x}" y="${pos.y + size}" font-size="${size}" fill="${color}" ${fw}
      font-family="Arial,Helvetica,sans-serif" clip-path="url(#${id})">${safe}</text>`
  }
  return `<text x="${pos.x}" y="${pos.y + size}" font-size="${size}" fill="${color}" ${fw}
    font-family="Arial,Helvetica,sans-serif">${safe}</text>`
}

function flightNum(n: number)                    { return `NMP1${String(n).padStart(2, '0')}` }
function seatNum(age: number | null, n: number)  { return `${age ?? n}A` }
function gateNum(n: number)                      { return `G${n}` }
function statusLabel(n: number)                  { return n >= 7 ? 'GRAND CHAMPION' : 'PETIT CHAMPION' }

export interface KitData {
  childName:   string
  age:         number | null
  storyTitle:  string
  storyNumber: number
  storySlug:   string
  childId:     string
  photoBuffer: Buffer | null
  layout?:     KitLayout | null
}

// Generates a soft grey silhouette placeholder when no child photo is available
async function placeholderPhoto(w: number, h: number): Promise<Buffer> {
  const cx = Math.round(w / 2)
  const headR = Math.round(w * 0.22)
  const headCy = Math.round(h * 0.30)
  const bodyRx = Math.round(w * 0.34)
  const bodyRy = Math.round(h * 0.32)
  const bodyCy = Math.round(h * 0.74)
  const svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${w}" height="${h}" fill="#dde1e7"/>
    <circle cx="${cx}" cy="${headCy}" r="${headR}" fill="#b0b8c4"/>
    <ellipse cx="${cx}" cy="${bodyCy}" rx="${bodyRx}" ry="${bodyRy}" fill="#b0b8c4"/>
  </svg>`
  return sharp(Buffer.from(svg)).png().toBuffer()
}

export async function buildKitImage(data: KitData): Promise<Buffer> {
  const layout: KitLayout = data.layout && Object.keys(data.layout).length ? data.layout : DEFAULTS

  const template = await fetchTemplate('champion-kit')

  const appUrl   = process.env.NEXT_PUBLIC_APP_URL ?? 'https://nimipiko.com'
  const storyUrl = `${appUrl}/missions?story=${data.storySlug}`

  const qrPos = get(layout, 'qr')
  const bcPos = get(layout, 'barcode')
  const phPos = get(layout, 'photo')

  const [barcode, qr] = await Promise.all([
    barcodeBuffer(data.childId, data.storyNumber),
    qrPngBuffer(storyUrl, qrPos.w ?? 120),
  ])

  const barcodeResized = await sharp(barcode)
    .resize(bcPos.w ?? 376, bcPos.h ?? 35, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png().toBuffer()

  const qrResized = await sharp(qr)
    .resize(qrPos.w ?? 120, qrPos.h ?? 120, { fit: 'fill' })
    .png().toBuffer()

  const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    ${svgText(data.childName.toUpperCase(),              get(layout, 'champion'))}
    ${svgText(`${data.age ?? '?'} ANS`,                  get(layout, 'age'))}
    ${svgText(statusLabel(data.storyNumber),             get(layout, 'statut'))}
    ${svgText(flightNum(data.storyNumber),               get(layout, 'vol'))}
    ${svgText(data.storyTitle.toUpperCase(),             get(layout, 'destination'), 160)}
    ${svgText(String(data.storyNumber),                  get(layout, 'livre'))}
    ${svgText(seatNum(data.age, data.storyNumber),       get(layout, 'siege'))}
    ${svgText(gateNum(data.storyNumber),                 get(layout, 'porte'))}
    ${svgText('OUVERT',                                  get(layout, 'embarquement'))}
  </svg>`

  const textOverlay = await sharp(Buffer.from(svg)).png().toBuffer()

  const composites: sharp.OverlayOptions[] = []

  const pw = phPos.w ?? 133
  const ph = phPos.h ?? 195

  const photoSrc = data.photoBuffer ?? await placeholderPhoto(pw, ph)

  // Boarding-pass photo (rectangle)
  const photo = await sharp(photoSrc)
    .resize(pw, ph, { fit: 'cover', position: 'attention' })
    .png().toBuffer()
  composites.push({ input: photo, left: phPos.x, top: phPos.y })

  // Handle photo (oval clip — same image, different position + mask)
  const hPos = get(layout, 'handle_photo')
  const hw = hPos.w ?? 270
  const hh = hPos.h ?? 170
  const handlePhoto = await sharp(photoSrc)
    .resize(hw, hh, { fit: 'cover', position: 'attention' })
    .png().toBuffer()
  // Oval mask SVG
  const ovalMask = `<svg width="${hw}" height="${hh}" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="${hw / 2}" cy="${hh / 2}" rx="${hw / 2}" ry="${hh / 2}" fill="white"/>
  </svg>`
  const handlePhotoOval = await sharp(handlePhoto)
    .composite([{ input: Buffer.from(ovalMask), blend: 'dest-in' }])
    .png().toBuffer()
  composites.push({ input: handlePhotoOval, left: hPos.x, top: hPos.y })

  composites.push(
    { input: textOverlay,    left: 0,        top: 0        },
    { input: barcodeResized, left: bcPos.x,  top: bcPos.y  },
    { input: qrResized,      left: qrPos.x,  top: qrPos.y  },
  )

  if (template) {
    return sharp(template).resize(W, H, { fit: 'fill' }).composite(composites).png().toBuffer()
  }

  return sharp({
    create: { width: W, height: H, channels: 4, background: { r: 31, g: 78, b: 145, alpha: 1 } },
  }).composite(composites).png().toBuffer()
}
