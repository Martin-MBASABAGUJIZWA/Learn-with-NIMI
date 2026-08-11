// ══════════════════════════════════════════════════════════════════════════════
//  NIMIPIKO AIRWAYS — Grand Champion Pages
//  Two extra pages appended to the passport when ALL stories are complete:
//    1. Ceremony Spread  — dark navy, gold stars, child photo, celebrations
//    2. Citizenship Certificate — parchment, formal French text, seal
// ══════════════════════════════════════════════════════════════════════════════

import sharp from 'sharp'
import { createCanvas, registerFont, loadImage } from 'canvas'
import type { CanvasRenderingContext2D } from 'canvas'
import path from 'path'
import { fmtDate } from './airwaysData'
import type { AirwaysStory } from './airwaysData'

try {
  const dir = path.join(process.cwd(), 'public', 'fonts')
  registerFont(path.join(dir, 'DejaVuSans-Bold.ttf'), { family: 'DejaVu', weight: 'bold' })
  registerFont(path.join(dir, 'DejaVuSans.ttf'),      { family: 'DejaVu', weight: 'normal' })
} catch {}

const W = 2200
const H = 1100

export interface GrandChampionData {
  childName:       string
  championNumber:  string
  completedAt:     string | null   // ISO date of last story completion
  photoDataUri:    string | null
  stories:         AirwaysStory[]
}

// ── Canvas helpers ────────────────────────────────────────────────────────────

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

async function drawCirclePhoto(
  ctx: CanvasRenderingContext2D,
  dataUri: string,
  cx: number, cy: number, r: number
) {
  try {
    const img = await loadImage(dataUri)
    ctx.save()
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.clip()
    const sc = Math.max((r * 2) / img.width, (r * 2) / img.height)
    ctx.drawImage(
      img as unknown as Parameters<typeof ctx.drawImage>[0],
      cx - (img.width  * sc) / 2,
      cy - (img.height * sc) / 2,
      img.width  * sc,
      img.height * sc
    )
    ctx.restore()
  } catch {}
}

function goldBorder(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, lw = 6) {
  ctx.save()
  ctx.strokeStyle = '#C9A84C'
  ctx.lineWidth   = lw
  ctx.strokeRect(x, y, w, h)
  ctx.restore()
}

// ── Page 1: Ceremony Spread ───────────────────────────────────────────────────

