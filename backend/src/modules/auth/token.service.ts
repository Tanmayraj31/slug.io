import { createHash, randomBytes } from "node:crypto";
import jwt from "jsonwebtoken";
import { authConfig } from "../../config/auth.js";
import { env } from "../../config/env.js";
import { ApiError } from "../../common/errors/app.error.js";

export interface AccessTokenPayload {
  sub: number;
}

export function signAccessToken(userId: number): string {
  const payload: AccessTokenPayload = { sub: userId };

  return jwt.sign(payload, env.jwtSecret, {
    algorithm: "HS256",
    expiresIn: authConfig.accessTokenTtl,
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  let payload: jwt.JwtPayload | string;

  try {
    payload = jwt.verify(token, env.jwtSecret, { algorithms: ["HS256"] });
  } catch {
    throw new ApiError(401, "UNAUTHORIZED", "Invalid or expired access token.");
  }

  if (typeof payload === "string" || typeof payload.sub !== "number") {
    throw new ApiError(401, "UNAUTHORIZED", "Invalid or expired access token.");
  }

  return { sub: payload.sub };
}

export function generateRefreshToken(): string {
  return randomBytes(48).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
