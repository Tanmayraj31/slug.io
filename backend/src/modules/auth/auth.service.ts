import { compare, hash } from "bcryptjs";
import { ApiError } from "../../common/errors/app.error.js";
import { createUserWithFreeSubscription, findUserByEmail } from "./auth.repository.js";
import { signAccessToken } from "./token.service.js";
import type { AuthUserDto } from "./auth.types.js";
import type { LoginInput, RegisterInput } from "./auth.validation.js";

const BCRYPT_COST = 12;

export interface LoginResult {
  accessToken: string;
  user: AuthUserDto;
}

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

export async function loginUser(input: LoginInput): Promise<LoginResult> {
  const user = await findUserByEmail(input.email);

  if (!user) {
    throw new ApiError(401, "INVALID_CREDENTIALS", "Email or password is incorrect.");
  }

  const passwordMatches = await compare(input.password, user.passwordHash);

  if (!passwordMatches) {
    throw new ApiError(401, "INVALID_CREDENTIALS", "Email or password is incorrect.");
  }

  return {
    accessToken: signAccessToken(user.id),
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      createdAt: user.createdAt,
    },
  };
}
