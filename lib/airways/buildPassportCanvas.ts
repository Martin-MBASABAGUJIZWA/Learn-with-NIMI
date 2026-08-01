import { createCanvas, registerFont, loadImage } from 'canvas'
import type { Canvas, CanvasRenderingContext2D } from 'canvas'
import path from 'path'
import type { AirwaysStory } from './airwaysData'

export const PAGE_W = 794
export const PAGE_H = 1123

const NAVY  = '#0D1B30'
const GOLD  = '#C9A84C'
const GREEN = '#1A7A3E'
const CREAM = '#F5EDDA'

try {
  const dir = path.join(process.cwd(), 'public', 'fonts')
  registerFont(path.join(dir, 'DejaVuSans-Bold.ttf'), { family: 'DejaVu', weight: 'bold' })
  registerFont(path.join(dir, 'DejaVuSans.ttf'),      { family: 'DejaVu', weight: 'normal' })
} catch {}

// ── Helpers ──────────────────────────────────────────────────────────────────

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.arcTo(x + w, y, x + w, y + r, r)
  ctx.lineTo(x + w, y + h - r)
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
  ctx.lineTo(x + r, y + h)
  ctx.arcTo(x, y + h, x, y + h - r, r)
  ctx.lineTo(x, y + r)
  ctx.arcTo(x, y, x + r, y, r)
  ctx.closePath()
}

function text(ctx: CanvasRenderingContext2D, str: string, x: number, y: number,
  opts: { size: number; bold?: boolean; color?: string; align?: CanvasTextAlign; alpha?: number; maxWidth?: number }) {
  ctx.save()
  ctx.globalAlpha  = opts.alpha ?? 1
  ctx.fillStyle    = opts.color ?? NAVY
  ctx.font         = `${opts.bold ? 'bold' : 'normal'} ${opts.size}px DejaVu, sans-serif`
  ctx.textAlign    = opts.align ?? 'left'
  ctx.textBaseline = 'alphabetic'
  if (opts.maxWidth) ctx.fillText(str, x, y, opts.maxWidth)
  else               ctx.fillText(str, x, y)
  ctx.restore()
}

function label(ctx: CanvasRenderingContext2D, str: string, x: number, y: number, color = GOLD) {
  text(ctx, str, x, y, { size: 12, bold: true, color, align: 'left' })
}

function line(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number,
  color: string, width = 1.5, alpha = 1) {
  ctx.save()
  ctx.globalAlpha  = alpha
  ctx.strokeStyle  = color
  ctx.lineWidth    = width
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke()
  ctx.restore()
}

function seal(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
  ctx.save()
  ctx.strokeStyle = GREEN; ctx.lineWidth = 2
  ctx.beginPath(); ctx.arc(cx, cy, 44, 0, Math.PI * 2); ctx.stroke()
  ctx.globalAlpha = 0.5; ctx.lineWidth = 1
  ctx.beginPath(); ctx.arc(cx, cy, 35, 0, Math.PI * 2); ctx.stroke()
  ctx.restore()
  text(ctx, 'NIMIPIKO',           cx, cy - 14, { size: 9,  bold: false, color: GREEN, align: 'center' })
  text(ctx, 'VALIDE',             cx, cy + 2,  { size: 9,  bold: false, color: GREEN, align: 'center' })
  text(ctx, 'OFFICIELLEMENT',     cx, cy + 14, { size: 7,  bold: false, color: GREEN, align: 'center' })
}

async function drawImage(ctx: CanvasRenderingContext2D, src: string, x: number, y: number, w: number, h: number) {
  try {
    const img = await loadImage(src)
    ctx.drawImage(img, x, y, w, h)
  } catch {}
}

// ── Cover page ────────────────────────────────────────────────────────────────

