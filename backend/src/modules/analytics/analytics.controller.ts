import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../auth/auth.middleware.js";
import { getLinkParamsSchema } from "../links/links.validation.js";
import { ApiError } from "../../common/errors/app.error.js";
import { getLinkAnalytics } from "./analytics.service.js";

export async function getLinkAnalyticsController(
  request: Request,
  response: Response,
) {
  const parsed = getLinkParamsSchema.safeParse(request.params);

  if (!parsed.success) {
    throw new ApiError(400, "VALIDATION_ERROR", "Invalid link ID.");
  }

  const { id } = parsed.data;
  const userId = (request as AuthenticatedRequest).user.id;

  const analytics = await getLinkAnalytics(id, userId);

  response.status(200).json(analytics);
}