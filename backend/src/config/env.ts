import "dotenv/config";

const rawPort = process.env.PORT ?? "3000";
const port = Number(rawPort);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT must be an integer between 1 and 65535.");
}

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required.");
}

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret || jwtSecret.length < 32) {
  throw new Error("JWT_SECRET is required and must be at least 32 characters.");
}

function parseSeconds(raw: string | undefined, fallback: number, name: string): number {
  const value = raw === undefined ? fallback : Number(raw);
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`${name} must be a positive integer number of seconds.`);
  }
  return value;
}

function parseBoolean(raw: string | undefined, name: string): boolean {
  if (raw === undefined) {
    return false;
  }
  if (raw === "true") {
    return true;
  }
  if (raw === "false") {
    return false;
  }
  throw new Error(`${name} must be "true" or "false".`);
}

const jwtAccessTtl = parseSeconds(process.env.JWT_ACCESS_TTL, 900, "JWT_ACCESS_TTL");
const jwtRefreshTtl = parseSeconds(process.env.JWT_REFRESH_TTL, 2592000, "JWT_REFRESH_TTL");

const cookieName = process.env.COOKIE_NAME ?? "refreshToken";
const cookieSecure = parseBoolean(process.env.COOKIE_SECURE, "COOKIE_SECURE");

export const env = {
  port,
  databaseUrl,
  jwtSecret,
  jwtAccessTtl,
  jwtRefreshTtl,
  cookieName,
  cookieSecure,
};
