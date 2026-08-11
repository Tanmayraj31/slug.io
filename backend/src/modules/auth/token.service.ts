import { createHash, randomBytes } from "node:crypto";
import jwt from "jsonwebtoken";
import { authConfig } from "../../config/auth.js";
import { env } from "../../config/env.js";

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

export function generateRefreshToken(): string {
  return randomBytes(48).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
