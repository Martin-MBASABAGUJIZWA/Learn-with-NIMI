import sharp from 'sharp'
import { fetchTemplate } from './templateFetcher'
import { barcodeBuffer } from './barcode'

// ── Boarding pass template layout constants ────────────────────
// Adjust these after uploading the actual template and testing.
// All values are in pixels relative to the template image size.

const BP = {
  // Full template dimensions (adjust to match uploaded file)
  W: 1080,
  H: 1080,

  // Child photo rectangle (left side)
  PHOTO: { x: 42, y: 268, w: 295, h: 372 },

  // Text overlays: [x, y] = top-left of each value
  // Labels are already on the template; we only overlay the values.
  NAME:         { x: 400, y: 268, size: 52, bold: true,  color: '#1a1a2e' },
  AGE:          { x: 400, y: 348, size: 28, bold: true,  color: '#1a1a2e' },
  STATUT:       { x: 400, y: 402, size: 28, bold: true,  color: '#16a34a' },
  VOL:          { x: 400, y: 456, size: 28, bold: true,  color: '#1a1a2e' },
  DESTINATION:  { x: 400, y: 510, size: 28, bold: true,  color: '#1a1a2e' },
  LIVRE:        { x: 400, y: 564, size: 28, bold: true,  color: '#1a1a2e' },
  SIEGE:        { x: 400, y: 618, size: 28, bold: true,  color: '#1a1a2e' },
  PORTE:        { x: 400, y: 672, size: 28, bold: true,  color: '#1a1a2e' },
  EMBARQUEMENT: { x: 400, y: 726, size: 28, bold: true,  color: '#16a34a' },

  // Barcode strip (bottom center)
  BARCODE: { x: 80, y: 820, w: 920, h: 100 },
}

export interface BoardingPassData {
  childName: string
  age: number | null
  storyTitle: string
  storyNumber: number    // sort_order (1, 2, 3…)
  childId: string
  photoBuffer: Buffer | null
}

function svgText(
  text: string,
  x: number, y: number,
  size: number,
  color: string,
  bold: boolean,
  anchor: 'start' | 'middle' | 'end' = 'start'
): string {
  const weight = bold ? 'font-weight="700"' : ''
  return `<text x="${x}" y="${y}" font-size="${size}" fill="${color}" ${weight}
    font-family="Arial, Helvetica, sans-serif" text-anchor="${anchor}">${text}</text>`
}

function flightNum(storyNumber: number): string {
  return `NMP1${String(storyNumber).padStart(2, '0')}`
}

function seatNum(age: number | null, storyNumber: number): string {
  return `${age ?? storyNumber}A`
}

function gateNum(storyNumber: number): string {
  return `G${storyNumber}`
}

function statusLabel(storyNumber: number): string {
  return storyNumber >= 7 ? 'GRAND CHAMPION' : 'PETIT CHAMPION'
}

export async function buildBoardingPassImage(data: BoardingPassData): Promise<Buffer> {
  const template = await fetchTemplate('boarding-pass')

  const barcode = await barcodeBuffer(data.childId, data.storyNumber)
  const barcodeResized = await sharp(barcode)
    .resize(BP.BARCODE.w, BP.BARCODE.h, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png()
    .toBuffer()

  // Build photo composite
  const photoComposites: sharp.OverlayOptions[] = []
  if (data.photoBuffer) {
    const photo = await sharp(data.photoBuffer)
      .resize(BP.PHOTO.w, BP.PHOTO.h, { fit: 'cover' })
      .png()
      .toBuffer()
    photoComposites.push({ input: photo, left: BP.PHOTO.x, top: BP.PHOTO.y })
  }

  // Build SVG text overlay
  const status = statusLabel(data.storyNumber)
  const svg = `<svg width="${BP.W}" height="${BP.H}" xmlns="http://www.w3.org/2000/svg">
    ${svgText(data.childName.toUpperCase(), BP.NAME.x, BP.NAME.y + BP.NAME.size, BP.NAME.size, BP.NAME.color, true)}
    ${svgText(`${data.age ?? '?'} ANS`, BP.AGE.x, BP.AGE.y + BP.AGE.size, BP.AGE.size, BP.AGE.color, true)}
    ${svgText(status, BP.STATUT.x, BP.STATUT.y + BP.STATUT.size, BP.STATUT.size, BP.STATUT.color, true)}
    ${svgText(flightNum(data.storyNumber), BP.VOL.x, BP.VOL.y + BP.VOL.size, BP.VOL.size, BP.VOL.color, true)}
    ${svgText(data.storyTitle.toUpperCase(), BP.DESTINATION.x, BP.DESTINATION.y + BP.DESTINATION.size, BP.DESTINATION.size, BP.DESTINATION.color, true)}
    ${svgText(String(data.storyNumber), BP.LIVRE.x, BP.LIVRE.y + BP.LIVRE.size, BP.LIVRE.size, BP.LIVRE.color, true)}
    ${svgText(seatNum(data.age, data.storyNumber), BP.SIEGE.x, BP.SIEGE.y + BP.SIEGE.size, BP.SIEGE.size, BP.SIEGE.color, true)}
    ${svgText(gateNum(data.storyNumber), BP.PORTE.x, BP.PORTE.y + BP.PORTE.size, BP.PORTE.size, BP.PORTE.color, true)}
    ${svgText('OUVERT', BP.EMBARQUEMENT.x, BP.EMBARQUEMENT.y + BP.EMBARQUEMENT.size, BP.EMBARQUEMENT.size, BP.EMBARQUEMENT.color, true)}
  </svg>`

  const textOverlay = await sharp(Buffer.from(svg)).png().toBuffer()

  if (template) {
    // ── Template-based: composite photo + text + barcode onto real template ──
    return sharp(template)
      .resize(BP.W, BP.H, { fit: 'fill' })
      .composite([
        ...photoComposites,
        { input: textOverlay, left: 0, top: 0 },
        { input: barcodeResized, left: BP.BARCODE.x, top: BP.BARCODE.y },
      ])
      .png()
      .toBuffer()
  }

  // ── Fallback: white background + text + barcode (no template uploaded yet) ──
  return sharp({
    create: { width: BP.W, height: BP.H, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } },
  })
    .composite([
      ...photoComposites,
      { input: textOverlay, left: 0, top: 0 },
      { input: barcodeResized, left: BP.BARCODE.x, top: BP.BARCODE.y },
    ])
    .png()
    .toBuffer()
}
