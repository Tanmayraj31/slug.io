import { ApiError } from "../../common/errors/app.error.js";
import { prisma } from "../../database/prisma.js";
import { PlanType, Prisma, SubscriptionStatus } from "../../generated/prisma/client.js";

export interface CreateUserData {
  email: string;
  passwordHash: string;
  username?: string;
}

export async function findUserByEmail(email: string): Promise<Prisma.UserModel | null> {
  return prisma.user.findUnique({ where: { email } });
}

export async function findUserById(id: number): Promise<Prisma.UserModel | null> {
  return prisma.user.findUnique({ where: { id } });
}

export interface CreateRefreshTokenData {
  userId: number;
  tokenHash: string;
  expiresAt: Date;
}

export async function createRefreshToken(
  data: CreateRefreshTokenData
): Promise<Prisma.RefreshTokenModel> {
  return prisma.refreshToken.create({
    data: {
      userId: data.userId,
      tokenHash: data.tokenHash,
      expiresAt: data.expiresAt,
    },
  });
}

export async function findRefreshTokenByHash(
  tokenHash: string
): Promise<Prisma.RefreshTokenModel | null> {
  return prisma.refreshToken.findUnique({ where: { tokenHash } });
}

export async function revokeRefreshToken(id: number): Promise<void> {
  await prisma.refreshToken.update({
    where: { id },
    data: { revokedAt: new Date() },
  });
}

export async function revokeAllUserRefreshTokens(userId: number): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function rotateRefreshToken(
  oldTokenId: number,
  newToken: CreateRefreshTokenData
): Promise<void> {
  await prisma.$transaction([
    prisma.refreshToken.update({
      where: { id: oldTokenId },
      data: { revokedAt: new Date() },
    }),
    prisma.refreshToken.create({
      data: {
        userId: newToken.userId,
        tokenHash: newToken.tokenHash,
        expiresAt: newToken.expiresAt,
      },
    }),
  ]);
}

export async function createUserWithFreeSubscription(
  data: CreateUserData
): Promise<Prisma.UserModel> {
  try {
    return await prisma.$transaction(async (tx) => {
      const freePlan = await tx.plan.findUnique({ where: { type: PlanType.FREE } });

      if (!freePlan) {
        throw new ApiError(500, "PLAN_NOT_CONFIGURED", "The FREE plan is not configured.");
      }

      const user = await tx.user.create({
        data: {
          email: data.email,
          passwordHash: data.passwordHash,
          ...(data.username !== undefined ? { username: data.username } : {}),
        },
      });

      await tx.subscription.create({
        data: {
          userId: user.id,
          planId: freePlan.id,
          status: SubscriptionStatus.ACTIVE,
          startsAt: new Date(),
        },
      });

      return user;
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new ApiError(409, "EMAIL_TAKEN", "An account with this email already exists.");
    }
    throw error;
  }
}
