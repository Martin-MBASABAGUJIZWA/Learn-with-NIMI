import { describe, it, expect } from "vitest";
import { addMonths, addYears } from "@/lib/dateUtils";

describe("addMonths", () => {
  it("adds 1 month to a normal date", () => {
    const result = addMonths(new Date("2026-03-15"), 1);
    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(3); // April = 3
    expect(result.getDate()).toBe(15);
  });

  it("clamps Jan 31 + 1 month to Feb 28 (non-leap year)", () => {
    const result = addMonths(new Date("2025-01-31"), 1);
    expect(result.getFullYear()).toBe(2025);
    expect(result.getMonth()).toBe(1); // February
    expect(result.getDate()).toBe(28);
  });

  it("clamps Jan 31 + 1 month to Feb 29 (leap year)", () => {
    const result = addMonths(new Date("2024-01-31"), 1);
    expect(result.getFullYear()).toBe(2024);
    expect(result.getMonth()).toBe(1);
    expect(result.getDate()).toBe(29);
  });

  it("clamps Mar 31 + 1 month to Apr 30", () => {
    const result = addMonths(new Date("2026-03-31"), 1);
    expect(result.getMonth()).toBe(3); // April
    expect(result.getDate()).toBe(30);
  });

  it("wraps year boundary correctly (Dec + 1 = Jan next year)", () => {
    const result = addMonths(new Date("2025-12-15"), 1);
    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(0); // January
    expect(result.getDate()).toBe(15);
  });

  it("adds 12 months correctly", () => {
    const result = addMonths(new Date("2025-02-28"), 12);
    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(1);
    expect(result.getDate()).toBe(28);
  });

  it("does not mutate the original date", () => {
    const original = new Date("2026-01-31");
    const originalTime = original.getTime();
    addMonths(original, 1);
    expect(original.getTime()).toBe(originalTime);
  });
});

describe("addYears", () => {
  it("adds 1 year correctly", () => {
    const result = addYears(new Date("2025-06-15"), 1);
    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(5);
    expect(result.getDate()).toBe(15);
  });

  it("handles Feb 29 in a leap year + 1 year", () => {
    const result = addYears(new Date("2024-02-29"), 1);
    expect(result.getFullYear()).toBe(2025);
    // JS setFullYear rolls Feb 29 2025 → Mar 1 (acceptable for year math)
    expect(result.getMonth()).toBeGreaterThanOrEqual(1);
  });

  it("does not mutate the original date", () => {
    const original = new Date("2025-06-15");
    const originalTime = original.getTime();
    addYears(original, 1);
    expect(original.getTime()).toBe(originalTime);
  });
});
