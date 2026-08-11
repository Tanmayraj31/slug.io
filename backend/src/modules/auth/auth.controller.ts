import type { Request, Response } from "express";
import { ApiError } from "../../common/errors/app.error.js";
import { authConfig } from "../../config/auth.js";
import { loginUser, logoutSession, refreshSession, registerUser } from "./auth.service.js";
import { loginSchema, registerSchema } from "./auth.validation.js";

function setRefreshTokenCookie(response: Response, refreshToken: string): void {
  response.cookie(authConfig.cookie.name, refreshToken, {
    ...authConfig.cookie.options,
    maxAge: authConfig.refreshTokenTtl * 1000,
  });
}

function clearRefreshTokenCookie(response: Response): void {
  response.clearCookie(authConfig.cookie.name, authConfig.cookie.options);
}

function readRefreshTokenCookie(request: Request): string {
  const refreshToken = request.cookies?.[authConfig.cookie.name];

  if (typeof refreshToken !== "string" || refreshToken.length === 0) {
    throw new ApiError(401, "INVALID_REFRESH_TOKEN", "The refresh token is missing.");
  }

  return refreshToken;
}

export async function registerController(request: Request, response: Response) {
  const parsed = registerSchema.safeParse(request.body);

  if (!parsed.success) {
    throw new ApiError(400, "VALIDATION_ERROR", "Email, password, and username are invalid.");
  }

  const user = await registerUser(parsed.data);

  response.status(201).json({ user });
}

export async function loginController(request: Request, response: Response) {
  const parsed = loginSchema.safeParse(request.body);

  if (!parsed.success) {
    throw new ApiError(400, "VALIDATION_ERROR", "Email and password are invalid.");
  }

  const result = await loginUser(parsed.data);

  setRefreshTokenCookie(response, result.refreshToken);
  response.status(200).json({ accessToken: result.accessToken, user: result.user });
}

export async function refreshController(request: Request, response: Response) {
  const refreshToken = readRefreshTokenCookie(request);

  const result = await refreshSession(refreshToken);

  setRefreshTokenCookie(response, result.refreshToken);
  response.status(200).json({ accessToken: result.accessToken, user: result.user });
}

export async function logoutController(request: Request, response: Response) {
  const refreshToken = readRefreshTokenCookie(request);

  await logoutSession(refreshToken);

  clearRefreshTokenCookie(response);
  response.status(204).send();
}
