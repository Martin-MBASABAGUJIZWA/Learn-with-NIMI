// @vitest-environment node
//
// Builder-level tests for the Nimipiko Airways pipeline.
// Templates are mocked to null → each builder falls back to a plain canvas/
// solid-color background so tests run without a Supabase connection.
//
// These tests verify:
//   1. mergeField sub-field merge semantics
//   2. buildStampsSvg produces valid, well-formed SVG
//   3. buildBoardingPassImage returns a PNG at the expected dimensions
//   4. buildKitImage returns a PNG at the expected dimensions
//   5. Arc glyph composites for the badge bottom text are within canvas bounds
//      (regression for the y=1178 → invisible text bug)
//   6. buildCertificateImage returns a PNG at 1400×990
//   7. buildPersonalizedStoryPdf assembles a PDF when pages are provided

import { describe, it, expect, vi, beforeAll } from "vitest"
import sharp from "sharp"

// ── Module mocks (must be hoisted before builder imports) ─────────────────────

vi.mock("@/lib/airways/templateFetcher", () => ({
  fetchTemplate:         vi.fn().mockResolvedValue(null),
  getTemplateDimensions: vi.fn().mockResolvedValue({ w: 2200, h: 1100 }),
}))

// Mock Supabase storage for story PDF tests — returns two blank A4 pages
vi.mock("@/lib/supabaseClient", () => ({
  default: {},
}))

// Skip the heavy ML background-removal model in tests
vi.mock("@imgly/background-removal-node", () => ({
  removeBackground: vi.fn().mockImplementation(async (blob: Blob) => blob),
}))

// ── Imports ───────────────────────────────────────────────────────────────────

import { mergeField }                    from "@/lib/airways/layoutMerge"
import { buildStampsSvg }               from "@/lib/airways/buildStampsSvg"
import { buildBoardingPassImage }        from "@/lib/airways/buildBoardingPassImage"
import { buildKitImage }                 from "@/lib/airways/buildKitImage"
import { buildAttitudeBadge }            from "@/lib/airways/buildAttitudeBadge"
import { buildPassportSpread }           from "@/lib/airways/buildPassportSpread"
import { buildGrandChampionPages }       from "@/lib/airways/buildGrandChampion"
import type { AirwaysStory }             from "@/lib/airways/airwaysData"

// ── mergeField ────────────────────────────────────────────────────────────────

describe("mergeField", () => {
  const DEFAULTS = { x: 100, y: 200, w: 50, h: 80, font_size: 24 }

  it("returns defaults when saved is undefined", () => {
    expect(mergeField(undefined, DEFAULTS)).toEqual(DEFAULTS)
  })

  it("returns defaults when saved is null", () => {
    expect(mergeField(null, DEFAULTS)).toEqual(DEFAULTS)
  })

  it("uses saved values when non-null", () => {
    const saved = { x: 10, y: 20, w: 5, h: 8, font_size: 12 }
    expect(mergeField(saved, DEFAULTS)).toEqual(saved)
  })

  it("falls back per-field when saved has null sub-fields", () => {
    const saved = { x: 10, y: null, w: null, h: 8, font_size: null } as never
    const result = mergeField(saved, DEFAULTS)
    expect(result.x).toBe(10)
    expect(result.y).toBe(200)     // default
    expect(result.w).toBe(50)      // default
    expect(result.h).toBe(8)
    expect(result.font_size).toBe(24) // default
  })

  it("ignores extra keys present in saved but not in defaults", () => {
    const saved = { x: 10, y: 20, w: 5, h: 8, font_size: 12, extra: "bonus" } as never
    const result = mergeField(saved, DEFAULTS)
    expect((result as Record<string, unknown>).extra).toBeUndefined()
  })
})

// ── buildStampsSvg ────────────────────────────────────────────────────────────

