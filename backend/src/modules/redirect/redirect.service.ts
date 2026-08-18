import { LinkStatus } from "../../generated/prisma/client.js";
import { prisma } from "../../database/prisma.js";
import { ApiError } from "../../common/errors/app.error.js";
import { findLinkByShortCode, recordClick } from "./redirect.repository.js";
import { parseUserAgent } from "./user-agent.js";
import type { IncomingHttpHeaders } from "http";

export async function resolveRedirect(
  shortCode: string,
  headers: IncomingHttpHeaders
): Promise<string> {
  const link = await findLinkByShortCode(shortCode);

  if (!link) {
    throw new ApiError(404, "LINK_NOT_FOUND", "Short code not found.");
  }

  if (link.status !== LinkStatus.ACTIVE) {
    throw new ApiError(410, "LINK_GONE", "Link is disabled or deleted.");
  }

  if (link.expiresAt !== null && link.expiresAt < new Date()) {
    throw new ApiError(410, "LINK_GONE", "Link has expired.");
  }

  const referrer =
    typeof headers.referer === "string" ? headers.referer : null;
  const userAgent =
    typeof headers["user-agent"] === "string"
      ? headers["user-agent"]
      : null;
  const parsed = parseUserAgent(userAgent);

  await prisma.$transaction((tx) =>
    recordClick(tx, link.id, {
      referrer,
      userAgent,
      browser: parsed.browser,
      operatingSystem: parsed.operatingSystem,
      deviceType: parsed.deviceType,
    })
  );

  return link.originalUrl;
}
