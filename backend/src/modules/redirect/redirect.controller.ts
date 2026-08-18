import type { Request, Response } from "express";
import { ApiError } from "../../common/errors/app.error.js";
import { shortCodeParamsSchema } from "./redirect.validation.js";
import { resolveRedirect } from "./redirect.service.js";

export async function redirectController(
  request: Request,
  response: Response
) {
  const parsed = shortCodeParamsSchema.safeParse(request.params);

  if (!parsed.success) {
    throw new ApiError(400, "VALIDATION_ERROR", "Short code is invalid.");
  }

  const originalUrl = await resolveRedirect(
    parsed.data.shortCode,
    request.headers
  );

  response.redirect(302, originalUrl);
}
