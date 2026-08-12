import { isIP } from "node:net";

interface ValidUrlResult {
  ok: true;
  url: string;
}

interface InvalidUrlResult {
  ok: false;
}

export type UrlValidationResult = ValidUrlResult | InvalidUrlResult;

const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);
const MAX_URL_LENGTH = 2048;

// Literal hostname blocks reduce SSRF/abuse without resolving DNS at validation time.
const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "metadata",
  "metadata.google.internal",
]);

function isBlockedHostname(host: string): boolean {
  return BLOCKED_HOSTNAMES.has(host) || host.endsWith(".localhost");
}

// RFC 1918 private ranges, loopback, link-local (169.254/16 hosts the cloud metadata endpoint).
function isPrivateIpv4(host: string): boolean {
  const octets = host.split(".").map(Number);
  if (octets.length !== 4) return false;
  const first = octets[0];
  const second = octets[1];
  if (first === undefined || second === undefined) return false;

  return (
    first === 0 ||
    first === 10 ||
    first === 127 ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 169 && second === 254) ||
    (first === 192 && second === 168)
  );
}

function isPrivateIpv6(host: string): boolean {
  if (host === "::" || host === "::1") return true;

  // The first 16-bit segment determines the prefix: fc00::/7 (ULA) and fe80::/10 (link-local).
  const firstHextet = host.split(":")[0];
  const value = firstHextet ? Number.parseInt(firstHextet, 16) : Number.NaN;

  if (!Number.isInteger(value)) return false;

  return value >= 0xfc00 || (value >= 0xfe80 && value <= 0xfebf);
}

export function validateAndNormalizeUrl(raw: string): UrlValidationResult {
  if (raw.length > MAX_URL_LENGTH) return { ok: false };

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return { ok: false };
  }

  if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) return { ok: false };

  // URL keeps IPv6 brackets in hostname (e.g. "[::1]"); strip them before IP checks.
  const hostname = parsed.hostname.toLowerCase();
  const host = hostname.startsWith("[") && hostname.endsWith("]")
    ? hostname.slice(1, -1)
    : hostname;

  if (isBlockedHostname(host)) return { ok: false };

  const ipVersion = isIP(host);
  if (ipVersion === 4 && isPrivateIpv4(host)) return { ok: false };
  if (ipVersion === 6 && isPrivateIpv6(host)) return { ok: false };

  // Normalize to a canonical form so duplicate detection compares equal destinations.
  if (
    (parsed.protocol === "http:" && parsed.port === "80") ||
    (parsed.protocol === "https:" && parsed.port === "443")
  ) {
    parsed.port = "";
  }

  parsed.hash = "";
  parsed.hostname = hostname;

  return { ok: true, url: parsed.toString() };
}