async function buildCeremonyPage(data: GrandChampionData): Promise<Buffer> {
  const canvas = createCanvas(W, H)
  const ctx    = canvas.getContext('2d')

  // ── Background: deep navy ──
  ctx.fillStyle = '#06101F'
  ctx.fillRect(0, 0, W, H)

  // ── Gold star field — fixed positions + sizes for reproducible output ──
  const starPositions: [number, number, number][] = [
    [80,   60,  3], [200, 120, 4], [350,  45, 2], [500,  90, 4], [620,  30, 3],
    [750, 110,  2], [900,  55, 4], [1020, 85, 3], [1150, 30, 2], [1300, 100, 4],
    [1450, 50,  3], [1600, 120, 2],[1750, 40, 4], [1900, 80, 3], [2050, 50, 2],
    [2150, 110, 3], [120, 200, 4], [320, 250, 2], [560, 210, 3], [780, 270, 4],
    [980, 230,  2], [1200, 260, 3],[1420, 200,4], [1640, 240, 2],[1850, 210, 3],
    [2100, 260, 4], [60,  900, 2], [220, 960, 3], [400, 920, 4], [600, 980, 2],
    [820, 940,  3], [1050,1000,4], [1280,950, 2], [1500, 990, 3],[1700, 930, 4],
    [1950, 970, 2], [2150, 940,3],
  ]
  ctx.fillStyle = '#C9A84C'
  for (const [sx, sy, r] of starPositions) {
    ctx.beginPath()
    ctx.arc(sx, sy, r, 0, Math.PI * 2)
    ctx.fill()
  }

  // ── Vertical centre divider ──
  ctx.save()
  const grad = ctx.createLinearGradient(1080, 0, 1120, 0)
  grad.addColorStop(0, 'transparent')
  grad.addColorStop(0.5, '#C9A84C')
  grad.addColorStop(1, 'transparent')
  ctx.fillStyle = grad
  ctx.fillRect(1080, 60, 40, H - 120)
  ctx.restore()

  // ══ LEFT PAGE: child identity ══
  const PHOTO_CX = 300, PHOTO_CY = 480, PHOTO_R = 200

  // Gold ring behind photo
  ctx.save()
  ctx.strokeStyle = '#C9A84C'
  ctx.lineWidth   = 12
  ctx.beginPath()
  ctx.arc(PHOTO_CX, PHOTO_CY, PHOTO_R + 18, 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()

  // Outer glow ring
  ctx.save()
  ctx.strokeStyle = 'rgba(201,168,76,0.3)'
  ctx.lineWidth   = 30
  ctx.beginPath()
  ctx.arc(PHOTO_CX, PHOTO_CY, PHOTO_R + 36, 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()

  if (data.photoDataUri) {
    await drawCirclePhoto(ctx, data.photoDataUri, PHOTO_CX, PHOTO_CY, PHOTO_R)
  } else {
    // Placeholder avatar
    ctx.save()
    ctx.fillStyle = '#1A3558'
    ctx.beginPath()
    ctx.arc(PHOTO_CX, PHOTO_CY, PHOTO_R, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
    txt(ctx, '✈', PHOTO_CX, PHOTO_CY - 80, { size: 140, color: '#C9A84C', align: 'center' })
  }

  // Name tag below photo
  const nameY = PHOTO_CY + PHOTO_R + 40
  txt(ctx, data.childName.toUpperCase(), PHOTO_CX, nameY,
    { size: 52, bold: true, color: '#FFFFFF', align: 'center', maxWidth: 900 })

  txt(ctx, data.championNumber, PHOTO_CX, nameY + 65,
    { size: 30, color: '#C9A84C', align: 'center' })

  // Top left: edition label
  txt(ctx, 'NIMIPIKO AIRWAYS', 60, 55,
    { size: 24, bold: true, color: '#C9A84C', align: 'left' })
  txt(ctx, 'ÉDITION GRAND CHAMPION', 60, 88,
    { size: 18, color: 'rgba(201,168,76,0.7)', align: 'left' })

  // ══ RIGHT PAGE: celebration ══
  const RX = 1200

  // Trophy emoji — big
  txt(ctx, '🏆', RX + 360, 60, { size: 120, align: 'center' })

  // Main title
  txt(ctx, 'FÉLICITATIONS !', RX + 50, 210,
    { size: 86, bold: true, color: '#C9A84C', align: 'left', maxWidth: 880 })

  txt(ctx, 'GRAND CHAMPION', RX + 50, 310,
    { size: 60, bold: true, color: '#FFFFFF', align: 'left', maxWidth: 880 })

  // Subtitle
  const completedCount = data.stories.filter(s => s.is_complete).length
  txt(ctx,
    `${data.childName} a complété les ${completedCount} livres Nimipiko`,
    RX + 50, 410,
    { size: 30, color: 'rgba(255,255,255,0.75)', align: 'left', maxWidth: 880 }
  )

  // Completion date
  txt(ctx, 'Complété le', RX + 50, 478, { size: 22, color: '#C9A84C', align: 'left' })
  txt(ctx, fmtDate(data.completedAt), RX + 50, 508,
    { size: 36, bold: true, color: '#FFFFFF', align: 'left' })

  // Divider line
  ctx.save()
  ctx.strokeStyle = 'rgba(201,168,76,0.35)'
  ctx.lineWidth   = 2
  ctx.beginPath()
  ctx.moveTo(RX + 50, 570); ctx.lineTo(RX + 1000, 570)
  ctx.stroke()
  ctx.restore()

  // Story list — 2 columns of 6
  const completed = data.stories.filter(s => s.is_complete)

  txt(ctx, 'VOYAGES ACCOMPLIS', RX + 50, 588,
    { size: 20, bold: true, color: '#C9A84C', align: 'left' })

  const drawStoryList = (list: AirwaysStory[], startX: number, startY: number) => {
    list.forEach((s, i) => {
      const title = s.title.length > 28 ? s.title.slice(0, 26) + '…' : s.title
      txt(ctx, `✓  ${title}`, startX, startY + i * 70,
        { size: 24, color: 'rgba(255,255,255,0.80)', align: 'left', maxWidth: 440 })
      txt(ctx, fmtDate(s.completed_at), startX + 20, startY + i * 70 + 28,
        { size: 18, color: 'rgba(201,168,76,0.65)', align: 'left' })
    })
  }
  const half = Math.ceil(completed.length / 2)
  drawStoryList(completed.slice(0, half), RX + 50, 624)
  drawStoryList(completed.slice(half), RX + 530, 624)

  // Bottom seal area
  txt(ctx, '★  NIMIPIKO AIRWAYS  ★  ACADÉMIE DES CHAMPIONS  ★',
    W / 2, H - 50,
    { size: 20, bold: true, color: 'rgba(201,168,76,0.5)', align: 'center' })

  return sharp(canvas.toBuffer('image/png')).png({ quality: 95 }).toBuffer()
}

// ── Page 2: Citizenship Certificate ──────────────────────────────────────────

async function buildCertificatePage(data: GrandChampionData): Promise<Buffer> {
  const canvas = createCanvas(W, H)
  const ctx    = canvas.getContext('2d')

  // ── Background: warm parchment ──
  const bgGrad = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) / 1.5)
  bgGrad.addColorStop(0, '#FDF8EE')
  bgGrad.addColorStop(1, '#F0E4C8')
  ctx.fillStyle = bgGrad
  ctx.fillRect(0, 0, W, H)

  // ── Outer gold border (double) ──
  goldBorder(ctx, 30,  30,  W - 60,  H - 60,  8)
  goldBorder(ctx, 50,  50,  W - 100, H - 100, 3)

  // ── Corner flourish dots ──
  const corners = [[80, 80], [W - 80, 80], [80, H - 80], [W - 80, H - 80]]
  ctx.fillStyle = '#C9A84C'
  for (const [cx, cy] of corners) {
    ctx.beginPath(); ctx.arc(cx, cy, 10, 0, Math.PI * 2); ctx.fill()
  }

  // ── Header: institution name ──
  const MX = W / 2
  txt(ctx, 'ACADÉMIE NIMIPIKO AIRWAYS', MX, 90,
    { size: 28, bold: true, color: '#8B6914', align: 'center' })

  // Thin rule
  ctx.save()
  ctx.strokeStyle = '#C9A84C'
  ctx.lineWidth = 2
  ctx.beginPath(); ctx.moveTo(200, 140); ctx.lineTo(W - 200, 140); ctx.stroke()
  ctx.restore()

  // ── Title ──
  txt(ctx, 'CERTIFICAT', MX, 160,
    { size: 74, bold: true, color: '#0D1B30', align: 'center' })
  txt(ctx, 'DE GRAND CHAMPION', MX, 250,
    { size: 42, bold: true, color: '#1A7A3E', align: 'center' })

  // Thick rule
  ctx.save()
  ctx.strokeStyle = '#C9A84C'
  ctx.lineWidth = 4
  ctx.beginPath(); ctx.moveTo(300, 314); ctx.lineTo(W - 300, 314); ctx.stroke()
  ctx.restore()

  // ── Body copy ──
  txt(ctx, 'Il est par la présente certifié que', MX, 340,
    { size: 28, color: '#4A3010', align: 'center' })

  // Child name — large, spaced
  txt(ctx, data.childName.toUpperCase(), MX, 390,
    { size: 78, bold: true, color: '#0D1B30', align: 'center', maxWidth: 1800 })

  const completedCount = data.stories.filter(s => s.is_complete).length
  const countWord = completedCount === 12 ? 'douze' : String(completedCount)
  txt(ctx, `a victorieusement complété les ${countWord} voyages de l\'Académie Nimipiko,`, MX, 490,
    { size: 26, color: '#4A3010', align: 'center', maxWidth: 1700 })
  txt(ctx, 'démontrant curiosité, persévérance et un amour profond de la découverte.', MX, 530,
    { size: 26, color: '#4A3010', align: 'center', maxWidth: 1700 })

  // ── Stats row ──
  const stats = [
    { label: 'Livres complétés', value: String(completedCount) },
    { label: 'Numéro Champion',  value: data.championNumber },
    { label: 'Date d\'obtention', value: fmtDate(data.completedAt) },
  ]
  const statW  = (W - 200) / 3
  stats.forEach((s, i) => {
    const sx = 100 + statW * i + statW / 2
    // Box
    ctx.save()
    ctx.fillStyle   = 'rgba(201,168,76,0.12)'
    ctx.strokeStyle = '#C9A84C'
    ctx.lineWidth   = 2
    ctx.beginPath()
    ctx.rect(sx - statW / 2 + 20, 590, statW - 40, 110)
    ctx.fill(); ctx.stroke()
    ctx.restore()
    txt(ctx, s.value,  sx, 605, { size: 36, bold: true, color: '#0D1B30', align: 'center', maxWidth: statW - 50 })
    txt(ctx, s.label,  sx, 655, { size: 20, color: '#8B6914', align: 'center', maxWidth: statW - 50 })
  })

  // ── Signature line ──
  const sigY = 740
  ctx.save()
  ctx.strokeStyle = '#8B6914'
  ctx.lineWidth = 2
  ctx.setLineDash([4, 6])
  ctx.beginPath(); ctx.moveTo(320, sigY + 60); ctx.lineTo(800, sigY + 60); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(W - 800, sigY + 60); ctx.lineTo(W - 320, sigY + 60); ctx.stroke()
  ctx.restore()

  txt(ctx, 'Nimi', 560, sigY, { size: 50, bold: true, color: '#1A7A3E', align: 'center' })
  txt(ctx, 'Directeur de l\'Académie', 560, sigY + 68,
    { size: 20, color: '#8B6914', align: 'center' })

  txt(ctx, '🏆', W - 560, sigY - 10, { size: 50, align: 'center' })
  txt(ctx, 'Sceau Officiel', W - 560, sigY + 68,
    { size: 20, color: '#8B6914', align: 'center' })

  // ── Oath text ──
  ctx.save()
  ctx.fillStyle   = 'rgba(201,168,76,0.10)'
  ctx.strokeStyle = '#C9A84C'
  ctx.lineWidth   = 1.5
  ctx.beginPath(); ctx.rect(100, 830, W - 200, 160); ctx.fill(); ctx.stroke()
  ctx.restore()

  txt(ctx, '✦  SERMENT DU GRAND CHAMPION  ✦', MX, 848,
    { size: 20, bold: true, color: '#8B6914', align: 'center' })
  txt(ctx,
    '"Je promets de garder la curiosité comme boussole, la persévérance comme moteur,',
    MX, 882, { size: 22, color: '#4A3010', align: 'center', maxWidth: 1900 })
  txt(ctx,
    'et d\'emporter l\'esprit d\'aventure Nimipiko dans chaque nouveau voyage de ma vie."',
    MX, 918, { size: 22, color: '#4A3010', align: 'center', maxWidth: 1900 })

  txt(ctx, `N° ${data.championNumber}  ·  Nimipiko Airways  ·  nimipiko.com`, MX, H - 52,
    { size: 18, color: 'rgba(139,105,20,0.55)', align: 'center' })

  return sharp(canvas.toBuffer('image/png')).png({ quality: 95 }).toBuffer()
}

// ── Public API ────────────────────────────────────────────────────────────────

/** Returns [ceremonyPage, certificatePage] as PNG Buffers. */
export async function buildGrandChampionPages(data: GrandChampionData): Promise<Buffer[]> {
  const [ceremony, certificate] = await Promise.all([
    buildCeremonyPage(data),
    buildCertificatePage(data),
  ])
  return [ceremony, certificate]
}
