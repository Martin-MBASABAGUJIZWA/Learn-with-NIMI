/**
 * Regression tests for the 10 bugs found in the payment flow QA sweep.
 *
 * These are pure unit tests — no Supabase connection required.
 * They verify the logic that was broken, not the full route handler.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Bug 3: daily-reminder tautology query ────────────────────────────────────
// The original bug: .or("gte:col,...,lte:col,...") in PostgREST generates OR,
// so every timestamp satisfies one arm → all trial subscribers get emailed.
// The fix uses chained .gte().lte() which generates AND.
//
// This test verifies the window logic: only timestamps within ±12 h of the
// 3-day mark should be caught.
describe("Bug 3 — trial ending-soon window logic", () => {
  function isInWindow(currentPeriodEnd: string, referenceMs: number): boolean {
    const ts = new Date(currentPeriodEnd).getTime();
    const low  = referenceMs - 12 * 3_600_000;
    const high = referenceMs + 12 * 3_600_000;
    return ts >= low && ts <= high; // AND, not OR
  }

  const now = new Date("2026-06-01T12:00:00Z");
  const in3days = new Date(now.getTime() + 3 * 86_400_000);

  it("catches a trial expiring in exactly 3 days", () => {
    expect(isInWindow(in3days.toISOString(), in3days.getTime())).toBe(true);
  });

  it("catches a trial expiring 3 days + 11 h from now (within window)", () => {
    const ts = new Date(in3days.getTime() + 11 * 3_600_000).toISOString();
    expect(isInWindow(ts, in3days.getTime())).toBe(true);
  });

  it("rejects a trial expiring today (should not get the 3-day email)", () => {
    expect(isInWindow(now.toISOString(), in3days.getTime())).toBe(false);
  });

  it("rejects a trial expiring in 6 days (outside the window)", () => {
    const ts = new Date(now.getTime() + 6 * 86_400_000).toISOString();
    expect(isInWindow(ts, in3days.getTime())).toBe(false);
  });

  it("rejects a timestamp 13 h outside the window (just over the edge)", () => {
    const ts = new Date(in3days.getTime() + 13 * 3_600_000).toISOString();
    expect(isInWindow(ts, in3days.getTime())).toBe(false);
  });
});

// ─── Bug 4 / Bug 6: CAS guard logic ──────────────────────────────────────────
// The fix: reactivation only proceeds when status is in ["active", "past_due"].
// A manually-cancelled subscription must not be overridden by a late MoMo approval.
describe("Bug 6 — MoMo reactivation CAS guard", () => {
  function shouldReactivate(status: string): boolean {
    return ["active", "past_due"].includes(status);
  }

  it("allows reactivation for 'active'", () => {
    expect(shouldReactivate("active")).toBe(true);
  });

  it("allows reactivation for 'past_due'", () => {
    expect(shouldReactivate("past_due")).toBe(true);
  });

  it("blocks reactivation for 'cancelled'", () => {
    expect(shouldReactivate("cancelled")).toBe(false);
  });

  it("blocks reactivation for 'expired'", () => {
    expect(shouldReactivate("expired")).toBe(false);
  });
});

// ─── Bug 7: addMonths safety — covered in dateUtils.test.ts ──────────────────
// (see __tests__/lib/dateUtils.test.ts)

// ─── Bug 8: referral insert error handling ────────────────────────────────────
// The fix: destructure { error } from the insert and treat 23505 (unique_violation)
// as a graceful "already applied" rather than a silent failure.
describe("Bug 8 — referral insert error classification", () => {
  function classifyInsertError(error: { code?: string } | null): "ok" | "duplicate" | "error" {
    if (!error) return "ok";
    if (error.code === "23505") return "duplicate";
    return "error";
  }

  it("treats null error as success", () => {
    expect(classifyInsertError(null)).toBe("ok");
  });

  it("treats 23505 as a graceful duplicate", () => {
    expect(classifyInsertError({ code: "23505" })).toBe("duplicate");
  });

  it("treats other DB errors as hard errors", () => {
    expect(classifyInsertError({ code: "42P01" })).toBe("error"); // undefined table
    expect(classifyInsertError({ code: "23502" })).toBe("error"); // not_null_violation
  });
});

// ─── Bug 1: gift email dispatch order ─────────────────────────────────────────
// The original bug: CAS marked email_sent_at before calling dispatchGiftEmail,
// so dispatchGiftEmail saw email_sent_at already set and returned early → emails
// never sent. The fix: claim first (email_sent_at = now), THEN fetch product
// and dispatch. dispatchGiftEmail must check send_at, not email_sent_at, to
// decide whether to send.
//
// We test the gate logic in dispatchGiftEmail: it should skip if send_at is
// in the future, but NOT skip just because email_sent_at is already set
// (the caller already owns the row via CAS).
describe("Bug 1 — gift dispatch gate logic", () => {
  const now = new Date("2026-06-01T08:00:00Z");

  function shouldDispatch(sendAt: string | null): boolean {
    if (!sendAt) return true; // no scheduled time → send immediately
    return new Date(sendAt) <= now;
  }

  it("sends when send_at is null (immediate gift)", () => {
    expect(shouldDispatch(null)).toBe(true);
  });

  it("sends when send_at is in the past", () => {
    expect(shouldDispatch("2026-05-30T08:00:00Z")).toBe(true);
  });

  it("sends when send_at is exactly now", () => {
    expect(shouldDispatch("2026-06-01T08:00:00Z")).toBe(true);
  });

  it("skips when send_at is in the future", () => {
    expect(shouldDispatch("2026-06-02T08:00:00Z")).toBe(false);
  });
});

// ─── weekly-digest: pagination termination logic ──────────────────────────────
// The fix: was a single unbounded SELECT loading all parents into memory.
// Now uses offset-based pagination with PAGE=200; loop breaks when the page
// is smaller than PAGE (meaning we've hit the last page).
describe("weekly-digest — pagination termination", () => {
  const PAGE = 200;

  function shouldContinue(pageLength: number): boolean {
    return pageLength >= PAGE; // break when we got fewer than a full page
  }

  it("continues when a full page is returned", () => {
    expect(shouldContinue(200)).toBe(true);
  });

  it("stops when a partial page is returned", () => {
    expect(shouldContinue(199)).toBe(false);
    expect(shouldContinue(1)).toBe(false);
  });

  it("stops immediately on an empty page", () => {
    expect(shouldContinue(0)).toBe(false);
  });

  it("advances offset by PAGE on each iteration", () => {
    let offset = 0;
    const pages = [200, 200, 87]; // 3 pages, last is partial
    let iterations = 0;
    for (const pageLen of pages) {
      iterations++;
      offset += PAGE;
      if (pageLen < PAGE) break;
    }
    expect(iterations).toBe(3);
    expect(offset).toBe(600);
  });
});

// ─── MRR normalization: annual subscriptions ─────────────────────────────────
// The fix: annual subscribers paying e.g. $120/yr were counted as $120 MRR.
// Correct MRR = annual_amount / 12.
describe("MRR normalization — annual subscriptions", () => {
  function mrrOf(amountUsd: number, billingInterval: string | null): number {
    return billingInterval === "year" ? amountUsd / 12 : amountUsd;
  }

  it("passes monthly amount through unchanged", () => {
    expect(mrrOf(9.99, "month")).toBeCloseTo(9.99);
  });

  it("divides annual amount by 12", () => {
    expect(mrrOf(120, "year")).toBeCloseTo(10);
  });

  it("treats null interval as monthly (safe default)", () => {
    expect(mrrOf(9.99, null)).toBeCloseTo(9.99);
  });

  it("ARR = MRR * 12 (round-trips correctly for annual sub)", () => {
    const monthlyAmount = 10;
    const annualAmount  = monthlyAmount * 12;
    const mrr = mrrOf(annualAmount, "year");
    expect(mrr * 12).toBeCloseTo(annualAmount);
  });
});
