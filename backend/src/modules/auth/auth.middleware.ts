import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../../common/errors/app.error.js";
import { findUserById } from "./auth.repository.js";
import { toUserDto } from "./auth.service.js";
import { verifyAccessToken } from "./token.service.js";
import type { AuthUserDto } from "./auth.types.js";

export interface AuthenticatedRequest extends Request {
   user: AuthUserDto;
}

export async function requireAuth(
  request: Request,
  _response: Response,
  next: NextFunction
): Promise<void> {
  const authorization = request.headers.authorization;

  if (!authorization || !authorization.startsWith("Bearer ")) {
    throw new ApiError(401, "UNAUTHORIZED", "Missing or malformed Authorization header.");
  }

  const token = authorization.slice("Bearer ".length).trim();

  if (token.length === 0) {
    throw new ApiError(401, "UNAUTHORIZED", "Missing or malformed Authorization header.");
  }

  const payload = verifyAccessToken(token);

  const user = await findUserById(payload.sub);

  if (!user) {
    throw new ApiError(401, "UNAUTHORIZED", "The authenticated user no longer exists.");
  }

  (request as AuthenticatedRequest).user = toUserDto(user);
  next();
}
