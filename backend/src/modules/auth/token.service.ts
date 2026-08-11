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
