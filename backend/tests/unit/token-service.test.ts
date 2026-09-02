import jwt from "jsonwebtoken";
import { describe, expect, it } from "vitest";
import {
  signAccessToken,
  verifyAccessToken,
  generateRefreshToken,
  hashToken,
} from "../../src/modules/auth/token.service.js";
import { ApiError } from "../../src/common/errors/app.error.js";
import { env } from "../../src/config/env.js";

describe("token.service", () => {
  describe("signAccessToken / verifyAccessToken", () => {
    it("produces a token that verifies back to the same userId", () => {
      const token = signAccessToken(42);
      const payload = verifyAccessToken(token);
      expect(payload).toEqual({ sub: 42 });
    });

    it("round-trips with different user IDs", () => {
      for (const id of [1, 999, 2147483647]) {
        const token = signAccessToken(id);
        expect(verifyAccessToken(token)).toEqual({ sub: id });
      }
    });

    it("throws 401 for a garbage token", () => {
      expect(() => verifyAccessToken("not-a-jwt")).toThrow(ApiError);
      try {
        verifyAccessToken("not-a-jwt");
      } catch (err) {
        expect((err as ApiError).statusCode).toBe(401);
        expect((err as ApiError).code).toBe("UNAUTHORIZED");
      }
    });

    it("throws 401 for an empty string", () => {
      expect(() => verifyAccessToken("")).toThrow(ApiError);
    });

    it("throws 401 for a token signed with a different secret", () => {
      const fakeToken = jwt.sign(
        { sub: 1 },
        "completely-different-secret-at-least-32chars!!",
        { algorithm: "HS256", expiresIn: "15m" }
      );
      expect(() => verifyAccessToken(fakeToken)).toThrow(ApiError);
    });

    it("throws 401 for an expired token", () => {
      const expiredToken = jwt.sign({ sub: 1 }, env.jwtSecret, {
        algorithm: "HS256",
        expiresIn: "-1s",
      });
      expect(() => verifyAccessToken(expiredToken)).toThrow(ApiError);
    });
  });

  describe("generateRefreshToken", () => {
    it("returns a non-empty string", () => {
      const token = generateRefreshToken();
      expect(typeof token).toBe("string");
      expect(token.length).toBeGreaterThan(0);
    });

    it("returns base64url-safe characters only", () => {
      const base64url = /^[A-Za-z0-9_-]+$/;
      for (let i = 0; i < 20; i++) {
        expect(generateRefreshToken()).toMatch(base64url);
      }
    });

    it("generates unique tokens on each call", () => {
      const tokens = new Set<string>();
      for (let i = 0; i < 100; i++) {
        tokens.add(generateRefreshToken());
      }
      expect(tokens.size).toBe(100);
    });

    it("produces a 64-character string (48 bytes base64url-encoded)", () => {
      const token = generateRefreshToken();
      expect(token).toHaveLength(64);
    });
  });

  describe("hashToken", () => {
    it("returns a hex-encoded SHA-256 hash", () => {
      const hash = hashToken("hello");
      expect(hash).toMatch(/^[0-9a-f]{64}$/);
    });

    it("is deterministic for the same input", () => {
      expect(hashToken("test-token")).toBe(hashToken("test-token"));
    });

    it("produces different hashes for different inputs", () => {
      expect(hashToken("token-a")).not.toBe(hashToken("token-b"));
    });

    it("matches a known SHA-256 value", () => {
      // SHA-256("hello") = 2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824
      expect(hashToken("hello")).toBe(
        "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824"
      );
    });
  });
});
