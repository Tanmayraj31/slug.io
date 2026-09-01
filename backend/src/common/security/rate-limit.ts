import { ipKeyGenerator, rateLimit } from "express-rate-limit";
import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../errors/app.error.js";
import { env } from "../../config/env.js";
import type { AuthenticatedRequest } from "../../modules/auth/auth.middleware.js";

function rateLimitHandler(
  request: Request,
  response: Response,
  next: NextFunction
): void {
  response.setHeader("Retry-After", "60");
  next(new ApiError(429, "RATE_LIMITED", "Too many requests. Please try again later."));
}

export const authRateLimiter = rateLimit({
  windowMs: env.authRateLimit.windowMs,
  limit: env.authRateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

export const apiRateLimiter = rateLimit({
  windowMs: env.apiRateLimit.windowMs,
  limit: env.apiRateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (request: Request) => {
    const userId = (request as AuthenticatedRequest).user?.id;
    return userId !== undefined ? `user:${userId}` : ipKeyGenerator(request.ip ?? "unknown");
  },
  handler: rateLimitHandler,
});

export const redirectRateLimiter = rateLimit({
  windowMs: env.redirectRateLimit.windowMs,
  limit: env.redirectRateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});
