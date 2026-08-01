import bwipjs from 'bwip-js'

/**
 * Generates a real scannable Code 128 barcode PNG buffer.
 * Encodes: "{childId}|{storyNumber}" e.g. "uuid-here|1"
 */
export async function barcodeBuffer(childId: string, storyNumber: number): Promise<Buffer> {
  const text = `${childId}|${storyNumber}`
  return bwipjs.toBuffer({
    bcid: 'code128',
    text,
    scale: 3,
    height: 14,       // bar height in mm
    includetext: true,
    textxalign: 'center',
    textsize: 9,
    backgroundcolor: 'FFFFFF',
    barcolor: '1a1a2e',
  })
}