export async function buildPassportCoverCanvas(): Promise<Buffer> {
  const canvas = createCanvas(PAGE_W, PAGE_H)
  const ctx    = canvas.getContext('2d')

  // Background gradient
  const bg = ctx.createLinearGradient(0, 0, 0, PAGE_H)
  bg.addColorStop(0, '#111D33')
  bg.addColorStop(1, '#0A1525')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, PAGE_W, PAGE_H)

  // Gold borders
  ctx.strokeStyle = GOLD; ctx.lineWidth = 2.5
  roundRect(ctx, 22, 22, PAGE_W - 44, PAGE_H - 44, 10); ctx.stroke()
  ctx.save(); ctx.globalAlpha = 0.4; ctx.lineWidth = 1
  roundRect(ctx, 30, 30, PAGE_W - 60, PAGE_H - 60, 8); ctx.stroke()
  ctx.restore()

  const cx = PAGE_W / 2

  text(ctx, '* * *',            cx, 100, { size: 26, bold: true, color: GOLD, align: 'center' })
  text(ctx, 'PASSEPORT VOYAGE', cx, 168, { size: 32, bold: true, color: GOLD, align: 'center' })
  text(ctx, 'NIMIPIKO',         cx, 240, { size: 68, bold: true, color: GOLD, align: 'center' })

  line(ctx, 160, 262, PAGE_W - 160, 262, GOLD, 1.5, 0.6)

  // Decorative circles
  ctx.save(); ctx.globalAlpha = 0.15; ctx.strokeStyle = GOLD; ctx.lineWidth = 1
  ctx.beginPath(); ctx.arc(cx, 500, 160, 0, Math.PI * 2); ctx.stroke()
  ctx.globalAlpha = 0.05; ctx.fillStyle = GOLD
  ctx.beginPath(); ctx.arc(cx, 500, 130, 0, Math.PI * 2); ctx.fill()
  ctx.restore()

  // Character labels
  text(ctx, 'NIMI', cx - 100, 700, { size: 13, bold: true, color: GOLD, align: 'center' })
  text(ctx, 'PIKO', cx,       700, { size: 13, bold: true, color: GOLD, align: 'center' })
  text(ctx, 'ZILO', cx + 100, 700, { size: 13, bold: true, color: GOLD, align: 'center' })

  text(ctx, 'NIMIPIKO',                              cx, 850, { size: 36, bold: true,  color: GOLD, align: 'center' })
  text(ctx, 'Chaque histoire est une nouvelle destination.', cx, 890, { size: 16, bold: false, color: GOLD, align: 'center', alpha: 0.8 })

  // Bottom bar
  ctx.save(); ctx.globalAlpha = 0.3; ctx.fillStyle = GOLD
  ctx.fillRect(22, PAGE_H - 100, PAGE_W - 44, 2)
  ctx.restore()

  text(ctx, 'GROW WITH EVERY STORY', cx, PAGE_H - 50, { size: 14, bold: false, color: GOLD, align: 'center', alpha: 0.5 })
  text(ctx, 'nimipiko.com',          cx, PAGE_H - 28, { size: 10, bold: false, color: GOLD, align: 'center', alpha: 0.35 })

  return canvas.toBuffer('image/png')
}

// ── Identity page ─────────────────────────────────────────────────────────────

