import cookieParser from "cookie-parser";
import express from "express";
import healthRouter from "./common/health/health.routes.js";
import docsRouter from "./common/docs/docs.routes.js";
import authRouter from "./modules/auth/auth.routes.js";
import { ApiError } from "./common/errors/app.error.js";
import { errorHandler } from "./middleware/error-handler.js";
import linksRouter from "./modules/links/links.routes.js";
import redirectRouter from "./modules/redirect/redirect.routes.js";
import { corsMiddleware, securityHeaders } from "./common/security/security.js";
import { env } from "./config/env.js";
const app = express();

app.set("trust proxy", env.trustProxy);

app.use(securityHeaders);
app.use(corsMiddleware);
app.use(express.json({ limit: env.bodyLimit }));
app.use(cookieParser());

app.use("/health", healthRouter);
app.use("/api-docs", docsRouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/links", linksRouter);
app.use("/", redirectRouter);
app.use((_request, _response, next) => {
  next(new ApiError(404, "NOT_FOUND", "Route not found."));
});

app.use(errorHandler);

export default app;