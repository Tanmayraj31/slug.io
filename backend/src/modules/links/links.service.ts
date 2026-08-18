import { ApiError } from "../../common/errors/app.error.js";
import { env } from "../../config/env.js";
import { LinkStatus, Prisma } from "../../generated/prisma/client.js";
import { resolveActivePlan } from "../subscriptions/subscriptions.service.js";
import { getUtcUsageDate } from "../usage/usage.utils.js";
import { createLinkWithLimits, findLinkById, findLinks, softDeleteLink as softDeleteLinkRepo, updateLinkStatus as updateLinkStatusRepo } from "./links.repository.js";
import { resolveExpiry } from "./expiry.js";
import type { LinkListResponseDto, LinkResponseDto } from "./links.types.js";
import type { CreateLinkInput, ListLinkQuery, UpdateLinkStatusInput } from "./links.validation.js";
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

  const plan = await resolveActivePlan(userId);
  const expiresAt = resolveExpiry(input.expiresAt, plan, new Date());
  const usageDate = getUtcUsageDate();
  const link = await createLinkWithLimits({
    userId,
    originalUrl: validated.url,
    isCustom: false,
    plan,
    usageDate,
    expiresAt,
  });

  return toLinkDto(link);
}

export async function listLinks(userId:number, query: ListLinkQuery):Promise<LinkListResponseDto> {
  const { links, total } = await findLinks(userId, {
    status: query.status,
    page: query.page,
    pageSize: query.pageSize,
  });
  const totalPages = Math.max(1, Math.ceil(total / query.pageSize));

  return {
    links: links.map(toLinkDto),
    page: query.page,
    pageSize: query.pageSize,
    total,
    totalPages,
  };
}


export async function getLinkById(linkId: number, userId: number): Promise<LinkResponseDto> {
  const link = await findLinkById(linkId, userId);

  if (!link) {
    throw new ApiError(404, "LINK_NOT_FOUND", "Link not found.");
  }

  return toLinkDto(link);
}

export async function updateLinkStatus(linkId:number,userId:number, input: UpdateLinkStatusInput):Promise<LinkResponseDto>{

  const link = await findLinkById(linkId, userId);

  if(!link){
    throw new ApiError(404, "LINK_NOT_FOUND", "Link not found.");
  }

  if(link.status === LinkStatus.DELETED){
     throw new ApiError(
      409,
      "LINK_DELETED",
      "A deleted link cannot be reactivated."
    );
  }

  if(input.status === LinkStatus.ACTIVE && link.status === LinkStatus.DISABLED ){
    if (link.expiresAt !== null && link.expiresAt < new Date()) {
      throw new ApiError(
        409,
        "LINK_EXPIRED",
        "An expired link cannot be reactivated."
      );
    }
  }

   if (link.status === input.status) {
    return toLinkDto(link);
  }

  const count = await updateLinkStatusRepo(linkId, userId, input.status);
  if (count === 0) {
    throw new ApiError(404, "LINK_NOT_FOUND", "Link not found.");
  }
  const updated = await findLinkById(linkId, userId);
  return toLinkDto(updated!);
}

export async function deleteLink(linkId: number, userId: number): Promise<void> {
  const link = await findLinkById(linkId, userId);

  if (!link) {
    throw new ApiError(404, "LINK_NOT_FOUND", "Link not found.");
  }

  if (link.status === LinkStatus.DELETED) {
    return;
  }

  const count = await softDeleteLinkRepo(linkId, userId);
  if (count === 0) {
    throw new ApiError(404, "LINK_NOT_FOUND", "Link not found.");
  }
}