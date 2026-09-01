import cors from "cors";
import helmet from "helmet";
import type { RequestHandler } from "express";
import { env } from "../../config/env.js";

export const securityHeaders: RequestHandler = helmet();

export const corsMiddleware: RequestHandler = cors({
  origin(origin, callback) {
    if (env.corsOrigins.length === 0) {
      callback(null, false);
      return;
    }

    if (origin === undefined) {
      callback(null, false);
      return;
    }

    if (env.corsOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(null, false);
  },
  credentials: true,
});
