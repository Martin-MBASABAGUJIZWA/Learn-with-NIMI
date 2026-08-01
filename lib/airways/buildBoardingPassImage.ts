import sharp from 'sharp'
import { fetchTemplate } from './templateFetcher'
import { barcodeBuffer } from './barcode'

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

function svgText(text: string, pos: BPFieldLayout): string {
  const size   = pos.font_size ?? 28
  const weight = pos.bold !== false ? 'font-weight="700"' : ''
  const color  = pos.color ?? '#1a1a2e'
  const safe   = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  return `<text x="${pos.x}" y="${pos.y + size}" font-size="${size}" fill="${color}" ${weight}
    font-family="Arial, Helvetica, sans-serif">${safe}</text>`
}

function flightNum(n: number)               { return `NMP1${String(n).padStart(2, '0')}` }
function seatNum(age: number | null, n: number) { return `${age ?? n}A` }
function gateNum(n: number)                 { return `G${n}` }
function statusLabel(n: number)             { return n >= 7 ? 'GRAND CHAMPION' : 'PETIT CHAMPION' }

export interface BoardingPassData {
  childName:   string
  age:         number | null
  storyTitle:  string
  storyNumber: number
  childId:     string
  photoBuffer: Buffer | null
  layout?:     BPLayout | null
}

export async function buildBoardingPassImage(data: BoardingPassData): Promise<Buffer> {
  const layout: BPLayout = data.layout && Object.keys(data.layout).length ? data.layout : DEFAULTS

  const template = await fetchTemplate('boarding-pass')
  const bcPos    = get(layout, 'barcode')
  const phPos    = get(layout, 'photo')

  const barcode = await barcodeBuffer(data.childId, data.storyNumber)
  const barcodeResized = await sharp(barcode)
    .resize(bcPos.w ?? 920, bcPos.h ?? 100, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png().toBuffer()

  const composites: sharp.OverlayOptions[] = []

  if (data.photoBuffer) {
    const photo = await sharp(data.photoBuffer)
      .resize(phPos.w ?? 295, phPos.h ?? 372, { fit: 'cover', position: 'attention' })
      .png().toBuffer()
    composites.push({ input: photo, left: phPos.x, top: phPos.y })
  }

  const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    ${svgText(data.childName.toUpperCase(),        get(layout, 'name'))}
    ${svgText(`${data.age ?? '?'} ANS`,             get(layout, 'age'))}
    ${svgText(statusLabel(data.storyNumber),        get(layout, 'statut'))}
    ${svgText(flightNum(data.storyNumber),          get(layout, 'vol'))}
    ${svgText(data.storyTitle.toUpperCase(),        get(layout, 'destination'))}
    ${svgText(String(data.storyNumber),             get(layout, 'livre'))}
    ${svgText(seatNum(data.age, data.storyNumber),  get(layout, 'siege'))}
    ${svgText(gateNum(data.storyNumber),            get(layout, 'porte'))}
    ${svgText('OUVERT',                             get(layout, 'embarquement'))}
  </svg>`

  const textOverlay = await sharp(Buffer.from(svg)).png().toBuffer()

  composites.push(
    { input: textOverlay,    left: 0,       top: 0       },
    { input: barcodeResized, left: bcPos.x, top: bcPos.y },
  )

  if (template) {
    return sharp(template).resize(W, H, { fit: 'fill' }).composite(composites).png().toBuffer()
  }

  return sharp({
    create: { width: W, height: H, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } },
  }).composite(composites).png().toBuffer()
}
