import sharp from 'sharp'
import { createCanvas, registerFont } from 'canvas'
import path from 'path'
import { fetchTemplate } from './templateFetcher'
import { barcodeBuffer } from './barcode'
import { qrPngBuffer } from './qrCode'
import { flightNumber } from './airwaysData'
import { seatNum, gateNum, statusLabel } from './formatters'
import { mergeField } from './layoutMerge'

try {
  const fontsDir = path.join(process.cwd(), 'public', 'fonts')
  registerFont(path.join(fontsDir, 'DejaVuSans-Bold.ttf'), { family: 'DejaVu', weight: 'bold' })
  registerFont(path.join(fontsDir, 'DejaVuSans.ttf'),      { family: 'DejaVu', weight: 'normal' })
} catch { /* fonts already registered or path missing */ }

const W = 1080
const H = 1080

export interface BPFieldLayout {
  x: number
  y: number
  w?: number | null
  h?: number | null
  font_size?: number | null
  bold?: boolean | null
  color?: string | null
}

export type BPLayout = Record<string, BPFieldLayout>

// ── Defaults calibrated from the boarding-pass template image ────
const DEFAULTS: BPLayout = {
  photo:        { x: 139, y: 362, w: 295, h: 372 },
  name:         { x: 698, y: 293, font_size: 52, bold: true, color: '#1a1a2e' },
  age:          { x: 610, y: 373, font_size: 28, bold: true, color: '#1a1a2e' },
  statut:       { x: 650, y: 434, font_size: 28, bold: true, color: '#16a34a' },
  vol:          { x: 652, y: 491, font_size: 28, bold: true, color: '#1a1a2e' },
  destination:  { x: 761, y: 549, font_size: 28, bold: true, color: '#1a1a2e' },
  livre:        { x: 679, y: 603, font_size: 28, bold: true, color: '#1a1a2e' },
  siege:        { x: 675, y: 661, font_size: 28, bold: true, color: '#1a1a2e' },
  porte:        { x: 688, y: 715, font_size: 28, bold: true, color: '#1a1a2e' },
  embarquement: { x: 751, y: 771, font_size: 28, bold: true, color: '#16a34a' },
  barcode:      { x: 87,  y: 845, w: 920, h: 100 },
}

function get(layout: BPLayout, key: string): BPFieldLayout {
  return mergeField(layout[key] as BPFieldLayout | undefined, DEFAULTS[key])
}

interface BPTextField { text: string; pos: BPFieldLayout; maxWidth?: number }

function renderTextOverlay(W: number, H: number, fields: BPTextField[]): Buffer {
  const canvas = createCanvas(W, H)
  const ctx    = canvas.getContext('2d')
  for (const { text, pos, maxWidth } of fields) {
    const size   = pos.font_size ?? 28
    const weight = pos.bold !== false ? 'bold' : 'normal'
    ctx.font      = `${weight} ${size}px DejaVu, sans-serif`
    ctx.fillStyle = pos.color ?? '#1a1a2e'
    if (maxWidth) ctx.fillText(text, pos.x, pos.y + size, maxWidth)
    else          ctx.fillText(text, pos.x, pos.y + size)
  }
  return canvas.toBuffer('image/png')
}


// Default layout for the non-personalized (free) boarding pass template.
// QR code is centred below the divider; no photo slot, no barcode.
const DEFAULTS_FREE: BPLayout = {
  name:         { x: 390, y: 293, font_size: 52, bold: true,  color: '#1a1a2e' },
  age:          { x: 280, y: 373, font_size: 28, bold: true,  color: '#1a1a2e' },
  statut:       { x: 320, y: 434, font_size: 28, bold: true,  color: '#16a34a' },
  vol:          { x: 322, y: 491, font_size: 28, bold: true,  color: '#1a1a2e' },
  destination:  { x: 431, y: 549, font_size: 28, bold: true,  color: '#1a1a2e' },
  livre:        { x: 349, y: 603, font_size: 28, bold: true,  color: '#1a1a2e' },
  siege:        { x: 675, y: 491, font_size: 28, bold: true,  color: '#1a1a2e' },
  porte:        { x: 688, y: 549, font_size: 28, bold: true,  color: '#1a1a2e' },
  embarquement: { x: 751, y: 603, font_size: 28, bold: true,  color: '#16a34a' },
  qr:           { x: 390, y: 700, w: 200,        h: 200 },
}

