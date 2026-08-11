import type { ErrorRequestHandler } from "express";
import { ApiError } from "../common/errors/app.error.js";

interface HttpErrorLike {
  type?: string;
  status?: number;
  expose?: boolean;
  message?: string;
}

function toHttpErrorLike(error: unknown): HttpErrorLike {
  if (typeof error === "object" && error !== null) {
    return error as HttpErrorLike;
  }
  return {};
}

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  if (error instanceof ApiError) {
    response.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
      },
    });
    return;
  }

  const httpError = toHttpErrorLike(error);

  if (httpError.type === "entity.parse.failed") {
    response.status(400).json({
      error: {
        code: "INVALID_JSON",
        message: "Request body must be valid JSON.",
      },
    });
    return;
  }

  if (httpError.type === "entity.too.large") {
    response.status(413).json({
      error: {
        code: "PAYLOAD_TOO_LARGE",
        message: "Request body is too large.",
      },
    });
    return;
  }

  if (typeof httpError.status === "number" && httpError.expose === true) {
    response.status(httpError.status).json({
      error: {
        code: "BAD_REQUEST",
        message: httpError.message ?? "Bad request.",
      },
    });
    return;
  }

  console.error(error);

  response.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: "An unexpected error occurred.",
    },
  });
};
