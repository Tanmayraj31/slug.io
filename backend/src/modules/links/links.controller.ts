import type { Request, Response } from "express";
import { ApiError } from "../../common/errors/app.error.js";
import type { AuthenticatedRequest } from "../auth/auth.middleware.js";
import { createLink, deleteLink, getLinkById, listLinks, updateLinkStatus } from "./links.service.js";
import { createLinkSchema, getLinkParamsSchema, listLinkQuerySchema, updateLinkStatusSchema } from "./links.validation.js";

export async function createLinkController(request: Request, response: Response) {
  const parsed = createLinkSchema.safeParse(request.body);

  if (!parsed.success) {
    throw new ApiError(400, "VALIDATION_ERROR", "originalUrl is invalid.");
  }

  // requireAuth populated `user` before this handler ran.
  const { user } = request as AuthenticatedRequest;
  const link = await createLink(user.id, parsed.data);

  response.status(201).json({ link });
}

export async function listLinksController(request: Request, response: Response) {
  const parsed = listLinkQuerySchema.safeParse(request.query);

  if (!parsed.success) {
    throw new ApiError(400, "VALIDATION_ERROR", "Query parameters are invalid.");
  }

  const { user } = request as AuthenticatedRequest;
  const result = await listLinks(user.id, parsed.data);

  response.status(200).json(result);
}

export async function getLinkByIdController(request: Request, response: Response) {
  const parsed = getLinkParamsSchema.safeParse(request.params);

  if (!parsed.success) {
    throw new ApiError(400, "VALIDATION_ERROR", "Link ID is invalid.");
  }

  const { user } = request as AuthenticatedRequest;
  const link = await getLinkById(parsed.data.id, user.id);

  response.status(200).json({ link });
}

export async function updateLinkStatusController(request: Request, response: Response) {
  const paramsParsed = getLinkParamsSchema.safeParse(request.params);

  if (!paramsParsed.success) {
    throw new ApiError(400, "VALIDATION_ERROR", "Link ID is invalid.");
  }

  const bodyParsed = updateLinkStatusSchema.safeParse(request.body);

  if (!bodyParsed.success) {
    throw new ApiError(400, "VALIDATION_ERROR", "Status must be ACTIVE or DISABLED.");
  }

  const { user } = request as AuthenticatedRequest;
  const link = await updateLinkStatus(user.id, paramsParsed.data.id, bodyParsed.data);

  response.status(200).json({ link });
}

export async function deleteLinkController(request: Request, response: Response) {
  const parsed = getLinkParamsSchema.safeParse(request.params);

  if (!parsed.success) {
    throw new ApiError(400, "VALIDATION_ERROR", "Link ID is invalid.");
  }

  const { user } = request as AuthenticatedRequest;
  await deleteLink(parsed.data.id, user.id);

  response.status(204).send();
}
