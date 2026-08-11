import { compare, hash, hashSync } from "bcryptjs";
import { ApiError } from "../../common/errors/app.error.js";
import { authConfig } from "../../config/auth.js";
import type { Prisma } from "../../generated/prisma/client.js";
import {
  createRefreshToken,
  createUserWithFreeSubscription,
  findRefreshTokenByHash,
  findUserByEmail,
  findUserById,
  revokeAllUserRefreshTokens,
  revokeRefreshToken,
  rotateRefreshToken,
} from "./auth.repository.js";
import { generateRefreshToken, hashToken, signAccessToken } from "./token.service.js";
import type { AuthUserDto } from "./auth.types.js";
import type { LoginInput, RegisterInput } from "./auth.validation.js";

const BCRYPT_COST = 12;

const DUMMY_HASH = hashSync("timing-equalization-dummy-password", BCRYPT_COST);

export interface SessionResult {
  accessToken: string;
  refreshToken: string;
  user: AuthUserDto;
}

export function toUserDto(user: Pick<Prisma.UserModel, "id" | "email" | "username" | "createdAt">): AuthUserDto {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    createdAt: user.createdAt,
  };
}

async function issueRefreshToken(userId: number): Promise<string> {
  const refreshToken = generateRefreshToken();
  const expiresAt = new Date(Date.now() + authConfig.refreshTokenTtl * 1000);

  await createRefreshToken({
    userId,
    tokenHash: hashToken(refreshToken),
    expiresAt,
  });

  return refreshToken;
}

export async function registerUser(input: RegisterInput): Promise<AuthUserDto> {
  const passwordHash = await hash(input.password, BCRYPT_COST);

  const user = await createUserWithFreeSubscription({
    email: input.email,
    passwordHash,
    ...(input.username !== undefined ? { username: input.username } : {}),
  });

  return toUserDto(user);
}

export async function loginUser(input: LoginInput): Promise<SessionResult> {
  const user = await findUserByEmail(input.email);

  const passwordMatches = await compare(
    input.password,
    user ? user.passwordHash : DUMMY_HASH
  );

  if (!user || !passwordMatches) {
    throw new ApiError(401, "INVALID_CREDENTIALS", "Email or password is incorrect.");
  }

  return {
    accessToken: signAccessToken(user.id),
    refreshToken: await issueRefreshToken(user.id),
    user: toUserDto(user),
  };
}

export async function refreshSession(refreshTokenRaw: string): Promise<SessionResult> {
  const record = await findRefreshTokenByHash(hashToken(refreshTokenRaw));

  if (!record) {
    throw new ApiError(401, "INVALID_REFRESH_TOKEN", "The refresh token is invalid.");
  }

  if (record.revokedAt !== null) {
    await revokeAllUserRefreshTokens(record.userId);
    throw new ApiError(401, "INVALID_REFRESH_TOKEN", "The refresh token is invalid.");
  }

  if (record.expiresAt <= new Date()) {
    throw new ApiError(401, "INVALID_REFRESH_TOKEN", "The refresh token is expired.");
  }

  const newRefreshToken = generateRefreshToken();

  await rotateRefreshToken(record.id, {
    userId: record.userId,
    tokenHash: hashToken(newRefreshToken),
    expiresAt: new Date(Date.now() + authConfig.refreshTokenTtl * 1000),
  });

  const user = await findUserById(record.userId);

  if (!user) {
    throw new ApiError(401, "INVALID_REFRESH_TOKEN", "The refresh token is invalid.");
  }

  return {
    accessToken: signAccessToken(record.userId),
    refreshToken: newRefreshToken,
    user: toUserDto(user),
  };
}

export async function logoutSession(refreshTokenRaw: string): Promise<void> {
  const record = await findRefreshTokenByHash(hashToken(refreshTokenRaw));

  if (!record) {
    throw new ApiError(401, "INVALID_REFRESH_TOKEN", "The refresh token is invalid.");
  }

  if (record.revokedAt === null) {
    await revokeRefreshToken(record.id);
  }
}
