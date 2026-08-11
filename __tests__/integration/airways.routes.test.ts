// @vitest-environment node
//
// Guard-layer tests for all 5 Airways PDF routes.
// Mocks Supabase and auth so tests run offline in CI.
// Verifies: 401 unauthenticated, 403 wrong owner, 402 no subscription.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ── Mock auth ────────────────────────────────────────────────────────────────

vi.mock("@/lib/supabaseRouteAuth", () => ({
  getAuthUser: vi.fn(),
}));

// ── Mock service client ──────────────────────────────────────────────────────

const mockSelect = vi.fn();
const mockEq     = vi.fn();
const mockIn     = vi.fn();
const mockSingle = vi.fn();
const mockMaybeSingle = vi.fn();
const mockLimit  = vi.fn();

const chainableMock = {
  select:      () => chainableMock,
  eq:          () => chainableMock,
  in:          () => chainableMock,
  limit:       () => chainableMock,
  single:      mockSingle,
  maybeSingle: mockMaybeSingle,
};

const mockFrom = vi.fn(() => chainableMock);

vi.mock("@/lib/supabase/serviceClient", () => ({
  getServiceClient: () => ({ from: mockFrom }),
}));

// ── Mock heavyweight builders so tests don't actually generate PDFs ──────────

vi.mock("@/lib/airways/airwaysData",       () => ({ fetchAirwaysData: vi.fn(), championNumber: vi.fn(), flightNumber: vi.fn(), fmtDate: vi.fn() }));
vi.mock("@/lib/airways/buildPassportSpread", () => ({ buildPassportSpread: vi.fn() }));
vi.mock("@/lib/airways/buildAttitudeBadge",  () => ({ buildAttitudeBadge: vi.fn(), removeBg: vi.fn() }));
vi.mock("@/lib/airways/buildStampsSvg",      () => ({ buildStampsSvg: vi.fn() }));
vi.mock("@/lib/airways/buildGrandChampion",  () => ({ buildGrandChampionPages: vi.fn() }));
vi.mock("@/lib/airways/buildBoardingPassImage", () => ({ buildBoardingPassImage: vi.fn() }));
vi.mock("@/lib/airways/buildKitImage",       () => ({ buildKitImage: vi.fn() }));
vi.mock("@/lib/airways/avatarToBuffer",      () => ({ avatarUrlToBuffer: vi.fn() }));
vi.mock("@/lib/avatarConfig",                () => ({ isAvatarConfig: vi.fn(() => false) }));
vi.mock("@/lib/airways/rateLimiter",         () => ({ checkRateLimit: vi.fn(() => true) }));
vi.mock("sharp", () => ({ default: vi.fn(() => ({ metadata: vi.fn(async () => ({ width: 100, height: 100 })), resize: vi.fn(() => ({ png: vi.fn(() => ({ toBuffer: vi.fn(async () => Buffer.from("")) })) })), png: vi.fn(() => ({ toBuffer: vi.fn(async () => Buffer.from("")) })) })) }));
vi.mock("pdf-lib", () => ({ PDFDocument: { create: vi.fn(async () => ({ addPage: vi.fn(() => ({ drawImage: vi.fn() })), embedPng: vi.fn(async () => ({ width: 100, height: 100 })), embedJpg: vi.fn(async () => ({ width: 100, height: 100 })), save: vi.fn(async () => new Uint8Array()) })) } }));
vi.mock("canvas", () => ({ createCanvas: vi.fn(() => ({ getContext: vi.fn(() => ({ fillRect: vi.fn(), fillText: vi.fn(), drawImage: vi.fn(), beginPath: vi.fn(), arc: vi.fn(), fill: vi.fn(), stroke: vi.fn(), })), toBuffer: vi.fn(() => Buffer.from("")) })) }));

// ── Helpers ─────────────────────────────────────────────────────────────────

import { getAuthUser } from "@/lib/supabaseRouteAuth";
import { checkRateLimit } from "@/lib/airways/rateLimiter";
const mockAuth       = getAuthUser      as ReturnType<typeof vi.fn>;
const mockRateLimit  = checkRateLimit   as ReturnType<typeof vi.fn>;

function makeReq(url: string): NextRequest {
  return new NextRequest(new URL(url, "http://localhost:3000").toString(), {
    headers: { Authorization: "Bearer token" },
  });
}

// Simulates: user is NOT logged in
function asAnon() { mockAuth.mockResolvedValue(null); }

// Simulates: user is logged in but doesn't own the requested child
function asWrongParent() {
  mockAuth.mockResolvedValue({ id: "wrong-user" });
  mockSingle.mockResolvedValue({ data: { parent_id: "real-parent" }, error: null });
  mockMaybeSingle.mockResolvedValue({ data: null, error: null }); // not admin
}

// Simulates: user is logged in, owns child, but no subscription
function asNoSub() {
  mockAuth.mockResolvedValue({ id: "real-parent" });
  mockSingle.mockResolvedValue({ data: { parent_id: "real-parent" }, error: null });
  mockMaybeSingle
    .mockResolvedValueOnce({ data: null, error: null }) // not admin
    .mockResolvedValueOnce({ data: null, error: null }); // no subscription
}

// Simulates: rate limit exceeded
function asRateLimited() {
  mockAuth.mockResolvedValue({ id: "real-parent" });
  mockRateLimit.mockResolvedValue(false);
}

beforeEach(() => {
  vi.clearAllMocks();
  // Default: every from().select().eq()… returns null data (safe fallback)
  mockSingle.mockResolvedValue({ data: null, error: null });
  mockMaybeSingle.mockResolvedValue({ data: null, error: null });
});

