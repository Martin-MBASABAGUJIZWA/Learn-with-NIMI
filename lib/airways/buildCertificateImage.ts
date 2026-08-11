import sharp from 'sharp'
import { createCanvas, registerFont } from 'canvas'
import path from 'path'
import { fetchTemplate } from './templateFetcher'
import { mergeField } from './layoutMerge'

try {
  const fontsDir = path.join(process.cwd(), 'public', 'fonts')
  registerFont(path.join(fontsDir, 'DejaVuSans-Bold.ttf'), { family: 'DejaVu', weight: 'bold' })
  registerFont(path.join(fontsDir, 'DejaVuSans.ttf'),      { family: 'DejaVu', weight: 'normal' })
} catch { /* fonts already registered or path missing */ }

const W = 1400
const H = 990

export interface CertFieldLayout {
  x: number
  y: number
  w?: number | null
  h?: number | null
  font_size?: number | null
  bold?: boolean | null
  color?: string | null
}

export type CertLayout = Record<string, CertFieldLayout>

const DEFAULTS: CertLayout = {
  photo:    { x: 80,  y: 200, w: 200, h: 250 },
  name:     { x: 420, y: 260, font_size: 52, bold: true,  color: '#1a1a2e' },
  champion: { x: 420, y: 340, font_size: 28, bold: false, color: '#16a34a' },
  title:    { x: 420, y: 400, font_size: 36, bold: true,  color: '#1a1a2e' },
  number:   { x: 420, y: 460, font_size: 24, bold: false, color: '#1a1a2e' },
  date:     { x: 420, y: 510, font_size: 24, bold: false, color: '#1a1a2e' },
}

const DEFAULTS_FREE: CertLayout = {
  name:   { x: 200, y: 280, font_size: 52, bold: true,  color: '#1a1a2e' },
  title:  { x: 200, y: 370, font_size: 36, bold: true,  color: '#1a1a2e' },
  number: { x: 200, y: 432, font_size: 24, bold: false, color: '#1a1a2e' },
  date:   { x: 200, y: 480, font_size: 24, bold: false, color: '#1a1a2e' },
}

function get(layout: CertLayout, key: string, defaults: CertLayout): CertFieldLayout {
  return mergeField(layout[key] as CertFieldLayout | undefined, defaults[key])
}

function renderTextOverlay(fields: { text: string; pos: CertFieldLayout; maxWidth?: number }[]): Buffer {
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

export interface CertificateData {
  childName:      string
  storyTitle:     string
  storyNumber:    number
  completedAt:    string | null
  championNumber: string
  photoBuffer:    Buffer | null
  isPersonalized?: boolean
  layout?:        CertLayout | null
}

function formatDate(iso: string | null): string {
  if (!iso) return '__ / __ / ____'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '__ / __ / ____'
  const dd   = String(d.getDate()).padStart(2, '0')
  const mm   = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${dd} / ${mm} / ${yyyy}`
}

export async function buildCertificateImage(data: CertificateData): Promise<Buffer> {
  const personalized = data.isPersonalized !== false
  const defaults     = personalized ? DEFAULTS : DEFAULTS_FREE
  const layout: CertLayout = data.layout && Object.keys(data.layout).length ? data.layout : defaults

  const templateKey = personalized ? 'certificate' : 'certificate-free'
  const template    = await fetchTemplate(templateKey)

  const composites: sharp.OverlayOptions[] = []

  // ── Photo composite (personalized only) ──────────────────────────
  if (personalized && data.photoBuffer) {
    const phPos = get(layout, 'photo', defaults)
    const pw = phPos.w ?? 200
    const ph = phPos.h ?? 250
    const photo = await sharp(data.photoBuffer)
      .resize(pw, ph, { fit: 'cover', position: 'attention' })
      .png().toBuffer()
    composites.push({ input: photo, left: phPos.x, top: phPos.y })
  }

  // ── Text overlay ─────────────────────────────────────────────────
  const dateStr = formatDate(data.completedAt)

  if (personalized) {
    const textOverlay = renderTextOverlay([
      { text: data.childName.toUpperCase(),                      pos: get(layout, 'name',     defaults), maxWidth: 680 },
      { text: data.championNumber,                               pos: get(layout, 'champion', defaults) },
      { text: data.storyTitle.toUpperCase(),                     pos: get(layout, 'title',    defaults), maxWidth: 680 },
      { text: `LIVRE ${data.storyNumber}`,                       pos: get(layout, 'number',   defaults) },
      { text: dateStr,                                           pos: get(layout, 'date',     defaults) },
    ])
    composites.push({ input: textOverlay, left: 0, top: 0 })
  } else {
    const textOverlay = renderTextOverlay([
      { text: 'PETIT CHAMPION',                                  pos: get(layout, 'name',   defaults), maxWidth: 900 },
      { text: data.storyTitle.toUpperCase(),                     pos: get(layout, 'title',  defaults), maxWidth: 900 },
      { text: `LIVRE ${data.storyNumber}`,                       pos: get(layout, 'number', defaults) },
      { text: dateStr,                                           pos: get(layout, 'date',   defaults) },
    ])
    composites.push({ input: textOverlay, left: 0, top: 0 })
  }

  if (template) {
    return sharp(template).resize(W, H, { fit: 'fill' }).composite(composites).png().toBuffer()
  }

  // Fallback: white canvas if template not yet uploaded
  return sharp({
    create: { width: W, height: H, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } },
  }).composite(composites).png().toBuffer()
}