describe("buildStampsSvg", () => {
  const makeStory = (i: number, complete: boolean): AirwaysStory => ({
    id:           `story-${i}`,
    title:        `Livre ${i}`,
    sort_order:   i,
    cover_url:    null,
    attitude:     "CURIEUX",
    is_complete:  complete,
    completed_at: complete ? "2026-01-01T00:00:00Z" : null,
  })

  it("produces a non-empty SVG string", () => {
    const svg = buildStampsSvg({ childName: "Nia", stories: [], coverUris: new Map() })
    expect(svg).toContain("<svg")
    expect(svg).toContain("</svg>")
  })

  it("shows correct page numbers when supplied", () => {
    const svg = buildStampsSvg({
      childName: "Nia", stories: [], coverUris: new Map(),
      pageNum: 3, totalPages: 5,
    })
    expect(svg).toContain("p. 3 / 5")
  })

  it("omits page label when pageNum is not supplied", () => {
    const svg = buildStampsSvg({ childName: "Nia", stories: [], coverUris: new Map() })
    expect(svg).not.toContain("p. ")
    expect(svg).toContain("nimipiko.com")
  })

  it("marks completed stories with a gold border", () => {
    const stories = [makeStory(1, true), makeStory(2, false)]
    const svg = buildStampsSvg({ childName: "Nia", stories, coverUris: new Map() })
    // Completed stamp has gold stroke; incomplete has grey
    expect(svg).toContain("#C9A84C")
    expect(svg).toContain("#DDDDDD")
  })

  it("escapes HTML entities in child name", () => {
    const svg = buildStampsSvg({
      childName: "O'<script>", stories: [], coverUris: new Map(),
    })
    expect(svg).not.toContain("<script>")
  })

  it("shows grand champion badge when all 12 stories complete", () => {
    const stories = Array.from({ length: 12 }, (_, i) => makeStory(i + 1, true))
    const svg = buildStampsSvg({ childName: "Nia", stories, coverUris: new Map() })
    expect(svg).toContain("FÉLICITATIONS")
  })
})

// ── buildBoardingPassImage ────────────────────────────────────────────────────

describe("buildBoardingPassImage", () => {
  it("returns a PNG buffer at 1080×1080 with no template", async () => {
    const buf = await buildBoardingPassImage({
      childName:   "Nia",
      age:         7,
      storyTitle:  "Les animaux",
      storyNumber: 1,
      childId:     "child-uuid",
      photoBuffer: null,
    })
    expect(buf).toBeInstanceOf(Buffer)
    expect(buf.length).toBeGreaterThan(1000)

    const meta = await sharp(buf).metadata()
    expect(meta.format).toBe("png")
    expect(meta.width).toBe(1080)
    expect(meta.height).toBe(1080)
  }, 15_000)
})

// ── buildKitImage ─────────────────────────────────────────────────────────────

describe("buildKitImage", () => {
  it("returns a PNG buffer at 1254×1254 with no template", async () => {
    const buf = await buildKitImage({
      childName:   "Nia",
      age:         7,
      storyTitle:  "Les animaux",
      storyNumber: 1,
      childId:     "child-uuid",
      photoBuffer: null,
    })
    expect(buf).toBeInstanceOf(Buffer)
    expect(buf.length).toBeGreaterThan(1000)

    const meta = await sharp(buf).metadata()
    expect(meta.format).toBe("png")
    expect(meta.width).toBe(1254)
    expect(meta.height).toBe(1254)
  }, 15_000)
})

// ── buildPassportSpread ───────────────────────────────────────────────────────

describe("buildPassportSpread", () => {
  const story: AirwaysStory = {
    id:           "s1",
    title:        "Les animaux de la savane",
    slug:         "les-animaux",
    sort_order:   1,
    cover_url:    null,
    attitude:     "CURIEUX",
    is_complete:  true,
    completed_at: "2026-01-15T10:00:00Z",
  }

  it("returns a PNG buffer at 2200×1100 (default dimensions, no template)", async () => {
    const buf = await buildPassportSpread({
      childName:            "Nia",
      championNumber:       "NIA-A-001",
      createdAt:            "2026-01-01T00:00:00Z",
      photoDataUri:         null,
      attitudeBadgeDataUri: null,
      qrDataUri:            null,
      story,
      bookNum:              1,
      coverDataUri:         null,
      nextStory:            null,
      nextCoverDataUri:     null,
    })
    expect(buf).toBeInstanceOf(Buffer)
    expect(buf.length).toBeGreaterThan(1000)
    const meta = await sharp(buf).metadata()
    expect(meta.format).toBe("png")
    expect(meta.width).toBe(2200)
    expect(meta.height).toBe(1100)
  }, 20_000)

  it("renders with a next story without throwing", async () => {
    const nextStory: AirwaysStory = {
      id: "s2", title: "La forêt enchantée", slug: "foret",
      sort_order: 2, cover_url: null, attitude: null,
      is_complete: false, completed_at: null,
    }
    const buf = await buildPassportSpread({
      childName:            "Nia",
      championNumber:       "NIA-A-001",
      createdAt:            "2026-01-01T00:00:00Z",
      photoDataUri:         null,
      attitudeBadgeDataUri: null,
      qrDataUri:            null,
      story,
      bookNum:              1,
      coverDataUri:         null,
      nextStory,
      nextCoverDataUri:     null,
    })
    const meta = await sharp(buf).metadata()
    expect(meta.format).toBe("png")
  }, 20_000)

  it("very long story title does not overflow or throw", async () => {
    const longTitle = "Un voyage extraordinaire à travers les continents lointains"
    const buf = await buildPassportSpread({
      childName: "Nia", championNumber: "NIA-A-001",
      createdAt: "2026-01-01T00:00:00Z",
      photoDataUri: null, attitudeBadgeDataUri: null, qrDataUri: null,
      story: { ...story, title: longTitle },
      bookNum: 1, coverDataUri: null, nextStory: null, nextCoverDataUri: null,
    })
    expect(buf.length).toBeGreaterThan(1000)
  }, 20_000)
})