// ── Tests ────────────────────────────────────────────────────────────────────

const ROUTES = [
  { name: "passport",     path: "/api/airways/passport?childId=c1",      file: "@/app/api/airways/passport/route" },
  { name: "boarding-pass",path: "/api/airways/boarding-pass?childId=c1", file: "@/app/api/airways/boarding-pass/route" },
  { name: "stamps",       path: "/api/airways/stamps?childId=c1",        file: "@/app/api/airways/stamps/route" },
  { name: "badge",        path: "/api/airways/badge?childId=c1",         file: "@/app/api/airways/badge/route" },
  { name: "kit",          path: "/api/airways/kit?childId=c1",           file: "@/app/api/airways/kit/route" },
];

// Routes with rate limiting (all 5 as of the fix)
const RATE_LIMITED_ROUTES = ROUTES;

for (const route of ROUTES) {
  describe(`GET ${route.name}`, () => {
    it("returns 401 when unauthenticated", async () => {
      asAnon();
      const { GET } = await import(route.file);
      const res = await GET(makeReq(route.path));
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toMatch(/unauthorized/i);
    });

    it("returns 403 when user does not own the child", async () => {
      asWrongParent();
      const { GET } = await import(route.file);
      const res = await GET(makeReq(route.path));
      expect(res.status).toBe(403);
    });

    it("returns 402 when subscription is missing", async () => {
      asNoSub();
      const { GET } = await import(route.file);
      const res = await GET(makeReq(route.path));
      expect(res.status).toBe(402);
    });
  });
}

// ── Rate limit (429) — verified for all rate-limited routes ──────────────────

for (const route of RATE_LIMITED_ROUTES) {
  it(`GET ${route.name} returns 429 when rate limit exceeded`, async () => {
    asRateLimited();
    // childId check happens before ownership, so we need to also have the child mock
    mockSingle.mockResolvedValue({ data: { parent_id: "real-parent" }, error: null });
    const { GET } = await import(route.file);
    const res = await GET(makeReq(route.path));
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.error).toMatch(/too many/i);
  });
}

// ── Happy path — authenticated owner with active subscription ─────────────────
// Verifies the route returns a binary response with the correct Content-Type.

function asSubscribedOwner() {
  mockAuth.mockResolvedValue({ id: "real-parent" });
  mockRateLimit.mockResolvedValue(true);
  mockSingle.mockResolvedValue({ data: { parent_id: "real-parent" }, error: null });
  mockMaybeSingle
    .mockResolvedValueOnce({ data: null, error: null })              // not admin
    .mockResolvedValueOnce({ data: { id: "sub-1" }, error: null }); // has subscription
}

import { fetchAirwaysData } from "@/lib/airways/airwaysData";
const mockFetchAirwaysData = fetchAirwaysData as ReturnType<typeof vi.fn>;

const MOCK_AIRWAYS_DATA = {
  id: "child-1", name: "Nia", age: 7, avatar_url: null,
  attitude: "CURIEUX", attitude_badge_url: null,
  language: "fr", created_at: "2026-01-01T00:00:00Z",
  parent_id: "real-parent", sibling_rank: 1,
  stories: [{
    id: "s1", title: "Les animaux", slug: "les-animaux",
    sort_order: 1, cover_url: null, attitude: "CURIEUX",
    is_complete: false, completed_at: null,
  }],
  current_story: {
    id: "s1", title: "Les animaux", slug: "les-animaux",
    sort_order: 1, cover_url: null, attitude: "CURIEUX",
    is_complete: false, completed_at: null,
  },
};

const MOCK_PDF_BYTES = new Uint8Array([0x25, 0x50, 0x44, 0x46]); // %PDF magic bytes

describe("happy path — authenticated owner with subscription", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSingle.mockResolvedValue({ data: null, error: null });
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });
    mockFetchAirwaysData.mockResolvedValue(MOCK_AIRWAYS_DATA);
  });

  it("GET boarding-pass returns 200 with application/pdf", async () => {
    asSubscribedOwner();
    // Mock the builder to return a minimal PNG-like buffer
    const { buildBoardingPassImage } = await import("@/lib/airways/buildBoardingPassImage");
    (buildBoardingPassImage as ReturnType<typeof vi.fn>).mockResolvedValue(Buffer.from(MOCK_PDF_BYTES));

    const { GET } = await import("@/app/api/airways/boarding-pass/route");
    const res = await GET(makeReq("/api/airways/boarding-pass?childId=c1&format=pdf"));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toMatch(/application\/pdf/i);
  });

  it("GET stamps returns 200 with application/pdf", async () => {
    asSubscribedOwner();
    const { buildStampsSvg } = await import("@/lib/airways/buildStampsSvg");
    (buildStampsSvg as ReturnType<typeof vi.fn>).mockReturnValue(
      `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1400"></svg>`
    );

    const { GET } = await import("@/app/api/airways/stamps/route");
    const res = await GET(makeReq("/api/airways/stamps?childId=c1&format=pdf"));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toMatch(/application\/pdf/i);
  });

  it("GET kit returns 200 with application/pdf", async () => {
    asSubscribedOwner();
    const { buildKitImage } = await import("@/lib/airways/buildKitImage");
    (buildKitImage as ReturnType<typeof vi.fn>).mockResolvedValue(Buffer.from(MOCK_PDF_BYTES));

    const { GET } = await import("@/app/api/airways/kit/route");
    const res = await GET(makeReq("/api/airways/kit?childId=c1&format=pdf"));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toMatch(/application\/pdf/i);
  });
});