export async function buildPassportIdentityCanvas(opts: {
  childName: string
  championNumber: string
  createdAt: string
  photoDataUri: string | null
  qrDataUri: string
}): Promise<Buffer> {
  const { childName, championNumber, createdAt, photoDataUri, qrDataUri } = opts
  const canvas = createCanvas(PAGE_W, PAGE_H)
  const ctx    = canvas.getContext('2d')

  // Background
  const bg = ctx.createLinearGradient(0, 0, 0, PAGE_H)
  bg.addColorStop(0, CREAM); bg.addColorStop(1, '#EDE0C4')
  ctx.fillStyle = bg; ctx.fillRect(0, 0, PAGE_W, PAGE_H)

  // Header bar
  ctx.save(); ctx.globalAlpha = 0.12; ctx.fillStyle = GREEN
  ctx.fillRect(0, 0, PAGE_W, 80)
  ctx.restore()

  const cx = PAGE_W / 2
  text(ctx, 'PASSEPORT VOYAGE NIMIPIKO', cx, 32, { size: 18, bold: true, color: GREEN, align: 'center' })
  text(ctx, 'IDENTITE DU CHAMPION',      cx, 62, { size: 28, bold: true, color: NAVY,  align: 'center' })

  line(ctx, 40, 88, PAGE_W - 40, 88, GOLD, 1.5, 0.6)

  // Identity box
  ctx.save(); ctx.fillStyle = 'rgba(255,255,255,0.5)'
  roundRect(ctx, 36, 100, PAGE_W - 72, 300, 12); ctx.fill()
  ctx.strokeStyle = GREEN; ctx.lineWidth = 2
  roundRect(ctx, 36, 100, PAGE_W - 72, 300, 12); ctx.stroke()
  ctx.restore()

  // Photo
  ctx.save(); ctx.strokeStyle = GOLD; ctx.lineWidth = 2.5
  roundRect(ctx, 48, 220, 178, 162, 10); ctx.stroke()
  ctx.restore()
  if (photoDataUri) {
    ctx.save()
    roundRect(ctx, 52, 224, 170, 154, 8); ctx.clip()
    await drawImage(ctx, photoDataUri, 52, 224, 170, 154)
    ctx.restore()
  }

  // Name + details
  const fieldX = 250
  label(ctx, 'NOM DU CHAMPION :', fieldX, 155)
  text(ctx, childName.toUpperCase(), fieldX, 185, { size: 26, bold: true, color: NAVY })

  line(ctx, 248, 195, PAGE_W - 48, 195, '#D1D5DB', 1)

  label(ctx, 'NUMERO DU CHAMPION :', fieldX, 230)
  text(ctx, championNumber, fieldX, 258, { size: 22, bold: true, color: NAVY })

  label(ctx, 'DATE DE CREATION :', fieldX, 300)
  const createdFmt = new Date(createdAt).toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  }).replace(/\//g, ' / ')
  text(ctx, createdFmt, fieldX, 328, { size: 18, bold: true, color: GREEN })

  // QR code
  await drawImage(ctx, qrDataUri, PAGE_W - 180, 220, 140, 140)
  text(ctx, 'SCANNE POUR VOIR',        PAGE_W - 110, 372, { size: 10, bold: false, color: NAVY, align: 'center', alpha: 0.6 })
  text(ctx, 'TON PROFIL NIMIPIKO',     PAGE_W - 110, 387, { size: 10, bold: false, color: NAVY, align: 'center', alpha: 0.6 })

  // Seal
  seal(ctx, PAGE_W - 80, PAGE_H - 100)

  text(ctx, 'Chaque histoire est une nouvelle destination.', cx, PAGE_H - 30, { size: 13, bold: false, color: NAVY, align: 'center', alpha: 0.6 })

  return canvas.toBuffer('image/png')
}

// ── Destination page ──────────────────────────────────────────────────────────

