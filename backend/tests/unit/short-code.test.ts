import { describe, expect, it } from "vitest";
import { generateShortCode } from "../../src/modules/links/short-code.js";

describe("generateShortCode", () => {
  it("returns a string of the default length (7)", () => {
    const code = generateShortCode();
    expect(code).toHaveLength(7);
  });

  it("returns a string of the specified length", () => {
    expect(generateShortCode(5)).toHaveLength(5);
    expect(generateShortCode(10)).toHaveLength(10);
    expect(generateShortCode(16)).toHaveLength(16);
  });

  it("only contains Base62 characters", () => {
    const charset = /^[0-9A-Za-z]+$/;
    for (let i = 0; i < 50; i++) {
      expect(generateShortCode()).toMatch(charset);
    }
  });

  it("generates different codes on successive calls", () => {
    const codes = new Set<string>();
    for (let i = 0; i < 100; i++) {
      codes.add(generateShortCode());
    }
    expect(codes.size).toBeGreaterThan(90);
  });

  it("handles length 1", () => {
    const code = generateShortCode(1);
    expect(code).toHaveLength(1);
    expect(code).toMatch(/^[0-9A-Za-z]$/);
  });
});
