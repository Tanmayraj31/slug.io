import { describe, expect, it } from "vitest";
import { resolveExpiry } from "../../src/modules/links/expiry.js";
import { ApiError } from "../../src/common/errors/app.error.js";
import type { ResolvedPlan } from "../../src/modules/subscriptions/subscriptions.types.js";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const FREE_PLAN: ResolvedPlan = {
  type: "FREE",
  dailyLinkLimit: 10,
  activeLinkLimit: 30,
  maxExpiryDays: 7,
  allowsCustomAlias: false,
  allowsDetailedAnalytics: false,
};

const PRO_PLAN: ResolvedPlan = {
  type: "PRO",
  dailyLinkLimit: 500,
  activeLinkLimit: 10_000,
  maxExpiryDays: 365,
  allowsCustomAlias: true,
  allowsDetailedAnalytics: true,
};

const PLAN_NO_EXPIRY: ResolvedPlan = {
  ...PRO_PLAN,
  maxExpiryDays: null,
};

describe("resolveExpiry", () => {
  describe("no requested date (default expiry)", () => {
    it("returns now + maxExpiryDays for FREE plan", () => {
      const now = new Date("2026-01-15T12:00:00Z");
      const result = resolveExpiry(undefined, FREE_PLAN, now);
      expect(result.getTime()).toBe(now.getTime() + 7 * MS_PER_DAY);
    });

    it("returns now + maxExpiryDays for PRO plan", () => {
      const now = new Date("2026-01-15T12:00:00Z");
      const result = resolveExpiry(undefined, PRO_PLAN, now);
      expect(result.getTime()).toBe(now.getTime() + 365 * MS_PER_DAY);
    });

    it("throws 500 when maxExpiryDays is null", () => {
      const now = new Date("2026-01-15T12:00:00Z");
      expect(() => resolveExpiry(undefined, PLAN_NO_EXPIRY, now)).toThrow(ApiError);
      try {
        resolveExpiry(undefined, PLAN_NO_EXPIRY, now);
      } catch (err) {
        expect(err).toBeInstanceOf(ApiError);
        expect((err as ApiError).statusCode).toBe(500);
        expect((err as ApiError).code).toBe("PLAN_NOT_CONFIGURED");
      }
    });
  });

  describe("requested date provided", () => {
    it("returns the requested date when valid (PRO plan)", () => {
      const now = new Date("2026-01-15T12:00:00Z");
      const requested = "2026-02-15T12:00:00+00:00";
      const result = resolveExpiry(requested, PRO_PLAN, now);
      expect(result.getTime()).toBe(new Date(requested).getTime());
    });

    it("throws 403 FEATURE_NOT_AVAILABLE for FREE plan", () => {
      const now = new Date("2026-01-15T12:00:00Z");
      const requested = "2026-01-20T12:00:00+00:00";
      expect(() => resolveExpiry(requested, FREE_PLAN, now)).toThrow(ApiError);
      try {
        resolveExpiry(requested, FREE_PLAN, now);
      } catch (err) {
        expect((err as ApiError).statusCode).toBe(403);
        expect((err as ApiError).code).toBe("FEATURE_NOT_AVAILABLE");
      }
    });

    it("throws 400 for a past date", () => {
      const now = new Date("2026-01-15T12:00:00Z");
      const requested = "2026-01-10T12:00:00+00:00";
      expect(() => resolveExpiry(requested, PRO_PLAN, now)).toThrow(ApiError);
      try {
        resolveExpiry(requested, PRO_PLAN, now);
      } catch (err) {
        expect((err as ApiError).statusCode).toBe(400);
        expect((err as ApiError).code).toBe("VALIDATION_ERROR");
      }
    });

    it("throws 400 for an invalid date string", () => {
      const now = new Date("2026-01-15T12:00:00Z");
      expect(() => resolveExpiry("not-a-date", PRO_PLAN, now)).toThrow(ApiError);
      try {
        resolveExpiry("not-a-date", PRO_PLAN, now);
      } catch (err) {
        expect((err as ApiError).statusCode).toBe(400);
        expect((err as ApiError).code).toBe("VALIDATION_ERROR");
      }
    });

    it("throws 403 PLAN_LIMIT_REACHED when date exceeds maxExpiryDays", () => {
      const now = new Date("2026-01-15T12:00:00Z");
      const requested = "2027-01-16T12:00:00+00:00"; // 366 days from now, > 365 max
      expect(() => resolveExpiry(requested, PRO_PLAN, now)).toThrow(ApiError);
      try {
        resolveExpiry(requested, PRO_PLAN, now);
      } catch (err) {
        expect((err as ApiError).statusCode).toBe(403);
        expect((err as ApiError).code).toBe("PLAN_LIMIT_REACHED");
      }
    });

    it("throws 500 when maxExpiryDays is null and date is requested", () => {
      const now = new Date("2026-01-15T12:00:00Z");
      const requested = "2026-02-15T12:00:00+00:00";
      expect(() => resolveExpiry(requested, PLAN_NO_EXPIRY, now)).toThrow(ApiError);
      try {
        resolveExpiry(requested, PLAN_NO_EXPIRY, now);
      } catch (err) {
        expect((err as ApiError).statusCode).toBe(500);
        expect((err as ApiError).code).toBe("PLAN_NOT_CONFIGURED");
      }
    });
  });
});
