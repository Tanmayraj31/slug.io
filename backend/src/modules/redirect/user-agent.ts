import { UAParser } from "ua-parser-js";

export function parseUserAgent(
  raw: string | null | undefined
): {
  browser: string | null;
  operatingSystem: string | null;
  deviceType: string | null;
} {
  if (!raw) {
    return { browser: null, operatingSystem: null, deviceType: null };
  }

  const parser = new UAParser(raw);
  const result = parser.getResult();

  return {
    browser: result.browser.name ?? null,
    operatingSystem: result.os.name ?? null,
    deviceType: result.device.type ?? null,
  };
}
