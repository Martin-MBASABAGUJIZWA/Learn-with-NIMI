import sharp from 'sharp'
import { createCanvas, registerFont } from 'canvas'
import path from 'path'
import { PDFDocument } from 'pdf-lib'
import { SupabaseClient } from '@supabase/supabase-js'

try {
  const fontsDir = path.join(process.cwd(), 'public', 'fonts')
  registerFont(path.join(fontsDir, 'DejaVuSans-Bold.ttf'), { family: 'DejaVu', weight: 'bold' })
  registerFont(path.join(fontsDir, 'DejaVuSans.ttf'),      { family: 'DejaVu', weight: 'normal' })
} catch { /* already registered or path missing */ }

const STORY_PAGES_BUCKET = 'story-pages'

export interface StoryPageLayout {
  photo_x:       number
  photo_y:       number
  photo_w:       number
  photo_h:       number
  name_x:        number
  name_y:        number
  name_font_size: number
  name_color:    string
}

// Global fallback used when admin hasn't saved a layout yet
const DEFAULT_LAYOUT: StoryPageLayout = {
  photo_x:        60,
  photo_y:        120,
  photo_w:        220,
  photo_h:        280,
  name_x:         60,
  name_y:         420,
  name_font_size: 48,
  name_color:     '#1a1a2e',
}

export interface PersonalizedStoryData {
  storySlug:    string
  childName:    string
  photoBuffer:  Buffer | null
  layout?:      StoryPageLayout | null
}

// ── Fetch all blank story pages from Storage, sorted by page number ───────────
async function fetchStoryPages(
  supabase: SupabaseClient,
  storySlug: string,
): Promise<Buffer[]> {
  const { data: files, error } = await supabase.storage
    .from(STORY_PAGES_BUCKET)
    .list(storySlug, { sortBy: { column: 'name', order: 'asc' } })

  if (error || !files || files.length === 0) return []

  // Filter to image files only and sort naturally (page-1, page-2 … page-12)
  const pageFiles = files
    .filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f.name))
    .sort((a, b) => {
      const numA = parseInt(a.name.match(/\d+/)?.[0] ?? '0', 10)
      const numB = parseInt(b.name.match(/\d+/)?.[0] ?? '0', 10)
      return numA - numB
    })

  const buffers = await Promise.all(
    pageFiles.map(async (file) => {
      const { data } = await supabase.storage
        .from(STORY_PAGES_BUCKET)
        .download(`${storySlug}/${file.name}`)
      if (!data) return null
      return Buffer.from(await data.arrayBuffer()) as Buffer
    })
  )

  return buffers.filter((b): b is Buffer => b !== null)
}

// ── Composite child photo + name onto one blank page ─────────────────────────
async function personalizePage(
  pageBuffer: Buffer,
  childName:  string,
  photoBuffer: Buffer | null,
  layout: StoryPageLayout,
): Promise<Buffer> {
  const composites: sharp.OverlayOptions[] = []

  // Child photo composite
  if (photoBuffer) {
    const photo = await sharp(photoBuffer)
      .resize(layout.photo_w, layout.photo_h, { fit: 'cover', position: 'attention' })
      .png().toBuffer()
    composites.push({ input: photo, left: layout.photo_x, top: layout.photo_y })
  }

  // Child name text overlay
  const meta    = await sharp(pageBuffer).metadata()
  const pageW   = meta.width  ?? 1240
  const pageH   = meta.height ?? 1754

  const canvas  = createCanvas(pageW, pageH)
  const ctx     = canvas.getContext('2d')
  ctx.font      = `bold ${layout.name_font_size}px DejaVu, sans-serif`
  ctx.fillStyle = layout.name_color
  ctx.fillText(childName, layout.name_x, layout.name_y + layout.name_font_size)
  const textOverlay = canvas.toBuffer('image/png')
  composites.push({ input: textOverlay, left: 0, top: 0 })

  return sharp(pageBuffer).composite(composites).png().toBuffer()
}

// ── Main builder ──────────────────────────────────────────────────────────────
export async function buildPersonalizedStoryPdf(
  supabase: SupabaseClient,
  data: PersonalizedStoryData,
): Promise<Uint8Array | null> {
  const layout = data.layout ?? DEFAULT_LAYOUT

  const rawPages = await fetchStoryPages(supabase, data.storySlug)
  if (rawPages.length === 0) return null   // pages not yet uploaded

  const personalizedPages = await Promise.all(
    rawPages.map(page =>
      personalizePage(page, data.childName, data.photoBuffer, layout)
    )
  )

  const doc = await PDFDocument.create()
  for (const png of personalizedPages) {
    const img  = await doc.embedPng(png)
    const page = doc.addPage([img.width, img.height])
    page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height })
  }

  return doc.save()
}
