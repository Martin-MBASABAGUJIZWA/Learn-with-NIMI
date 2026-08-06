import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { seatNum, gateNum, statusLabel } from "@/lib/airways/formatters";
import { championNumber, flightNumber, fmtDate } from "@/lib/airways/airwaysData";
import { checkRateLimit } from "@/lib/airways/rateLimiter";
import { safeFilename } from "@/lib/airways/safeFilename";

// ── formatters ──────────────────────────────────────────────────────────────

describe("seatNum", () => {
  it("uses age when present", () => expect(seatNum(7, 3)).toBe("7A"));
  it("falls back to n when age is null", () => expect(seatNum(null, 5)).toBe("5A"));
});

describe("gateNum", () => {
  it("prefixes G", () => expect(gateNum(12)).toBe("G12"));
  it("single digit", () => expect(gateNum(1)).toBe("G1"));
});

describe("statusLabel", () => {
  it("returns GRAND CHAMPION at 7", () => expect(statusLabel(7)).toBe("GRAND CHAMPION"));
  it("returns GRAND CHAMPION above 7", () => expect(statusLabel(10)).toBe("GRAND CHAMPION"));
  it("returns PETIT CHAMPION below 7", () => expect(statusLabel(6)).toBe("PETIT CHAMPION"));
  it("returns PETIT CHAMPION at 0", () => expect(statusLabel(0)).toBe("PETIT CHAMPION"));
});

// ── airwaysData helpers ─────────────────────────────────────────────────────

describe("championNumber", () => {
  it("encodes name prefix, story letter, and rank", () => {
    expect(championNumber("Alice", 1, 42)).toBe("ALI-A-042");
  });
  it("strips non-alpha from name", () => {
    expect(championNumber("A-B C", 2, 1)).toBe("ABC-B-001");
  });
  it("pads short names with X", () => {
    expect(championNumber("Al", 1, 5)).toBe("ALX-A-005");
  });
  it("caps story letter at Z (26)", () => {
    expect(championNumber("Test", 26, 1)).toBe("TES-Z-001");
    expect(championNumber("Test", 27, 1)).toBe("TES-Z-001");
  });
  it("pads rank to 3 digits", () => {
    expect(championNumber("Sam", 3, 999)).toBe("SAM-C-999");
  });
});

describe("flightNumber", () => {
  it("formats book 1 as NMP101", () => expect(flightNumber(1)).toBe("NMP101"));
  it("formats book 2 as NMP102", () => expect(flightNumber(2)).toBe("NMP102"));
  it("pads to 2 digits", () => expect(flightNumber(9)).toBe("NMP109"));
});

describe("fmtDate", () => {
  it("returns placeholder for null", () => expect(fmtDate(null)).toBe("__/__/____"));
  it("returns placeholder for undefined", () => expect(fmtDate(undefined)).toBe("__/__/____"));
  it("formats ISO date correctly", () => {
    // Use a UTC noon timestamp to avoid timezone edge cases
    expect(fmtDate("2026-03-05T12:00:00Z")).toMatch(/05 \/ 03 \/ 2026/);
  });
});

// ── safeFilename ─────────────────────────────────────────────────────────────

describe("safeFilename", () => {
  it("lowercases and replaces spaces", () => expect(safeFilename("Alice Bob")).toBe("alice_bob"));
  it("strips double quotes", () => expect(safeFilename('ali"ce')).toBe("alice"));
  it("strips carriage returns", () => expect(safeFilename("ali\rce")).toBe("alice"));
  it("strips newlines", () => expect(safeFilename("ali\nce")).toBe("alice"));
  it("strips backslashes", () => expect(safeFilename("ali\\ce")).toBe("alice"));
  it("preserves accented chars", () => expect(safeFilename("Élodie")).toBe("élodie"));
  it("falls back to 'child' for empty result", () => expect(safeFilename('""')).toBe("child"));
  it("collapses multiple spaces to single underscore", () => expect(safeFilename("a  b")).toBe("a_b"));
});

// ── rateLimiter ─────────────────────────────────────────────────────────────

describe("checkRateLimit", () => {
  let now: number;

  beforeEach(() => {
    now = Date.now();
    vi.useFakeTimers();
    vi.setSystemTime(now);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows up to the limit", () => {
    const key = `test:${Math.random()}`;
    expect(checkRateLimit(key, 3)).toBe(true);
    expect(checkRateLimit(key, 3)).toBe(true);
    expect(checkRateLimit(key, 3)).toBe(true);
  });

  it("blocks when over the limit", () => {
    const key = `test:${Math.random()}`;
    checkRateLimit(key, 2);
    checkRateLimit(key, 2);
    expect(checkRateLimit(key, 2)).toBe(false);
  });

  it("resets after the window expires", () => {
    const key = `test:${Math.random()}`;
    checkRateLimit(key, 1);
    expect(checkRateLimit(key, 1)).toBe(false);
    vi.advanceTimersByTime(60_001);
    expect(checkRateLimit(key, 1)).toBe(true);
  });

  it("different keys are independent", () => {
    const k1 = `test:${Math.random()}`;
    const k2 = `test:${Math.random()}`;
    checkRateLimit(k1, 1);
    checkRateLimit(k1, 1); // k1 now blocked
    expect(checkRateLimit(k2, 1)).toBe(true); // k2 unaffected
  });
});