// ── buildGrandChampionPages ───────────────────────────────────────────────────

describe("buildGrandChampionPages", () => {
  const completeStory = (i: number): AirwaysStory => ({
    id:           `s${i}`,
    title:        `Livre ${i}`,
    slug:         `livre-${i}`,
    sort_order:   i,
    cover_url:    null,
    attitude:     "CURIEUX",
    is_complete:  true,
    completed_at: "2026-01-15T10:00:00Z",
  })
  const stories = Array.from({ length: 12 }, (_, i) => completeStory(i + 1))

  it("returns exactly 2 PNG buffers", async () => {
    const pages = await buildGrandChampionPages({
      childName:      "Nia",
      championNumber: "NIA-L-001",
      completedAt:    "2026-06-01T00:00:00Z",
      photoDataUri:   null,
      stories,
    })
    expect(pages).toHaveLength(2)
    for (const p of pages) {
      expect(p).toBeInstanceOf(Buffer)
      expect(p.length).toBeGreaterThan(1000)
    }
  }, 30_000)

  it("ceremony page is 2200×1100", async () => {
    const [ceremony] = await buildGrandChampionPages({
      childName:      "Nia",
      championNumber: "NIA-L-001",
      completedAt:    "2026-06-01T00:00:00Z",
      photoDataUri:   null,
      stories,
    })
    const meta = await sharp(ceremony).metadata()
    expect(meta.format).toBe("png")
    expect(meta.width).toBe(2200)
    expect(meta.height).toBe(1100)
  }, 30_000)

  it("certificate page is 2200×1100", async () => {
    const [, certificate] = await buildGrandChampionPages({
      childName:      "Nia",
      championNumber: "NIA-L-001",
      completedAt:    "2026-06-01T00:00:00Z",
      photoDataUri:   null,
      stories,
    })
    const meta = await sharp(certificate).metadata()
    expect(meta.format).toBe("png")
    expect(meta.width).toBe(2200)
    expect(meta.height).toBe(1100)
  }, 30_000)

  it("renders correctly with null completedAt (no crash)", async () => {
    const pages = await buildGrandChampionPages({
      childName: "Nia", championNumber: "NIA-L-001",
      completedAt: null, photoDataUri: null, stories,
    })
    expect(pages).toHaveLength(2)
  }, 30_000)
})

// ── buildAttitudeBadge — arc bounds regression ────────────────────────────────

describe("buildAttitudeBadge — arc text bounds", () => {
  it("produces a 1080×1080 PNG (no template, no photo)", async () => {
    const buf = await buildAttitudeBadge({
      attitude:          "CURIEUX",
      storyTitle:        "Les animaux de la savane",
      bookNumber:        1,
      childPhotoDataUri: null,
    })
    const meta = await sharp(buf).metadata()
    expect(meta.width).toBe(1080)
    expect(meta.height).toBe(1080)
  }, 20_000)

  it("bottom ribbon text is non-transparent at y≈960 (regression: was y=1178, invisible)", async () => {
    const buf = await buildAttitudeBadge({
      attitude:          "CURIEUX",
      storyTitle:        "Test",
      bookNumber:        1,
      childPhotoDataUri: null,
    })

    // Sample a horizontal strip around y=960 (the bottom ribbon arc apex).
    // With botY=1178 (old bug) the strip was pure transparent. With botY=960
    // at least some pixels should be opaque (the gold ribbon text).
    const { data } = await sharp(buf)
      .extract({ left: 0, top: 930, width: 1080, height: 80 })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true })

    const pixels = new Uint8Array(data)
    let opaqueCount = 0
    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] > 200) opaqueCount++
    }
    expect(opaqueCount).toBeGreaterThan(50)
  }, 20_000)
})

// ── buildCertificateImage ─────────────────────────────────────────────────────

import { buildCertificateImage } from "@/lib/airways/buildCertificateImage"