export async function buildPassportDestinationCanvas(opts: {
  story: AirwaysStory
  bookNum: number
  nextStory: AirwaysStory | null
  coverDataUri: string | null
  nextCoverDataUri: string | null
  badgeDataUri: string | null
}): Promise<Buffer> {
  const { story, bookNum, nextStory, coverDataUri, nextCoverDataUri } = opts
  const canvas = createCanvas(PAGE_W, PAGE_H)
  const ctx    = canvas.getContext('2d')

  const bg = ctx.createLinearGradient(0, 0, 0, PAGE_H)
  bg.addColorStop(0, CREAM); bg.addColorStop(1, '#EDE0C4')
  ctx.fillStyle = bg; ctx.fillRect(0, 0, PAGE_W, PAGE_H)

  const cx = PAGE_W / 2

  // Destination pill
  ctx.save(); ctx.fillStyle = GREEN; ctx.globalAlpha = 0.15
  roundRect(ctx, cx - 120, 20, 240, 36, 18); ctx.fill()
  ctx.restore()
  text(ctx, `* DESTINATION ${bookNum} *`, cx, 44, { size: 13, bold: true, color: GREEN, align: 'center' })

  // Story title
  const title = story.title.toUpperCase()
  text(ctx, title, cx, 100, { size: 28, bold: true, color: NAVY, align: 'center', maxWidth: PAGE_W - 80 })

  line(ctx, 40, 116, PAGE_W - 40, 116, GOLD, 1.5, 0.5)

  // Book cover section
  label(ctx, `LIVRE ${bookNum}`, 140, 148, GOLD)
  ctx.save(); ctx.strokeStyle = GOLD; ctx.lineWidth = 2
  roundRect(ctx, 56, 152, 168, 196, 10); ctx.stroke()
  ctx.restore()
  if (coverDataUri) {
    ctx.save()
    roundRect(ctx, 60, 155, 160, 190, 8); ctx.clip()
    await drawImage(ctx, coverDataUri, 60, 155, 160, 190)
    ctx.restore()
  } else {
    text(ctx, '[LIVRE]', 140, 260, { size: 20, bold: true, color: GOLD, align: 'center', alpha: 0.5 })
  }

  // Badge d'attitude
  label(ctx, "BADGE D'ATTITUDE", 440, 148, GOLD)
  text(ctx, '[BADGE]', 440, 260, { size: 20, bold: true, color: GOLD, alpha: 0.4 })

  // DATE DE VALIDATION
  ctx.save(); ctx.fillStyle = 'rgba(255,255,255,0.5)'
  roundRect(ctx, 36, 380, PAGE_W - 72, 120, 10); ctx.fill()
  ctx.restore()
  label(ctx, 'DATE DE VALIDATION', cx - 110, 420, GOLD)
  const dateFmt = story.completed_at
    ? new Date(story.completed_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, ' / ')
    : '__  /  __  /  ____'
  text(ctx, dateFmt, cx, 460, { size: 22, bold: true, color: GREEN })

  // Seals
  seal(ctx, PAGE_W - 80, 470)

  // Travel stamp circle
  ctx.save(); ctx.strokeStyle = GREEN; ctx.lineWidth = 3; ctx.globalAlpha = 0.3
  ctx.beginPath(); ctx.arc(120, 480, 50, 0, Math.PI * 2); ctx.stroke()
  ctx.restore()
  text(ctx, 'NIMIPIKO', 120, 488, { size: 11, bold: false, color: GREEN, align: 'center', alpha: 0.4 })

  // Signature line
  line(ctx, cx - 100, 770, cx + 100, 770, NAVY, 1, 0.3)
  text(ctx, 'SIGNATURE DU CHAMPION', cx, 790, { size: 11, bold: false, color: NAVY, align: 'center', alpha: 0.4 })

  // Next story visa or completion
  if (nextStory) {
    ctx.save(); ctx.strokeStyle = GREEN; ctx.lineWidth = 1.5
    ctx.setLineDash([8, 4])
    roundRect(ctx, 36, 808, PAGE_W - 72, 130, 10); ctx.stroke()
    ctx.restore()
    text(ctx, `VISA D'ENTREE AUTORISE POUR LE LIVRE ${bookNum + 1}`, 50, 802, { size: 11, bold: true, color: GREEN })
    if (nextCoverDataUri) {
      ctx.save()
      roundRect(ctx, 60, 830, 80, 100, 6); ctx.clip()
      await drawImage(ctx, nextCoverDataUri, 60, 830, 80, 100)
      ctx.restore()
    }
    text(ctx, '->', 165, 893, { size: 32, bold: true, color: GREEN })
    ctx.save(); ctx.strokeStyle = NAVY; ctx.lineWidth = 1.5; ctx.setLineDash([5, 3])
    roundRect(ctx, 205, 830, 260, 100, 8); ctx.stroke()
    ctx.restore()
    text(ctx, 'DESTINATION SUIVANTE :', 335, 863, { size: 11, bold: false, color: NAVY, align: 'center', alpha: 0.5 })
    text(ctx, `LIVRE ${bookNum + 1}`,   335, 883, { size: 13, bold: true,  color: NAVY, align: 'center' })
    const nextTitle = nextStory.title.length > 24 ? nextStory.title.slice(0, 22) + '…' : nextStory.title
    text(ctx, nextTitle,               335, 903, { size: 11, bold: false, color: NAVY, align: 'center' })
  } else {
    ctx.save(); ctx.fillStyle = GOLD; ctx.globalAlpha = 0.15
    roundRect(ctx, 36, 808, PAGE_W - 72, 100, 10); ctx.fill()
    ctx.restore()
    text(ctx, 'GRAND CHAMPION DU NIMIPIKO !', cx, 860, { size: 18, bold: true, color: NAVY, align: 'center' })
    text(ctx, 'Tu as termine toutes les histoires !', cx, 888, { size: 14, bold: false, color: NAVY, align: 'center', alpha: 0.7 })
  }

  // Page number
  text(ctx, `p. ${bookNum + 1} / 13`, cx, PAGE_H - 18, { size: 10, bold: false, color: GOLD, align: 'center', alpha: 0.4 })

  return canvas.toBuffer('image/png')
}

