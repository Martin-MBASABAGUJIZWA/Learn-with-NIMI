import sharp from 'sharp'
import { createCanvas, registerFont } from 'canvas'
import path from 'path'
import { fetchTemplate } from './templateFetcher'
import { barcodeBuffer } from './barcode'
import { qrPngBuffer } from './qrCode'
import { flightNumber } from './airwaysData'
import { seatNum, gateNum, statusLabel } from './formatters'
import { mergeField } from './layoutMerge'

// Register bundled fonts so canvas doesn't need system fontconfig (Vercel Lambda)
try {
  const fontsDir = path.join(process.cwd(), 'public', 'fonts')
  registerFont(path.join(fontsDir, 'DejaVuSans-Bold.ttf'), { family: 'DejaVu', weight: 'bold' })
  registerFont(path.join(fontsDir, 'DejaVuSans.ttf'),      { family: 'DejaVu', weight: 'normal' })
} catch { /* fonts already registered or path missing — canvas will fall back */ }

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

// ── Defaults calibrated from the champion-kit template image ─────
const DEFAULTS: KitLayout = {
  photo:        { x: 638,  y: 518, w: 133, h: 195 },
  handle_photo: { x: 490,  y: 30,  w: 270, h: 170 },
  champion:     { x: 887,  y: 507, font_size: 24, bold: true,  color: '#1a1a2e' },
  age:          { x: 836,  y: 537, font_size: 20, bold: true,  color: '#1a1a2e' },
  statut:       { x: 858,  y: 564, font_size: 20, bold: true,  color: '#16a34a' },
  vol:          { x: 846,  y: 599, font_size: 20, bold: true,  color: '#1a1a2e' },
  destination:  { x: 895,  y: 625, font_size: 18, bold: true,  color: '#1a1a2e' },
  livre:        { x: 856,  y: 646, font_size: 20, bold: true,  color: '#1a1a2e' },
  siege:        { x: 856,  y: 667, font_size: 20, bold: true,  color: '#1a1a2e' },
  porte:        { x: 863,  y: 690, font_size: 20, bold: true,  color: '#1a1a2e' },
  embarquement: { x: 906,  y: 712, font_size: 20, bold: true,  color: '#16a34a' },
  barcode:      { x: 613,  y: 751, w: 382, h: 40  },
  qr:           { x: 1016, y: 958, w: 148, h: 148 },
}

function get(layout: KitLayout, key: string): KitFieldLayout {
  return mergeField(layout[key] as KitFieldLayout | undefined, DEFAULTS[key])
}

interface TextField { text: string; pos: KitFieldLayout; maxWidth?: number }

function renderTextOverlay(W: number, H: number, fields: TextField[]): Buffer {
  const canvas = createCanvas(W, H)
  const ctx    = canvas.getContext('2d')
  for (const { text, pos, maxWidth } of fields) {
    const size  = pos.font_size ?? 14
    const weight = pos.bold !== false ? 'bold' : 'normal'
    ctx.font      = `${weight} ${size}px DejaVu, sans-serif`
    ctx.fillStyle = pos.color ?? '#1a1a2e'
    const y = pos.y + size // baseline
    if (maxWidth) ctx.fillText(text, pos.x, y, maxWidth)
    else          ctx.fillText(text, pos.x, y)
  }
  return canvas.toBuffer('image/png')
}


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

  const textOverlay = renderTextOverlay(W, H, [
    { text: data.childName.toUpperCase(),           pos: get(layout, 'champion') },
    { text: `${data.age ?? '?'} ANS`,               pos: get(layout, 'age') },
    { text: statusLabel(data.storyNumber),          pos: get(layout, 'statut') },
    { text: flightNumber(data.storyNumber),          pos: get(layout, 'vol') },
    { text: data.storyTitle.toUpperCase(),          pos: get(layout, 'destination'), maxWidth: 160 },
    { text: String(data.storyNumber),               pos: get(layout, 'livre') },
    { text: seatNum(data.age, data.storyNumber),    pos: get(layout, 'siege') },
    { text: gateNum(data.storyNumber),              pos: get(layout, 'porte') },
    { text: 'OUVERT',                               pos: get(layout, 'embarquement') },
  ])

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