export interface BoardingPassData {
  childName:      string
  age:            number | null
  storyTitle:     string
  storyNumber:    number
  storySlug?:     string
  childId:        string
  photoBuffer:    Buffer | null
  isPersonalized?: boolean
  layout?:        BPLayout | null
}

export async function buildBoardingPassImage(data: BoardingPassData): Promise<Buffer> {
  const personalized = data.isPersonalized !== false
  const defaults     = personalized ? DEFAULTS : DEFAULTS_FREE
  const layout: BPLayout = data.layout && Object.keys(data.layout).length ? data.layout : defaults

  const templateKey = personalized ? 'boarding-pass' : 'boarding-pass-free'
  const template    = await fetchTemplate(templateKey)

  const composites: sharp.OverlayOptions[] = []

  if (personalized) {
    // ── Personalized path: child photo + barcode ────────────────────
    const phPos = get(layout, 'photo')
    const bcPos = get(layout, 'barcode')

    if (data.photoBuffer) {
      const photo = await sharp(data.photoBuffer)
        .resize(phPos.w ?? 295, phPos.h ?? 372, { fit: 'cover', position: 'attention' })
        .png().toBuffer()
      composites.push({ input: photo, left: phPos.x, top: phPos.y })
    }

    const barcode = await barcodeBuffer(data.childId, data.storyNumber)
    const barcodeResized = await sharp(barcode)
      .resize(bcPos.w ?? 920, bcPos.h ?? 100, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .png().toBuffer()

    const textOverlay = renderTextOverlay(W, H, [
      { text: data.childName.toUpperCase(),         pos: get(layout, 'name') },
      { text: `${data.age ?? '?'} ANS`,             pos: get(layout, 'age') },
      { text: statusLabel(data.storyNumber),        pos: get(layout, 'statut') },
      { text: flightNumber(data.storyNumber),        pos: get(layout, 'vol') },
      { text: data.storyTitle.toUpperCase(),        pos: get(layout, 'destination'), maxWidth: 280 },
      { text: String(data.storyNumber),             pos: get(layout, 'livre') },
      { text: seatNum(data.age, data.storyNumber),  pos: get(layout, 'siege') },
      { text: gateNum(data.storyNumber),            pos: get(layout, 'porte') },
      { text: 'OUVERT',                             pos: get(layout, 'embarquement') },
    ])
    composites.push(
      { input: textOverlay,    left: 0,       top: 0       },
      { input: barcodeResized, left: bcPos.x, top: bcPos.y },
    )
  } else {
    // ── Free path: story data + QR code, no photo, no barcode ───────
    const qrPos  = get(layout, 'qr')
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://nimipiko.com'
    const qrUrl  = data.storySlug
      ? `${appUrl}/missions?story=${data.storySlug}`
      : appUrl

    const qr = await qrPngBuffer(qrUrl, qrPos.w ?? 200)
    const qrResized = await sharp(qr)
      .resize(qrPos.w ?? 200, qrPos.h ?? 200, { fit: 'fill' })
      .png().toBuffer()

    const textOverlay = renderTextOverlay(W, H, [
      { text: data.childName.toUpperCase(),         pos: get(layout, 'name') },
      { text: `${data.age ?? '?'} ANS`,             pos: get(layout, 'age') },
      { text: statusLabel(data.storyNumber),        pos: get(layout, 'statut') },
      { text: flightNumber(data.storyNumber),        pos: get(layout, 'vol') },
      { text: data.storyTitle.toUpperCase(),        pos: get(layout, 'destination'), maxWidth: 280 },
      { text: String(data.storyNumber),             pos: get(layout, 'livre') },
      { text: seatNum(data.age, data.storyNumber),  pos: get(layout, 'siege') },
      { text: gateNum(data.storyNumber),            pos: get(layout, 'porte') },
      { text: 'OUVERT',                             pos: get(layout, 'embarquement') },
    ])
    composites.push(
      { input: textOverlay, left: 0,       top: 0       },
      { input: qrResized,   left: qrPos.x, top: qrPos.y },
    )
  }

  if (template) {
    return sharp(template).resize(W, H, { fit: 'fill' }).composite(composites).png().toBuffer()
  }

  return sharp({
    create: { width: W, height: H, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } },
  }).composite(composites).png().toBuffer()
}