// ── Stamps page ───────────────────────────────────────────────────────────────

async function drawStampCell(ctx: CanvasRenderingContext2D, opts: {
  x: number; y: number; bookNum: number; title: string
  coverDataUri: string | null; dateStr: string; isComplete: boolean
}) {
  const { x, y, bookNum, title, coverDataUri, dateStr, isComplete } = opts
  const CW = 220, CH = 270

  // Outer border
  ctx.save()
  ctx.fillStyle   = isComplete ? '#FFFDF5' : '#F5F5F5'
  ctx.strokeStyle = isComplete ? GOLD : '#DDDDDD'
  ctx.lineWidth   = 2.5
  roundRect(ctx, x, y, CW, CH, 10); ctx.fill(); ctx.stroke()
  // Inner dashed border
  ctx.setLineDash([6, 3])
  ctx.strokeStyle = isComplete ? GOLD : '#CCCCCC'
  ctx.lineWidth   = isComplete ? 1.5 : 1
  ctx.globalAlpha = isComplete ? 0.7 : 0.5
  roundRect(ctx, x + 6, y + 6, CW - 12, CH - 12, 8); ctx.stroke()
  ctx.restore()

  // Book number badge
  ctx.save()
  ctx.fillStyle = isComplete ? GOLD : '#CCCCCC'
  ctx.beginPath(); ctx.arc(x + 24, y + 24, 16, 0, Math.PI * 2); ctx.fill()
  ctx.restore()
  text(ctx, String(bookNum), x + 24, y + 29, { size: 14, bold: true, color: isComplete ? NAVY : 'white', align: 'center' })

  // Livre label
  text(ctx, `LIVRE ${bookNum}`, x + 44, y + 22, { size: 10, bold: false, color: isComplete ? GOLD : '#AAAAAA' })

  // Cover image
  if (coverDataUri) {
    ctx.save()
    roundRect(ctx, x + 18, y + 36, CW - 36, 130, 4); ctx.clip()
    await drawImage(ctx, coverDataUri, x + 18, y + 36, CW - 36, 130)
    ctx.restore()
  }

  // Title
  const shortTitle = title.length > 16 ? title.slice(0, 14) + '…' : title
  text(ctx, isComplete ? shortTitle : 'A decouvrir !',
    x + CW / 2, y + 188, {
      size: 11, bold: isComplete, color: isComplete ? NAVY : '#AAAAAA', align: 'center',
    })

  // Date
  if (isComplete) {
    text(ctx, dateStr, x + CW / 2, y + CH - 22, { size: 11, bold: false, color: GOLD, align: 'center' })
    // Seal
    ctx.save(); ctx.fillStyle = GREEN; ctx.globalAlpha = 0.9
    ctx.beginPath(); ctx.arc(x + CW - 26, y + CH - 26, 22, 0, Math.PI * 2); ctx.fill()
    ctx.restore()
    text(ctx, 'V', x + CW - 26, y + CH - 21, { size: 14, bold: true, color: 'white', align: 'center' })
  } else {
    text(ctx, 'DATE :',    x + CW / 2, y + CH - 28, { size: 11, bold: false, color: '#AAAAAA', align: 'center' })
    text(ctx, '__/__/____', x + CW / 2, y + CH - 14, { size: 11, bold: false, color: '#AAAAAA', align: 'center' })
  }
}

