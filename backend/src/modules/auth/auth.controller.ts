import type { Request, Response } from "express";
import { ApiError } from "../../common/errors/app.error.js";
import { registerUser } from "./auth.service.js";
import { registerSchema } from "./auth.validation.js";

export async function registerController(request: Request, response: Response) {
  const parsed = registerSchema.safeParse(request.body);

  if (!parsed.success) {
    throw new ApiError(400, "VALIDATION_ERROR", "Email, password, and username are invalid.");
  }

  const user = await registerUser(parsed.data);

  response.status(201).json({ user });
}
