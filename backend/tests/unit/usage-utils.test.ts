import { describe, expect, it } from "vitest";
import { getUtcUsageDate } from "../../src/modules/usage/usage.utils.js";

describe("getUtcUsageDate", () => {
  it("returns a Date at midnight UTC for a daytime input", () => {
    const now = new Date("2026-03-15T14:30:45.123Z");
    const result = getUtcUsageDate(now);
    expect(result.getUTCFullYear()).toBe(2026);
    expect(result.getUTCMonth()).toBe(2); // March (0-indexed)
    expect(result.getUTCDate()).toBe(15);
    expect(result.getUTCHours()).toBe(0);
    expect(result.getUTCMinutes()).toBe(0);
    expect(result.getUTCSeconds()).toBe(0);
    expect(result.getUTCMilliseconds()).toBe(0);
  });

  it("returns a Date at midnight UTC for a late-night input", () => {
    const now = new Date("2026-12-31T23:59:59.999Z");
    const result = getUtcUsageDate(now);
    expect(result.getUTCFullYear()).toBe(2026);
    expect(result.getUTCMonth()).toBe(11); // December
    expect(result.getUTCDate()).toBe(31);
    expect(result.getUTCHours()).toBe(0);
  });

  it("returns a Date at midnight UTC for the very start of a day", () => {
    const now = new Date("2026-06-01T00:00:00.000Z");
    const result = getUtcUsageDate(now);
    expect(result.getUTCFullYear()).toBe(2026);
    expect(result.getUTCMonth()).toBe(5); // June
    expect(result.getUTCDate()).toBe(1);
    expect(result.getUTCHours()).toBe(0);
  });

  it("uses UTC date components, not local time", () => {
    // A time that is one day ahead in UTC but still the previous day in some timezones
    const now = new Date("2026-07-01T01:00:00Z");
    const result = getUtcUsageDate(now);
    expect(result.getUTCDate()).toBe(1);
    expect(result.getUTCMonth()).toBe(6); // July
  });

  it("defaults to current time when no argument is provided", () => {
    const before = new Date();
    const result = getUtcUsageDate();
    const after = new Date();

    const todayUtc = Date.UTC(
      before.getUTCFullYear(),
      before.getUTCMonth(),
      before.getUTCDate()
    );

    expect(result.getTime()).toBe(todayUtc);
    expect(result.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  it("returns a new Date instance (no mutation)", () => {
    const now = new Date("2026-05-10T08:00:00Z");
    const originalTime = now.getTime();
    const result = getUtcUsageDate(now);
    expect(now.getTime()).toBe(originalTime);
    expect(result).not.toBe(now);
  });
});
