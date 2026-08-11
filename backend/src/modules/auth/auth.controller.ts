import type { Request, Response } from "express";
import { ApiError } from "../../common/errors/app.error.js";
import { loginUser, registerUser } from "./auth.service.js";
import { loginSchema, registerSchema } from "./auth.validation.js";

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

  response.status(200).json(result);
}
