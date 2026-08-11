import { hash } from "bcryptjs";
import { createUserWithFreeSubscription } from "./auth.repository.js";
import type { AuthUserDto } from "./auth.types.js";
import type { RegisterInput } from "./auth.validation.js";

const BCRYPT_COST = 12;

export async function registerUser(input: RegisterInput): Promise<AuthUserDto> {
  const passwordHash = await hash(input.password, BCRYPT_COST);

  const user = await createUserWithFreeSubscription({
    email: input.email,
    passwordHash,
    ...(input.username !== undefined ? { username: input.username } : {}),
  });

  return {
    id: user.id,
    email: user.email,
    username: user.username,
    createdAt: user.createdAt,
  };
}
