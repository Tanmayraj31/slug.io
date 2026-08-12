import type { Request, Response } from "express";
import { ApiError } from "../../common/errors/app.error.js";
import type { AuthenticatedRequest } from "../auth/auth.middleware.js";
import { createLink } from "./links.service.js";
import { createLinkSchema } from "./links.validation.js";

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
