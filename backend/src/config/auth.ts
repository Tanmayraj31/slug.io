import { env } from "./env.js";

export const authConfig = {
  accessTokenTtl: env.jwtAccessTtl,
  refreshTokenTtl: env.jwtRefreshTtl,
  cookie: {
    name: env.cookieName,
    options: {
      httpOnly: true,
      secure: env.cookieSecure,
      sameSite: "lax",
      path: "/",
    } as const,
  },
} as const;