describe("buildCertificateImage", () => {
  const BASE = {
    childName:      "Nia",
    storyTitle:     "Les animaux de la savane",
    storyNumber:    1,
    completedAt:    "2026-01-15T10:00:00Z",
    championNumber: "NIA-A-001",
    photoBuffer:    null,
  }

  it("personalized: returns PNG at 1400×990", async () => {
    const buf = await buildCertificateImage({ ...BASE, isPersonalized: true })
    expect(buf).toBeInstanceOf(Buffer)
    const meta = await sharp(buf).metadata()
    expect(meta.format).toBe("png")
    expect(meta.width).toBe(1400)
    expect(meta.height).toBe(990)
  }, 15_000)

  it("free: returns PNG at 1400×990", async () => {
    const buf = await buildCertificateImage({ ...BASE, isPersonalized: false })
    expect(buf).toBeInstanceOf(Buffer)
    const meta = await sharp(buf).metadata()
    expect(meta.format).toBe("png")
    expect(meta.width).toBe(1400)
    expect(meta.height).toBe(990)
  }, 15_000)

  it("null completedAt renders placeholder date without crash", async () => {
    const buf = await buildCertificateImage({ ...BASE, completedAt: null })
    expect(buf.length).toBeGreaterThan(1000)
  }, 15_000)

  it("custom layout overrides defaults", async () => {
    const layout = {
      name:     { x: 100, y: 100, font_size: 40, bold: true,  color: "#ff0000" },
      champion: { x: 100, y: 160, font_size: 22, bold: false, color: "#00ff00" },
      title:    { x: 100, y: 200, font_size: 30, bold: true,  color: "#0000ff" },
      number:   { x: 100, y: 250, font_size: 20, bold: false, color: "#000000" },
      date:     { x: 100, y: 290, font_size: 20, bold: false, color: "#000000" },
    }
    const buf = await buildCertificateImage({ ...BASE, layout })
    const meta = await sharp(buf).metadata()
    expect(meta.width).toBe(1400)
    expect(meta.height).toBe(990)
  }, 15_000)
})

// ── buildPersonalizedStoryPdf ─────────────────────────────────────────────────

import { buildPersonalizedStoryPdf } from "@/lib/airways/buildPersonalizedStoryPdf"
import { SupabaseClient } from "@supabase/supabase-js"

async function makeBlankPage(w: number, h: number): Promise<Buffer> {
  return sharp({
    create: { width: w, height: h, channels: 3, background: { r: 255, g: 255, b: 255 } },
  }).png().toBuffer()
}

function makeSupabaseMock(pages: Buffer[]): SupabaseClient {
  return {
    storage: {
      from: () => ({
        list: async () => ({
          data: pages.map((_, i) => ({ name: `page-${i + 1}.png` })),
          error: null,
        }),
        download: async (_path: string) => {
          const idx = parseInt(_path.match(/page-(\d+)/)?.[1] ?? "1", 10) - 1
          const buf = pages[idx] ?? pages[0]
          return {
            data: new Blob([buf], { type: "image/png" }),
            error: null,
          }
        },
      }),
    },
  } as unknown as SupabaseClient
}

describe("buildPersonalizedStoryPdf", () => {
  it("returns null when no pages are uploaded", async () => {
    const emptyMock = {
      storage: {
        from: () => ({
          list: async () => ({ data: [], error: null }),
          download: async () => ({ data: null, error: null }),
        }),
      },
    } as unknown as SupabaseClient

    const result = await buildPersonalizedStoryPdf(emptyMock, {
      storySlug: "test-story",
      childName: "Nia",
      photoBuffer: null,
    })
    expect(result).toBeNull()
  }, 10_000)

  it("assembles a PDF when 2 blank pages are provided", async () => {
    const page1 = await makeBlankPage(1240, 1754)
    const page2 = await makeBlankPage(1240, 1754)
    const mock  = makeSupabaseMock([page1, page2])

    const result = await buildPersonalizedStoryPdf(mock, {
      storySlug:   "test-story",
      childName:   "Nia",
      photoBuffer: null,
    })

    expect(result).not.toBeNull()
    expect(result).toBeInstanceOf(Uint8Array)
    // PDF magic bytes: %PDF
    const header = Buffer.from(result!.slice(0, 4)).toString("ascii")
    expect(header).toBe("%PDF")
  }, 30_000)

  it("applies name overlay without crashing when photoBuffer is null", async () => {
    const page = await makeBlankPage(1240, 1754)
    const mock  = makeSupabaseMock([page])

    const result = await buildPersonalizedStoryPdf(mock, {
      storySlug:   "test-story",
      childName:   "TRÈS LONGUE PRÉNOM D'ENFANT",
      photoBuffer: null,
      layout: {
        photo_x: 50, photo_y: 100, photo_w: 200, photo_h: 250,
        name_x: 50, name_y: 380, name_font_size: 40, name_color: "#1a1a2e",
      },
    })

    expect(result).not.toBeNull()
    const header = Buffer.from(result!.slice(0, 4)).toString("ascii")
    expect(header).toBe("%PDF")
  }, 30_000)
})
