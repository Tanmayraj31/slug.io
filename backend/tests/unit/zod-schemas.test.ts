import { describe, expect, it } from "vitest";
import { registerSchema, loginSchema } from "../../src/modules/auth/auth.validation.js";
import {
  createLinkSchema,
  listLinkQuerySchema,
  getLinkParamsSchema,
  updateLinkStatusSchema,
} from "../../src/modules/links/links.validation.js";
import { shortCodeParamsSchema } from "../../src/modules/redirect/redirect.validation.js";

describe("auth validation schemas", () => {
  describe("registerSchema", () => {
    it("accepts valid email and password", () => {
      const result = registerSchema.safeParse({
        email: "  User@Example.COM  ",
        password: "securepass",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe("user@example.com");
      }
    });

    it("accepts optional username", () => {
      const result = registerSchema.safeParse({
        email: "user@example.com",
        password: "securepass",
        username: "  alice  ",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.username).toBe("alice");
      }
    });

    it("accepts without optional username", () => {
      const result = registerSchema.safeParse({
        email: "user@example.com",
        password: "securepass",
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid email", () => {
      const result = registerSchema.safeParse({
        email: "not-an-email",
        password: "securepass",
      });
      expect(result.success).toBe(false);
    });

    it("rejects password shorter than 8 characters", () => {
      const result = registerSchema.safeParse({
        email: "user@example.com",
        password: "short",
      });
      expect(result.success).toBe(false);
    });

    it("rejects password longer than 72 characters", () => {
      const result = registerSchema.safeParse({
        email: "user@example.com",
        password: "a".repeat(73),
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing email", () => {
      const result = registerSchema.safeParse({ password: "securepass" });
      expect(result.success).toBe(false);
    });

    it("rejects missing password", () => {
      const result = registerSchema.safeParse({ email: "user@example.com" });
      expect(result.success).toBe(false);
    });
  });

  describe("loginSchema", () => {
    it("accepts valid credentials", () => {
      const result = loginSchema.safeParse({
        email: "user@example.com",
        password: "anypassword",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe("user@example.com");
      }
    });

    it("trims and lowercases email", () => {
      const result = loginSchema.safeParse({
        email: "  USER@EXAMPLE.COM  ",
        password: "pass",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe("user@example.com");
      }
    });

    it("rejects empty password", () => {
      const result = loginSchema.safeParse({
        email: "user@example.com",
        password: "",
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid email format", () => {
      const result = loginSchema.safeParse({
        email: "bad",
        password: "pass",
      });
      expect(result.success).toBe(false);
    });
  });
});

describe("link validation schemas", () => {
  describe("createLinkSchema", () => {
    it("accepts a valid URL", () => {
      const result = createLinkSchema.safeParse({
        originalUrl: "https://example.com",
      });
      expect(result.success).toBe(true);
    });

    it("accepts a URL with optional expiresAt", () => {
      const result = createLinkSchema.safeParse({
        originalUrl: "https://example.com",
        expiresAt: "2026-12-31T23:59:59+00:00",
      });
      expect(result.success).toBe(true);
    });

    it("trims whitespace from URL", () => {
      const result = createLinkSchema.safeParse({
        originalUrl: "  https://example.com  ",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.originalUrl).toBe("https://example.com");
      }
    });

    it("rejects empty URL", () => {
      const result = createLinkSchema.safeParse({ originalUrl: "" });
      expect(result.success).toBe(false);
    });

    it("rejects missing URL", () => {
      const result = createLinkSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it("rejects invalid expiresAt format", () => {
      const result = createLinkSchema.safeParse({
        originalUrl: "https://example.com",
        expiresAt: "not-a-date",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("listLinkQuerySchema", () => {
    it("applies defaults for missing params", () => {
      const result = listLinkQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.pageSize).toBe(20);
        expect(result.data.status).toBeUndefined();
      }
    });

    it("coerces string numbers from query params", () => {
      const result = listLinkQuerySchema.safeParse({ page: "3", pageSize: "50" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(3);
        expect(result.data.pageSize).toBe(50);
      }
    });

    it("accepts valid LinkStatus values", () => {
      for (const status of ["ACTIVE", "DISABLED", "DELETED"]) {
        const result = listLinkQuerySchema.safeParse({ status });
        expect(result.success).toBe(true);
      }
    });

    it("rejects invalid LinkStatus", () => {
      const result = listLinkQuerySchema.safeParse({ status: "BOGUS" });
      expect(result.success).toBe(false);
    });

    it("rejects pageSize > 100", () => {
      const result = listLinkQuerySchema.safeParse({ pageSize: "101" });
      expect(result.success).toBe(false);
    });

    it("rejects page < 1", () => {
      const result = listLinkQuerySchema.safeParse({ page: "0" });
      expect(result.success).toBe(false);
    });
  });

  describe("getLinkParamsSchema", () => {
    it("accepts a positive integer id", () => {
      const result = getLinkParamsSchema.safeParse({ id: "42" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(42);
      }
    });

    it("rejects zero", () => {
      const result = getLinkParamsSchema.safeParse({ id: "0" });
      expect(result.success).toBe(false);
    });

    it("rejects negative numbers", () => {
      const result = getLinkParamsSchema.safeParse({ id: "-1" });
      expect(result.success).toBe(false);
    });

    it("rejects non-numeric strings", () => {
      const result = getLinkParamsSchema.safeParse({ id: "abc" });
      expect(result.success).toBe(false);
    });
  });

  describe("updateLinkStatusSchema", () => {
    it("accepts ACTIVE", () => {
      const result = updateLinkStatusSchema.safeParse({ status: "ACTIVE" });
      expect(result.success).toBe(true);
    });

    it("accepts DISABLED", () => {
      const result = updateLinkStatusSchema.safeParse({ status: "DISABLED" });
      expect(result.success).toBe(true);
    });

    it("rejects DELETED (not allowed via API)", () => {
      const result = updateLinkStatusSchema.safeParse({ status: "DELETED" });
      expect(result.success).toBe(false);
    });

    it("rejects invalid status", () => {
      const result = updateLinkStatusSchema.safeParse({ status: "BOGUS" });
      expect(result.success).toBe(false);
    });
  });
});

describe("redirect validation schemas", () => {
  describe("shortCodeParamsSchema", () => {
    it("accepts a valid short code", () => {
      const result = shortCodeParamsSchema.safeParse({ shortCode: "abc123" });
      expect(result.success).toBe(true);
    });

    it("accepts a 5-character code (minimum)", () => {
      const result = shortCodeParamsSchema.safeParse({ shortCode: "abcde" });
      expect(result.success).toBe(true);
    });

    it("accepts a 16-character code (maximum)", () => {
      const result = shortCodeParamsSchema.safeParse({ shortCode: "a".repeat(16) });
      expect(result.success).toBe(true);
    });

    it("rejects a code shorter than 5 characters", () => {
      const result = shortCodeParamsSchema.safeParse({ shortCode: "ab" });
      expect(result.success).toBe(false);
    });

    it("rejects a code longer than 16 characters", () => {
      const result = shortCodeParamsSchema.safeParse({ shortCode: "a".repeat(17) });
      expect(result.success).toBe(false);
    });
  });
});
