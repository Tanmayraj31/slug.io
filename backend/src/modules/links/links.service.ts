import { ApiError } from "../../common/errors/app.error.js";
import { env } from "../../config/env.js";
import { Prisma } from "../../generated/prisma/client.js";
import { resolveActivePlan } from "../subscriptions/subscriptions.service.js";
import { createLinkWithRetry } from "./links.repository.js";
import type { LinkResponseDto } from "./links.types.js";
import type { CreateLinkInput } from "./links.validation.js";
import { validateAndNormalizeUrl } from "./url-validation.js";

export function toLinkDto(
  link: Pick<
    Prisma.LinkModel,
    | "id"
    | "originalUrl"
    | "shortCode"
    | "status"
    | "isCustom"
    | "totalClicks"
    | "expiresAt"
    | "createdAt"
    | "updatedAt"
  >
): LinkResponseDto {
  return {
    id: link.id,
    originalUrl: link.originalUrl,
    shortCode: link.shortCode,
    status: link.status,
    isCustom: link.isCustom,
    totalClicks: link.totalClicks,
    expiresAt: link.expiresAt,
    createdAt: link.createdAt,
    updatedAt: link.updatedAt,
    shortUrl: `${env.publicBaseUrl}/${link.shortCode}`,
  };
}

export async function createLink(
  userId: number,
  input: CreateLinkInput
): Promise<LinkResponseDto> {
  const validated = validateAndNormalizeUrl(input.originalUrl);

  if (!validated.ok) {
    throw new ApiError(400, "INVALID_URL", "The destination URL is invalid.");
  }

  await resolveActivePlan(userId);

  // Persist the normalized URL so duplicate detection can compare canonical forms.
  const link = await createLinkWithRetry({
    userId,
    originalUrl: validated.url,
    isCustom: false,
  });

  return toLinkDto(link);
}