export async function buildStampsCanvas(opts: {
  childName: string
  stories: AirwaysStory[]
  coverUris: Map<string, string>
}): Promise<Buffer> {
  const { childName, stories, coverUris } = opts
  const W = 1080, H = 1400
  const canvas = createCanvas(W, H)
  const ctx    = canvas.getContext('2d')

  const bg = ctx.createLinearGradient(0, 0, 0, H)
  bg.addColorStop(0, CREAM); bg.addColorStop(1, '#EDE0C4')
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H)

  // Gold border
  ctx.strokeStyle = GOLD; ctx.lineWidth = 3
  roundRect(ctx, 16, 16, W - 32, H - 32, 18); ctx.stroke()
  ctx.save(); ctx.globalAlpha = 0.4; ctx.lineWidth = 1
  roundRect(ctx, 24, 24, W - 48, H - 48, 14); ctx.stroke()
  ctx.restore()

  // Header stars
  const cxw = W / 2
  for (const [xi] of [[-5.5, 0], [-4.5, 1], [-3.5, 2]] as [number, number][]) {
    text(ctx, '*', 50 + xi * 36 + 500, 58, { size: 22, bold: true, color: GOLD, align: 'center' })
  }
  text(ctx, 'REPUBLIQUE DES CHAMPIONS',     cxw, 62,  { size: 18, bold: true,  color: NAVY, align: 'center' })
  text(ctx, 'COLLECTION OFFICIELLE',        cxw, 108, { size: 44, bold: true,  color: NAVY, align: 'center' })
  text(ctx, 'DES TIMBRES DE VOYAGE NIMIPIKO', cxw, 152, { size: 26, bold: true, color: GOLD, align: 'center' })

  const completed = stories.filter(s => s.is_complete).length
  text(ctx, `${completed} HISTOIRE${completed !== 1 ? 'S' : ''} - ${completed} DESTINATION${completed !== 1 ? 'S' : ''} - ${completed} SOUVENIR${completed !== 1 ? 'S' : ''}`,
    cxw, 188, { size: 16, bold: false, color: NAVY, align: 'center', alpha: 0.7 })
  text(ctx, `Champion : ${childName.toUpperCase()}`, cxw, 215, { size: 14, bold: false, color: GOLD, align: 'center' })

  // Stamp grid
  const TOTAL = 12, COLS = 4
  const CW = 220, CH = 270, GAP_X = 18, GAP_Y = 22
  const startX = (W - (COLS * CW + (COLS - 1) * GAP_X)) / 2
  const startY = 250

  for (let i = 0; i < TOTAL; i++) {
    const col = i % COLS
    const row = Math.floor(i / COLS)
    const x = startX + col * (CW + GAP_X)
    const y = startY + row * (CH + GAP_Y)
    const story = stories[i]

    if (!story) {
      ctx.save(); ctx.fillStyle = '#F0F0F0'; ctx.strokeStyle = '#DDDDDD'; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.5
      roundRect(ctx, x, y, CW, CH, 10); ctx.fill(); ctx.stroke()
      ctx.restore()
      ctx.save(); ctx.fillStyle = '#DDDDDD'
      ctx.beginPath(); ctx.arc(x + 24, y + 24, 16, 0, Math.PI * 2); ctx.fill()
      ctx.restore()
      text(ctx, String(i + 1), x + 24, y + 29, { size: 14, bold: true, color: 'white', align: 'center' })
      text(ctx, 'A decouvrir !', x + CW / 2, y + 145, { size: 11, bold: false, color: '#AAAAAA', align: 'center' })
      continue
    }

    const cover = coverUris.get(story.id) ?? null
    const dateStr = story.completed_at
      ? new Date(story.completed_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
      : '__/__/____'

    await drawStampCell(ctx, { x, y, bookNum: i + 1, title: story.title, coverDataUri: cover, dateStr, isComplete: story.is_complete })
  }

  // Stars progress row
  const starsY = H - 55
  for (let i = 0; i < 12; i++) {
    const sx = cxw - 5.5 * 36 + i * 36 + 18
    text(ctx, i < completed ? '*' : 'o', sx, starsY, { size: 22, bold: true, color: i < completed ? GOLD : '#CCCCCC', align: 'center' })
  }

  // Completion or progress
  if (completed === TOTAL) {
    ctx.save(); ctx.fillStyle = GOLD; ctx.globalAlpha = 0.95
    roundRect(ctx, cxw - 250, H - 170, 500, 80, 12); ctx.fill()
    ctx.restore()
    text(ctx, 'FELICITATIONS GRAND CHAMPION !', cxw, H - 125, { size: 20, bold: true, color: NAVY, align: 'center' })
  } else {
    text(ctx, `${completed} / ${TOTAL} histoires terminees`, cxw, H - 125, { size: 16, bold: false, color: NAVY, align: 'center', alpha: 0.5 })
  }

  text(ctx, 'p. 13 / 13 * nimipiko.com', cxw, H - 18, { size: 10, bold: false, color: GOLD, align: 'center', alpha: 0.5 })

  return canvas.toBuffer('image/png')
}
