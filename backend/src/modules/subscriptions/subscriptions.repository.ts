import { prisma } from "../../database/prisma.js";
import { PlanType, SubscriptionStatus } from "../../generated/prisma/client.js";

export async function findActiveSubscriptionForUser(userId: number) {
  const now = new Date();

  return prisma.subscription.findFirst({
    where: {
      userId,
      status: SubscriptionStatus.ACTIVE,
      startsAt: { lte: now },
      OR: [{ endsAt: null }, { endsAt: { gt: now } }],
    },
    orderBy: { createdAt: "desc" },
    include: { plan: true },
  });
}

export async function findPlanByType(type: PlanType) {
  return prisma.plan.findUnique({ where: { type } });
}
