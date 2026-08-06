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

import { describe, it, expect, vi, beforeAll } from "vitest"
import sharp from "sharp"

// ── Module mocks (must be hoisted before builder imports) ─────────────────────

vi.mock("@/lib/airways/templateFetcher", () => ({
  fetchTemplate:         vi.fn().mockResolvedValue(null),
  getTemplateDimensions: vi.fn().mockResolvedValue({ w: 2200, h: 1100 }),
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
