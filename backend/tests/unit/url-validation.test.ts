import { describe, expect, it } from "vitest";
import { validateAndNormalizeUrl } from "../../src/modules/links/url-validation.js";

describe("validateAndNormalizeUrl", () => {
  describe("valid URLs", () => {
    it("accepts a standard http URL", () => {
      const result = validateAndNormalizeUrl("http://example.com");
      expect(result).toEqual({ ok: true, url: "http://example.com/" });
    });

    it("accepts a standard https URL", () => {
      const result = validateAndNormalizeUrl("https://example.com");
      expect(result).toEqual({ ok: true, url: "https://example.com/" });
    });

    it("accepts a URL with a path", () => {
      const result = validateAndNormalizeUrl("https://example.com/path/to/page");
      expect(result).toEqual({ ok: true, url: "https://example.com/path/to/page" });
    });

    it("accepts a URL with query parameters", () => {
      const result = validateAndNormalizeUrl("https://example.com/search?q=test&page=1");
      expect(result).toEqual({
        ok: true,
        url: "https://example.com/search?q=test&page=1",
      });
    });

    it("accepts a URL with a port", () => {
      const result = validateAndNormalizeUrl("https://example.com:8080/path");
      expect(result).toEqual({ ok: true, url: "https://example.com:8080/path" });
    });

    it("accepts a URL with authentication info", () => {
      const result = validateAndNormalizeUrl("https://user:pass@example.com");
      expect(result).toEqual({ ok: true, url: "https://user:pass@example.com/" });
    });
  });

  describe("normalization", () => {
    it("strips default http port 80", () => {
      const result = validateAndNormalizeUrl("http://example.com:80/path");
      expect(result).toEqual({ ok: true, url: "http://example.com/path" });
    });

    it("strips default https port 443", () => {
      const result = validateAndNormalizeUrl("https://example.com:443/path");
      expect(result).toEqual({ ok: true, url: "https://example.com/path" });
    });

    it("keeps non-default ports", () => {
      const result = validateAndNormalizeUrl("https://example.com:3000/path");
      expect(result).toEqual({ ok: true, url: "https://example.com:3000/path" });
    });

    it("strips hash fragments", () => {
      const result = validateAndNormalizeUrl("https://example.com/path#section");
      expect(result).toEqual({ ok: true, url: "https://example.com/path" });
    });

    it("lowercases the hostname", () => {
      const result = validateAndNormalizeUrl("https://EXAMPLE.COM/path");
      expect(result).toEqual({ ok: true, url: "https://example.com/path" });
    });
  });

  describe("rejected protocols", () => {
    it("rejects ftp://", () => {
      expect(validateAndNormalizeUrl("ftp://example.com")).toEqual({ ok: false });
    });

    it("rejects file://", () => {
      expect(validateAndNormalizeUrl("file:///etc/passwd")).toEqual({ ok: false });
    });

    it("rejects javascript:", () => {
      expect(validateAndNormalizeUrl("javascript:alert(1)")).toEqual({ ok: false });
    });

    it("rejects data:", () => {
      expect(validateAndNormalizeUrl("data:text/html,<h1>hi</h1>")).toEqual({ ok: false });
    });
  });

  describe("blocked hostnames", () => {
    it("rejects localhost", () => {
      expect(validateAndNormalizeUrl("http://localhost")).toEqual({ ok: false });
    });

    it("rejects subdomain.localhost", () => {
      expect(validateAndNormalizeUrl("http://app.localhost")).toEqual({ ok: false });
    });

    it("rejects metadata", () => {
      expect(validateAndNormalizeUrl("http://metadata")).toEqual({ ok: false });
    });

    it("rejects metadata.google.internal", () => {
      expect(validateAndNormalizeUrl("http://metadata.google.internal")).toEqual({
        ok: false,
      });
    });
  });

  describe("private IPv4 addresses", () => {
    it("rejects 0.0.0.0", () => {
      expect(validateAndNormalizeUrl("http://0.0.0.0")).toEqual({ ok: false });
    });

    it("rejects 10.x.x.x", () => {
      expect(validateAndNormalizeUrl("http://10.0.0.1")).toEqual({ ok: false });
    });

    it("rejects 127.x.x.x", () => {
      expect(validateAndNormalizeUrl("http://127.0.0.1")).toEqual({ ok: false });
    });

    it("rejects 172.16.x.x through 172.31.x.x", () => {
      expect(validateAndNormalizeUrl("http://172.16.0.1")).toEqual({ ok: false });
      expect(validateAndNormalizeUrl("http://172.31.255.255")).toEqual({ ok: false });
    });

    it("rejects 169.254.x.x (link-local / cloud metadata)", () => {
      expect(validateAndNormalizeUrl("http://169.254.169.254")).toEqual({ ok: false });
    });

    it("rejects 192.168.x.x", () => {
      expect(validateAndNormalizeUrl("http://192.168.1.1")).toEqual({ ok: false });
    });

    it("accepts public IPv4 addresses", () => {
      expect(validateAndNormalizeUrl("http://8.8.8.8")).toEqual({
        ok: true,
        url: "http://8.8.8.8/",
      });
      expect(validateAndNormalizeUrl("http://1.1.1.1")).toEqual({
        ok: true,
        url: "http://1.1.1.1/",
      });
    });

    it("accepts 172.32.x.x (outside private range)", () => {
      expect(validateAndNormalizeUrl("http://172.32.0.1")).toEqual({
        ok: true,
        url: "http://172.32.0.1/",
      });
    });
  });

  describe("private IPv6 addresses", () => {
    it("rejects :: (unspecified)", () => {
      expect(validateAndNormalizeUrl("http://[::]")).toEqual({ ok: false });
    });

    it("rejects ::1 (loopback)", () => {
      expect(validateAndNormalizeUrl("http://[::1]")).toEqual({ ok: false });
    });

    it("rejects fc00::/7 (ULA)", () => {
      expect(validateAndNormalizeUrl("http://[fc00::1]")).toEqual({ ok: false });
      expect(validateAndNormalizeUrl("http://[fd00::1]")).toEqual({ ok: false });
    });

    it("rejects fe80::/10 (link-local)", () => {
      expect(validateAndNormalizeUrl("http://[fe80::1]")).toEqual({ ok: false });
      expect(validateAndNormalizeUrl("http://[febf::1]")).toEqual({ ok: false });
    });

    it("accepts public IPv6 addresses", () => {
      expect(validateAndNormalizeUrl("http://[2001:db8::1]")).toEqual({
        ok: true,
        url: "http://[2001:db8::1]/",
      });
    });
  });

  describe("edge cases", () => {
    it("rejects empty string", () => {
      expect(validateAndNormalizeUrl("")).toEqual({ ok: false });
    });

    it("rejects string without protocol", () => {
      expect(validateAndNormalizeUrl("example.com")).toEqual({ ok: false });
    });

    it("rejects URLs exceeding 2048 characters", () => {
      const longPath = "a".repeat(2050);
      expect(validateAndNormalizeUrl(`https://example.com/${longPath}`)).toEqual({
        ok: false,
      });
    });

    it("accepts URLs at exactly 2048 characters", () => {
      const pathLen = 2048 - "https://example.com/".length;
      const url = `https://example.com/${"a".repeat(pathLen)}`;
      const result = validateAndNormalizeUrl(url);
      expect(result.ok).toBe(true);
    });
  });
});
