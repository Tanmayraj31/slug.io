import cookieParser from "cookie-parser";
import express from "express";
import healthRouter from "./common/health/health.routes.js";
import docsRouter from "./common/docs/docs.routes.js";
import authRouter from "./modules/auth/auth.routes.js";
import { ApiError } from "./common/errors/app.error.js";
import { errorHandler } from "./middleware/error-handler.js";
const app = express();

app.use(express.json());
app.use(cookieParser());

app.use("/health", healthRouter);
app.use("/api-docs", docsRouter);
app.use("/api/v1/auth", authRouter);
app.use((_request, _response, next) => {
  next(new ApiError(404, "NOT_FOUND", "Route not found."));
});

app.use(errorHandler);

export default app;