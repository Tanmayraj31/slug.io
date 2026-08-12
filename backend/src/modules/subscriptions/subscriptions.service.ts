import { ApiError } from "../../common/errors/app.error.js";
import { PlanType } from "../../generated/prisma/client.js";
import { findActiveSubscriptionForUser, findPlanByType } from "./subscriptions.repository.js";
import type { ResolvedPlan } from "./subscriptions.types.js";

export async function resolveActivePlan(userId: number): Promise<ResolvedPlan> {
  const subscription = await findActiveSubscriptionForUser(userId);

  const plan = subscription ? subscription.plan : await findPlanByType(PlanType.FREE);

  if (!plan) {
    throw new ApiError(500, "PLAN_NOT_CONFIGURED", "No subscription plan is configured.");
  }

  return {
    type: plan.type,
    dailyLinkLimit: plan.dailyLinkLimit,
    activeLinkLimit: plan.activeLinkLimit,
    maxExpiryDays: plan.maxExpiryDays,
    allowsCustomAlias: plan.allowsCustomAlias,
    allowsDetailedAnalytics: plan.allowsDetailedAnalytics,
  };
}
