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
vi.mock("pdf-lib", () => ({ PDFDocument: { create: vi.fn(async () => ({ addPage: vi.fn(), embedPng: vi.fn(async () => ({ width: 100, height: 100, })), embedJpg: vi.fn(async () => ({ width: 100, height: 100 })), save: vi.fn(async () => new Uint8Array()) })) } }));
vi.mock("canvas", () => ({ createCanvas: vi.fn(() => ({ getContext: vi.fn(() => ({ fillRect: vi.fn(), fillText: vi.fn(), drawImage: vi.fn(), beginPath: vi.fn(), arc: vi.fn(), fill: vi.fn(), stroke: vi.fn(), })), toBuffer: vi.fn(() => Buffer.from("")) })) }));

// ── Helpers ─────────────────────────────────────────────────────────────────

import { getAuthUser } from "@/lib/supabaseRouteAuth";
const mockAuth = getAuthUser as ReturnType<typeof vi.fn>;

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
