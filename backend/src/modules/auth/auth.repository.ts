import { ApiError } from "../../common/errors/app.error.js";
import { prisma } from "../../database/prisma.js";
import { PlanType, Prisma, SubscriptionStatus } from "../../generated/prisma/client.js";

export interface CreateUserData {
  email: string;
  passwordHash: string;
  username?: string;
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
